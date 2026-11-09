import test from 'node:test';
import assert from 'node:assert/strict';
import {openLabRecords, requireCapability, titration} from './lab-records.mjs';

test('inventory import validates batches, updates by ID and distinguishes inventory from simulation', t=>{
  const records=openLabRecords(':memory:');
  t.after(()=>records.close());
  assert.equal(records.search().total,3);
  records.import([{id:'chem-42',name:'Copper sulfate',formula:'CuSO4',aliases:'copper sulphate'}]);
  assert.equal(records.search('copper sulphate').rows[0].simulated,false);
  assert.deepEqual(records.inspect('Add CuSO4 and NaOH').map(row=>[row.name,row.simulated]),
    [['Copper sulfate',false],['Sodium hydroxide',true]]);
  assert.throws(()=>records.import([{id:'another',name:'Unknown'},{id:'bad',name:'Invalid',sds:'javascript:alert(1)'}]));
  assert.equal(records.search('another').rows.length,0);
  records.import([{id:'chem-42',name:'Copper(II) sulfate',formula:'CuSO4'}]);
  assert.equal(records.search().total,4);
  assert.throws(()=>requireCapability({experiment:'other',steps:[]},records),/own simulation model/);
  assert.throws(()=>requireCapability({experiment:titration,steps:[{source:'Use CuSO4.'}]},records),/cannot simulate/);
  assert.doesNotThrow(()=>requireCapability({steps:[{source:'Use NaOH.'}]},records));
});

test('lecturer inbox deduplicates one observation per run and tracks review', t=>{
  const records=openLabRecords(':memory:');
  t.after(()=>records.close());
  const notify=run=>records.alert('anonymous-attempt',0,run,'practice','flask alignment','Dispensing blocked.');
  notify(0);notify(0);notify(1);
  const inbox=records.inbox();
  assert.equal(inbox.unread,2);
  const {id}=inbox.rows[0];
  assert.equal(records.incident(id).evidence,'Dispensing blocked.');
  records.review(id);
  assert.equal(records.inbox().unread,1);
  assert.equal(records.inbox().rows.at(-1).reviewed,1);
});
