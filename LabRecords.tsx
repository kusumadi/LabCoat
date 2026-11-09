import {useEffect,useState} from 'react';
type Api = <T>(path:string,body?:object)=>Promise<T>;
export type ChemicalMatch={id:string;name:string;cas:string;simulated:boolean};
type Chemical=ChemicalMatch & {formula:string;sds:string;aliases:string};
type Inventory={total:number;rows:Chemical[]};
type Incident={id:string;attempt:string;trial:number;mode:string;code:string;evidence:string;created:string;reviewed:number};
type Inbox={unread:number;rows:Incident[]};

export function LabRecords({api}:{api:Api}){
  const [inventory,setInventory]=useState<Inventory>();
  const [query,setQuery]=useState('');
  const [file,setFile]=useState<File>();
  const [inbox,setInbox]=useState<Inbox>();
  const [coaching,setCoaching]=useState<Record<string,string>>({});
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    let active=true;
    const refresh=()=>api<Inbox>('incidents',{}).then(next=>{if(active)setInbox(next);}).catch(e=>{if(active)setError(e.message);});
    void refresh();
    const timer=window.setInterval(refresh,5000);
    api<Inventory>('inventory',{}).then(next=>{if(active)setInventory(next);}).catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;window.clearInterval(timer);};
  },[api]);
  async function work(action:()=>Promise<void>){
    setBusy(true);setError('');setNotice('');
    try{await action();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <section className="panel lab-records">
    <h2>Lab records</h2>
    {error&&<p role="alert" className="error">{error}</p>}
    {notice&&<p role="status">{notice}</p>}
    <details><summary>Chemical inventory {inventory&&'· '+inventory.total+' records'}</summary>
      <p>The demo includes three reagents. Import the university’s inventory export as a JSON array to index its actual holdings. An inventory entry only identifies a chemical.</p>
      <form className="row" onSubmit={e=>{e.preventDefault();void work(async()=>setInventory(await api<Inventory>('inventory',{query})));}}>
        <label className="field">Name, formula, CAS or ID<input value={query} maxLength={200} onChange={e=>setQuery(e.target.value)}/></label>
        <button disabled={busy}>Search inventory</button>
      </form>
      <form className="row" onSubmit={e=>{e.preventDefault();if(!file)return;void work(async()=>{
        if(file.size>1_900_000) throw Error('Split the inventory into files under 1.9 MB.');
        const rows=JSON.parse(await file.text());
        const {imported}=await api<{imported:number}>('import-inventory',{rows});
        setInventory(await api<Inventory>('inventory',{query}));
        setNotice('Imported '+imported+' inventory records.');
      });}}>
        <label className="field">University inventory JSON<input type="file" accept=".json,application/json" onChange={e=>setFile(e.target.files?.[0])}/></label>
        <button disabled={!file||busy}>Import inventory</button>
      </form>
      <p><small>Each record requires <code>id</code> and <code>name</code>. Optional fields are <code>formula</code>, <code>cas</code>, <code>sds</code> and <code>aliases</code> (separate aliases with |).</small></p>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Formula</th><th>CAS</th><th>Simulation</th><th>SDS</th></tr></thead>
      <tbody>{inventory?.rows.map(c=><tr key={c.id}><th>{c.name}</th><td>{c.formula||'—'}</td><td>{c.cas||'—'}</td>
        <td>{c.simulated?'Titration reagent':'Inventory only'}</td><td>{c.sds?<a href={c.sds} target="_blank" rel="noreferrer">Supplier SDS</a>:'—'}</td></tr>)}</tbody></table></div>
      {inventory?.rows.length===0&&<p>No matching chemicals.</p>}
    </details>
    <details><summary>Student incident inbox <span role="status">· {inbox?.unread??0} unread</span></summary>
      <p>Simulator observations appear here automatically. An alert can reflect deliberate practice. Attempts use anonymous references.</p>
      {inbox?.rows.length===0&&<p>No incidents recorded.</p>}
      <ul className="incident-list">{inbox?.rows.map(row=><li key={row.id}>
        <strong>{row.code}</strong> <small>{row.reviewed?'Reviewed':'New'} · {new Date(row.created).toLocaleString()} · {row.mode} · attempt {row.attempt.slice(0,8)} · {row.trial?'repeat '+row.trial:'rough run'}</small>
        <p>{row.evidence}</p>
        <div className="row">
          {!row.reviewed&&<button disabled={busy} onClick={()=>work(async()=>setInbox(await api<Inbox>('review-incident',{id:row.id})))}>Mark reviewed</button>}
          <button disabled={busy} onClick={()=>work(async()=>{
            const {reply,mode}=await api<{reply:string;mode:string}>('explain-incident',{id:row.id});
            setCoaching(previous=>({...previous,[row.id]:mode+' · '+reply}));
          })}>Suggest coaching</button>
        </div>
        {coaching[row.id]&&<p role="status">{coaching[row.id]}</p>}
      </li>)}</ul>
    </details>
  </section>;
}
