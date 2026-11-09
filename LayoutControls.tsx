import {useState} from 'react';
import {equipment,moveEquipment,type Item,type Layout} from './environment.mjs';

export function LayoutControls({layout,reset,onChange}:{layout:Layout;reset:Layout;onChange:(layout:Layout)=>void}){
  const [item,setItem]=useState<Item>('table');
  const point=layout[item]??{x:0,z:0};
  const nudge=(x:number,z:number)=>onChange(moveEquipment(layout,item,point.x+x,point.z+z));
  const burette=layout.burette??{x:0,z:0};
  return <div className="layout-controls">
    <label className="field">Equipment to move<select value={item} onChange={e=>setItem(e.target.value as Item)}>
      {Object.entries(equipment).map(([key,name])=><option key={key} value={key}>{name}</option>)}
    </select></label>
    <div className="row">
      <button onClick={()=>nudge(-.25,0)}>Left</button><button onClick={()=>nudge(.25,0)}>Right</button>
      <button onClick={()=>nudge(0,-.25)}>Back</button><button onClick={()=>nudge(0,.25)}>Forward</button>
    </div>
    <output>{equipment[item]} · position {point.x.toFixed(2)}, {point.z.toFixed(2)}</output>
    <div className="row">
      <button onClick={()=>onChange(moveEquipment(layout,'flask',burette.x,burette.z))}>Place flask under tip</button>
      <button onClick={()=>onChange(reset)}>Reset layout</button>
    </div>
  </div>;
}
