-- Prepared replacement recording path; NOT installed or routed by this commit.
-- Keep ks_apply_paid_checkout and all existing service accounts untouched.
-- Install with a reviewed migration when queue, notifications, customer status
-- and production activation completion are ready for the coordinated rollout.
begin;
create or replace function public.ks_record_paid_checkout(
  p_session_id text, p_payment_intent_id text, p_user_id uuid,
  p_livemode boolean, p_tier text, p_connections integer,
  p_duration_days integer, p_amount_cents integer, p_currency text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  receipt public.ks_payment_receipts%rowtype;
  prices integer[];
  days integer;
  inserted_count integer;
begin
  if p_session_id is null or length(p_session_id) > 200
     or p_session_id !~ '^cs_(test_|live_)?[A-Za-z0-9]+$'
     or p_payment_intent_id is null or length(p_payment_intent_id) > 200
     or p_payment_intent_id !~ '^pi_[A-Za-z0-9]+$'
     or p_user_id is null or p_livemode is null
     or (not p_livemode and p_session_id !~ '^cs_test_[A-Za-z0-9]+$')
     or (p_livemode and p_session_id ~ '^cs_test_')
     or p_connections is null or p_connections not between 1 and 5
     or p_currency is distinct from 'usd' then
    raise exception 'invalid_payment_details';
  end if;
  case p_tier
    when 'bronze' then prices := array[2000,3500,5000,6500,8000]; days := 30;
    when 'silver' then prices := array[4500,7500,11000,14000,17500]; days := 90;
    when 'gold' then prices := array[6000,10500,15000,19500,24000]; days := 180;
    when 'platinum' then prices := array[9500,16500,23500,30500,37500]; days := 365;
    else raise exception 'invalid_payment_plan';
  end case;
  if p_amount_cents is distinct from prices[p_connections]
     or p_duration_days is distinct from days then
    raise exception 'payment_catalog_mismatch';
  end if;

  -- Match the legacy recorder's profile-before-receipt lock order. Never update
  -- the profile, its timestamp, connection allowance or service end date here.
  perform 1 from public.profiles where id = p_user_id for update;
  if not found then raise exception 'customer_profile_required'; end if;

  insert into public.ks_payment_receipts (
    checkout_session_id, payment_intent_id, user_id, livemode, tier,
    connections, duration_days, amount_cents, currency
  ) values (
    p_session_id, p_payment_intent_id, p_user_id, p_livemode, p_tier,
    p_connections, p_duration_days, p_amount_cents, p_currency
  ) on conflict do nothing;
  get diagnostics inserted_count = row_count;

  select * into receipt from public.ks_payment_receipts
    where checkout_session_id = p_session_id for update;
  if not found then raise exception 'payment_intent_already_recorded'; end if;
  if receipt.payment_intent_id is distinct from p_payment_intent_id
     or receipt.user_id is distinct from p_user_id
     or receipt.livemode is distinct from p_livemode
     or receipt.tier is distinct from p_tier
     or receipt.connections is distinct from p_connections
     or receipt.duration_days is distinct from p_duration_days
     or receipt.amount_cents is distinct from p_amount_cents
     or receipt.currency is distinct from p_currency then
    raise exception 'recorded_payment_mismatch';
  end if;

  -- Old activated receipts are preserved and require a separate reconciliation.
  -- A recorded website activation is never proof that an XUI line is ready.
  return jsonb_build_object(
    'ok', true, 'payment_recorded', true, 'test_mode', not receipt.livemode,
    'receipt_reference', receipt.checkout_session_id, 'account_id', receipt.user_id,
    'tier', receipt.tier, 'connections_allowed', receipt.connections,
    'activated', false, 'provider_activated', false,
    'legacy_website_activated', receipt.activated,
    'order_status', case when receipt.activated or receipt.expires_at is not null
      then 'requires_review' else 'awaiting_activation' end,
    'recorded_at', receipt.recorded_at, 'replayed', inserted_count = 0
  );
end;
$function$;
revoke all on function public.ks_record_paid_checkout(text,text,uuid,boolean,text,integer,integer,integer,text)
  from public, anon, authenticated;
grant execute on function public.ks_record_paid_checkout(text,text,uuid,boolean,text,integer,integer,integer,text)
  to service_role;
commit;
