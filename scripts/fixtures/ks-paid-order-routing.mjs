import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { literal } from './ks-reviewed-handoff/fixtures.mjs';

export const routingMigrationName = '../../supabase/migrations/20261025031536_add_private_paid_order_routing.sql';
export async function routingSupportSql() {
  const portal = await readFile(new URL('../../supabase/migrations/20261022182546_ks_crm_customer_portal.sql', import.meta.url), 'utf8');
  const boundary = portal.indexOf('create function public.ks_crm_portal_link_review');
  assert.ok(boundary > 0);
  return `alter table auth.users add column email text, add column email_confirmed_at timestamptz,
    add column is_anonymous boolean default false;\n${portal.slice(0, boundary)}`;
}

// Shared with native PostgreSQL: all identities/payments are disposable fiction.
export async function routingCases(db, check) {
  const query = async (sql, args = []) => (await db.query(sql, args)).rows;
  const route = async id => (await query('select public.ks_route_paid_order($1) as value', [id]))[0].value;
  const stored = async id => (await query('select to_jsonb(r) as value from public.ks_paid_order_routes r where checkout_session_id=$1', [id]))[0]?.value;
  let sequence = 0;
  async function fixture({ kind = 'renewal', links = 0, live = false, confirmed = true, anonymous = false,
    stale = '', intentOwner, lateIntent = false } = {}) {
    const owner = randomUUID(), id = `cs_${live ? 'live' : 'test'}_Route${++sequence}`, intent = `pi_Route${sequence}`;
    const email = `route-${owner}@example.invalid`;
    await db.exec(`reset role;
      insert into auth.users(id,email,email_confirmed_at,is_anonymous) values(${literal(owner)},${literal(email)},
        ${confirmed ? "'2026-01-01T00:00:00Z'" : 'null'},${anonymous});
      insert into public.profiles(id,email) values(${literal(owner)},${literal(email)});
      set role service_role;`);
    const customers = [];
    for (let n = 0; n < links; n++) {
      const customer = randomUUID(), panel = sequence * 100 + n + 1;
      await db.query(`insert into public.iptv_customers(id,external_id,username,trial,source,payment_status)
        values($1,$2,$3,$4,$5,$6)`, [customer, panel, `fixture_route_${sequence}_${n}`, stale === 'trial',
        stale === 'source' ? 'roomba_preview_fixture' : 'roomba', stale === 'payment' ? 'preview_test' : 'legacy_paid']);
      await db.query(`insert into public.ks_crm_portal_links(customer_id,user_id,email_at_link,confirmed_at_link,external_id,linked_by)
        values($1,$2,$3,$4,$5,$2)`, [customer, owner, stale === 'email' ? 'other@example.invalid' : email,
        stale === 'confirmation' ? '2026-01-02T00:00:00Z' : '2026-01-01T00:00:00Z', stale === 'line' ? panel + 90000 : panel]);
      customers.push(customer);
    }
    if (kind !== null) {
      await db.query(`insert into public.ks_setup_purchase_intents(checkout_session_id,user_id,kind,new_service_attested,source,captured_at)
        values($1,$2,$3,$4,'authenticated_checkout',clock_timestamp()+$5::interval)`,
      [id, intentOwner || owner, kind, kind === 'new_service', lateIntent ? '1 hour' : '-1 second']);
    }
    await db.query('select public.ks_record_paid_checkout($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, intent, owner, live, 'bronze', 1, 30, 2000, 'usd']);
    return { id, owner, customers };
  }
  await check('routing functions are invoker-only, browser-denied and read no additional Auth columns', async () => {
    const fns = await query("select prosecdef,proconfig from pg_proc where proname in ('ks_route_paid_order','ks_paid_order_route_candidate','ks_guard_paid_order_route')");
    assert.equal(fns.length, 3); assert.ok(fns.every(fn => !fn.prosecdef && fn.proconfig.includes('search_path=""')));
    const grants = (await query(`select has_function_privilege('anon','public.ks_route_paid_order(text)','execute') as anon,
      has_function_privilege('authenticated','public.ks_route_paid_order(text)','execute') as browser,
      has_table_privilege('authenticated','public.ks_paid_order_routes','select') as read,
      has_table_privilege('service_role','public.ks_paid_order_routes','update,delete') as rewrite,
      (select relrowsecurity from pg_class where oid='public.ks_paid_order_routes'::regclass) as rls`))[0];
    assert.deepEqual(grants, { anon: false, browser: false, read: false, rewrite: false, rls: true });
  });
  await check('live and test renewals select only the exact approved owner and line', async () => {
    for (const live of [false, true]) {
      const f = await fixture({ links: 1, live }); const result = await route(f.id); const row = await stored(f.id);
      assert.equal(result.destination, 'renewal_review'); assert.equal(result.reason, 'approved_service_link');
      assert.equal(result.account_id, f.owner); assert.equal(result.test_mode, !live);
      assert.equal(row.customer_id, f.customers[0]); assert.equal(result.replayed, false);
      for (const privateField of ['customer_id', 'external_id', 'payment_intent_id']) assert.equal(privateField in result, false);
    }
  });
  await check('new service remains a review request without creating an account or provider line', async () => {
    const f = await fixture({ kind: 'new_service', live: true });
    assert.equal((await route(f.id)).destination, 'new_service_review'); assert.equal((await stored(f.id)).customer_id, null);
    const existing = await fixture({ kind: 'new_service', links: 1 });
    assert.equal((await route(existing.id)).reason, 'existing_service');
  });
  await check('missing purpose, requested help and missing/ambiguous links never guess a destination', async () => {
    for (const [options, reason] of [[{ kind: null, links: 1 }, 'missing_intent'], [{ kind: 'requires_review', links: 1 }, 'review_requested'],
      [{}, 'service_link_missing'], [{ links: 2 }, 'service_links_ambiguous']]) {
      const f = await fixture(options); const value = await route(f.id);
      assert.equal(value.destination, 'manual_review'); assert.equal(value.reason, reason); assert.equal((await stored(f.id)).customer_id, null);
    }
  });
  await check('changed email, confirmation, external line, Preview record and trial require review', async () => {
    for (const stale of ['email', 'confirmation', 'line', 'source', 'payment', 'trial']) {
      const f = await fixture({ links: 1, stale }); const value = await route(f.id);
      assert.equal(value.destination, 'manual_review'); assert.equal(value.reason, 'service_link_stale');
    }
  });
  await check('unconfirmed/anonymous owners and late or foreign purchase declarations are blocked', async () => {
    const other = await fixture();
    for (const [options, reason] of [[{ confirmed: false }, 'owner_unconfirmed'], [{ anonymous: true }, 'owner_unconfirmed'],
      [{ lateIntent: true }, 'unverified_intent'], [{ intentOwner: other.owner }, 'unverified_intent']]) {
      const f = await fixture({ ...options, links: 1 }); const value = await route(f.id);
      assert.equal(value.destination, 'manual_review'); assert.equal(value.reason, reason);
    }
  });
  await check('an unmatched CRM record with the same name/email grants no ownership', async () => {
    const f = await fixture();
    await db.query(`insert into public.iptv_customers(id,external_id,username,customer_name,email,source,payment_status)
      select $1,800001,$2,'Same Name',email,'roomba','legacy_paid' from public.profiles where id=$3`, [randomUUID(), 'fictional_email_match', f.owner]);
    assert.equal((await route(f.id)).reason, 'service_link_missing');
  });
  await check('an exact retry retains the first decision after a new ownership link is approved', async () => {
    const f = await fixture(); const first = await route(f.id);
    const customer = randomUUID();
    await db.query("insert into public.iptv_customers(id,external_id,username,source) values($1,800002,'fictional_later_link','roomba')", [customer]);
    await db.query(`insert into public.ks_crm_portal_links(customer_id,user_id,email_at_link,confirmed_at_link,external_id,linked_by)
      select $1,id,email,email_confirmed_at,800002,id from auth.users where id=$2`, [customer, f.owner]);
    const replay = await route(f.id); assert.deepEqual(replay, { ...first, replayed: true });
    assert.equal((await stored(f.id)).customer_id, null);
  });
  await check('an assigned renewal retry cannot retarget after its current identity becomes stale', async () => {
    const f = await fixture({ links: 1 }); const first = await route(f.id);
    await db.exec(`reset role; update auth.users set email='changed@example.invalid' where id=${literal(f.owner)}; set role service_role;`);
    assert.deepEqual(await route(f.id), { ...first, replayed: true }); assert.equal((await stored(f.id)).customer_id, f.customers[0]);
  });
  await check('review-blocked receipts never become automatic renewals', async () => {
    const f = await fixture({ links: 1 });
    await db.query("update public.ks_setup_order_queue set fulfillment_status='requires_review' where checkout_session_id=$1", [f.id]);
    assert.equal((await route(f.id)).reason, 'receipt_requires_review');
  });
  await check('fabricated target inserts and history edits/deletes fail even for the table owner', async () => {
    const f = await fixture({ links: 1 }); await route(f.id);
    await assert.rejects(() => db.query('update public.ks_paid_order_routes set customer_id=null where checkout_session_id=$1', [f.id]), /permission denied/);
    await db.exec('reset role');
    await assert.rejects(() => db.query("update public.ks_paid_order_routes set reason='missing_intent' where checkout_session_id=$1", [f.id]), /paid_order_route_is_immutable/);
    await assert.rejects(() => db.query('delete from public.ks_paid_order_routes where checkout_session_id=$1', [f.id]), /paid_order_route_is_immutable/);
    await db.exec('set role service_role');
    const fresh = await fixture({ links: 1 });
    await assert.rejects(() => db.query(`insert into public.ks_paid_order_routes(checkout_session_id,payment_intent_id,user_id,livemode,request_kind,destination,reason)
      select checkout_session_id,payment_intent_id,user_id,livemode,'requires_review','manual_review','missing_intent' from public.ks_setup_order_queue where checkout_session_id=$1`, [fresh.id]), /paid_order_route_binding_mismatch/);
  });
  await check('missing receipts, corrupted queue bindings and invalid references fail without a route', async () => {
    await assert.rejects(() => route('cs_live_Unknown'), /paid_order_receipt_required/);
    await assert.rejects(() => route('invalid'), /invalid_paid_order_reference/);
    const f = await fixture();
    await db.exec(`reset role; update public.ks_payment_receipts set duration_days=90 where checkout_session_id=${literal(f.id)}; set role service_role;`);
    await assert.rejects(() => route(f.id), /paid_order_queue_mismatch/); assert.equal(await stored(f.id), undefined);
  });
  await check('routing alone leaves receipt, queue, profile and CRM state unchanged', async () => {
    const f = await fixture({ links: 1 });
    const snapshot = async () => (await query(`select jsonb_build_object('receipt',(select to_jsonb(r) from public.ks_payment_receipts r where checkout_session_id=$1),
      'queue',(select to_jsonb(q) from public.ks_setup_order_queue q where checkout_session_id=$1),
      'profile',(select to_jsonb(p) from public.profiles p where id=$2),
      'customer',(select to_jsonb(c) from public.iptv_customers c where id=$3)) as value`, [f.id, f.owner, f.customers[0]]))[0].value;
    const before = await snapshot(); await route(f.id); await route(f.id); assert.deepEqual(await snapshot(), before);
  });
  await check('actual browser database roles cannot invoke routing or read the private targets', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`reset role; set role ${role}`);
      await assert.rejects(() => route('cs_test_Route1'), /permission denied/);
      await assert.rejects(() => db.query('select customer_id from public.ks_paid_order_routes'), /permission denied/);
    }
    await db.exec('reset role; set role service_role');
  });
}
