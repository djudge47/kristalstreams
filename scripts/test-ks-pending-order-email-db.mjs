import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { handlePendingOrderNotification } from '../supabase/functions/ks-order-notification/pending-handler.js';
import { routeOrderNotification } from '../supabase/functions/ks-order-notification/router.js';
import { fulfill } from '../_server/ks-payments.js';
import { customerSetupSnapshot } from '../_server/ks-customer-setup.js';
import { routingMigrationName, routingSupportSql } from './fixtures/ks-paid-order-routing.mjs';
// Same temporary @electric-sql/pglite@0.5.10 used by receipt/queue tests. No
// connection string, Supabase credentials, SMTP or email-provider access.
const { PGlite } = await import(process.env.KS_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const owner = '00000000-0000-4000-8000-000000000001';
const original = await readFile(new URL('./ks-payment-schema.sql', import.meta.url), 'utf8');
const legacy = await readFile(new URL('./ks-order-email-schema.sql', import.meta.url), 'utf8');
const queue = await readFile(new URL('./ks-receipt-only-schema.sql', import.meta.url), 'utf8');
const pending = await readFile(new URL('./ks-pending-order-email-schema.sql', import.meta.url), 'utf8');
let count = 0;
async function check(label, fn) { await fn(); count++; console.log(`PASS: ${label}`); }
async function record(suffix, live = false) {
  const id = `cs_${live ? 'live' : 'test'}_${suffix}`;
  await db.query("select public.ks_record_paid_checkout($1,$2,$3,$4,'bronze',1,30,2000,'usd')", [id, `pi_${suffix}`, owner, live]);
  return id;
}
async function prepare(id, email = 'fictional@example.invalid', user = owner) {
  return (await db.query('select public.ks_prepare_pending_order_alert($1,$2,$3) as alert', [id, user, email])).rows[0].alert;
}
async function complete(id, emailId = 'mail-fictional') {
  return (await db.query('select public.ks_complete_pending_order_alert($1,$2) as result', [id, emailId])).rows[0].result;
}
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    insert into auth.users values ('${owner}');
    create table public.profiles(id uuid primary key references auth.users(id),email text,
      subscription_status text not null default 'inactive',subscription_tier text not null default 'bronze',
      connections_allowed integer not null default 1,active_connections integer not null default 0,
      subscription_expires_at timestamptz,stripe_checkout_session_id text,stripe_payment_intent_id text,
      updated_at timestamptz not null default now());
    insert into public.profiles(id,email) values ('${owner}','fictional@example.invalid');
    grant usage on schema public to service_role,anon,authenticated;
    grant select,update on public.profiles to service_role;
    ${original.slice(original.indexOf('create table'),original.indexOf('CREATE OR REPLACE FUNCTION'))}
    ${legacy.slice(legacy.indexOf('create table'),legacy.indexOf('create function'))}
  `);
  await db.exec(queue); await db.exec(pending);
  // The archived editor export omits the closing statement delimiter. Add
  // that delimiter only; the legacy function body and grants stay identical.
  await db.exec(original.slice(original.indexOf('CREATE OR REPLACE FUNCTION'))
    .replace('$function$\n\nrevoke', '$function$;\n\nrevoke'));
  await db.exec(await readFile(new URL('./ks-live-receipt-rollback-guard.sql',import.meta.url),'utf8'));
  // Install the actual private intent/link/route definitions into this fixture.
  // No historical CRM seed, provider credentials or external transport.
  const intentSource=await readFile(new URL('../supabase/migrations/20261018102102_add_private_review_only_setup_claims.sql',import.meta.url),'utf8');
  await db.exec(intentSource.slice(intentSource.indexOf('create table public.ks_setup_purchase_intents'),intentSource.indexOf('create table public.ks_setup_review_budgets')));
  await db.exec(`grant select on public.ks_setup_purchase_intents to service_role;
    create table public.iptv_customers(id uuid primary key,external_id bigint,source text,payment_status text,trial boolean);
    grant select on public.iptv_customers to service_role;`);
  await db.exec(await routingSupportSql());
  await db.exec(await readFile(new URL(routingMigrationName,new URL('./fixtures/ks-paid-order-routing.mjs',import.meta.url)),'utf8'));
  await db.exec('set role service_role');
  await check('live pending receipt prepares a support alert without activating any service', async () => {
    const id = await record('LivePendingAlert', true); const alert = await prepare(id);
    assert.equal(alert.status, 'prepared'); assert.equal(alert.test_mode, false);
    assert.deepEqual(alert.send_payload.to, ['support@kristalstream.com']);
    assert.match(alert.send_payload.subject, /^PAID ORDER - Setup pending/);
    assert.match(alert.send_payload.text, /does not confirm streaming activation/);
    assert.equal((await db.query('select activated from public.ks_payment_receipts where checkout_session_id=$1', [id])).rows[0].activated, false);
  });
  await check('sandbox message explicitly denies a real Stripe charge and credit authorization', async () => {
    const alert = await prepare(await record('SandboxAlert'));
    assert.equal(alert.test_mode, true); assert.match(alert.send_payload.subject, /^TEST PAYMENT - Setup pending/);
    assert.match(alert.send_payload.text, /no real Stripe charge/); assert.match(alert.send_payload.text, /does not authorize spending/);
  });
  await check('wrong owners, bad email addresses and unknown payments cannot prepare', async () => {
    const id = await record('RejectedAlert');
    await assert.rejects(() => prepare(id, 'fictional@example.invalid', '00000000-0000-4000-8000-000000000002'));
    await assert.rejects(() => prepare(id, 'bad\r\nheader@example.invalid'));
    await assert.rejects(() => prepare('cs_test_Unknown'));
    assert.equal((await db.query('select count(*)::int as n from public.ks_pending_order_alerts where checkout_session_id=$1', [id])).rows[0].n, 0);
  });
  await check('a recorded receipt without its durable queue cannot prepare an email', async () => {
    await db.query(`insert into public.ks_payment_receipts(checkout_session_id,payment_intent_id,user_id,livemode,tier,connections,duration_days,amount_cents,currency)
      values ('cs_test_NoQueue','pi_NoQueue',$1,false,'bronze',1,30,2000,'usd')`, [owner]);
    await assert.rejects(() => prepare('cs_test_NoQueue'), /pending_alert_queue_required/);
  });
  await check('repeat preparation freezes the body, reply address and first-attempt timestamp', async () => {
    const id = await record('FrozenAlert'); const first = await prepare(id);
    const repeated = await prepare(id, 'changed@example.invalid');
    assert.deepEqual(repeated, first);
    assert.equal((await db.query('select count(*)::int as n from public.ks_pending_order_alerts where checkout_session_id=$1', [id])).rows[0].n, 1);
  });
  await check('legacy delivered email suppresses a new pending email namespace', async () => {
    const id = await record('LegacySent');
    await db.query("insert into public.ks_order_email_state(checkout_session_id,send_payload,sent_at,resend_email_id) values ($1,'{}',now(),'mail-old')", [id]);
    assert.equal((await prepare(id)).status, 'legacy_already_sent');
    assert.equal((await db.query('select count(*)::int as n from public.ks_pending_order_alerts where checkout_session_id=$1', [id])).rows[0].n, 0);
  });
  await check('an ambiguous legacy attempt stops for review rather than risking another send', async () => {
    const id = await record('LegacyUnknown');
    await db.query("insert into public.ks_order_email_state(checkout_session_id,send_payload) values ($1,'{}')", [id]);
    assert.equal((await prepare(id)).status, 'requires_review');
  });
  await check('review-blocked or legacy-activated orders do not prepare a pending email', async () => {
    const id = await record('ManualReviewAlert');
    await db.query("update public.ks_setup_order_queue set fulfillment_status='requires_review' where checkout_session_id=$1", [id]);
    assert.equal((await prepare(id)).status, 'requires_review');
    const active = await record('LegacyActiveAlert');
    await db.query('update public.ks_payment_receipts set activated=true where checkout_session_id=$1', [active]);
    assert.equal((await prepare(active)).status, 'requires_review');
  });
  await check('confirmed delivery survives an acknowledgement retry without changing its record', async () => {
    const id = await record('DeliveredAlert'); await prepare(id); await complete(id);
    const first = (await db.query('select to_jsonb(a) as alert from public.ks_pending_order_alerts a where checkout_session_id=$1', [id])).rows[0].alert;
    assert.equal((await complete(id)).status, 'sent');
    assert.deepEqual((await db.query('select to_jsonb(a) as alert from public.ks_pending_order_alerts a where checkout_session_id=$1', [id])).rows[0].alert, first);
    assert.equal((await prepare(id)).status, 'already_sent');
    await assert.rejects(() => complete(id, 'mail-other'), /pending_alert_delivery_conflict/);
  });
  await check('delivery completion requires a prepared alert and a valid provider ID', async () => {
    await assert.rejects(() => complete('cs_test_Unknown'), /prepared_pending_alert_required/);
    await assert.rejects(() => complete('cs_test_DeliveredAlert', 'bad\nidentifier'), /pending_alert_delivery_required/);
  });
  await check('service-role column grants prevent modifying the frozen email', async () => {
    await assert.rejects(() => db.exec("update public.ks_pending_order_alerts set send_payload='{}' where checkout_session_id='cs_test_FrozenAlert'"), /permission denied/);
    await assert.rejects(() => db.exec("delete from public.ks_pending_order_alerts where checkout_session_id='cs_test_FrozenAlert'"), /permission denied/);
  });
  await check('the actual handler and PostgreSQL recover a lost send acknowledgement with one simulated delivery', async () => {
    const id = await record('IntegratedAlert', true); let failSave = true; let requests = 0;
    const deliveries = new Map();
    const admin = {
      from: table => { assert.equal(table, 'ks_payment_receipts'); return {
        select() { return this; }, eq(column, value) { assert.equal(column, 'checkout_session_id'); this.id = value; return this; },
        async maybeSingle() { return { data: (await db.query('select user_id,livemode from public.ks_payment_receipts where checkout_session_id=$1', [this.id])).rows[0] || null, error: null }; },
      }; },
      auth: { admin: { getUserById: async user => ({ data: { user: { id: user, email: 'fictional@example.invalid' } }, error: null }) } },
      rpc: async (name, args) => {
        if (name === 'ks_prepare_pending_order_alert') return { data: await prepare(args.p_session_id, args.p_customer_email, args.p_user_id), error: null };
        assert.equal(name, 'ks_complete_pending_order_alert');
        if (failSave) { failSave = false; return { data: null, error: { code: 'offline' } }; }
        return { data: await complete(args.p_session_id, args.p_email_id), error: null };
      },
    };
    const request = () => new Request('https://example.invalid', { method: 'POST', headers: { Authorization: 'Bearer fictional-server' }, body: JSON.stringify({ sessionId: id }) });
    const options = { admin, serviceKey: 'fictional-server', resendKey: 'fictional-provider', fetchImpl: async (url, config) => {
      assert.equal(url, 'https://api.resend.com/emails'); requests++;
      const key = config.headers['Idempotency-Key'];
      if (deliveries.has(key)) assert.equal(deliveries.get(key), config.body); else deliveries.set(key, config.body);
      return Response.json({ id: 'mail-integrated' });
    } };
    assert.equal((await handlePendingOrderNotification(request(), options)).status, 503);
    assert.equal((await handlePendingOrderNotification(request(), options)).status, 200);
    assert.equal((await handlePendingOrderNotification(request(), options)).status, 200);
    assert.equal(deliveries.size, 1); assert.equal(requests, 2);
    assert.equal((await prepare(id)).status, 'already_sent');
  });
  await check('opt-in fulfillment, actual receipt SQL and routed pending alert recover one payment and delivery', async () => {
    const id='cs_live_FullPipeline',deliveries=new Map();let requests=0,loseAcknowledgement=true;
    const profileBefore=(await db.query('select to_jsonb(p) as p from public.profiles p where id=$1',[owner])).rows[0].p;
    const session={id,livemode:true,mode:'payment',status:'complete',payment_status:'paid',currency:'usd',amount_total:2000,amount_subtotal:2000,payment_intent:'pi_FullPipeline',metadata:{user_id:owner,plan:'bronze',connections:'1',interval:'monthly',price:'20',duration_days:'30'}};
    const admin={
      from(table){assert.equal(table,'ks_payment_receipts');return{select(){return this;},eq(column,value){assert.equal(column,'checkout_session_id');this.id=value;return this;},async maybeSingle(){return{data:(await db.query('select user_id,livemode from public.ks_payment_receipts where checkout_session_id=$1',[this.id])).rows[0]||null,error:null};}};},
      auth:{admin:{getUserById:async user=>({data:{user:{id:user,email:'fictional@example.invalid'}},error:null})}},
      async rpc(name,args){
        if(name==='ks_record_paid_checkout')return{data:(await db.query('select public.ks_record_paid_checkout($1,$2,$3,$4,$5,$6,$7,$8,$9) as receipt',[args.p_session_id,args.p_payment_intent_id,args.p_user_id,args.p_livemode,args.p_tier,args.p_connections,args.p_duration_days,args.p_amount_cents,args.p_currency])).rows[0].receipt,error:null};
        if(name==='ks_route_paid_order')return{data:(await db.query('select public.ks_route_paid_order($1) as routing',[args.p_session])).rows[0].routing,error:null};
        if(name==='ks_prepare_pending_order_alert')return{data:await prepare(args.p_session_id,args.p_customer_email,args.p_user_id),error:null};
        assert.equal(name,'ks_complete_pending_order_alert');
        if(loseAcknowledgement){loseAcknowledgement=false;return{data:null,error:{code:'fictional_acknowledgement_loss'}};}
        return{data:await complete(args.p_session_id,args.p_email_id),error:null};
      },
    };
    const options={admin,serviceKey:'fictional-server',resendKey:'fictional-provider',fetchImpl:async(url,config)=>{
      assert.equal(url,'https://api.resend.com/emails');requests++;const key=config.headers['Idempotency-Key'];
      if(deliveries.has(key))assert.equal(deliveries.get(key),config.body);else deliveries.set(key,config.body);
      return Response.json({id:'mail-full-pipeline'});
    }};
    admin.functions={invoke:async(name,{body})=>{assert.equal(name,'ks-order-notification');const response=await routeOrderNotification(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer fictional-server'},body:JSON.stringify(body)}),options);return{data:await response.json(),error:response.ok?null:{code:'notification_needs_retry'}};}};
    const context={environment:'production',live:true,receiptOnlyLive:true,admin,stripe:{checkout:{sessions:{retrieve:async sessionId=>{assert.equal(sessionId,id);return session;}}}}};
    await assert.rejects(()=>fulfill(id,context,owner),/payment is recorded.*do not pay again/);
    const replay=await fulfill(id,context,owner);assert.equal(replay.replayed,true);assert.equal(replay.queue_replayed,true);assert.equal(replay.activated,false);assert.equal(replay.provider_activated,false);
    await fulfill(id,context,owner);assert.equal(deliveries.size,1);assert.equal(requests,2);
    for(const table of['ks_payment_receipts','ks_setup_order_queue','ks_paid_order_routes','ks_pending_order_alerts'])assert.equal((await db.query(`select count(*)::int as n from public.${table} where checkout_session_id=$1`,[id])).rows[0].n,1);
    assert.equal(replay.routing.destination,'manual_review');assert.equal(replay.routing.replayed,true);
    assert.deepEqual((await db.query('select to_jsonb(p) as p from public.profiles p where id=$1',[owner])).rows[0].p,profileBefore);
    const row=(await db.query('select q.checkout_session_id,q.fulfillment_status,q.queued_at,to_jsonb(r) as receipt from public.ks_setup_order_queue q join public.ks_payment_receipts r using(checkout_session_id) where q.checkout_session_id=$1',[id])).rows[0];
    row.queued_at=new Date(row.queued_at).toISOString();row.receipt.recorded_at=new Date(row.receipt.recorded_at).toISOString();
    assert.equal(customerSetupSnapshot([row],owner,true)[0].providerActivated,false);
    await assert.rejects(()=>db.query("select public.ks_apply_paid_checkout($1,$2,$3,true,'bronze',1,30,2000,'usd')",[id,'pi_FullPipeline',owner]),/receipt_only_order_cannot_use_legacy_activation/);
    assert.deepEqual((await db.query('select to_jsonb(p) as p from public.profiles p where id=$1',[owner])).rows[0].p,profileBefore);
    assert.equal((await db.query('select activated from public.ks_payment_receipts where checkout_session_id=$1',[id])).rows[0].activated,false);
  });
  await db.exec('reset role');
  await check('database guards reject frozen-body changes, delivery resets and deletion', async () => {
    await assert.rejects(() => db.exec("update public.ks_pending_order_alerts set send_payload='{}' where checkout_session_id='cs_test_FrozenAlert'"), /pending_alert_payload_is_frozen/);
    await assert.rejects(() => db.exec("update public.ks_pending_order_alerts set sent_at=null,resend_email_id=null where checkout_session_id='cs_test_DeliveredAlert'"), /pending_alert_delivery_is_final/);
    await assert.rejects(() => db.exec("delete from public.ks_pending_order_alerts where checkout_session_id='cs_test_FrozenAlert'"), /pending_alert_cannot_be_deleted/);
  });
  await check('RLS and function privileges keep the complete path private', async () => {
    const flags = (await db.query(`select relrowsecurity as rls,
      has_table_privilege('authenticated','public.ks_pending_order_alerts','select') as browser_read,
      has_table_privilege('service_role','public.ks_pending_order_alerts','delete') as backend_delete,
      has_function_privilege('anon','public.ks_prepare_pending_order_alert(text,uuid,text)','execute') as anon_prepare,
      has_function_privilege('authenticated','public.ks_complete_pending_order_alert(text,text)','execute') as browser_complete
      from pg_class where oid='public.ks_pending_order_alerts'::regclass`)).rows[0];
    assert.deepEqual(flags, { rls: true, browser_read: false, backend_delete: false, anon_prepare: false, browser_complete: false });
    const functions = (await db.query("select prosecdef,proconfig from pg_proc where proname in ('ks_guard_pending_order_alert','ks_prepare_pending_order_alert','ks_complete_pending_order_alert')")).rows;
    assert.equal(functions.length, 3); assert.ok(functions.every(fn => !fn.prosecdef && fn.proconfig.includes('search_path=""')));
    await db.exec('set role authenticated');
    await assert.rejects(() => prepare('cs_test_FrozenAlert'), /permission denied/);
    await assert.rejects(() => db.exec('select * from public.ks_pending_order_alerts'), /permission denied/);
  });
  console.log(`${count} isolated pending-email PostgreSQL checks passed. No project connection or real email was used.`);
} catch (error) {
  console.error('Pending-email PostgreSQL test failed', { message: error.message, code: error.code, where: error.where }); process.exitCode = 1;
} finally { await db.close(); }
