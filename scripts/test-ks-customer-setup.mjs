import assert from 'node:assert/strict';
import { createClient as realCreateClient } from '@supabase/supabase-js';
import { completionFixture } from './fixtures/ks-completion-status.mjs';
import { createCustomerSetupHandler, customerSetupSnapshot } from '../_server/ks-customer-setup.js';

const owner='00000000-0000-4000-8000-000000000001';
const other='00000000-0000-4000-8000-000000000002';
const user={id:owner,email:'customer@example.invalid',email_confirmed_at:'2026-01-01',is_anonymous:false};
const receipt={checkout_session_id:'cs_test_customerSetup1',user_id:owner,livemode:false,tier:'bronze',connections:1,duration_days:30,amount_cents:2000,currency:'usd',activated:false,expires_at:null,recorded_at:'2026-10-17T12:00:00Z'};
const row={checkout_session_id:receipt.checkout_session_id,fulfillment_status:'awaiting_activation',queued_at:'2026-10-17T13:00:00Z',receipt};
const env={VERCEL_ENV:'preview',VITE_SUPABASE_URL:'https://synthetic.supabase.co',VITE_SUPABASE_ANON_KEY:'fake-anon',SUPABASE_SERVICE_ROLE_KEY:'SERVER_SECRET'};
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
function fixture(patch={}){
  const calls={auth:0,service:0,requests:[]};
  // Real SDK constructs the PostgREST URL; fetch is intercepted before network.
  const admin=realCreateClient(env.VITE_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,options)=>{
    const url=new URL(typeof input==='string'?input:input.url);calls.requests.push({url,options});
    assert.equal(options.method,'GET');const proof=url.pathname==='/rest/v1/ks_preview_paid_fulfillments';
    if(!proof)assert.equal(url.pathname,patch.env?.VERCEL_ENV==='production'?'/rest/v1/ks_setup_order_queue':'/rest/v1/ks_preview_paid_orders');
    if(proof){assert.ok(patch.proofs!==undefined);return Response.json(patch.proofs);}
    return new Response(JSON.stringify(patch.storageError?{message:'SERVER_SECRET',code:'DB_UNAVAILABLE'}:patch.rows===undefined?[row]:patch.rows),{status:patch.storageError?503:200,headers:{'Content-Type':'application/json'}});
  }}});
  const createClient=(_url,key)=>{
    if(key===env.VITE_SUPABASE_ANON_KEY)return{auth:{getUser:async token=>{calls.auth++;assert.equal(token,'synthetic-token');if(patch.authThrows)throw new Error('SERVER_SECRET');return{data:{user:patch.user===undefined?user:patch.user},error:patch.authError?{}:null};}}};
    assert.equal(key,env.SUPABASE_SERVICE_ROLE_KEY);calls.service++;return admin;
  };
  const handler=createCustomerSetupHandler({createClient,env:{...env,...patch.env},now:()=>Date.parse('2026-10-17T14:00:00Z')});
  return{calls,async request(patchReq={}){
    const res=response();await handler({method:'GET',headers:{authorization:'Bearer synthetic-token'},query:{userId:other,sessionId:'cs_test_other',mode:'live',action:'activate',email:'other@example.invalid'},body:{user_id:other,confirmed:true},...patchReq},res);
    const output=JSON.stringify(res.body);assert.ok(!output.includes('SERVER_SECRET'));return res;
  }};
}
let checks=0;async function check(name,fn){await fn();checks++;console.log(`PASS: ${name}`);}
await check('environment, method and bearer checks run before service data access',async()=>{
  for(const envPatch of[{VERCEL_ENV:'development'},{VERCEL_ENV:undefined}]){const f=fixture({env:envPatch});assert.equal((await f.request()).code,404);assert.equal(f.calls.auth,0);assert.equal(f.calls.service,0);}
  for(const method of['POST','PATCH','DELETE','OPTIONS']){const f=fixture();const res=await f.request({method});assert.equal(res.code,405);assert.equal(res.headers.Allow,'GET');assert.equal(f.calls.service,0);}
  for(const authorization of['','Bearer','Bearer fake token']){const f=fixture();assert.equal((await f.request({headers:{authorization}})).code,401);assert.equal(f.calls.service,0);}
  const f=fixture({env:{SUPABASE_SERVICE_ROLE_KEY:''}});assert.equal((await f.request()).code,503);assert.equal(f.calls.service,0);
});
await check('a confirmed customer can read their orders without administrator privileges',async()=>{
  const f=fixture();const res=await f.request();assert.equal(res.code,200);assert.equal(res.headers['Cache-Control'],'private, no-store');assert.equal(res.headers.Vary,'Authorization');
  assert.equal(res.body.accountId,owner);assert.equal(res.body.mode,'read-only');assert.equal(res.body.testMode,true);assert.equal(res.body.orders.length,1);
  assert.deepEqual(res.body.orders[0],{reference:receipt.checkout_session_id,tier:'bronze',interval:'monthly',connections:1,amountCents:2000,currency:'usd',recordedAt:receipt.recorded_at,status:'awaiting_activation',testMode:true,providerActivated:false});
  const url=f.calls.requests[0].url;assert.equal(url.searchParams.get('receipt.user_id'),`eq.${owner}`);assert.equal(url.searchParams.get('receipt.livemode'),'eq.false');assert.equal(url.searchParams.get('receipt.activated'),'eq.false');assert.equal(url.searchParams.get('receipt.expires_at'),'is.null');assert.equal(url.searchParams.get('fulfillment_status'),'in.(awaiting_activation,setup_complete)');assert.equal(url.searchParams.get('limit'),'5');assert.equal(url.searchParams.get('order'),'queued_at.desc,checkout_session_id.asc');
  const selection=url.searchParams.get('select');assert.ok(selection.includes('receipt:ks_payment_receipts!inner('));assert.ok(!selection.includes('*'));assert.ok(!selection.includes('payment_intent_id'));assert.ok(!url.toString().includes(other));
});
await check('expired, unconfirmed, anonymous and malformed identities cannot read service data',async()=>{
  for(const patch of[{user:null},{authError:true},{authThrows:true},{user:{...user,id:'invalid'}},{user:{...user,email_confirmed_at:null}},{user:{...user,is_anonymous:true}}]){const f=fixture(patch);assert.ok((await f.request()).code>=400);assert.equal(f.calls.service,0);assert.equal(f.calls.requests.length,0);}
});
await check('another account’s row is rejected even if storage ignores the owner filter',async()=>{
  const f=fixture({rows:[{...row,receipt:{...receipt,user_id:other}}]});const res=await f.request();assert.equal(res.code,503);assert.equal(res.body.orders,undefined);assert.ok(!JSON.stringify(res.body).includes(other));
});
await check('wrong environment, activated, price, duration and queue mismatches never become pending status',async()=>{
  for(const change of[{livemode:true},{activated:true},{expires_at:'2026-11-01T00:00:00Z'},{amount_cents:1},{duration_days:90},{connections:1.5},{tier:'unknown'},{currency:'eur'},{checkout_session_id:'cs_live_wrong'},{recorded_at:'bad'}])assert.throws(()=>customerSetupSnapshot([{...row,receipt:{...receipt,...change}}],owner));
  for(const change of[{fulfillment_status:'active'},{checkout_session_id:'cs_test_other'},{queued_at:'bad'},{receipt:null},{receipt:[receipt]}])assert.throws(()=>customerSetupSnapshot([{...row,...change}],owner));
});
await check('empty, duplicate, oversized and credential-bearing results are handled safely',async()=>{
  const empty=await fixture({rows:[]}).request();assert.equal(empty.code,200);assert.deepEqual(empty.body.orders,[]);assert.equal(empty.body.activated,undefined);
  assert.throws(()=>customerSetupSnapshot([row,row],owner));assert.throws(()=>customerSetupSnapshot(Array(6).fill(row),owner));assert.throws(()=>customerSetupSnapshot(null,owner));
  const res=await fixture({rows:[{...row,password:'PRIVATE_PASSWORD',receipt:{...receipt,payment_intent_id:'PRIVATE_INTENT',email:'PRIVATE_EMAIL',password:'PRIVATE_PASSWORD'}}]}).request();assert.equal(res.code,200);const text=JSON.stringify(res.body);for(const marker of['PRIVATE_PASSWORD','PRIVATE_INTENT','PRIVATE_EMAIL'])assert.ok(!text.includes(marker));
  assert.equal(res.body.orders[0].expiresAt,undefined);assert.equal(res.body.orders[0].username,undefined);
});
await check('storage errors never imply missing payment, service readiness or a second payment request',async()=>{
  const res=await fixture({storageError:true}).request();assert.equal(res.code,503);assert.equal(res.body.orders,undefined);assert.ok(res.body.error.includes('do not pay again'));
});
await check('opt-in live pending status is scoped to the authenticated owner and excludes Sandbox orders',async()=>{
  const liveReceipt={...receipt,checkout_session_id:'cs_live_customerSetup1',livemode:true};
  const liveRow={...row,checkout_session_id:liveReceipt.checkout_session_id,receipt:liveReceipt};
  const f=fixture({env:{VERCEL_ENV:'production',KS_LIVE_RECEIPT_ONLY_ENABLED:'true'},rows:[liveRow]});
  const res=await f.request();assert.equal(res.code,200);assert.equal(res.body.testMode,false);
  assert.equal(res.body.orders[0].status,'awaiting_activation');assert.equal(res.body.orders[0].providerActivated,false);
  const url=f.calls.requests[0].url;assert.equal(url.searchParams.get('receipt.user_id'),`eq.${owner}`);
  assert.equal(url.searchParams.get('receipt.livemode'),'eq.true');assert.equal(url.searchParams.get('fulfillment_status'),'in.(awaiting_activation,requires_review,setup_complete)');
  assert.equal(url.searchParams.get('receipt.activated'),null);assert.equal(url.searchParams.get('limit'),'5');
  assert.throws(()=>customerSetupSnapshot([row],owner,true));
  assert.throws(()=>customerSetupSnapshot([{...liveRow,receipt:{...liveReceipt,user_id:other}}],owner,true));
});
await check('live legacy entitlements require review and never become a provider-ready signal',async()=>{
  const legacy={...row,checkout_session_id:'cs_live_Legacy',fulfillment_status:'requires_review',receipt:{...receipt,checkout_session_id:'cs_live_Legacy',livemode:true,activated:true,expires_at:'2026-11-01T00:00:00Z'}};
  const result=customerSetupSnapshot([legacy],owner,true)[0];assert.equal(result.status,'requires_review');assert.equal(result.providerActivated,false);assert.equal(result.expiresAt,undefined);
  assert.throws(()=>customerSetupSnapshot([{...legacy,fulfillment_status:'awaiting_activation'}],owner,true));
  assert.equal(customerSetupSnapshot([{...legacy,fulfillment_status:'setup_complete'}],owner,true)[0].status,'requires_review');
});
await check('an accepted live order stays readable when the new-order rollout flag is paused',async()=>{
  for(const flag of[undefined,'false','1','TRUE']){const f=fixture({env:{VERCEL_ENV:'production',KS_LIVE_RECEIPT_ONLY_ENABLED:flag},rows:[]});assert.equal((await f.request()).code,200);assert.equal(f.calls.service,1);}
});
await check('completed and expired owner orders require independently bound proof and remain distinct from pending orders',async()=>{
  const f=completionFixture(Date.parse('2026-10-17T14:00:00Z'));
  const completed={checkout_session_id:f.reference,fulfillment_status:'setup_complete',queued_at:f.receipt.recorded_at,receipt:f.receipt};
  const client=fixture({rows:[row,completed],proofs:[f.row]});const res=await client.request();
  assert.equal(res.code,200);assert.equal(res.body.orders[0].status,'awaiting_activation');assert.equal(res.body.orders[1].status,'setup_complete');assert.equal(res.body.orders[1].providerActivated,true);assert.equal(res.body.orders[1].expiresAt,f.expiresAt);assert.equal(client.calls.requests.length,2);
  f.row.completed_at=f.receipt.recorded_at=new Date(f.now-32*86400000).toISOString();
  f.row.attempt.provider_expires_at=f.row.customer.expiration_at=new Date(f.now-86400000).toISOString();
  const expired=await fixture({rows:[completed],proofs:[f.row]}).request();assert.equal(expired.code,200);assert.equal(expired.body.orders[0].status,'setup_expired');assert.equal(expired.body.orders[0].providerActivated,false);
});
await check('missing or foreign completion proof never hides a completed queue as an empty or pending result',async()=>{
  const f=completionFixture(Date.parse('2026-10-17T14:00:00Z'));
  const completed={checkout_session_id:f.reference,fulfillment_status:'setup_complete',queued_at:f.receipt.recorded_at,receipt:f.receipt};
  for(const proofs of [[],[{...f.row,user_id:other}],[{...f.row,login:{...f.row.login,user_id:other}}]]){
    const res=await fixture({rows:[completed],proofs}).request();assert.equal(res.code,503);assert.equal(res.body.orders,undefined);assert.ok(res.body.error.includes('do not pay again'));
  }
});
console.log(`${checks} customer setup checks passed. Real SDK query construction with synthetic auth/storage only; no network, charges, provider calls or database mutations.`);
