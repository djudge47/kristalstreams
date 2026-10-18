import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createSetupExecutionRehearsal, automaticSetupExecutionStatus } from '../_server/ks-setup-execution-rehearsal.js';
import { createGuardedWorkerFixture } from '../_server/ks-guarded-paid-fixtures.js';
import { openStreamingLogin } from '../_server/ks-login-envelope.js';

// Test-only PostgreSQL adapter. No connection string, Supabase client, network
// provider, installation SQL or deployment is supplied by this rehearsal.
const { PGlite } = await import(process.env.KS_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const kind = 'isolated-simulation';
const claimId = '00000000-0000-4000-8000-000000000081';
let checks = 0;
const check = async (label, fn) => { await fn(); checks++; console.log(`PASS: ${label}`); };
const query = async (sql, args = []) => (await db.query(sql, args)).rows;
const totals = async () => (await query(`select
  (select count(*)::int from ks_rehearsal.crm) as crm,
  (select count(*)::int from ks_rehearsal.logins) as logins,
  (select count(*)::int from ks_rehearsal.completions) as completions,
  (select count(*)::int from ks_rehearsal.slots) as slots,
  (select spent::text from ks_rehearsal.budget) as spent,
  (select reserved::text from ks_rehearsal.budget) as reserved`))[0];

async function fixture(fault = '') {
  await db.exec('truncate ks_rehearsal.claims,ks_rehearsal.executions,ks_rehearsal.crm,ks_rehearsal.completions,ks_rehearsal.logins,ks_rehearsal.queue,ks_rehearsal.slots,ks_rehearsal.budget');
  const old = createGuardedWorkerFixture();
  const env = { ...old.env, NODE_ENV: 'test' };
  let clock = old.now, failed = false, eligible = true, revoked = false, latestLogin, currentLine;
  const clone = value => structuredClone(value);
  const claim = { id: claimId, ownerId: old.input.ownerId, sessionId: old.session.id, intentId: old.session.payment_intent.id,
    environment: 'preview', state: 'reserved_for_review', mayDispatch: false, tier: 'bronze', connections: 1,
    resellerId: '99999', packageId: old.review.entry.provider.id, packageFingerprint: old.review.entry.provider.fingerprint,
    costUnits: '1500000', balanceUnits: '100500000' };
  await query('insert into ks_rehearsal.claims values($1,$2,$3,$4,$5)',[claimId,claim.ownerId,claim.sessionId,claim.intentId,JSON.stringify(claim)]);
  await query("insert into ks_rehearsal.queue values($1,'awaiting_activation');",[claimId]);
  await query('insert into ks_rehearsal.slots values($1,$2)',[claim.resellerId,claimId]);
  await query('insert into ks_rehearsal.budget values($1,10000000,0,1500000)',[claim.resellerId]);
  const calls = { creates: 0, paymentReads: 0, begin: 0, completes: 0, reads: 0 };
  const context = { environment: 'preview', ownerId: claim.ownerId, sessionId: claim.sessionId, attemptId: claimId };
  const store = { kind,
    async load(id, owner) {
      const rows = await query('select c.payload as claim,e.state,e.envelope,e.username_hash,e.selected,e.dispatched_at,e.proof from ks_rehearsal.claims c left join ks_rehearsal.executions e using(claim_id) where c.claim_id=$1 and c.owner_id=$2',[id,owner]);
      if (!rows.length) return null;
      const r=rows[0];return { claim:r.claim, execution:r.state?{ state:r.state,envelope:r.envelope,usernameHash:r.username_hash,selected:r.selected,dispatchedAt:r.dispatched_at===null?null:Number(r.dispatched_at),proof:r.proof }:null };
    },
    async assertOwnerAndEligibility(c) { if (!eligible || c.ownerId!==claim.ownerId) throw new Error('confirmed_new_customer_required'); },
    async assertCurrentReservation(c, time) { if (revoked || c.id!==claimId || time>old.now+120000) throw new Error('current_reservation_required'); },
    async assertDispatchWindow(c, time) { return this.assertCurrentReservation(c,time); },
    async prepare(c, value) {
      await query("insert into ks_rehearsal.executions(claim_id,state,envelope,username_hash,selected) values($1,'prepared',$2,$3,$4) on conflict do nothing",[c.id,JSON.stringify(value.envelope),value.usernameHash,JSON.stringify(value.selected)]);
      if(fault==='lost_prepare_reply'&&!failed){failed=true;throw new Error('synthetic_lost_reply');}
    },
    async begin(c, time) {
      calls.begin++;
      if (fault==='revoke_after_claim') revoked=true;
      if (fault==='stale_after_claim') clock+=31000;
      const result=await query("update ks_rehearsal.executions set state='dispatching',dispatched_at=$2 where claim_id=$1 and state='prepared' returning claim_id",[c.id,time]);
      if(fault==='lost_begin_reply'&&result.length)throw new Error('synthetic_lost_reply');
      return result.length===1;
    },
    async verified(c, proof) {
      if(fault==='proof_write_failure')throw new Error('synthetic_storage_failure');
      const result=await query("update ks_rehearsal.executions set state='provider_verified',proof=$2 where claim_id=$1 and state='dispatching' returning claim_id",[c.id,JSON.stringify(proof)]);
      if(result.length!==1)throw new Error('proof_not_saved');
      if(fault==='lost_proof_reply')throw new Error('synthetic_lost_reply');
    },
    async reconcile(c) {
      if(fault==='reconcile_write_failure')throw new Error('synthetic_storage_failure');
      await query("update ks_rehearsal.executions set state='reconciliation_required' where claim_id=$1 and state='dispatching'",[c.id]);
    },
    async complete(c, proof) {
      calls.completes++;
      // All simulated CRM, owner handoff, audit, queue, budget and slot writes
      // commit together. These tables are test fixtures, not application tables.
      await db.exec('begin');
      try {
        const [saved]=await query('select * from ks_rehearsal.executions where claim_id=$1 for update',[c.id]);
        if(saved.state==='credentials_ready'){await db.exec('commit');return;}
        assert.equal(saved.state,'provider_verified');assert.deepEqual(saved.proof,proof);
        const [slot]=await query('select * from ks_rehearsal.slots where reseller_id=$1 for update',[c.resellerId]);
        assert.equal(slot.claim_id,c.id);
        const [budget]=await query('select * from ks_rehearsal.budget where reseller_id=$1 for update',[c.resellerId]);
        assert.ok(BigInt(budget.reserved)>=BigInt(c.costUnits));
        await query('insert into ks_rehearsal.crm values($1,$2,$3,$4,$5)',[c.id,c.ownerId,proof.id,proof.username,proof.expiresAt]);
        if(fault==='crm_rollback'&&!failed){failed=true;throw new Error('synthetic_after_crm_failure');}
        await query('insert into ks_rehearsal.completions values($1,$2,$3,$4,$5)',[c.id,c.ownerId,c.sessionId,c.intentId,JSON.stringify(proof)]);
        await query('insert into ks_rehearsal.logins values($1,$2,$3)',[c.id,c.ownerId,JSON.stringify(saved.envelope)]);
        await query("update ks_rehearsal.queue set state='setup_complete' where claim_id=$1",[c.id]);
        await query('update ks_rehearsal.budget set reserved=reserved-$2,spent=spent+$2 where reseller_id=$1',[c.resellerId,c.costUnits]);
        await query('delete from ks_rehearsal.slots where claim_id=$1',[c.id]);
        await query("update ks_rehearsal.executions set state='credentials_ready' where claim_id=$1",[c.id]);
        if(fault==='settlement_rollback'&&!failed){failed=true;throw new Error('synthetic_after_settlement_failure');}
        await db.exec('commit');
      }catch(error){await db.exec('rollback');throw error;}
      if(fault==='lost_completion_reply'&&!failed){failed=true;throw new Error('synthetic_lost_reply');}
    },
  };
  const provider = { kind,
    async snapshot() {
      const snapshot=await old.provider.snapshot();snapshot.checkedAt=clock;
      if(fault==='package_changed')snapshot.packages[0].bouquets=[99];
      if(fault==='balance_changed')snapshot.account.credits='100';
      return snapshot;
    },
    async create(selected, login) {
      calls.creates++;latestLogin=clone(login);
      const expiry=new Date(old.now);expiry.setUTCMonth(expiry.getUTCMonth()+selected.duration.count);
      currentLine={id:'9999901',username:login.username,resellerId:claim.resellerId,packageId:selected.id,connections:selected.maxConnections,
        trial:false,enabled:true,adminEnabled:true,bouquetIds:selected.bouquetIds,expiresAt:expiry.toISOString()};
      if(fault==='timeout_after_create'||fault==='reconcile_write_failure')throw new Error('synthetic_timeout_after_create');
      return clone(currentLine);
    },
    async line(id,password) {
      calls.reads++;assert.equal(id,currentLine.id);assert.equal(password,latestLogin.password);
      const line=clone(currentLine);
      if(fault==='line_changed')line.connections=5;
      if(fault==='expiry_changed')line.expiresAt=new Date(old.now+90000).toISOString();
      return line;
    },
    async account(){return {id:claim.resellerId,credits:fault==='debit_changed'?'98':'99'};},
  };
  const payments={kind,async retrieve(id){calls.paymentReads++;assert.equal(id,claim.sessionId);const s=clone(old.session);if(fault==='refunded')s.payment_intent.latest_charge.amount_refunded=100;return s;}};
  const run=createSetupExecutionRehearsal({store,provider,payments,env,now:()=>clock});
  return {run,input:{claimId,ownerId:claim.ownerId},claim,store,provider,payments,env,calls,context,
    advance(ms){clock+=ms;},revoke(){revoked=true;},disableOwner(){eligible=false;},login:()=>latestLogin};
}

try {
  await db.exec(`create schema ks_rehearsal;
    create table ks_rehearsal.claims(claim_id uuid primary key,owner_id uuid unique,session_id text unique,intent_id text unique,payload jsonb not null);
    create table ks_rehearsal.executions(claim_id uuid primary key references ks_rehearsal.claims,state text check(state in ('prepared','dispatching','provider_verified','reconciliation_required','credentials_ready')),envelope jsonb not null,username_hash text not null,selected jsonb not null,dispatched_at bigint,proof jsonb);
    create table ks_rehearsal.budget(reseller_id text primary key,ceiling bigint,spent bigint check(spent>=0),reserved bigint check(reserved>=0),check(spent+reserved<=ceiling));
    create table ks_rehearsal.slots(reseller_id text primary key,claim_id uuid unique references ks_rehearsal.claims);
    create table ks_rehearsal.queue(claim_id uuid primary key references ks_rehearsal.claims,state text check(state in ('awaiting_activation','setup_complete')));
    create table ks_rehearsal.crm(claim_id uuid primary key references ks_rehearsal.claims,owner_id uuid unique,line_id text unique,username text,expires_at timestamptz);
    create table ks_rehearsal.completions(claim_id uuid primary key references ks_rehearsal.crm,owner_id uuid unique,session_id text unique,intent_id text unique,proof jsonb not null);
    create table ks_rehearsal.logins(claim_id uuid primary key references ks_rehearsal.completions,owner_id uuid unique,envelope jsonb not null);`);

  await check('real automatic execution stays disabled and only explicitly fictional dependencies are accepted',async()=>{
    assert.deepEqual(automaticSetupExecutionStatus(),{state:'disabled',reason:'execution_integration_not_installed',mayDispatch:false});
    const f=await fixture();
    for(const key of ['store','provider','payments'])assert.throws(()=>createSetupExecutionRehearsal({...f,[key]:{kind:'live'},env:f.env}),/isolated_rehearsal_required/);
    for(const env of [{...f.env,NODE_ENV:'production'},{...f.env,VERCEL_ENV:'production'},{}])assert.throws(()=>createSetupExecutionRehearsal({...f,env}),/isolated_rehearsal_required/);
  });
  await check('simulated creation commits CRM, encrypted owner login, order, audit and exact budget settlement together',async()=>{
    const f=await fixture();assert.equal((await f.run(f.input)).state,'credentials_ready');assert.equal(f.calls.creates,1);
    assert.deepEqual(await totals(),{crm:1,logins:1,completions:1,slots:0,spent:'1500000',reserved:'0'});
    const [login]=await query('select * from ks_rehearsal.logins');assert.deepEqual(openStreamingLogin(login.envelope,f.context,f.env),f.login());
    assert.throws(()=>openStreamingLogin(login.envelope,{...f.context,ownerId:'00000000-0000-4000-8000-000000000099'},f.env));
    assert.equal((await query('select state from ks_rehearsal.queue'))[0].state,'setup_complete');
    assert.equal((await query('select payload from ks_rehearsal.claims'))[0].payload.mayDispatch,false);
  });
  await check('repeated workers settle once and never simulate another creation',async()=>{
    const f=await fixture();for(let i=0;i<12;i++)assert.equal((await f.run(f.input)).state,'credentials_ready');
    assert.equal(f.calls.creates,1);assert.equal(f.calls.completes,1);assert.equal((await totals()).spent,'1500000');
  });
  await check('overlapping JavaScript workers compete for one durable compare-and-set',async()=>{
    const f=await fixture();await Promise.all(Array.from({length:8},()=>f.run(f.input)));
    assert.equal(f.calls.creates,1);assert.equal((await f.run(f.input)).state,'credentials_ready');assert.equal((await totals()).completions,1);
  });
  await check('lost preparation acknowledgement preserves the same encrypted login and makes no early creation',async()=>{
    const f=await fixture('lost_prepare_reply');assert.equal((await f.run(f.input)).state,'preparation_pending');assert.equal(f.calls.creates,0);
    const before=(await f.store.load(claimId,f.claim.ownerId)).execution.envelope;
    assert.equal((await f.run(f.input)).state,'credentials_ready');assert.deepEqual((await f.store.load(claimId,f.claim.ownerId)).execution.envelope,before);
  });
  await check('lost dispatch acknowledgement sends nothing and never reuses dispatch permission',async()=>{
    const f=await fixture('lost_begin_reply');for(let i=0;i<3;i++)assert.equal((await f.run(f.input)).state,'reconciliation_required');
    assert.equal(f.calls.creates,0);assert.equal((await totals()).reserved,'1500000');assert.equal((await totals()).slots,1);
  });
  for(const fault of ['timeout_after_create','line_changed','expiry_changed','debit_changed','proof_write_failure','reconcile_write_failure']) {
    await check(`${fault}: uncertain result holds the reservation and blocks a second creation`,async()=>{
      const f=await fixture(fault);for(let i=0;i<3;i++)assert.equal((await f.run(f.input)).state,'reconciliation_required');
      assert.equal(f.calls.creates,1);assert.deepEqual(await totals(),{crm:0,logins:0,completions:0,slots:1,spent:'0',reserved:'1500000'});
    });
  }
  await check('a saved verification survives a lost reply and resumes local completion only',async()=>{
    const f=await fixture('lost_proof_reply');assert.equal((await f.run(f.input)).state,'reconciliation_required');
    assert.equal((await f.store.load(claimId,f.claim.ownerId)).execution.state,'provider_verified');
    assert.equal((await f.run(f.input)).state,'credentials_ready');assert.equal(f.calls.creates,1);assert.equal(f.calls.begin,1);
  });
  for(const fault of ['crm_rollback','settlement_rollback']) {
    await check(`${fault}: partial completion rolls back and retries without creating or charging again`,async()=>{
      const f=await fixture(fault);assert.equal((await f.run(f.input)).state,'completion_pending');
      assert.deepEqual(await totals(),{crm:0,logins:0,completions:0,slots:1,spent:'0',reserved:'1500000'});
      assert.equal((await query('select state from ks_rehearsal.queue'))[0].state,'awaiting_activation');
      assert.equal((await f.run(f.input)).state,'credentials_ready');assert.equal(f.calls.creates,1);assert.equal((await totals()).spent,'1500000');
    });
  }
  await check('lost completion acknowledgement recovers the committed result without double settlement',async()=>{
    const f=await fixture('lost_completion_reply');assert.equal((await f.run(f.input)).state,'completion_pending');
    assert.equal((await f.run(f.input)).state,'credentials_ready');assert.equal(f.calls.completes,1);assert.equal(f.calls.creates,1);assert.equal((await totals()).spent,'1500000');
  });
  await check('expired or revoked review permission does not prevent completing already verified fictional work',async()=>{
    const f=await fixture('crm_rollback');await f.run(f.input);f.advance(86400000);f.revoke();
    assert.equal((await f.run(f.input)).state,'credentials_ready');assert.equal(f.calls.creates,1);
  });
  await check('a refund discovered during completion retry holds the saved proof and cannot trigger another creation',async()=>{
    const f=await fixture('crm_rollback');await f.run(f.input);
    const retrieve=f.payments.retrieve;
    f.payments.retrieve=async id=>{const session=await retrieve(id);session.payment_intent.latest_charge.refunded=true;return session;};
    await assert.rejects(()=>f.run(f.input),/settled_payment_required/);
    assert.equal(f.calls.creates,1);assert.equal((await f.store.load(claimId,f.claim.ownerId)).execution.state,'provider_verified');
    assert.equal((await totals()).slots,1);assert.equal((await totals()).completions,0);
  });
  await check('tampered stored credentials stop before dispatch and cannot be replaced by newly generated credentials',async()=>{
    const f=await fixture('lost_prepare_reply');await f.run(f.input);
    await query("update ks_rehearsal.executions set envelope=jsonb_set(envelope,'{tag}',to_jsonb($1::text))",[Buffer.alloc(16).toString('base64')]);
    await assert.rejects(()=>f.run(f.input),/login_unavailable/);assert.equal(f.calls.creates,0);assert.equal(f.calls.begin,0);
  });
  await check('database unavailability never falls through to creation',async()=>{
    const f=await fixture();f.store.load=async()=>{throw new Error('synthetic_db_unavailable');};
    assert.equal((await f.run(f.input)).state,'storage_unavailable');assert.equal(f.calls.creates,0);
  });
  await check('changed owner and refunded payment stop before any simulated dispatch',async()=>{
    const f=await fixture();await assert.rejects(()=>f.run({...f.input,ownerId:'00000000-0000-4000-8000-000000000099'}),/review_claim_required/);assert.equal(f.calls.creates,0);
    f.disableOwner();await assert.rejects(()=>f.run(f.input),/confirmed_new_customer_required/);assert.equal(f.calls.creates,0);
    const bad=await fixture('refunded');await assert.rejects(()=>bad.run(bad.input),/settled_payment_required/);assert.equal(bad.calls.begin,0);
  });
  for(const fault of ['package_changed','balance_changed','stale_after_claim','revoke_after_claim']) {
    await check(`${fault}: changed or expired evidence cannot simulate creation`,async()=>{
      const f=await fixture(fault);try{await f.run(f.input);}catch(error){assert.match(error.message,/snapshot|required/);}
      assert.equal(f.calls.creates,0);assert.equal((await totals()).reserved,'1500000');assert.equal((await totals()).slots,1);
    });
  }
  await check('database and returned results contain no plaintext password or real dispatch permission',async()=>{
    const f=await fixture();const result=await f.run(f.input);
    const all=await query(`select jsonb_build_object('execution',(select jsonb_agg(to_jsonb(e)) from ks_rehearsal.executions e),'crm',(select jsonb_agg(to_jsonb(c)) from ks_rehearsal.crm c),'login',(select jsonb_agg(to_jsonb(l)) from ks_rehearsal.logins l),'completion',(select jsonb_agg(to_jsonb(c)) from ks_rehearsal.completions c)) as data`);
    assert.ok(!JSON.stringify(all).includes(f.login().password));assert.ok(!JSON.stringify(result).includes(f.login().username));assert.equal(result.mayDispatch,false);assert.equal(result.simulation,true);
  });
  await check('the rehearsal imports no network/client/provider adapter and is absent from all API entrypoints',async()=>{
    const source=await readFile(new URL('../_server/ks-setup-execution-rehearsal.js',import.meta.url),'utf8');
    assert.doesNotMatch(source,/from ['"](?:undici|https?|@supabase|stripe|\.\/ks-paid-provider|\.\/ks-payments)/);
    const files=(await readdir(new URL('../api/',import.meta.url))).filter(name=>/\.(js|ts)$/.test(name));assert.equal(files.length,12);
    for(const file of files)assert.doesNotMatch(await readFile(new URL(`../api/${file}`,import.meta.url),'utf8'),/ks-setup-execution-rehearsal/);
  });
  console.log(`${checks} isolated lifecycle rehearsal checks passed. No real provider, credit, email, account, reviewed reservation or deployment was changed.`);
}catch(error){console.error('Setup lifecycle rehearsal failed',{message:error.message,code:error.code});process.exitCode=1;}
finally{await db.close();}
