import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { checkoutAttemptKey, savedCheckoutAttempt, saveCheckoutReference, completeCheckoutAttempt } from '../src/lib/checkoutAttempt.ts';

function store() {
  const items=new Map();
  return { get length(){return items.size;}, key(index){return [...items.keys()][index] ?? null;},
    getItem:key=>items.get(key)??null,setItem:(key,value)=>items.set(key,value),removeItem:key=>items.delete(key) };
}
let passed=0;
const check=(label,fn)=>{fn();passed++;console.log(`PASS: ${label}`);};
const key=checkoutAttemptKey('owner','bronze',20,'monthly',1,'new_service');
check('retry and page reload preserve the original request ID',()=>{
  const storage=store(),id=randomUUID();
  assert.equal(savedCheckoutAttempt(storage,key,()=>id).requestId,id);
  assert.equal(savedCheckoutAttempt(storage,key,()=>{throw new Error('must not replace');}).requestId,id);
  const afterReload=JSON.parse(storage.getItem(key)); assert.equal(afterReload.requestId,id);
});
check('customer, plan, connection count and purchase purpose have separate keys',()=>{
  for(const args of [['other','bronze',20,'monthly',1,'new_service'],['owner','gold',60,'6 months',1,'new_service'],
    ['owner','bronze',35,'monthly',2,'new_service'],['owner','bronze',20,'monthly',1,'renewal']]) assert.notEqual(checkoutAttemptKey(...args),key);
});
check('an acknowledged session is retained through errors and cancellation',()=>{
  const storage=store(),id=randomUUID();savedCheckoutAttempt(storage,key,()=>id);
  saveCheckoutReference(storage,key,id,'cs_test_Saved'); assert.equal(savedCheckoutAttempt(storage,key).reference,'cs_test_Saved');
  completeCheckoutAttempt(storage,'cs_test_Other');assert.equal(savedCheckoutAttempt(storage,key).requestId,id);
});
check('only confirmation of the matching receipt clears the saved attempt',()=>{
  const storage=store(),id=randomUUID(); savedCheckoutAttempt(storage,key,()=>id);saveCheckoutReference(storage,key,id,'cs_test_Saved');
  storage.setItem('other-app',JSON.stringify({reference:'cs_test_Saved'}));
  completeCheckoutAttempt(storage,'cs_test_Saved');assert.equal(storage.getItem(key),null);assert.ok(storage.getItem('other-app'));
});
check('corrupt or missing storage never silently starts a replacement request',()=>{
  const storage=store();for(const value of ['bad','{}','null',JSON.stringify({requestId:'bad'})]){
    storage.setItem(key,value); assert.throws(()=>savedCheckoutAttempt(storage,key));assert.equal(storage.getItem(key),value);
  }
  assert.throws(()=>savedCheckoutAttempt({...storage,getItem:()=>{throw new Error('storage denied');}},key),/storage denied/);
  assert.throws(()=>savedCheckoutAttempt({...store(),setItem:()=>{throw new Error('storage full');}},key),/storage full/);
});
check('a changed attempt ID or a non-test reference cannot replace a saved binding',()=>{
  const storage=store(),id=randomUUID();savedCheckoutAttempt(storage,key,()=>id);
  assert.throws(()=>saveCheckoutReference(storage,key,randomUUID(),'cs_test_Saved'));
  assert.throws(()=>saveCheckoutReference(storage,key,id,'cs_live_Wrong'));assert.equal(savedCheckoutAttempt(storage,key).requestId,id);
  saveCheckoutReference(storage,key,id,'cs_test_Saved');assert.throws(()=>saveCheckoutReference(storage,key,id,'cs_test_Changed'));
});
check('live attempts retain their binding separately from existing Preview v1 storage',()=>{
  const storage=store(),id=randomUUID();
  const liveKey=checkoutAttemptKey('owner','bronze',20,'monthly',1,'new_service',true);
  assert.notEqual(liveKey,key);assert.ok(key.startsWith('ks-checkout-v1:'));
  savedCheckoutAttempt(storage,key,()=>id);saveCheckoutReference(storage,key,id,'cs_test_Saved');
  savedCheckoutAttempt(storage,liveKey,()=>id);saveCheckoutReference(storage,liveKey,id,'cs_live_Saved',true);
  assert.throws(()=>saveCheckoutReference(storage,liveKey,id,'cs_test_Saved',true));
  completeCheckoutAttempt(storage,'cs_live_Saved');assert.equal(storage.getItem(liveKey),null);
  assert.equal(savedCheckoutAttempt(storage,key).reference,'cs_test_Saved');
});
check('selected services have separate v2 requests and confirmation clears only its own binding',()=>{
  const storage=store(),one=randomUUID(),two=randomUUID(),id=randomUUID();
  const a=checkoutAttemptKey('owner','gold',150,'6 months',3,'renewal',true,one);
  const b=checkoutAttemptKey('owner','gold',150,'6 months',3,'renewal',true,two);assert.notEqual(a,b);
  assert.notEqual(a,checkoutAttemptKey('owner','gold',150,'6 months',3,'renewal',true));
  savedCheckoutAttempt(storage,a,()=>id);savedCheckoutAttempt(storage,b,()=>randomUUID());
  saveCheckoutReference(storage,a,id,'cs_live_Chosen',true);completeCheckoutAttempt(storage,'cs_live_Chosen');
  assert.equal(storage.getItem(a),null);assert.ok(storage.getItem(b));
});
console.log(`${passed} browser retry checks passed without a browser session or payment request.`);
