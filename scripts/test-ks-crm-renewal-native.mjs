import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { bootstrap, json, literal, fixture as setupFixture, prepareAttempt, begin as setupBegin } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { runSequential, renewalFixture, reserve, begin, verify, complete, summary } from './fixtures/ks-crm-renewal/scenarios.mjs';
import { runWorkflowChecks } from './fixtures/ks-crm-renewal/workflow.mjs';
import { installationSql, installationPreflight, installationDisabledChecks, installationStopCheck } from './fixtures/ks-crm-renewal/installation.mjs';

const schema=process.env.KS_RENEWAL_SCHEMA||'prototype';
assert.ok(['prototype','installation'].includes(schema));
const installing=schema==='installation';

assert.equal(process.env.KS_NATIVE_DISPOSABLE_ACK,'crm-renewal-fixtures');
const target=process.env.KS_NATIVE_PG_URL,address=new URL(target);
assert.ok(['postgres:','postgresql:'].includes(address.protocol));
assert.ok(['127.0.0.1','localhost','[::1]'].includes(address.hostname));
assert.equal(address.pathname,'/ks_disposable_crm_renewal_test');
assert.equal(address.search,'');assert.equal(address.hash,'');
const psql=process.env.KS_NATIVE_PSQL||'psql',clients=[];
globalThis.fetch=()=>{throw Error('External transport forbidden in disposable renewal checks');};
const report={kind:installing?'native-crm-renewal-installation':'native-crm-renewal-rehearsal',sourceCommit:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),tests:[],sourceHashes:{}};
let serial=0;
class Session {
  constructor(name){
    this.pending=null;this.buffer='';
    this.child=spawn('bash',['-c','exec "$@" 2>&1','ks-renewal-psql',psql,'--no-psqlrc','--quiet','--no-align','--tuples-only','--set=ON_ERROR_STOP=off','--dbname',target],
      {env:{...process.env,PGAPPNAME:`ks-renewal-native-${name}`},stdio:['pipe','pipe','pipe']});
    this.child.on('error',error=>this.fail(error));this.child.on('exit',code=>this.fail(Error(`Disposable psql exited (${code})`)));
    this.child.stdout.on('data',chunk=>{
      this.buffer+=chunk.toString();let index;
      while((index=this.buffer.indexOf('\n'))>=0){
        const line=this.buffer.slice(0,index).replace(/\r$/,'');this.buffer=this.buffer.slice(index+1);const pending=this.pending;
        if(!pending)continue;
        if(line.startsWith(`${pending.marker} `)){
          clearTimeout(pending.timer);this.pending=null;const code=line.slice(pending.marker.length+1).trim();
          if(code==='00000'&&!pending.error)pending.resolve(pending.output.join('\n').trim());
          else{const error=Error(pending.error.trim()||`SQL rejected (${code})`);error.code=code;pending.reject(error);}
        }else if(/^(ERROR|FATAL):/.test(line))pending.error+=line+'\n';else pending.output.push(line);
      }
    });
    this.child.stderr.on('data',chunk=>{if(this.pending)this.pending.error+=chunk.toString();});clients.push(this);
  }
  fail(error){if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(error);this.pending=null;}}
  request(sql){
    if(installing)sql=installationSql(sql);
    assert.equal(this.pending,null,'one request per independent connection');
    return new Promise((resolve,reject)=>{
      const marker=`KS_RENEWAL_DONE_${++serial}`;
      const timer=setTimeout(()=>{this.fail(Error('Disposable SQL request timed out'));this.child.kill('SIGTERM');},12000);
      this.pending={resolve,reject,marker,timer,output:[],error:''};
      this.child.stdin.write(`${sql.trim().replace(/;$/,'')};\n\\echo ${marker} :SQLSTATE\n`);
    });
  }
  stop(){this.child.kill('SIGTERM');}
}
let admin,a,b;
const check=async(name,fn)=>{await fn();report.tests.push({name,passed:true});console.log(`PASS: ${name}`);};
async function blocked(pid,pending){
  const deadline=Date.now()+4000;
  while(Date.now()<deadline){
    if(pending.done)throw pending.error||Error('Competing statement did not wait for a native lock');
    const state=await json(admin,`coalesce((select jsonb_build_object('wait',wait_event_type,'state',state) from pg_stat_activity where pid=${pid}),'{}'::jsonb)`);
    if(state.wait==='Lock'&&state.state==='active')return;
    await delay(20);
  }
  throw Error('Native lock wait was not observed');
}
function competing(expression){
  const pending={done:false};pending.result=json(b,expression).then(value=>{pending.done=true;return {value};},error=>{pending.done=true;pending.error=error;return {error};});return pending;
}
async function race(first,second,release='commit'){
  await a.request('begin');const winner=await json(a,first),pending=competing(second);
  try{await blocked(b.pid,pending);await a.request(release);}catch(error){await a.request('rollback');throw error;}
  const loser=await pending.result;if(loser.error)throw loser.error;return [winner,loser.value];
}
try{
  admin=new Session('admin');a=new Session('a');b=new Session('b');
  for(const client of [admin,a,b]){client.pid=Number(await client.request('select pg_backend_pid()'));await client.request("set statement_timeout='8s';set lock_timeout='6s'");}
  report.server=await json(admin,"jsonb_build_object('database',current_database(),'version',current_setting('server_version_num'))");
  assert.ok(['170006','170011'].includes(report.server.version));assert.equal(new Set([admin.pid,a.pid,b.pid]).size,3);
  const source=await readFile(new URL(installing?'./ks-crm-renewal-installation-schema.sql':'./fixtures/ks-crm-renewal/prototype.sql',import.meta.url),'utf8');
  await check('unaltered installation SQL refuses the wrong database before creating objects',async()=>{
    const wrong=new URL(target);wrong.pathname='/postgres';
    const output=spawnSync(psql,['--no-psqlrc','--quiet','--set=ON_ERROR_STOP=on','--dbname',wrong.href],{input:source,encoding:'utf8',timeout:10000});
    assert.equal(output.status,3);assert.match(output.stderr,installing?/renewal_foundation_prerequisites_required/:/disposable_crm_renewal_database_required/);
    const inspect=spawnSync(psql,['--no-psqlrc','--quiet','--no-align','--tuples-only','--set=ON_ERROR_STOP=on','--dbname',wrong.href,'--command',`select to_regclass('public.${installing?'ks_crm_':'ks_proto_'}renewal_approvals') is null`],{encoding:'utf8',timeout:10000});
    assert.equal(inspect.status,0);assert.equal(inspect.stdout.trim(),'t');
  });
  report.foundationManifest=await bootstrap(admin);
  if(installing)await installationPreflight({admin,source,check});
  await admin.request(source);
  for(const name of ['scripts/fixtures/ks-crm-renewal/prototype.sql','scripts/fixtures/ks-crm-renewal/scenarios.mjs',
    'scripts/ks-crm-renewal-installation-schema.sql','scripts/fixtures/ks-crm-renewal/installation.mjs',
    'scripts/test-ks-crm-renewal-native.mjs','_server/ks-crm-renewal-approval.js','_server/ks-crm-renewal-plan.js'])
    report.sourceHashes[name]=createHash('sha256').update(await readFile(new URL('../'+name,import.meta.url))).digest('hex');
  await a.request('set role service_role');await b.request('set role service_role');
  if(installing)await installationDisabledChecks({admin,worker:a,check});
  await runSequential({admin,worker:a,check,expectedTables:installing?6:5});
  await runWorkflowChecks({admin,worker:a,check});
  await check('native same-operation concurrent begin yields exactly one committed fictional decision',async()=>{
    const f=await renewalFixture(admin,a);assert.deepEqual(await race(begin(f),begin(f)),[true,false]);
    assert.equal((await summary(admin,f)).versions,1);
  });
  await check('rollback restores the line version before a waiting begin wins',async()=>{
    const f=await renewalFixture(admin,a);assert.deepEqual(await race(begin(f),begin(f),'rollback'),[true,true]);
    assert.equal((await summary(admin,f)).versions,1);
  });
  await check('different operations competing for the same line version cannot both commit',async()=>{
    const f=await renewalFixture(admin,a),g=await renewalFixture(admin,a,{customer:f.customer,line:f.line,reseller:f.reseller,oldExpiry:f.old});
    assert.deepEqual(await race(begin(f),begin(g)),[true,false]);assert.equal((await summary(admin,g)).versions,0);
  });
  await check('different lines on one reseller fail immediately on uncommitted shared credit exclusion',async()=>{
    const f=await renewalFixture(admin,a),g=await renewalFixture(admin,b,{reseller:f.reseller});
    await a.request('begin');try{assert.equal(await json(a,begin(f)),true);
      await assert.rejects(()=>json(b,begin(g)),/reseller_reservation_busy/);await a.request('commit');
    }finally{await a.request('rollback');}
    // Same-table contention is enforced by the durable primary key; the shared
    // trigger gives a separate fixed error for conflicts with other protocols.
    await assert.rejects(()=>json(b,begin(g)),installing?/ks_crm_renewal_reseller_slots_pkey/:/ks_proto_renewal_reseller_slots_pkey/);
    assert.equal((await summary(admin,g)).versions,0);
  });
  for(const renewalFirst of [true,false])await check(`renewal and existing paid setup share the native lock (${renewalFirst?'renewal':'setup'} first)`,async()=>{
    const old=await setupFixture(admin);await prepareAttempt(admin,old);
    const f=await renewalFixture(admin,b,{reseller:old.reseller});
    const first=renewalFirst?begin(f):setupBegin(old),second=renewalFirst?setupBegin(old):begin(f);
    await a.request('begin');try{assert.equal(await json(a,first),true);await assert.rejects(()=>json(b,second),/reseller_reservation_busy/);await a.request('commit');}
    finally{await a.request('rollback');}
    await assert.rejects(()=>json(b,second),/reseller_reserved_for_other_work/);
  });
  await check('concurrent local completion commits one audit and returns replay to its competitor',async()=>{
    const f=await renewalFixture(admin,a);await json(a,begin(f));await json(a,verify(f));
    const [first,second]=await race(complete(f),complete(f));assert.equal(first.replayed,false);assert.equal(second.replayed,true);
    assert.equal((await summary(admin,f)).completions,1);assert.equal((await summary(admin,f)).slots,0);
  });
  await check('rolled-back completion restores CRM and reservation before a waiting completion succeeds',async()=>{
    const f=await renewalFixture(admin,a);await json(a,begin(f));await json(a,verify(f));
    const [first,second]=await race(complete(f),complete(f),'rollback');assert.equal(first.replayed,false);assert.equal(second.replayed,false);
    assert.equal((await summary(admin,f)).completions,1);assert.equal((await summary(admin,f)).slots,0);
  });
  await check('committed dispatch survives replacing the worker connection without another decision',async()=>{
    const f=await renewalFixture(admin,a);assert.equal(await json(a,begin(f)),true);a.stop();a=new Session('replacement');
    a.pid=Number(await a.request('select pg_backend_pid()'));await a.request('set role service_role');
    assert.equal((await json(a,reserve(f))).state,'dispatching');assert.equal(await json(a,begin(f)),false);
    assert.equal((await summary(admin,f)).versions,1);
  });
  await check('browser roles cannot read ledger rows or invoke reservation functions',async()=>{
    const f=await renewalFixture(admin,a);
    for(const role of ['anon','authenticated']){await b.request(`reset role;set role ${role}`);
      for(const sql of ['select * from public.ks_proto_renewal_approvals',`select ${reserve(f)}`,`select ${begin(f)}`])
        await assert.rejects(()=>b.request(sql),/permission denied/);
    }await b.request('reset role;set role service_role');
  });
  if(installing)await installationStopCheck({admin,worker:a,check});
  report.result='passed';console.log(`${report.tests.length} native PostgreSQL renewal checks passed. Disposable fixtures only; no provider transport or connected database.`);
}catch(error){report.result='failed';report.error={message:error.message,code:error.code};console.error('Native renewal checks failed',report.error);process.exitCode=1;}
finally{
  for(const client of clients)client.stop();
  if(process.env.KS_NATIVE_REPORT)await writeFile(process.env.KS_NATIVE_REPORT,JSON.stringify(report,null,2)+'\n');
}
