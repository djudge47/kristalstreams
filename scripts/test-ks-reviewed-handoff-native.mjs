import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { createReviewedHandoffRehearsal } from '../_server/ks-reviewed-handoff-rehearsal.js';
import { bootstrap, json, literal, summary } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { installPrototype, makeHandoff, capture, transfer, handoffSummary } from './fixtures/ks-reviewed-handoff/handoff-fixtures.mjs';
import { runHandoffSequential } from './fixtures/ks-reviewed-handoff/handoff-scenarios.mjs';
import { signedHandoffFixtureFactory } from './fixtures/ks-reviewed-handoff/signed-fixtures.mjs';
import { runSignedHandoffChecks } from './fixtures/ks-reviewed-handoff/signed-scenarios.mjs';
// This harness cannot target Supabase or construct a real provider adapter.
assert.equal(process.env.KS_NATIVE_DISPOSABLE_ACK,'reviewed-handoff-fixtures');
const target=process.env.KS_NATIVE_PG_URL,address=new URL(target);
assert.ok(['postgres:','postgresql:'].includes(address.protocol));
assert.ok(['127.0.0.1','localhost','[::1]'].includes(address.hostname));
assert.equal(address.pathname,'/ks_disposable_handoff_test');
assert.equal(address.search,'');assert.equal(address.hash,'');
const psql=process.env.KS_NATIVE_PSQL||'psql',clients=[];
let serial=0;
globalThis.fetch=()=>{throw new Error('External transport is forbidden in native handoff fixtures');};
const report={kind:'native-signed-reviewed-handoff',sourceCommit:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),startedAt:new Date().toISOString(),tests:[],sourceHashes:{}};

class Session{
  constructor(name){
    this.pending=null;this.buffer='';
    // A single ordered pipe keeps a rejected statement's ERROR text before
    // its SQLSTATE marker. Arguments are passed separately, never interpolated.
    this.child=spawn('bash',['-c','exec "$@" 2>&1','ks-native-psql',psql,'--no-psqlrc','--quiet','--no-align','--tuples-only','--set=ON_ERROR_STOP=off','--dbname',target],{env:{...process.env,PGAPPNAME:`ks-reviewed-handoff-native-${name}`},stdio:['pipe','pipe','pipe']});
    this.child.on('error',error=>this.fail(error));
    this.child.on('exit',code=>this.fail(new Error(`Disposable psql session exited (${code})`)));
    this.child.stdout.on('data',chunk=>{
      this.buffer+=chunk.toString();let index;
      while((index=this.buffer.indexOf('\n'))>=0){const line=this.buffer.slice(0,index).replace(/\r$/,'');this.buffer=this.buffer.slice(index+1);const pending=this.pending;
        if(!pending)continue;
        if(line.startsWith(`${pending.marker} `)){
          clearTimeout(pending.timer);this.pending=null;const code=line.slice(pending.marker.length+1).trim();
          if(code==='00000'&&!pending.error)pending.resolve(pending.output.join('\n').trim());
          else{const error=new Error(pending.error.trim()||`SQL rejected (${code})`);error.code=code;pending.reject(error);}
        }else if(/^(ERROR|FATAL):/.test(line))pending.error+=line+'\n';
        else pending.output.push(line);
      }
    });
    this.child.stderr.on('data',chunk=>{if(this.pending)this.pending.error+=chunk.toString();});
    clients.push(this);
  }
  fail(error){if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(error);this.pending=null;}}
  query(sql){
    assert.equal(this.pending,null,'one request at a time per independent psql connection');
    return new Promise((resolve,reject)=>{
      const marker=`KS_NATIVE_DONE_${++serial}`;
      const timer=setTimeout(()=>{this.fail(new Error('Disposable database request timed out'));this.child.kill('SIGTERM');},12000);
      this.pending={resolve,reject,marker,timer,output:[],error:''};
      this.child.stdin.write(`${sql.trim().replace(/;$/,'')};\n\\echo ${marker} :SQLSTATE\n`);
    });
  }
  async json(sql){const value=await this.query(sql);return value?JSON.parse(value):null;}
  stop(){this.child.kill('SIGTERM');}
}


let admin,a,b;
async function check(name,fn){await fn();report.tests.push({name,passed:true});console.log(`PASS: ${name}`);}
async function blocked(pid,state){
  const deadline=Date.now()+4000;
  while(Date.now()<deadline){
    if(state.done)throw state.error||new Error('Expected competing statement to wait on a native lock');
    const value=await admin.json(`select coalesce((select jsonb_build_object('wait',wait_event_type,'state',state) from pg_stat_activity where pid=${pid}),'{}'::jsonb)`);
    if(value.wait==='Lock'&&value.state==='active')return;
    await delay(20);
  }
  throw new Error('Native lock wait was not observed');
}
function competing(sql){
  const state={done:false};
  state.result=b.query(sql).then(value=>{state.done=true;return{value};},error=>{state.done=true;state.error=error;return{error};});
  return state;
}
async function race(first,second,release='commit'){
  await a.query('begin');const winner=await a.query(first),state=competing(second);
  await blocked(b.pid,state);await a.query(release);const loser=await state.result;
  if(loser.error)throw loser.error;
  return [winner,loser.value];
}

const snap=async f=>({...await summary(admin,f),...await handoffSummary(admin,f)});
try {
 admin=new Session('admin');a=new Session('a');b=new Session('b');
 for(const client of [admin,a,b]){
  client.request=client.query.bind(client);client.pid=Number(await client.query('select pg_backend_pid()'));
  await client.query("set statement_timeout='8s'");await client.query("set lock_timeout='6s'");
 }
 report.server=await admin.json("select jsonb_build_object('database',current_database(),'version',current_setting('server_version_num'),'isolation',current_setting('transaction_isolation'))");
 assert.ok(['170006','170011'].includes(report.server.version));
 await check('unmodified native prototype refuses the wrong database before any schema creation',async()=>{
  const wrong=new URL(target);wrong.pathname='/postgres';
  const source=await readFile(new URL('./fixtures/ks-reviewed-handoff/prototype.sql',import.meta.url),'utf8');
  const result=spawnSync(psql,['--no-psqlrc','--quiet','--set=ON_ERROR_STOP=on','--dbname',wrong.href],{input:source,encoding:'utf8',timeout:10000});
  assert.equal(result.status,3);assert.match(result.stderr,/disposable_handoff_database_required/);
  const inspect=spawnSync(psql,['--no-psqlrc','--quiet','--no-align','--tuples-only','--set=ON_ERROR_STOP=on','--dbname',wrong.href,'--command',"select to_regclass('public.ks_proto_execution_approvals') is null and to_regclass('public.ks_proto_reservation_handoffs') is null"],{encoding:'utf8',timeout:10000});
  assert.equal(inspect.status,0);assert.equal(inspect.stdout.trim(),'t');
 });
 report.foundationManifest=await bootstrap(admin);
 const prototypeName='scripts/fixtures/ks-reviewed-handoff/prototype.sql';
 const prototypeHash=createHash('sha256').update(await readFile(new URL('../'+prototypeName,import.meta.url))).digest('hex');
 assert.equal(prototypeHash,'edf3bdfe11d5c6ef4439f00d19ef5aaba930835c03cdc80007afe20b1d56aa97');
 await installPrototype(admin); // Original database guard and deferred checks retained.
 const sources=[prototypeName,'scripts/test-ks-reviewed-handoff-native.mjs','scripts/fixtures/ks-reviewed-handoff/fixtures.mjs',
  'scripts/fixtures/ks-reviewed-handoff/handoff-fixtures.mjs','scripts/fixtures/ks-reviewed-handoff/handoff-scenarios.mjs',
  'scripts/fixtures/ks-reviewed-handoff/signed-fixtures.mjs','scripts/fixtures/ks-reviewed-handoff/signed-scenarios.mjs',
  '_server/ks-reviewed-handoff-rehearsal.js','_server/ks-paid-approval.js','_server/ks-login-envelope.js','_server/ks-roomba-plan-mapping.js',
  '_server/ks-paid-settlement.js','_server/ks-payment-validation.js'];
 for(const name of sources)report.sourceHashes[name]=createHash('sha256').update(await readFile(new URL('../'+name,import.meta.url))).digest('hex');
 await a.query('set role service_role');await b.query('set role service_role');
 await check('three independent native backends install the unchanged guarded disposable prototype',async()=>{
  assert.equal(new Set([admin.pid,a.pid,b.pid]).size,3);assert.equal(report.server.isolation,'read committed');
  assert.equal(report.server.database,'ks_disposable_handoff_test');
 });
 await runHandoffSequential({admin,a,b,check});
 await runSignedHandoffChecks({admin,worker:a,check,overlap:false});
 await check('committed transfer holds the native row lock until commit and its competitor receives replay only',async()=>{
  const f=await makeHandoff(admin,a),values=await race(`select ${transfer(f)}`,`select ${transfer(f)}`);
  assert.equal(JSON.parse(values[0]).would_dispatch,true);assert.equal(JSON.parse(values[1]).would_dispatch,false);
  assert.equal(JSON.parse(values[1]).replayed,true);const s=await snap(f);
  assert.equal(s.handoffs,1);assert.equal(s.reviewSlots,0);assert.equal(s.dispatchSlots,1);assert.equal(s.reserved,'1500000');
 });
 await check('rolled back transfer restores the source reservation before a waiting caller can win',async()=>{
  const f=await makeHandoff(admin,a),values=await race(`select ${transfer(f)}`,`select ${transfer(f)}`,'rollback');
  assert.equal(JSON.parse(values[0]).would_dispatch,true);assert.equal(JSON.parse(values[1]).would_dispatch,true);
  assert.equal(JSON.parse(values[1]).replayed,false);const s=await snap(f);
  assert.equal(s.handoffs,1);assert.equal(s.reviewSlots,0);assert.equal(s.dispatchSlots,1);assert.equal(s.reserved,'1500000');
  // The first SQL row was provisional and was never given to the JS rehearsal.
 });
 await check('native deferred expiry rejects commit and restores the complete review reservation',async()=>{
  const f=await makeHandoff(admin,a,{capture:false});await json(a,capture(f,{expiry:"clock_timestamp()+interval '1 second'"}));const before=await snap(f);
  await a.query('begin');assert.equal((await json(a,transfer(f))).would_dispatch,true);
  await a.query("select pg_sleep(1.1)");await assert.rejects(()=>a.query('commit'),/proto_fresh_approval_required/);
  assert.deepEqual(await snap(f),before);
 });
 await check('signed callers on independent SQL connections receive at most one committed fictional decision',async()=>{
  const t=await signedHandoffFixtureFactory(admin,a)();let arrivals=0,release;
  const loaded=new Promise(resolve=>{release=resolve;});
  const make=connection=>{
   const store=t.makeStore(connection),load=store.load.bind(store);
   store.load=async(...args)=>{const row=await load(...args);assert.equal(row.attempt.state,'reserved');if(++arrivals===2)release();await loaded;return row;};
   return createReviewedHandoffRehearsal({store,provider:t.provider,payments:t.payments,env:t.env,now:t.clock});
  };
  const results=await Promise.all([make(a)(t.input),make(b)(t.input)]);
  assert.equal(arrivals,2);assert.equal(results.filter(r=>r.wouldDispatch).length,1);
  assert.ok(results.every(r=>r.simulation===true&&r.mayDispatch===false));
  const s=await snap(t.f);assert.equal(s.handoffs,1);assert.equal(s.dispatchSlots,1);assert.equal(s.reserved,'1500000');assert.equal(s.spent,'0');
  assert.equal((await t.run(t.input)).wouldDispatch,false);
 });
 await check('shared reseller advisory lock remains held while native transfer is uncommitted',async()=>{
  const f=await makeHandoff(admin,a);await a.query('begin');await json(a,transfer(f));
  const result=await b.query(`select pg_try_advisory_xact_lock(hashtextextended('ks-reseller-reservation/v1:'||${literal(f.reseller)},0))`);
  assert.equal(result,'f');await a.query('commit');
  const s=await snap(f);assert.equal(s.handoffs,1);assert.equal(s.reserved,'1500000');
 });
 await check('browser roles cannot capture approvals or transfer ownership through the prototype',async()=>{
  const f=await makeHandoff(admin,a,{capture:false});await b.query('reset role');await b.query('set role authenticated');
  for(const sql of ['select * from public.ks_proto_execution_approvals','select * from public.ks_proto_reservation_handoffs',`select ${capture(f)}`,`select ${transfer(f)}`])await assert.rejects(()=>b.query(sql),error=>error.code==='42501');
  await b.query('reset role');await b.query('set role service_role');
 });
 await check('the native prototype rejects repeatable-read transfer before ownership or budget changes',async()=>{
  const f=await makeHandoff(admin,a),before=await snap(f);
  await a.query('begin isolation level repeatable read');
  try{await assert.rejects(()=>json(a,transfer(f)),/proto_read_committed_required/);}finally{await a.query('rollback');}
  assert.deepEqual(await snap(f),before);
 });
 await check('all fictional customer profiles retain their original website entitlement fields',async()=>{
  assert.equal(await admin.query("select count(*) from public.profiles where subscription_status<>'inactive' or active_connections<>0 or subscription_expires_at is not null"),'0');
 });
 report.passed=true;
 console.log(`${report.tests.length} native signed-handoff checks passed. Simulation only; no provider-create adapter exists.`);
} catch(error) {
 report.passed=false;report.failure={message:error.message,code:error.code||null};console.error('Native handoff checks failed:',report.failure);process.exitCode=1;
} finally {
 for(const client of clients)client.stop();report.finishedAt=new Date().toISOString();
 if(process.env.KS_NATIVE_REPORT)await writeFile(process.env.KS_NATIVE_REPORT,JSON.stringify(report,null,2)+'\n');
}
