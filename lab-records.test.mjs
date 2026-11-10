import test from 'node:test';
import assert from 'node:assert/strict';
import {openLabRecords, requireCapability, titration} from './lab-records.mjs';

test('inventory import validates batches, updates by ID and distinguishes inventory from simulation', t=>{
  const records=openLabRecords(':memory:');
  t.after(()=>records.close());
  assert.equal(records.search().total,3);
  records.import([{id:'chem-42',name:'Copper sulfate',formula:'CuSO4',aliases:'copper sulphate'}]);
  assert.equal(records.search('copper sulphate').rows[0].simulated,false);
  assert.deepEqual(records.inspect('Add CuSO4 and NaOH').map(row=>[row.name,row.simulated]),
    [['Copper sulfate',false],['Sodium hydroxide',true]]);
  assert.throws(()=>records.import([{id:'another',name:'Unknown'},{id:'bad',name:'Invalid',sds:'javascript:alert(1)'}]));
  assert.equal(records.search('another').rows.length,0);
  records.import([{id:'chem-42',name:'Copper(II) sulfate',formula:'CuSO4'}]);
  assert.equal(records.search().total,4);
  assert.throws(()=>requireCapability({experiment:'other',steps:[]},records),/own simulation model/);
  assert.throws(()=>requireCapability({experiment:titration,steps:[{source:'Use CuSO4.'}]},records),/cannot simulate/);
  assert.doesNotThrow(()=>requireCapability({steps:[{source:'Use NaOH.'}]},records));
});

test('lecturer inbox deduplicates one observation per run and tracks review', t=>{
  const records=openLabRecords(':memory:');
  t.after(()=>records.close());
  const notify=run=>records.alert('anonymous-attempt',0,run,'practice','flask alignment','Dispensing blocked.');
  notify(0);notify(0);notify(1);
  const inbox=records.inbox();
  assert.equal(inbox.unread,2);
  const {id}=inbox.rows[0];
  assert.equal(records.incident(id).evidence,'Dispensing blocked.');
  records.review(id);
  assert.equal(records.inbox().unread,1);
  assert.equal(records.inbox().rows.at(-1).reviewed,1);
});

test('student submissions validate identity, record titration and generated labs, and persist across restarts', async t=>{
  const {mkdtemp, rm}=await import('node:fs/promises');
  const {tmpdir}=await import('node:os');
  const {join}=await import('node:path');
  const dir=await mkdtemp(join(tmpdir(),'labcoat-test-'));
  const dbPath=join(dir,'records.sqlite');
  t.after(()=>rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100}));

  const first=openLabRecords(dbPath);
  assert.throws(()=>first.recordSubmission({
    studentName:'',studentId:'S100',experimentType:'titration',experimentTitle:'Acid–base titration',
    resultEntered:0.1,resultExpected:0.1,unit:'mol/L',agrees:1,trialsCount:3,details:{}
  }),/student name and student ID/i);

  first.recordSubmission({
    studentName:'Alice Tan',
    studentId:'S1001',
    experimentType:'titration',
    experimentTitle:'Acid–base titration',
    resultEntered:0.0998,
    resultExpected:0.1,
    unit:'mol/L',
    agrees:1,
    trialsCount:3,
    details:{concordantTitres:[25.00,24.95]}
  });
  first.recordSubmission({
    studentName:'Bob Lim',
    studentId:'S1002',
    experimentType:'generated',
    experimentTitle:'Salt crystallisation by evaporation',
    resultEntered:null,
    resultExpected:null,
    unit:null,
    agrees:1,
    trialsCount:5,
    details:{steps:[{step:1,note:'Clear solution'}]}
  });
  first.close();

  const reopened=openLabRecords(dbPath);
  const rows=reopened.listSubmissions();
  assert.equal(rows.length,2);
  assert.equal(rows[0].student_name,'Bob Lim');
  assert.equal(rows[0].experiment_type,'generated');
  assert.equal(rows[1].student_name,'Alice Tan');
  assert.equal(rows[1].student_id,'S1001');
  assert.equal(rows[1].result_entered,0.0998);
  assert.equal(rows[1].agrees,1);
  reopened.close();
});
