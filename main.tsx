import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Bench} from './Bench';
import './style.css';

type Config={volume:number;base:number;low:number;high:number;tolerance:number;hints:string;steps:{source:string;action:string;warning:string}[]};
type PublicConfig=Pick<Config,'volume'|'base'|'tolerance'|'hints'>&{steps:{action:string;instruction:string}[]};
type Attempt={config:PublicConfig;kind:string;index:number;stage:string;reading:number;meniscus:number;volume:number;observation:string;pink:number;plume:boolean;held:boolean;readyToObserve:boolean;notes:{index:number;initial:number|null;final:number|null;titre:number|null;outcome?:string}[];report?:{group:number[];expected:number;entered:number;unit:string;agrees:boolean;trials:{index:number;actual:number;outcome:string;readingError:boolean}[]}};
const labels:Record<string,string>={prepare:'Prepare burette',transfer:'Transfer acid',indicator:'Add indicator',initial:'Read initial level',titrate:'Titrate and swirl',final:'Read final level',done:'Review trial'};
const steps=Object.keys(labels).slice(0,6);
async function api<T>(path:string,body?:object):Promise<T>{
  const res=await fetch('/api/'+path,body===undefined?undefined:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await res.json();
  if(!res.ok)throw Error(data.error);
  return data;
}
const fmt=(n:number|null)=>n===null?'—':n.toFixed(2);
const name=(i:number)=>i===0?'Rough run':'Repeat '+i;
function App(){
  const route=location.pathname;
  const [status,setStatus]=useState({published:false,mode:'Checking…'});
  const [error,setError]=useState('');
  useEffect(()=>{api<typeof status>('practical').then(setStatus).catch(e=>setError(e.message));},[]);
  return <><header><a className="brand" href="/"><span>⌬</span> LabCoat<span className="brand-period">.</span></a><nav aria-label="Workspace"><a aria-current={route==='/student'?'page':undefined} href="/student">Student bench</a><a aria-current={route==='/lecturer'?'page':undefined} href="/lecturer">Lecturer studio</a></nav><span className="mode"><i/> {status.mode}</span></header>
    <main>{error&&<p role="alert" className="error">{error}</p>}
    {route==='/lecturer'?<Lecturer publish={()=>setStatus({...status,published:true})} mode={status.mode}/>:route==='/student'?<Student published={status.published}/>:<Home published={status.published}/>}</main>
    <footer><span>LABCOAT / CHEMISTRY PRACTICALS</span><span>01 / ACID–BASE TITRATION</span></footer></>;
}
function Home({published}:{published:boolean}){
  return <><section className="hero"><div className="hero-copy"><p className="kicker">VIRTUAL CHEMISTRY LABORATORY / 01</p><h1>Acid–base<br/>titration<span>.</span></h1><p>Rehearse the bench technique, read the meniscus and determine the concentration of an unknown hydrochloric acid sample.</p><div className="row"><a className="button primary" href={published?'/student':'/lecturer'}>{published?'Enter the student bench':'Set up the practical'} →</a><a className="button" href={published?'/lecturer':'/student'}>{published?'Lecturer studio':'Student bench'}</a></div></div><div className="hero-bench"><Bench reading={.73} volume={25} pink={.18} plume={false} camera="Bench" motion="" filled act={()=>{}}/><span className="bench-tag">FIG. 01 / TEACHING BENCH</span></div></section><div className="home-meta"><div><small>ANALYTE</small><strong>Unknown HCl</strong></div><div><small>TITRANT</small><strong>Standardised NaOH</strong></div><div><small>INDICATOR</small><strong>Phenolphthalein</strong></div></div></>;
}
function Lecturer({publish,mode}:{publish:()=>void;mode:string}){
  const [handout,setHandout]=useState('');
  const [catalogue,setCatalogue]=useState<Record<string,string[]>>({});
  const [config,setConfig]=useState<Config>();
  const [busy,setBusy]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [preview,setPreview]=useState<Config>();
  async function work(task:()=>Promise<void>){
    setBusy(true);setNotice('');setError('');
    try{await task();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  useEffect(()=>{api<{config?:Config;catalogue:Record<string,string[]>}>('approved',{}).then(data=>{setCatalogue(data.catalogue);if(data.config){setConfig(data.config);setHandout(data.config.steps.map(s=>s.source).join('\n'));}}).catch(e=>setError(e.message));},[]);
  const draft=()=>work(async()=>{setConfig((await api<{config:Config}>('draft',{handout})).config);setDirty(false);});
  return <><div className="page-intro"><p className="kicker">PRACTICAL AUTHORING / 01</p><h1>Lecturer studio</h1><p>Map your procedure to the teaching bench, review its settings and publish it for students.</p></div>
  {preview?<><button onClick={()=>setPreview(undefined)}>← Back to authoring</button><Student published preview={preview}/></>:<div className="author-grid"><section className="panel"><p className="kicker">01 / SOURCE</p><h2>Procedure handout</h2><p>Paste one instruction per line, or load the editable demonstration procedure.</p>
    <button disabled={busy} onClick={()=>work(async()=>{const sample=await api<{handout:string}>('sample',{});setHandout(sample.handout);setConfig((await api<{config:Config}>('draft',sample)).config);setDirty(false);})}>Load demonstration procedure</button>
    <label className="field">Handout text<textarea rows={13} value={handout} onChange={e=>{setHandout(e.target.value);setDirty(true);}} placeholder="Paste your practical instructions here…"/></label>
    <button className="primary" disabled={busy||!handout.trim()} onClick={draft}>Draft mappings</button> <small>{mode}</small>
    </section><section className="panel"><p className="kicker">02 / REVIEW</p><h2>Bench mappings</h2>
    {!config?<p>Draft a procedure to review its equipment and actions.</p>:<><p>Review the source beside each bench action. Selecting an action confirms that you have resolved the warning.</p>
    <ol className="mapping">{config.steps.map((s,i)=><li key={i}><div>{s.source}{s.warning&&<small className="warning">{s.warning}</small>}</div><select aria-label={'Action for instruction '+(i+1)} value={s.action} onChange={e=>{const action=e.target.value;setConfig({...config,steps:config.steps.map((x,j)=>i===j?{...x,action,warning:action?'':'Select a supported action.'}:x)});}}><option value="">Unresolved</option>{steps.map(key=><option key={key} value={key}>{labels[key]}</option>)}</select>{s.action&&<small>{catalogue[s.action]?.join(' · ')}</small>}{s.warning&&s.action&&<button onClick={()=>setConfig({...config,steps:config.steps.map((x,j)=>i===j?{...x,warning:''}:x)})}>Confirm mapping</button>}</li>)}</ol>
    <h2>Practical settings</h2><div className="fields">
    <label className="field">Aliquot (mL)<select value={config.volume} onChange={e=>setConfig({...config,volume:+e.target.value})}>{[5,10,20,25].map(v=><option key={v}>{v}</option>)}</select></label>
    {([['base','NaOH (mol/L)'],['low','Hidden HCl min (mol/L)'],['high','Hidden HCl max (mol/L)'],['tolerance','Concordance (mL)']] as const).map(([key,label])=><label className="field" key={key}>{label}<input type="number" step="any" value={config[key]} onChange={e=>setConfig({...config,[key]:+e.target.value})}/></label>)}
    <label className="field">Hint policy<select value={config.hints} onChange={e=>setConfig({...config,hints:e.target.value})}><option value="both">Both modes</option><option value="practice">Practice only</option><option value="off">Disabled</option></select></label></div>
    {dirty&&<p className="warning">Draft mappings again after editing the handout.</p>}
    <div className="row"><button disabled={busy||dirty} onClick={()=>setPreview(config)}>Student preview</button><button className="primary" disabled={busy||dirty||config.steps.some(s=>s.warning||!s.action)} onClick={()=>work(async()=>{await api('publish',config);publish();setNotice('Practical published.');})}>Publish practical</button></div></>}
    {error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status">{notice} <a href="/student">Open student bench →</a></p>}</section></div>}</>;
}
function Student({published,preview}:{published:boolean;preview?:Config}){
  const [attempt,setAttempt]=useState<Attempt>();
  const [id,setId]=useState('');
  const [kind,setKind]=useState('practice');
  const [reading,setReading]=useState('');
  const [camera,setCamera]=useState('Bench');
  const [motion,setMotion]=useState('');
  const [flow,setFlow]=useState('stream');
  const [error,setError]=useState('');
  const [hint,setHint]=useState('');
  const [question,setQuestion]=useState('What should I do next?');
  const [result,setResult]=useState('');
  const [unit,setUnit]=useState('mol/L');
  const [busy,setBusy]=useState(false);
  async function work(task:()=>Promise<void>){
    if(busy)return;
    setBusy(true);setError('');
    try{await task();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  const start=()=>work(async()=>{const data=await api<Attempt&{id:string}>('start',{kind,preview});setId(data.id);setAttempt(data);});
  if(!attempt)return <div className="start panel"><p className="kicker">{preview?'UNPUBLISHED PREVIEW':'STUDENT BENCH / 01'}</p><h1>Acid–base titration</h1><p>Determine the concentration of an unknown hydrochloric acid sample using standardised sodium hydroxide.</p>{published?<><label className="field">Attempt mode<select value={kind} onChange={e=>setKind(e.target.value)}><option value="practice">Practice</option><option value="mock">Mock assessment</option></select></label><button className="primary" disabled={busy} onClick={start}>Start attempt →</button></>:<p>Waiting for a published practical. <a href="/lecturer">Open lecturer studio</a></p>}{error&&<p className="error" role="alert">{error}</p>}</div>;
  const a=attempt, stage=a.stage;
  const act=(action:string,value?:string)=>work(async()=>{
    const next=await api<Attempt>('action',{id,action,value});setAttempt(next);setMotion(action+performance.now());setHint('');
    if(['initial','final','repeat'].includes(action))setReading('');
    if(next.stage==='initial'||next.stage==='final')setCamera('Eye level');
    if(action==='initial')setCamera('Flask');
    if(action==='repeat'){setCamera('Bench');setFlow('drop');}
  });
  const pointer=(target:string)=>{
    if(a.report)return;
    if(target==='tap'&&stage==='titrate')void act('add',flow);
    if(target==='flask'&&stage==='titrate')void act('swirl');
    if(target==='burette'&&stage==='prepare')void act('prepare');
    else if(target==='burette')setCamera('Eye level');
    if(target==='pipette'&&stage==='transfer')void act('transfer');
    if(target==='indicator'&&stage==='indicator')void act('indicator');
  };
  const instruction=a.config.steps.find(s=>s.action===stage)?.instruction;
  return <><div className="page-intro compact"><p className="kicker">{preview?'UNPUBLISHED PREVIEW':'PRACTICAL / 01'} · {a.kind==='mock'?'MOCK ASSESSMENT':'PRACTICE'}</p><h1>Acid–base titration</h1><p>{a.config.volume.toFixed(2)} mL unknown HCl · {a.config.base.toFixed(4)} mol/L NaOH · Phenolphthalein</p></div>
  <div className="lab-grid"><section className="panel scene"><div className="scene-head"><div><p className="kicker">LIVE SIMULATION</p><h2>Teaching bench</h2></div><div className="camera" aria-label="Camera angle">{['Bench','Eye level','Flask'].map(v=><button key={v} aria-pressed={camera===v} onClick={()=>setCamera(v)}>{v}</button>)}</div></div>
  <Bench reading={a.meniscus} volume={a.volume} pink={a.pink} plume={a.plume} camera={camera} motion={motion} act={pointer} filled={stage!=='prepare'}/>
  <div className="scene-foot"><span><i/> {name(a.index)}</span><span>{a.plume?'Local pink · swirl to mix':a.volume?'Flask · '+a.observation:'Flask ready'}</span></div></section>
  <section className="panel controls"><p className="kicker">PROCEDURE / {name(a.index).toUpperCase()}</p>
  <ol className="progress">{steps.map((s,i)=><li key={s} className={s===stage?'active':''} aria-current={s===stage?'step':undefined}><span>{steps.indexOf(stage)>i||stage==='done'?'✓':i+1}</span>{labels[s]}</li>)}</ol>
  {!a.report&&<div className="current"><h2>{labels[stage]}</h2><p>{instruction||'Use repeat titres for your concentration calculation.'}</p>
  {['prepare','transfer','indicator'].includes(stage)&&<button className="primary" disabled={busy} onClick={()=>act(stage)}>{labels[stage]}</button>}
  {['initial','final'].includes(stage)&&<form className="row" onSubmit={e=>{e.preventDefault();void act(stage,reading);}}><label className="field">Reading (mL)<input required inputMode="decimal" placeholder="0.00" value={reading} onChange={e=>setReading(e.target.value)}/></label><button disabled={busy} className="primary">Record reading</button></form>}
  {stage==='titrate'&&<><label className="field">Stopcock setting<select value={flow} onChange={e=>setFlow(e.target.value)}><option value="stream">Stream (1.00 mL)</option><option value="drop">Single drop (0.03 mL)</option><option value="partial">Feather stopcock (fraction of a drop)</option></select></label><div className="row"><button disabled={busy} className="primary" onClick={()=>act('add',flow)}>Open stopcock</button><button disabled={busy} onClick={()=>act('swirl')}>Swirl flask</button><button disabled={busy||!a.readyToObserve} onClick={()=>act('observe')}>Observe 30 s (simulated)</button>{a.held&&<button disabled={busy} onClick={()=>act('finish')}>Take final reading →</button>}</div>{a.held&&<p role="status">After 30 simulated seconds · {a.observation}</p>}</>}
  {(stage==='done'||(stage==='titrate'&&a.kind==='practice'&&a.held&&a.observation==='deep pink'))&&<button disabled={busy} onClick={()=>act('repeat')}>{stage==='done'?'Start repeat trial':'Discard and retry'}</button>}
  </div>}
  {error&&<p className="error" role="alert">{error}</p>}
  {!a.report&&a.config.hints!=='off'&&(a.config.hints==='both'||a.kind==='practice')&&<div className="hint"><label className="field">Question for the demonstrator<input value={question} maxLength={500} onChange={e=>setQuestion(e.target.value)}/></label><button disabled={busy} onClick={()=>work(async()=>{const h=await api<{reply:string;mode:string}>('hint',{id,question});setHint(h.mode+' · '+h.reply);})}>Ask the demonstrator</button>{hint&&<p role="status">{hint}</p>}</div>}
  </section></div>
  <section className="panel notebook"><p className="kicker">EXPERIMENT RECORD</p><h2>Lab notebook</h2><div className="table-wrap"><table><thead><tr><th>Trial</th><th>Initial (mL)</th><th>Final (mL)</th><th>Titre (mL)</th>{a.kind==='practice'&&<th>Observation</th>}</tr></thead><tbody>{a.notes.map(n=><tr key={n.index}><th>{name(n.index)}</th><td>{fmt(n.initial)}</td><td>{fmt(n.final)}</td><td>{fmt(n.titre)}</td>{a.kind==='practice'&&<td>{n.outcome||'—'}</td>}</tr>)}</tbody></table></div>
  <p>Use at least two repeat titres within {a.config.tolerance.toFixed(2)} mL of one another. Calculate the HCl concentration from the mean titre and the 1:1 reaction.</p>
  {a.report?<div className="report" role="status"><h3>Submission feedback</h3><p>{a.report.agrees?'Your result agrees with your recorded titres.':'Check the calculation from your recorded titres.'} Your value: {a.report.entered} {a.report.unit}. Calculated value: {a.report.expected.toPrecision(5)} {a.report.unit} from {a.report.group.map(fmt).join(', ')} mL.</p><ul>{a.report.trials.map(t=><li key={t.index}>{name(t.index)} · {t.outcome} · actual delivery {fmt(t.actual)} mL{t.readingError?' · review your meniscus readings':''}</li>)}</ul></div>:
  <form className="row" onSubmit={e=>{e.preventDefault();void work(async()=>setAttempt(await api<Attempt>('submit',{id,result,unit})));}}><label className="field">Calculated HCl concentration<input required type="number" step="any" min="0" value={result} onChange={e=>setResult(e.target.value)}/></label><label className="field">Units<select value={unit} onChange={e=>setUnit(e.target.value)}><option>mol/L</option><option>mmol/L</option></select></label><button className="primary" disabled={busy||stage!=='done'||a.notes.filter(n=>n.index>0&&n.final!==null).length<2}>Submit concentration</button></form>}
  </section></>;
}
createRoot(document.getElementById('root')!).render(<App/>);


