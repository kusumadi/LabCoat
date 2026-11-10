// These aliases name available geometry, not a claim of scientific capability.
export const equipment=[
  ['beaker','beaker|beakers'],['flask','flask|flasks|Erlenmeyer flask|conical flask'],
  ['cylinder','graduated cylinder|measuring cylinder|graduated cylinders'],['burette','burette|buret|burettes'],
  ['pipette','pipette|pipet|pipettes|pipette filler'],['dish','evaporating dish|crystallising dish|watch glass|dish'],
  ['balance','balance|weighing scale'],['timer','timer|stopwatch'],['notebook','notebook|worksheet'],
  ['lens','hand lens|magnifying glass'],['filter','funnel|filter paper|filter funnel'],['blot','paper towel|blotting paper'],
  ['heat','hot plate|hotplate'],['rod','glass rod|stirring rod'],['tube','test tube|test tubes'],['tools','spatula|forceps']
].map(([kind,aliases])=>({kind,aliases:aliases.split('|')}));

const words=value=>value.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu)?.join(' ')??'';
export function equipmentMatches(text){
  const source=' '+words(text)+' ';
  return equipment.flatMap(({kind,aliases})=>aliases.filter(alias=>source.includes(' '+words(alias)+' '))
    .map(name=>({name,kind})));
}

export function benchItems(tools,materials){
  return [
    ...tools.flatMap(label=>/^(two|2)\s+.*beakers$/i.test(label)?
      [{label,name:'Beaker A'},{label,name:'Beaker B'}]:[{label,name:label}]),
    ...materials.map(value=>({label:'',name:value.replace(/^solid:\s*/i,''),content:/^solid:/i.test(value)?'solid':'liquid'}))
  ].map((row,id)=>({...row,id}));
}

// Exact identities avoid interpreting arbitrary product names as pure reagents.
const identities=new Map([
  ['hydrochloric acid','hcl'],['hcl','hcl'],['sodium hydroxide','naoh'],['naoh','naoh'],
  ['sodium bicarbonate','bicarbonate'],['sodium hydrogen carbonate','bicarbonate'],['nahco3','bicarbonate'],
  ['water','water'],['distilled water','water'],['deionized water','water'],['deionised water','water'],
  ['sodium chloride','salt'],['nacl','salt'],['prepared sodium chloride','salt'],['concentrated salt','salt'],
  ['potato piece a','potato-a'],['potato piece b','potato-b']
]);
export function reagent(name,phase){
  const label=words(name);
  const explicitConcentration=name.trim().replace(/^\d+(?:\.\d+)?\s*(?:[mM]\b|mol\s*\/\s*[lL]\b)\s*/,'');
  return {identity:identities.get(words(explicitConcentration).replace(/^aqueous /,'').replace(/ (?:aqueous )?solution$/,'')),label,phase,name};
}
const openStax='https://openstax.org/books/chemistry-2e/pages/';
export function mixingOutcome(source,destination){
  if(!destination.length)return {allowed:true};
  const composition=[...source,...destination];
  const ids=new Set(composition.map(row=>row.identity));
  const is=(...keys)=>ids.size===keys.length&&keys.every(key=>ids.has(key));
  const aqueous=key=>composition.filter(row=>row.identity===key).every(row=>row.phase==='liquid');
  if(composition.every(row=>row.label===composition[0].label&&row.phase===composition[0].phase))return {allowed:true};
  if(is('hcl','naoh')&&aqueous('hcl')&&aqueous('naoh'))
    return {allowed:true,visual:'neutral',observation:'The acid and base neutralise each other. Either may remain in excess; this bench does not calculate the final pH.',source:openStax+'14-4-hydrolysis-of-salt-solutions',spent:true};
  if(is('hcl','bicarbonate')&&aqueous('hcl'))
    return {allowed:true,visual:'bubbles',observation:'Carbon dioxide bubbles form in the acid and bicarbonate model. The simulator does not predict the gas volume.',source:openStax+'18-6-occurrence-preparation-and-properties-of-carbonates',spent:true};
  if([...ids].every(key=>['water','salt'].includes(key)))return {allowed:true};
  if([...ids].every(key=>['water','salt','potato-a','potato-b'].includes(key))&&[...ids].some(key=>key==='water'||key==='salt'))return {allowed:true};
  return {allowed:false,observation:'This combination has no verified reaction model for these materials. The simulator paused the transfer and did not predict a result.'};
}

export function createMixtureState(items){
  return new Map(items.map(item=>[item.id,item.content?[reagent(item.name,item.content)]:[]]));
}
export function transferMixture(state,from,to,phase){
  if(!Number.isInteger(from)||!Number.isInteger(to)||from===to||!state.has(from)||!state.has(to)||!['solid','liquid'].includes(phase))
    throw Error('Choose two bench items to transfer between.');
  const original=state.get(from),source=original.filter(row=>row.phase===phase),destination=state.get(to);
  if(!source.length)throw Error('There is no material to transfer from that item. Reset the setup if needed.');
  const result=mixingOutcome(source,destination);
  if(result.allowed){
    state.set(from,original.filter(row=>row.phase!==phase));
    state.set(to,result.spent?[reagent('Unquantified reaction mixture','liquid')]:[...destination,...source]);
  }
  return result;
}
