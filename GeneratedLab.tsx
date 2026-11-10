import {useState} from 'react';
import {apparatusIcon,LabIcon,operationIcons} from './LabIcon';
export type GeneratedStep={source:string;instruction:string;operation:string;tool:string;observation:string;visual:string;setting?:{value:number;unit:string}};
export type Generated={experiment:'generated';title:string;handout:string;steps:GeneratedStep[]};
export type LabExample={id:string;title:string;handout:string};
type Api=<T>(path:string,body?:object)=>Promise<T>;
type Session={id:string;title:string;handout:string;tools:string[];operations:string[];total:number;instruction:string;unit?:string};
type Result={observation:string;visual:string;note:string};

export function GeneratedLab({api,preview,title}:{api:Api;preview?:Generated;title?:string}){
  const [session,setSession]=useState<Session>();
  const [instruction,setInstruction]=useState<string|null>(null);
  const [results,setResults]=useState<Result[]>([]);
  const [tool,setTool]=useState('');
  const [operation,setOperation]=useState('');
  const [note,setNote]=useState('');
  const [unit,setUnit]=useState<string>();
  const [setting,setSetting]=useState('');
  const [studentName,setStudentName]=useState('');
  const [studentId,setStudentId]=useState('');
  const [submitted,setSubmitted]=useState<{studentName:string;studentId:string;submittedAt:string}>();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function work(task:()=>Promise<void>){
    setBusy(true);setError('');
    try{await task();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  const result=results.at(-1);
  return <section className="panel notebook generated-lab">
    <p className="kicker">{preview?'UNPUBLISHED PREVIEW':'STUDENT PRACTICAL'}</p>
    <h1>{session?.title??preview?.title??title??'Generated practical'}</h1>
    {!session?<><p>Pick your apparatus, run the experiment, and log your observations.</p>
      <div className="fields">
        <label className="field">Student Name<input maxLength={120} placeholder="e.g. Jane Doe" value={studentName} onChange={e=>setStudentName(e.target.value)}/></label>
        <label className="field">Student ID<input maxLength={80} placeholder="e.g. S1234567" value={studentId} onChange={e=>setStudentId(e.target.value)}/></label>
      </div>
      <button className="primary" disabled={busy} onClick={()=>work(async()=>{
        if(!studentName.trim()||!studentId.trim())throw Error('Enter your student name and student ID before starting.');
        const next=await api<Session>('generated-start',{preview,studentName:studentName.trim(),studentId:studentId.trim()});setSession(next);setInstruction(next.instruction);setUnit(next.unit);
      })}><LabIcon name="play" size={16}/> Start practical</button></>:<>
      <details className="lab-disclosure"><summary><LabIcon name="notebook" size={17}/> Handout</summary><p className="handout-copy">{session.handout}</p></details>
      <div className="generated-grid">
        <div className="generated-bench" aria-label="Apparatus visualisation">
          <div className="bench-badge"><LabIcon name={tool?apparatusIcon(tool):'flask'} size={20}/> {tool||'Work surface'}</div>
          {(!result||result.visual==='neutral')&&tool?<div className="apparatus-preview" key={tool}><LabIcon name={apparatusIcon(tool)} size={96}/></div>:<div className="lab-vessel" key={results.length} data-visual={result?.visual??'neutral'}>
            <div className="lab-liquid"/><div className="lab-grains">{Array.from({length:9},(_,i)=><i key={i}/>)}</div>
            <div className="lab-specimens"><i>A</i><i>B</i></div>
          </div>}
          {result&&<p className="bench-observation" role="status"><LabIcon name="eye" size={18}/>{result.observation}</p>}
        </div>
        {instruction?<form onSubmit={e=>{e.preventDefault();void work(async()=>{
          const data=await api<{result:Result;instruction:string|null;unit?:string}>('generated-action',{id:session.id,index:results.length,tool,operation,note,setting:unit&&setting.trim()?Number(setting):undefined});
          setResults([...results,data.result]);setInstruction(data.instruction);setTool('');setOperation('');setNote('');setUnit(data.unit);setSetting('');
        });}}>
          <div className="lab-progress"><progress value={results.length} max={session.total} aria-label="Practical progress"/><span>{results.length+1} / {session.total}</span></div>
          <h2>{instruction}</h2>
          <fieldset><legend>Apparatus</legend><div className="lab-picker">
            {session.tools.map(item=><button key={item} type="button" disabled={busy} aria-pressed={tool===item} onClick={()=>setTool(item)}><LabIcon name={apparatusIcon(item)}/><span>{item}</span></button>)}
          </div></fieldset>
          <fieldset><legend>Action</legend><div className="lab-picker lab-actions">
            {session.operations.map(item=><button key={item} type="button" disabled={busy} aria-pressed={operation===item} onClick={()=>setOperation(item)}>
              <LabIcon name={operationIcons[item]} size={19}/><span>{item}</span>
            </button>)}
          </div></fieldset>
          {unit&&<label className="field">Setting ({unit})<input required type="number" step="any" value={setting} onChange={e=>setSetting(e.target.value)}/></label>}
          {operation==='Record'?<label className="field">Notebook entry<textarea rows={3} maxLength={1000} value={note} onChange={e=>setNote(e.target.value)}/></label>:
            <details className="lab-disclosure"><summary><LabIcon name="notebook" size={16}/> Add a note</summary><label className="field">Notebook entry<textarea rows={2} maxLength={1000} value={note} onChange={e=>setNote(e.target.value)}/></label></details>}
          <button className="primary" disabled={busy||!tool||!operation}><LabIcon name={operation==='Wait'?'timer':'play'} size={17}/>{operation==='Wait'?'Advance time':'Run action'}</button>
        </form>:<div role="status"><h2>Practical complete</h2><p>Review your observations and notebook entries below.</p>
          {submitted?<div className="report"><p className="submission-banner"><strong>Submitted by {submitted.studentName} ({submitted.studentId})</strong></p></div>:
          <button className="primary" disabled={busy} onClick={()=>work(async()=>{
            const res=await api<{submitted:boolean;studentName:string;studentId:string;submittedAt:string}>('generated-submit',{id:session.id,studentName,studentId});
            setSubmitted(res);
          })}><LabIcon name="check" size={17}/> Submit completed notebook</button>}
        </div>}
      </div>
      <details className="lab-disclosure" open={!instruction}><summary><LabIcon name="notebook" size={18}/> Notebook · {results.length}</summary>
      <ol>{results.map((row,index)=><li key={index}><p>{row.observation}{row.note&&<><br/><strong>Your entry</strong> · {row.note}</>}</p></li>)}</ol></details>
    </>}
    {error&&<p className="error" role="alert">{error}</p>}
  </section>;
}
