import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdtemp, rm, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { bootstrap, json } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { installationSql } from './fixtures/ks-crm-renewal/installation.mjs';
import { runOrderChecks, runOrderNativeChecks } from './fixtures/ks-crm-renewal/order.mjs';
const native=Boolean(process.env.KS_NATIVE_PG_URL),installing=true;
const clients=[],psql=process.env.KS_NATIVE_PSQL||'psql',target=process.env.KS_NATIVE_PG_URL;
const report={kind:native?'native-changed-order-renewal':'single-session-changed-order-preflight',tests:[],
  sourceCommit:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),sourceHashes:{}};
globalThis.fetch=()=>{throw Error('External transport forbidden in changed-order fixtures');};
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
let db,dataDir;
try {
  for(const file of ['_server/ks-crm-renewal-order-plan.js','_server/ks-crm-renewal-order-consent.js',
    '_server/ks-crm-renewal-order-http.js','_server/ks-crm-renewal-order-ledger.js','_server/ks-crm-renewal-order-execution.js',
    '_server/ks-crm-renewal-live-provider.js','_server/ks-roomba-crm-route.js','src/pages/admin/OrderRenewalControls.tsx',
    'scripts/ks-crm-order-renewal-installation-schema.sql','scripts/ks-crm-order-renewal-installation-verify.sql',
    'scripts/fixtures/ks-crm-renewal/order.mjs','scripts/fixtures/ks-crm-renewal/order-ui.mjs']){
    report.sourceHashes[file]=createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex');
  }
  const migrations=(await readdir(new URL('../supabase/migrations',import.meta.url))).filter(name=>/^\d{14}_ks_crm_changed_order_renewal_disabled.sql$/.test(name));
  assert.equal(migrations.length,1);
  assert.equal(await readFile(new URL('../supabase/migrations/'+migrations[0],import.meta.url),'utf8'),
    await readFile(new URL('./ks-crm-order-renewal-installation-schema.sql',import.meta.url),'utf8'));
  if(native){
    assert.equal(process.env.KS_NATIVE_DISPOSABLE_ACK,'crm-renewal-fixtures');
    const address=new URL(target);assert.ok(['postgres:','postgresql:'].includes(address.protocol));
    assert.ok(['127.0.0.1','localhost','[::1]'].includes(address.hostname));assert.equal(address.pathname,'/ks_disposable_crm_renewal_test');
    assert.equal(address.search,'');assert.equal(address.hash,'');
    admin=new Session('order-admin');a=new Session('order-a');b=new Session('order-b');
    for(const client of [admin,a,b]){client.pid=Number(await client.request('select pg_backend_pid()'));await client.request("set statement_timeout='8s';set lock_timeout='6s'");}
    report.server=await json(admin,"jsonb_build_object('database',current_database(),'version',current_setting('server_version_num'))");
    assert.ok(['170006','170011'].includes(report.server.version));assert.equal(new Set([admin.pid,a.pid,b.pid]).size,3);
  }else{
    const {PGlite}=await import(process.env.KS_PGLITE_MODULE||'@electric-sql/pglite');dataDir=await mkdtemp(join(tmpdir(),'ks-order-preflight-'));
    db=new PGlite({dataDir});await db.exec('create database ks_disposable_crm_renewal_test');await db.close();
    db=new PGlite({dataDir,database:'ks_disposable_crm_renewal_test'});
    const session=role=>({async request(sql){const results=await db.exec(/^\s*(begin|commit|rollback)\b/i.test(sql)?installationSql(sql):`set role ${role};${installationSql(sql)}`);return results.flatMap(r=>r.rows).map(row=>{const[column,value]=Object.entries(row)[0];return column==='to_jsonb'||typeof value==='object'?JSON.stringify(value):String(value);}).join('\n');}});
    admin=session('postgres');a=session('service_role');
  }
  await bootstrap(admin,{pglitePreflight:!native});
  for(const file of ['ks-crm-renewal-installation-schema.sql','ks-crm-live-renewal-installation-schema.sql'])await admin.request(await readFile(new URL('./'+file,import.meta.url),'utf8'));
  if(native){await a.request('set role service_role');await b.request('set role service_role');}
  await runOrderChecks({admin,worker:a,check});
  if(native)await runOrderNativeChecks({admin,a,b,check,race});
  report.result='passed';console.log(`${report.tests.length} changed-order renewal checks passed. Disposable fixtures only; no connected database or provider transport.`);
}catch(error){report.result='failed';report.error={message:error.message,code:error.code};console.error('Changed-order renewal checks failed',report.error);process.exitCode=1;}
finally{
  for(const client of clients)client.stop();if(db)await db.close();if(dataDir)await rm(dataDir,{recursive:true,force:true});
  if(process.env.KS_NATIVE_REPORT)await writeFile(process.env.KS_NATIVE_REPORT,JSON.stringify(report,null,2)+'\n');
}
