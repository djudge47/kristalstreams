import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createServiceSyncHandler } from '../_server/ks-crm-service-sync.js';

const modulePath=process.env.KS_PGLITE_MODULE;
if(!modulePath)throw Error('Set KS_PGLITE_MODULE to an isolated PGlite installation. No connected database is used.');
const {PGlite}=await import(pathToFileURL(modulePath));const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create table public.iptv_customers(id uuid primary key,external_id bigint unique not null,username text not null,
 source text not null default 'panel_screenshot_import',updated_at timestamptz not null default now(),
 package_name text,connections_allowed integer not null default 1,expiration_at timestamptz,account_status text not null default 'active',trial boolean not null default false,
 payment_status text default 'paid',monthly_price numeric default 17.25,last_payment_at timestamptz default '2026-01-01T00:00:00Z',renewal_at timestamptz default '2027-01-01T00:00:00Z',
 iptv_password text default 'fictional-credential',notes text default 'fictional notes');
 create table public.iptv_payments(id uuid primary key default gen_random_uuid(),customer_id uuid not null,amount numeric,payment_method text,payment_status text,paid_at timestamptz,period_start timestamptz,period_end timestamptz,notes text);
 create table public.iptv_customer_activity(id uuid primary key default gen_random_uuid(),customer_id uuid not null,activity_type text,title text,details text,created_at timestamptz default now());
 create function public.set_updated_at() returns trigger language plpgsql as $$begin new.updated_at=clock_timestamp();return new;end;$$;
 create trigger updated before update on public.iptv_customers for each row execute function public.set_updated_at();
 grant select,update on public.iptv_customers to service_role;
 grant select on public.iptv_payments to service_role;
 grant insert on public.iptv_customer_activity to service_role;`);
const paymentMigration=await readFile(new URL('../supabase/migrations/20260805144500_add_iptv_payments_and_activity.sql',import.meta.url),'utf8');
const paymentFunction=paymentMigration.match(/create or replace function public\.log_iptv_customer_payment\(\)[\s\S]*?\$\$;/i)?.[0];
assert.ok(paymentFunction);await db.exec(paymentFunction);
await db.exec('create trigger actual_payment after update on public.iptv_customers for each row execute function public.log_iptv_customer_payment();');
await db.exec(await readFile(new URL('./ks-crm-bulk-service-sync-schema.sql',import.meta.url),'utf8'));
const id=n=>`11111111-1111-4111-8111-${String(n).padStart(12,'0')}`;
const actor=id(1001),batch=id(1002),origin='https://fictional-preview.vercel.app';
const expiry='2027-04-22T12:00:00.000Z';
for(let n=1;n<=100;n++)await db.query('insert into public.iptv_customers(id,external_id,username,source,package_name,connections_allowed,expiration_at,trial) values($1,$2,$3,$4,$5,3,$6,$7)',
  [id(n),900000+n,`fictional_${n}`,n===98?'roomba_preview_paid':'panel_screenshot_import',n===97?'12 Months + 3 Connections':null,expiry,n===99]);
await db.query("update public.iptv_customers set payment_status='personal',monthly_price=0 where id=$1",[id(1)]);
const env={VERCEL_ENV:'preview',VITE_SUPABASE_URL:'https://wftfxerblhlsxiijtfbo.supabase.co',VITE_SUPABASE_ANON_KEY:'fictional-anon',SUPABASE_SERVICE_ROLE_KEY:'fictional-service',ROOMBA_PREVIEW_SECRET:'fictional-preview'};
const rpcArgs={ks_crm_service_sync_status:['p_batch','p_actor'],ks_crm_service_sync_create:['p_batch','p_actor','p_customers'],ks_crm_service_sync_review:['p_batch','p_actor','p_customer','p_values'],ks_crm_service_sync_apply:['p_batch','p_actor']};
let providerCalls=0,rpcCalls=0;const state={user:{id:actor,email:'djudge47@gmail.com',email_confirmed_at:'2026-01-01T00:00:00Z'}};
const settings={env,createClient(url,key){
  assert.equal(url,env.VITE_SUPABASE_URL);
  if(key===env.VITE_SUPABASE_ANON_KEY)return{auth:{async getUser(token){assert.equal(token,'fictional-token');return{data:{user:state.user},error:null};}}};
  assert.equal(key,env.SUPABASE_SERVICE_ROLE_KEY);
  return{async rpc(name,args){rpcCalls++;assert.ok(rpcArgs[name]);try{const params=rpcArgs[name].map(k=>args[k]);
    const {rows}=await db.query(`select public.${name}(${params.map((_,i)=>'$'+(i+1)).join(',')}) as result`,params);
    return{data:rows[0].result,error:null};}catch(error){return{data:null,error};}},
    from(table){assert.equal(table,'iptv_customers');let value;return{select(columns){assert.equal(columns,'id,external_id,username');return this;},eq(column,v){assert.equal(column,'id');value=v;return this;},
      async maybeSingle(){return{data:(await db.query('select id,external_id,username from public.iptv_customers where id=$1',[value])).rows[0]??null,error:null};}};}};
},readFactory:action=>async(req,res)=>{
  providerCalls++;assert.equal(req.method,'GET');let body;
  if(action.readAction==='user_info')body={status:'connected',account:{id:'88',credits:'53'}};
  else if(action.readAction==='packages')body={status:'packages_ready',packages:[{id:'77',name:'12 Months + 3 Connections',maxConnections:3,paid:{count:12,unit:'months',credits:31},trial:null,bouquets:[1],issues:[]}]};
  else{assert.equal(action.readAction,'get_line');const n=Number(action.lineId)-900000;
    body={status:'line_ready',line:{id:action.lineId,username:`fictional_${n}`,resellerId:'88',packageId:n===100?'999':'77',expiresAt:expiry,
      connections:3,trial:false,enabled:true,adminEnabled:true,bouquetIds:[1],password:'fictional-private-password'}};}
  res.status(200).json({transport:'fixie',mode:'read-only',databaseWrites:false,...body});
}};
const handler=createServiceSyncHandler(settings);
async function request(body,method='POST',extra={}){
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
  const route=body?.action==='review'?createServiceSyncHandler(settings):handler;
  await route({method,body,query:method==='GET'?{view:'service-sync',batchId:body.batchId}:{view:'service-sync'},headers:{authorization:'Bearer fictional-token',origin,host:new URL(origin).host,'content-type':'application/json',...extra}},res);
  assert.ok(!JSON.stringify(res.body).includes('fictional-private-password'));return res;
}
async function call(name,args){const keys=rpcArgs[name];return(await db.query(`select public.${name}(${keys.map((_,i)=>'$'+(i+1)).join(',')}) as result`,keys.map(k=>args[k]))).rows[0].result;}
const snapshot=async()=>JSON.stringify((await db.query('select id,package_name,expiration_at,connections_allowed,account_status,trial,payment_status,monthly_price,last_payment_at,renewal_at,iptv_password,notes from public.iptv_customers order by id')).rows);
let checks=0;const test=async(name,run)=>{await run();checks++;console.log(`PASS: ${name}`);};
await test('private ledger/function grants and invoker search paths deny browser roles',async()=>{
  const {rows}=await db.query("select proname,prosecdef,proconfig,has_function_privilege('authenticated',oid,'execute') as browser from pg_proc where proname like 'ks_crm_service_sync_%'");
  assert.equal(rows.length,4);assert.ok(rows.every(r=>!r.prosecdef&&!r.browser&&r.proconfig.includes('search_path=""')));
  await db.exec('set role authenticated');await assert.rejects(db.query('select * from public.ks_crm_service_sync_items'));await db.exec('reset role');
});
let saved;
await test('one owner batch snapshots all 100 identities without changing any customer',async()=>{
  const before=await snapshot(),r=await request({action:'create',batchId:batch,customerIds:Array.from({length:100},(_,i)=>id(i+1))});
  assert.equal(r.code,200);saved=r.body.batch;assert.equal(saved.total,100);assert.equal(saved.items.length,100);assert.ok(saved.items.every(i=>i.state==='pending'));
  assert.equal(await snapshot(),before);assert.equal(providerCalls,0);assert.ok(!JSON.stringify(saved).includes('fictional-credential'));
  const replay=await request({action:'create',batchId:batch,customerIds:Array.from({length:100},(_,i)=>id(i+1))});assert.equal(replay.code,200);
});
await test('all 100 actual route/provider/SQL reviews complete automatically and persist across reload',async()=>{
  const before=await snapshot();
  for(let n=1;n<=100;n++){
    // Cold-start instances exercise actual auth/provider/SQL handling without
    // real sleeps. The browser pacing is tested separately with a fake clock.
    const r=await request({action:'review',batchId:batch,customerId:id(n)});
    assert.equal(r.code,200);saved=r.body.batch;
  }
  assert.equal(saved.state,'review_ready');assert.equal(saved.items.filter(i=>i.state==='ready').length,96);
  assert.equal(saved.items.filter(i=>i.state==='matched').length,1);assert.equal(saved.items.filter(i=>i.state==='blocked').length,3);
  assert.equal(await snapshot(),before);const loaded=await request({batchId:batch},'GET');assert.equal(loaded.code,200);assert.equal(loaded.body.batch.items.length,100);
});
await test('missing confirmation and hostile origins/actors cannot apply or contact provider',async()=>{
  const before=await snapshot(),calls=rpcCalls;
  assert.equal((await request({action:'apply',batchId:batch,confirmed:false})).code,400);
  assert.equal((await request({action:'apply',batchId:batch,confirmed:true},'POST',{origin:'https://attacker.invalid'})).code,403);
  state.user={...state.user,email:'other@example.invalid'};assert.equal((await request({action:'apply',batchId:batch,confirmed:true})).code,403);state.user={id:actor,email:'djudge47@gmail.com',email_confirmed_at:'2026-01-01T00:00:00Z'};
  assert.equal(rpcCalls,calls);assert.equal(await snapshot(),before);
});
await test('one confirmed apply updates all eligible accounts atomically and preserves billing and credentials',async()=>{
  const before=(await db.query('select id,payment_status,monthly_price,last_payment_at,renewal_at,iptv_password,notes from public.iptv_customers order by id')).rows;
  const r=await request({action:'apply',batchId:batch,confirmed:true});assert.equal(r.code,200);assert.equal(r.body.batch.appliedCount,96);assert.equal(r.body.batch.state,'applied');
  assert.deepEqual((await db.query('select id,payment_status,monthly_price,last_payment_at,renewal_at,iptv_password,notes from public.iptv_customers order by id')).rows,before);
  assert.equal((await db.query('select count(*)::int as n from public.iptv_payments')).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int as n from public.iptv_customer_activity')).rows[0].n,96);
  assert.equal(providerCalls,300);assert.equal((await db.query('select package_name from public.iptv_customers where id=$1',[id(98)])).rows[0].package_name,null);
});
await test('lost-response recovery and repeated apply use the same receipt without duplicate writes',async()=>{
  const before=await snapshot();const r=await request({action:'apply',batchId:batch,confirmed:true});assert.equal(r.body.batch.appliedCount,96);
  const read=await request({batchId:batch},'GET');assert.equal(read.body.batch.state,'applied');assert.equal(await snapshot(),before);
  assert.equal((await db.query('select count(*)::int as n from public.iptv_customer_activity')).rows[0].n,96);
});
await test('a changed CRM account rolls back every eligible update in the batch',async()=>{
  const b=id(2001);await call('ks_crm_service_sync_create',{p_batch:b,p_actor:actor,p_customers:[id(1),id(2)]});
  for(const n of[1,2])await call('ks_crm_service_sync_review',{p_batch:b,p_actor:actor,p_customer:id(n),p_values:{lineId:String(900000+n),username:`fictional_${n}`,packageName:'6 Months + 3 Connections',expiresAt:expiry,connectionsAllowed:3,trial:false,enabled:true,adminEnabled:true,checkedAt:new Date().toISOString()}});
  await db.query("update public.iptv_customers set notes='concurrent owner edit' where id=$1",[id(2)]);const before=await snapshot();
  await assert.rejects(call('ks_crm_service_sync_apply',{p_batch:b,p_actor:actor}),/sync_crm_conflict/);assert.equal(await snapshot(),before);
  assert.equal((await call('ks_crm_service_sync_status',{p_batch:b,p_actor:actor})).state,'review_ready');
});
await test('incomplete, expired and wrong-owner reviews cannot apply',async()=>{
  const b=id(2002);await call('ks_crm_service_sync_create',{p_batch:b,p_actor:actor,p_customers:[id(3)]});
  await assert.rejects(call('ks_crm_service_sync_apply',{p_batch:b,p_actor:actor}),/sync_review_incomplete/);
  await assert.rejects(call('ks_crm_service_sync_status',{p_batch:b,p_actor:id(9999)}),/sync_batch_not_found/);
  await db.query("update public.ks_crm_service_sync_batches set expires_at=now()-interval '1 second' where id=$1",[b]);
  await assert.rejects(call('ks_crm_service_sync_apply',{p_batch:b,p_actor:actor}),/sync_review_expired/);
});
await test('actual HTTP review uses only documented reads and records server-selected fields',async()=>{
  const b=id(2003);await request({action:'create',batchId:b,customerIds:[id(4)]});const before=await snapshot(),reads=providerCalls;
  const r=await request({action:'review',batchId:b,customerId:id(4)});assert.equal(r.code,200);assert.equal(r.body.batch.state,'review_ready');assert.equal(providerCalls-reads,3);
  assert.equal(await snapshot(),before);assert.equal(r.body.creditsSpent,false);assert.equal(r.body.providerWrites,false);
});
await test('browser-supplied service fields and outside-manifest customers are rejected',async()=>{
  const b=id(2004);await request({action:'create',batchId:b,customerIds:[id(5)]});const reads=providerCalls;
  assert.equal((await request({action:'review',batchId:b,customerId:id(5),expiresAt:expiry})).code,400);
  assert.equal((await request({action:'review',batchId:b,customerId:id(6)})).code,400);assert.equal(providerCalls,reads);
});
await db.close();console.log(`${checks} isolated bulk CRM sync checks passed. No connected database or live provider used.`);
