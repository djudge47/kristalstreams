import assert from 'node:assert/strict';
import { fulfill } from '../_server/ks-payments.js';
import { createPreviewPaidOrdersHandler, paidOrderSnapshot, queuePreviewPaidOrder } from '../_server/ks-preview-paid-orders.js';
const userId = '00000000-0000-4000-8000-000000000001';
const session = { id: 'cs_test_pending1', livemode: false, mode: 'payment', status: 'complete', payment_status: 'paid', currency: 'usd', amount_total: 2000, amount_subtotal: 2000, payment_intent: 'pi_pending1', metadata: { user_id: userId, plan: 'bronze', connections: '1', interval: 'monthly', price: '20', duration_days: '30' } };
const row = { sessionId: session.id, userId, testMode: true, tier: 'bronze', connections: 1, amountCents: 2000, currency: 'usd', receiptDurationDays: 30, websiteActivated: false, orderStatus: 'awaiting_activation', recordedAt: '2026-10-17T13:00:00Z', queuedAt: '2026-10-17T14:00:00Z', accountLabel: 'Synthetic account' };
let checks = 0;
async function check(name, test) { await test(); checks++; console.log(`PASS: ${name}`); }
const response = () => ({ headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(code) { this.code=code; return this; }, json(body) { this.body=body; return this; } });
const env = { VERCEL_ENV:'preview', VITE_SUPABASE_URL:'https://synthetic.supabase.co', VITE_SUPABASE_ANON_KEY:'fake-anon', SUPABASE_SERVICE_ROLE_KEY:'fake-server' };
const user = { id:userId, email:'djudge47@gmail.com', email_confirmed_at:'2026-01-01', is_anonymous:false };
let reads = 0;
const handler = (who=user, settings=env, rows=[row], error=null) => createPreviewPaidOrdersHandler({ env:settings, createClient:(_url,key) => key==='fake-anon' ? { auth:{ getUser:async()=>({data:{user:who},error:null}) } } : { rpc:async(name)=>{ reads++; assert.equal(name,'ks_list_preview_paid_orders'); return {data:rows,error}; } } });
const req = { method:'GET', headers:{authorization:'Bearer fake-token'} };
await check('Production, writes, missing login and non-administrators cannot access saved orders', async()=>{
  for(const [h,r,code] of [[handler(user,{...env,VERCEL_ENV:'production'}),req,404],[handler(),{...req,method:'POST'},405],[handler(),{method:'GET',headers:{}},401],[handler({...user,email:'other@example.invalid',user_metadata:{role:'admin'}}),req,403],[handler({...user,email_confirmed_at:null}),req,403],[handler({...user,is_anonymous:true}),req,403]]) { const res=response(); await h(r,res); assert.equal(res.code,code); }
  assert.equal(reads,0);
});
await check('authorized reads return only saved payment fields and no credentials or arbitrary metadata', async()=>{
  const res=response(); await handler(user,env,[{...row,password:'secret-marker',api_key:'secret-marker',providerPayload:'secret-marker'}])(req,res);
  assert.equal(res.code,200); assert.equal(res.headers['Cache-Control'],'private, no-store'); assert.equal(res.body.orders[0].providerActivated,false);
  assert.ok(!JSON.stringify(res.body).includes('secret-marker'));
});
await check('malformed, live, activated or mismatched receipts never appear as valid pending test orders', async()=>{
  for(const patch of [{testMode:false},{websiteActivated:true},{amountCents:1},{currency:'eur'},{receiptDurationDays:365},{orderStatus:'active'},{userId:'bad'},{queuedAt:'bad'}]) assert.throws(()=>paidOrderSnapshot([{...row,...patch}]));
  const res=response(); await handler(user,env,null,{message:'private database detail'})(req,res); assert.equal(res.code,503); assert.ok(!JSON.stringify(res.body).includes('private database detail'));
});
await check('only validated paid Preview sessions reach the queue, bound to their account ID', async()=>{
  let calls=0; const context={environment:'preview',live:false,admin:{rpc:async(_name,args)=>{calls++;assert.deepEqual(args,{p_session_id:session.id,p_user_id:userId});return {data:{ok:true,order_status:'awaiting_activation',test_mode:true,provider_activated:false},error:null};}}};
  for(const changed of [{...session,payment_status:'unpaid'},{...session,amount_total:1},{...session,livemode:true}]) await assert.rejects(()=>queuePreviewPaidOrder(changed,context,userId));
  await assert.rejects(()=>queuePreviewPaidOrder(session,context,'00000000-0000-4000-8000-000000000002')); assert.equal(calls,0);
  assert.equal((await queuePreviewPaidOrder(session,context,userId)).order_status,'awaiting_activation'); assert.equal(calls,1);
  assert.equal(await queuePreviewPaidOrder(session,{...context,environment:'production',live:true},userId),null); assert.equal(calls,1);
});

const receipts=new Set(), orders=new Set(), notifications=new Set(); let failQueue=false, alertAttempts=0;
const context={environment:'preview',live:false,stripe:{checkout:{sessions:{retrieve:async()=>session}}},admin:{
  rpc:async(name,args)=>{
    if(name==='ks_apply_paid_checkout'){receipts.add(args.p_session_id);return {data:{ok:true,test_mode:true,activated:false},error:null};}
    assert.equal(name,'ks_queue_preview_paid_order');
    if(failQueue)return {data:null,error:{message:'synthetic storage failure'}};
    orders.add(args.p_session_id);return {data:{ok:true,order_status:'awaiting_activation',test_mode:true,provider_activated:false},error:null};
  }, functions:{invoke:async(name,{body})=>{assert.equal(name,'ks-order-notification');alertAttempts++;notifications.add(body.sessionId);return {data:{success:true},error:null};}},
}};
await check('webhook and owner confirmation share duplicate-safe payment, queue and notification flow', async()=>{
  const result=await Promise.all([fulfill(session.id,context),fulfill(session.id,context,userId)]);
  assert.equal(receipts.size,1);assert.equal(orders.size,1);assert.equal(notifications.size,1);
  for(const r of result){assert.equal(r.order_status,'awaiting_activation');assert.equal(r.activated,false);assert.equal(r.provider_activated,false);}
});
await check('queue failure preserves receipt and reports retry without false activation or sending an alert', async()=>{
  failQueue=true;const attempts=alertAttempts;
  await assert.rejects(()=>fulfill(session.id,context,userId),/do not pay again/);
  assert.equal(receipts.size,1);assert.equal(orders.size,1);assert.equal(alertAttempts,attempts);
  failQueue=false;assert.equal((await fulfill(session.id,context,userId)).provider_activated,false);
});
console.log(`${checks} pending-order checks passed. No real Stripe, provider, database or email calls.`);
