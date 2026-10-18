import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createPaidTestControlHandler, paidTestScope } from '../_server/ks-paid-test-control.js';
import { createGuardedWorkerFixture } from '../_server/ks-guarded-paid-fixtures.js';
import { createGuardedPaidExecutor } from '../_server/ks-guarded-paid-executor.js';
import { buildPaidPlanMapping } from '../_server/ks-roomba-plan-mapping.js';
import { validatePaidSession } from '../_server/ks-payment-validation.js';
import { parsePaidTestControl } from '../_shared/ks-paid-test-control.js';
import { createPreviewPaidOrdersRouter } from '../_server/ks-preview-paid-orders.js';

const hash = value => createHash('sha256').update(value).digest('hex');
function fixture(patch = {}) {
  const f = createGuardedWorkerFixture(patch.fault);
  const adminUser = { id: f.input.approverId, email: 'djudge47@gmail.com', is_anonymous: false, email_confirmed_at: '2030-01-01' };
  const owner = { id: f.input.ownerId, email: 'fictional.customer@example.invalid' };
  const packages = [1,3,6,12].flatMap((months,i) => Array.from({ length: 5 }, (_,j) => ({ id: String(1000+i*5+j), name: `${months} Months + ${j+1} Connections`, maxConnections: j+1,
    paid: { count: months, unit: 'months', credits: (i+1)*(j+1) }, trial: null, bouquets: [13,14], issues: [] })));
  const entry = buildPaidPlanMapping({ schemaVersion: 1, readOnly: true, checkedAt: new Date(f.now).toISOString(), packages }).entries[0];
  const snapshot = { account: { ...f.review.account }, packages, checkedAt: f.now };
  const scope = { enabled: true, sessionId: f.session.id, ownerId: owner.id, customerEmail: owner.email, resellerId: snapshot.account.id, creditUnits: '1000000' };
  const env = { ...f.env, VERCEL_GIT_COMMIT_REF: 'codex/roomba-https-preview-f00470c0', VERCEL_BRANCH_URL: 'ks-git-test-team.vercel.app',
    VITE_SUPABASE_URL: 'https://fictional.supabase.co', VITE_SUPABASE_ANON_KEY: 'fictional-anon', SUPABASE_SERVICE_ROLE_KEY: 'fictional-service',
    KS_PREVIEW_PAID_TEST_SCOPE: JSON.stringify(scope), ...patch.env };
  const calls = { auth: 0, reads: 0, reviews: 0, reserves: 0, workers: 0 };
  let clock = f.now;
  let saved = patch.saved ? { ...f.row, state: patch.saved } : null;
  f.row.expected_credits = 1;
  f.row.binding_hash = hash(JSON.stringify({ sessionId: f.session.id, ownerId: owner.id, intentId: f.session.payment_intent.id,
    tier: 'bronze', connections: 1, amountCents: 2000, resellerId: snapshot.account.id, packageFingerprint: entry.provider.fingerprint }));
  if (saved) Object.assign(f.row, saved);
  const customerId = owner.id;
  const expected = { reference: scope.sessionId, customerId, tier: 'bronze', connections: 1, interval: 'monthly', amountCents: 2000 };
  const client = (_url,key) => key === env.VITE_SUPABASE_ANON_KEY ? { auth: { getUser: async () => { calls.auth++; return { data: { user: patch.user === undefined ? adminUser : patch.user }, error: null }; } } } : {
    from(table) { assert.equal(table,'ks_preview_provisioning_attempts'); const filters=[]; return { select(columns) { assert.ok(!/envelope|claim_token|password/.test(columns));return this; }, eq(k,v) {filters.push([k,v]);return this;},
      async maybeSingle() { calls.reads++; assert.deepEqual(filters,[['checkout_session_id',scope.sessionId],['user_id',scope.ownerId]]); return { data: patch.badSaved || (saved ? { attempt_id: f.row.attempt_id, user_id: f.row.user_id, checkout_session_id: f.row.checkout_session_id, state: f.row.state } : null), error: patch.readFailure ? {} : null }; } }; },
  };
  const store = { ...f.store,
    async reserve(input) { calls.reserves++; assert.equal(input.ownerId,scope.ownerId); assert.equal(input.newCustomerConfirmed,true); assert.equal(input.resellerId,scope.resellerId); saved=f.row; return {attemptId:f.row.attempt_id,state:f.row.state}; },
    async begin(_attempt,approval) { f.calls.begins++; assert.equal(approval.costUnits,'1000000'); if(f.row.state!=='reserved')return false; f.row.state='dispatching'; if(patch.fault==='lost_begin_reply')throw new Error('MUST_NOT_LEAK'); return true; },
  };
  const provider = { ...f.provider, snapshot: async()=>structuredClone(snapshot), account:async()=>({...snapshot.account,credits:'99.5'}) };
  const execute = createGuardedPaidExecutor({ store, provider, payments: f.payments, env, now:()=>f.now });
  const reviewFactory = ({ captureVerifiedReview }) => async(_req,res) => {
    calls.reviews++;
    if(patch.reviewFailure)return res.status(503).json({error:'Synthetic review unavailable.'});
    const blockers = [...(patch.blockers||[]), ...(saved?['existing_setup_attempt']:[])];
    const context = { adminUser, owner, session:f.session, payment:validatePaidSession(f.session,false,scope.ownerId), snapshot:structuredClone(snapshot), entry, currentPackage:packages[0], attempt:saved?f.row:null, blockers, ...patch.verified };
    captureVerifiedReview(context);
    return res.status(200).json({review:{version:1,adminAccountId:adminUser.id,reference:scope.sessionId,customer:{accountId:owner.id,email:owner.email},
      plan:{tier:'bronze',connections:1,interval:'monthly',amountCents:2000,providerMonths:1,bouquetCount:2},creditCostUnits:'1000000',balanceUnits:'100500000',projectedBalanceUnits:'99500000',
      checkedAt:new Date(f.now).toISOString(),providerCheckedAt:new Date(f.now).toISOString(),blockers,status:blockers.length?'blocked':'review_only',mode:'read-only',previewOnly:true,
      canActivate:false,creditApprovalRecorded:false,approvalTokenIssued:false,databaseWrites:false,realProviderWrites:0}});
  };
  const workerFactory = () => { calls.workers++; return async({accessToken,...input}) => { assert.equal(accessToken,'fictional-token');
    if(patch.workerFailure)throw new Error('MUST_NOT_LEAK'); return execute({...input,approverId:adminUser.id}); }; };
  const handler = createPaidTestControlHandler({ createClient:client,env,now:()=>clock,reviewFactory,storeFactory:()=>store,workerFactory });
  const request = async (action='status', body={}, change={}) => {
    const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(value){this.body=value;return this;}};
    await handler({method:action==='status'?'GET':'POST',headers:{authorization:'Bearer fictional-token',origin:`https://${env.VERCEL_BRANCH_URL}`,'content-type':'application/json'},
      query:{sessionId:scope.sessionId},body:{action,sessionId:scope.sessionId,...body},...change},res);
    assert.equal(res.headers['Cache-Control'],'private, no-store');assert.equal(res.headers.Vary,'Authorization');assert.ok(!JSON.stringify(res.body).includes('MUST_NOT_LEAK'));return res;
  };
  const approve = async()=>{const p=await request('prepare');assert.equal(p.code,200);return p.body.approvalToken;};
  const spend = token=>request('execute',{approvalToken:token,newCustomerConfirmed:true,confirmation:'SPEND 1 CREDIT',creditUnits:'1000000'});
  return {...f,env,scope,callsControl:calls,request,approve,spend,snapshot,expected,adminUser,handler,setSaved:state=>{saved=f.row;f.row.state=state;},setNow:value=>{clock=value;snapshot.checkedAt=value;}};
}
let count=0;const check=async(name,fn)=>{await fn();count++;console.log(`PASS: ${name}`);};
await check('missing scope disables GET and rejects POST before any saved record, review, reservation or worker access',async()=>{
  const f=fixture({env:{KS_PREVIEW_PAID_TEST_SCOPE:undefined}}); const r=await f.request();assert.equal(r.body.state,'disabled');parsePaidTestControl(r.body,f.expected,f.adminUser.id,f.now);
  assert.equal((await f.request('prepare',{enabled:true})).code,409);assert.equal((await f.spend('forged')).code,409);assert.deepEqual(f.callsControl,{auth:3,reads:0,reviews:0,reserves:0,workers:0});
});
await check('scope is exact and cannot enable production, another branch, unknown fields or a larger credit ceiling',()=>{
  const f=fixture();assert.equal(paidTestScope(f.env).ownerId,f.scope.ownerId);
  for(const patch of [{VERCEL_ENV:'production'},{VERCEL_GIT_COMMIT_REF:'main'},{KS_PREVIEW_PAID_TEST_SCOPE:'{}'},
    ...[{creditUnits:'2000000'},{ownerId:'bad'},{sessionId:'cs_live_invalid'},{enabled:false},{extra:true}].map(p=>({KS_PREVIEW_PAID_TEST_SCOPE:JSON.stringify({...f.scope,...p})}))])assert.throws(()=>paidTestScope({...f.env,...patch}));
});
await check('Preview, supported method, bearer and exact administrator gates precede all service data',async()=>{
  for(const [patch,change,code] of [[{env:{VERCEL_ENV:'production'}},{},404],[{},{method:'DELETE'},405],[{},{headers:{}},401],[{user:null},{},401],
    [{user:{id:'00000000-0000-4000-8000-000000000032',email:'other@example.invalid',email_confirmed_at:'2030-01-01',user_metadata:{role:'admin'}}},{},403]]){
    const f=fixture(patch);assert.equal((await f.request('status',{},change)).code,code);assert.equal(f.callsControl.reads,0);assert.equal(f.callsControl.reviews,0);assert.equal(f.callsControl.workers,0);
  }
});
await check('write requests require the known same-origin JSON form and ignore forged scope fields',async()=>{
  for(const headers of [{authorization:'Bearer fictional-token','content-type':'application/json'},
    {authorization:'Bearer fictional-token',origin:'https://evil.example','content-type':'application/json'},
    {authorization:'Bearer fictional-token',origin:'https://ks-git-test-team.vercel.app','content-type':'text/plain'}]){
    const f=fixture();assert.ok((await f.request('prepare',{ownerId:'forged',enabled:true},{headers})).code>=400);assert.equal(f.callsControl.reviews,0);assert.equal(f.callsControl.reserves,0);
  }
});
await check('only the configured sandbox order can access the test control',async()=>{
  const f=fixture();assert.equal((await f.request('status',{}, {query:{sessionId:'cs_test_Other'}})).code,403);assert.equal(f.callsControl.reads,0);
});
await check('status reads whitelist state and never expose envelopes, claim tokens, provider login or an approval',async()=>{
  for(const [saved,state] of [[null,'not_started'],['reserved','reserved'],['dispatching','processing'],['provider_verified','completion_pending'],['credentials_ready','complete'],['reconciliation_required','reconciliation_required']]){
    const f=fixture({saved});const r=await f.request();assert.equal(r.code,200);assert.equal(r.body.state,state);parsePaidTestControl(r.body,f.expected,f.adminUser.id,f.now);assert.equal(r.body.approvalToken,undefined);assert.equal(f.callsControl.workers,0);
  }
});
await check('a fresh review issues a two-minute bound token without reserving an attempt or calling the worker',async()=>{
  const f=fixture();const r=await f.request('prepare');assert.equal(r.code,200);const p=parsePaidTestControl(r.body,f.expected,f.adminUser.id,f.now);assert.equal(p.review.creditCostUnits,'1000000');assert.equal(p.canExecute,true);assert.equal(f.callsControl.reserves,0);assert.equal(f.callsControl.workers,0);
});
await check('prior access, customer changes, package changes and larger prices cannot prepare or execute',async()=>{
  const b=fixture();
  for(const patch of [{blockers:['prior_trial_activity']},{blockers:['existing_website_access']},{verified:{owner:{id:b.input.approverId,email:'other@example.invalid'}}},
    {verified:{payment:{...validatePaidSession(b.session,false,b.input.ownerId),cents:4500}}},{verified:{snapshot:{...b.snapshot,account:{...b.snapshot.account,id:'88888'}}}}]){
    const f=fixture(patch);assert.equal((await f.request('prepare')).code,409);assert.equal(f.callsControl.reserves,0);assert.equal(f.callsControl.workers,0);
  }
});
await check('credit spend needs the signed review, explicit new-customer attestation and exact one-credit confirmation',async()=>{
  for(const patch of [{newCustomerConfirmed:false},{confirmation:''},{creditUnits:'2000000'},{approvalToken:'forged'}]){
    const f=fixture();const token=await f.approve();const r=await f.request('execute',{approvalToken:token,newCustomerConfirmed:true,confirmation:'SPEND 1 CREDIT',creditUnits:'1000000',...patch});assert.ok(r.code>=400);assert.equal(f.callsControl.reserves,0);assert.equal(f.calls.creates,0);
  }
});
await check('changed balance and expired or mismatched reviews stop before reservation or dispatch',async()=>{
  const f=fixture();const token=await f.approve();f.snapshot.account.credits='101.5';assert.ok((await f.spend(token)).code>=400);assert.equal(f.callsControl.reserves,0);assert.equal(f.calls.creates,0);
  const a=fixture(),b=fixture({verified:{adminUser:{id:'00000000-0000-4000-8000-000000000099'}}});assert.ok((await b.spend(await a.approve())).code>=400);assert.equal(b.calls.creates,0);
  const expired=fixture();const old=await expired.approve();expired.setNow(expired.now+120001);assert.ok((await expired.spend(old)).code>=400);assert.equal(expired.callsControl.reserves,0);assert.equal(expired.calls.creates,0);
});
await check('the handler reaches the real guarded core with one reservation, one fictional creation and one local completion',async()=>{
  const f=fixture();const r=await f.spend(await f.approve());assert.equal(r.code,200);assert.equal(r.body.state,'complete');assert.equal(f.calls.creates,1);assert.equal(f.calls.completed,1);assert.equal(f.callsControl.reserves,1);parsePaidTestControl(r.body,f.expected,f.adminUser.id,f.now);
  assert.equal((await f.request()).body.state,'complete');assert.equal((await f.spend('invalid')).code,409);assert.equal(f.calls.creates,1);
});
await check('concurrent approved submits cannot create twice and the durable status remains queryable',async()=>{
  const f=fixture();const token=await f.approve();await Promise.all(Array.from({length:8},()=>f.spend(token)));assert.equal(f.calls.creates,1);assert.equal(f.calls.completed,1);assert.equal((await f.request()).body.state,'complete');
});
await check('ambiguous provider results stay stopped and are never resent by status, preparation or completion',async()=>{
  const f=fixture({fault:'timeout'});const first=await f.spend(await f.approve());assert.equal(first.body.state,'reconciliation_required');assert.equal((await f.request()).body.state,'reconciliation_required');assert.equal((await f.request('prepare')).code,409);assert.equal((await f.request('complete')).code,409);assert.equal(f.calls.creates,1);assert.equal(f.calls.completed,0);
});
await check('a lost durable dispatch acknowledgement stays processing and sends no provider request',async()=>{
  const f=fixture({fault:'lost_begin_reply'});assert.equal((await f.spend(await f.approve())).code,503);assert.equal((await f.request()).body.state,'processing');assert.equal((await f.request('prepare')).code,409);assert.equal((await f.request('complete')).code,409);assert.equal(f.calls.creates,0);
});
await check('verified local completion can retry without a token and without another provider creation',async()=>{
  const f=fixture({fault:'completion_failure'});assert.equal((await f.spend(await f.approve())).body.state,'completion_pending');assert.equal((await f.request('complete')).body.state,'complete');assert.equal(f.calls.creates,1);assert.equal(f.calls.completed,1);
  const r=fixture({saved:'reserved'});assert.equal((await r.request('complete')).code,409);assert.equal(r.calls.creates,0);
});
await check('saved reserved attempts can get a new approval but still use their original immutable reservation',async()=>{
  const f=fixture({saved:'reserved'}); // Use the one-credit fixture binding rather than the original larger-cost fixture.
  f.row.expected_credits=1;f.row.binding_hash=hash(JSON.stringify({sessionId:f.session.id,ownerId:f.scope.ownerId,intentId:f.session.payment_intent.id,tier:'bronze',connections:1,amountCents:2000,resellerId:f.scope.resellerId,packageFingerprint:buildPaidPlanMapping({schemaVersion:1,readOnly:true,checkedAt:new Date(f.now).toISOString(),packages:f.snapshot.packages}).entries[0].provider.fingerprint}));
  const r=await f.request('prepare');assert.equal(r.body.resumeReserved,true);parsePaidTestControl(r.body,f.expected,f.adminUser.id,f.now);assert.equal((await f.spend(r.body.approvalToken)).body.state,'complete');assert.equal(f.calls.creates,1);
});
await check('storage, inspection and worker errors remain sanitized and never claim a successful activation',async()=>{
  for(const patch of [{readFailure:true},{badSaved:{attempt_id:'bad'}},{reviewFailure:true},{workerFailure:true}]){
    const f=fixture(patch);const r=patch.workerFailure?await f.spend(await f.approve()):patch.reviewFailure?await f.request('prepare'):await f.request();assert.ok(r.code>=400);assert.equal(r.body.state,undefined);assert.equal(f.calls.creates,0);
  }
});
await check('browser parser rejects forged readiness, wrong accounts, missing token, expired quote and unknown states',async()=>{
  const f=fixture();const r=await f.request('prepare');const base=r.body;
  for(const patch of [{reference:'cs_test_Other'},{customerId:f.input.approverId},{adminAccountId:f.input.ownerId},{canExecute:false},{previewOnly:false},{approvalToken:undefined},{expiresAt:'2000-01-01'},{state:'unsafe'},
    {review:{...base.review,creditCostUnits:'2000000'}}])assert.throws(()=>parsePaidTestControl({...base,...patch},f.expected,f.adminUser.id,f.now));
  assert.equal(parsePaidTestControl({...base,password:'MUST_NOT_LEAK'},f.expected,f.adminUser.id,f.now).password,undefined);
});
await check('shared routing preserves the old GET-only review and sends only the explicit new view to its gated handler',async()=>{
  const f=fixture({env:{KS_PREVIEW_PAID_TEST_SCOPE:undefined}});let old=0;
  const router=createPreviewPaidOrdersRouter({listHandler:()=>{},simulationHandler:()=>{},activationReviewHandler:()=>{old++;},paidTestControlHandler:f.handler});
  const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
  await router({method:'GET',headers:{authorization:'Bearer fictional-token'},query:{view:'paid-test-control',sessionId:f.scope.sessionId}},res);assert.equal(res.body.state,'disabled');
  await router({query:{view:'activation-review'}},res);assert.equal(old,1);assert.equal(f.calls.creates,0);
});
console.log(`${count} bounded paid-test control checks passed. All customer, payment, provider, email and storage effects were fictional; no real line, credit spend or account change occurred.`);
