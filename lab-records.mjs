import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';

export const titration = 'hcl-naoh';
const starter = [
  {id:'demo-hcl',name:'Hydrochloric acid',formula:'HCl',cas:'7647-01-0'},
  {id:'demo-naoh',name:'Sodium hydroxide',formula:'NaOH',cas:'1310-73-2'},
  {id:'demo-indicator',name:'Phenolphthalein',formula:'C20H14O4',cas:'77-09-8'}
];
const supported = new Set(starter.map(row=>row.id));
const normalize = value => value.normalize('NFKC').toLowerCase();
const boundedText = (value, max, label) => {
  if (value===undefined) return '';
  if (typeof value!=='string' || value.length>max) throw Error('Invalid '+label+'.');
  return value.trim();
};
function chemical(input) {
  if (!input || typeof input!=='object') throw Error('Each chemical must be a record.');
  const id=boundedText(input.id,100,'inventory ID');
  const name=boundedText(input.name,200,'chemical name');
  const formula=boundedText(input.formula,100,'formula');
  const cas=boundedText(input.cas,32,'CAS number');
  const sds=boundedText(input.sds,1500,'SDS link');
  const aliases=boundedText(input.aliases,1000,'aliases');
  if (!id||!name) throw Error('Every chemical needs an inventory ID and name.');
  if (cas&&!/^\d{2,7}-\d{2}-\d$/.test(cas)) throw Error('Check the CAS number for '+name+'.');
  if (sds && !/^https:\/\/[^\s]+$/i.test(sds)) throw Error('Use an HTTPS SDS link for '+name+'.');
  return {id,name,formula,cas,sds,aliases};
}
function isSupported(row) {
  return supported.has(row.id) || starter.some(item=>item.cas===row.cas || normalize(item.name)===normalize(row.name));
}
const tokens = value => normalize(value).match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu)?.join(' ') ?? '';
export function openLabRecords(path) {
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS chemicals (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, formula TEXT NOT NULL, cas TEXT NOT NULL,
      sds TEXT NOT NULL, aliases TEXT NOT NULL, searchable TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY, attempt TEXT NOT NULL, trial INTEGER NOT NULL, run INTEGER NOT NULL,
      mode TEXT NOT NULL, code TEXT NOT NULL, evidence TEXT NOT NULL, created TEXT NOT NULL,
      reviewed INTEGER NOT NULL DEFAULT 0, UNIQUE(attempt, trial, run, code)
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      student_name TEXT NOT NULL,
      student_id TEXT NOT NULL,
      experiment_type TEXT NOT NULL,
      experiment_title TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      result_entered REAL,
      result_expected REAL,
      unit TEXT,
      agrees INTEGER NOT NULL,
      trials_count INTEGER NOT NULL,
      details_json TEXT NOT NULL
    );
  `);
  const insert=db.prepare('INSERT OR REPLACE INTO chemicals VALUES (?, ?, ?, ?, ?, ?, ?)');
  const add=row=>insert.run(row.id,row.name,row.formula,row.cas,row.sds,row.aliases,
    normalize([row.id,row.name,row.formula,row.cas,row.aliases].join(' ')));
  for (const item of starter) add(chemical(item));
  return {
    close:()=>db.close(),
    import(input) {
      if (!Array.isArray(input)||!input.length||input.length>2000) throw Error('Provide a JSON array of 1 to 2,000 inventory records per batch.');
      const rows=input.map(chemical);
      if (rows.some(row=>supported.has(row.id))||new Set(rows.map(row=>row.id)).size!==rows.length)
        throw Error('Use distinct institutional IDs. IDs beginning with the bundled demo identifiers are reserved.');
      db.exec('BEGIN');
      try {for (const row of rows) add(row);db.exec('COMMIT');}
      catch (error) {db.exec('ROLLBACK');throw error;}
      return rows.length;
    },
    search(query='') {
      const q=normalize(boundedText(query,200,'search'));
      return {total:db.prepare('SELECT count(*) AS count FROM chemicals').get().count,
        rows:db.prepare('SELECT id,name,formula,cas,sds,aliases FROM chemicals WHERE instr(searchable, ?) > 0 ORDER BY name,id LIMIT 100').all(q)
          .map(row=>({...row,simulated:isSupported(row)}))};
    },
    inspect(text) {
      const source=' '+tokens(text)+' ';
      return db.prepare('SELECT id,name,formula,cas,aliases FROM chemicals ORDER BY name,id').all()
        .filter(row=>[row.name,row.formula,row.cas,...row.aliases.split('|')].some(value=>{
          const key=tokens(value);
          return key.length>=2&&source.includes(' '+key+' ');
        })).map(({id,name,cas})=>({id,name,cas,simulated:isSupported({id,name,cas})}));
    },
    alert(attempt,trial,run,mode,code,evidence) {
      db.prepare('INSERT OR IGNORE INTO incidents (id,attempt,trial,run,mode,code,evidence,created) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(randomUUID(),attempt,trial,run,mode,code,evidence,new Date().toISOString());
    },
    inbox() {
      return {unread:db.prepare('SELECT count(*) AS count FROM incidents WHERE reviewed=0').get().count,
        rows:db.prepare('SELECT id,attempt,trial,mode,code,evidence,created,reviewed FROM incidents ORDER BY reviewed,created DESC LIMIT 100').all()};
    },
    review(id) {
      if (!db.prepare('UPDATE incidents SET reviewed=1 WHERE id=?').run(id).changes) throw Error('Incident not found.');
    },
    incident(id) {
      const row=db.prepare('SELECT mode,code,evidence FROM incidents WHERE id=?').get(id);
      if (!row) throw Error('Incident not found.');
      return row;
    },
    recordSubmission({studentName,studentId,experimentType,experimentTitle,resultEntered=null,resultExpected=null,unit=null,agrees,trialsCount,details={}}) {
      const name=boundedText(studentName,120,'student name');
      const sid=boundedText(studentId,80,'student ID');
      if (!name||!sid) throw Error('Enter your student name and student ID before submitting.');
      const type=boundedText(experimentType,40,'experiment type')||'titration';
      const title=boundedText(experimentTitle,200,'experiment title')||'Acid–base titration';
      const id=randomUUID();
      const submittedAt=new Date().toISOString();
      const entered=resultEntered!==null&&resultEntered!==undefined&&Number.isFinite(Number(resultEntered))?Number(resultEntered):null;
      const expected=resultExpected!==null&&resultExpected!==undefined&&Number.isFinite(Number(resultExpected))?Number(resultExpected):null;
      const cleanUnit=unit?boundedText(unit,32,'unit'):null;
      const agreesFlag=agrees?1:0;
      const count=Number.isInteger(trialsCount)&&trialsCount>=0?trialsCount:0;
      const detailsJson=typeof details==='string'?details:JSON.stringify(details??{});
      db.prepare(`INSERT INTO submissions (
        id, student_name, student_id, experiment_type, experiment_title, submitted_at,
        result_entered, result_expected, unit, agrees, trials_count, details_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, name, sid, type, title, submittedAt, entered, expected, cleanUnit, agreesFlag, count, detailsJson
      );
      return {id,student_name:name,student_id:sid,experiment_type:type,experiment_title:title,submitted_at:submittedAt,
        result_entered:entered,result_expected:expected,unit:cleanUnit,agrees:agreesFlag,trials_count:count,details_json:detailsJson};
    },
    listSubmissions() {
      return db.prepare('SELECT * FROM submissions ORDER BY submitted_at DESC, rowid DESC LIMIT 100').all();
    }
  };
}
export function requireCapability(config,records) {
  if ((config.experiment??titration)!==titration) throw Error('This experiment needs its own simulation model before publishing.');
  const unsupported=records.inspect(config.steps.map(step=>step.source).join('\n')).filter(row=>!row.simulated);
  if (unsupported.length) throw Error('The titration model cannot simulate: '+unsupported.map(row=>row.name).join(', ')+'.');
}
