import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {completeReviewedPreviewSetup} from '../_server/ks-reviewed-preview-completion.js';
import {createGuardedWorkerFixture} from '../_server/ks-guarded-paid-fixtures.js';
let checks=0;
async function check(label,fn){await fn();checks++;console.log(`PASS: ${label}`);}
function fixture(){
  const old=createGuardedWorkerFixture(),calls={stripe:0,auth:0,rpc:0};
  const input={claimId:'00000000-0000-4000-8000-000000000091',attemptId:old.input.attemptId,ownerId:old.input.ownerId,claimToken:old.row.claim_token,sessionId:old.session.id,username:old.login.username};
  const env={VERCEL_ENV:'preview',KS_REVIEWED_PREVIEW_COMPLETION:'enabled-v1'};
  const user={id:input.ownerId,email:'one@example.invalid',is_anonymous:false,email_confirmed_at:'2029-01-01T00:00:00Z'};
  const profile={id:user.id,email:user.email};
  const response={ok:true,state:'credentials_ready',claim_id:input.claimId,attempt_id:input.attemptId,reference:input.sessionId,account_id:input.ownerId,expires_at:new Date(old.now+31*86400000).toISOString(),may_dispatch:false,replayed:false};
  const admin={auth:{admin:{async getUserById(id){calls.auth++;assert.equal(id,user.id);return {data:{user},error:null};}}},
    from(table){assert.equal(table,'profiles');return {select(fields){assert.equal(fields,'id,email');return this;},eq(field,value){assert.equal(field,'id');assert.equal(value,user.id);return this;},async maybeSingle(){return {data:profile,error:null};}};},
    async rpc(name,args){calls.rpc++;assert.equal(name,'ks_complete_reviewed_preview_setup');assert.deepEqual(args,{p_claim_id:input.claimId,p_attempt_id:input.attemptId,p_claim_token:input.claimToken,p_user_id:input.ownerId,p_username:input.username});return {data:response,error:null};}};
  const stripe={checkout:{sessions:{async retrieve(id,options){calls.stripe++;assert.equal(id,input.sessionId);assert.deepEqual(options,{expand:['payment_intent.latest_charge']});return old.session;}}}};
  const options={admin,stripe,env,now:old.now};
  return {input,options,calls,user,profile,response,session:old.session,run:()=>completeReviewedPreviewSetup(input,options)};
}
await check('unset configuration and production stop before reading any input or contacting a backend',async()=>{
  const untouched=new Proxy({},{ownKeys(){throw new Error('must_not_read');}});
  for(const env of [{},{VERCEL_ENV:'production',KS_REVIEWED_PREVIEW_COMPLETION:'enabled-v1'},{VERCEL_ENV:'preview'}])assert.deepEqual(await completeReviewedPreviewSetup(untouched,{env}),{state:'disabled',mayDispatch:false});
});
await check('fresh expanded sandbox settlement and confirmed owner precede the one atomic completion RPC',async()=>{
  const f=fixture();assert.equal((await f.run()).state,'credentials_ready');assert.deepEqual(f.calls,{stripe:1,auth:1,rpc:1});
});
await check('unknown fields, malformed identifiers and non-test checkout references cannot reach Stripe or the database',async()=>{
  for(const patch of [{password:'MUST_NOT_LEAK'},{claimId:'bad'},{sessionId:'cs_live_Forbidden'},{username:'bad\nname'}]){
    const f=fixture();await assert.rejects(()=>completeReviewedPreviewSetup({...f.input,...patch},f.options),/reviewed_preview_completion_unavailable/);assert.equal(f.calls.stripe,0);
  }
});
await check('unpaid, refunded and live payments cannot reach completion',async()=>{
  for(const mutate of [s=>{s.payment_status='unpaid';},s=>{s.payment_intent.latest_charge.refunded=true;},s=>{s.livemode=true;}]){
    const f=fixture();mutate(f.session);await assert.rejects(f.run,/reviewed_preview_completion_unavailable/);assert.equal(f.calls.auth,0);assert.equal(f.calls.rpc,0);
  }
});
await check('unconfirmed or anonymous owners and mismatched profile email cannot complete',async()=>{
  for(const mutate of [f=>{f.user.email_confirmed_at=null;},f=>{f.user.is_anonymous=true;},f=>{f.profile.email='other@example.invalid';}]){
    const f=fixture();mutate(f);await assert.rejects(f.run,/reviewed_preview_completion_unavailable/);assert.equal(f.calls.rpc,0);
  }
});
await check('response binding and capability checks reject forged readiness from storage',async()=>{
  for(const patch of [{account_id:'00000000-0000-4000-8000-000000000099'},{reference:'cs_test_Other'},{attempt_id:'wrong'},
    {claim_id:'wrong'},{may_dispatch:true},{replayed:'false'},{expires_at:'2020-01-01'},{state:'provider_verified'}]){
    const f=fixture();Object.assign(f.response,patch);await assert.rejects(f.run,/reviewed_preview_completion_unavailable/);
  }
});
await check('completed database replay is allowed only after fresh payment and owner checks',async()=>{
  const f=fixture();f.response.replayed=true;assert.equal((await f.run()).replayed,true);assert.equal(f.calls.stripe,1);assert.equal(f.calls.auth,1);
});
await check('unexpected storage fields and backend error details never reach callers',async()=>{
  const f=fixture();f.response.password='MUST_NOT_LEAK';assert.ok(!JSON.stringify(await f.run()).includes('MUST_NOT_LEAK'));
  f.options.admin.rpc=async()=>{throw new Error('MUST_NOT_LEAK');};await assert.rejects(f.run,error=>error.message==='reviewed_preview_completion_unavailable');
});
await check('completion remains unrouted and imports no provider write adapter; the project keeps twelve functions',async()=>{
  const source=await readFile(new URL('../_server/ks-reviewed-preview-completion.js',import.meta.url),'utf8');assert.doesNotMatch(source,/ks-paid-provider|create_line|fetch\(/);
  const files=(await readdir(new URL('../api/',import.meta.url))).filter(name=>/\.(js|ts)$/.test(name));assert.equal(files.length,12);
  for(const name of files)assert.doesNotMatch(await readFile(new URL(`../api/${name}`,import.meta.url),'utf8'),/ks-reviewed-preview-completion/);
});
console.log(`${checks} completion adapter checks passed. No real payment, provider, database write or email was performed.`);
