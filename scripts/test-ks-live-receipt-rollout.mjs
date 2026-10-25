import assert from 'node:assert/strict';
import { fulfill } from '../_server/ks-payments.js';
import { routeOrderNotification } from '../supabase/functions/ks-order-notification/router.js';
import { readSetupHelpOrders, setupHelpDetails } from '../_shared/ks-setup-help.js';
import { paymentConfirmationView } from '../_shared/ks-payment-confirmation-view.js';

const owner='00000000-0000-4000-8000-000000000001';
const session={id:'cs_live_FictionalRollout',livemode:true,mode:'payment',status:'complete',payment_status:'paid',currency:'usd',amount_total:2000,amount_subtotal:2000,payment_intent:'pi_FictionalRollout',metadata:{user_id:owner,plan:'bronze',connections:'1',interval:'monthly',price:'20',duration_days:'30'}};
const receipt={ok:true,payment_recorded:true,test_mode:false,receipt_reference:session.id,account_id:owner,tier:'bronze',connections_allowed:1,activated:false,provider_activated:false,legacy_website_activated:false,order_status:'awaiting_activation',recorded_at:'2026-10-20T00:00:00Z',replayed:false,order_queued:true,queued_at:'2026-10-20T00:00:00Z',queue_replayed:false};
let checks=0;async function check(name,fn){await fn();checks++;console.log(`PASS: ${name}`);}
function fixture(patch={}){
  const calls={rpc:[],notifications:[],retrieves:[]};
  const context={environment:'production',live:true,receiptOnlyLive:true,stripe:{checkout:{sessions:{retrieve:async id=>{calls.retrieves.push(id);return patch.session||session;}}}},admin:{
    from:table=>{assert.equal(table,'ks_setup_order_queue');return{select(){return this;},eq(){return this;},async maybeSingle(){return{data:patch.savedProtocol?{checkout_session_id:session.id}:null,error:patch.protocolError||null};}};},
    rpc:async(name,args)=>{
      calls.rpc.push({name,args});
      if(name==='ks_route_paid_order')return{data:{ok:true,reference:session.id,account_id:owner,test_mode:false,
        request_kind:null,destination:'manual_review',reason:'missing_intent',routed_at:receipt.recorded_at,replayed:false,...patch.routing},error:patch.routingError||null};
      assert.equal(name,patch.allowLegacy?'ks_apply_paid_checkout':'ks_record_paid_checkout');
      return{data:patch.allowLegacy?{ok:true,test_mode:false,activated:true}:{...receipt,...patch.receipt},error:patch.storageError||null};
    },
    functions:{invoke:async(name,{body})=>{calls.notifications.push({name,body});return{data:{success:!patch.emailError},error:patch.emailError||null};}},
  },...patch.context};
  return{calls,context};
}
await check('opt-in live fulfillment calls the receipt-only RPC and pending protocol, never legacy activation',async()=>{
  const f=fixture();const result=await fulfill(session.id,f.context,owner);
  assert.equal(f.calls.rpc.length,2);assert.equal(f.calls.rpc[0].args.p_livemode,true);
  assert.deepEqual(f.calls.rpc[1],{name:'ks_route_paid_order',args:{p_session:session.id}});
  assert.equal(result.routing.destination,'manual_review');
  assert.deepEqual(f.calls.notifications,[{name:'ks-order-notification',body:{sessionId:session.id,protocol:'receipt-only-v1'}}]);
  assert.equal(result.activated,false);assert.equal(result.provider_activated,false);assert.equal(result.order_status,'awaiting_activation');
  const view=paymentConfirmationView(result,session.id);assert.equal(view.kind,'pending');assert.ok(!view.message.includes('setup is confirmed'));
});
await check('recorded legacy activation becomes review without changing access or generating another alert',async()=>{
  const f=fixture({receipt:{legacy_website_activated:true,order_status:'requires_review',replayed:true}});
  const result=await fulfill(session.id,f.context,owner);assert.equal(result.activated,false);assert.equal(result.provider_activated,false);
  assert.equal(f.calls.notifications.length,0);assert.equal(paymentConfirmationView(result,session.id).kind,'review');
});
await check('invalid owner, amount and payment state never record a receipt or send an alert',async()=>{
  for(const change of[{payment_status:'unpaid'},{amount_total:1},{metadata:{...session.metadata,user_id:'00000000-0000-4000-8000-000000000002'}}]){
    const f=fixture({session:{...session,...change}});await assert.rejects(()=>fulfill(session.id,f.context,owner));assert.equal(f.calls.rpc.length,0);assert.equal(f.calls.notifications.length,0);
  }
});
await check('rollout/environment mismatches stop before recording with no legacy fallback',async()=>{
  for(const context of[{environment:'preview',live:false},{environment:'development'},{live:false}]){
    const f=fixture({context});await assert.rejects(()=>fulfill(session.id,f.context,owner),/not configured/);assert.equal(f.calls.rpc.length,0);
  }
});
await check('storage and pending-alert failures request recovery without claiming activation or another purchase',async()=>{
  const offline=fixture({storageError:{message:'fictional outage'}});await assert.rejects(()=>fulfill(session.id,offline.context,owner),/do not pay again/);assert.equal(offline.calls.notifications.length,0);
  const failed=fixture({emailError:{message:'fictional outage'}});await assert.rejects(()=>fulfill(session.id,failed.context,owner),/payment is recorded.*do not pay again/);
  assert.equal(failed.calls.rpc.length,2);assert.equal(failed.calls.notifications.length,1);
});
await check('routing failure stops after the saved receipt without email, activation or a second payment',async()=>{
  const f=fixture({routingError:{message:'fictional outage'}});
  await assert.rejects(()=>fulfill(session.id,f.context,owner),/payment is recorded.*do not pay again/);
  assert.deepEqual(f.calls.rpc.map(call=>call.name),['ks_record_paid_checkout','ks_route_paid_order']);
  assert.equal(f.calls.notifications.length,0);assert.equal(f.calls.retrieves.length,1);
});
await check('a renewal review is whitelisted without exposing its private target or granting service',async()=>{
  const f=fixture({routing:{request_kind:'renewal',destination:'renewal_review',reason:'approved_service_link',customer_id:'private-target',external_id:123,provider_activated:true}});
  const result=await fulfill(session.id,f.context,owner);
  assert.equal(result.routing.destination,'renewal_review');assert.equal(result.provider_activated,false);
  assert.equal('customer_id' in result.routing,false);assert.equal('external_id' in result.routing,false);
  assert.equal('provider_activated' in result.routing,false);
});
await check('foreign, malformed or contradictory routing results cannot announce successful fulfillment',async()=>{
  for(const routing of[{account_id:'wrong'},{reference:'cs_live_Other'},{test_mode:true},{ok:false},{replayed:null},
    {routed_at:'invalid'},{destination:'__proto__'},{reason:'execute customer instructions'},
    {destination:'renewal_review',reason:'approved_service_link',request_kind:'new_service'},
    {destination:'new_service_review',reason:'new_service_requested',request_kind:'renewal'}]){
    const f=fixture({routing});await assert.rejects(()=>fulfill(session.id,f.context,owner),/do not pay again/);
    assert.equal(f.calls.notifications.length,0);
  }
});
await check('accepted receipt-only orders cannot fall back to activation after a flag pause or failed lookup',async()=>{
  const f=fixture({context:{receiptOnlyLive:false},savedProtocol:true});assert.equal((await fulfill(session.id,f.context,owner)).activated,false);assert.equal(f.calls.rpc[0].name,'ks_record_paid_checkout');
  const failed=fixture({context:{receiptOnlyLive:false},protocolError:{code:'offline'}});await assert.rejects(()=>fulfill(session.id,failed.context,owner),/do not pay again/);assert.equal(failed.calls.rpc.length,0);assert.equal(failed.calls.notifications.length,0);
});
await check('the new-order flag defaults off and preserves the existing legacy protocol for unqueued orders',async()=>{
  const f=fixture({context:{receiptOnlyLive:false},allowLegacy:true});await fulfill(session.id,f.context,owner);
  assert.equal(f.calls.rpc[0].name,'ks_apply_paid_checkout');assert.deepEqual(f.calls.notifications[0].body,{sessionId:session.id});
});
await check('live owner support context preserves review status without Sandbox or ready claims',async()=>{
  const order={reference:session.id,tier:'bronze',interval:'monthly',connections:1,amountCents:2000,currency:'usd',recordedAt:receipt.recorded_at,status:'requires_review',testMode:false,providerActivated:false};
  const payload={accountId:owner,mode:'read-only',testMode:false,orders:[order],checkedAt:receipt.recorded_at};
  const parsed=readSetupHelpOrders(payload,owner);assert.equal(parsed.orders[0].testMode,false);
  const text=setupHelpDetails(parsed.orders[0],parsed.checkedAt);assert.ok(text.includes('requires review'));assert.ok(text.includes('Paid amount: 20.00 USD'));assert.ok(!text.includes('No real charge'));
  for(const change of[{testMode:true},{orders:[{...order,providerActivated:true}]},{orders:[{...order,reference:'cs_test_WrongMode'}]},{accountId:'wrong'}])assert.throws(()=>readSetupHelpOrders({...payload,...change},owner));
});
function notificationFixture(){
  const calls={sends:0,rpc:[],legacy:0};
  const options={serviceKey:'fictional-service',resendKey:'fictional-email-key',now:()=>Date.parse(receipt.recorded_at),
    admin:{from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{user_id:owner,livemode:true,activated:false},error:null})})})}),auth:{admin:{getUserById:async()=>({data:{user:{id:owner,email:'owner@example.invalid'}},error:null})}},rpc:async(name)=>{
      calls.rpc.push(name);if(name==='ks_prepare_pending_order_alert')return{data:{ok:true,reference:session.id,test_mode:false,status:'prepared',first_attempt_at:receipt.recorded_at,send_payload:{from:'Kristal Streams <noreply@kristalstream.com>',to:['support@kristalstream.com'],reply_to:'owner@example.invalid',subject:'PAID ORDER - Setup pending - Kristal Streams',text:'Payment received. Streaming setup is pending.'}},error:null};
      if(name==='ks_complete_pending_order_alert')return{data:{ok:true,reference:session.id,status:'sent'},error:null};
      calls.legacy++;throw Error('legacy notification RPC forbidden');
    }},fetchImpl:async(url,init)=>{calls.sends++;assert.equal(url,'https://api.resend.com/emails');assert.equal(init.headers['Idempotency-Key'],`ks-setup-pending/v1/${session.id}`);assert.equal(init.redirect,'error');return Response.json({id:'fictional_delivery'});},
  };return{calls,options};
}
const request=(body,authorized=true)=>new Request('https://example.invalid/notify',{method:'POST',headers:{Authorization:authorized?'Bearer fictional-service':'Bearer browser-token','Content-Type':'application/json'},body:JSON.stringify(body)});
await check('notification router uses pending delivery with backend authorization and a fixed recipient',async()=>{
  const f=notificationFixture();const res=await routeOrderNotification(request({sessionId:session.id,protocol:'receipt-only-v1'}),f.options);assert.equal(res.status,200);assert.equal(f.calls.sends,1);assert.equal(f.calls.legacy,0);
  const denied=notificationFixture();assert.equal((await routeOrderNotification(request({sessionId:session.id,protocol:'receipt-only-v1'},false),denied.options)).status,401);assert.equal(denied.calls.sends,0);assert.equal(denied.calls.rpc.length,0);
});
await check('unknown protocols and caller-supplied recipients cannot send an email',async()=>{
  for(const body of[{sessionId:session.id,protocol:'unknown'},{sessionId:session.id,protocol:'receipt-only-v1',to:'other@example.invalid'}]){const f=notificationFixture();assert.equal((await routeOrderNotification(request(body),f.options)).status,400);assert.equal(f.calls.sends,0);}
});
await check('legacy requests retain the existing unactivated-live guard and do not switch email identities',async()=>{
  const f=notificationFixture();const res=await routeOrderNotification(request({sessionId:session.id}),f.options);assert.equal(res.status,409);assert.equal(f.calls.sends,0);assert.equal(f.calls.rpc.length,0);
});
await check('a completed live queue recheck preserves payment and skips pending email without inferring live readiness',async()=>{
  const f=fixture({receipt:{order_status:'setup_complete',replayed:true,queue_replayed:true}});
  const result=await fulfill(session.id,f.context,owner);assert.equal(result.order_status,'requires_review');assert.equal(result.provider_activated,false);assert.equal(f.calls.notifications.length,0);
});
console.log(`${checks} live receipt rollout checks passed with fictional payments and intercepted notification transport. No external requests or mutations.`);
