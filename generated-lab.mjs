export const operations=['Measure','Transfer','Mix','Wait','Blot','Inspect','Record','Filter','Heat','Cool','Label','Assemble','Adjust','Compare'];
const crystal=[
  ['Measure 10 mL of prepared sodium chloride solution in a graduated cylinder.','Measure','Graduated cylinder','The cylinder holds 10 mL of clear solution.','liquid'],
  ['Pour the measured solution into a shallow evaporating dish.','Transfer','Evaporating dish','A shallow layer of clear solution covers the dish.','liquid'],
  ['Leave the dish undisturbed until the water evaporates. Advance simulated time to check the dish.','Wait','Timer','The liquid recedes and salt crystals remain.','crystals'],
  ['Examine the residue with a hand lens and describe its shape.','Inspect','Hand lens','Some grains have flat faces and approximately square outlines.','crystals'],
  ['Record what happened to the water and what remained in the dish.','Record','Notebook','Compare the clear solution with the solid residue.','crystals']
];
const osmosis=[
  ['Weigh and label two matching potato pieces, A and B.','Measure','Balance','Illustrative initial readings: A 5.00 g, B 5.00 g.','samples'],
  ['Place A in distilled water and B in concentrated salt solution.','Transfer','Two labelled beakers','A is submerged in water and B in salt solution.','samples'],
  ['Wait 30 simulated minutes with both pieces submerged.','Wait','Timer','Water exchange proceeds while both samples remain immersed.','samples'],
  ['Remove both pieces and blot their surfaces before reweighing.','Blot','Paper towel','Surface liquid is removed. The pieces remain labelled.','samples'],
  ['Reweigh A and B on the same balance.','Measure','Balance','Illustrative final readings: A 5.40 g, B 4.60 g.','osmosis'],
  ['Record the percentage mass change for each piece and explain the direction of water movement.','Record','Notebook','Use (final mass − initial mass) ÷ initial mass × 100 for each sample.','samples']
];
function sample(title,rows) {
  return {title,handout:title+'\n\n'+rows.map(row=>row[0]).join('\n'),
    steps:rows.map(([source,operation,tool,observation,visual])=>({source,instruction:source,operation,tool,observation,visual}))};
}
export const examples={
  crystallisation:sample('Salt crystallisation by evaporation',crystal),
  osmosis:sample('Osmosis in potato tissue',osmosis)
};
examples.crystallisation.materials=['Prepared sodium chloride solution'];
examples.osmosis.materials=['Distilled water','Concentrated salt solution','Solid: Potato piece A','Solid: Potato piece B'];
examples.crystallisation.steps[0].setting={value:10,unit:'mL'};
examples.osmosis.steps[2].setting={value:30,unit:'min'};
export const visuals=['neutral','liquid','crystals','samples','osmosis','bubbles','layers','precipitate'];
export const apparatusKinds=['beaker','flask','cylinder','dish','balance','timer','notebook','lens','filter','blot','heat','tools','burette','pipette','rod','tube'];
function field(value,max){
  return typeof value==='string'&&value.trim()&&value.length<=max;
}
const normalise=s=>s.trim().replace(/\s+/g,' ');
const unitAliases=new Map([
  ['ml',['millilitre','millilitres','milliliter','milliliters']],
  ['l',['litre','litres','liter','liters']],
  ['min',['minute','minutes','simulated minute','simulated minutes']],
  ['s',['second','seconds','sec','simulated second','simulated seconds']],
  ['g',['gram','grams']],['mg',['milligram','milligrams']],
  ['µL',['microlitre','microlitres','microliter','microliters','μL','uL']],
  ['°C',['degrees Celsius','degree Celsius','° C']]
].flatMap(([unit,aliases])=>aliases.map(alias=>[alias,unit])));
function unitKey(unit){
  const compact=normalise(unit).replace(/\s*([/·^])\s*/g,'$1');
  return unitAliases.get(compact)??(['mL','ml','L','l'].includes(compact)?compact.toLowerCase():compact);
}
export function supportedSetting(handout,excerpt,setting){
  if(!Number.isFinite(setting?.value)||!field(setting.unit,80))return false;
  const evidence=setting.source??excerpt;
  if(!field(evidence,500)||!normalise(handout).includes(normalise(evidence)))return false;
  const unit=unitKey(setting.unit);
  // Read the value as a whole token and compare the unit immediately after it.
  for(const match of evidence.matchAll(/(?<![\p{L}\p{N}.,+\-−])[+\-−]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?(?![\d.]|,\d)/gu)){
    if(Number(match[0].replace('−','-'))!==setting.value)continue;
    const tail=evidence.slice(match.index+match[0].length).trimStart();
    // Stop at word boundaries, so "mL" cannot match "mL/min".
    for(const boundary of tail.matchAll(/(?=$|[\s,;:!?()[\]]|\.(?!\d))/gu)){
      const candidate=tail.slice(0,boundary.index).trimEnd();
      if(candidate.length>100)break;
      if(candidate&&unitKey(candidate)===unit&&!/^\s*[/·^]/.test(tail.slice(boundary.index)))return true;
    }
  }
  return false;
}
export function validateLab(lab) {
  if(lab?.experiment!=='generated'||!field(lab.title,120)||!field(lab.handout,12000)||
    !Array.isArray(lab.steps)||lab.steps.length<2||lab.steps.length>24)
    throw Error('A generated practical needs a title, handout and 2 to 24 supported steps.');
  if(lab.materials!==undefined&&(!Array.isArray(lab.materials)||lab.materials.length>24||
    lab.materials.some(name=>!field(name,80)||!name.replace(/^solid:\s*/i,'').trim())))
    throw Error('List up to 24 bench materials, with up to 80 characters per name.');
  if(lab.benchTools!==undefined&&(!Array.isArray(lab.benchTools)||lab.benchTools.length>24||
    lab.benchTools.some(item=>!field(item?.name,80)||!apparatusKinds.includes(item.kind))))
    throw Error('Bench apparatus must use a supported geometry and name.');
  if(lab.blockers!==undefined&&(!Array.isArray(lab.blockers)||lab.blockers.length>72||lab.blockers.some(item=>!field(item,500))))
    throw Error('Invalid lecturer review checklist.');
  for(const step of lab.steps){
    if(!step||!field(step.source,1200)||!normalise(lab.handout).includes(normalise(step.source))||
      !field(step.instruction,500)||!field(step.tool,80)||!field(step.observation,500)||
      !operations.includes(step.operation)||!visuals.includes(step.visual)||
      (step.apparatus!==undefined&&!apparatusKinds.includes(step.apparatus)))
      throw Error('Review every step. Each one needs a handout excerpt, a supported operation, an apparatus item and an observation.');
    if(step.transferMaterial!==undefined&&(!['Measure','Transfer','Mix'].includes(step.operation)||
      !lab.materials?.some(name=>name.replace(/^solid:\s*/i,'')===step.transferMaterial)))
      throw Error('A material used in a transfer step must be present on the bench.');
    if(step.measurementQuestion!==undefined&&!field(step.measurementQuestion,300)||
      step.measurementAnswer!==undefined&&(step.measurementQuestion===undefined||!field(step.measurementAnswer,300)))
      throw Error('A measurement clarification needs a question and a valid lecturer answer.');
    if(step.setting!==undefined&&!supportedSetting(lab.handout,step.source,step.setting))
      throw Error('A numeric setting must cite the value and unit written in the handout.');
  }
  return lab;
}
export function studentInstruction(step){
  if(!step)return null;
  return step.measurementAnswer?step.instruction+' Lecturer clarification: '+step.measurementAnswer:step.instruction;
}
export function executeStep(lab,index,input) {
  const step=lab.steps[index];
  if(!step)throw Error('This practical is complete.');
  if(input.tool!==step.tool||input.operation!==step.operation)
    throw Error('That tool and operation do not match this step. Check the handout and try again.');
  if(step.setting&&(!Number.isFinite(input.setting)||input.setting!==step.setting.value))
    throw Error('Check the value and unit specified in the handout before applying this setting.');
  const note=typeof input.note==='string'?input.note.trim():'';
  if(note.length>1000)throw Error('Keep your notebook entry under 1,000 characters.');
  if(step.operation==='Record'&&!note)throw Error('Enter your result in the notebook before continuing.');
  return {observation:step.observation,visual:step.visual,operation:step.operation,tool:step.tool,note};
}
