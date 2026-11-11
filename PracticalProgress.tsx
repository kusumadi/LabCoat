export function PracticalProgress({labels,completed,context}:{
  labels:string[];
  completed:number;
  context?:string;
}){
  return <>
    <p className="kicker">PROCEDURE{context&&' / '+context.toUpperCase()}</p>
    <ol className="progress" aria-label="Procedure steps">
      {labels.map((label,index)=><li key={index}
        className={index===completed?'active':undefined}
        aria-current={index===completed?'step':undefined}>
        <span aria-hidden="true">{index<completed?'✓':index+1}</span>
        {index<completed&&<span className="sr-only">Completed: </span>}
        {label}
      </li>)}
    </ol>
  </>;
}

export function ReportReceipt({code,preview}:{code?:string;preview?:boolean}){
  if(!code)return <p role="status">The server did not return a report code. Restart LabCoat with the latest server code and try a new practical.</p>;
  return <p className="report-receipt" role="status">
    <strong>{preview?'Preview report code':'Lecturer report code'}</strong>
    <code>{code}</code>
    {preview?'Open this code under Completed practical reports in Lecturer Studio.':'Share this code with your lecturer to open your results and replay.'}
  </p>;
}
