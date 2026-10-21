import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { loadPreviewCompletions, previewCompletionSnapshot } from '../_server/ks-preview-completion-status.js';
import { fulfill } from '../_server/ks-payments.js';
import { paymentConfirmationView } from '../_shared/ks-payment-confirmation-view.js';
import { completionFixture } from './fixtures/ks-completion-status.mjs';

let checks=0;
const check=async(name,fn)=>{await fn();checks++;console.log(`PASS: ${name}`);};
const f=completionFixture();
const snapshot=(rows=[f.row],orders=[f.receipt],now=f.now)=>previewCompletionSnapshot(rows,f.owner,orders,now);
await check('bound completion needs fulfillment, attempt, owner login, receipt and CRM agreement',()=>{
  assert.deepEqual(snapshot().get(f.reference),{status:'setup_complete',providerActivated:true,expiresAt:f.expiresAt});
  for(const field of ['receipt','attempt','login','customer'])assert.throws(()=>snapshot([{...f.row,[field]:null}]));
});
await check('other owners or orders fail every independent completion binding',()=>{
  const other='00000000-0000-4000-8000-000000000099';
  for(const field of ['receipt','attempt','login']){
    assert.throws(()=>snapshot([{...f.row,[field]:{...f.row[field],user_id:other}}]));
    assert.throws(()=>snapshot([{...f.row,[field]:{...f.row[field],checkout_session_id:'cs_test_Foreign'}}]));
  }
  assert.throws(()=>snapshot([{...f.row,user_id:other}]));
  assert.throws(()=>snapshot([{...f.row,checkout_session_id:'cs_test_Foreign'}]));
  assert.throws(()=>snapshot([{...f.row,login:{...f.row.login,attempt_id:other}}]));
});
await check('changed intent, plan, expiry, provider/CRM identity and incomplete attempts cannot prove readiness',()=>{
  const patches=[{attempt:{...f.row.attempt,payment_intent_id:'pi_Foreign'}},{receipt:{...f.receipt,payment_intent_id:'pi_Foreign'}},
    {receipt:{...f.receipt,amount_cents:1}},{receipt:{...f.receipt,livemode:true}},{receipt:{...f.receipt,activated:true}},
    {attempt:{...f.row.attempt,state:'provider_verified'}},{attempt:{...f.row.attempt,package_months:12}},
    {attempt:{...f.row.attempt,provider_expires_at:'9999-01-01'}},{customer:{...f.row.customer,external_id:900002}},
    {customer:{...f.row.customer,source:'manual'}},{customer:{...f.row.customer,trial:true}},
    {customer:{...f.row.customer,expiration_at:new Date(Date.parse(f.expiresAt)+1000).toISOString()}}];
  for(const patch of patches)assert.throws(()=>snapshot([{...f.row,...patch}]));
});
await check('expiry boundary is separate from paid status and equivalent native timestamp formats agree',()=>{
  assert.equal(snapshot([f.row],[f.receipt],Date.parse(f.expiresAt)).get(f.reference).status,'setup_expired');
  assert.equal(snapshot([f.row],[f.receipt],Date.parse(f.expiresAt)+1).get(f.reference).providerActivated,false);
  const row=structuredClone(f.row);row.customer.expiration_at=row.customer.expiration_at.replace('Z','+00:00');
  assert.equal(snapshot([row]).get(f.reference).status,'setup_complete');
});
await check('missing, duplicate, oversized and unrelated proof results fail closed',()=>{
  for(const rows of [[],[f.row,f.row],null])assert.throws(()=>snapshot(rows));
  for(const orders of [[],[f.receipt,f.receipt],Array(6).fill(f.receipt),[{...f.receipt,user_id:'wrong'}]])assert.throws(()=>snapshot([f.row],orders));
});
await check('real SDK query scopes all owners and bounded references without selecting credentials',async()=>{
  let calls=0;
  const admin=createClient('https://synthetic.supabase.co','fictional-service',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,options)=>{
    calls++;const url=new URL(typeof input==='string'?input:input.url);assert.equal(options.method,'GET');assert.equal(url.pathname,'/rest/v1/ks_preview_paid_fulfillments');
    for(const key of ['user_id','attempt.user_id','login.user_id','receipt.user_id'])assert.equal(url.searchParams.get(key),`eq.${f.owner}`);
    assert.equal(url.searchParams.get('receipt.livemode'),'eq.false');assert.equal(url.searchParams.get('checkout_session_id'),`in.(${f.reference})`);assert.equal(url.searchParams.get('limit'),'2');
    const selected=url.searchParams.get('select');assert.ok(selected.includes('ks_preview_login_fulfillment_fk!inner'));
    for(const word of ['password','username','login_envelope','*'])assert.ok(!selected.includes(word));
    return Response.json([{...f.row,password:'MUST_NOT_LEAK',attempt:{...f.row.attempt,login_envelope:'MUST_NOT_LEAK'}}]);
  }}});
  const result=await loadPreviewCompletions(admin,f.owner,[f.receipt],f.now);assert.equal(calls,1);assert.ok(!JSON.stringify([...result]).includes('MUST_NOT_LEAK'));
});

function paymentFixture({expired=false,badProof=false,live=false}={}){
  const now=Date.now(),f=completionFixture(now);
  if(expired){f.row.completed_at=f.receipt.recorded_at=new Date(now-32*86400000).toISOString();f.row.attempt.provider_expires_at=f.row.customer.expiration_at=new Date(now-86400000).toISOString();}
  const session={id:f.reference,livemode:false,mode:'payment',status:'complete',payment_status:'paid',currency:'usd',amount_total:2000,amount_subtotal:2000,payment_intent:f.receipt.payment_intent_id,
    metadata:{user_id:f.owner,plan:'bronze',connections:'1',interval:'monthly',price:'20',duration_days:'30'}};
  const calls={notifications:0,rpcs:[]};
  const admin={rpc:async name=>{
    calls.rpcs.push(name);
    if(name==='ks_apply_paid_checkout')return {data:{ok:true,test_mode:true,activated:false},error:null};
    assert.equal(name,'ks_queue_preview_paid_order');return {data:{ok:true,test_mode:true,order_status:'setup_complete',provider_activated:true},error:null};
  },from:table=>{assert.equal(table,'ks_preview_paid_fulfillments');return {select(){return this;},eq(){return this;},in(){return this;},async limit(){return {data:badProof?[]:[f.row],error:null};}};},
    functions:{invoke:()=>{calls.notifications++;assert.fail('completed order reached notification');}}};
  return {f,session,calls,context:{environment:live?'production':'preview',live,admin,stripe:{checkout:{sessions:{retrieve:async()=>session}}}}};
}
await check('completed payment rechecks verify proof and never create a pending/setup email',async()=>{
  const t=paymentFixture();const result=await fulfill(t.session.id,t.context,t.f.owner);
  assert.equal(result.order_status,'setup_complete');assert.equal(result.provider_activated,true);assert.equal(t.calls.notifications,0);
  assert.equal(paymentConfirmationView(result,t.session.id).kind,'ready');
});
await check('expired completed payment rechecks retain payment without current readiness or another email',async()=>{
  const t=paymentFixture({expired:true});const result=await fulfill(t.session.id,t.context,t.f.owner);
  assert.equal(result.order_status,'setup_expired');assert.equal(result.provider_activated,false);assert.equal(t.calls.notifications,0);
  assert.equal(paymentConfirmationView(result,t.session.id).kind,'expired');
});
await check('a completed flag without proof cannot return readiness or send an alert',async()=>{
  const t=paymentFixture({badProof:true});await assert.rejects(()=>fulfill(t.session.id,t.context,t.f.owner),/do not pay again/);assert.equal(t.calls.notifications,0);
});
console.log(`${checks} completed-order checks passed. Real SDK query construction and actual fulfillment with fictional data; no external requests.`);
