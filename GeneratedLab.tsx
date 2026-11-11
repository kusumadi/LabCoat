import {useRef,useState} from 'react';
import {GeneratedBench,type TransferOutcome} from './GeneratedBench';
import {apparatusIcon,LabIcon,operationIcons} from './LabIcon';
import {PracticalProgress,ReportReceipt} from './PracticalProgress';
export type GeneratedStep={source:string;instruction:string;operation:string;tool:string;observation:string;visual:string;apparatus?:string;setting?:{value:number;unit:string;source?:string};measurementQuestion?:string;measurementAnswer?:string};
export type Generated={experiment:'generated';title:string;handout:string;steps:GeneratedStep[];materials?:string[];benchTools?:{name:string;kind:string}[];blockers?:string[];coverage?:{source:string;step:number|null}[]};
export type LabExample={id:string;title:string;handout:string};
type Api=<T>(path:string,body?:object)=>Promise<T>;
type Session={id:string;title:string;handout:string;tools:string[];materials:string[];apparatus?:Record<string,string>;operations:string[];total:number;procedure?:string[];instruction:string;unit?:string};
type Result={observation:string;visual:string;tool:string;operation:string;note:string;direct?:boolean};

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
  const [reportCode,setReportCode]=useState<string>();
  const [olderServer,setOlderServer]=useState(false);
  async function work(task:()=>Promise<void>){
    setBusy(true);setError('');
    try{await task();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  const submitting=useRef(false);
  const moving=useRef(false);
  const [transferPending,setTransferPending]=useState(false);
  const [reaction,setReaction]=useState<TransferOutcome>();
  const [viewReset,setViewReset]=useState(0);
  const [benchReset,setBenchReset]=useState(0);
  const result=results.at(-1);
  async function run(item:string,action:string,direct=false){
    if(!session||!instruction||submitting.current||moving.current)return;
    if(unit&&(!setting.trim()||!Number.isFinite(Number(setting)))){
      setError('Enter the setting ('+unit+') before completing this step.');
      return;
    }
    submitting.current=true;
    try{await work(async()=>{
      const numericSetting=unit?Number(setting):undefined;
      const data=await api<{result:Result;instruction:string|null;unit?:string;reportCode?:string}>('generated-action',{
        id:session.id,index:results.length,tool:item,operation:action,note,setting:numericSetting
      });
      setResults([...results,{...data.result,direct}]);setInstruction(data.instruction);
      setReportCode(data.reportCode);
      setTool('');setOperation('');setNote('');setUnit(data.unit);setSetting('');
    });}finally{submitting.current=false;}
  }
  return <section className="panel notebook generated-lab">
    <p className="kicker">{preview?'UNPUBLISHED PREVIEW':'STUDENT PRACTICAL'}</p>
    <h1>{session?.title??preview?.title??title??'Generated practical'}</h1>
    {!session?<><p>Pick your apparatus, run the experiment, and log your observations.</p>
      <button className="primary" disabled={busy} onClick={()=>work(async()=>{
        const next=await api<Session>('generated-start',{preview});
        setOlderServer(!Array.isArray(next.materials));
        setSession({...next,materials:Array.isArray(next.materials)?next.materials:[]});
        setInstruction(next.instruction);setUnit(next.unit);
      })}><LabIcon name="play" size={16}/> Start practical</button></>:<>
      {olderServer&&<p className="warning" role="status">The running server did not provide the bench materials. In the terminal running LabCoat, press Ctrl+C. Open the updated LabCoat folder, run npm start, then refresh this page and start a new practical.</p>}
      <details className="lab-disclosure"><summary><LabIcon name="notebook" size={17}/> Handout</summary><p className="handout-copy">{session.handout}</p></details>
      <div className="generated-grid">
        <div className="generated-bench" aria-label="Apparatus visualisation">
          <div className="bench-badge"><LabIcon name="bench" size={20}/> Work surface</div>
          <GeneratedBench tools={session.tools} materials={session.materials} apparatus={session.apparatus}
            selected={tool} result={result} viewReset={viewReset} benchReset={benchReset}
            onTransfer={async(from,to,phase)=>{
              if(moving.current||submitting.current)return {allowed:false};
              moving.current=true;setTransferPending(true);setError('');setReaction(undefined);
              try{
                const outcome=await api<TransferOutcome>('generated-transfer',{id:session.id,from,to,phase});
                if(outcome.observation)setReaction(outcome);
                return outcome;
              }catch(e){setError((e as Error).message);return {allowed:false};}
              finally{moving.current=false;setTransferPending(false);}
            }}
            onSelect={item=>{if(!busy&&instruction)setTool(item);}}
            onDrop={(item,kind)=>{
              if(busy||!instruction)return;
              const action=kind==='transfer'?(['Measure','Mix'].includes(operation)?operation:'Transfer'):operation;
              if(kind==='mat'&&(action==='Transfer'||action==='Record'))return;
              if(action)void run(item,action,kind==='transfer');
            }}/>
          <p className="bench-controls-hint">Drag equipment to arrange it. Drop a filled vessel or sample onto a vessel to transfer it. To use a selected action, drag its tool onto the mat. Drag empty space to orbit.</p>
          <div className="row bench-view-tools"><button type="button" onClick={()=>setViewReset(viewReset+1)}><LabIcon name="eye" size={16}/> Full bench</button>
            <button type="button" disabled={!instruction||busy||transferPending} onClick={()=>work(async()=>{
              await api('generated-reset',{id:session.id});setReaction(undefined);setBenchReset(value=>value+1);
            })}><LabIcon name="bench" size={16}/> Reset setup</button></div>
          {transferPending&&<p role="status">Checking transfer…</p>}
          {reaction?.observation&&<p className={reaction.allowed?'bench-observation':'warning'} role="status">
            {reaction.observation} {reaction.source&&<a href={reaction.source} target="_blank" rel="noreferrer">Model reference</a>}</p>}
          {!!session.materials.length&&<details className="lab-disclosure"><summary>Bench materials · {session.materials.length}</summary>
            <p>{session.materials.map(name=>name.replace(/^solid:\s*/i,'')).join(' · ')}</p></details>}
          {error&&<p className="error" role="alert">{error}</p>}
          {result&&<p className="bench-observation" role="status"><LabIcon name="eye" size={18}/>{result.observation}</p>}
        </div>
        <section className="panel controls">
        <PracticalProgress labels={session.procedure??Array.from({length:session.total},(_,index)=>'Step '+(index+1))}
          completed={results.length} context={preview?'Preview':undefined}/>
        {instruction?<form className="current" onSubmit={e=>{e.preventDefault();void run(tool,operation);}}>
          <h2>{instruction}</h2>
          <fieldset><legend>Apparatus</legend><div className="lab-picker apparatus-picker">
            {session.tools.map(item=><button key={item} type="button" disabled={busy} aria-label={item} title={item} aria-pressed={tool===item} onClick={()=>setTool(item)}><LabIcon name={session.apparatus?.[item]??apparatusIcon(item)}/></button>)}
          </div></fieldset>
          <fieldset><legend>Action</legend><div className="lab-picker lab-actions">
            {session.operations.map(item=><button key={item} type="button" disabled={busy} aria-pressed={operation===item} onClick={()=>setOperation(item)}>
              <LabIcon name={operationIcons[item]} size={19}/><span>{item}</span>
            </button>)}
          </div></fieldset>
          {unit&&<label className="field">Setting ({unit})<input required type="number" step="any" value={setting} onChange={e=>setSetting(e.target.value)}/></label>}
          {operation==='Record'?<label className="field">Notebook entry<textarea rows={3} maxLength={1000} value={note} onChange={e=>setNote(e.target.value)}/></label>:
            <details className="lab-disclosure"><summary><LabIcon name="notebook" size={16}/> Add a note</summary><label className="field">Notebook entry<textarea rows={2} maxLength={1000} value={note} onChange={e=>setNote(e.target.value)}/></label></details>}
          <button className="primary" disabled={busy||transferPending||!tool||!operation}><LabIcon name={operation==='Wait'?'timer':'play'} size={17}/>{operation==='Wait'?'Advance time':'Run action'}</button>
        </form>:<div className="current"><h2>Practical complete</h2><ReportReceipt code={reportCode} preview={!!preview}/>
          <p>Review your observations and notebook entries below.</p></div>}
        </section>
      </div>
      <details className="lab-disclosure" open={!instruction}><summary><LabIcon name="notebook" size={18}/> Notebook · {results.length}</summary>
      <ol>{results.map((row,index)=><li key={index}><p>{row.observation}{row.note&&<><br/><strong>Your entry</strong> · {row.note}</>}</p></li>)}</ol></details>
    </>}
    {!session&&error&&<p className="error" role="alert">{error}</p>}
  </section>;
}
