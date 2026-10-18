import assert from 'node:assert/strict';
import {paymentConfirmationView} from '../_shared/ks-payment-confirmation-view.js';
import {queuePreviewPaidOrder} from '../_server/ks-preview-paid-orders.js';
import {customerSetupSnapshot} from '../_server/ks-customer-setup.js';
import {simulationSession,simulationOwner} from '../_server/ks-new-paid-simulation.js';
const reference='cs_test_SimulatedNewCustomer';
const pending={ok:true,test_mode:true,activated:false,provider_activated:false,order_status:'awaiting_activation'};
let checks=0;
async function check(label,fn){await fn();checks++;console.log(`PASS: ${label}`);}
await check('a saved test payment presents pending confirmation without claiming no provider line could exist',()=>{
  const view=paymentConfirmationView(pending,reference);assert.equal(view.kind,'test');assert.match(view.message,/pending confirmation/);
  assert.doesNotMatch(view.message,/no.*activation|did not.*activate/);
});
await check('the separately verified completed test setup no longer displays no-activation copy',()=>{
  const view=paymentConfirmationView({...pending,order_status:'setup_complete',provider_activated:true},reference);
  assert.equal(view.kind,'ready');assert.equal(view.title,'Streaming setup confirmed');assert.match(view.message,/did not charge your card/);
  assert.doesNotMatch(view.message,/no.*activation|did not.*activate|ready to watch/i);
});
await check('replayed completion presents the same verified setup state without suggesting another purchase',()=>{
  const complete={...pending,order_status:'setup_complete',provider_activated:true};
  assert.deepEqual(paymentConfirmationView({...complete,replayed:true,queue_replayed:true},reference),paymentConfirmationView(complete,reference));
});
await check('test payment alone and older receipt-only responses never imply completed streaming setup',()=>{
  const {order_status,provider_activated,...legacy}=pending;void order_status;void provider_activated;
  assert.equal(paymentConfirmationView(legacy,reference).kind,'test');assert.doesNotMatch(paymentConfirmationView(legacy,reference).message,/setup is confirmed/);
});
await check('website activation in the live legacy flow is not presented as streaming readiness',()=>{
  const view=paymentConfirmationView({ok:true,test_mode:false,activated:true},'cs_live_Fictional');
  assert.equal(view.kind,'pending');assert.equal(view.title,'Payment received');assert.doesNotMatch(view.message,/service is active|setup is confirmed|ready to watch/i);
});
await check('the staged unactivated live receipt can acknowledge payment without claiming service activation',()=>{
  assert.equal(paymentConfirmationView({...pending,test_mode:false},'cs_live_Fictional').kind,'pending');
});
await check('setup review is distinct from a failed payment for both payment modes',()=>{
  for(const test of [true,false]){
    const view=paymentConfirmationView({...pending,test_mode:test,order_status:'requires_review'},test?reference:'cs_live_Fictional');
    assert.equal(view.kind,'review');assert.match(view.message,/do not pay again/);assert.doesNotMatch(view.message,/payment failed/i);
  }
});
await check('completed status and provider proof must agree; one flag alone never grants readiness',()=>{
  for(const patch of [{order_status:'setup_complete'},{provider_activated:true},
    {order_status:'setup_complete',provider_activated:undefined},{order_status:'requires_review',provider_activated:true}]){
    assert.throws(()=>paymentConfirmationView({...pending,...patch},reference),/do not pay again/);
  }
});
await check('the Preview-only completion contract cannot be reinterpreted as live provider readiness',()=>{
  assert.throws(()=>paymentConfirmationView({...pending,test_mode:false,order_status:'setup_complete',provider_activated:true},'cs_live_Fictional'));
});
await check('mode and optional receipt-reference mismatches stop without producing success copy',()=>{
  for(const patch of [{test_mode:false},{receipt_reference:'cs_test_Foreign'}])assert.throws(()=>paymentConfirmationView({...pending,...patch},reference));
  assert.throws(()=>paymentConfirmationView(pending,'cs_live_Fictional'));
  assert.throws(()=>paymentConfirmationView(pending,'not-a-session'));
});
await check('malformed capabilities, unknown status and impossible sandbox website activation are rejected',()=>{
  for(const patch of [{ok:false},{test_mode:'true'},{activated:'false'},{activated:true},{provider_activated:'true'},{order_status:'unknown'}])assert.throws(()=>paymentConfirmationView({...pending,...patch},reference));
  for(const value of [null,{},true])assert.throws(()=>paymentConfirmationView(value,reference));
});
await check('unexpected backend details and credentials cannot enter display copy',()=>{
  const view=paymentConfirmationView({...pending,password:'MUST_NOT_LEAK',provider_error:'MUST_NOT_LEAK'},reference);
  assert.ok(!JSON.stringify(view).includes('MUST_NOT_LEAK'));
});
await check('the existing owner-bound server queue result drives both pending and confirmed presentation',async()=>{
  const session=simulationSession('bronze',1);
  for(const complete of [false,true]){
    const queued=await queuePreviewPaidOrder(session,{environment:'preview',live:false,admin:{async rpc(name,args){
      assert.equal(name,'ks_queue_preview_paid_order');assert.equal(args.p_user_id,simulationOwner);assert.equal(args.p_session_id,session.id);
      return {data:{ok:true,test_mode:true,order_status:complete?'setup_complete':'awaiting_activation',provider_activated:complete},error:null};
    }}},simulationOwner);
    assert.equal(paymentConfirmationView({...pending,...queued},session.id).kind,complete?'ready':'test');
  }
});
await check('a foreign purchaser and inconsistent server queue cannot reach a ready payment screen',async()=>{
  const forbidden={environment:'preview',live:false,admin:{rpc:()=>assert.fail('foreign payment reached queue')}};
  await assert.rejects(()=>queuePreviewPaidOrder(simulationSession('bronze',1),forbidden,'00000000-0000-4000-8000-000000000099'));
  for(const patch of [{order_status:'setup_complete',provider_activated:false},{order_status:'awaiting_activation',provider_activated:true}]){
    await assert.rejects(()=>queuePreviewPaidOrder(simulationSession('bronze',1),{environment:'preview',live:false,admin:{rpc:async()=>({data:{ok:true,test_mode:true,...patch},error:null})}},simulationOwner));
  }
});
await check('dashboard pending rows and payment pending copy agree; completed rows cannot enter that pending display',()=>{
  const receipt={checkout_session_id:reference,user_id:simulationOwner,livemode:false,tier:'bronze',connections:1,duration_days:30,amount_cents:2000,currency:'usd',activated:false,expires_at:null,recorded_at:'2030-01-01T00:00:00Z'};
  const row={checkout_session_id:reference,fulfillment_status:'awaiting_activation',queued_at:receipt.recorded_at,receipt};
  assert.equal(customerSetupSnapshot([row],simulationOwner)[0].providerActivated,false);
  assert.equal(paymentConfirmationView(pending,reference).kind,'test');
  assert.throws(()=>customerSetupSnapshot([{...row,fulfillment_status:'setup_complete'}],simulationOwner));
});
console.log(`${checks} payment/dashboard presentation checks passed. All payments, queue responses and identities were fictional; no real charge, email, credit or account change occurred.`);
