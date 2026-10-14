begin;

create table if not exists public.ks_trial_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  livemode boolean not null,
  customer_email text not null,
  full_name text,
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  activated boolean not null default false,
  unique (user_id, livemode),
  check (not activated or livemode)
);
alter table public.ks_trial_requests enable row level security;
revoke all on public.ks_trial_requests from public, anon, authenticated;
grant select,insert,update on public.ks_trial_requests to service_role;

create table if not exists public.ks_trial_email_state (
  trial_id uuid not null references public.ks_trial_requests(id) on delete cascade,
  kind text not null check (kind in ('support','customer')),
  first_attempt_at timestamptz not null default now(),
  send_payload jsonb not null,
  sent_at timestamptz,
  resend_email_id text,
  primary key (trial_id,kind)
);
alter table public.ks_trial_email_state enable row level security;
revoke all on public.ks_trial_email_state from public, anon, authenticated;
grant select,insert,update on public.ks_trial_email_state to service_role;

create or replace function public.ks_request_trial(
  p_user_id uuid, p_customer_email text, p_full_name text, p_livemode boolean
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  p public.profiles%rowtype;
  t public.ks_trial_requests%rowtype;
begin
  if p_livemode is null or p_customer_email is null or length(p_customer_email) > 254
     or p_customer_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or length(coalesce(p_full_name,'')) > 120 then
    raise exception 'invalid_trial_request';
  end if;
  select * into p from public.profiles where id=p_user_id for update;
  if not found then raise exception 'profile_missing'; end if;
  if p.stripe_checkout_session_id is not null or p.stripe_payment_intent_id is not null
     or p.active_connections > 0
     or (p.subscription_status='active' and p.subscription_tier <> 'demo')
     or exists(select 1 from public.ks_payment_receipts where user_id=p_user_id and livemode and activated) then
    raise exception 'paid_account';
  end if;
  select * into t from public.ks_trial_requests where user_id=p_user_id and livemode=p_livemode;
  if found then
    return jsonb_build_object('id',t.id,'expires_at',t.expires_at,'already_requested',true);
  end if;
  if p.subscription_tier='demo' then raise exception 'trial_already_used'; end if;
  insert into public.ks_trial_requests (user_id,livemode,customer_email,full_name,expires_at,activated)
    values (p_user_id,p_livemode,lower(trim(p_customer_email)),coalesce(nullif(trim(p_full_name),''),p.full_name),
      now()+interval '36 hours',p_livemode) returning * into t;
  if p_livemode then
    update public.profiles set subscription_tier='demo',subscription_status='active',
      connections_allowed=1, subscription_expires_at=t.expires_at,
      full_name=coalesce(t.full_name,full_name), updated_at=now()
      where id=p_user_id;
  end if;
  return jsonb_build_object('id',t.id,'expires_at',t.expires_at,'already_requested',false);
end;
$$;
revoke all on function public.ks_request_trial(uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.ks_request_trial(uuid,text,text,boolean) to service_role;

create or replace function public.ks_prepare_trial_email(p_trial_id uuid,p_kind text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  t public.ks_trial_requests%rowtype;
  n public.ks_trial_email_state%rowtype;
  payload jsonb;
  title text;
  body text;
  recipient text;
begin
  if p_kind not in ('support','customer') or p_kind is null then raise exception 'invalid_email_kind'; end if;
  select * into t from public.ks_trial_requests where id=p_trial_id for update;
  if not found then raise exception 'trial_not_found'; end if;
  if t.livemode and not t.activated then raise exception 'trial_not_activated'; end if;
  select * into n from public.ks_trial_email_state where trial_id=p_trial_id and kind=p_kind;
  if not found then
    if p_kind='support' then
      recipient := 'support@kristalstream.com';
      title := case when t.livemode then 'New 36-hour trial request - Kristal Streams'
        else 'TEST TRIAL REQUEST - Kristal Streams - No customer setup needed' end;
      body := case when t.livemode then 'A customer has requested a 36-hour trial. Streaming credentials and device setup still require manual handling.'
        else 'This is a Preview test. No live subscription was activated. Do not create a Roomba customer line for this test.' end
        || E'\n\nName: ' || coalesce(t.full_name,'Not provided') || E'\nEmail: ' || t.customer_email
        || E'\nTrial: 36 hours, 1 connection\nRequested at: ' || t.requested_at::text
        || E'\nRequest ID: ' || t.id::text
        || E'\n\nNo customer password is included. Contact the customer for compatible device and setup details.';
    else
      recipient := t.customer_email;
      title := case when t.livemode then 'Your trial request was received - Kristal Streams'
        else 'TEST - Your Kristal Streams trial request' end;
      body := 'Hello ' || coalesce(t.full_name,'there') || E',\n\n'
        || case when t.livemode then 'We received your request for a 36-hour Kristal Streams trial with 1 connection. Your streaming login and device setup instructions will arrive separately from our team.'
        else 'We received your Preview trial test. This is a test acknowledgment; no live subscription or streaming line was created.' end
        || case when t.livemode then E'\n\nYou can return to your website dashboard at https://www.kristalstream.com/dashboard.' else '' end
        || E'\nQuestions? Reply to this email or contact support@kristalstream.com.'
        || E'\nWe will never ask you to send your account password by email.'
        || E'\n\nThank you,\nKristal Streams';
    end if;
    payload := jsonb_build_object('from','Kristal Streams <noreply@kristalstream.com>',
      'to',jsonb_build_array(recipient),'reply_to',case when p_kind='support' then t.customer_email else 'support@kristalstream.com' end,
      'subject',title,'text',body);
    insert into public.ks_trial_email_state(trial_id,kind,send_payload)
      values(p_trial_id,p_kind,payload) returning * into n;
  end if;
  return jsonb_build_object('send_payload',n.send_payload,'sent_at',n.sent_at,
    'first_attempt_at',n.first_attempt_at,'idempotency_key','ks-trial-email/v1/'||t.id::text||'/'||p_kind);
end;
$$;
revoke all on function public.ks_prepare_trial_email(uuid,text) from public,anon,authenticated;
grant execute on function public.ks_prepare_trial_email(uuid,text) to service_role;

commit;
