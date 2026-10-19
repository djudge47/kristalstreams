import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createCipheriv, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('.', import.meta.url);
export const adminId = '00000000-0000-4000-8000-000000000090';
export const literal = value => `'${String(value).replaceAll("'", "''")}'`;
export const json = async (session, expression) => JSON.parse(await session.request(`select to_jsonb(${expression});`));
export const denied = (statement, message) => `do $expected$ begin begin ${statement};
  raise exception using errcode='ZX001',message='expected rejection was not observed';
  exception when sqlstate 'P0001' then if sqlerrm<>${literal(message)} then raise; end if;
  end; end $expected$;`;

export async function bootstrap(db, { pglitePreflight = false } = {}) {
  const manifest = JSON.parse(await readFile(new URL('source-manifest.json', root), 'utf8'));
  assert.equal(manifest.sourceCommit, 'f434a3a2220a0ac09dd83aa367dfb9b78aaaebe3');
  const sources = {};
  for (const [name, expected] of Object.entries(manifest.files)) {
    assert.match(name, /^ks-[a-z-]+-schema\.sql$/);
    const source = await readFile(new URL(`../../${name}`, root), 'utf8');
    assert.equal(createHash('sha256').update(source).digest('hex'), expected, `source changed: ${name}`);
    sources[name] = source;
  }
  const digest = pglitePreflight
    ? "create function extensions.digest(text,text) returns bytea language sql immutable as $$select pg_catalog.sha256(pg_catalog.convert_to($1,'UTF8'))$$;"
    : 'create extension pgcrypto with schema extensions;';
  await db.request(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create schema extensions; ${digest}
    grant usage on schema public, extensions to service_role, anon, authenticated;
    create table public.profiles(id uuid primary key references auth.users(id), email text, full_name text,
      subscription_status text default 'inactive', active_connections integer default 0,
      subscription_expires_at timestamptz, updated_at timestamptz default now());
    create table public.ks_roomba_trial_attempts(admin_id uuid);
    create table public.iptv_customers(id uuid primary key default gen_random_uuid(),external_id bigint unique,
      username text unique,customer_name text,package_name text,trial boolean,connections_allowed integer,
      expiration_at timestamptz,renewal_at timestamptz,monthly_price numeric,payment_status text,account_status text,
      source text,iptv_password text,email text,phone text,last_payment_at timestamptz);
    create table public.iptv_customer_activity(id uuid primary key default gen_random_uuid(),
      customer_id uuid references public.iptv_customers,activity_type text,title text,details text);
    alter table public.profiles enable row level security;
    alter table public.ks_roomba_trial_attempts enable row level security;
    alter table public.iptv_customers enable row level security;
    alter table public.iptv_customer_activity enable row level security;
    grant select,update on public.profiles to service_role;
    grant select on public.ks_roomba_trial_attempts to service_role;
    grant select,insert on public.iptv_customers,public.iptv_customer_activity to service_role;
    insert into auth.users values('${adminId}');
    insert into public.profiles(id,email) values('${adminId}','fixture-admin@example.invalid');`);
  // Install only the receipt table/grants from the historical payment source.
  // Its legacy entitlement-activating function is deliberately not installed.
  const payment = sources['ks-payment-schema.sql'];
  const start = payment.indexOf('create table');
  const end = payment.indexOf('CREATE OR REPLACE FUNCTION');
  assert.ok(start > 0 && end > start);
  await db.request(payment.slice(start, end));
  for (const name of ['ks-preview-paid-orders-schema.sql','ks-paid-foundation-schema.sql',
    'ks-guarded-paid-execution-schema.sql','ks-receipt-only-schema.sql','ks-setup-review-claim-schema.sql',
    'ks-reviewed-preview-completion-schema.sql','ks-reseller-reservation-exclusion-schema.sql']) {
    await db.request(sources[name]);
  }
  return manifest;
}

let sequence = 0;
export async function fixture(admin, { reseller, owner = randomUUID(), fingerprint, envelopeFactory } = {}) {
  const id = ++sequence;
  const value = {
    owner, reseller: reseller ?? String(82000 + id), policy: randomUUID(), attempt: randomUUID(),
    session: `cs_test_Workflow${id}`, payment: `pi_Workflow${id}`, username: `ks_fixture_workflow_${id}`,
    line: String(92000000 + id), hash: 'a'.repeat(64), fingerprint: fingerprint ?? 'b'.repeat(64), candidate: 'c'.repeat(64),
  };
  const key = randomBytes(32), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify({username:value.username,
    password:'fictional-local-only',serverUrl:'https://example.invalid'})), cipher.final()]);
  value.envelope = {version:1,keyId:'disposable_fixture',iv:iv.toString('base64'),
    tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')};
  if (envelopeFactory) value.envelope = envelopeFactory(value);
  value.usernameHash = createHash('sha256').update(value.username).digest('hex');
  await admin.request(`insert into auth.users values(${literal(owner)}) on conflict do nothing;
    insert into public.profiles(id,email) values(${literal(owner)},${literal(`fixture-${owner}@example.invalid`)}) on conflict do nothing;
    insert into public.ks_setup_review_policies(policy_id,environment,reseller_id,mode,policy_hash,starts_at,
      expires_at,per_order_units,daily_limit_units,min_reserve_units)
    values(${literal(value.policy)},'preview',${literal(value.reseller)},'review-only',${literal(value.hash)},
      clock_timestamp()-interval '2 minutes',clock_timestamp()+interval '1 hour',2000000,10000000,5000000);
    insert into public.ks_setup_review_packages values(${literal(value.policy)},'bronze',1,'1000',${literal(value.fingerprint)},1500000);`);
  await admin.request(`set role service_role; select ${record(value)};
    insert into public.ks_setup_purchase_intents
      select ${literal(value.session)},${literal(owner)},'new_service',true,'authenticated_checkout',recorded_at-interval '1 millisecond'
      from public.ks_payment_receipts where checkout_session_id=${literal(value.session)};
    select public.ks_queue_preview_paid_order(${literal(value.session)},${literal(owner)}); reset role;`);
  const clock = await json(admin, "jsonb_build_object('at',clock_timestamp(),'day',(clock_timestamp() at time zone 'UTC')::date)");
  value.day = clock.day; value.evidence = clock.at;
  return value;
}
export const record = f => `public.ks_record_paid_checkout(${literal(f.session)},${literal(f.payment)},${literal(f.owner)},false,'bronze',1,30,2000,'usd')`;
export const reserveReview = f => `public.ks_reserve_setup_review(${literal(f.session)},${literal(f.owner)},
  ${literal(f.policy)},${literal(f.hash)},'preview',${literal(f.reseller)},'1000',${literal(f.fingerprint)},
  1500000::bigint,100500000::bigint,${literal(f.day)}::date,${literal(f.evidence)}::timestamptz,${literal(f.candidate)})`;
export const reserveAttempt = f => `public.ks_reserve_preview_provisioning(${literal(f.attempt)},${literal(f.session)},
  ${literal(f.owner)},${literal(f.bindingHash ?? 'e'.repeat(64))},${literal(f.reseller)},'1000',1,1,1.5,array[13,14],
  ${literal(JSON.stringify(f.envelope))}::jsonb,${literal(f.usernameHash)},true)`;
export const begin = f => `public.ks_begin_approved_preview_provisioning(${literal(f.attempt)},${literal(f.token)},
  ${literal(adminId)},${literal('d'.repeat(64))},clock_timestamp()+interval '1 minute',1500000,100500000)`;
export const providerResult = f => `public.ks_record_preview_provider_result(${literal(f.attempt)},${literal(f.token)},
  ${literal(f.line)},${literal(f.reseller)},'1000',${literal(f.usernameHash)},1,array[13,14],clock_timestamp()+interval '31 days')`;
export const complete = f => `public.ks_commit_preview_paid_setup(${literal(f.attempt)},${literal(f.token)},${literal(f.username)})`;

export async function prepareAttempt(admin, f, state = 'reserved') {
  const result = await admin.request(`set role service_role; select ${reserveAttempt(f)}; reset role;`);
  f.token = JSON.parse(result).claimToken;
  if (state !== 'reserved') {
    await admin.request(`set role service_role; select ${begin(f)}; reset role;`);
    if (state === 'provider_verified') await admin.request(`set role service_role; select ${providerResult(f)}; reset role;`);
  }
  return f;
}

export const summary = (admin, f) => json(admin, `jsonb_build_object(
 'claims',(select count(*) from public.ks_setup_review_claims where user_id=${literal(f.owner)}),
 'reviewSlots',(select count(*) from public.ks_setup_review_reseller_slots where reseller_id=${literal(f.reseller)}),
 'dispatchSlots',(select count(*) from public.ks_preview_reseller_dispatches where reseller_id=${literal(f.reseller)}),
 'reserved',(select coalesce(sum(reserved_units),0)::text from public.ks_setup_review_budgets where reseller_id=${literal(f.reseller)}),
 'spent',(select coalesce(sum(spent_units),0)::text from public.ks_setup_review_budgets where reseller_id=${literal(f.reseller)}),
 'attemptState',(select state from public.ks_preview_provisioning_attempts where attempt_id=${literal(f.attempt)}),
 'crm',(select count(*) from public.iptv_customers where username=${literal(f.username)}),
 'fulfillments',(select count(*) from public.ks_preview_paid_fulfillments where checkout_session_id=${literal(f.session)}),
 'logins',(select count(*) from public.ks_preview_streaming_logins where checkout_session_id=${literal(f.session)}),
 'receiptActivated',(select activated from public.ks_payment_receipts where checkout_session_id=${literal(f.session)}),
 'previewQueue',(select fulfillment_status from public.ks_preview_paid_orders where checkout_session_id=${literal(f.session)}))`);
