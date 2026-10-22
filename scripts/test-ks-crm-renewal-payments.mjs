import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createRenewalPaymentHandler} from '../_server/ks-crm-renewal-payment.js';
import {amountToCents,validPaymentInput} from '../_shared/ks-crm-renewal-payment.js';
import {getRetailPrice} from '../_shared/ks-retail-pricing.js';
const {PGlite}=await import(pathToFileURL(process.env.KS_PGLITE_MODULE));const db=new PGlite();
const id=n=>`33333333-3333-4333-8333-${String(n).padStart(12,'0')}`;
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
create table public.iptv_customers(id uuid primary key,username text,trial boolean default false,payment_status text,source text,monthly_price numeric default 0,renewal_at timestamptz,expiration_at timestamptz,connections_allowed int,package_name text,last_payment_at timestamptz,account_status text,iptv_password text default 'fictional-only');
create table public.iptv_payments(id uuid primary key default gen_random_uuid(),customer_id uuid references public.iptv_customers(id),amount numeric,payment_method text,payment_status text,paid_at timestamptz,period_start timestamptz,period_end timestamptz,reference text,notes text);
create table public.iptv_customer_activity(id uuid default gen_random_uuid(),customer_id uuid,activity_type text,title text,details text);
grant select on public.iptv_customers to service_role;grant update(package_name) on public.iptv_customers to service_role;`);
const old=await readFile(new URL('../supabase/migrations/20260805144500_add_iptv_payments_and_activity.sql',import.meta.url),'utf8');
await db.exec(old.match(/create or replace function public\.log_iptv_customer_payment\(\)[\s\S]*?\$\$;/i)[0]);
await db.exec('create trigger actual_payment after update on public.iptv_customers for each row execute function public.log_iptv_customer_payment();');
await db.exec(await readFile(new URL('./ks-crm-renewal-payments-schema.sql',import.meta.url),'utf8'));
for(let n=1;n<=5;n++)await db.query("insert into public.iptv_customers(id,username,trial,payment_status,source,renewal_at,expiration_at,connections_allowed,package_name,account_status) values($1,$2,$3,$4,$5,'2026-09-01','2027-04-22',3,'6 Months + 3 Connections','active')",
 [id(n),`fictional_${n}`,n===3,n===2?'personal':n===3?'trial':n===4?'preview_test':'legacy_paid',n===4?'roomba_preview_paid':'panel_screenshot_import']);
const customersBefore=(await db.query('select * from public.iptv_customers order by id')).rows;
let actor=id(100),email='djudge47@gmail.com',calls=0,loseReply=false;
const env={VERCEL_ENV:'preview',VITE_SUPABASE_URL:'https://wftfxerblhlsxiijtfbo.supabase.co',VITE_SUPABASE_ANON_KEY:'fictional-anon',SUPABASE_SERVICE_ROLE_KEY:'fictional-service'};
const settings={env,createClient(url,key){assert.equal(url,env.VITE_SUPABASE_URL);return key==='fictional-anon'?{auth:{getUser:async()=>({data:{user:{id:actor,email,email_confirmed_at:'2026-01-01T00:00:00Z'}}})}}:{rpc:async(name,args)=>{
 calls++;assert.ok(['ks_crm_renewal_payment_status','ks_crm_renewal_payment_record'].includes(name));
 try{await db.exec('set role service_role');const {rows}=await db.query(`select public.${name}($1,$2${name.endsWith('_record')?',$3':''}) result`,[args.p_receipt,args.p_actor,...(name.endsWith('_record')?[args.p_input]:[])]);if(loseReply){loseReply=false;throw Error('fictional dropped response');}return{data:rows[0].result,error:null};}catch(error){return{error};}finally{await db.exec('reset role');}
 }};}};
const input={customerId:id(1),months:6,connections:3,amountCents:15000,paidAt:new Date(Date.now()-3600000).toISOString(),method:'cash_app',reference:'fictional-external-reference',adjustmentReason:''};
async function request(body,method='POST',patch={}){let code,output;await createRenewalPaymentHandler(settings)({method,query:method==='GET'?{view:'renewal-payment',receiptId:body.receiptId}:{view:'renewal-payment'},headers:{origin:'https://fictional-preview.vercel.app',host:'fictional-preview.vercel.app','content-type':'application/json',authorization:'Bearer fictional-token'},body,...patch},{setHeader(){},status(value){code=value;return this;},json(value){output=value;}});return{code,body:output};}
let checks=0;const test=async(name,fn)=>{await fn();checks++;console.log('PASS: '+name);};
await test('only exact positive cents and complete actual dates are accepted',async()=>{
 assert.equal(amountToCents('150.25'),15025);for(const v of ['0','-1','1.001','1e3','10000.01','NaN'])assert.equal(amountToCents(v),null);
 assert.equal(validPaymentInput(input),true);assert.equal(validPaymentInput({...input,paidAt:'2026-02-30T00:00:00.000Z'}),false);
});
await test('unconfirmed, cross-origin, unauthenticated and wrong project/Production writes never reach SQL',async()=>{
 const before=calls;assert.equal((await request({receiptId:id(200),input,confirmed:false})).code,400);
 assert.equal((await request({receiptId:id(200),input,confirmed:true},'POST',{headers:{origin:'https://evil.invalid',host:'fictional-preview.vercel.app'}})).code,403);
 email='other@example.invalid';assert.equal((await request({receiptId:id(200),input,confirmed:true})).code,403);email='djudge47@gmail.com';
 const prior=env.VERCEL_ENV;env.VERCEL_ENV='production';assert.equal((await request({receiptId:id(200),input,confirmed:true})).code,404);env.VERCEL_ENV=prior;
 env.VITE_SUPABASE_URL='https://other.supabase.co';assert.equal((await request({receiptId:id(200),input,confirmed:true})).code,503);env.VITE_SUPABASE_URL='https://wftfxerblhlsxiijtfbo.supabase.co';assert.equal(calls,before);
});
await test('all 20 website prices record the full selected term while all customer and provider service fields stay unchanged',async()=>{
 let index=0;for(const months of [1,3,6,12])for(let connections=1;connections<=5;connections++){
  const r=await request({receiptId:id(300+index++),input:{...input,months,connections,amountCents:getRetailPrice(months,connections).totalCents},confirmed:true});
  assert.equal(r.code,200,JSON.stringify(r.body));assert.equal(r.body.receipt.amountCents,getRetailPrice(months,connections).totalCents);assert.equal(r.body.receipt.serviceUpdated,false);
 }
 assert.deepEqual((await db.query('select * from public.iptv_customers order by id')).rows,customersBefore);
 assert.equal((await db.query('select count(*)::int n from public.iptv_payments')).rows[0].n,20);
 assert.equal((await db.query('select count(*)::int n from public.iptv_payments where period_start is not null or period_end is not null')).rows[0].n,0);
});
await test('retry and saved status return the same receipt; changed payload/actor cannot reuse its reference',async()=>{
 const body={receiptId:id(400),input,confirmed:true};const first=await request(body),second=await request(body);assert.equal(first.code,200);assert.deepEqual(first.body,second.body);
 assert.deepEqual((await request({receiptId:id(400)},'GET')).body,first.body);
 assert.equal((await request({...body,input:{...input,reference:'different'}})).body.code,'payment_reference_conflict');
 actor=id(101);assert.equal((await request({receiptId:id(400)},'GET')).code,404);assert.equal((await request(body)).code,409);actor=id(100);
 assert.equal((await db.query('select count(*)::int n from public.iptv_payments')).rows[0].n,21);
});
await test('trial, preview and personal accounts reject receipts without creating money records',async()=>{
 for(const n of [2,3,4])assert.equal((await request({receiptId:id(500+n),input:{...input,customerId:id(n)},confirmed:true})).body.code,'payment_customer_excluded');
 assert.equal((await db.query('select count(*)::int n from public.iptv_payments')).rows[0].n,21);
});
await test('difference needs an explanation; amount/reference remain data, never SQL; catalog drift is rejected',async()=>{
 assert.equal((await request({receiptId:id(600),input:{...input,amountCents:14000},confirmed:true})).body.code,'payment_input_invalid');
 const r=await request({receiptId:id(600),input:{...input,amountCents:14000,adjustmentReason:"Agreed discount; '); drop table fictional; --"},confirmed:true});assert.equal(r.code,200);assert.equal(r.body.receipt.catalogCents,15000);assert.equal(r.body.receipt.amountCents,14000);
 await assert.rejects(db.query('select public.ks_crm_renewal_payment_record($1,$2,$3)',[id(601),actor,{...input,catalogCents:1}]),/payment_price_changed/);
});
await test('committed payment with a lost response is recovered once without a second receipt',async()=>{
 loseReply=true;const body={receiptId:id(700),input,confirmed:true};assert.equal((await request(body)).body.code,'payment_unverified');
 const saved=await request({receiptId:id(700)},'GET');assert.equal(saved.code,200);assert.equal((await request(body)).body.receipt.paymentId,saved.body.receipt.paymentId);
 assert.equal((await db.query('select count(*)::int n from public.iptv_payments')).rows[0].n,23);
});
await test('browser roles cannot read private receipts or call either function',async()=>{
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(db.query('select public.ks_crm_renewal_payment_status($1,$2)',[id(700),actor]),/permission denied/);await assert.rejects(db.query('select id from public.ks_crm_renewal_payments'),/permission denied/);await db.exec('reset role');}
});
await test('a failed history insert rolls back payment and private receipt together',async()=>{
 await db.exec(`create function reject_history() returns trigger language plpgsql as $$begin raise exception 'synthetic history failure';end;$$;create trigger reject_history before insert on public.iptv_customer_activity for each row execute function reject_history();`);
 assert.equal((await request({receiptId:id(800),input,confirmed:true})).code,409);assert.equal((await request({receiptId:id(800)},'GET')).code,404);
 assert.equal((await db.query('select count(*)::int n from public.iptv_payments')).rows[0].n,23);
 assert.deepEqual((await db.query('select * from public.iptv_customers order by id')).rows,customersBefore);
});
await db.close();console.log(`${checks} receipt-only SQL/HTTP checks passed. Fictional data; no connected payments or XUI calls.`);
