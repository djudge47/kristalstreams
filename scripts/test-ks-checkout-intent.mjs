import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { bootstrap, literal } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { createBoundCheckout, verifiedCheckoutIntent } from '../_server/ks-checkout-intent.js';
import { getPlan, validateOrder } from '../_server/ks-payment-validation.js';
import { fulfill } from '../_server/ks-payments.js';

const { PGlite } = await import(process.env.KS_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const env = { VERCEL_ENV: 'preview', KS_CHECKOUT_INTENT_ENABLED: 'true' };
const origin = 'https://ks-fixture.vercel.app';
const migration = await readFile(new URL('../supabase/migrations/20261020001805_add_private_checkout_intent_binding.sql', import.meta.url), 'utf8');
const adminSql = { request: sql => db.exec(sql) };
let passed = 0, sequence = 0;
const check = async (label, fn) => { await fn(); passed++; console.log(`PASS: ${label}`); };
const query = async (sql, args = []) => (await db.query(sql, args)).rows;

async function fixture(kind = 'new_service', order = getPlan('bronze', 1)) {
  const user = { id: randomUUID(), email: `fixture-${++sequence}@example.invalid`, is_anonymous: false, email_confirmed_at: new Date().toISOString() };
  await db.exec(`reset role; insert into auth.users values(${literal(user.id)});
    insert into public.profiles(id,email) values(${literal(user.id)},${literal(user.email)}); set role service_role;`);
  const calls = { creates: 0, retrieves: 0, rpcs: 0, sessions: new Map(), requests: new Map(), fault: '', legacyWrites: 0 };
  const body = { checkoutRequestId: randomUUID(), purchaseKind: kind };
  const stripe = { checkout: { sessions: {
    async create(params, options) {
      calls.creates++;
      const previous = calls.requests.get(options.idempotencyKey);
      if (previous) { assert.deepEqual(previous.params, params); return calls.sessions.get(previous.id); }
      const id = `cs_test_Local${sequence}x${calls.sessions.size}`;
      calls.requests.set(options.idempotencyKey, { params: structuredClone(params), id });
      const result = { id, livemode: false, mode: params.mode, metadata: params.metadata, client_reference_id: params.client_reference_id,
        customer_email: params.customer_email, expires_at: params.expires_at, currency: 'usd', status: 'open', payment_status: 'unpaid',
        amount_total: params.line_items[0].price_data.unit_amount, amount_subtotal: params.line_items[0].price_data.unit_amount,
        url: `https://checkout.stripe.com/c/pay/${id}`, payment_intent: `pi_Local${sequence}` };
      calls.sessions.set(id, result);
      if (calls.fault === 'lost_create') { calls.fault = ''; throw new Error('synthetic_lost_create_reply'); }
      return result;
    },
    async retrieve(id) { calls.retrieves++; return structuredClone(calls.sessions.get(id)); },
  } } };
  const admin = {
    async rpc(name, args) {
      calls.rpcs++;
      if (name === 'ks_reserve_checkout_request') {
        if (calls.fault === 'reserve_failure') return { data: null, error: {} };
        try {
          const data = (await query('select public.ks_reserve_checkout_request($1,$2,$3,$4,$5,$6,$7) as value',
            [args.p_user_id,args.p_request_id,args.p_tier,args.p_connections,args.p_kind,args.p_origin,args.p_email]))[0].value;
          if (calls.fault === 'lost_reserve') { calls.fault=''; return {data:null,error:{}}; }
          return { data, error: null };
        } catch (error) { return { data: null, error }; }
      }
      if (name === 'ks_bind_checkout_request') {
        if (calls.fault === 'bind_failure') return { data: null, error: {} };
        try {
          const data = (await query('select public.ks_bind_checkout_request($1,$2,$3) as value',
            [args.p_user_id,args.p_request_id,args.p_session_id]))[0].value;
          if (calls.fault === 'lost_bind') { calls.fault = ''; return { data: null, error: {} }; }
          return { data, error: null };
        } catch (error) { return { data: null, error }; }
      }
      calls.legacyWrites++; throw new Error('unexpected_receipt_write');
    },
    from(table) {
      assert.ok(['ks_checkout_requests','ks_setup_purchase_intents'].includes(table));
      const filters = [];
      const builder = { select(columns) { assert.equal(columns, '*'); return this; },
        eq(column, value) { assert.ok(['user_id','request_id','checkout_session_id'].includes(column)); filters.push([column,value]); return this; },
        async maybeSingle() { return { data: (await query(`select * from public.${table} where ${filters.map(([name], i) => `${name}=$${i + 1}`).join(' and ')}`, filters.map(([,value]) => value)))[0] || null, error: null }; },
      }; return builder;
    },
  };
  const context = { live: false, environment: 'preview', stripe, admin };
  const input = { body, user, order, context, origin, env };
  const row = async () => (await query('select to_jsonb(r) as row from public.ks_checkout_requests r where user_id=$1 and request_id=$2', [user.id,body.checkoutRequestId]))[0]?.row;
  const paid = () => { const session = [...calls.sessions.values()][0]; session.status = 'complete'; session.payment_status = 'paid'; return session; };
  return { input, calls, user, body, row, paid, run: patch => createBoundCheckout({ ...input, ...patch }) };
}

try {
  await bootstrap(adminSql, { pglitePreflight: true });
  await db.exec(migration);
  await check('migration exposes no browser table or function and uses caller privileges', async () => {
    const grants = (await query(`select has_table_privilege('anon','public.ks_checkout_requests','select') as anon,
      has_table_privilege('authenticated','public.ks_checkout_requests','insert') as browser,
      has_function_privilege('authenticated','public.ks_bind_checkout_request(uuid,uuid,text)','execute') as bind,
      has_function_privilege('anon','public.ks_reserve_checkout_request(uuid,uuid,text,integer,text,text,text)','execute') as reserve,
      (select relrowsecurity from pg_class where oid='public.ks_checkout_requests'::regclass) as rls`))[0];
    assert.deepEqual(grants, { anon: false, browser: false, bind: false, reserve: false, rls: true });
    const functions = await query("select prosecdef,proconfig from pg_proc where proname in ('ks_bind_checkout_request','ks_reserve_checkout_request','ks_guard_checkout_request')");
    assert.equal(functions.length, 3); assert.ok(functions.every(fn => !fn.prosecdef && fn.proconfig.includes('search_path=""')));
  });
  await check('new-service, renewal and review intent are captured before returning a payment URL', async () => {
    for (const kind of ['new_service','renewal','requires_review']) {
      const f = await fixture(kind); const result = await f.run(); const row = await f.row();
      assert.equal(result.reference, row.checkout_session_id); assert.equal(f.calls.sessions.size, 1);
      const intent = (await query('select * from public.ks_setup_purchase_intents where checkout_session_id=$1', [result.reference]))[0];
      assert.equal(intent.kind, kind); assert.equal(intent.new_service_attested, kind === 'new_service');
      assert.equal(intent.user_id, f.user.id); assert.equal(intent.source, 'authenticated_checkout');
      assert.equal(new Date(intent.captured_at).toISOString(), new Date(row.bound_at).toISOString());
      assert.equal((await query('select count(*)::int as n from public.ks_payment_receipts where user_id=$1', [f.user.id]))[0].n, 0);
    }
  });
  await check('all twenty plan combinations match the server and SQL catalogs', async () => {
    for (const tier of ['bronze','silver','gold','platinum']) for (let connections = 1; connections <= 5; connections++) {
      const f = await fixture('new_service', getPlan(tier, connections)); await f.run();
      const row = await f.row(); assert.equal(row.amount_cents, f.input.order.cents); assert.equal(row.duration_days, f.input.order.days);
    }
  });
  await check('browser owner, amount, email, source and return URL cannot replace verified inputs', async () => {
    const f = await fixture(); await f.run({ body: { ...f.body, userId: randomUUID(), email: 'wrong@example.invalid',
      price: 0.01, amount_cents: 1, origin: 'https://evil.example', source: 'browser', new_service_attested: false } });
    const row = await f.row(); assert.equal(row.user_id, f.user.id); assert.equal(row.customer_email, f.user.email);
    assert.equal(row.amount_cents, 2000); assert.equal(row.return_origin, origin);
    assert.throws(() => validateOrder({ plan: 'bronze', interval: 'monthly', connections: 1, price: 0.01 }));
  });
  await check('anonymous, unconfirmed and missing account identities stop before writes or Stripe', async () => {
    for (const patch of [{is_anonymous:true},{is_anonymous:undefined},{email_confirmed_at:null},{email_confirmed_at:'bad'},{email:''}]) {
      const f = await fixture(); await assert.rejects(() => f.run({ user: { ...f.user, ...patch } }));
      assert.equal(f.calls.rpcs, 0); assert.equal(f.calls.creates, 0);
    }
  });
  await check('disabled, production, live-mode and mismatched environments cannot use the new path', async () => {
    for (const patch of [{env:{}},{env:{...env,VERCEL_ENV:'production'}},{context:{environment:'preview',live:true}}, {context:{environment:'production',live:false}}]) {
      const f = await fixture(); await assert.rejects(() => f.run(patch)); assert.equal(f.calls.rpcs, 0);
    }
  });
  await check('missing or forged service type/request ID stops before reservation', async () => {
    for (const patch of [{purchaseKind:undefined},{purchaseKind:'trial_upgrade'},{checkoutRequestId:'bad'},{checkoutRequestId:undefined}]) {
      const f = await fixture(); await assert.rejects(() => f.run({body:{...f.body,...patch}})); assert.equal(f.calls.rpcs, 0);
    }
  });
  await check('a profile email mismatch stops before a Stripe session is created', async () => {
    const f = await fixture(); await assert.rejects(() => f.run({user:{...f.user,email:'wrong@example.invalid'}})); assert.equal(f.calls.creates,0);
  });
  await check('exact retry reuses one session, request and immutable capture timestamp', async () => {
    const f = await fixture(); const first = await f.run(); const before = await f.row();
    for (let i=0;i<3;i++) assert.deepEqual(await f.run(),first);
    assert.deepEqual(await f.row(),before); assert.equal(f.calls.creates,1); assert.equal(f.calls.sessions.size,1);
  });
  await check('lost Stripe create reply retries with identical parameters and idempotency key', async () => {
    const f = await fixture(); f.calls.fault='lost_create'; await assert.rejects(()=>f.run(),/synthetic_lost_create_reply/);
    assert.equal((await f.row()).checkout_session_id,null); await f.run(); assert.equal(f.calls.creates,2); assert.equal(f.calls.sessions.size,1);
  });
  await check('failed intent write returns no URL and a retry recovers the same session', async () => {
    const f = await fixture(); f.calls.fault='bind_failure'; await assert.rejects(()=>f.run());
    assert.equal((await f.row()).checkout_session_id,null); f.calls.fault=''; await f.run(); assert.equal(f.calls.sessions.size,1);
  });
  await check('lost binding acknowledgement recovers the committed record without another create', async () => {
    const f = await fixture(); f.calls.fault='lost_bind'; await assert.rejects(()=>f.run());
    const row=await f.row(); assert.ok(row.checkout_session_id); await f.run(); assert.equal(f.calls.creates,1); assert.deepEqual(await f.row(),row);
  });
  await check('a failed reservation creates no Stripe object', async () => {
    const f = await fixture(); f.calls.fault='reserve_failure'; await assert.rejects(()=>f.run()); assert.equal(f.calls.creates,0);
  });
  await check('lost reservation acknowledgement recovers the original frozen request before creating once', async () => {
    const f=await fixture(); f.calls.fault='lost_reserve'; await assert.rejects(()=>f.run());const saved=await f.row();
    assert.equal(f.calls.creates,0);await f.run();assert.equal((await f.row()).created_epoch,saved.created_epoch);assert.equal(f.calls.creates,1);
  });
  await check('same request cannot change plan, connections, purpose or return origin', async () => {
    const f = await fixture(); await f.run();
    for (const patch of [{order:getPlan('gold',1)},{order:getPlan('bronze',2)},{body:{...f.body,purchaseKind:'renewal'}},{origin:'https://other-fixture.vercel.app'}]) await assert.rejects(()=>f.run(patch));
    assert.equal(f.calls.creates,1);
  });
  await check('an uncertain request is not automatically created again after the retry deadline', async () => {
    const f=await fixture(); f.calls.fault='lost_create'; await assert.rejects(()=>f.run()); const row=await f.row();
    for(const offset of [1200,3600,90000]) await assert.rejects(()=>f.run({now:()=>1000*(row.created_epoch+offset)}));
    assert.equal(f.calls.creates,1);
  });
  await check('a previously completed or expired session is never returned as payable on retry', async () => {
    for (const patch of [{status:'complete',payment_status:'paid'},{status:'expired'}]) {
      const f=await fixture(); await f.run(); Object.assign([...f.calls.sessions.values()][0],patch);
      await assert.rejects(()=>f.run()); assert.equal(f.calls.creates,1);
    }
  });
  await check('changed Stripe owner, plan, amount, purpose, environment or hostile URL fails closed', async () => {
    for(const patch of [{client_reference_id:randomUUID()},{livemode:true},{amount_total:1},{currency:'eur'},
      {url:'https://evil.example/pay'},{url:'http://checkout.stripe.com/pay'},{metadata:{user_id:randomUUID()}}]) {
      const f=await fixture(); await f.run(); Object.assign([...f.calls.sessions.values()][0],patch); await assert.rejects(()=>f.run());
    }
  });
  await check('request history and saved intent cannot be rewritten or removed', async () => {
    const f=await fixture(); await f.run(); const row=await f.row();
    await assert.rejects(()=>db.query('update public.ks_checkout_requests set tier=$1 where user_id=$2',['gold',f.user.id]),/permission denied/);
    await assert.rejects(()=>db.query('delete from public.ks_checkout_requests where user_id=$1',[f.user.id]),/permission denied/);
    await assert.rejects(()=>db.query('select public.ks_bind_checkout_request($1,$2,$3)',[f.user.id,f.body.checkoutRequestId,'cs_test_Changed']),/checkout_session_binding_changed/);
    await assert.rejects(()=>db.query('delete from public.ks_setup_purchase_intents where checkout_session_id=$1',[row.checkout_session_id]),/permission denied/);
    await db.exec('reset role');
    await assert.rejects(()=>db.query('update public.ks_checkout_requests set amount_cents=1 where user_id=$1',[f.user.id]),/checkout_request_is_immutable/);
    await db.exec('set role service_role');
  });
  await check('a database binding failure rolls back the intent insert before retrying the same session', async () => {
    const f=await fixture(); f.calls.fault='lost_create'; await assert.rejects(()=>f.run());
    await db.exec(`reset role; create function public.ks_fixture_bind_failure() returns trigger language plpgsql as $$
      begin if new.user_id=${literal(f.user.id)}::uuid then raise exception 'synthetic_binding_failure'; end if; return new; end; $$;
      create trigger ks_fixture_bind_failure before update on public.ks_checkout_requests for each row execute function public.ks_fixture_bind_failure(); set role service_role;`);
    try {
      await assert.rejects(()=>f.run()); assert.equal((await f.row()).checkout_session_id,null);
      assert.equal((await query('select count(*)::int as n from public.ks_setup_purchase_intents where user_id=$1',[f.user.id]))[0].n,0);
    } finally { await db.exec('reset role; drop trigger ks_fixture_bind_failure on public.ks_checkout_requests; drop function public.ks_fixture_bind_failure(); set role service_role'); }
    await f.run(); assert.equal(f.calls.sessions.size,1);
  });
  await check('overlapping application retries return one saved checkout', async () => {
    const f=await fixture(); const result=await Promise.all([f.run(),f.run()]);
    assert.deepEqual(result[0],result[1]); assert.equal(f.calls.sessions.size,1);
    assert.equal((await query('select count(*)::int as n from public.ks_setup_purchase_intents where user_id=$1',[f.user.id]))[0].n,1);
  });
  await check('capture conflict rolls back both the request binding and any new intent', async () => {
    const a=await fixture(),b=await fixture(); const first=await a.run(); b.calls.fault='lost_create'; await assert.rejects(()=>b.run());
    await assert.rejects(()=>db.query('select public.ks_bind_checkout_request($1,$2,$3)',[b.user.id,b.body.checkoutRequestId,first.reference]));
    assert.equal((await b.row()).checkout_session_id,null); assert.equal((await a.row()).checkout_session_id,first.reference);
  });
  await check('paid verification reads the saved owner/plan/purpose and rejects another purchaser', async () => {
    const f=await fixture(); await f.run(); const session=f.paid(); const intent=await verifiedCheckoutIntent(session,f.input.context,f.user.id);
    assert.equal(intent.userId,f.user.id); assert.equal(intent.kind,'new_service'); assert.equal(intent.newServiceAttested,true);
    await assert.rejects(()=>verifiedCheckoutIntent(session,f.input.context,randomUUID()));
    const changed=structuredClone(session); changed.metadata.purchase_kind='renewal'; await assert.rejects(()=>verifiedCheckoutIntent(changed,f.input.context));
  });
  await check('receipt confirmation cannot write a mismatched bound payment', async () => {
    const f=await fixture(); await f.run(); const session=f.paid(); session.client_reference_id=randomUUID();
    await assert.rejects(()=>fulfill(session.id,f.input.context,f.user.id)); assert.equal(f.calls.legacyWrites,0);
  });
  await check('checkout capture and receipt validation never reserve credits or create provider work', async () => {
    for(const table of ['ks_setup_review_claims','ks_setup_review_budgets','ks_setup_review_reseller_slots',
      'ks_preview_reseller_dispatches','ks_preview_provisioning_attempts','ks_preview_paid_fulfillments','iptv_customers']){
      assert.equal((await query(`select count(*)::int as n from public.${table}`))[0].n,0);
    }
  });
  console.log(`${passed} checkout intent checks passed using isolated SQL and simulated Stripe. No payment, provider operation or connected migration.`);
} finally { await db.close(); }
