import assert from 'node:assert/strict';
import { buildTrialUpgradeReview, createPreviewTrialUpgradeHandler } from '../_server/ks-preview-trial-upgrade.js';
const userId='00000000-0000-4000-8000-000000000001';
const otherId='00000000-0000-4000-8000-000000000002';
const row={sessionId:'cs_test_upgradeReview1',userId,testMode:true,tier:'bronze',connections:1,amountCents:2000,currency:'usd',receiptDurationDays:30,websiteActivated:false,orderStatus:'awaiting_activation',recordedAt:'2026-10-17T12:00:00Z',queuedAt:'2026-10-17T13:00:00Z',accountLabel:'Synthetic account'};
const setup={status:'linked',packageId:'1',connections:1,resellerId:'888',lineId:'999001',username:'synthetic_trial',customerId:'00000000-0000-4000-8000-000000000003',expiresAt:'2026-10-18T12:00:00Z'};
const packages=[{id:'1',name:'Trial',maxConnections:1,paid:null,trial:{count:36,unit:'hours',credits:0},bouquets:[13,14],issues:[]},...[1,3,6,12].flatMap((months,i)=>Array.from({length:5},(_,j)=>({id:String(1000+i*5+j),name:`${months} Months + ${j+1} Connections`,maxConnections:j+1,paid:{count:months,unit:'months',credits:(i+1)*(j+1)},trial:null,bouquets:[13,14],issues:[]})))];
const checkedAt='2026-10-17T14:00:00Z';
const env={VERCEL_ENV:'preview',VITE_SUPABASE_URL:'https://synthetic.supabase.co',VITE_SUPABASE_ANON_KEY:'fake-anon',SUPABASE_SERVICE_ROLE_KEY:'fake-server',ROOMBA_PREVIEW_SECRET:'fake-private-secret'};
const user={id:userId,email:'djudge47@gmail.com',email_confirmed_at:'2026-01-01',is_anonymous:false};
const account={id:'888',username:'synthetic_reseller',credits:25};
const line={id:setup.lineId,username:setup.username,resellerId:'888',packageId:'1',trial:true,connections:1,expiresAt:setup.expiresAt,enabled:true,adminEnabled:true,bouquetIds:[13,14]};
let storage=0,saved=0,provider=0,accounts=0,lines=0;
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
const make=(patch={})=>createPreviewTrialUpgradeHandler({
  env:patch.env||env, now:patch.now||(()=>Date.parse(checkedAt)),
  createClient:(_url,key)=>key==='fake-anon'?{auth:{getUser:async()=>({data:{user:patch.user===undefined?user:patch.user},error:null})}}:{rpc:async(name)=>{storage++;assert.equal(name,'ks_list_preview_paid_orders');return{data:patch.rows||[row],error:patch.storageFail?{}:null};}},
  savedSetupHandler:async(req,res)=>{saved++;assert.equal(req.method,'GET');assert.ok(req.headers.authorization);return res.status(200).json({setup:patch.setup||setup});},
  packagesHandler:async(req,res)=>{provider++;assert.equal(req.method,'GET');assert.deepEqual(Object.keys(req.headers),['authorization']);return res.status(patch.providerFail?502:200).json({status:'packages_ready',packages:patch.packages||packages,checkedAt,password:'secret-marker'});},
  accountHandler:async(req,res)=>{accounts++;assert.equal(req.method,'GET');assert.equal(req.headers.authorization,`Bearer ${env.ROOMBA_PREVIEW_SECRET}`);await patch.gate;return res.status(patch.accountFail?502:200).json({status:'connected',mode:'read-only',databaseWrites:false,transport:'fixie',account:patch.account||account});},
  lineHandlerFactory:id=>{assert.equal(id,setup.lineId);return async(req,res)=>{lines++;assert.equal(req.method,'GET');assert.equal(req.headers.authorization,`Bearer ${env.ROOMBA_PREVIEW_SECRET}`);return res.status(patch.lineFail?502:200).json({status:'line_ready',mode:'read-only',databaseWrites:false,transport:'fixie',line:patch.line||line});};},
});
const req={method:'GET',headers:{authorization:'Bearer fake-token'},query:{sessionId:row.sessionId,lineId:'attacker_line',password:'secret-marker',action:'edit_line'}};
let checks=0;
async function check(name,test){await test();checks++;console.log(`PASS: ${name}`);}
await check('Preview-only, GET-only and confirmed administrator checks run before storage or provider reads',async()=>{
  for(const[h,r,code]of[[make({env:{...env,VERCEL_ENV:'production'}}),req,404],[make(),{...req,method:'POST'},405],[make(),{...req,headers:{}},401],[make({user:{...user,email:'other@example.invalid',user_metadata:{role:'admin'}}}),req,403],[make({user:{...user,email_confirmed_at:null}}),req,403],[make({user:{...user,is_anonymous:true}}),req,403],[make(),{...req,query:{sessionId:['bad']}},400]]){const res=response();await h(r,res);assert.equal(res.code,code);}
  assert.equal(storage,0);assert.equal(saved,0);assert.equal(provider,0);assert.equal(accounts,0);assert.equal(lines,0);
});
await check('missing or another purchaser’s order cannot target the saved administrator trial',async()=>{
  for(const patch of[{rows:[]},{rows:[{...row,userId:otherId}]}]){const res=response();await make(patch)(req,res);assert.equal(res.code,409);}
  assert.equal(saved,0);assert.equal(provider,0);assert.equal(accounts,0);assert.equal(lines,0);
});
await check('unlinked or conflicting trial prevents even the package read',async()=>{
  for(const status of['unlinked','conflict','needs_review']){const res=response();await make({setup:{...setup,status}})(req,res);assert.equal(res.code,409);}
  assert.equal(provider,0);assert.equal(accounts,0);assert.equal(lines,0);
});
await check('owned trial review preserves login policy, exact package ID/cost/months, and ignores caller overrides',async()=>{
  const res=response();await make()(req,res);assert.equal(res.code,200);assert.equal(res.headers['Cache-Control'],'private, no-store');
  const review=res.body.review;assert.equal(review.existing.lineId,setup.lineId);assert.equal(review.existing.username,setup.username);
  assert.equal(review.proposed.packageId,packages[1].id);assert.equal(review.proposed.credits,1);assert.equal(review.proposed.duration,'1 months');
  assert.equal(review.credentialsPolicy,'keep_existing');assert.equal(review.draftOnly,true);assert.equal(review.providerActionSent,false);assert.equal(review.requiresCurrentLineCheck,false);assert.equal(review.currentTrial.identityVerified,true);assert.equal(review.currentTrial.resellerVerified,true);assert.equal(review.currentTrial.creditsAvailable,25);assert.deepEqual(review.execution,{enabled:false,reason:'trial_conversion_unverified'});
  assert.ok(!JSON.stringify(review).includes('secret-marker'));assert.ok(!JSON.stringify(review).includes('attacker_line'));
  assert.equal(review.newExpiry,undefined);assert.equal(review.existing.savedExpiresAt,setup.expiresAt);
});
await check('package failure or contradictory paid allowance blocks review without false readiness',async()=>{
  for(const patch of[{providerFail:true},{packages:[packages[0],{...packages[1],maxConnections:5},...packages.slice(2)]}]){const res=response();await make(patch)(req,res);assert.equal(res.code,503);assert.equal(res.body.review,undefined);}
});
await check('draft builder rejects another owner, active/live orders and malformed saved trial identities',async()=>{
  const order={...row,providerActivated:false};
  for(const change of[{userId:otherId},{testMode:false},{providerActivated:true},{orderStatus:'active'},{amountCents:1}])assert.throws(()=>buildTrialUpgradeReview({...order,...change},setup,packages,checkedAt,userId));
  for(const change of[{lineId:'bad'},{resellerId:null},{customerId:'------------------------------------'},{connections:5},{expiresAt:'bad'}])assert.throws(()=>buildTrialUpgradeReview(order,{...setup,...change},packages,checkedAt,userId));
});
await check('current line, saved reseller, expiry, groups and balance conflicts block the review',async()=>{
  for(const patch of[{line:{...line,id:'666'}},{line:{...line,trial:false}},{line:{...line,enabled:false}},{line:{...line,expiresAt:'2026-10-19T12:00:00Z'}},{line:{...line,bouquetIds:[13]}},{account:{...account,id:'777'},line:{...line,resellerId:'777'}},{account:{...account,credits:0}},{now:()=>Date.parse('2026-10-19T12:00:00Z')}]){const res=response();await make(patch)(req,res);assert.equal(res.code,409);assert.equal(res.body.review,undefined);}
  for(const patch of[{accountFail:true},{lineFail:true},{storageFail:true}]){const res=response();await make(patch)(req,res);assert.equal(res.code,503);assert.equal(res.body.review,undefined);}
});
await check('simultaneous checks share only read calls and repeated checks respect a cooldown',async()=>{
  let release;const gate=new Promise(resolve=>{release=resolve;});let tick=Date.parse(checkedAt);
  const handler=make({gate,now:()=>tick});const beforeAccounts=accounts,beforeLines=lines;
  const a=response(),b=response();const tasks=Promise.all([handler(req,a),handler(req,b)]);await new Promise(resolve=>setTimeout(resolve,10));release();await tasks;
  assert.equal(a.code,200);assert.equal(b.code,200);assert.equal(accounts-beforeAccounts,1);assert.equal(lines-beforeLines,1);
  const c=response();await handler(req,c);assert.equal(c.code,429);assert.equal(c.headers['Retry-After'],'30');assert.equal(accounts-beforeAccounts,1);
  tick+=30001;const d=response();await handler(req,d);assert.equal(d.code,200);assert.equal(accounts-beforeAccounts,2);
});
await check('enabling flags or forged approval cannot bypass the hard conversion block',async()=>{
  const handler=make({env:{...env,ROOMBA_PAID_UPGRADE_ENABLED:'true',ROOMBA_TRIAL_CONVERSION_VERIFIED:'true'}});
  const get=response();await handler(req,get);assert.equal(get.code,200);assert.equal(get.body.review.execution.enabled,false);assert.equal(get.body.review.approvalToken,undefined);
  const before=[storage,saved,provider,accounts,lines];const post=response();await handler({...req,method:'POST',body:{operation:'upgrade',confirmed:true,approvalToken:'forged',trial:'0'}},post);assert.equal(post.code,405);assert.equal(post.headers.Allow,'GET');assert.deepEqual([storage,saved,provider,accounts,lines],before);
});
console.log(`${checks} trial-upgrade review checks passed. Only synthetic reads were used; no provider writes, payments, emails or database mutations.`);
