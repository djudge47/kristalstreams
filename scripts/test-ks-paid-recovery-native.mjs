import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { bootstrap, fixture, prepareAttempt, reserveReview, begin, complete, summary, json, literal, adminId } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { createGuardedWorkerFixture } from '../_server/ks-guarded-paid-fixtures.js';
import { createGuardedPaidExecutor } from '../_server/ks-guarded-paid-executor.js';
import { createPaidExecutionStore } from '../_server/ks-paid-execution-store.js';
import { issuePaidApproval } from '../_server/ks-paid-approval.js';
import { sealStreamingLogin } from '../_server/ks-login-envelope.js';

// This harness cannot target Supabase or construct a real provider adapter.
assert.equal(process.env.KS_NATIVE_DISPOSABLE_ACK,'paid-recovery-fixtures');
const target=process.env.KS_NATIVE_PG_URL,address=new URL(target);
assert.ok(['postgres:','postgresql:'].includes(address.protocol));
assert.ok(['127.0.0.1','localhost','[::1]'].includes(address.hostname));
assert.equal(address.pathname,'/ks_paid_recovery_native_test');
assert.equal(address.search,'');assert.equal(address.hash,'');
const psql=process.env.KS_NATIVE_PSQL||'psql',clients=[];
let serial=0;
globalThis.fetch=()=>{throw new Error('External transport is forbidden in native recovery fixtures');};
const report={kind:'native-paid-worker-recovery',sourceCommit:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),startedAt:new Date().toISOString(),tests:[],sourceHashes:{}};

class Session{
  constructor(name){
    this.pending=null;this.buffer='';
    // A single ordered pipe keeps a rejected statement's ERROR text before
    // its SQLSTATE marker. Arguments are passed separately, never interpolated.
    this.child=spawn('bash',['-c','exec "$@" 2>&1','ks-native-psql',psql,'--no-psqlrc','--quiet','--no-align','--tuples-only','--set=ON_ERROR_STOP=off','--dbname',target],{env:{...process.env,PGAPPNAME:`ks-paid-recovery-native-${name}`},stdio:['pipe','pipe','pipe']});
    this.child.on('error',error=>this.fail(error));
    this.child.on('exit',code=>this.fail(new Error(`Disposable psql session exited (${code})`)));
    this.child.stdout.on('data',chunk=>{
      this.buffer+=chunk.toString();let index;
      while((index=this.buffer.indexOf('\n'))>=0){const line=this.buffer.slice(0,index).replace(/\r$/,'');this.buffer=this.buffer.slice(index+1);const pending=this.pending;
        if(!pending)continue;
        if(line.startsWith(`${pending.marker} `)){
          clearTimeout(pending.timer);this.pending=null;const code=line.slice(pending.marker.length+1).trim();
          if(code==='00000')pending.resolve(pending.output.join('\n').trim());
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
const valueSql=value=>value===null?'null':Array.isArray(value)?`array[${value.map(Number).join(',')}]::integer[]`:typeof value==='object'?`${literal(JSON.stringify(value))}::jsonb`:literal(value);

// Auth and provider transport are fictional; the actual execution-store methods
// send their scoped reads and named RPC arguments to native PostgreSQL sessions.
function databaseClient(connection,f,fault='',calls={}){
  let failed=false;
  return {
    auth:{admin:{getUserById:async id=>({data:{user:{id,email:`fixture-${f.owner}@example.invalid`,email_confirmed_at:'2026-01-01',is_anonymous:false}},error:null})}},
    from(table){
      assert.ok(['profiles','ks_preview_provisioning_attempts'].includes(table));
      let columns,filters=[];
      return {select(selection){assert.match(selection,/^[a-z_,]+$/);columns=selection;return this;},eq(key,value){assert.match(key,/^[a-z_]+$/);filters.push(`${key}=${literal(value)}`);return this;},async maybeSingle(){
        try {return {data:await connection.json(`select to_jsonb(t) from (select ${columns} from public.${table} where ${filters.join(' and ')} limit 1)t`),error:null};}
        catch {return {data:null,error:{message:'fictional_native_read_failure'}};}
      }};
    },
    async rpc(name,args){
      assert.match(name,/^ks_[a-z_]+$/);assert.ok(Object.keys(args).every(key=>/^p_[a-z_]+$/.test(key)));
      calls[name]=(calls[name]||0)+1;
      try {
        const data=await connection.json(`select to_jsonb(public.${name}(${Object.entries(args).map(([key,value])=>`${key}=>${valueSql(value)}`).join(',')}))`);
        const lose=(fault==='lost_begin'&&name==='ks_begin_approved_preview_provisioning')
          ||(fault==='lost_verified'&&name==='ks_record_preview_provider_result')
          ||(fault==='lost_complete'&&name==='ks_commit_preview_paid_setup');
        if(lose&&!failed){failed=true;return {data:null,error:{message:'fictional_reply_lost_after_commit'}};}
        return {data,error:null};
      }catch{return {data:null,error:{message:'fictional_native_rpc_failure'}};}
    },
  };
}
async function workerFixture(fault=''){
  const base=createGuardedWorkerFixture(),env=base.env;
  const f=await fixture(admin,{fingerprint:base.review.entry.provider.fingerprint,envelopeFactory:value=>sealStreamingLogin({username:value.username,password:base.login.password},
    {environment:'preview',ownerId:value.owner,sessionId:value.session,attemptId:value.attempt},env)});
  f.bindingHash=createHash('sha256').update(JSON.stringify({sessionId:f.session,ownerId:f.owner,intentId:f.payment,tier:'bronze',connections:1,amountCents:2000,resellerId:f.reseller,packageFingerprint:f.fingerprint})).digest('hex');
  await prepareAttempt(admin,f);
  const now=Date.now(),session=structuredClone(base.session);
  session.id=f.session;session.metadata.user_id=f.owner;session.payment_intent.id=f.payment;session.payment_intent.latest_charge.payment_intent=f.payment;
  const account={...base.review.account,id:f.reseller},line={id:f.line,username:f.username,resellerId:f.reseller,packageId:'1000',connections:1,trial:false,enabled:true,adminEnabled:true,bouquetIds:[13,14],expiresAt:new Date(now+31*86400000).toISOString()};
  const packages=(await base.provider.snapshot()).packages;
  const approval=issuePaidApproval({...base.review,session,ownerId:f.owner,approverId:adminId,account,checkedAt:now},env,now);
  const calls={creates:0,lineReads:0,paymentReads:0,rpcs:{}};
  const provider={snapshot:async()=>({account,packages,checkedAt:now}),create:async()=>{calls.creates++;if(fault==='provider_timeout')throw new Error('fictional_provider_reply_uncertain');return structuredClone(line);},line:async()=>{calls.lineReads++;return structuredClone(line);},account:async()=>({...account,credits:'99'})};
  const payments={retrieve:async()=>{calls.paymentReads++;return structuredClone(session);}};
  const input={attemptId:f.attempt,ownerId:f.owner,approverId:adminId,approvalToken:approval.token,confirmed:true};
  const make=connection=>createGuardedPaidExecutor({store:createPaidExecutionStore(databaseClient(connection,f,fault,calls.rpcs),env),provider,payments,env,now:()=>now});
  return {f,input,calls,run:make(a),other:make(b)};
}
const profileSnapshot=()=>admin.json('select jsonb_agg(to_jsonb(p) order by id) from public.profiles p');
async function completed(t){
  const s=await summary(admin,t.f);
  assert.equal(s.attemptState,'credentials_ready');assert.equal(s.crm,1);assert.equal(s.logins,1);assert.equal(s.fulfillments,1);assert.equal(s.dispatchSlots,0);assert.equal(s.receiptActivated,false);assert.equal(s.previewQueue,'setup_complete');
  assert.equal(t.calls.creates,1);
}

try{
  admin=new Session('admin');a=new Session('a');b=new Session('b');
  for(const client of [admin,a,b]){client.request=client.query.bind(client);client.pid=Number(await client.query('select pg_backend_pid()'));await client.query("set statement_timeout='8s'");await client.query("set lock_timeout='6s'");}
  report.server=await admin.json("select jsonb_build_object('database',current_database(),'version',current_setting('server_version_num'),'isolation',current_setting('transaction_isolation'))");
  assert.ok(['170006','170011'].includes(report.server.version));
  report.foundationManifest=await bootstrap(admin);
  const bindingName='supabase/migrations/20261020003225_add_private_checkout_intent_binding.sql';
  const binding=await readFile(new URL('../'+bindingName,import.meta.url),'utf8');
  report.sourceHashes[bindingName]=createHash('sha256').update(binding).digest('hex');
  await admin.request(binding);
  const sources=['_server/ks-guarded-paid-executor.js','_server/ks-paid-execution-store.js','_server/ks-paid-approval.js','_server/ks-login-envelope.js','_server/ks-guarded-paid-fixtures.js','scripts/fixtures/ks-reviewed-handoff/fixtures.mjs'];
  for(const name of sources)report.sourceHashes[name]=createHash('sha256').update(await readFile(new URL('../'+name,import.meta.url))).digest('hex');
  await a.query('set role service_role');await b.query('set role service_role');
  await check('three native backends use the current guarded foundation without installing the handoff prototype',async()=>{
    assert.equal(new Set([admin.pid,a.pid,b.pid]).size,3);assert.equal(report.server.isolation,'read committed');
    assert.equal(await admin.query("select to_regclass('public.ks_proto_reservation_handoffs') is null"),'t');
  });
  for(const fault of ['', 'lost_begin','provider_timeout','lost_verified','lost_complete']){
    await check(`${fault||'ordinary'} worker recovery preserves one native attempt and no duplicate fictional create`,async()=>{
      const t=await workerFixture(fault),before=await profileSnapshot();
      if(fault==='lost_begin')await assert.rejects(()=>t.run(t.input));else await t.run(t.input);
      const result=await t.other(t.input),s=await summary(admin,t.f);
      if(fault==='lost_begin'||fault==='provider_timeout'){
        assert.equal(result.state,'reconciliation_required');assert.equal(s.dispatchSlots,1);assert.equal(s.crm,0);assert.equal(s.logins,0);assert.equal(s.fulfillments,0);assert.equal(t.calls.creates,fault==='lost_begin'?0:1);
        assert.equal(s.attemptState,fault==='lost_begin'?'dispatching':'reconciliation_required');
      }else{assert.equal(result.state,'credentials_ready');await completed(t);}
      assert.deepEqual(await profileSnapshot(),before);
    });
  }
  await check('a native completion failure after CRM writes rolls back and retries without a second create',async()=>{
    const t=await workerFixture(),before=await profileSnapshot();
    await admin.query("create function public.ks_native_completion_fault() returns trigger language plpgsql as $$begin raise exception 'fictional_completion_failure';end;$$; create trigger ks_native_completion_fault after insert on public.iptv_customer_activity for each row execute function public.ks_native_completion_fault()");
    assert.equal((await t.run(t.input)).state,'completion_pending');
    const stopped=await summary(admin,t.f);assert.equal(stopped.attemptState,'provider_verified');assert.equal(stopped.crm,0);assert.equal(stopped.logins,0);assert.equal(stopped.fulfillments,0);assert.equal(stopped.dispatchSlots,1);
    await admin.query('drop trigger ks_native_completion_fault on public.iptv_customer_activity;drop function public.ks_native_completion_fault()');
    assert.equal((await t.other(t.input)).state,'credentials_ready');await completed(t);assert.deepEqual(await profileSnapshot(),before);
  });
  await check('two real executor callers sharing native SQL create and complete at most once',async()=>{
    const t=await workerFixture(),before=await profileSnapshot();
    await Promise.allSettled([t.run(t.input),t.other(t.input)]);
    assert.equal((await t.run(t.input)).state,'credentials_ready');await completed(t);assert.deepEqual(await profileSnapshot(),before);
  });
  await check('same-attempt approved begin waits on a native row lock and grants one dispatch decision',async()=>{
    const f=await prepareAttempt(admin,await fixture(admin));const values=await race(`select ${begin(f)}`,`select ${begin(f)}`);
    assert.deepEqual(values,['t','f']);assert.equal((await summary(admin,f)).dispatchSlots,1);
  });
  await check('rolled-back approved begin allows the waiting caller one fresh dispatch decision',async()=>{
    const f=await prepareAttempt(admin,await fixture(admin));const values=await race(`select ${begin(f)}`,`select ${begin(f)}`,'rollback');
    assert.deepEqual(values,['t','t']);assert.equal((await summary(admin,f)).dispatchSlots,1);
  });
  await check('native simultaneous local completions commit one CRM, fulfillment and encrypted owner binding',async()=>{
    const f=await prepareAttempt(admin,await fixture(admin),'provider_verified'),before=await profileSnapshot();
    const values=await race(`select ${complete(f)}`,`select ${complete(f)}`);assert.equal(JSON.parse(values[0]).replayed,false);assert.equal(JSON.parse(values[1]).replayed,true);
    const s=await summary(admin,f);assert.equal(s.crm,1);assert.equal(s.logins,1);assert.equal(s.fulfillments,1);assert.equal(s.dispatchSlots,0);assert.equal(s.receiptActivated,false);assert.deepEqual(await profileSnapshot(),before);
  });
  await check('review reservation blocks the actual signed executor before any fictional provider creation',async()=>{
    const t=await workerFixture();await json(a,reserveReview(t.f));const before=await summary(admin,t.f);
    await assert.rejects(()=>t.run(t.input));assert.equal(t.calls.creates,0);assert.deepEqual(await summary(admin,t.f),before);
  });
  await check('uncommitted review ownership rejects approved begin immediately, then remains exclusive after commit',async()=>{
    const f=await prepareAttempt(admin,await fixture(admin));await a.query('begin');await json(a,reserveReview(f));
    await assert.rejects(()=>b.query(`select ${begin(f)}`),error=>error.code==='P0001'&&/reseller_reservation_busy/.test(error.message));
    await a.query('commit');await assert.rejects(()=>b.query(`select ${begin(f)}`),error=>error.code==='P0001'&&/reseller_reserved_for_setup_review/.test(error.message));
    const s=await summary(admin,f);assert.equal(s.attemptState,'reserved');assert.equal(s.reviewSlots,1);assert.equal(s.dispatchSlots,0);
  });
  await check('uncommitted dispatch ownership rejects review reservation and rollback restores eligibility',async()=>{
    const f=await prepareAttempt(admin,await fixture(admin));await a.query('begin');assert.equal(await json(a,begin(f)),true);
    await assert.rejects(()=>b.query(`select ${reserveReview(f)}`),error=>error.code==='P0001'&&/reseller_reservation_busy/.test(error.message));
    await a.query('rollback');await json(b,reserveReview(f));const s=await summary(admin,f);assert.equal(s.attemptState,'reserved');assert.equal(s.reviewSlots,1);assert.equal(s.dispatchSlots,0);
  });
  await check('browser roles cannot read owner envelopes or execute dispatch/completion RPCs',async()=>{
    const f=await fixture(admin);await b.query('reset role');await b.query('set role authenticated');
    for(const sql of ['select * from public.ks_preview_streaming_logins','select * from public.ks_preview_provisioning_attempts',`select ${begin({...f,token:adminId})}`,`select ${complete({...f,token:adminId})}`])await assert.rejects(()=>b.query(sql),error=>error.code==='42501');
    await b.query('reset role');await b.query('set role service_role');
  });
  report.passed=true;
  console.log(`${report.tests.length} native worker recovery checks passed. Provider/Auth/Stripe are fictional; only the named loopback database was used.`);
}catch(error){report.passed=false;report.failure={message:error.message,code:error.code||null};console.error('Native paid recovery checks failed:',report.failure);process.exitCode=1;}
finally{for(const client of clients)client.stop();report.finishedAt=new Date().toISOString();if(process.env.KS_NATIVE_REPORT)await writeFile(process.env.KS_NATIVE_REPORT,JSON.stringify(report,null,2)+'\n');}
