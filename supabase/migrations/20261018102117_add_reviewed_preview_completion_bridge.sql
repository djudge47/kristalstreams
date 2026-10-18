-- Completion bridge only. No dispatch transition, provider call or execution
-- policy is installed. Requires receipt/queue, review claims and existing
-- guarded Preview paid setup schemas. No rows or spending scope are seeded.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
create table public.ks_setup_review_completions (
  claim_id uuid primary key references public.ks_setup_review_claims(claim_id) on delete restrict,
  attempt_id uuid not null unique references public.ks_preview_paid_fulfillments(attempt_id) on delete restrict,
  user_id uuid not null unique references auth.users(id) on delete restrict,
  checkout_session_id text not null unique references public.ks_payment_receipts(checkout_session_id) on delete restrict,
  reseller_id text not null,
  utc_day date not null,
  cost_units bigint not null check(cost_units between 1 and 1000000000000),
  before_spent bigint not null check(before_spent>=0),
  before_reserved bigint not null check(before_reserved>=cost_units),
  after_spent bigint not null check(after_spent=before_spent+cost_units),
  after_reserved bigint not null check(after_reserved=before_reserved-cost_units),
  completed_at timestamptz not null default now()
);
alter table public.ks_setup_review_completions enable row level security;
revoke all on public.ks_setup_review_completions from public,anon,authenticated,service_role;
grant select,insert on public.ks_setup_review_completions to service_role;
-- Locking requires an UPDATE privilege. The immutable claim trigger still
-- rejects every actual UPDATE, including a same-value assignment.
grant update(state) on public.ks_setup_review_claims to service_role;
grant update(spent_units) on public.ks_setup_review_budgets to service_role;
grant delete on public.ks_setup_review_reseller_slots to service_role;

create function public.ks_guard_reviewed_preview_completion()
returns trigger language plpgsql security invoker set search_path='' as $guard$
declare
  c public.ks_setup_review_claims%rowtype;
  a public.ks_preview_provisioning_attempts%rowtype;
  r public.ks_payment_receipts%rowtype;
  q public.ks_setup_order_queue%rowtype;
  f public.ks_preview_paid_fulfillments%rowtype;
  b public.ks_setup_review_budgets%rowtype;
  expected_binding text;
begin
  if tg_op<>'INSERT' then raise exception 'review_completion_is_immutable'; end if;
  select * into c from public.ks_setup_review_claims where claim_id=new.claim_id;
  if not found then raise exception 'review_claim_required'; end if;
  -- Same profile -> receipt -> queue -> claim -> budget order as the wrapper.
  perform 1 from public.profiles where id=c.user_id for update;
  select * into r from public.ks_payment_receipts where checkout_session_id=c.checkout_session_id for update;
  select * into q from public.ks_setup_order_queue where checkout_session_id=c.checkout_session_id for update;
  perform 1 from public.ks_setup_review_claims where claim_id=c.claim_id for update;
  select * into a from public.ks_preview_provisioning_attempts where attempt_id=new.attempt_id;
  select * into f from public.ks_preview_paid_fulfillments where attempt_id=new.attempt_id;
  -- Match the established server JSON binding byte-for-byte. jsonb::text would
  -- reorder keys/add spaces and must not replace this canonical encoding.
  expected_binding:=encode(extensions.digest(
    '{"sessionId":'||to_json(r.checkout_session_id)::text||',"ownerId":'||to_json(c.user_id::text)::text
    ||',"intentId":'||to_json(c.payment_intent_id)::text||',"tier":'||to_json(r.tier)::text
    ||',"connections":'||r.connections::text||',"amountCents":'||r.amount_cents::text
    ||',"resellerId":'||to_json(c.reseller_id)::text||',"packageFingerprint":'||to_json(c.package_fingerprint)::text||'}','sha256'),'hex');
  if c.environment is distinct from 'preview' or c.state is distinct from 'reserved_for_review'
    or r.livemode is distinct from false or r.activated is distinct from false or r.expires_at is not null
    or q.fulfillment_status is distinct from 'awaiting_activation'
    or (r.user_id,r.payment_intent_id,r.checkout_session_id) is distinct from (c.user_id,c.payment_intent_id,c.checkout_session_id)
    or (new.user_id,new.checkout_session_id,new.reseller_id,new.utc_day,new.cost_units)
       is distinct from (c.user_id,c.checkout_session_id,c.reseller_id,c.utc_day,c.cost_units)
    or a.attempt_id is null or a.state is distinct from 'credentials_ready'
    or a.binding_hash is distinct from expected_binding
    or a.package_months is distinct from (case r.tier when 'bronze' then 1 when 'silver' then 3 when 'gold' then 6 when 'platinum' then 12 end)
    or (a.user_id,a.checkout_session_id,a.payment_intent_id,a.reseller_id,a.package_id,a.connections)
       is distinct from (c.user_id,c.checkout_session_id,c.payment_intent_id,c.reseller_id,c.package_id,r.connections)
    or a.expected_credits*1000000 is distinct from c.cost_units::numeric
    or a.created_at<c.reserved_at or a.provider_line_id is null or a.provider_expires_at<=clock_timestamp()
    or f.attempt_id is null or (f.user_id,f.checkout_session_id) is distinct from (c.user_id,c.checkout_session_id)
    or f.credit_cost_units is distinct from c.cost_units::numeric
    or f.balance_before_units is distinct from c.balance_units::numeric
    or f.approved_at<c.reserved_at
    or not exists(select 1 from public.ks_preview_streaming_logins l
      where l.attempt_id=a.attempt_id and l.user_id=c.user_id and l.checkout_session_id=c.checkout_session_id)
    or not exists(select 1 from public.ks_preview_paid_orders p
      where p.checkout_session_id=c.checkout_session_id and p.fulfillment_status='setup_complete')
    or not exists(select 1 from public.iptv_customers customer
      where customer.id=f.crm_customer_id and customer.source='roomba_preview_paid'
      and customer.external_id=a.provider_line_id::bigint and customer.connections_allowed=a.connections
      and customer.expiration_at=a.provider_expires_at and customer.trial=false)
    or not exists(select 1 from public.ks_setup_review_reseller_slots s where s.claim_id=c.claim_id and s.reseller_id=c.reseller_id)
    then raise exception 'separately_verified_preview_completion_required'; end if;
  select * into b from public.ks_setup_review_budgets where reseller_id=c.reseller_id and utc_day=c.utc_day for update;
  if not found or b.reserved_units<c.cost_units
    or (new.before_spent,new.before_reserved,new.after_spent,new.after_reserved)
       is distinct from (b.spent_units,b.reserved_units,b.spent_units+c.cost_units,b.reserved_units-c.cost_units)
    then raise exception 'review_completion_budget_mismatch'; end if;
  new.completed_at:=clock_timestamp();
  return new;
end;
$guard$;
create trigger ks_setup_review_completion_guard before insert or update or delete on public.ks_setup_review_completions
  for each row execute function public.ks_guard_reviewed_preview_completion();

-- Extend only the staged review bookkeeping guards. An immutable completion
-- audit plus the existing verified owner/CRM binding is required for release.
create or replace function public.ks_guard_setup_review_history()
returns trigger language plpgsql security invoker set search_path='' as $history$
begin
  if tg_op='DELETE' then
    if tg_table_name='ks_setup_review_reseller_slots' and exists(
      select 1 from public.ks_setup_review_completions s
      join public.ks_setup_review_budgets b on b.reseller_id=s.reseller_id and b.utc_day=s.utc_day
      join public.ks_setup_order_queue q on q.checkout_session_id=s.checkout_session_id
      where s.claim_id=old.claim_id and s.reseller_id=old.reseller_id
        and b.spent_units=s.after_spent and b.reserved_units=s.after_reserved
        and q.fulfillment_status='setup_complete') then return old; end if;
    raise exception 'setup_review_history_cannot_be_deleted';
  end if;
  if tg_table_name='ks_setup_review_policies' then
    if (to_jsonb(new)-'revoked_at') is distinct from (to_jsonb(old)-'revoked_at')
      or old.revoked_at is not null or new.revoked_at is null then raise exception 'setup_review_policy_is_immutable'; end if;
  elsif tg_table_name='ks_setup_review_budgets' then
    if (to_jsonb(new)-array['reserved_units','spent_units']) is distinct from (to_jsonb(old)-array['reserved_units','spent_units']) then
      raise exception 'setup_review_budget_cannot_be_reset';
    end if;
    if new.spent_units=old.spent_units and new.reserved_units>=old.reserved_units then return new; end if;
    if not exists(select 1 from public.ks_setup_review_completions s
      join public.ks_setup_order_queue q using(checkout_session_id)
      where s.reseller_id=old.reseller_id and s.utc_day=old.utc_day
        and (s.before_spent,s.before_reserved,s.after_spent,s.after_reserved)
          =(old.spent_units,old.reserved_units,new.spent_units,new.reserved_units)
        and q.fulfillment_status='setup_complete') then raise exception 'verified_review_settlement_required'; end if;
  else raise exception 'setup_review_binding_is_immutable';
  end if;
  return new;
end;
$history$;

alter table public.ks_setup_order_queue drop constraint ks_setup_order_queue_fulfillment_status_check;
alter table public.ks_setup_order_queue add constraint ks_setup_order_queue_fulfillment_status_check
  check(fulfillment_status in ('awaiting_activation','requires_review','setup_complete'));
create or replace function public.ks_guard_setup_order_queue()
returns trigger language plpgsql security invoker set search_path='' as $queue$
declare r public.ks_payment_receipts%rowtype;
begin
  if tg_op='DELETE' then raise exception 'setup_order_cannot_be_deleted'; end if;
  if tg_op='UPDATE' then
    if (to_jsonb(new)-'fulfillment_status') is distinct from (to_jsonb(old)-'fulfillment_status') then raise exception 'setup_order_binding_is_immutable'; end if;
    if old.fulfillment_status in ('requires_review','setup_complete') and new.fulfillment_status<>old.fulfillment_status then
      raise exception 'setup_order_review_cannot_be_reset'; end if;
  end if;
  select * into r from public.ks_payment_receipts where checkout_session_id=new.checkout_session_id;
  if not found or (r.payment_intent_id,r.user_id,r.livemode,r.tier,r.connections,r.duration_days,r.amount_cents,r.currency)
    is distinct from (new.payment_intent_id,new.user_id,new.livemode,new.tier,new.connections,new.duration_days,new.amount_cents,new.currency) then
    raise exception 'verified_setup_receipt_required'; end if;
  if (r.activated or r.expires_at is not null) and new.fulfillment_status<>'requires_review' then raise exception 'legacy_setup_requires_review'; end if;
  if new.fulfillment_status='setup_complete' and not exists(select 1 from public.ks_setup_review_completions s
    join public.ks_preview_provisioning_attempts a on a.attempt_id=s.attempt_id
    join public.ks_preview_streaming_logins l on l.attempt_id=a.attempt_id
    where s.checkout_session_id=r.checkout_session_id and s.user_id=r.user_id and a.state='credentials_ready'
      and l.user_id=r.user_id and l.checkout_session_id=r.checkout_session_id) then raise exception 'review_completion_binding_required'; end if;
  return new;
end;
$queue$;

-- A direct service INSERT of a valid completion audit must still settle its
-- bookkeeping by commit; it cannot leave a partial or falsely completed order.
create function public.ks_check_review_completion_committed()
returns trigger language plpgsql security invoker set search_path='' as $deferred$
begin
  if exists(select 1 from public.ks_setup_review_reseller_slots where claim_id=new.claim_id)
    or not exists(select 1 from public.ks_setup_order_queue where checkout_session_id=new.checkout_session_id and fulfillment_status='setup_complete')
    or not exists(select 1 from public.ks_setup_review_budgets where reseller_id=new.reseller_id and utc_day=new.utc_day and spent_units>=new.after_spent)
    then raise exception 'review_completion_transaction_incomplete'; end if;
  return null;
end;
$deferred$;
create constraint trigger ks_setup_review_completion_committed after insert on public.ks_setup_review_completions
  deferrable initially deferred for each row execute function public.ks_check_review_completion_committed();

create function public.ks_complete_reviewed_preview_setup(p_claim_id uuid,p_attempt_id uuid,p_claim_token uuid,p_user_id uuid,p_username text)
returns jsonb language plpgsql security invoker set search_path='' as $complete$
declare
  c public.ks_setup_review_claims%rowtype;
  a public.ks_preview_provisioning_attempts%rowtype;
  s public.ks_setup_review_completions%rowtype;
  b public.ks_setup_review_budgets%rowtype;
  result jsonb;
begin
  select * into c from public.ks_setup_review_claims where claim_id=p_claim_id;
  if not found or c.user_id is distinct from p_user_id or c.environment<>'preview' then raise exception 'preview_review_owner_required'; end if;
  perform 1 from public.profiles where id=c.user_id for update;
  perform 1 from public.ks_payment_receipts where checkout_session_id=c.checkout_session_id for update;
  perform 1 from public.ks_setup_order_queue where checkout_session_id=c.checkout_session_id for update;
  perform 1 from public.ks_setup_review_claims where claim_id=c.claim_id for update;
  select * into a from public.ks_preview_provisioning_attempts where attempt_id=p_attempt_id for update;
  if not found or a.claim_token is distinct from p_claim_token
    or (a.user_id,a.checkout_session_id,a.payment_intent_id,a.reseller_id,a.package_id)
      is distinct from (c.user_id,c.checkout_session_id,c.payment_intent_id,c.reseller_id,c.package_id)
    then raise exception 'reviewed_attempt_binding_changed'; end if;
  select * into s from public.ks_setup_review_completions where claim_id=c.claim_id;
  if found then
    if s.attempt_id<>a.attempt_id or a.state<>'credentials_ready'
      or p_username is null or encode(extensions.digest(p_username,'sha256'),'hex')<>a.username_hash
      or not exists(select 1 from public.ks_setup_order_queue where checkout_session_id=c.checkout_session_id and fulfillment_status='setup_complete')
      then raise exception 'reviewed_completion_binding_changed'; end if;
    return jsonb_build_object('ok',true,'state','credentials_ready','claim_id',c.claim_id,'attempt_id',a.attempt_id,
      'reference',c.checkout_session_id,'account_id',c.user_id,'expires_at',a.provider_expires_at,'may_dispatch',false,'replayed',true);
  end if;
  if a.state<>'provider_verified' then raise exception 'saved_provider_verification_required'; end if;
  -- Reuses the existing guarded CRM/completion/encrypted-login transaction.
  -- This function neither reserves an attempt nor sends a provider request.
  result:=public.ks_commit_preview_paid_setup(a.attempt_id,p_claim_token,p_username);
  if result->>'ok' is distinct from 'true' or result->>'state' is distinct from 'credentials_ready' then raise exception 'preview_completion_not_saved'; end if;
  select * into b from public.ks_setup_review_budgets where reseller_id=c.reseller_id and utc_day=c.utc_day for update;
  if not found then raise exception 'review_budget_required'; end if;
  insert into public.ks_setup_review_completions(claim_id,attempt_id,user_id,checkout_session_id,reseller_id,utc_day,cost_units,before_spent,before_reserved,after_spent,after_reserved)
    values(c.claim_id,a.attempt_id,c.user_id,c.checkout_session_id,c.reseller_id,c.utc_day,c.cost_units,b.spent_units,b.reserved_units,b.spent_units+c.cost_units,b.reserved_units-c.cost_units);
  update public.ks_setup_order_queue set fulfillment_status='setup_complete' where checkout_session_id=c.checkout_session_id;
  update public.ks_setup_review_budgets set reserved_units=reserved_units-c.cost_units,spent_units=spent_units+c.cost_units
    where reseller_id=c.reseller_id and utc_day=c.utc_day;
  delete from public.ks_setup_review_reseller_slots where claim_id=c.claim_id;
  return jsonb_build_object('ok',true,'state','credentials_ready','claim_id',c.claim_id,'attempt_id',a.attempt_id,
    'reference',c.checkout_session_id,'account_id',c.user_id,'expires_at',a.provider_expires_at,'may_dispatch',false,'replayed',false);
end;
$complete$;
revoke all on function public.ks_guard_reviewed_preview_completion() from public,anon,authenticated;
revoke all on function public.ks_check_review_completion_committed() from public,anon,authenticated;
revoke all on function public.ks_complete_reviewed_preview_setup(uuid,uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.ks_guard_reviewed_preview_completion() to service_role;
grant execute on function public.ks_check_review_completion_committed() to service_role;
grant execute on function public.ks_complete_reviewed_preview_setup(uuid,uuid,uuid,uuid,text) to service_role;
commit;
