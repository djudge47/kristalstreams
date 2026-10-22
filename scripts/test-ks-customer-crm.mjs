import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createClient as realClient} from '@supabase/supabase-js';
import {createCustomerCrmHandler} from '../_server/ks-customer-crm.js';
import {readCustomerCrm,savedServiceLabel} from '../_shared/ks-customer-crm.js';
const {PGlite}=await import(pathToFileURL(process.env.KS_PGLITE_MODULE));
const db=new PGlite();
const id=n=>`55555555-5555-4555-8555-${String(n).padStart(12,'0')}`;
const owner=id(1),other=id(2),actor=id(3),unconfirmed=id(4),customer=id(10),second=id(11);
const date='2026-01-01T00:00:00Z';
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean default false);
 create table public.iptv_customers(id uuid primary key,external_id bigint,username text,customer_name text,source text,payment_status text,package_name text,connections_allowed int,expiration_at timestamptz,account_status text,updated_at timestamptz);
 create table public.iptv_payments(id uuid primary key,customer_id uuid,amount numeric,payment_method text,payment_status text,paid_at timestamptz);
 create table public.ks_crm_renewal_payments(payment_id uuid,customer_id uuid,amount_cents int,paid_at timestamptz,months int,connections int);
 grant select,update on public.iptv_customers to service_role;
 grant select on public.iptv_payments,public.ks_crm_renewal_payments to service_role;`);
await db.exec(await readFile(new URL('./ks-crm-customer-portal-schema.sql',import.meta.url),'utf8'));
for(const [uid,email,confirmed] of [[owner,'owner@example.invalid',date],[other,'other@example.invalid',date],[actor,'djudge47@gmail.com',date],[unconfirmed,'unconfirmed@example.invalid',null]])
 await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,$3)',[uid,email,confirmed]);
for(const [cid,panel,username] of [[customer,1001,'Fictional.One'],[second,1002,'Fictional.Two']])
 await db.query("insert into public.iptv_customers values($1,$2,$3,null,'panel_screenshot_import','legacy_paid','12 Months + 1 Connection',1,'2027-08-04','active',now())",[cid,panel,username]);
for(let n=0;n<205;n++)await db.query("insert into public.iptv_payments values($1,$2,95,'manual_paypal','paid',$3)",[id(100+n),customer,new Date(Date.parse('2026-08-03T20:17:00Z')+n*1000).toISOString()]);
await db.query("insert into public.iptv_payments values($1,$2,12345,'cash','paid',$3),($4,$5,0,'manual','paid',$3),($6,$5,25,'cash','refunded',$3)",[id(500),second,date,id(501),customer,id(502)]);
await db.query('insert into public.ks_crm_renewal_payments values($1,$2,9500,$3,12,1)',[id(304),customer,'2026-08-03T20:20:24Z']);
const before=(await db.query('select row_to_json(c) v from public.iptv_customers c order by id')).rows;
const paymentsBefore=(await db.query('select count(*)::int n,sum(amount) total from public.iptv_payments')).rows;
async function rpc(name,values){await db.exec('set role service_role');try{return(await db.query(`select public.${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) value`,values)).rows[0].value;}finally{await db.exec('reset role');}}
let checks=0;const check=async(name,fn)=>{await fn();console.log('PASS: '+name);checks++;};
let review;
await check('schema installation creates no links and a known name/email alone grants no visibility',async()=>{
 assert.equal((await db.query('select count(*)::int n from public.ks_crm_portal_links')).rows[0].n,0);
 assert.deepEqual((await rpc('ks_client_crm_snapshot',[owner,'owner@example.invalid',null,null])).services,[]);
 for(const email of ['unconfirmed@example.invalid','missing@example.invalid'])await assert.rejects(rpc('ks_crm_portal_link_review',[customer,email,actor]),/portal_account_unavailable/);
 await assert.rejects(rpc('ks_crm_portal_link_review',[customer,'owner@example.invalid',other]),/portal_admin_required/);
 review=await rpc('ks_crm_portal_link_review',[customer,'owner@example.invalid',actor]);assert.equal(review.userId,owner);assert.equal(review.linked,false);
 assert.equal((await db.query('select count(*)::int n from public.ks_crm_portal_links')).rows[0].n,0);
});
await check('explicit admin save binds the exact reviewed identity and provider; replay cannot reassign ownership',async()=>{
 await assert.rejects(rpc('ks_crm_portal_link_save',[customer,other,review.email,date,1001,actor]),/portal_review_changed/);
 await assert.rejects(rpc('ks_crm_portal_link_save',[customer,owner,review.email,date,1002,actor]),/portal_review_changed/);
 for(let n=0;n<2;n++)assert.equal((await rpc('ks_crm_portal_link_save',[customer,owner,review.email,date,1001,actor])).linked,true);
 assert.equal((await db.query('select count(*)::int n from public.ks_crm_portal_links')).rows[0].n,1);
 await assert.rejects(rpc('ks_crm_portal_link_save',[customer,other,'other@example.invalid',date,1001,actor]),/portal_link_conflict/);
 assert.deepEqual((await db.query('select row_to_json(c) v from public.iptv_customers c order by id')).rows,before);
 assert.deepEqual((await db.query('select count(*)::int n,sum(amount) total from public.iptv_payments')).rows,paymentsBefore);
});
await check('private invoker functions and table are not callable/readable by browser roles',async()=>{
 for(const role of ['anon','authenticated']){
  await db.exec(`set role ${role}`);
  try{await assert.rejects(db.query('select customer_id from public.ks_crm_portal_links'),/permission denied/);
   for(const [name,args] of [['ks_crm_portal_link_review',[customer,review.email,actor]],['ks_crm_portal_link_save',[customer,owner,review.email,date,1001,actor]],['ks_client_crm_snapshot',[owner,review.email,null,null]]])
    await assert.rejects(db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')})`,args),/permission denied/);
  }finally{await db.exec('reset role');}
 }
});
await check('snapshot scopes every service and payment to the approved owner; zero/refunded rows are excluded',async()=>{
 const snap=readCustomerCrm(await rpc('ks_client_crm_snapshot',[owner,review.email,null,null]),owner,true);
 assert.equal(snap.services.length,1);assert.equal(snap.services[0].customerId,customer);assert.equal(snap.payments.length,201);
 assert.ok(snap.payments.every(p=>p.customerId===customer&&p.amountCents===9500));assert.equal(snap.payments[0].months,12);
 assert.ok(!JSON.stringify(snap).includes('12345'));
 assert.deepEqual((await rpc('ks_client_crm_snapshot',[other,'other@example.invalid',null,null])).services,[]);
 assert.deepEqual((await rpc('ks_client_crm_snapshot',[owner,'other@example.invalid',null,null])).payments,[]);
});
await check('email/confirmation/provider changes and Preview exclusions immediately remove linked visibility',async()=>{
 for(const [table,column,value,original] of [['auth.users','email','changed@example.invalid',review.email],['auth.users','email_confirmed_at','2026-02-01',date],['public.iptv_customers','external_id',9999,1001],['public.iptv_customers','source','roomba_preview_trial','panel_screenshot_import']]){
  const uid=table==='auth.users'?owner:customer;await db.query(`update ${table} set ${column}=$1 where id=$2`,[value,uid]);
  assert.deepEqual((await rpc('ks_client_crm_snapshot',[owner,review.email,null,null])).payments,[]);
  await db.query(`update ${table} set ${column}=$1 where id=$2`,[original,uid]);
 }
});
const env={VERCEL_ENV:'preview',VITE_SUPABASE_URL:'https://wftfxerblhlsxiijtfbo.supabase.co',VITE_SUPABASE_ANON_KEY:'fictional-anon',SUPABASE_SERVICE_ROLE_KEY:'fictional-service'};
const calls=[];let identity={id:owner,email:review.email,email_confirmed_at:date,is_anonymous:false},rpcFailure=false,badPayload=false;
const admin=realClient(env.VITE_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,options)=>{
 const url=new URL(input);const name=url.pathname.split('/').at(-1);const args=JSON.parse(options.body);calls.push({url,args,method:options.method});
 const order={ks_client_crm_snapshot:['p_user','p_email','p_before_at','p_before_id'],ks_crm_portal_link_review:['p_customer','p_email','p_actor'],ks_crm_portal_link_save:['p_customer','p_user','p_email','p_confirmed_at','p_panel','p_actor']}[name];assert.ok(order);assert.equal(options.method,'POST');
 if(rpcFailure)return Response.json({message:'fictional-private-db-error'},{status:500});
 try{let result=await rpc(name,order.map(k=>args[k]));if(badPayload)result.payments[0].customerId=second;return Response.json(result);}catch(error){return Response.json({message:error.message},{status:409});}
}}});
let authCalls=0;const createClient=(_url,key)=>key===env.VITE_SUPABASE_ANON_KEY?{auth:{getUser:async()=>{authCalls++;return{data:{user:identity}};}}}:admin;
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;}});
async function request(patch={},adminLink=false,envPatch={}){
 const res=response();await createCustomerCrmHandler({createClient,env:{...env,...envPatch},adminLink})({method:adminLink?'POST':'GET',headers:{authorization:'Bearer fictional-token',origin:'https://fictional.vercel.app',host:'fictional.vercel.app','content-type':'application/json'},query:{view:adminLink?'portal-link':'crm-service'},...patch},res);return res;
}
await check('real SDK serializes only server-verified owner inputs and all 205 receipts remain accessible in explicit pages',async()=>{
 const first=await request();assert.equal(first.code,200);assert.equal(first.headers['Cache-Control'],'private, no-store');assert.equal(first.headers.Vary,'Authorization');
 assert.equal(first.body.payments.length,200);assert.ok(first.body.nextCursor);
 const secondPage=await request({query:{view:'crm-service',beforeAt:first.body.nextCursor.paidAt,beforeId:first.body.nextCursor.id}});assert.equal(secondPage.code,200);assert.equal(secondPage.body.payments.length,5);assert.equal(secondPage.body.nextCursor,null);
 assert.equal(new Set([...first.body.payments,...secondPage.body.payments].map(p=>p.id)).size,205);
 assert.equal(calls[0].args.p_user,owner);assert.equal(calls[0].args.p_email,review.email);
 assert.equal((await request({query:{view:'crm-service',customerId:second}})).code,400);
 assert.equal((await request({query:{view:'crm-service',beforeAt:'bad',beforeId:other}})).code,400);
});
await check('auth, method, project, confirmation and same-origin checks fail closed before service access',async()=>{
 const beforeCalls=calls.length;
 for(const p of [{method:'POST'},{headers:{}},{query:{view:'crm-service',email:'other@example.invalid'}}])assert.ok((await request(p)).code>=400);
 for(const p of [{VERCEL_ENV:'production'},{VITE_SUPABASE_URL:'https://wrong.supabase.co'},{SUPABASE_SERVICE_ROLE_KEY:''}])assert.ok((await request({},false,p)).code>=400);
 for(const patch of [{email_confirmed_at:null},{is_anonymous:true},{id:'invalid'}]){const old=identity;identity={...old,...patch};assert.ok((await request()).code>=400);identity=old;}
 assert.equal((await request({body:{action:'review',customerId:customer,email:review.email}},true)).code,403);
 assert.equal((await request({headers:{origin:'https://wrong.invalid',host:'fictional.vercel.app'},body:{}},true)).code,403);
 assert.equal(calls.length,beforeCalls);
});
await check('administrator reviews never save implicitly; exact confirmation is required and replay remains single-link',async()=>{
 const old=identity;identity={id:actor,email:'djudge47@gmail.com',email_confirmed_at:date};
 const res=await request({body:{action:'review',customerId:customer,email:review.email}},true);assert.equal(res.code,200);assert.equal(res.body.review.linked,true);
 assert.equal((await request({body:{action:'link',review:res.body.review,confirmed:false}},true)).code,400);
 assert.equal((await request({body:{action:'link',review:res.body.review,confirmed:true}},true)).code,200);
 identity=old;assert.equal((await db.query('select count(*)::int n from public.ks_crm_portal_links')).rows[0].n,1);
});
await check('cross-customer storage corruption and failed reads never produce partial data, missing-payment claims or leaked errors',async()=>{
 badPayload=true;let result=await request();assert.equal(result.code,503);assert.equal(result.body.services,undefined);badPayload=false;
 rpcFailure=true;result=await request();assert.equal(result.code,503);assert.ok(!JSON.stringify(result.body).includes('fictional-private'));assert.match(result.body.error,/do not pay again/);rpcFailure=false;
 const snapshot=(await request()).body;assert.throws(()=>readCustomerCrm({...snapshot,accountId:other},owner));
 assert.match(savedServiceLabel({...snapshot.services[0],savedStatus:'active',expiresAt:'2020-01-01'}),/ended/);
 assert.equal(savedServiceLabel({...snapshot.services[0],savedStatus:'disabled'}),'Disabled');
});
await db.close();console.log(`${checks} verified customer portal checks passed; no connected credentials or provider requests.`);
