import {useState} from 'react';
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
    {!session?<><p>Choose apparatus and perform the operations yourself. Record what you observe as you work through the handout.</p>
      <button className="primary" disabled={busy} onClick={()=>work(async()=>{
        const next=await api<Session>('generated-start',{preview});setSession(next);setInstruction(next.instruction);setUnit(next.unit);
      })}>Start practical →</button></>:<>
      <details><summary>Lecturer handout</summary><p className="handout-copy">{session.handout}</p></details>
      <div className="generated-grid">
        <div className="generated-bench" aria-label="Apparatus visualisation">
          <div className="lab-vessel" key={results.length} data-visual={result?.visual??'neutral'}>
            <div className="lab-liquid"/><div className="lab-grains">{Array.from({length:9},(_,i)=><i key={i}/>)}</div>
            <div className="lab-specimens"><i>A</i><i>B</i></div>
          </div>
          <p>{tool||'Select apparatus to begin'}</p>
          {result&&<p role="status">{result.observation}</p>}
        </div>
        {instruction?<form onSubmit={e=>{e.preventDefault();void work(async()=>{
          const data=await api<{result:Result;instruction:string|null;unit?:string}>('generated-action',{id:session.id,index:results.length,tool,operation,note,setting:unit&&setting.trim()?Number(setting):undefined});
          setResults([...results,data.result]);setInstruction(data.instruction);setTool('');setOperation('');setNote('');setUnit(data.unit);setSetting('');
        });}}>
          <p className="kicker">STEP {results.length+1} OF {session.total}</p>
          <h2>{instruction}</h2>
          <fieldset><legend>Choose apparatus</legend><div className="row">
            {session.tools.map(item=><button key={item} type="button" disabled={busy} aria-pressed={tool===item} onClick={()=>setTool(item)}>{item}</button>)}
          </div></fieldset>
          <label className="field">Operation<select required value={operation} onChange={e=>setOperation(e.target.value)}>
            <option value="">Select an operation</option>{session.operations.map(item=><option key={item}>{item}</option>)}
          </select></label>
          {unit&&<label className="field">Setting ({unit})<input required type="number" step="any" value={setting} onChange={e=>setSetting(e.target.value)}/></label>}
          <label className="field">Your notebook entry<textarea rows={3} maxLength={1000} value={note} onChange={e=>setNote(e.target.value)}/></label>
          <button className="primary" disabled={busy||!tool||!operation}>{operation==='Wait'?'Advance simulated time':'Perform operation'}</button>
        </form>:<div role="status"><h2>Practical complete</h2><p>Review your observations and notebook entries below.</p></div>}
      </div>
      <h2>Lab notebook</h2>
      <ol>{results.map((row,index)=><li key={index}><p>{row.observation}{row.note&&<><br/><strong>Your entry</strong> · {row.note}</>}</p></li>)}</ol>
    </>}
    {error&&<p className="error" role="alert">{error}</p>}
  </section>;
}
