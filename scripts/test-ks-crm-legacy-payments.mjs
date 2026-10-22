import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {isUnpaidCustomer,isLegacyPaidCustomer,isBillingOverdue,isDueWithin,billingRenewalAt} from '../_shared/ks-crm-status.js';
import {getCustomerRetailPrice} from '../_shared/ks-retail-pricing.js';
const modulePath=process.env.KS_PGLITE_MODULE;
if(!modulePath)throw Error('KS_PGLITE_MODULE must point to isolated SQL test runtime');
const {PGlite}=await import(pathToFileURL(modulePath));const db=new PGlite();
const id=n=>`22222222-2222-4222-8222-${String(n).padStart(12,'0')}`;
await db.exec(`create table public.iptv_customers(id uuid primary key,source text,trial boolean,payment_status text,monthly_price numeric default 0,last_payment_at timestamptz,renewal_at timestamptz,package_name text,connections_allowed int,expiration_at timestamptz,account_status text,customer_name text,email text,phone text,notes text,device_notes text,updated_at timestamptz default now(),iptv_password text default 'fictional-only');
create table public.iptv_payments(id uuid default gen_random_uuid(),customer_id uuid,amount numeric,payment_method text,payment_status text,paid_at timestamptz,period_start timestamptz,period_end timestamptz,notes text);
create table public.iptv_customer_activity(id uuid default gen_random_uuid(),customer_id uuid,activity_type text,title text,details text,created_at timestamptz default now());
create table public.ks_crm_service_sync_batches(id uuid primary key,state text);create table public.ks_crm_service_sync_items(batch_id uuid,customer_id uuid);
create table public.ks_crm_order_renewal_control(execution_enabled boolean);insert into public.ks_crm_order_renewal_control values(false);
create table public.ks_crm_renewal_control(execution_enabled boolean);insert into public.ks_crm_renewal_control values(false);
create table public.ks_crm_live_renewal_control(execution_enabled boolean);insert into public.ks_crm_live_renewal_control values(false);`);
const migration=await readFile(new URL('../supabase/migrations/20260805144500_add_iptv_payments_and_activity.sql',import.meta.url),'utf8');
await db.exec(migration.match(/create or replace function public\.log_iptv_customer_payment\(\)[\s\S]*?\$\$;/i)[0]);
await db.exec('create trigger actual_payment after update on public.iptv_customers for each row execute function public.log_iptv_customer_payment();');
await db.query('insert into public.ks_crm_service_sync_batches values($1,$2)',[id(101),'applied']);
for(let n=1;n<=20;n++){
 await db.query('insert into public.iptv_customers(id,source,trial,payment_status,monthly_price,package_name,connections_allowed,expiration_at,account_status,notes) values($1,$2,$3,$4,0,$5,3,$6,$7,$8)',
 [id(n),n===2?'roomba_preview_paid':n===3?'roomba_preview_trial':'panel_screenshot_import',n===3||n===4,n===1?'personal':n===2?'preview_test':n===3||n===4?'trial':n===5?'paid':'unpaid','6 Months + 3 Connections',n===20?'2026-01-01T00:00:00Z':'2027-04-22T05:56:49Z',n===20?'expired':'active','existing notes']);
 await db.query('insert into public.ks_crm_service_sync_items values($1,$2)',[id(101),id(n)]);
}
await db.query("insert into public.iptv_payments(customer_id,amount,payment_method,payment_status,paid_at) values($1,0,'manual','paid','2026-08-05T00:00:00Z')",[id(5)]);
const template=await readFile(new URL('./ks-crm-legacy-payment-confirmation.sql',import.meta.url),'utf8');
const sql=template.replace('__APPLIED_BATCH_UUID__',id(101)).replace('__EXPECTED_COUNT__','16');
const before=(await db.query('select * from public.iptv_customers order by id')).rows;
const paymentsBefore=(await db.query('select * from public.iptv_payments')).rows;
await db.exec(sql);
const after=(await db.query('select * from public.iptv_customers order by id')).rows;
assert.deepEqual(after.slice(0,4),before.slice(0,4));
assert.equal(after.filter(c=>c.payment_status==='legacy_paid').length,16);
for(let n=4;n<20;n++)assert.deepEqual({...after[n],payment_status:before[n].payment_status},before[n]);
assert.deepEqual((await db.query('select * from public.iptv_payments')).rows,paymentsBefore);
assert.equal((await db.query('select count(*)::int n from public.iptv_customer_activity')).rows[0].n,16);
console.log('PASS: 16 owner confirmations with actual payment trigger; zero receipts/amounts/dates/service edits; 4 exclusions preserved');
await db.exec(sql);assert.equal((await db.query('select count(*)::int n from public.iptv_customer_activity')).rows[0].n,16);
console.log('PASS: replay adds no duplicate confirmations');
await db.query("insert into public.iptv_payments(customer_id,amount) values($1,25)",[id(6)]);
await assert.rejects(db.exec(sql),/actual_payment_or_rate_requires_review/);await db.exec('rollback');
assert.equal((await db.query('select count(*)::int n from public.iptv_customer_activity')).rows[0].n,16);
console.log('PASS: existing actual payment blocks bulk reclassification without altering records');
await db.close();
const customer={id:id(5),external_id:5555,username:'fictional_customer',customer_name:null,trial:false,source:'panel_screenshot_import',payment_status:'legacy_paid',monthly_price:20,package_name:'6 Months + 3 Connections',connections_allowed:3,active_connections:0,account_status:'active',expiration_at:'2027-04-22T05:56:49Z',renewal_at:'2026-09-05T00:00:00Z',last_payment_at:null};
const now=Date.parse('2026-10-22T14:00:00Z');
assert.equal(isUnpaidCustomer(customer),false);assert.equal(isLegacyPaidCustomer(customer),true);
assert.equal(isBillingOverdue(customer,now),false);assert.equal(billingRenewalAt(customer),customer.expiration_at);
assert.equal(isDueWithin({...customer,expiration_at:'2026-10-25T14:00:00Z'},7,now),true);
assert.equal(isBillingOverdue({...customer,expiration_at:'2026-01-01T00:00:00Z',account_status:'expired'},now),true);
assert.equal(getCustomerRetailPrice(customer).totalCents,15000);
assert.equal(getCustomerRetailPrice({...customer,payment_status:'paid'}).totalCents,12000);
console.log('PASS: old paid status is separate from expiry; new catalog price applies only to next renewal and preserves ordinary custom pricing');
const require=createRequire(import.meta.url),reactPath=require.resolve('react');
const directory=await mkdtemp(join(process.cwd(),'node_modules','.ks-legacy-view-'));
try{
 for(const entry of ['CRMOperationsCenter','CRMPremiumOverview']){
  const result=await build({entryPoints:[`src/pages/admin/${entry}.tsx`],bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',packages:'external',plugins:[{name:'offline-render',setup(builder){
   builder.onResolve({filter:/^react$/},()=>({path:'hooks',namespace:'fixture'}));
   builder.onResolve({filter:/\/lib\/supabase$/},()=>({path:'auth',namespace:'fixture'}));
   builder.onResolve({filter:/^\.\/(RoombaCrmLink|RoombaCustomerStatus|BulkXuiCheck|BulkCrmServiceSync|PreviewPaidOrders|RenewalPaymentForm)$/},()=>({path:'child',namespace:'fixture'}));
   builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='hooks'
    ? `import React from ${JSON.stringify(reactPath)};export default React;export const useState=initial=>{const n=globalThis.__legacyIndex++;return[n===0?[globalThis.__legacyCustomer]:n===1?[]:initial===true?false:typeof initial==='function'?initial():initial,()=>{}];};export const useEffect=()=>{};export const useMemo=f=>f();`
    :args.path==='auth'?`export const supabase=new Proxy({}, {get(){throw Error('Network forbidden');}});`:`export default ()=>null;`,loader:'js'}));
   builder.onResolve({filter:new RegExp('^'+reactPath.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')},()=>({path:reactPath,external:true}));
  }}]});
  const file=join(directory,entry+'.mjs');await writeFile(file,result.outputFiles[0].text);const{default:Component}=await import(pathToFileURL(file));
  globalThis.__legacyIndex=0;globalThis.__legacyCustomer=customer;
  const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(Component)));
  if(entry==='CRMOperationsCenter'){assert.ok(html.includes('Paid under old pricing'));assert.ok(html.includes('Next renewal price'));assert.ok(html.includes('$150.00'));assert.ok(html.includes('Old amount and payment date are not recorded'));assert.ok(!html.includes('legacy_paid'));assert.ok(!html.includes('No payment recorded'));}
  else{assert.ok(!html.includes('legacy_paid'));assert.ok(html.includes('unknown amounts are excluded'));}
  console.log('PASS: actual '+entry+' renders old payment confirmation separately from new price and excludes unknown receipts/revenue');
 }
}finally{delete globalThis.__legacyCustomer;delete globalThis.__legacyIndex;await rm(directory,{recursive:true,force:true});}
console.log('6 SQL/classification/actual-render scenarios passed. No live customer or provider access.');
