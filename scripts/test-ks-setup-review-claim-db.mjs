import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.KS_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const owner = '00000000-0000-4000-8000-000000000001', other = '00000000-0000-4000-8000-000000000002';
const policyId = '00000000-0000-4000-8000-000000000061';
const signature = 'text,uuid,uuid,text,text,text,text,text,bigint,bigint,date,timestamptz,text';
const read = name => readFile(new URL(name, import.meta.url), 'utf8');
const paymentSql = await read('./ks-payment-schema.sql'), queueSql = await read('./ks-receipt-only-schema.sql');
const guardsSql = await read('./ks-guarded-paid-execution-schema.sql'), claimsSql = await read('./ks-setup-review-claim-schema.sql');
let count = 0;
async function check(label, fn) {
  await db.exec('begin');
  try { await fn(); count++; console.log(`PASS: ${label}`); } finally { await db.exec('rollback'); }
}
async function rejected(fn, message) {
  await db.exec('savepoint expected_failure');
  try { await assert.rejects(fn, message); } finally { await db.exec('rollback to savepoint expected_failure; release savepoint expected_failure'); }
}
async function fixture({ suffix = 'ClaimOne', user = owner, live = false, reseller = '99999', policy = policyId,
  perOrder = '2000000', daily = '10000000', minimum = '5000000', expired = false, intentKind = 'new_service' } = {}) {
  await db.exec('reset role');
  await db.query(`insert into public.ks_setup_review_policies(policy_id,environment,reseller_id,mode,policy_hash,starts_at,expires_at,per_order_units,daily_limit_units,min_reserve_units)
    values($1,$2,$3,'review-only',$4,clock_timestamp()-interval '2 minutes',clock_timestamp()+($8::int * interval '1 minute'),$5,$6,$7) on conflict do nothing`,
  [policy,live?'production':'preview',reseller,'a'.repeat(64),perOrder,daily,minimum,expired?-1:60]);
  await db.query(`insert into public.ks_setup_review_packages(policy_id,tier,connections,package_id,package_fingerprint,max_cost_units)
    values($1,'bronze',1,'1000',$2,1500000) on conflict do nothing`, [policy,'b'.repeat(64)]);
  const session = `cs_${live?'live':'test'}_${suffix}`;
  await db.exec('set role service_role');
  await db.query("select public.ks_record_paid_checkout($1,$2,$3,$4,'bronze',1,30,2000,'usd')", [session,`pi_${suffix}`,user,live]);
  await db.query(`insert into public.ks_setup_purchase_intents(checkout_session_id,user_id,kind,new_service_attested,source,captured_at)
    select $1,$2,$3,$4,'authenticated_checkout',recorded_at-interval '1 millisecond' from public.ks_payment_receipts where checkout_session_id=$1`,
  [session,user,intentKind,intentKind==='new_service']);
  const clock = (await db.query("select clock_timestamp() as at,(clock_timestamp() at time zone 'UTC')::date::text as day")).rows[0];
  return [session,user,policy,'a'.repeat(64),live?'production':'preview',reseller,'1000','b'.repeat(64),'1500000','100000000',clock.day,clock.at,'c'.repeat(64)];
}
const reserve = async args => (await db.query('select public.ks_reserve_setup_review($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) as claim',args)).rows[0].claim;
async function totals() {
  return (await db.query(`select (select count(*)::int from public.ks_setup_review_claims) as claims,
    (select count(*)::int from public.ks_setup_review_reseller_slots) as slots,
    (select coalesce(sum(reserved_units),0)::text from public.ks_setup_review_budgets) as reserved`)).rows[0];
}
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key); insert into auth.users values('${owner}'),('${other}');
    create table public.profiles(id uuid primary key references auth.users(id),email text,subscription_status text default 'inactive',active_connections int default 0,subscription_expires_at timestamptz,updated_at timestamptz default now());
    insert into public.profiles(id,email) values('${owner}','one@example.invalid'),('${other}','two@example.invalid');
    grant usage on schema public to service_role,anon,authenticated; grant select,update on public.profiles to service_role;
    create table public.ks_roomba_trial_attempts(admin_id uuid); create table public.ks_preview_paid_fulfillments(user_id uuid);
    create table public.iptv_customers(email text); create table public.ks_preview_reseller_dispatches(reseller_id text);
    create table public.ks_preview_provisioning_attempts(reseller_id text,user_id uuid,state text);
    grant select on public.ks_roomba_trial_attempts,public.ks_preview_paid_fulfillments,public.iptv_customers,public.ks_preview_reseller_dispatches,public.ks_preview_provisioning_attempts to service_role;
    ${paymentSql.slice(paymentSql.indexOf('create table'),paymentSql.indexOf('CREATE OR REPLACE FUNCTION'))}
    ${guardsSql.slice(guardsSql.indexOf('create function public.ks_assert_preview_new_customer'),guardsSql.indexOf('create function public.ks_guard_preview_dispatch_release'))}
    revoke all on function public.ks_assert_preview_new_customer(uuid) from public,anon,authenticated;
    grant execute on function public.ks_assert_preview_new_customer(uuid) to service_role;`);
  await db.exec(queueSql); await db.exec(claimsSql);
  await check('one transaction binds the order, policy, reseller slot and exact reserved credit units', async () => {
    const args=await fixture();const before=(await db.query('select jsonb_agg(to_jsonb(p) order by id) as profiles from public.profiles p')).rows[0].profiles;
    const result=await reserve(args);
    await db.exec('set constraints all immediate');
    assert.equal(result.state,'reserved_for_review'); assert.equal(result.may_dispatch,false); assert.equal(result.reserved_units,'1500000');
    assert.deepEqual(await totals(),{claims:1,slots:1,reserved:'1500000'});
    assert.deepEqual((await db.query('select jsonb_agg(to_jsonb(p) order by id) as profiles from public.profiles p')).rows[0].profiles,before);
  });
  await check('lost acknowledgement and repeated calls recover the same claim without reserving twice', async () => {
    const args=await fixture(); const first=await reserve(args);
    for(let n=0;n<10;n++){const repeated=await reserve(args);assert.equal(repeated.claim_id,first.claim_id);assert.equal(repeated.replayed,true);assert.equal(repeated.may_dispatch,false);}
    assert.deepEqual(await totals(),{claims:1,slots:1,reserved:'1500000'});
  });
  await check('changed owner, policy, package, cost, balance or review binding cannot reuse a claim', async () => {
    const args=await fixture();await reserve(args);
    for(const [index,value] of [[1,other],[3,'d'.repeat(64)],[6,'9999'],[8,'1000000'],[9,'99000000'],[12,'d'.repeat(64)]]){
      const changed=[...args];changed[index]=value;await rejected(()=>reserve(changed),/review_claim_binding_changed/);
    }
    assert.deepEqual(await totals(),{claims:1,slots:1,reserved:'1500000'});
  });
  await check('a second customer cannot occupy the same reseller slot or consume another reservation', async () => {
    const first=await fixture();await reserve(first);
    const next=await fixture({suffix:'ClaimTwo',user:other});
    await rejected(()=>reserve(next),/reseller_review_claim_exists/);assert.deepEqual(await totals(),{claims:1,slots:1,reserved:'1500000'});
  });
  await check('one customer cannot acquire a second new-service claim through another reseller', async () => {
    const first=await fixture();await reserve(first);
    const next=await fixture({suffix:'ClaimTwo',reseller:'88888',policy:'00000000-0000-4000-8000-000000000062'});
    await rejected(()=>reserve(next),/customer_review_claim_exists/);assert.deepEqual(await totals(),{claims:1,slots:1,reserved:'1500000'});
  });
  await check('live and sandbox receipt modes must match the immutable policy environment', async () => {
    const live=await fixture({live:true});const wrong=[...live];wrong[4]='preview';
    await rejected(()=>reserve(wrong),/current_review_policy_required/);
    assert.equal((await reserve(live)).may_dispatch,false);
  });
  await check('revoked or expired review policies cannot create reservations', async () => {
    const expired=await fixture({expired:true});await rejected(()=>reserve(expired),/current_review_policy_required/);
    const fresh=await fixture({suffix:'Fresh',policy:'00000000-0000-4000-8000-000000000062'});
    await db.query('update public.ks_setup_review_policies set revoked_at=clock_timestamp() where policy_id=$1',[fresh[2]]);
    await rejected(()=>reserve(fresh),/current_review_policy_required/);assert.deepEqual(await totals(),{claims:0,slots:0,reserved:'0'});
  });
  await check('policy revocation never resets or grants dispatch to a previously saved reservation', async () => {
    const args=await fixture();const first=await reserve(args);
    await db.query('update public.ks_setup_review_policies set revoked_at=clock_timestamp() where policy_id=$1',[args[2]]);
    const replay=await reserve(args);assert.equal(replay.claim_id,first.claim_id);assert.equal(replay.may_dispatch,false);
    await rejected(()=>db.query('update public.ks_setup_review_policies set revoked_at=null where policy_id=$1',[args[2]]),/setup_review_policy_is_immutable/);
  });
  await check('renewal declarations and unverified new-service intent cannot reserve', async () => {
    const args=await fixture({intentKind:'renewal'});await rejected(()=>reserve(args),/authenticated_new_service_intent_required/);
    assert.deepEqual(await totals(),{claims:0,slots:0,reserved:'0'});
  });
  await check('receipt/queue review status and mismatched purchaser stop before reservation', async () => {
    const args=await fixture();const wrong=[...args];wrong[1]=other;await rejected(()=>reserve(wrong),/verified_pending_review_order_required/);
    await db.query("update public.ks_setup_order_queue set fulfillment_status='requires_review' where checkout_session_id=$1",[args[0]]);
    await rejected(()=>reserve(args),/verified_pending_review_order_required/);
    assert.deepEqual(await totals(),{claims:0,slots:0,reserved:'0'});
  });
  await check('existing website service, previous trials and known CRM customers are rechecked inside the transaction', async () => {
    const args=await fixture();await db.query("update public.profiles set subscription_status='active' where id=$1",[owner]);
    await rejected(()=>reserve(args),/new_customer_review_required/);
    await db.exec('reset role');await db.query("update public.profiles set subscription_status='inactive' where id=$1",[owner]);
    await db.query('insert into public.ks_roomba_trial_attempts values($1)',[owner]);await db.exec('set role service_role');
    await rejected(()=>reserve(args),/existing_streaming_access_requires_review/);
    await db.exec("reset role;delete from public.ks_roomba_trial_attempts;insert into public.iptv_customers values('one@example.invalid');set role service_role");
    await rejected(()=>reserve(args),/existing_streaming_access_requires_review/);
    assert.deepEqual(await totals(),{claims:0,slots:0,reserved:'0'});
  });
  await check('prior Preview dispatch or unresolved provider work blocks the new reservation', async () => {
    const args=await fixture();await db.exec("reset role;insert into public.ks_preview_reseller_dispatches values('99999');set role service_role");
    await rejected(()=>reserve(args),/existing_reseller_work_requires_review/);
    await db.exec("reset role;delete from public.ks_preview_reseller_dispatches;insert into public.ks_preview_provisioning_attempts(reseller_id,state) values('99999','reconciliation_required');set role service_role");
    await rejected(()=>reserve(args),/existing_reseller_work_requires_review/);assert.deepEqual(await totals(),{claims:0,slots:0,reserved:'0'});
  });
  await check('package fingerprint and approved per-order cost ceiling are enforced by PostgreSQL', async () => {
    const args=await fixture();const changed=[...args];changed[7]='d'.repeat(64);await rejected(()=>reserve(changed),/review_package_cost_mismatch/);
    changed[7]=args[7];changed[8]='1500001';await rejected(()=>reserve(changed),/review_package_cost_mismatch/);
    assert.deepEqual(await totals(),{claims:0,slots:0,reserved:'0'});
  });
  await check('daily limits include persisted spent credits and queue failure releases no partial slot', async () => {
    const args=await fixture();await db.exec('reset role');
    await db.query('insert into public.ks_setup_review_budgets(reseller_id,utc_day,daily_limit_units,spent_units) values($1,$2,10000000,9000000)',[args[5],args[10]]);
    await db.exec('set role service_role');await rejected(()=>reserve(args),/daily_review_credit_limit_reached/);
    assert.deepEqual(await totals(),{claims:0,slots:0,reserved:'0'});
  });
  await check('a new policy cannot silently reset the existing UTC-day credit ceiling', async () => {
    const args=await fixture({daily:'20000000'});await db.exec('reset role');
    await db.query('insert into public.ks_setup_review_budgets(reseller_id,utc_day,daily_limit_units,spent_units) values($1,$2,10000000,9000000)',[args[5],args[10]]);
    await db.exec('set role service_role');await rejected(()=>reserve(args),/daily_review_credit_limit_reached/);
  });
  await check('outstanding budget reservations count against the daily ceiling', async () => {
    const args=await fixture();await db.exec('reset role');
    await db.query('insert into public.ks_setup_review_budgets(reseller_id,utc_day,daily_limit_units,reserved_units) values($1,$2,10000000,9000000)',[args[5],args[10]]);
    await db.exec('set role service_role');await rejected(()=>reserve(args),/daily_review_credit_limit_reached/);
    assert.deepEqual(await totals(),{claims:0,slots:0,reserved:'9000000'});
  });
  await check('provider balance must retain the minimum reserve and existing reservations', async () => {
    const args=await fixture();const low=[...args];low[9]='6499999';await rejected(()=>reserve(low),/review_credit_reserve_required/);
    await db.exec('reset role');await db.query('insert into public.ks_setup_review_budgets(reseller_id,utc_day,daily_limit_units,reserved_units) values($1,$2,10000000,1)',[args[5],args[10]]);await db.exec('set role service_role');
    const exact=[...args];exact[9]='6500000';await rejected(()=>reserve(exact),/review_credit_reserve_required/);
    exact[9]='6500001';assert.equal((await reserve(exact)).reserved_units,'1500000');
  });
  await check('stale evidence and a wrong UTC budget day cannot reserve', async () => {
    const args=await fixture();const stale=[...args];stale[11]=new Date(Date.parse(args[11])-31000);await rejected(()=>reserve(stale),/fresh_review_evidence_required/);
    const future=[...args];future[11]=new Date(Date.parse(args[11])+61000);await rejected(()=>reserve(future),/fresh_review_evidence_required/);
    const wrong=[...args];wrong[10]='2000-01-01';await rejected(()=>reserve(wrong),/fresh_review_evidence_required/);
    assert.deepEqual(await totals(),{claims:0,slots:0,reserved:'0'});
  });
  await check('a failure after slot/budget writes rolls the whole claim transaction back', async () => {
    const args=await fixture();await db.exec(`reset role;
      create function public.ks_test_claim_failure() returns trigger language plpgsql as $$begin raise exception 'synthetic_claim_failure';end;$$;
      create trigger ks_test_claim_failure after insert on public.ks_setup_review_claims for each row execute function public.ks_test_claim_failure();
      set role service_role;`);
    await rejected(()=>reserve(args),/synthetic_claim_failure/);assert.deepEqual(await totals(),{claims:0,slots:0,reserved:'0'});
    await db.exec('reset role;drop trigger ks_test_claim_failure on public.ks_setup_review_claims;set role service_role');
    assert.equal((await reserve(args)).state,'reserved_for_review');
  });
  await check('direct service INSERT still passes through all claim and budget guards', async () => {
    const args=await fixture();await rejected(()=>db.query(`insert into public.ks_setup_review_claims(checkout_session_id,payment_intent_id,user_id,policy_id,policy_hash,environment,reseller_id,utc_day,package_id,package_fingerprint,cost_units,balance_units,evidence_at,candidate_hash)
      values($1,'pi_ClaimOne',$2,$3,$4,$5,$6,$11,$7,$8,$9::bigint+99999999,$10,$12,$13)`,args),/review_package_cost_mismatch/);
    assert.deepEqual(await totals(),{claims:0,slots:0,reserved:'0'});
  });
  await check('runtime service cannot raise policies, rewrite intent/claims, reset budgets or delete slots', async () => {
    const args=await fixture();await reserve(args);
    await rejected(()=>db.exec('update public.ks_setup_review_policies set daily_limit_units=99999999'),/permission denied/);
    await rejected(()=>db.exec("update public.ks_setup_purchase_intents set kind='renewal'"),/permission denied/);
    await rejected(()=>db.exec("update public.ks_setup_review_claims set state='dispatching'"),/permission denied/);
    await rejected(()=>db.exec('update public.ks_setup_review_budgets set reserved_units=0'),/setup_review_budget_cannot_be_reset/);
    await rejected(()=>db.exec('delete from public.ks_setup_review_reseller_slots'),/permission denied/);
  });
  await check('immutable guards also reject owner-level deletion or binding changes', async () => {
    const args=await fixture();await reserve(args);await db.exec('reset role');
    await rejected(()=>db.exec('delete from public.ks_setup_review_claims'),/setup_review_claim_is_immutable/);
    await rejected(()=>db.exec('delete from public.ks_setup_review_reseller_slots'),/setup_review_history_cannot_be_deleted/);
    await rejected(()=>db.exec("update public.ks_setup_review_packages set max_cost_units=1"),/setup_review_binding_is_immutable/);
  });
  await check('all six tables have RLS and browser roles cannot reserve or read', async () => {
    const args=await fixture();await db.exec('reset role');
    const rows=(await db.query("select c.relrowsecurity,has_table_privilege('authenticated',c.oid,'select') as readable from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('ks_setup_review_policies','ks_setup_review_packages','ks_setup_purchase_intents','ks_setup_review_budgets','ks_setup_review_claims','ks_setup_review_reseller_slots')")).rows;
    assert.equal(rows.length,6);assert.ok(rows.every(row=>row.relrowsecurity&&!row.readable));
    const fns=(await db.query("select prosecdef,proconfig from pg_proc where proname in ('ks_guard_setup_review_history','ks_guard_setup_review_claim','ks_reserve_setup_review')")).rows;
    assert.equal(fns.length,3);assert.ok(fns.every(row=>!row.prosecdef&&row.proconfig.includes('search_path=""')));
    assert.equal((await db.query(`select has_function_privilege('anon','public.ks_reserve_setup_review(${signature})','execute') as allowed`)).rows[0].allowed,false);
    await db.exec('set role authenticated');await rejected(()=>reserve(args),/permission denied/);
    await rejected(()=>db.exec('select * from public.ks_setup_review_claims'),/permission denied/);
  });
  console.log(`${count} isolated atomic review-claim checks passed. All rows rolled back; no connected project, provider, real credit or account was changed.`);
} catch(error){console.error('Review-claim PostgreSQL test failed',{message:error.message,code:error.code,where:error.where});process.exitCode=1;}
finally{await db.close();}
