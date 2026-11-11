import {useEffect,useState} from 'react';

type ReplayEvent={seconds:number;label:string;detail:string};
type Titration={entered:number;expected:number;unit:string;agrees:boolean;group:number[];
  trials:{index:number;actual:number;outcome:string;readingError:boolean}[]};
type Report={title:string;mode:string;completed:string;duration:number;events:ReplayEvent[];omitted:number;
  completedSteps?:number;notebook?:string[];titration?:Titration};
type Api=<T>(path:string,body?:object)=>Promise<T>;

const sample:Report={
  title:'Acid–base titration',mode:'Practice',completed:'2026-11-10T04:12:00Z',duration:242,omitted:0,
  titration:{entered:.101,expected:.1008,unit:'mol/L',agrees:true,group:[25.18,25.22],trials:[
    {index:0,actual:25.55,outcome:'deep pink',readingError:false},
    {index:1,actual:25.18,outcome:'faint pink',readingError:false},
    {index:2,actual:25.22,outcome:'faint pink',readingError:false}
  ]},
  events:[
    {seconds:12,label:'Trial 1 · Prepare',detail:'Burette conditioned and filled.'},
    {seconds:48,label:'Trial 1 · Observe',detail:'Deep pink remained after swirling. The rough trial overshot.'},
    {seconds:129,label:'Trial 2 · Final reading',detail:'Recorded a titre of 25.18 mL.'},
    {seconds:221,label:'Trial 3 · Final reading',detail:'Recorded a titre of 25.22 mL.'}
  ]
};

const elapsed=(seconds:number)=>Math.floor(seconds/60)+'m '+String(seconds%60).padStart(2,'0')+'s';

function ReportView({report,example}:{report:Report;example:boolean}){
  const [step,setStep]=useState(0);
  const [playing,setPlaying]=useState(false);
  const last=report.events.length-1;
  useEffect(()=>{
    if(!playing||step>=last)return;
    const timer=window.setTimeout(()=>setStep(step+1),850);
    return ()=>window.clearTimeout(timer);
  },[playing,step,last]);
  const event=report.events[step];
  const result=report.titration;
  return <article className="report attempt-report">
    <p className="kicker">{example?'SAMPLE DATA':'COMPLETED PRACTICAL'}</p>
    <h3>{report.title}</h3>
    <p>{report.mode} · {new Date(report.completed).toLocaleString()} · {elapsed(report.duration)}</p>
    {result&&<>
      <p><strong>Submitted concentration</strong> {result.entered} {result.unit} · {result.agrees?'Agrees with recorded titres':'Review calculation'}</p>
      <p>Calculated from concordant titres of {result.group.map(value=>value.toFixed(2)).join(' and ')} mL: {Number(result.expected.toPrecision(5))} {result.unit}.</p>
      <div className="table-wrap"><table><thead><tr><th>Trial</th><th>Delivered</th><th>Endpoint</th><th>Readings</th></tr></thead>
        <tbody>{result.trials.map(trial=><tr key={trial.index}><th>{trial.index?'Repeat '+trial.index:'Rough'}</th><td>{trial.actual.toFixed(2)} mL</td><td>{trial.outcome}</td><td>{trial.readingError?'Review':'—'}</td></tr>)}</tbody>
      </table></div>
    </>}
    {report.completedSteps!==undefined&&<p><strong>{report.completedSteps}</strong> steps completed</p>}
    {!!report.notebook?.length&&<><h4>Student notebook</h4><ul>{report.notebook.map((note,index)=><li key={index}>{note}</li>)}</ul></>}
    <h4>Action replay</h4>
    {event&&<>
      <p aria-live="polite"><strong>{elapsed(event.seconds)} · {event.label}</strong><br/>{event.detail}</p>
      <div className="row">
        <button type="button" disabled={step===0} onClick={()=>{setPlaying(false);setStep(step-1);}}>Previous</button>
        <button type="button" onClick={()=>{if(step>=last)setStep(0);setPlaying(step>=last||!playing);}}>{playing&&step<last?'Pause':'Play replay'}</button>
        <button type="button" disabled={step>=last} onClick={()=>{setPlaying(false);setStep(step+1);}}>Next</button>
        <span>{step+1} / {report.events.length}</span>
      </div>
    </>}
    {!event&&<p>No actions recorded.</p>}
    {!!report.omitted&&<p>{report.omitted} later actions were beyond the replay limit.</p>}
  </article>;
}

export function ExampleAttemptReport(){
  return <ReportView report={sample} example/>;
}

export function AttemptReports({api}:{api:Api}){
  const [code,setCode]=useState('');
  const [report,setReport]=useState<Report>();
  const [example,setExample]=useState(false);
  const [revision,setRevision]=useState(0);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  function show(next:Report,isExample:boolean){
    setReport(next);setExample(isExample);setRevision(value=>value+1);
  }
  return <details><summary>Completed practical reports</summary>
    <p>Ask the student for their report code. Enter it here to open the report and replay.</p>
    <form className="row" onSubmit={async event=>{
      event.preventDefault();
      setBusy(true);setError('');setReport(undefined);
      try{show(await api<Report>('attempt-report',{code}),false);}
      catch(error){setError((error as Error).message);}
      finally{setBusy(false);}
    }}>
      <label className="field">Report code<input value={code} onChange={event=>setCode(event.target.value)} autoComplete="off" spellCheck={false}/></label>
      <button className="primary" disabled={busy||!code.trim()}>Generate report</button>
      <button type="button" disabled={busy} onClick={()=>{setError('');show(sample,true);}}>Preview example report</button>
    </form>
    {error&&<p role="alert" className="error">{error}</p>}
    {report&&(example?<ExampleAttemptReport key={revision}/>:<ReportView key={revision} report={report} example={false}/>)}
  </details>;
}
