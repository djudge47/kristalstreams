-- Schema applied in Supabase SQL Editor on 2026-10-13.
-- Reviewed source for a later CLI-generated migration.
begin;
create table if not exists public.ks_payment_receipts (
  checkout_session_id text primary key,
  payment_intent_id text not null unique,
  user_id uuid not null references auth.users(id),
  livemode boolean not null,
  tier text not null check (tier in ('bronze','silver','gold','platinum')),
  connections integer not null check (connections between 1 and 5),
  duration_days integer not null check (duration_days in (30,90,180,365)),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null check (currency = 'usd'),
  activated boolean not null default false,
  expires_at timestamptz,
  recorded_at timestamptz not null default now()
);
alter table public.ks_payment_receipts enable row level security;
revoke all on public.ks_payment_receipts from public, anon, authenticated;
grant select, insert, update on public.ks_payment_receipts to service_role;
CREATE OR REPLACE FUNCTION public.ks_apply_paid_checkout(p_session_id text, p_payment_intent_id text, p_user_id uuid, p_livemode boolean, p_tier text, p_connections integer, p_duration_days integer, p_amount_cents integer, p_currency text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  receipt public.ks_payment_receipts%rowtype;
  customer public.profiles%rowtype;
  expected_prices integer[];
  expected_days integer;
  new_expiry timestamptz;
begin
  if p_session_id is null or p_session_id not like 'cs_%'
     or p_payment_intent_id is null or p_payment_intent_id not like 'pi_%'
     or p_user_id is null or p_livemode is null
     or p_connections is null or p_connections not between 1 and 5
     or p_currency is distinct from 'usd' then
    raise exception 'Invalid payment details';
  end if;

  case p_tier
    when 'bronze' then
      expected_prices := array[2000,3500,5000,6500,8000];
      expected_days := 30;
    when 'silver' then
      expected_prices := array[4500,7500,11000,14000,17500];
      expected_days := 90;
    when 'gold' then
      expected_prices := array[6000,10500,15000,19500,24000];
      expected_days := 180;
    when 'platinum' then
      expected_prices := array[9500,16500,23500,30500,37500];
      expected_days := 365;
    else
      raise exception 'Unknown plan';
  end case;

  if p_amount_cents is distinct from expected_prices[p_connections]
     or p_duration_days is distinct from expected_days then
    raise exception 'Payment does not match the selected plan';
  end if;

  -- Serialize simultaneous confirmations for the same customer.
  select * into customer
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Customer profile not found';
  end if;

  insert into public.ks_payment_receipts (
    checkout_session_id, payment_intent_id, user_id, livemode,
    tier, connections, duration_days, amount_cents, currency
  ) values (
    p_session_id, p_payment_intent_id, p_user_id, p_livemode,
    p_tier, p_connections, p_duration_days, p_amount_cents, p_currency
  )
  on conflict do nothing;

  select * into receipt
  from public.ks_payment_receipts
  where checkout_session_id = p_session_id
  for update;

  if not found then
    raise exception 'Payment intent already recorded for another checkout';
  end if;

  if receipt.user_id is distinct from p_user_id
     or receipt.payment_intent_id is distinct from p_payment_intent_id
     or receipt.livemode is distinct from p_livemode
     or receipt.tier is distinct from p_tier
     or receipt.connections is distinct from p_connections
     or receipt.amount_cents is distinct from p_amount_cents then
    raise exception 'Recorded payment details do not match';
  end if;

  -- Sandbox payments are recorded but never activate customer profiles.
  if not p_livemode then
    return jsonb_build_object(
      'ok', true, 'test_mode', true, 'activated', false,
      'tier', receipt.tier, 'connections_allowed', receipt.connections
    );
  end if;

  if not receipt.activated then
    -- Preserve an activation performed by the previous confirmation code.
    if customer.stripe_checkout_session_id = p_session_id
       and customer.subscription_expires_at is not null then
      new_expiry := customer.subscription_expires_at;
    else
      if customer.active_connections > p_connections then
        raise exception 'Active devices exceed the purchased connection allowance';
      end if;

      new_expiry := greatest(
        now(),
        case when customer.subscription_status = 'active'
          then customer.subscription_expires_at
          else now()
        end
      ) + make_interval(days => p_duration_days);

      update public.profiles
      set subscription_tier = p_tier,
          subscription_status = 'active',
          connections_allowed = p_connections,
          subscription_expires_at = new_expiry,
          stripe_checkout_session_id = p_session_id,
          stripe_payment_intent_id = p_payment_intent_id,
          updated_at = now()
      where id = p_user_id;
    end if;

    update public.ks_payment_receipts
    set activated = true, expires_at = new_expiry
    where checkout_session_id = p_session_id
    returning * into receipt;
  end if;

  return jsonb_build_object(
    'ok', true, 'test_mode', false, 'activated', true,
    'tier', receipt.tier, 'connections_allowed', receipt.connections,
    'expires_at', receipt.expires_at
  );
end;
$function$

revoke all on function public.ks_apply_paid_checkout(text,text,uuid,boolean,text,integer,integer,integer,text) from public, anon, authenticated;
grant execute on function public.ks_apply_paid_checkout(text,text,uuid,boolean,text,integer,integer,integer,text) to service_role;
commit;

