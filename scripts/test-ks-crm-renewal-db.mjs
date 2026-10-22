import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrap } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { runSequential } from './fixtures/ks-crm-renewal/scenarios.mjs';
import { runWorkflowChecks } from './fixtures/ks-crm-renewal/workflow.mjs';
import { installationSql, installationPreflight, installationDisabledChecks, installationStopCheck } from './fixtures/ks-crm-renewal/installation.mjs';
import { runHttpSqlChecks } from './fixtures/ks-crm-renewal/http-sql.mjs';
import { runLiveChecks } from './fixtures/ks-crm-renewal/live.mjs';

const schema=process.env.KS_RENEWAL_SCHEMA||'prototype';
assert.ok(['prototype','installation'].includes(schema));
const installing=schema==='installation';

const { PGlite }=await import(process.env.KS_PGLITE_MODULE||'@electric-sql/pglite');
const dataDir=await mkdtemp(join(tmpdir(),'ks-renewal-preflight-'));
let db=new PGlite({dataDir});
globalThis.fetch=()=>{throw Error('External transport forbidden in disposable renewal checks');};
const session=role=>({async request(sql){
  if(installing)sql=installationSql(sql);
  const results=await db.exec(/^\s*(begin|commit|rollback)\b/i.test(sql)?sql:`set role ${role};${sql}`);
  return results.flatMap(r=>r.rows).map(row=>{
    const [column,value]=Object.entries(row)[0];return column==='to_jsonb'||typeof value==='object'?JSON.stringify(value):String(value);
  }).join('\n');
}});
const admin=session('postgres'),worker=session('service_role');let checks=0;
const check=async(name,fn)=>{await fn();checks++;console.log(`PASS: ${name}`);};
try{
  const source=await readFile(new URL(installing?'./ks-crm-renewal-installation-schema.sql':'./fixtures/ks-crm-renewal/prototype.sql',import.meta.url),'utf8');
  await check('unchanged installation SQL refuses the wrong database before creating anything',async()=>{
    await assert.rejects(()=>db.exec(source),installing?/renewal_foundation_prerequisites_required/:/disposable_crm_renewal_database_required/);
    await db.exec('rollback');
    assert.equal((await db.query(`select to_regclass('public.${installing?'ks_crm_':'ks_proto_'}renewal_approvals') as target`)).rows[0].target,null);
  });
  if(installing)await check('live draft refuses every database except the explicit disposable fixture database',async()=>{
    const live=await readFile(new URL('./fixtures/ks-crm-renewal/live.sql',import.meta.url),'utf8');
    await assert.rejects(()=>db.exec(live),/disposable_live_renewal_database_required/);await db.exec('rollback');
    assert.equal((await db.query("select to_regclass('public.ks_crm_live_renewal_control') as target")).rows[0].target,null);
  });
  if(installing)await check('connected live installation refuses a database missing the reviewed foundation',async()=>{
    const live=await readFile(new URL('./ks-crm-live-renewal-installation-schema.sql',import.meta.url),'utf8');
    await assert.rejects(()=>db.exec(live),/installed_test_renewal_foundation_required/);await db.exec('rollback');
    assert.equal((await db.query("select to_regclass('public.ks_crm_live_renewal_control') as target")).rows[0].target,null);
  });
  await db.exec('create database ks_disposable_crm_renewal_test');await db.close();
  db=new PGlite({dataDir,database:'ks_disposable_crm_renewal_test'});
  await bootstrap(admin,{pglitePreflight:true});
  if(installing)await installationPreflight({admin,source,check});
  // Both runners execute untouched installation SQL, including its DB guard.
  await admin.request(source);
  if(installing)await installationDisabledChecks({admin,worker,check});
  await runSequential({admin,worker,check,expectedTables:installing?6:5});
  await runWorkflowChecks({admin,worker,check});
  if(installing){await installationStopCheck({admin,worker,check});await runHttpSqlChecks({admin,worker,check});await runLiveChecks({admin,worker,check});}
  console.log(`${checks} isolated SQL renewal checks passed. PGlite is single-session preflight, not native contention evidence. No connected database or provider was used.`);
}catch(error){console.error('Renewal SQL preflight failed',{message:error.message,code:error.code,where:error.where});process.exitCode=1;}
finally{await db.close();await rm(dataDir,{recursive:true,force:true});}
