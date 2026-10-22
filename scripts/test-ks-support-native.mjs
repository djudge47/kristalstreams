import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {spawn,spawnSync} from 'node:child_process';
assert.equal(process.env.KS_NATIVE_DISPOSABLE_ACK,'support-hardening-fixtures');
const target=new URL(process.env.KS_NATIVE_PG_URL);
assert.ok(['127.0.0.1','localhost'].includes(target.hostname));
assert.equal(target.pathname,'/ks_support_hardening_test');
const args=['--no-psqlrc','--quiet','--no-align','--tuples-only','--set=ON_ERROR_STOP=on','--dbname',target.href];
function sql(text){const r=spawnSync('psql',[...args,'--command',text],{encoding:'utf8',timeout:15000});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function background(text){return new Promise(resolve=>{const p=spawn('psql',[...args,'--command',text]);let out='',err='';p.stdout.on('data',v=>out+=v);p.stderr.on('data',v=>err+=v);p.on('close',code=>resolve({code,out:out.trim(),err}));});}
assert.equal(sql("select to_regclass('public.profiles') is null"),'t','Requires a fresh disposable database');
sql(await readFile(new URL('./fixtures/ks-support-hardening.sql',import.meta.url),'utf8'));
sql(await readFile(new URL('./ks-support-profile-hardening-schema.sql',import.meta.url),'utf8'));
const reserve=n=>`public.ks_support_reserve('10000000-0000-4000-8000-${String(n).padStart(12,'0')}','contact',null,null,'same@example.invalid','Fixture','Fixture question','Fixture body')`;
const checks=[];
// Independent sessions contend on the real transaction advisory lock. Only the
// first matching UUID receives dispatch=true; the second observes the committed row.
const [a,b]=await Promise.all([
 background(`begin;set local role service_role;select ${reserve(900)}->>'dispatch';select pg_sleep(0.2);commit;`),
 background(`begin;set local role service_role;select ${reserve(900)}->>'dispatch';commit;`),
]);
for(const r of [a,b])assert.equal(r.code,0,r.err);
assert.deepEqual([a.out.split('\n')[0],b.out.split('\n')[0]].sort(),['false','true']);
assert.equal(sql('select count(*) from public.ks_support_dispatches'),'1');
assert.equal(sql('select count(*) from public.support_tickets'),'1');checks.push('independent duplicate sessions reserve exactly one provider send and one ticket');
// With two prior uses of the same sender, simultaneous third/fourth requests
// cannot both pass the per-email quota.
sql(`set role service_role;select ${reserve(901)};`);
const competing=await Promise.all([background(`set role service_role;select ${reserve(902)};`),background(`set role service_role;select ${reserve(903)};`)]);
assert.equal(competing.filter(r=>r.code===0).length,1);
assert.match(competing.find(r=>r.code!==0).err,/support_rate_limited/);
assert.equal(sql('select count(*) from public.ks_support_dispatches'),'3');checks.push('independent sessions cannot exceed the durable sender quota');
assert.equal(sql("select has_column_privilege('authenticated','public.profiles','subscription_tier','UPDATE')"),'f');
assert.equal(sql("select has_column_privilege('authenticated','public.profiles','full_name','UPDATE')"),'t');
checks.push('native grants protect entitlements while allowing intended name edits');
const result={kind:'native-support-hardening',checks,providerRequests:0,connectedWrites:0};
console.log(JSON.stringify(result,null,2));
if(process.env.KS_NATIVE_REPORT)await writeFile(process.env.KS_NATIVE_REPORT,JSON.stringify(result,null,2)+'\n');
