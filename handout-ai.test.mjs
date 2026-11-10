import test from 'node:test';
import assert from 'node:assert/strict';
import {designLab,readHandout} from './handout-ai.mjs';
import {benchItems,createMixtureState,transferMixture} from './lab-capabilities.mjs';
import {openLabRecords} from './lab-records.mjs';

const handout='Equipment: beaker and notebook.\n1. Pour aqueous sodium hydroxide into the beaker.\n2. Record the observation in the notebook.';
const [first,second]=handout.split('\n').slice(1).map(row=>row.slice(3));
const draft=()=>({
  title:'Bench rehearsal',review:[],blockers:[],
  coverage:[{source:first,step:0},{source:second,step:1}],
  materials:[{name:'Aqueous sodium hydroxide',phase:'liquid',source:'aqueous sodium hydroxide'}],
  apparatus:[{name:'Beaker',kind:'beaker',source:'beaker'},{name:'Notebook',kind:'notebook',source:'notebook'}],
  steps:[
    {source:first,instruction:first,tool:'Beaker',apparatus:'beaker',operation:'Transfer',visual:'liquid',observation:'fabricated pH',transferMaterial:'Aqueous sodium hydroxide'},
    {source:second,instruction:second,tool:'Notebook',apparatus:'notebook',operation:'Record',visual:'neutral'}
  ]
});
test('attachment review fails closed on unreadable content',async()=>{
  await assert.rejects(readHandout(async()=>JSON.stringify({complete:false,handout,issues:['Page 2 unreadable.']}),{}),/Page 2 unreadable/);
  assert.equal(await readHandout(async()=>JSON.stringify({complete:true,handout,issues:[]}),{}),handout);
});
test('generation keeps material and apparatus provenance, ignores fabricated observations and flags omitted instructions',async t=>{
  const records=openLabRecords(':memory:');
  t.after(()=>records.close());
  const source=handout+'\n3. Inspect the sample in a scanning electron microscope.';
  const result=await designLab(async()=>JSON.stringify(draft()),source,records.inspect(source),records.inspectEquipment(source));
  assert.equal(result.lab.materials[0],'Aqueous sodium hydroxide');
  assert.equal(result.lab.steps[0].observation,'Observe the simulated bench and record what you see.');
  assert.ok(result.lab.blockers.some(message=>message.includes('scanning electron microscope')));
  assert.deepEqual(result.equipment.map(row=>row.kind),['beaker','notebook']);
  const forged=draft();
  forged.apparatus[0].source='never present';
  await assert.rejects(designLab(async()=>JSON.stringify(forged),source,[],[]),/handout excerpt/);
});
test('transfer state follows actual reagents and rejects unmodelled combinations without changing vessels',()=>{
  const state=createMixtureState(benchItems(['Beaker','Flask'],['0.1 M hydrochloric acid','Sodium hydroxide','Solid: Sodium bicarbonate','Unknown sample']));
  assert.equal(transferMixture(state,2,0,'liquid').allowed,true);
  assert.equal(transferMixture(state,5,0,'liquid').allowed,false);
  assert.equal(state.get(5).length,1);
  assert.equal(state.get(0)[0].identity,'hcl');
  assert.equal(transferMixture(state,4,0,'solid').visual,'bubbles');
  assert.equal(state.get(0)[0].identity,undefined);
  assert.equal(transferMixture(state,3,0,'liquid').allowed,false);
  const fresh=createMixtureState(benchItems(['Beaker'],['Hydrochloric acid','NaOH']));
  transferMixture(fresh,1,0,'liquid');
  assert.match(transferMixture(fresh,2,0,'liquid').observation,/neutralise/);
});
