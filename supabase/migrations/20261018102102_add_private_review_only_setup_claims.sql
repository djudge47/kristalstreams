-- STAGED ONLY: review reservations, never provider dispatch or real-credit
-- authorization. Requires the proposed receipt/queue schema and existing local
-- new-customer/Preview guard tables. No policy or purchase intent is seeded.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
create table public.ks_setup_review_policies (
  policy_id uuid primary key,
  environment text not null check(environment in ('preview','production')),
  reseller_id text not null check(reseller_id ~ '^[1-9][0-9]{0,14}$'),
  mode text not null check(mode='review-only'),
  policy_hash text not null check(policy_hash ~ '^[a-f0-9]{64}$'),
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  per_order_units bigint not null check(per_order_units between 1 and 1000000000000),
  daily_limit_units bigint not null check(daily_limit_units between per_order_units and 1000000000000),
  min_reserve_units bigint not null check(min_reserve_units between 0 and 1000000000000),
  revoked_at timestamptz,
  check(expires_at>starts_at and expires_at<=starts_at+interval '24 hours')
);
create table public.ks_setup_review_packages (
  policy_id uuid not null references public.ks_setup_review_policies(policy_id) on delete restrict,
  tier text not null check(tier in ('bronze','silver','gold','platinum')),
  connections integer not null check(connections between 1 and 5),
  package_id text not null check(package_id ~ '^[1-9][0-9]{0,14}$'),
  package_fingerprint text not null check(package_fingerprint ~ '^[a-f0-9]{64}$'),
  max_cost_units bigint not null check(max_cost_units between 1 and 1000000000000),
  primary key(policy_id,tier,connections), unique(policy_id,package_id)
);
create table public.ks_setup_purchase_intents (
  checkout_session_id text primary key check(checkout_session_id ~ '^cs_(test_|live_)?[A-Za-z0-9]+$'),
  user_id uuid not null references auth.users(id) on delete restrict,
  kind text not null check(kind in ('new_service','renewal','requires_review')),
  new_service_attested boolean not null,
  source text not null check(source='authenticated_checkout'),
  captured_at timestamptz not null default now(),
  check((kind='new_service')=new_service_attested)
);
create table public.ks_setup_review_budgets (
  reseller_id text not null,
  utc_day date not null,
  daily_limit_units bigint not null check(daily_limit_units between 1 and 1000000000000),
  spent_units bigint not null default 0 check(spent_units between 0 and 1000000000000),
  reserved_units bigint not null default 0 check(reserved_units between 0 and 1000000000000),
  primary key(reseller_id,utc_day),
  check(spent_units+reserved_units<=daily_limit_units)
);
create table public.ks_setup_review_claims (
  claim_id uuid primary key default gen_random_uuid(),
  checkout_session_id text not null unique references public.ks_setup_order_queue(checkout_session_id) on delete restrict,
  payment_intent_id text not null unique,
  user_id uuid not null unique references auth.users(id) on delete restrict,
  policy_id uuid not null references public.ks_setup_review_policies(policy_id) on delete restrict,
  policy_hash text not null check(policy_hash ~ '^[a-f0-9]{64}$'),
  environment text not null check(environment in ('preview','production')),
  reseller_id text not null,
  utc_day date not null,
  package_id text not null,
  package_fingerprint text not null check(package_fingerprint ~ '^[a-f0-9]{64}$'),
  cost_units bigint not null check(cost_units between 1 and 1000000000000),
  balance_units bigint not null check(balance_units between 0 and 1000000000000),
  evidence_at timestamptz not null,
  candidate_hash text not null check(candidate_hash ~ '^[a-f0-9]{64}$'),
  state text not null default 'reserved_for_review' check(state='reserved_for_review'),
  reserved_at timestamptz not null default now()
);
-- Global to the physical reseller, including across UTC days/environments.
-- Deferred FK lets the claim's BEFORE INSERT guard reserve the slot atomically.
create table public.ks_setup_review_reseller_slots (
  reseller_id text primary key,
  claim_id uuid not null unique references public.ks_setup_review_claims(claim_id) deferrable initially deferred,
  reserved_at timestamptz not null default now()
);

alter table public.ks_setup_review_policies enable row level security;
alter table public.ks_setup_review_packages enable row level security;
alter table public.ks_setup_purchase_intents enable row level security;
alter table public.ks_setup_review_budgets enable row level security;
alter table public.ks_setup_review_claims enable row level security;
alter table public.ks_setup_review_reseller_slots enable row level security;
revoke all on public.ks_setup_review_policies,public.ks_setup_review_packages,public.ks_setup_purchase_intents,
  public.ks_setup_review_budgets,public.ks_setup_review_claims,public.ks_setup_review_reseller_slots
  from public,anon,authenticated,service_role;
grant select on public.ks_setup_review_policies,public.ks_setup_review_packages to service_role;
-- Row locking requires an UPDATE grant. Only irreversible revocation is allowed.
grant update(revoked_at) on public.ks_setup_review_policies to service_role;
grant select,insert on public.ks_setup_purchase_intents,public.ks_setup_review_budgets,
  public.ks_setup_review_claims,public.ks_setup_review_reseller_slots to service_role;
grant update(reserved_units) on public.ks_setup_review_budgets to service_role;

create function public.ks_guard_setup_review_history()
returns trigger language plpgsql security invoker set search_path='' as $history$
begin
  if tg_op='DELETE' then raise exception 'setup_review_history_cannot_be_deleted'; end if;
  if tg_table_name='ks_setup_review_policies' then
    if (to_jsonb(new)-'revoked_at') is distinct from (to_jsonb(old)-'revoked_at')
      or old.revoked_at is not null or new.revoked_at is null then
      raise exception 'setup_review_policy_is_immutable';
    end if;
  elsif tg_table_name='ks_setup_review_budgets' then
    if (to_jsonb(new)-'reserved_units') is distinct from (to_jsonb(old)-'reserved_units')
      or new.reserved_units<old.reserved_units then raise exception 'setup_review_budget_cannot_be_reset'; end if;
  else raise exception 'setup_review_binding_is_immutable';
  end if;
  return new;
end;
$history$;
revoke all on function public.ks_guard_setup_review_history() from public,anon,authenticated;
grant execute on function public.ks_guard_setup_review_history() to service_role;
create trigger ks_setup_review_policy_guard before update or delete on public.ks_setup_review_policies
  for each row execute function public.ks_guard_setup_review_history();
create trigger ks_setup_review_package_guard before update or delete on public.ks_setup_review_packages
  for each row execute function public.ks_guard_setup_review_history();
create trigger ks_setup_purchase_intent_guard before update or delete on public.ks_setup_purchase_intents
  for each row execute function public.ks_guard_setup_review_history();
create trigger ks_setup_review_budget_guard before update or delete on public.ks_setup_review_budgets
  for each row execute function public.ks_guard_setup_review_history();
create trigger ks_setup_review_slot_guard before update or delete on public.ks_setup_review_reseller_slots
  for each row execute function public.ks_guard_setup_review_history();

create function public.ks_guard_setup_review_claim()
returns trigger language plpgsql security invoker set search_path='' as $claim$
declare
  profile public.profiles%rowtype;
  receipt public.ks_payment_receipts%rowtype;
  queued public.ks_setup_order_queue%rowtype;
  policy public.ks_setup_review_policies%rowtype;
  package public.ks_setup_review_packages%rowtype;
  intent public.ks_setup_purchase_intents%rowtype;
  budget public.ks_setup_review_budgets%rowtype;
  slots integer;
begin
  if tg_op<>'INSERT' then raise exception 'setup_review_claim_is_immutable'; end if;
  -- The same lock order as recording, then reseller slot and daily budget.
  select * into profile from public.profiles where id=new.user_id for update;
  if not found or profile.subscription_status is distinct from 'inactive'
    or profile.active_connections is distinct from 0 or profile.subscription_expires_at is not null then
    raise exception 'new_customer_review_required';
  end if;
  if public.ks_assert_preview_new_customer(new.user_id) is distinct from true then
    raise exception 'new_customer_review_required';
  end if;
  if exists(select 1 from public.ks_setup_review_claims where user_id=new.user_id) then
    raise exception 'customer_review_claim_exists';
  end if;
  select * into receipt from public.ks_payment_receipts where checkout_session_id=new.checkout_session_id for update;
  select * into queued from public.ks_setup_order_queue where checkout_session_id=new.checkout_session_id for update;
  if receipt.checkout_session_id is null or queued.checkout_session_id is null
    or receipt.user_id is distinct from new.user_id or receipt.payment_intent_id is distinct from new.payment_intent_id
    or receipt.activated is distinct from false or receipt.expires_at is not null
    or queued.fulfillment_status is distinct from 'awaiting_activation'
    or (queued.payment_intent_id,queued.user_id,queued.livemode,queued.tier,queued.connections,
        queued.duration_days,queued.amount_cents,queued.currency)
       is distinct from
       (receipt.payment_intent_id,receipt.user_id,receipt.livemode,receipt.tier,receipt.connections,
        receipt.duration_days,receipt.amount_cents,receipt.currency) then
    raise exception 'verified_pending_review_order_required';
  end if;
  select * into policy from public.ks_setup_review_policies where policy_id=new.policy_id for share;
  if not found or policy.mode<>'review-only' or policy.revoked_at is not null
    or policy.policy_hash is distinct from new.policy_hash or policy.environment is distinct from new.environment
    or policy.reseller_id is distinct from new.reseller_id
    or receipt.livemode is distinct from (policy.environment='production')
    or receipt.recorded_at<policy.starts_at or policy.starts_at>clock_timestamp() or policy.expires_at<=clock_timestamp() then
    raise exception 'current_review_policy_required';
  end if;
  select * into package from public.ks_setup_review_packages
    where policy_id=policy.policy_id and tier=receipt.tier and connections=receipt.connections;
  if not found or package.package_id is distinct from new.package_id
    or package.package_fingerprint is distinct from new.package_fingerprint
    or new.cost_units>package.max_cost_units or new.cost_units>policy.per_order_units then
    raise exception 'review_package_cost_mismatch';
  end if;
  select * into intent from public.ks_setup_purchase_intents where checkout_session_id=new.checkout_session_id;
  if not found or intent.user_id is distinct from new.user_id or intent.kind<>'new_service'
    or intent.new_service_attested is distinct from true or intent.source<>'authenticated_checkout'
    or intent.captured_at<policy.starts_at or intent.captured_at>receipt.recorded_at then
    raise exception 'authenticated_new_service_intent_required';
  end if;
  if new.utc_day is distinct from (clock_timestamp() at time zone 'UTC')::date
    or new.evidence_at>clock_timestamp() or new.evidence_at<clock_timestamp()-interval '30 seconds'
    or new.state<>'reserved_for_review' then raise exception 'fresh_review_evidence_required'; end if;
  if exists(select 1 from public.ks_preview_reseller_dispatches where reseller_id=new.reseller_id)
    or exists(select 1 from public.ks_preview_provisioning_attempts where reseller_id=new.reseller_id
      and state in ('reserved','dispatching','provider_verified','reconciliation_required')) then
    raise exception 'existing_reseller_work_requires_review';
  end if;
  insert into public.ks_setup_review_reseller_slots(reseller_id,claim_id)
    values(new.reseller_id,new.claim_id) on conflict do nothing;
  get diagnostics slots=row_count;
  if slots<>1 then raise exception 'reseller_review_claim_exists'; end if;
  insert into public.ks_setup_review_budgets(reseller_id,utc_day,daily_limit_units)
    values(new.reseller_id,new.utc_day,policy.daily_limit_units) on conflict do nothing;
  select * into strict budget from public.ks_setup_review_budgets
    where reseller_id=new.reseller_id and utc_day=new.utc_day for update;
  if budget.spent_units+budget.reserved_units+new.cost_units>least(budget.daily_limit_units,policy.daily_limit_units) then
    raise exception 'daily_review_credit_limit_reached';
  end if;
  if new.balance_units<budget.reserved_units+new.cost_units+policy.min_reserve_units then
    raise exception 'review_credit_reserve_required';
  end if;
  -- Check freshness after any wait for a lock, not only at transaction start.
  if policy.expires_at<=clock_timestamp() or new.evidence_at<clock_timestamp()-interval '30 seconds'
    or new.utc_day is distinct from (clock_timestamp() at time zone 'UTC')::date then
    raise exception 'review_expired_while_waiting';
  end if;
  update public.ks_setup_review_budgets set reserved_units=reserved_units+new.cost_units
    where reseller_id=new.reseller_id and utc_day=new.utc_day;
  return new;
end;
$claim$;
revoke all on function public.ks_guard_setup_review_claim() from public,anon,authenticated;
grant execute on function public.ks_guard_setup_review_claim() to service_role;
create trigger ks_setup_review_claim_guard before insert or update or delete on public.ks_setup_review_claims
  for each row execute function public.ks_guard_setup_review_claim();

create function public.ks_reserve_setup_review(
  p_session_id text,p_user_id uuid,p_policy_id uuid,p_policy_hash text,p_environment text,p_reseller_id text,
  p_package_id text,p_package_fingerprint text,p_cost_units bigint,p_balance_units bigint,
  p_utc_day date,p_evidence_at timestamptz,p_candidate_hash text
) returns jsonb language plpgsql security invoker set search_path='' as $reserve$
declare
  claim public.ks_setup_review_claims%rowtype;
  receipt public.ks_payment_receipts%rowtype;
  replayed boolean;
begin
  if p_session_id is null or p_user_id is null or p_policy_id is null or p_evidence_at is null
    or p_cost_units is null or p_cost_units<=0 or p_balance_units is null then raise exception 'review_claim_details_required'; end if;
  perform 1 from public.profiles where id=p_user_id for update;
  if not found then raise exception 'review_customer_required'; end if;
  select * into claim from public.ks_setup_review_claims where checkout_session_id=p_session_id;
  replayed:=found;
  if replayed then
    if (claim.user_id,claim.policy_id,claim.policy_hash,claim.environment,claim.reseller_id,claim.package_id,
        claim.package_fingerprint,claim.cost_units,claim.balance_units,claim.utc_day,claim.evidence_at,claim.candidate_hash)
       is distinct from
       (p_user_id,p_policy_id,p_policy_hash,p_environment,p_reseller_id,p_package_id,
        p_package_fingerprint,p_cost_units,p_balance_units,p_utc_day,p_evidence_at,p_candidate_hash) then
      raise exception 'review_claim_binding_changed';
    end if;
  else
    select * into receipt from public.ks_payment_receipts where checkout_session_id=p_session_id;
    if not found then raise exception 'review_receipt_required'; end if;
    insert into public.ks_setup_review_claims(checkout_session_id,payment_intent_id,user_id,policy_id,policy_hash,
      environment,reseller_id,utc_day,package_id,package_fingerprint,cost_units,balance_units,evidence_at,candidate_hash)
      values(p_session_id,receipt.payment_intent_id,p_user_id,p_policy_id,p_policy_hash,p_environment,p_reseller_id,p_utc_day,
        p_package_id,p_package_fingerprint,p_cost_units,p_balance_units,p_evidence_at,p_candidate_hash) returning * into claim;
  end if;
  return jsonb_build_object('ok',true,'claim_id',claim.claim_id,'state',claim.state,'reference',claim.checkout_session_id,
    'reserved_units',claim.cost_units::text,'may_dispatch',false,'replayed',replayed);
end;
$reserve$;
revoke all on function public.ks_reserve_setup_review(text,uuid,uuid,text,text,text,text,text,bigint,bigint,date,timestamptz,text)
  from public,anon,authenticated;
grant execute on function public.ks_reserve_setup_review(text,uuid,uuid,text,text,text,text,text,bigint,bigint,date,timestamptz,text)
  to service_role;
commit;
