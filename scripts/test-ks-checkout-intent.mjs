import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { bootstrap, literal } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { createBoundCheckout, verifiedCheckoutIntent } from '../_server/ks-checkout-intent.js';
import { getPlan, validateOrder } from '../_server/ks-payment-validation.js';
import { fulfill } from '../_server/ks-payments.js';
import { routingMigrationName, routingSupportSql } from './fixtures/ks-paid-order-routing.mjs';

const { PGlite } = await import(process.env.KS_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const environment = process.env.KS_TEST_CHECKOUT_MODE || 'preview';
assert.ok(['preview','production'].includes(environment));
const live = environment === 'production';
const env = { VERCEL_ENV: environment, KS_CHECKOUT_INTENT_ENABLED: 'true' };
const origin = live ? 'https://kristalstream.com' : 'https://ks-fixture.vercel.app';
const requestTable = live ? 'ks_live_checkout_requests' : 'ks_checkout_requests';
const reserveRpc = live ? 'ks_reserve_live_checkout_request' : 'ks_reserve_checkout_request';
const bindRpc = live ? 'ks_bind_live_checkout_request' : 'ks_bind_checkout_request';
const prefix = live ? 'cs_live_' : 'cs_test_';
const migration = await readFile(new URL('../supabase/migrations/20261020003225_add_private_checkout_intent_binding.sql', import.meta.url), 'utf8');
const adminSql = { request: sql => db.exec(sql) };
let passed = 0, sequence = 0;
const check = async (label, fn) => { await fn(); passed++; console.log(`PASS: ${label}`); };
const query = async (sql, args = []) => (await db.query(sql, args)).rows;

async function fixture(kind = 'new_service', order = getPlan('bronze', 1)) {
  const user = { id: randomUUID(), email: `fixture-${++sequence}@example.invalid`, is_anonymous: false, email_confirmed_at: new Date().toISOString() };
  await db.exec(`reset role; insert into auth.users(id,email,email_confirmed_at,is_anonymous) values(${literal(user.id)},${literal(user.email)},${literal(user.email_confirmed_at)},false);
    insert into public.profiles(id,email) values(${literal(user.id)},${literal(user.email)}); set role service_role;`);
  const calls = { creates: 0, retrieves: 0, rpcs: 0, sessions: new Map(), requests: new Map(), fault: '', legacyWrites: 0 };
  const body = { checkoutRequestId: randomUUID(), purchaseKind: kind };
  const stripe = { checkout: { sessions: {
    async create(params, options) {
      calls.creates++;
      const previous = calls.requests.get(options.idempotencyKey);
      if (previous) { assert.deepEqual(previous.params, params); return calls.sessions.get(previous.id); }
      const id = `${prefix}Local${sequence}x${calls.sessions.size}`;
      calls.requests.set(options.idempotencyKey, { params: structuredClone(params), id });
      const result = { id, livemode: live, mode: params.mode, metadata: params.metadata, client_reference_id: params.client_reference_id,
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
      if (name === reserveRpc) {
        if (calls.fault === 'reserve_failure') return { data: null, error: {} };
        try {
          const data = (await query(`select public.${reserveRpc}($1,$2,$3,$4,$5,$6,$7) as value`,
            [args.p_user_id,args.p_request_id,args.p_tier,args.p_connections,args.p_kind,args.p_origin,args.p_email]))[0].value;
          if (calls.fault === 'lost_reserve') { calls.fault=''; return {data:null,error:{}}; }
          return { data, error: null };
        } catch (error) { return { data: null, error }; }
      }
      if (name === bindRpc) {
        if (calls.fault === 'bind_failure') return { data: null, error: {} };
        try {
          const data = (await query(`select public.${bindRpc}($1,$2,$3) as value`,
            [args.p_user_id,args.p_request_id,args.p_session_id]))[0].value;
          if (calls.fault === 'lost_bind') { calls.fault = ''; return { data: null, error: {} }; }
          return { data, error: null };
        } catch (error) { return { data: null, error }; }
      }
      if (live && name === 'ks_record_paid_checkout') {
        const data = (await query('select public.ks_record_paid_checkout($1,$2,$3,$4,$5,$6,$7,$8,$9) as value',
          [args.p_session_id,args.p_payment_intent_id,args.p_user_id,args.p_livemode,args.p_tier,args.p_connections,args.p_duration_days,args.p_amount_cents,args.p_currency]))[0].value;
        return { data, error: null };
      }
      if (live && name === 'ks_route_paid_order') return { data: (await query('select public.ks_route_paid_order($1) as value',[args.p_session]))[0].value, error: null };
      calls.legacyWrites++; throw new Error('unexpected_receipt_write');
    },
    from(table) {
      assert.ok([requestTable,'ks_setup_purchase_intents'].includes(table));
      const filters = [];
      const builder = { select(columns) { assert.equal(columns, '*'); return this; },
        eq(column, value) { assert.ok(['user_id','request_id','checkout_session_id'].includes(column)); filters.push([column,value]); return this; },
        async maybeSingle() { return { data: (await query(`select * from public.${table} where ${filters.map(([name], i) => `${name}=$${i + 1}`).join(' and ')}`, filters.map(([,value]) => value)))[0] || null, error: null }; },
      }; return builder;
    },
  };
  const context = { live, environment, receiptOnlyLive: live, stripe, admin };
  calls.notifications = 0;
  admin.functions = { invoke: async () => { calls.notifications++; return { data: { success: true }, error: null }; } };
  const input = { body, user, order, context, origin, env };
  const row = async () => (await query(`select to_jsonb(r) as row from public.${requestTable} r where user_id=$1 and request_id=$2`, [user.id,body.checkoutRequestId]))[0]?.row;
  const paid = () => { const session = [...calls.sessions.values()][0]; session.status = 'complete'; session.payment_status = 'paid'; return session; };
  return { input, calls, user, body, row, paid, run: patch => createBoundCheckout({ ...input, ...patch }) };
}

try {
  await bootstrap(adminSql, { pglitePreflight: true });
  await db.exec(migration);
  await db.exec(await routingSupportSql());
  await db.exec(await readFile(new URL('../supabase/migrations/20261025032724_add_private_live_checkout_intent_binding.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL(routingMigrationName,new URL('./fixtures/ks-paid-order-routing.mjs',import.meta.url)),'utf8'));
  await check('migration exposes no browser table or function and uses caller privileges', async () => {
    const grants = (await query(`select has_table_privilege('anon','public.${requestTable}','select') as anon,
      has_table_privilege('authenticated','public.${requestTable}','insert') as browser,
      has_function_privilege('authenticated','public.${bindRpc}(uuid,uuid,text)','execute') as bind,
      has_function_privilege('anon','public.${reserveRpc}(uuid,uuid,text,integer,text,text,text)','execute') as reserve,
      (select relrowsecurity from pg_class where oid='public.${requestTable}'::regclass) as rls`))[0];
    assert.deepEqual(grants, { anon: false, browser: false, bind: false, reserve: false, rls: true });
    const functions = await query(`select prosecdef,proconfig from pg_proc where proname in ('${bindRpc}','${reserveRpc}','${live ? 'ks_guard_live_checkout_request' : 'ks_guard_checkout_request'}')`);
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
  await check('disabled, non-receipt live admission and mismatched environments stop before writes', async () => {
    for (const patch of [{env:{}},{env:{...env,VERCEL_ENV:live?'preview':'production'}},{context:{environment:'preview',live:true}}, {context:{environment:'production',live:false}}, ...(live?[{context:{environment:'production',live:true,receiptOnlyLive:false}}]:[])]) {
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
    for(const patch of [{client_reference_id:randomUUID()},{livemode:!live},{amount_total:1},{currency:'eur'},
      {url:'https://evil.example/pay'},{url:'http://checkout.stripe.com/pay'},{metadata:{user_id:randomUUID()}}]) {
      const f=await fixture(); await f.run(); Object.assign([...f.calls.sessions.values()][0],patch); await assert.rejects(()=>f.run());
    }
  });
  await check('request history and saved intent cannot be rewritten or removed', async () => {
    const f=await fixture(); await f.run(); const row=await f.row();
    await assert.rejects(()=>db.query(`update public.${requestTable} set tier=$1 where user_id=$2`,['gold',f.user.id]),/permission denied/);
    await assert.rejects(()=>db.query(`delete from public.${requestTable} where user_id=$1`,[f.user.id]),/permission denied/);
    await assert.rejects(()=>db.query(`select public.${bindRpc}($1,$2,$3)`,[f.user.id,f.body.checkoutRequestId,`${prefix}Changed`]),/checkout_session_binding_changed/);
    await assert.rejects(()=>db.query('delete from public.ks_setup_purchase_intents where checkout_session_id=$1',[row.checkout_session_id]),/permission denied/);
    await db.exec('reset role');
    await assert.rejects(()=>db.query(`update public.${requestTable} set amount_cents=1 where user_id=$1`,[f.user.id]),/checkout_request_is_immutable/);
    await db.exec('set role service_role');
  });
  await check('a database binding failure rolls back the intent insert before retrying the same session', async () => {
    const f=await fixture(); f.calls.fault='lost_create'; await assert.rejects(()=>f.run());
    await db.exec(`reset role; create function public.ks_fixture_bind_failure() returns trigger language plpgsql as $$
      begin if new.user_id=${literal(f.user.id)}::uuid then raise exception 'synthetic_binding_failure'; end if; return new; end; $$;
      create trigger ks_fixture_bind_failure before update on public.${requestTable} for each row execute function public.ks_fixture_bind_failure(); set role service_role;`);
    try {
      await assert.rejects(()=>f.run()); assert.equal((await f.row()).checkout_session_id,null);
      assert.equal((await query('select count(*)::int as n from public.ks_setup_purchase_intents where user_id=$1',[f.user.id]))[0].n,0);
    } finally { await db.exec(`reset role; drop trigger ks_fixture_bind_failure on public.${requestTable}; drop function public.ks_fixture_bind_failure(); set role service_role`); }
    await f.run(); assert.equal(f.calls.sessions.size,1);
  });
  await check('overlapping application retries return one saved checkout', async () => {
    const f=await fixture(); const result=await Promise.all([f.run(),f.run()]);
    assert.deepEqual(result[0],result[1]); assert.equal(f.calls.sessions.size,1);
    assert.equal((await query('select count(*)::int as n from public.ks_setup_purchase_intents where user_id=$1',[f.user.id]))[0].n,1);
  });
  await check('capture conflict rolls back both the request binding and any new intent', async () => {
    const a=await fixture(),b=await fixture(); const first=await a.run(); b.calls.fault='lost_create'; await assert.rejects(()=>b.run());
    await assert.rejects(()=>db.query(`select public.${bindRpc}($1,$2,$3)`,[b.user.id,b.body.checkoutRequestId,first.reference]));
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
  await check('a saved browser reference must match the bound request before any new Stripe create', async () => {
    const f=await fixture(); const first=await f.run();
    assert.deepEqual(await f.run({body:{...f.body,checkoutReference:first.reference}}),first);
    await assert.rejects(()=>f.run({body:{...f.body,checkoutReference:`${prefix}Other`}}));
    await assert.rejects(()=>f.run({body:{...f.body,checkoutReference:live?'cs_test_WrongMode':'cs_live_WrongMode'}}));
    assert.equal(f.calls.creates,1);
  });
  await check('existing Preview v1 keys and parameters remain identical; live requests use their own namespace', async () => {
    const f=await fixture();await f.run();
    const [key]=f.calls.requests.keys();
    const {createHash}=await import('node:crypto');
    const protocol=live?'ks_checkout_live_v1':'ks_checkout_v1';
    const hash=createHash('sha256').update(`${protocol}:${f.user.id}:${f.body.checkoutRequestId}`).digest('hex');
    assert.equal(key,`${protocol}_${hash}`);
    const params=f.calls.requests.get(key).params;
    assert.equal(params.metadata.checkout_binding_version,'1');assert.equal(params.success_url,`${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
  });
  if(live){
    await check('live admission requires actual confirmed Auth identity, not merely a matching profile',async()=>{
      const f=await fixture();
      await db.exec(`reset role; update auth.users set email_confirmed_at=null where id=${literal(f.user.id)}; set role service_role;`);
      await assert.rejects(()=>f.run());assert.equal(f.calls.creates,0);
    });
    await check('paid new service keeps its saved purpose after admission pauses before the first queue entry',async()=>{
      const f=await fixture();await f.run();const session=f.paid();
      const context={...f.input.context,receiptOnlyLive:false};
      const before=(await query('select to_jsonb(p) as value from public.profiles p where id=$1',[f.user.id]))[0].value;
      const first=await fulfill(session.id,context,f.user.id);
      const second=await fulfill(session.id,context,f.user.id);
      assert.equal(first.routing.request_kind,'new_service');assert.equal(first.routing.destination,'new_service_review');
      assert.equal(second.routing.replayed,true);assert.equal(second.replayed,true);
      assert.equal(first.provider_activated,false);assert.equal(first.activated,false);assert.equal(f.calls.legacyWrites,0);
      for(const table of ['ks_payment_receipts','ks_setup_order_queue','ks_paid_order_routes']){
        assert.equal((await query(`select count(*)::int as n from public.${table} where checkout_session_id=$1`,[session.id]))[0].n,1);
      }
      assert.deepEqual((await query('select to_jsonb(p) as value from public.profiles p where id=$1',[f.user.id]))[0].value,before);
    });
    await check('paid renewal reaches only its approved CRM service and cannot replace the selected order terms',async()=>{
      const f=await fixture('renewal',getPlan('gold',3));const customer=randomUUID();
      await db.query("insert into public.iptv_customers(id,external_id,username,source,trial,payment_status) values($1,880001,'fictional_checkout_renewal','roomba',false,'legacy_paid')",[customer]);
      await db.query('insert into public.ks_crm_portal_links(customer_id,user_id,email_at_link,confirmed_at_link,external_id,linked_by) values($1,$2,$3,$4,880001,$2)',[customer,f.user.id,f.user.email,f.user.email_confirmed_at]);
      await f.run();const session=f.paid();const result=await fulfill(session.id,{...f.input.context,receiptOnlyLive:false},f.user.id);
      assert.equal(result.routing.request_kind,'renewal');assert.equal(result.routing.destination,'renewal_review');
      const row=(await query('select customer_id from public.ks_paid_order_routes where checkout_session_id=$1',[session.id]))[0];assert.equal(row.customer_id,customer);
      assert.equal(result.tier,'gold');assert.equal(result.connections_allowed,3);assert.equal(result.provider_activated,false);assert.equal(f.calls.legacyWrites,0);
      const changed=structuredClone(session);changed.metadata.purchase_kind='new_service';
      await assert.rejects(()=>verifiedCheckoutIntent(changed,f.input.context,f.user.id));
    });
    await check('uncertain intent reads cannot fall back to legacy activation or send a notification',async()=>{
      const f=await fixture();await f.run();const session=f.paid();
      const admin={...f.input.context.admin,from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:null,error:{message:'fictional outage'}})})};
      await assert.rejects(()=>fulfill(session.id,{...f.input.context,admin,receiptOnlyLive:false},f.user.id));
      assert.equal(f.calls.legacyWrites,0);assert.equal(f.calls.notifications,0);
      assert.equal((await query('select count(*)::int as n from public.ks_payment_receipts where user_id=$1',[f.user.id]))[0].n,0);
    });
  }
  console.log(`${passed} ${environment} checkout intent checks passed using isolated SQL and simulated Stripe. No payment, provider operation or connected migration.`);
} finally { await db.close(); }
