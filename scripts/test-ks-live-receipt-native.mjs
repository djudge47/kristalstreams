import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { bootstrap, literal,fixture as legacyReviewFixture,reserveReview } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { routingCases, routingMigrationName, routingSupportSql } from './fixtures/ks-paid-order-routing.mjs';

// Only a disposable loopback database is accepted. Never use DATABASE_URL,
// Supabase, a production secret, provider transport or an application endpoint.
const target=process.env.KS_NATIVE_PG_URL;
assert.equal(process.env.KS_NATIVE_DISPOSABLE_ACK,'receipt-only-fixtures');
const address=new URL(target);
assert.ok(['postgres:','postgresql:'].includes(address.protocol));
assert.ok(['127.0.0.1','localhost','[::1]'].includes(address.hostname));
assert.equal(address.pathname,'/ks_receipt_native_test');
assert.equal(address.search,'');
assert.equal(address.hash,'');
const psql=process.env.KS_NATIVE_PSQL||'psql';
const owner='00000000-0000-4000-8000-000000000001';
const legacyOwner='00000000-0000-4000-8000-000000000002';
const report={kind:'native-postgresql-receipt-contention',sourceCommit:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),startedAt:new Date().toISOString(),tests:[],sqlSources:{}};
const clients=[];
let serial=0;

function install(sql){
  const result=spawnSync(psql,['--no-psqlrc','--quiet','--no-align','--tuples-only','--set=ON_ERROR_STOP=on','--dbname',target],{input:sql,encoding:'utf8',timeout:20000});
  if(result.error||result.status!==0)throw new Error(`Disposable database bootstrap failed: ${result.stderr||result.error?.message}`);
  return result.stdout.trim();
}

// ON_ERROR_STOP exits on the first failing migration statement. Closing the
// connection rolls back its explicit transaction, including every new object.
function migrate(sql){
  const state={done:false};
  const child=spawn(psql,['--no-psqlrc','--quiet','--set=ON_ERROR_STOP=on','--dbname',target],{
    env:{...process.env,PGAPPNAME:'ks-receipt-native-migration'},stdio:['pipe','pipe','pipe']});
  state.result=new Promise((resolve,reject)=>{
    let output='';
    child.stdout.on('data',chunk=>{output+=chunk.toString();});
    child.stderr.on('data',chunk=>{output+=chunk.toString();});
    child.on('error',reject);
    child.on('exit',code=>{state.done=true;resolve({code,output});});
    child.stdin.end(sql);
  });
  return state;
}

async function migrationPid(state){
  const deadline=Date.now()+3000;
  while(Date.now()<deadline){
    assert.equal(state.done,false,'migration must still be waiting');
    const pid=Number(await observer.query("select pid from pg_stat_activity where application_name='ks-receipt-native-migration'"));
    if(pid)return pid;
    await delay(20);
  }
  throw new Error('No independent migration backend observed');
}

class Session{
  constructor(name){
    this.pending=null;this.buffer='';
    // A single ordered pipe keeps a rejected statement's ERROR text before
    // its SQLSTATE marker. Arguments are passed separately, never interpolated.
    this.child=spawn('bash',['-c','exec "$@" 2>&1','ks-native-psql',psql,'--no-psqlrc','--quiet','--no-align','--tuples-only','--set=ON_ERROR_STOP=off','--dbname',target],{env:{...process.env,PGAPPNAME:`ks-receipt-native-${name}`},stdio:['pipe','pipe','pipe']});
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
  async json(sql){return JSON.parse(await this.query(sql));}
  stop(){this.child.kill('SIGTERM');}
}

const record=(suffix,options={})=>`select public.ks_record_paid_checkout(${literal(`cs_live_${suffix}`)},${literal(options.intent||`pi_${suffix}`)},${literal(options.owner||owner)},true,'bronze',1,30,2000,'usd')`;
const pending=(suffix,email='fictional@example.invalid')=>`select public.ks_prepare_pending_order_alert(${literal(`cs_live_${suffix}`)},${literal(owner)},${literal(email)})`;
const complete=(suffix,emailId='mail_native')=>`select public.ks_complete_pending_order_alert(${literal(`cs_live_${suffix}`)},${literal(emailId)})`;
const legacy=(suffix,user=owner)=>`select public.ks_apply_paid_checkout(${literal(`cs_live_${suffix}`)},${literal(`pi_${suffix}`)},${literal(user)},true,'bronze',1,30,2000,'usd')`;
const counts=suffix=>`select jsonb_build_object('receipts',(select count(*) from public.ks_payment_receipts where checkout_session_id=${literal(`cs_live_${suffix}`)}),'queue',(select count(*) from public.ks_setup_order_queue where checkout_session_id=${literal(`cs_live_${suffix}`)}),'alerts',(select count(*) from public.ks_pending_order_alerts where checkout_session_id=${literal(`cs_live_${suffix}`)}))`;
let a,b,observer;

async function check(name,fn){await fn();report.tests.push({name,passed:true});console.log(`PASS: ${name}`);}
async function observeBlocked(pid,state){
  const deadline=Date.now()+4000;
  while(Date.now()<deadline){
    if(state.done)throw state.error||new Error('The competing statement finished before a database lock was observed');
    const row=await observer.json(`select coalesce((select jsonb_build_object('wait',wait_event_type,'state',state) from pg_stat_activity where pid=${pid}), '{}'::jsonb)`);
    if(row.wait==='Lock'&&row.state==='active')return;
    await delay(20);
  }
  throw new Error('No native lock wait observed for the competing session');
}
function competing(sql){
  const state={done:false};
  state.result=b.query(sql).then(value=>{state.done=true;return{value};},error=>{state.done=true;state.error=error;return{error};});
  return state;
}
async function race(first,second,{release='commit',expectedError}={}){
  await a.query('begin');const firstValue=await a.query(first);const state=competing(second);
  await observeBlocked(b.pid,state);await a.query(release);const result=await state.result;
  if(expectedError){assert.equal(result.error?.code,expectedError);return{first:firstValue,error:result.error};}
  if(result.error)throw result.error;
  return{first:firstValue,second:result.value};
}

try{
  const identity=JSON.parse(install("select jsonb_build_object('database',current_database(),'version',current_setting('server_version_num'),'isolation',current_setting('transaction_isolation'))"));
  assert.equal(identity.database,'ks_receipt_native_test');assert.ok([170006,170011].includes(Number(identity.version)));
  report.server=identity;
  const manifest=await bootstrap({request:async sql=>install(sql)});
  report.foundationManifest=manifest;
  const bindingName='../supabase/migrations/20261020003225_add_private_checkout_intent_binding.sql';
  const binding=await readFile(new URL(bindingName,import.meta.url),'utf8');
  report.sqlSources[bindingName]=createHash('sha256').update(binding).digest('hex');install(binding);
  install(`alter table public.profiles add column subscription_tier text default 'bronze',add column connections_allowed integer default 1,add column stripe_checkout_session_id text,add column stripe_payment_intent_id text;
    insert into auth.users values('${owner}'),('${legacyOwner}');
    insert into public.profiles(id,email) values('${owner}','fictional@example.invalid'),('${legacyOwner}','legacy@example.invalid');`);
  for(const name of['ks-payment-schema.sql','ks-order-email-schema.sql']){
    const source=await readFile(new URL(name,import.meta.url),'utf8');report.sqlSources[name]=createHash('sha256').update(source).digest('hex');
    if(name==='ks-payment-schema.sql')install(source.slice(source.indexOf('CREATE OR REPLACE FUNCTION')).replace('$function$\n\nrevoke','$function$;\n\nrevoke').replaceAll('\n','\r\n'));
    else install(source);
  }
  const migrationName='../supabase/migrations/20261025024637_add_live_receipt_pending_alerts_and_rollback_guard.sql';
  const migration=await readFile(new URL(migrationName,import.meta.url),'utf8');
  report.sqlSources[migrationName]=createHash('sha256').update(migration).digest('hex');
  for(const name of ['ks-pending-order-email-schema.sql','ks-live-receipt-rollback-guard.sql']){
    const source=await readFile(new URL(name,import.meta.url),'utf8');
    const body=source.match(/\bbegin;\s*([\s\S]*?)\s*commit;\s*$/i)?.[1].trim();
    assert.ok(body&&migration.includes(body),`generated migration must contain reviewed SQL: ${name}`);
    report.sqlSources[name]=createHash('sha256').update(source).digest('hex');
  }
  a=new Session('a');b=new Session('b');observer=new Session('observer');
  for(const client of[a,b,observer]){
    client.pid=Number(await client.query('select pg_backend_pid()'));
    await client.query("set statement_timeout='8s'");
    await client.query("set lock_timeout='6s'");
  }
  const absent=async()=>assert.deepEqual(await observer.json("select jsonb_build_object('table',to_regclass('public.ks_pending_order_alerts')::text,'guard',to_regprocedure('public.ks_guard_receipt_only_activation()')::text,'prepare',to_regprocedure('public.ks_prepare_pending_order_alert(text,uuid,text)')::text,'complete',to_regprocedure('public.ks_complete_pending_order_alert(text,text)')::text)"),{table:null,guard:null,prepare:null,complete:null});
  await check('migration rejects exposed browser permissions without leaving new objects',async()=>{
    await a.query('grant select on public.ks_setup_order_queue to anon');
    const result=await migrate(migration).result;assert.notEqual(result.code,0);assert.match(result.output,/receipt_rollout_private_table_required/);await absent();
    await a.query('revoke select on public.ks_setup_order_queue from anon');
  });
  await check('migration rejects function configuration drift without partial DDL',async()=>{
    await a.query("alter function public.ks_record_paid_checkout(text,text,uuid,boolean,text,integer,integer,integer,text) set search_path='public'");
    const result=await migrate(migration).result;assert.notEqual(result.code,0);assert.match(result.output,/receipt_rollout_function_drift/);await absent();
    await a.query("alter function public.ks_record_paid_checkout(text,text,uuid,boolean,text,integer,integer,integer,text) set search_path=''");
  });
  await check('migration rejects changed columns without partial DDL',async()=>{
    await a.query('alter table public.ks_setup_order_queue rename column queued_at to changed_at');
    const result=await migrate(migration).result;assert.notEqual(result.code,0);assert.match(result.output,/receipt_rollout_column_drift/);await absent();
    await a.query('alter table public.ks_setup_order_queue rename column changed_at to queued_at');
  });
  await check('exact migration times out behind a writer and leaves all new objects absent',async()=>{
    await a.query('begin');await a.query('lock table only public.ks_payment_receipts in row exclusive mode');
    const state=migrate(migration);await observeBlocked(await migrationPid(state),state);
    const result=await state.result;assert.notEqual(result.code,0);assert.match(result.output,/lock timeout/);
    await a.query('rollback');await absent();
  });
  await check('migration waits before queue locking so an in-flight receipt can finish',async()=>{
    await a.query('begin');await a.query('lock table only public.ks_payment_receipts in row exclusive mode');
    const state=migrate(migration);await observeBlocked(await migrationPid(state),state);
    await a.query(record('MigrationRaceNative'));await a.query('commit');
    const result=await state.result;assert.equal(result.code,0,result.output);
    assert.deepEqual(await observer.json(counts('MigrationRaceNative')),{receipts:1,queue:1,alerts:0});
  });
  await check('reapplying the new migration rejects existing objects and preserves accepted orders',async()=>{
    const before=await observer.json("select to_jsonb(q) from public.ks_setup_order_queue q where checkout_session_id='cs_live_MigrationRaceNative'");
    const result=await migrate(migration).result;assert.notEqual(result.code,0);assert.match(result.output,/receipt_rollout_objects_already_exist/);
    assert.deepEqual(await observer.json("select to_jsonb(q) from public.ks_setup_order_queue q where checkout_session_id='cs_live_MigrationRaceNative'"),before);
  });
  // Prepare a historical activated receipt before it is adopted for review.
  install(`set role service_role; ${legacy('HistoricalNative',legacyOwner)}; reset role;`);
  await a.query('set role service_role');await b.query('set role service_role');
  const before=await observer.json('select jsonb_agg(to_jsonb(p) order by id) from public.profiles p');
  await check('three independent native PostgreSQL backends load the current application foundation',async()=>{
    assert.equal(new Set([a.pid,b.pid,observer.pid]).size,3);
    assert.equal(await observer.query("select count(*) from pg_extension where extname='pgcrypto'"),'1');
    assert.equal(await observer.query('show transaction_isolation'),'read committed');
  });
  await check('simultaneous confirmation waits on a real lock, then recovers one receipt and queue',async()=>{
    const result=await race(record('DuplicateNative'),record('DuplicateNative'));
    assert.equal(JSON.parse(result.first).replayed,false);assert.equal(JSON.parse(result.second).replayed,true);
    assert.deepEqual(await observer.json(counts('DuplicateNative')),{receipts:1,queue:1,alerts:0});
  });
  await check('rollback of the first confirmation lets the waiting session create exactly one order',async()=>{
    const result=await race(record('RollbackNative'),record('RollbackNative'),{release:'rollback'});
    assert.equal(JSON.parse(result.second).replayed,false);assert.deepEqual(await observer.json(counts('RollbackNative')),{receipts:1,queue:1,alerts:0});
  });
  await check('a shared payment intent cannot become a second checkout under contention',async()=>{
    const result=await race(record('IntentWinnerNative',{intent:'pi_SharedNative'}),record('IntentLoserNative',{intent:'pi_SharedNative'}),{expectedError:'P0001'});
    assert.match(result.error.message,/payment_intent_already_recorded/);
    assert.deepEqual(await observer.json(counts('IntentLoserNative')),{receipts:0,queue:0,alerts:0});
  });
  await check('simultaneous pending-alert preparation preserves one frozen body and first timestamp',async()=>{
    const result=await race(pending('DuplicateNative'),pending('DuplicateNative','changed@example.invalid'));
    assert.deepEqual(JSON.parse(result.second),JSON.parse(result.first));
    assert.deepEqual(await observer.json(counts('DuplicateNative')),{receipts:1,queue:1,alerts:1});
  });
  await check('rolled-back alert preparation leaves the waiting session one durable alert',async()=>{
    const result=await race(pending('RollbackNative'),pending('RollbackNative','after-rollback@example.invalid'),{release:'rollback'});
    assert.equal(JSON.parse(result.second).send_payload.reply_to,'after-rollback@example.invalid');
    assert.deepEqual(await observer.json(counts('RollbackNative')),{receipts:1,queue:1,alerts:1});
  });
  await check('simultaneous delivery acknowledgements remain final and reject conflicting provider IDs',async()=>{
    const result=await race(complete('DuplicateNative'),complete('DuplicateNative'));
    assert.equal(JSON.parse(result.first).status,'sent');assert.equal(JSON.parse(result.second).status,'sent');
    await assert.rejects(()=>b.query(complete('DuplicateNative','mail_conflict')),error=>error.code==='P0001'&&/pending_alert_delivery_conflict/.test(error.message));
    assert.equal(JSON.parse(await a.query(pending('DuplicateNative'))).status,'already_sent');
  });
  await check('old activation racing an accepted receipt-only order rolls back its profile change',async()=>{
    const result=await race(record('LegacyRaceNative'),legacy('LegacyRaceNative'),{expectedError:'P0001'});
    assert.match(result.error.message,/receipt_only_order_cannot_use_legacy_activation/);
    assert.equal(await observer.query("select activated from public.ks_payment_receipts where checkout_session_id='cs_live_LegacyRaceNative'"),'f');
    assert.deepEqual(await observer.json('select jsonb_agg(to_jsonb(p) order by id) from public.profiles p'),before);
  });
  await check('lock timeout leaves no partial order and an exact later retry succeeds',async()=>{
    await a.query('begin');await a.query(`select id from public.profiles where id=${literal(owner)} for update`);
    await b.query("set lock_timeout='150ms'");
    await assert.rejects(()=>b.query(record('TimeoutNative')),error=>error.code==='55P03');
    assert.deepEqual(await observer.json(counts('TimeoutNative')),{receipts:0,queue:0,alerts:0});
    await a.query('rollback');await b.query("set lock_timeout='6s'");
    assert.equal(JSON.parse(await b.query(record('TimeoutNative'))).replayed,false);
  });
  await check('historical activated access is preserved and adopted only as a review obligation',async()=>{
    const value=JSON.parse(await a.query(record('HistoricalNative',{owner:legacyOwner})));
    assert.equal(value.legacy_website_activated,true);assert.equal(value.order_status,'requires_review');assert.equal(value.provider_activated,false);
    assert.deepEqual(await observer.json('select jsonb_agg(to_jsonb(p) order by id) from public.profiles p'),before);
  });
  await check('native grants deny browsers and expose no provider dispatch or spending',async()=>{
    await b.query('reset role');await b.query('set role authenticated');
    await assert.rejects(()=>b.query(record('BrowserNative')),error=>error.code==='42501');
    await assert.rejects(()=>b.query('select * from public.ks_setup_order_queue'),error=>error.code==='42501');
    await assert.rejects(()=>b.query('select * from public.ks_pending_order_alerts'),error=>error.code==='42501');
    await assert.rejects(()=>b.query(pending('DuplicateNative')),error=>error.code==='42501');
    await assert.rejects(()=>b.query(complete('DuplicateNative')),error=>error.code==='42501');
    await b.query('reset role');await b.query('set role service_role');
    const state=await observer.json("select jsonb_build_object('attempts',(select count(*) from public.ks_preview_provisioning_attempts),'dispatches',(select count(*) from public.ks_preview_reseller_dispatches),'claims',(select count(*) from public.ks_setup_review_claims),'spent',(select coalesce(sum(spent_units),0) from public.ks_setup_review_budgets))");
    assert.deepEqual(state,{attempts:0,dispatches:0,claims:0,spent:0});
  });
  await check('all customer profiles remain byte-equivalent after native races and recovery',async()=>{
    assert.deepEqual(await observer.json('select jsonb_agg(to_jsonb(p) order by id) from public.profiles p'),before);
  });
  install(await routingSupportSql());
  const routingPath=new URL(routingMigrationName,new URL('./fixtures/ks-paid-order-routing.mjs',import.meta.url));
  const routingMigration=await readFile(routingPath,'utf8');
  report.sqlSources['supabase/migrations/20261025031536_add_private_paid_order_routing.sql']=createHash('sha256').update(routingMigration).digest('hex');
  install(routingMigration);
  const routingDb={
    exec:sql=>a.query(sql),
    query:async(sql,args=[])=>{
      // Only disposable fixture values reach this adapter, quoted as SQL
      // literals. No application/customer text or production connection.
      const bound=sql.replace(/\$(\d+)\b/g,(_,index)=>args[Number(index)-1]===null?'null':literal(args[Number(index)-1]));
      if(!/^\s*select\b/i.test(bound)){await a.query(bound);return{rows:[]};}
      return{rows:await a.json(`select coalesce(jsonb_agg(to_jsonb(fixture_rows)),'[]'::jsonb) from (${bound}) fixture_rows`)};
    },
  };
  await routingCases(routingDb,check);
  await check('simultaneous routing waits on a native lock and returns one saved destination',async()=>{
    const sql="select public.ks_route_paid_order('cs_live_DuplicateNative')";
    const result=await race(sql,sql);
    const first=JSON.parse(result.first),second=JSON.parse(result.second);
    assert.deepEqual(second,{...first,replayed:true});assert.equal(first.replayed,false);
    assert.equal(await observer.query("select count(*) from public.ks_paid_order_routes where checkout_session_id='cs_live_DuplicateNative'"),'1');
  });
  await check('routing rollback lets a waiting confirmation save the destination once',async()=>{
    const sql="select public.ks_route_paid_order('cs_live_RollbackNative')";
    const result=await race(sql,sql,{release:'rollback'});
    assert.equal(JSON.parse(result.second).replayed,false);
    assert.equal(await observer.query("select count(*) from public.ks_paid_order_routes where checkout_session_id='cs_live_RollbackNative'"),'1');
  });
  const liveBindingPath='../supabase/migrations/20261025033932_add_private_live_checkout_intent_binding.sql';
  const liveBinding=await readFile(new URL(liveBindingPath,import.meta.url),'utf8');
  report.sqlSources[liveBindingPath]=createHash('sha256').update(liveBinding).digest('hex');
  const previewFunctions="select jsonb_object_agg(proname,md5(prosrc)) from pg_proc where proname in ('ks_guard_checkout_request','ks_reserve_checkout_request','ks_bind_checkout_request')";
  const oldPreview=await observer.json(previewFunctions);
  install(liveBinding);
  const liveOwner='00000000-0000-4000-8000-000000000011';
  const requestOne='00000000-0000-4000-8000-000000000012',requestTwo='00000000-0000-4000-8000-000000000013';
  install(`insert into auth.users(id,email,email_confirmed_at,is_anonymous) values('${liveOwner}','native-live@example.invalid','2026-01-01T00:00:00Z',false);
    insert into public.profiles(id,email) values('${liveOwner}','native-live@example.invalid');`);
  const reserveLive=id=>`select public.ks_reserve_live_checkout_request('${liveOwner}',${literal(id)},'gold',3,'renewal','https://kristalstream.com','native-live@example.invalid')`;
  const bindLive=(id,session)=>`select public.ks_bind_live_checkout_request('${liveOwner}',${literal(id)},${literal(session)})`;
  const liveProfile=await observer.json(`select to_jsonb(p) from public.profiles p where id='${liveOwner}'`);
  await check('live migration leaves every existing Preview binding function byte-equivalent',async()=>{
    assert.deepEqual(await observer.json(previewFunctions),oldPreview);
    const funcs=await observer.json("select jsonb_agg(jsonb_build_object('definer',prosecdef,'config',proconfig)) from pg_proc where proname in ('ks_guard_live_checkout_request','ks_reserve_live_checkout_request','ks_bind_live_checkout_request')");
    assert.equal(funcs.length,3);assert.ok(funcs.every(fn=>fn.definer===false&&fn.config.includes('search_path=\"\"')));
  });
  await check('concurrent live checkout reservations wait and retain one canonical purpose/price',async()=>{
    const result=await race(reserveLive(requestOne),reserveLive(requestOne));
    assert.deepEqual(JSON.parse(result.first),JSON.parse(result.second));
    const row=JSON.parse(result.second);assert.equal(row.kind,'renewal');assert.equal(row.amount_cents,15000);assert.equal(row.livemode,true);
  });
  await check('concurrent live session binding saves one immutable purpose before returning checkout',async()=>{
    const sql=bindLive(requestOne,'cs_live_NativeBound');const result=await race(sql,sql);
    assert.deepEqual(JSON.parse(result.first),JSON.parse(result.second));
    assert.equal(await observer.query("select count(*) from public.ks_setup_purchase_intents where checkout_session_id='cs_live_NativeBound'"),'1');
  });
  await check('live binding rollback recovers one request and intent without a second session',async()=>{
    await a.query(reserveLive(requestTwo));const sql=bindLive(requestTwo,'cs_live_NativeBoundRollback');
    await race(sql,sql,{release:'rollback'});
    assert.equal(await observer.query("select count(*) from public.ks_setup_purchase_intents where checkout_session_id='cs_live_NativeBoundRollback'"),'1');
  });
  await check('live bindings reject purpose changes, cross-mode sessions and browser access',async()=>{
    await assert.rejects(()=>a.query(reserveLive(requestOne).replace("'renewal'","'new_service'")),/checkout_request_binding_changed/);
    await assert.rejects(()=>a.query(bindLive(requestOne,'cs_test_WrongMode')),/invalid_checkout_session/);
    await b.query('reset role; set role authenticated');
    await assert.rejects(()=>b.query(reserveLive(requestOne)),error=>error.code==='42501');
    await assert.rejects(()=>b.query('select * from public.ks_live_checkout_requests'),error=>error.code==='42501');
    await b.query('reset role; set role service_role');
  });
  await check('live checkout capture alone creates no payment, provider work or customer entitlement',async()=>{
    assert.deepEqual(await observer.json(`select to_jsonb(p) from public.profiles p where id='${liveOwner}'`),liveProfile);
    assert.equal(await observer.query(`select count(*) from public.ks_payment_receipts where user_id='${liveOwner}'`),'0');
    assert.deepEqual(await observer.json("select jsonb_build_object('attempts',(select count(*) from public.ks_preview_provisioning_attempts),'claims',(select count(*) from public.ks_setup_review_claims),'spent',(select coalesce(sum(spent_units),0) from public.ks_setup_review_budgets))"),{attempts:0,claims:0,spent:0});
  });
  const selectionPath='../supabase/migrations/20261025040332_add_verified_checkout_service_selection.sql';
  const selection=await readFile(new URL(selectionPath,import.meta.url),'utf8');
  report.sqlSources[selectionPath]=createHash('sha256').update(selection).digest('hex');
  const oldBound=await observer.json("select to_jsonb(r) from public.ks_live_checkout_requests r where checkout_session_id='cs_live_NativeBound'");
  install(selection);
  const customerA='00000000-0000-4000-8000-000000000031',customerB='00000000-0000-4000-8000-000000000032';
  const requestSelected='00000000-0000-4000-8000-000000000033';
  install(`insert into public.iptv_customers(id,external_id,username,source,trial,payment_status,connections_allowed)
    values('${customerA}',990001,'fictional_native_choice_a','roomba',false,'legacy_paid',1),('${customerB}',990002,'fictional_native_choice_b','roomba',false,'legacy_paid',1);
    insert into public.ks_crm_portal_links(customer_id,user_id,email_at_link,confirmed_at_link,external_id,linked_by)
    values('${customerA}','${liveOwner}','native-live@example.invalid','2026-01-01T00:00:00Z',990001,'${liveOwner}'),('${customerB}','${liveOwner}','native-live@example.invalid','2026-01-01T00:00:00Z',990002,'${liveOwner}');`);
  const choose=customer=>`select public.ks_reserve_live_service_checkout_request('${liveOwner}','${requestSelected}','bronze',1,'renewal','https://kristalstream.com','native-live@example.invalid',${literal(customer)})`;
  await check('selection migration preserves existing v1 request values and all Preview definitions',async()=>{
    assert.deepEqual(await observer.json("select to_jsonb(r)-array['renewal_customer_id','renewal_external_id'] from public.ks_live_checkout_requests r where checkout_session_id='cs_live_NativeBound'"),oldBound);
    assert.deepEqual(await observer.json(previewFunctions),oldPreview);
  });
  await check('concurrent different target choices cannot overwrite the first frozen renewal',async()=>{
    const conflict=await race(choose(customerA),choose(customerB),{expectedError:'P0001'});
    assert.match(conflict.error.message,/checkout_request_binding_changed/);
    const replay=await race(choose(customerA),choose(customerA));assert.deepEqual(JSON.parse(replay.first),JSON.parse(replay.second));
    assert.equal(JSON.parse(replay.second).renewal_customer_id,customerA);
  });
  await check('native binding and paid routing retain the chosen target among two approved services',async()=>{
    const sql=bindLive(requestSelected,'cs_live_NativeSelected');await race(sql,sql);
    await a.query(record('NativeSelected',{owner:liveOwner}));
    const route=JSON.parse(await a.query("select public.ks_route_paid_order('cs_live_NativeSelected')"));
    assert.equal(route.destination,'renewal_review');assert.equal('customer_id' in route,false);
    assert.equal(await observer.query("select customer_id from public.ks_paid_order_routes where checkout_session_id='cs_live_NativeSelected'"),customerA);
    assert.deepEqual(await observer.json(`select to_jsonb(p) from public.profiles p where id='${liveOwner}'`),liveProfile);
  });
  await check('service snapshot is owner-scoped, paged and browser-denied with no target update grant',async()=>{
    const snapshot=JSON.parse(await a.query(`select public.ks_checkout_services_snapshot('${liveOwner}','native-live@example.invalid',null)`));
    assert.equal(snapshot.services.length,2);assert.deepEqual(snapshot.services.map(s=>s.customerId),[customerA,customerB]);
    const next=JSON.parse(await a.query(`select public.ks_checkout_services_snapshot('${liveOwner}','native-live@example.invalid','${customerA}')`));assert.equal(next.services.length,1);
    const grants=await observer.json("select jsonb_build_object('browser',has_function_privilege('authenticated','public.ks_checkout_services_snapshot(uuid,text,uuid)','EXECUTE'),'targetUpdate',has_column_privilege('service_role','public.ks_live_checkout_requests','renewal_customer_id','UPDATE'))");
    assert.deepEqual(grants,{browser:false,targetUpdate:false});
    await b.query('reset role;set role authenticated');
    await assert.rejects(()=>b.query(`select public.ks_checkout_services_snapshot('${liveOwner}','native-live@example.invalid',null)`),error=>error.code==='42501');
    await b.query('reset role;set role service_role');
  });
  const reviewPath='../supabase/migrations/20261025042823_add_private_paid_renewal_review_binding.sql';
  const reviewMigration=await readFile(new URL(reviewPath,import.meta.url),'utf8');
  report.sqlSources[reviewPath]=createHash('sha256').update(reviewMigration).digest('hex');install(reviewMigration);
  // Only disposable customer fixtures are given an active service baseline.
  install(`update public.iptv_customers set expiration_at=date_trunc('second',clock_timestamp()+interval '7 days'),
    account_status='active',package_name='1 Month + 1 Connection' where id in('${customerA}','${customerB}');`);
  const prepareReview=session=>`select public.ks_prepare_paid_renewal_review('${session}','${liveOwner}')`;
  let savedOperation;
  await check('simultaneous paid review preparation commits exactly one immutable operation',async()=>{
    const sql=prepareReview('cs_live_NativeSelected'),result=await race(sql,sql);
    const first=JSON.parse(result.first),second=JSON.parse(result.second);savedOperation=first.operationId;
    assert.equal(first.state,'awaiting_verification');assert.equal(first.replayed,false);
    assert.equal(second.operationId,savedOperation);assert.equal(second.replayed,true);assert.equal(second.mayDispatch,false);
    assert.equal(await observer.query("select count(*) from public.ks_paid_renewal_review_bindings where checkout_session_id='cs_live_NativeSelected'"),'1');
  });
  const rollbackRequest='00000000-0000-4000-8000-000000000034';
  await a.query(choose(customerA).replace(requestSelected,rollbackRequest));
  await a.query(bindLive(rollbackRequest,'cs_live_NativeReviewRollback'));
  await a.query(record('NativeReviewRollback',{owner:liveOwner}));await a.query("select public.ks_route_paid_order('cs_live_NativeReviewRollback')");
  await check('rolled-back first preparation leaves the waiting retry as the only saved operation',async()=>{
    const sql=prepareReview('cs_live_NativeReviewRollback'),result=await race(sql,sql,{release:'rollback'});
    const first=JSON.parse(result.first),second=JSON.parse(result.second);
    assert.notEqual(first.operationId,second.operationId);assert.equal(second.replayed,false);
    assert.equal(await observer.query("select operation_id from public.ks_paid_renewal_review_bindings where checkout_session_id='cs_live_NativeReviewRollback'"),second.operationId);
    assert.equal(await observer.query("select count(*) from public.ks_paid_renewal_review_bindings where checkout_session_id='cs_live_NativeReviewRollback'"),'1');
  });
  await check('CRM drift during a waiting retry preserves its operation and marks only that order for review',async()=>{
    await a.query('begin');await a.query(prepareReview('cs_live_NativeSelected'));
    const waiting=competing(prepareReview('cs_live_NativeSelected'));await observeBlocked(b.pid,waiting);
    install(`update public.iptv_customers set connections_allowed=2 where id='${customerA}';`);
    await a.query('commit');const result=await waiting.result;if(result.error)throw result.error;
    const value=JSON.parse(result.value);assert.equal(value.operationId,savedOperation);assert.equal(value.state,'review_required');
    assert.equal(await observer.query("select fulfillment_status from public.ks_setup_order_queue where checkout_session_id='cs_live_NativeSelected'"),'requires_review');
    assert.equal(await observer.query("select fulfillment_status from public.ks_setup_order_queue where checkout_session_id='cs_live_NativeReviewRollback'"),'awaiting_activation');
    const privateCheck=JSON.parse(await a.query(`select public.ks_check_paid_renewal_review('cs_live_NativeSelected','${liveOwner}','${savedOperation}')`));
    assert.equal(privateCheck.binding,null);assert.equal(privateCheck.mayDispatch,false);
  });
  await check('paid-review private roles and immutable trigger prohibit rewriting or deleting an attempt',async()=>{
    const grants=await observer.json("select jsonb_build_object('browserRead',has_table_privilege('authenticated','public.ks_paid_renewal_review_bindings','SELECT'),'browserCall',has_function_privilege('anon','public.ks_prepare_paid_renewal_review(text,uuid)','EXECUTE'),'serviceUpdate',has_table_privilege('service_role','public.ks_paid_renewal_review_bindings','UPDATE'),'serviceInsert',has_table_privilege('service_role','public.ks_paid_renewal_review_bindings','INSERT'))");
    assert.deepEqual(grants,{browserRead:false,browserCall:false,serviceUpdate:false,serviceInsert:true});
    await assert.rejects(()=>a.query("delete from public.ks_paid_renewal_review_bindings where checkout_session_id='cs_live_NativeSelected'"),error=>error.code==='42501');
    await a.query('reset role');await assert.rejects(()=>a.query("delete from public.ks_paid_renewal_review_bindings where checkout_session_id='cs_live_NativeSelected'"),error=>error.code==='P0001');
    await a.query('set role service_role');
    assert.deepEqual(await observer.json(`select to_jsonb(p) from public.profiles p where id='${liveOwner}'`),liveProfile);
  });
  const quotePath='../supabase/migrations/20261025082051_add_private_paid_renewal_quote_approval.sql';
  const quoteMigration=await readFile(new URL(quotePath,import.meta.url),'utf8');
  report.sqlSources[quotePath]=createHash('sha256').update(quoteMigration).digest('hex');install(quoteMigration);
  const quoteActor='00000000-0000-4000-8000-000000000090';
  install(`update public.iptv_customers set connections_allowed=1 where id='${customerA}';
    update auth.users set email='djudge47@gmail.com',email_confirmed_at='2026-01-01T00:00:00Z',is_anonymous=false where id='${quoteActor}';`);
  let quoteSequence=34;
  async function quoteFixture(){
    const n=++quoteSequence,request=`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,reference=`cs_live_NativeQuote${n}`;
    await a.query(choose(customerA).replace(requestSelected,request));await a.query(bindLive(request,reference));
    await a.query(record(`NativeQuote${n}`,{owner:liveOwner}));await a.query(`select public.ks_route_paid_order('${reference}')`);
    const prepared=JSON.parse(await a.query(prepareReview(reference))),operationId=prepared.operationId;
    const saved=await observer.json(`select jsonb_build_object('binding',binding,'fingerprint',fingerprint) from public.ks_paid_renewal_review_bindings where operation_id='${operationId}'`),binding=saved.binding;
    const quote={purpose:'paid-renewal-quote/v1',reference,operationId,bindingFingerprint:saved.fingerprint,resellerId:'888',lineId:binding.lineId,username:binding.username,
      customerId:binding.customerId,currentPackageId:'19',packageId:'20',packageName:'1 Month + 1 Connection',months:1,connections:1,
      previousExpiresAt:new Date(binding.currentExpiresAt).toISOString(),bouquetIds:[1,60,63],catalogFingerprint:'c'.repeat(64),costUnits:'3000000'};
    const save=(patch={},checked=new Date().toISOString())=>{const canonical=JSON.stringify({...quote,...patch}),fingerprint=createHash('sha256').update(canonical).digest('hex');
      return `select public.ks_save_paid_renewal_quote_approval('${reference}','${liveOwner}','${operationId}','${quoteActor}',${literal(canonical)},'${fingerprint}',${(patch.costUnits||quote.costUnits)},68000000,'${checked}')`;};
    const lookup=`select public.ks_lookup_paid_renewal_quote_approval('${reference}','${liveOwner}','${operationId}','${quoteActor}')`;
    return{operationId,save,lookup};
  }
  const quoted=await quoteFixture();let savedApproval;
  await check('concurrent quote approvals return one saved approval and never a dispatch claim',async()=>{
    const sql=quoted.save(),result=await race(sql,sql);const first=JSON.parse(result.first),second=JSON.parse(result.second);savedApproval=first.approvalId;
    assert.equal(first.replayed,false);assert.equal(second.replayed,true);assert.equal(second.approvalId,savedApproval);assert.equal(second.mayDispatch,false);
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_quote_approvals where operation_id='${quoted.operationId}'`),'1');
  });
  await check('a competing different credit quote cannot replace the first approval',async()=>{
    const f=await quoteFixture(),result=await race(f.save(),f.save({costUnits:'4000000'}),{expectedError:'P0001'});
    assert.match(result.error.message,/paid_renewal_quote_approval_conflict/);
    assert.equal(await observer.query(`select cost_units from public.ks_paid_renewal_quote_approvals where operation_id='${f.operationId}'`),'3000000');
  });
  await check('a rolled-back quote save allows only the waiting approval to become durable',async()=>{
    const f=await quoteFixture(),sql=f.save(),result=await race(sql,sql,{release:'rollback'});
    const first=JSON.parse(result.first),second=JSON.parse(result.second);assert.notEqual(first.approvalId,second.approvalId);assert.equal(second.replayed,false);
    assert.equal(JSON.parse(await a.query(f.lookup)).approvalId,second.approvalId);
  });
  await check('quote approval private grants and immutable guard protect the saved cost',async()=>{
    const permissions=await observer.json("select jsonb_build_object('browser',has_table_privilege('authenticated','public.ks_paid_renewal_quote_approvals','SELECT'),'serviceRewrite',has_table_privilege('service_role','public.ks_paid_renewal_quote_approvals','UPDATE,DELETE'),'browserCall',has_function_privilege('anon','public.ks_lookup_paid_renewal_quote_approval(text,uuid,uuid,uuid)','EXECUTE'))");
    assert.deepEqual(permissions,{browser:false,serviceRewrite:false,browserCall:false});
    await a.query('reset role');await assert.rejects(()=>a.query(`update public.ks_paid_renewal_quote_approvals set cost_units=4000000 where operation_id='${quoted.operationId}'`),error=>error.code==='P0001');await a.query('set role service_role');
  });
  await check('expired quote evidence cannot insert and an expired saved approval remains recoverable without replacement',async()=>{
    const f=await quoteFixture();await assert.rejects(()=>a.query(f.save({},new Date(Date.now()-31000).toISOString())),error=>error.code==='P0001'&&/paid_renewal_quote_expired/.test(error.message));
    await delay(31000);const recovered=JSON.parse(await a.query(quoted.lookup));assert.equal(recovered.approvalId,savedApproval);assert.equal(recovered.reason,'quote_expired');assert.equal(recovered.state,'review_required');assert.equal(recovered.mayDispatch,false);
    const retry=JSON.parse(await a.query(quoted.save()));assert.equal(retry.approvalId,savedApproval);assert.equal(retry.validUntil,recovered.validUntil);assert.equal(retry.reason,'quote_expired');
    assert.deepEqual(await observer.json(`select to_jsonb(p) from public.profiles p where id='${liveOwner}'`),liveProfile);
  });
  for(const name of ['ks-crm-renewal-installation-schema.sql','ks-crm-live-renewal-installation-schema.sql','ks-crm-order-renewal-installation-schema.sql']){
    const sql=await readFile(new URL(name,import.meta.url),'utf8');report.sqlSources[name]=createHash('sha256').update(sql).digest('hex');install(sql);
  }
  const sendPath='../supabase/migrations/20261025084505_add_disabled_paid_renewal_send_guard.sql';
  const sendMigration=await readFile(new URL(sendPath,import.meta.url),'utf8');report.sqlSources[sendPath]=createHash('sha256').update(sendMigration).digest('hex');install(sendMigration);
  const completionPath='../supabase/migrations/20261025085917_add_private_paid_renewal_completion.sql';
  const completionMigration=await readFile(new URL(completionPath,import.meta.url),'utf8');report.sqlSources[completionPath]=createHash('sha256').update(completionMigration).digest('hex');install(completionMigration);
  let sendSequence=0;
  async function sendFixture({reseller,shared}={}){
    const f=shared||await quoteFixture(),resellerId=reseller||String(98000+(++sendSequence));
    if(!shared)await a.query(f.save({resellerId}));
    const q=await observer.json(`select jsonb_build_object('approval',approval_id,'quote',quote_fingerprint,'cost',cost_units) from public.ks_paid_renewal_quote_approvals where operation_id='${f.operationId}'`);
    const consent=`00000000-0000-4000-8000-${String(7000+(++sendSequence)).padStart(12,'0')}`,at=new Date().toISOString(),until=new Date(Date.parse(at)+300000).toISOString();
    const binding=`'${f.operationId}','${quoteActor}','${consent}',repeat('d',64),'${q.approval}','${q.quote}',${q.cost}`;
    const reserve=`select public.ks_reserve_paid_renewal_send_guard(${binding},'${at}','${at}','${until}')`;
    const lookup=`select public.ks_lookup_paid_renewal_send_guard(${binding})`;
    return{...f,resellerId,reserve,lookup,async held(){return JSON.parse(await a.query(lookup));},begin:claim=>`select public.ks_begin_paid_renewal_send_guard('${f.operationId}','${claim}')`};
  }
  await check('new send admission defaults disabled with all existing controls unchanged',async()=>{
    const f=await sendFixture();assert.equal(await a.query('select public.ks_paid_renewal_send_enabled()'),'f');
    await assert.rejects(()=>a.query(f.reserve),error=>error.code==='P0001'&&/paid_renewal_send_disabled/.test(error.message));
    assert.equal(await observer.query('select count(*) from public.ks_paid_renewal_send_operations'),'0');
  });
  install('update public.ks_paid_renewal_send_control set execution_enabled=true');
  await check('native concurrent reservations retain one claim and consent identity',async()=>{
    const f=await sendFixture(),r=await race(f.reserve,f.reserve),first=JSON.parse(r.first),second=JSON.parse(r.second);
    assert.equal(first.replayed,false);assert.equal(second.replayed,true);assert.equal(first.claimToken,second.claimToken);
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_send_operations where operation_id='${f.operationId}'`),'1');
  });
  const one=await sendFixture();let firstClaim;
  await check('simultaneous begin commits one winner and never grants the waiting retry',async()=>{
    firstClaim=JSON.parse(await a.query(one.reserve)).claimToken;const r=await race(one.begin(firstClaim),one.begin(firstClaim));
    assert.equal(r.first,'t');assert.equal(r.second,'f');assert.equal((await one.held()).state,'send_started');
  });
  await check('a rolled-back begin rolls back both physical reservations before its waiting retry wins',async()=>{
    const f=await sendFixture(),claim=JSON.parse(await a.query(f.reserve)).claimToken;
    const r=await race(f.begin(claim),f.begin(claim),{release:'rollback'});assert.equal(r.first,'t');assert.equal(r.second,'t');
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_send_reseller_slots where operation_id='${f.operationId}'`),'1');
  });
  await check('separate paid orders cannot both consume the same physical line version',async()=>{
    const reseller='99881',first=await sendFixture({reseller}),second=await sendFixture({reseller});
    const c1=JSON.parse(await a.query(first.reserve)).claimToken,c2=JSON.parse(await a.query(second.reserve)).claimToken;
    assert.equal(await a.query(first.begin(c1)),'t');assert.equal(await a.query(second.begin(c2)),'f');
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_send_reseller_slots where operation_id='${second.operationId}'`),'0');
  });
  await check('the new physical reservation blocks all five installed legacy reservation tables',async()=>{
    const fake='00000000-0000-4000-8000-000000099999',reseller=one.resellerId;
    const statements=[`insert into public.ks_preview_reseller_dispatches values('${reseller}','${fake}','${quoteActor}',repeat('a',64),clock_timestamp()+interval '1 minute',1,100,clock_timestamp())`,
      `insert into public.ks_setup_review_reseller_slots(reseller_id,claim_id) values('${reseller}','${fake}')`,
      ...['ks_crm_renewal_reseller_slots','ks_crm_live_renewal_reseller_slots','ks_crm_order_renewal_reseller_slots'].map(t=>`insert into public.${t} values('${reseller}','${fake}')`)];
    for(const sql of statements)await assert.rejects(()=>a.query(sql),error=>error.code==='P0001'&&/reseller_reserved_for_other_work/.test(error.message));
  });
  await check('an already committed legacy reservation blocks new begin without leaving a line version',async()=>{
    const reseller='99882',legacy=await legacyReviewFixture({request:sql=>observer.query(sql)},{reseller});
    await a.query(`select ${reserveReview(legacy)}`);
    const f=await sendFixture({reseller}),claim=JSON.parse(await a.query(f.reserve)).claimToken;
    await assert.rejects(()=>a.query(f.begin(claim)),error=>error.code==='P0001'&&/reseller_reserved_for_other_work/.test(error.message));
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_send_line_versions where operation_id='${f.operationId}'`),'0');
  });
  await check('an in-flight legacy reservation rejects a new begin until the legacy transaction rolls back',async()=>{
    const reseller='99883',legacy=await legacyReviewFixture({request:sql=>observer.query(sql)},{reseller}),f=await sendFixture({reseller});
    const claim=JSON.parse(await a.query(f.reserve)).claimToken;
    await a.query('begin');await a.query(`select ${reserveReview(legacy)}`);
    await assert.rejects(()=>b.query(f.begin(claim)),error=>error.code==='P0001'&&/reseller_reservation_busy/.test(error.message));
    await a.query('rollback');assert.equal(await b.query(f.begin(claim)),'t');
  });
  await check('a deferred ownership change rejects commit and rolls back every send reservation',async()=>{
    const f=await sendFixture(),claim=JSON.parse(await a.query(f.reserve)).claimToken;
    await a.query('begin');assert.equal(await a.query(f.begin(claim)),'t');
    install(`update auth.users set email_confirmed_at='2026-01-02T00:00:00Z' where id='${liveOwner}'`);
    await assert.rejects(()=>a.query('commit'),error=>error.code==='P0001'&&/paid_renewal_send_review_required/.test(error.message));
    assert.equal((await f.held()).state,'reserved');assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_send_reseller_slots where operation_id='${f.operationId}'`),'0');
    install(`update auth.users set email_confirmed_at='2026-01-01T00:00:00Z' where id='${liveOwner}'`);
  });
  await check('lost begin response and an uncertainty stop retain locks after all execution controls are off',async()=>{
    assert.equal((await one.held()).state,'send_started');assert.equal(await a.query(one.begin(firstClaim)),'f');
    await a.query(`select public.ks_stop_paid_renewal_send_guard('${one.operationId}','${firstClaim}')`);
    install('update public.ks_paid_renewal_send_control set execution_enabled=false');
    assert.equal((await one.held()).state,'reconciliation_required');assert.equal(await a.query(one.begin(firstClaim)),'f');
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_send_reseller_slots where operation_id='${one.operationId}'`),'1');
    await assert.rejects(()=>a.query(`delete from public.ks_paid_renewal_send_reseller_slots where operation_id='${one.operationId}'`),error=>error.code==='P0001'&&/paid_renewal_complete_state_unverified/.test(error.message));
    const grants=await observer.json("select jsonb_build_object('browser',has_table_privilege('authenticated','public.ks_paid_renewal_send_operations','SELECT'),'switchWrite',has_table_privilege('service_role','public.ks_paid_renewal_send_control','UPDATE'),'browserBegin',has_function_privilege('anon','public.ks_begin_paid_renewal_send_guard(uuid,uuid)','EXECUTE'))");
    assert.deepEqual(grants,{browser:false,switchWrite:false,browserBegin:false});
    assert.deepEqual(await observer.json(`select to_jsonb(p) from public.profiles p where id='${liveOwner}'`),liveProfile);
  });
  async function completionFixture(){
    const n=++quoteSequence,request=`00000000-0000-4000-8000-${String(10000+n).padStart(12,'0')}`,reference=`cs_live_NativeComplete${n}`;
    install(`update public.ks_paid_renewal_send_control set execution_enabled=true;
      update public.iptv_customers set connections_allowed=4,package_name='6 Months + 4 Connections',expiration_at=date_trunc('second',clock_timestamp()+interval '7 days') where id='${customerA}';`);
    await a.query(`select public.ks_reserve_live_service_checkout_request('${liveOwner}','${request}','gold',3,'renewal','https://kristalstream.com','native-live@example.invalid','${customerA}')`);
    await a.query(bindLive(request,reference));await a.query(`select public.ks_record_paid_checkout('${reference}','pi_NativeComplete${n}','${liveOwner}',true,'gold',3,180,15000,'usd')`);
    await a.query(`select public.ks_route_paid_order('${reference}')`);const op=JSON.parse(await a.query(prepareReview(reference))).operationId;
    const saved=await observer.json(`select jsonb_build_object('binding',binding,'fingerprint',fingerprint) from public.ks_paid_renewal_review_bindings where operation_id='${op}'`),b=saved.binding;
    const q={purpose:'paid-renewal-quote/v1',reference,operationId:op,bindingFingerprint:saved.fingerprint,resellerId:String(997000+n),lineId:b.lineId,username:b.username,customerId:b.customerId,
      currentPackageId:'76',packageId:'77',packageName:'6 Months + 3 Connections',months:6,connections:3,previousExpiresAt:new Date(b.currentExpiresAt).toISOString(),bouquetIds:[1,60,63],catalogFingerprint:'c'.repeat(64),costUnits:'15000000'};
    const canonical=JSON.stringify(q),hash=createHash('sha256').update(canonical).digest('hex');
    const approved=JSON.parse(await a.query(`select public.ks_save_paid_renewal_quote_approval('${reference}','${liveOwner}','${op}','${quoteActor}',${literal(canonical)},'${hash}',15000000,68000000,clock_timestamp())`));
    const consent=`00000000-0000-4000-8000-${String(30000+n).padStart(12,'0')}`;
    const held=JSON.parse(await a.query(`with stamp as materialized(select clock_timestamp() as at)
      select public.ks_reserve_paid_renewal_send_guard('${op}','${quoteActor}','${consent}',repeat('f',64),'${approved.approvalId}','${hash}',15000000,at,at,at+interval '5 minutes') from stamp`));
    const claim=held.claimToken;assert.equal(await a.query(`select public.ks_begin_paid_renewal_send_guard('${op}','${claim}')`),'t');
    const expectation=JSON.parse(await a.query(`select public.ks_prepare_paid_renewal_completion('${op}','${claim}','controlled_6m4_to_6m3_reset_ny/v1',true,68000000,clock_timestamp())`));
    const result={customerId:q.customerId,lineId:q.lineId,username:q.username,resellerId:q.resellerId,packageId:q.packageId,connections:3,bouquetIds:q.bouquetIds,
      expiresAt:new Date(expectation.expected_expiry).toISOString(),enabled:true,adminEnabled:true,trial:false};
    const verify=(balance=53000000,patch={})=>`select public.ks_verify_paid_renewal_completion('${op}','${claim}',${literal(JSON.stringify({...result,...patch}))}::jsonb,${balance},clock_timestamp())`;
    const complete=`select public.ks_complete_paid_renewal('${op}','${claim}',${literal(JSON.stringify(result))}::jsonb,clock_timestamp())`;
    return{op,reference,claim,result,verify,complete};
  }
  const completed=await completionFixture();
  await check('matching provider proof is stored once under competing verification workers',async()=>{
    const sql=completed.verify(),r=await race(sql,sql);assert.equal(r.first,'t');assert.equal(r.second,'f');
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_provider_proofs where operation_id='${completed.op}'`),'1');
  });
  await check('competing local completion workers update one service and release one verified slot atomically',async()=>{
    const r=await race(completed.complete,completed.complete);assert.equal(JSON.parse(r.first).replayed,false);assert.equal(JSON.parse(r.second).replayed,true);
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_completions where operation_id='${completed.op}'`),'1');
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_send_reseller_slots where operation_id='${completed.op}'`),'0');
    assert.equal(await observer.query(`select fulfillment_status from public.ks_setup_order_queue where checkout_session_id='${completed.reference}'`),'setup_complete');
    assert.equal(await observer.query(`select connections_allowed from public.iptv_customers where id='${customerA}'`),'3');
  });
  await check('rolled-back completion restores CRM, queue and reservation before the waiting worker completes once',async()=>{
    const f=await completionFixture();await a.query(f.verify());const r=await race(f.complete,f.complete,{release:'rollback'});
    assert.equal(JSON.parse(r.first).replayed,false);assert.equal(JSON.parse(r.second).replayed,false);
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_completions where operation_id='${f.op}'`),'1');
  });
  await check('queue write failure rolls back service updates and retains verified proof for recovery',async()=>{
    const f=await completionFixture();await a.query(f.verify());const before=await observer.json(`select to_jsonb(c) from public.iptv_customers c where id='${customerA}'`);
    install(`create function public.ks_fixture_completion_fault() returns trigger language plpgsql as $$ begin if new.checkout_session_id='${f.reference}' then raise exception 'fictional_queue_write_failure';end if;return new;end;$$;
      create trigger ks_fixture_completion_fault before update on public.ks_setup_order_queue for each row execute function public.ks_fixture_completion_fault();`);
    await assert.rejects(()=>a.query(f.complete),error=>error.code==='P0001'&&/fictional_queue_write_failure/.test(error.message));
    assert.deepEqual(await observer.json(`select to_jsonb(c) from public.iptv_customers c where id='${customerA}'`),before);
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_completions where operation_id='${f.op}'`),'0');
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_send_reseller_slots where operation_id='${f.op}'`),'1');
    install('drop trigger ks_fixture_completion_fault on public.ks_setup_order_queue;drop function public.ks_fixture_completion_fault()');
    assert.equal(JSON.parse(await a.query(f.complete)).state,'complete');
  });
  await check('deferred completion ownership drift rolls back the entire local completion transaction',async()=>{
    const f=await completionFixture();await a.query(f.verify());const before=await observer.json(`select to_jsonb(c) from public.iptv_customers c where id='${customerA}'`);
    await a.query('begin');await a.query(f.complete);install(`update auth.users set email_confirmed_at='2026-01-02T00:00:00Z' where id='${liveOwner}'`);
    await assert.rejects(()=>a.query('commit'),error=>error.code==='P0001'&&/paid_renewal_complete_state_unverified/.test(error.message));
    assert.deepEqual(await observer.json(`select to_jsonb(c) from public.iptv_customers c where id='${customerA}'`),before);
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_send_reseller_slots where operation_id='${f.op}'`),'1');
    install(`update auth.users set email_confirmed_at='2026-01-01T00:00:00Z' where id='${liveOwner}'`);
  });
  await check('SQL independently rejects wrong target, expiry and debit proof without recording success',async()=>{
    const f=await completionFixture();
    for(const sql of[f.verify(54000000),f.verify(53000000,{lineId:'99'}),f.verify(53000000,{expiresAt:new Date(Date.parse(f.result.expiresAt)+86400000).toISOString()})]){
      await assert.rejects(()=>a.query(sql),error=>error.code==='P0001'&&/paid_renewal_provider_result_unverified/.test(error.message));
    }
    assert.equal(await observer.query(`select count(*) from public.ks_paid_renewal_provider_proofs where operation_id='${f.op}'`),'0');
  });
  await check('verified local recovery survives quote expiry and disabled dispatch while preserving billing and profiles',async()=>{
    const f=await completionFixture();await a.query(f.verify());install('update public.ks_paid_renewal_send_control set execution_enabled=false');
    const before=await observer.json(`select to_jsonb(c)-array['expiration_at','connections_allowed','package_name'] from public.iptv_customers c where id='${customerA}'`);
    await delay(31000);assert.equal(JSON.parse(await a.query(f.complete)).state,'complete');
    assert.deepEqual(await observer.json(`select to_jsonb(c)-array['expiration_at','connections_allowed','package_name'] from public.iptv_customers c where id='${customerA}'`),before);
    assert.deepEqual(await observer.json(`select to_jsonb(p) from public.profiles p where id='${liveOwner}'`),liveProfile);
  });
  report.passed=true;
  console.log(`${report.tests.length} native PostgreSQL checks passed. Fictional loopback database only; no Supabase, Stripe, email or provider calls.`);
}catch(error){report.passed=false;report.failure={message:error.message,code:error.code||null};console.error('Native receipt checks failed:',report.failure);process.exitCode=1;
}finally{
  for(const client of clients)client.stop();
  report.finishedAt=new Date().toISOString();
  if(process.env.KS_NATIVE_REPORT)await writeFile(process.env.KS_NATIVE_REPORT,JSON.stringify(report,null,2)+'\n');
}
