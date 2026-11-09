import test from 'node:test';
import assert from 'node:assert/strict';
import {actions,advance,chemistry,concentration,concordant,equivalence,round,sample,titre,trial,validate} from './model.mjs';

test('known strong acid–strong base case and distinct indicator endpoint',()=>{
  assert.equal(equivalence(.1,25,.1),25);
  const t=trial(0);
  t.delivered=25;
  assert.equal(chemistry(sample,.1,t).pH,7);
  assert.equal(chemistry(sample,.1,t).color,'clear');
  t.delivered=25.01;
  t.unmixed=.01;
  assert.equal(chemistry(sample,.1,t,false).color,'clear');
  assert.equal(chemistry(sample,.1,t).color,'faint pink');
  t.delivered=25.5;
  assert.equal(chemistry(sample,.1,t).color,'deep pink');
});
test('non-zero starting level, independent recorded titre, and fresh retry',()=>{
  const t=trial(0);
  for(const action of ['prepare','transfer','indicator']) advance(t,action);
  assert.throws(()=>advance(t,'initial','0.7'));
  advance(t,'initial','0.72');
  for(let i=0;i<26;i++) advance(t,'add','stream');
  assert.throws(()=>advance(t,'observe'));
  advance(t,'swirl');advance(t,'observe');advance(t,'finish');advance(t,'final','26.75');
  assert.equal(chemistry(sample,.1,t).color,'deep pink');
  assert.equal(round(t.start+t.delivered),26.73);
  assert.equal(titre(t),26.03);
  const next=trial(1);
  assert.equal(next.start,1.34);
  assert.equal(next.delivered,0);
  assert.equal(next.initial,null);
});
test('configured aliquot, range, units and concordance',()=>{
  const steps=Object.entries(actions).map(([action,source])=>({source,action,warning:''}));
  const c=validate({...sample,steps,volume:10,base:.05,low:.1,high:.11});
  assert.equal(equivalence(c.low,c.volume,c.base),20);
  assert.equal(concentration([20,20],c,'mol/L'),.1);
  assert.equal(concentration([20,20],c,'mmol/L'),100);
  const rows=[23,20.1,21,20].map(final=>({initial:0,final,stage:'done'}));
  assert.deepEqual(concordant(rows,.1),[20,20.1]);
  assert.throws(()=>validate({...c,volume:25}));
  assert.throws(()=>validate({...c,steps:steps.slice(1)}));
  assert.throws(()=>validate({...c,steps:[{...steps[0],warning:'Ambiguous'},...steps.slice(1)]}));
});

