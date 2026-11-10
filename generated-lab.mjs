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
examples.crystallisation.steps[0].setting={value:10,unit:'mL'};
examples.osmosis.steps[2].setting={value:30,unit:'min'};
export const visuals=['neutral','liquid','crystals','samples','osmosis','bubbles','layers','precipitate'];
export const apparatusKinds=['beaker','flask','cylinder','dish','balance','timer','notebook','lens','filter','blot','heat','tools'];
function field(value,max){
  return typeof value==='string'&&value.trim()&&value.length<=max;
}
export function validateLab(lab) {
  if(lab?.experiment!=='generated'||!field(lab.title,120)||!field(lab.handout,12000)||
    !Array.isArray(lab.steps)||lab.steps.length<2||lab.steps.length>24)
    throw Error('A generated practical needs a title, handout and 2 to 24 supported steps.');
  const normalise=s=>s.trim().replace(/\s+/g,' ');
  for(const step of lab.steps){
    if(!step||!field(step.source,1200)||!normalise(lab.handout).includes(normalise(step.source))||
      !field(step.instruction,500)||!field(step.tool,80)||!field(step.observation,500)||
      !operations.includes(step.operation)||!visuals.includes(step.visual)||
      (step.apparatus!==undefined&&!apparatusKinds.includes(step.apparatus)))
      throw Error('Review every step. Each one needs a handout excerpt, a supported operation, an apparatus item and an observation.');
    if(step.setting!==undefined&&(!Number.isFinite(step.setting?.value)||!field(step.setting.unit,20)||
      !step.source.match(/-?\d+(?:\.\d+)?/g)?.some(number=>Number(number)===step.setting.value)))
      throw Error('A numeric setting must use a value written in the handout excerpt and include its unit.');
  }
  return lab;
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
