import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Optional isolated test dependency: @electric-sql/pglite@0.5.10. Install it in
// a temporary directory, then set KS_PGLITE_MODULE to its dist/index.js URL.
// This test has no connection string and never connects to the Supabase project.
const { PGlite } = await import(process.env.KS_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const owner = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
let checks = 0;
async function check(label, fn) { await fn(); checks++; console.log(`PASS: ${label}`); }
const originalSql = await readFile(new URL('./ks-payment-schema.sql', import.meta.url), 'utf8');
const receiptTableSql = originalSql.slice(originalSql.indexOf('create table'), originalSql.indexOf('CREATE OR REPLACE FUNCTION'));
const proposedSql = await readFile(new URL('./ks-receipt-only-schema.sql', import.meta.url), 'utf8');
async function record({ id = 'cs_test_FixtureReceipt', intent = 'pi_FixtureReceipt', user = owner, live = false,
  tier = 'bronze', connections = 1, days = 30, cents = 2000, currency = 'usd' } = {}) {
  return (await db.query('select public.ks_record_paid_checkout($1,$2,$3,$4,$5,$6,$7,$8,$9) as receipt',
    [id, intent, user, live, tier, connections, days, cents, currency])).rows[0].receipt;
}
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    insert into auth.users values ('${owner}'),('${other}');
    create table public.profiles(
      id uuid primary key references auth.users(id), email text,
      subscription_status text not null default 'inactive', subscription_tier text not null default 'bronze',
      connections_allowed integer not null default 1, active_connections integer not null default 0,
      subscription_expires_at timestamptz, stripe_checkout_session_id text,
      stripe_payment_intent_id text, updated_at timestamptz not null default now()
    );
    insert into public.profiles(id,email) values ('${owner}','one@example.invalid'),('${other}','two@example.invalid');
    grant usage on schema public to service_role,anon,authenticated;
    -- PostgreSQL SELECT FOR UPDATE also requires UPDATE privilege. Match the
    -- existing service role; the proposed recorder still performs no UPDATE.
    grant select,update on public.profiles to service_role;
    ${receiptTableSql}
  `);
  await db.exec(proposedSql);
  const before = (await db.query('select jsonb_agg(to_jsonb(p) order by id) as profiles from public.profiles p')).rows[0].profiles;
  const definition = (await db.query("select prosecdef,proconfig from pg_proc where oid='public.ks_record_paid_checkout(text,text,uuid,boolean,text,integer,integer,integer,text)'::regprocedure")).rows[0];
  await check('recorder uses caller privileges and an empty search path', async () => {
    assert.equal(definition.prosecdef, false); assert.ok(definition.proconfig.some(item => item === 'search_path=""'));
  });
  await check('anonymous and browser roles cannot execute; service role can', async () => {
    const grants = (await db.query(`select
      has_function_privilege('anon','public.ks_record_paid_checkout(text,text,uuid,boolean,text,integer,integer,integer,text)','execute') as anon,
      has_function_privilege('authenticated','public.ks_record_paid_checkout(text,text,uuid,boolean,text,integer,integer,integer,text)','execute') as browser,
      has_function_privilege('service_role','public.ks_record_paid_checkout(text,text,uuid,boolean,text,integer,integer,integer,text)','execute') as backend`)).rows[0];
    assert.deepEqual(grants, { anon: false, browser: false, backend: true });
  });
  await db.exec('set role service_role');
  await check('live and sandbox receipts remain unactivated and have no invented service expiry', async () => {
    for (const live of [false, true]) {
      const result = await record({ id: `cs_${live ? 'live' : 'test'}_Initial`, intent: `pi_Initial${live}`, live });
      assert.equal(result.order_status, 'awaiting_activation'); assert.equal(result.activated, false);
      assert.equal(result.provider_activated, false); assert.equal(result.replayed, false);
    }
    const rows = (await db.query('select activated,expires_at from public.ks_payment_receipts')).rows;
    assert.ok(rows.every(row => row.activated === false && row.expires_at === null));
  });
  await check('repeated webhook/confirmation recording preserves one immutable receipt and timestamp', async () => {
    const first = await record(); const replay = await record();
    assert.equal(first.replayed, false); assert.equal(replay.replayed, true);
    assert.equal(first.recorded_at, replay.recorded_at);
    assert.equal((await db.query("select count(*)::int as n from public.ks_payment_receipts where checkout_session_id='cs_test_FixtureReceipt'")).rows[0].n, 1);
  });
  await check('same checkout cannot change owner, intent, environment or purchased plan', async () => {
    for (const args of [{ user: other }, { intent: 'pi_Other' }, { live: true },
      { tier: 'platinum', days: 365, cents: 9500 }, { connections: 2, cents: 3500 }]) await assert.rejects(() => record(args));
  });
  await check('one payment intent cannot create a second receipt', async () => {
    await assert.rejects(() => record({ id: 'cs_test_DuplicateIntent' }), /payment_intent_already_recorded/);
  });
  await check('missing profiles, malformed references, wrong prices/durations/currency and invalid allowances fail', async () => {
    for (const args of [{ user: '00000000-0000-4000-8000-000000000099' }, { id: 'invalid' }, { intent: 'invalid' },
      { cents: 1 }, { days: 365 }, { currency: 'eur' }, { connections: 0 }, { connections: 6 }, { tier: 'unknown' },
      { id: 'cs_live_WrongEnvironment' }, { live: null }, { cents: null }]) await assert.rejects(() => record(args));
  });
  await check('all twenty approved tier/connection combinations record in both payment environments', async () => {
    for (const [tier, days, prices] of [['bronze',30,[2000,3500,5000,6500,8000]], ['silver',90,[4500,7500,11000,14000,17500]],
      ['gold',180,[6000,10500,15000,19500,24000]], ['platinum',365,[9500,16500,23500,30500,37500]]]) {
      for (const live of [false,true]) for (let connections = 1; connections <= 5; connections++) {
        const suffix = `${tier}${connections}${live}`;
        const result = await record({ id: `cs_${live ? 'live' : 'test'}_${suffix}`, intent: `pi_${suffix}`, live, tier, days, connections, cents: prices[connections-1] });
        assert.equal(result.order_status, 'awaiting_activation'); assert.equal(result.connections_allowed, connections);
      }
    }
  });
  await check('legacy activated receipts remain intact and require review rather than provider readiness', async () => {
    await record({ id: 'cs_live_Legacy', intent: 'pi_Legacy', live: true });
    await db.exec("update public.ks_payment_receipts set activated=true,expires_at='2030-01-01T00:00:00Z' where checkout_session_id='cs_live_Legacy'");
    const before = (await db.query("select to_jsonb(r) as receipt from public.ks_payment_receipts r where checkout_session_id='cs_live_Legacy'")).rows[0].receipt;
    const result = await record({ id: 'cs_live_Legacy', intent: 'pi_Legacy', live: true });
    assert.equal(result.order_status, 'requires_review'); assert.equal(result.legacy_website_activated, true);
    assert.equal(result.activated, false); assert.equal(result.provider_activated, false);
    assert.deepEqual((await db.query("select to_jsonb(r) as receipt from public.ks_payment_receipts r where checkout_session_id='cs_live_Legacy'")).rows[0].receipt, before);
  });
  await check('a stored receipt with a changed immutable field is rejected', async () => {
    await db.exec("update public.ks_payment_receipts set duration_days=90 where checkout_session_id='cs_test_FixtureReceipt'");
    await assert.rejects(() => record(), /recorded_payment_mismatch/);
  });
  await check('no customer profile field or timestamp changed despite live receipt recording', async () => {
    assert.deepEqual((await db.query('select jsonb_agg(to_jsonb(p) order by id) as profiles from public.profiles p')).rows[0].profiles, before);
  });
  await db.exec('reset role; set role authenticated');
  await check('browser role is actually denied by PostgreSQL', async () => {
    await assert.rejects(() => record(), /permission denied/);
  });
  console.log(`${checks} isolated PostgreSQL checks passed. All identities and payments are fictional; no Supabase project was contacted.`);
} catch (error) {
  console.error('Receipt-only PostgreSQL test failed', { message: error.message, code: error.code, where: error.where });
  process.exitCode = 1;
} finally { await db.close(); }
