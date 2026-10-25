-- Private completion/recovery only. No provider write, live release, financial
-- backfill, profile entitlement or customer-facing readiness is enabled.
begin;
set local lock_timeout='5s';set local statement_timeout='30s';
do $preflight$ begin
  lock table public.ks_paid_renewal_send_operations,public.ks_paid_renewal_send_reseller_slots,
    public.ks_paid_renewal_send_control,public.ks_setup_order_queue in share row exclusive mode;
  if exists(select 1 from public.ks_paid_renewal_send_operations) or exists(select 1 from public.ks_paid_renewal_send_reseller_slots)
    then raise exception 'existing_paid_send_work_requires_reconciliation';end if;
  if not exists(select 1 from public.ks_paid_renewal_send_control where singleton and not execution_enabled)
    then raise exception 'paid_send_control_must_be_off';end if;
  if not exists(select 1 from pg_proc where oid='public.ks_guard_paid_renewal_send_operation()'::regprocedure
    and not prosecdef and proconfig @> array['search_path=""'] and md5(prosrc)='6758fc2f03c87a9ac162e95dba9973c4')
    then raise exception 'reviewed_paid_send_guard_required';end if;
  if not exists(select 1 from pg_proc where oid='public.ks_guard_setup_order_queue()'::regprocedure
    and not prosecdef and proconfig @> array['search_path=""'] and md5(prosrc)='86f57d1c2f119daba8e0c6a5b1ad1d65')
    then raise exception 'reviewed_setup_queue_guard_required';end if;
end $preflight$;
alter table public.ks_paid_renewal_send_operations drop constraint ks_paid_renewal_send_operations_state_check,
  add constraint ks_paid_renewal_send_operations_state_check check(state in ('reserved','send_started','reconciliation_required','provider_verified','complete')),
  add column result_expiry timestamptz,
  add constraint ks_paid_renewal_send_result_check check((state in ('provider_verified','complete'))=(result_expiry is not null));
grant update(result_expiry) on public.ks_paid_renewal_send_operations to service_role;
create table public.ks_paid_renewal_expectations(
  operation_id uuid primary key references public.ks_paid_renewal_send_operations(operation_id),
  policy text not null check(policy='controlled_6m4_to_6m3_reset_ny/v1'),
  expected_expiry timestamptz not null,balance_before bigint not null check(balance_before between 1 and 1000000000000),
  observed_at timestamptz not null,unused_time_loss_confirmed boolean not null check(unused_time_loss_confirmed),
  created_at timestamptz not null default clock_timestamp());
create table public.ks_paid_renewal_provider_proofs(
  operation_id uuid primary key references public.ks_paid_renewal_expectations(operation_id),
  result jsonb not null,result_expiry timestamptz not null,balance_after bigint not null check(balance_after>=0),
  observed_at timestamptz not null,recorded_at timestamptz not null default clock_timestamp());
create table public.ks_paid_renewal_completions(
  operation_id uuid primary key references public.ks_paid_renewal_provider_proofs(operation_id),
  checkout_session_id text not null unique references public.ks_payment_receipts(checkout_session_id),
  user_id uuid not null references auth.users(id),customer_id uuid not null references public.iptv_customers(id),
  old_expiry timestamptz not null,new_expiry timestamptz not null,connections integer not null,package_name text not null,
  completed_at timestamptz not null default clock_timestamp());
create index ks_paid_renewal_completion_owner_idx on public.ks_paid_renewal_completions(user_id);
create index ks_paid_renewal_completion_customer_idx on public.ks_paid_renewal_completions(customer_id);
alter table public.ks_paid_renewal_expectations enable row level security;
alter table public.ks_paid_renewal_provider_proofs enable row level security;
alter table public.ks_paid_renewal_completions enable row level security;
revoke all on public.ks_paid_renewal_expectations,public.ks_paid_renewal_provider_proofs,public.ks_paid_renewal_completions from public,anon,authenticated,service_role;
grant select,insert on public.ks_paid_renewal_expectations,public.ks_paid_renewal_provider_proofs,public.ks_paid_renewal_completions to service_role;

create function public.ks_paid_renewal_completion_owner(p_operation uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare r public.ks_paid_renewal_review_bindings%rowtype;o public.ks_paid_renewal_send_operations%rowtype;c jsonb;
begin
  select * into strict r from public.ks_paid_renewal_review_bindings where operation_id=p_operation;
  select * into strict o from public.ks_paid_renewal_send_operations where operation_id=p_operation;
  perform public.ks_paid_renewal_quote_actor(o.actor_id);
  c:=public.ks_check_paid_renewal_review(r.checkout_session_id,r.user_id,p_operation);
  if c->>'state' is distinct from 'awaiting_verification' then raise exception 'paid_renewal_completion_owner_changed';end if;
end; $$;
create function public.ks_guard_paid_renewal_completion_evidence() returns trigger
language plpgsql security invoker set search_path='' as $$
declare o public.ks_paid_renewal_send_operations%rowtype;r public.ks_paid_renewal_review_bindings%rowtype;q jsonb;p public.ks_paid_renewal_provider_proofs%rowtype;
begin
  if tg_op<>'INSERT' then raise exception 'paid_renewal_completion_evidence_is_immutable';end if;
  select * into strict o from public.ks_paid_renewal_send_operations where operation_id=new.operation_id;
  select * into strict r from public.ks_paid_renewal_review_bindings where operation_id=new.operation_id;
  select quote_canonical::jsonb into strict q from public.ks_paid_renewal_quote_approvals where approval_id=o.approval_id;
  if tg_table_name='ks_paid_renewal_expectations' then
    perform public.ks_assert_paid_renewal_send_facts(o);
    if o.state<>'send_started' or o.started_at is null or new.policy<>'controlled_6m4_to_6m3_reset_ny/v1'
      or new.unused_time_loss_confirmed is distinct from true or q->>'months'<>'6' or q->>'connections'<>'3'
      or r.binding->>'currentConnections'<>'4' or coalesce(r.binding->>'currentPackageName','') !~* '^6\s+months?\s*\+\s*4\s+connections?$'
      or new.balance_before<o.cost_units or new.observed_at>clock_timestamp() or new.observed_at+interval '30 seconds'<=clock_timestamp()
      then raise exception 'paid_renewal_completion_policy_unverified';end if;
    new.expected_expiry:=date_trunc('second',((o.started_at at time zone 'America/New_York')+interval '6 months') at time zone 'America/New_York');
    new.created_at:=clock_timestamp();
  elsif tg_table_name='ks_paid_renewal_provider_proofs' then
    perform public.ks_assert_paid_renewal_provider_result(new.operation_id,new.result,new.balance_after,new.observed_at);
    if o.state<>'send_started' or new.result_expiry is distinct from (new.result->>'expiresAt')::timestamptz
      then raise exception 'paid_renewal_provider_proof_state_invalid';end if;
    new.recorded_at:=clock_timestamp();
  else
    perform public.ks_paid_renewal_completion_owner(new.operation_id);
    select * into strict p from public.ks_paid_renewal_provider_proofs where operation_id=new.operation_id;
    if o.state<>'provider_verified' or (new.checkout_session_id,new.user_id,new.customer_id,new.old_expiry,new.new_expiry,new.connections,new.package_name)
      is distinct from (r.checkout_session_id,r.user_id,r.customer_id,(q->>'previousExpiresAt')::timestamptz,p.result_expiry,(q->>'connections')::integer,q->>'packageName')
      then raise exception 'paid_renewal_completion_binding_changed';end if;
    new.completed_at:=clock_timestamp();
  end if;return new;
end; $$;
create trigger ks_paid_renewal_expectation_guard before insert or update or delete on public.ks_paid_renewal_expectations for each row execute function public.ks_guard_paid_renewal_completion_evidence();
create trigger ks_paid_renewal_provider_proof_guard before insert or update or delete on public.ks_paid_renewal_provider_proofs for each row execute function public.ks_guard_paid_renewal_completion_evidence();
create trigger ks_paid_renewal_completion_guard before insert or update or delete on public.ks_paid_renewal_completions for each row execute function public.ks_guard_paid_renewal_completion_evidence();

create function public.ks_assert_paid_renewal_provider_result(p_operation uuid,p_result jsonb,p_balance bigint,p_checked timestamptz) returns void
language plpgsql security invoker set search_path='' as $$
declare o public.ks_paid_renewal_send_operations%rowtype;e public.ks_paid_renewal_expectations%rowtype;q jsonb;expiry timestamptz;
begin
  perform public.ks_paid_renewal_completion_owner(p_operation);
  select * into strict o from public.ks_paid_renewal_send_operations where operation_id=p_operation;
  select * into strict e from public.ks_paid_renewal_expectations where operation_id=p_operation;
  select quote_canonical::jsonb into strict q from public.ks_paid_renewal_quote_approvals where approval_id=o.approval_id;
  expiry:=(p_result->>'expiresAt')::timestamptz;
  if p_result is null or (p_result-'expiresAt') is distinct from jsonb_build_object('customerId',q->>'customerId','lineId',q->>'lineId','username',q->>'username',
    'resellerId',q->>'resellerId','packageId',q->>'packageId','connections',(q->>'connections')::integer,'bouquetIds',q->'bouquetIds','enabled',true,'adminEnabled',true,'trial',false)
    or expiry is null or expiry<=clock_timestamp() or date_trunc('second',expiry) is distinct from expiry
    or abs(extract(epoch from expiry-e.expected_expiry))>120 or p_balance is distinct from e.balance_before-o.cost_units
    or p_checked is null or p_checked>clock_timestamp() or p_checked+interval '30 seconds'<=clock_timestamp()
    or p_checked<date_trunc('milliseconds',e.created_at)
    or not exists(select 1 from public.ks_paid_renewal_send_reseller_slots where operation_id=p_operation and reseller_id=q->>'resellerId')
    then raise exception 'paid_renewal_provider_result_unverified';end if;
end; $$;

create or replace function public.ks_guard_paid_renewal_send_operation() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='DELETE' then raise exception 'paid_renewal_send_is_immutable';end if;
  if tg_op='INSERT' then
    if new.state<>'reserved' or new.started_at is not null or new.result_expiry is not null then raise exception 'paid_renewal_send_initial_state_required';end if;
    perform public.ks_assert_paid_renewal_send_facts(new);new.created_at:=clock_timestamp();return new;
  end if;
  if (to_jsonb(new)-array['state','started_at','result_expiry']) is distinct from (to_jsonb(old)-array['state','started_at','result_expiry']) then raise exception 'paid_renewal_send_identity_is_immutable';end if;
  if old.state='reserved' and new.state='send_started' then
    perform public.ks_assert_paid_renewal_send_facts(new);new.started_at:=clock_timestamp();
    if not exists(select 1 from public.ks_paid_renewal_send_reseller_slots where operation_id=new.operation_id)
      or not exists(select 1 from public.ks_paid_renewal_send_line_versions where operation_id=new.operation_id) then raise exception 'paid_renewal_send_reservations_required';end if;
  elsif old.state in ('reserved','send_started') and new.state='reconciliation_required' then new.started_at:=old.started_at;
  elsif old.state='send_started' and new.state='provider_verified' then
    if not exists(select 1 from public.ks_paid_renewal_provider_proofs where operation_id=new.operation_id and result_expiry=new.result_expiry)
      then raise exception 'paid_renewal_saved_provider_proof_required';end if;new.started_at:=old.started_at;
  elsif old.state='provider_verified' and new.state='complete' then
    if not exists(select 1 from public.ks_paid_renewal_completions where operation_id=new.operation_id and new_expiry=new.result_expiry)
      then raise exception 'paid_renewal_saved_completion_required';end if;new.started_at:=old.started_at;
  else raise exception 'paid_renewal_send_transition_rejected';end if;return new;
end; $$;
create function public.ks_assert_paid_renewal_complete_state(p_operation uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.ks_paid_renewal_completions c join public.ks_paid_renewal_send_operations o using(operation_id)
    join public.ks_paid_renewal_review_bindings r using(operation_id)
    join public.ks_paid_renewal_provider_proofs p using(operation_id)
    join public.iptv_customers v on v.id=c.customer_id join public.ks_setup_order_queue queue on queue.checkout_session_id=c.checkout_session_id
    join public.ks_crm_portal_links l on l.customer_id=c.customer_id and l.user_id=c.user_id and l.external_id=v.external_id
    join auth.users u on u.id=c.user_id
    where c.operation_id=p_operation and o.state='complete' and o.result_expiry=c.new_expiry and p.result_expiry=c.new_expiry
      and c.user_id=r.user_id and c.checkout_session_id=r.checkout_session_id and c.customer_id=r.customer_id
      and v.external_id::text=r.binding->>'lineId' and v.username=r.binding->>'username'
      and v.expiration_at=c.new_expiry and v.connections_allowed=c.connections and v.package_name=c.package_name
      and queue.fulfillment_status='setup_complete' and queue.user_id=c.user_id and queue.livemode
      and u.email_confirmed_at is not null and u.is_anonymous is distinct from true
      and l.email_at_link=lower(btrim(u.email)) and l.confirmed_at_link=u.email_confirmed_at)
    then raise exception 'paid_renewal_complete_state_unverified';end if;
end; $$;
create function public.ks_paid_renewal_complete_commit() returns trigger
language plpgsql security invoker set search_path='' as $$
begin if new.state='complete' then
  perform public.ks_assert_paid_renewal_complete_state(new.operation_id);
  if exists(select 1 from public.ks_paid_renewal_send_reseller_slots where operation_id=new.operation_id) then raise exception 'completed_paid_renewal_slot_not_released';end if;
end if;return null;end; $$;
create constraint trigger ks_paid_renewal_complete_commit_guard after update on public.ks_paid_renewal_send_operations
  deferrable initially deferred for each row execute function public.ks_paid_renewal_complete_commit();
create function public.ks_paid_renewal_release_completed_slot() returns trigger
language plpgsql security invoker set search_path='' as $$
begin perform public.ks_assert_paid_renewal_complete_state(old.operation_id);return old;end; $$;
drop trigger ks_paid_renewal_send_slot_immutable on public.ks_paid_renewal_send_reseller_slots;
create trigger ks_paid_renewal_send_slot_immutable before delete on public.ks_paid_renewal_send_reseller_slots for each row execute function public.ks_paid_renewal_release_completed_slot();
grant delete on public.ks_paid_renewal_send_reseller_slots to service_role;
create or replace function public.ks_guard_setup_order_queue() returns trigger
language plpgsql security invoker set search_path='' as $$
declare r public.ks_payment_receipts%rowtype;
begin
  if tg_op='DELETE' then raise exception 'setup_order_cannot_be_deleted';end if;
  if tg_op='UPDATE' then
    if (to_jsonb(new)-'fulfillment_status') is distinct from (to_jsonb(old)-'fulfillment_status') then raise exception 'setup_order_binding_is_immutable';end if;
    if old.fulfillment_status in ('requires_review','setup_complete') and new.fulfillment_status<>old.fulfillment_status then raise exception 'setup_order_review_cannot_be_reset';end if;
  end if;
  select * into r from public.ks_payment_receipts where checkout_session_id=new.checkout_session_id;
  if not found or (r.payment_intent_id,r.user_id,r.livemode,r.tier,r.connections,r.duration_days,r.amount_cents,r.currency)
    is distinct from (new.payment_intent_id,new.user_id,new.livemode,new.tier,new.connections,new.duration_days,new.amount_cents,new.currency)
    then raise exception 'verified_setup_receipt_required';end if;
  if (r.activated or r.expires_at is not null) and new.fulfillment_status<>'requires_review' then raise exception 'legacy_setup_requires_review';end if;
  if new.fulfillment_status='setup_complete' then
    if r.livemode then
      if not exists(select 1 from public.ks_paid_renewal_completions c join public.ks_paid_renewal_send_operations o using(operation_id)
        join public.ks_paid_renewal_provider_proofs p using(operation_id) join public.iptv_customers v on v.id=c.customer_id
        where c.checkout_session_id=r.checkout_session_id and c.user_id=r.user_id and o.state in ('provider_verified','complete')
          and p.result_expiry=c.new_expiry and o.result_expiry=c.new_expiry and c.connections=r.connections
          and v.expiration_at=c.new_expiry and v.connections_allowed=c.connections and v.package_name=c.package_name)
        then raise exception 'paid_renewal_completion_binding_required';end if;
    elsif not exists(select 1 from public.ks_setup_review_completions s join public.ks_preview_provisioning_attempts a on a.attempt_id=s.attempt_id
      join public.ks_preview_streaming_logins l on l.attempt_id=a.attempt_id
      where s.checkout_session_id=r.checkout_session_id and s.user_id=r.user_id and a.state='credentials_ready'
        and l.user_id=r.user_id and l.checkout_session_id=r.checkout_session_id) then raise exception 'review_completion_binding_required';end if;
  end if;return new;
end; $$;

create function public.ks_paid_renewal_completion_context(p_operation uuid,p_actor uuid,p_consent uuid,p_hash text,p_approval uuid,p_quote text,p_cost bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s jsonb;r public.ks_paid_renewal_review_bindings%rowtype;o public.ks_paid_renewal_send_operations%rowtype;q jsonb;
begin
  s:=public.ks_lookup_paid_renewal_send_guard(p_operation,p_actor,p_consent,p_hash,p_approval,p_quote,p_cost);
  if s is null then raise exception 'saved_paid_send_guard_required';end if;
  select * into strict r from public.ks_paid_renewal_review_bindings where operation_id=p_operation;
  select * into strict o from public.ks_paid_renewal_send_operations where operation_id=p_operation;
  select quote_canonical::jsonb into strict q from public.ks_paid_renewal_quote_approvals where approval_id=p_approval;
  return s||jsonb_build_object('operationId',p_operation,'reference',r.checkout_session_id,'ownerId',r.user_id,'quote',q,
    'expectation',(select to_jsonb(e) from public.ks_paid_renewal_expectations e where operation_id=p_operation),
    'proof',(select to_jsonb(p) from public.ks_paid_renewal_provider_proofs p where operation_id=p_operation),
    'completion',(select to_jsonb(c) from public.ks_paid_renewal_completions c where operation_id=p_operation));
end; $$;
create function public.ks_prepare_paid_renewal_completion(p_operation uuid,p_claim uuid,p_policy text,p_loss boolean,p_balance bigint,p_checked timestamptz)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.ks_paid_renewal_send_operations%rowtype;e public.ks_paid_renewal_expectations%rowtype;
begin
  select * into o from public.ks_paid_renewal_send_operations where operation_id=p_operation for update;
  if not found or o.claim_token is distinct from p_claim then raise exception 'paid_renewal_send_claim_required';end if;
  select * into e from public.ks_paid_renewal_expectations where operation_id=p_operation;
  if found then return to_jsonb(e);end if;
  insert into public.ks_paid_renewal_expectations(operation_id,policy,expected_expiry,balance_before,observed_at,unused_time_loss_confirmed)
    values(p_operation,p_policy,clock_timestamp(),p_balance,p_checked,p_loss) returning * into e;
  return to_jsonb(e);
end; $$;
create function public.ks_verify_paid_renewal_completion(p_operation uuid,p_claim uuid,p_result jsonb,p_balance bigint,p_checked timestamptz)
returns boolean language plpgsql security invoker set search_path='' as $$
declare o public.ks_paid_renewal_send_operations%rowtype;p public.ks_paid_renewal_provider_proofs%rowtype;
begin
  select * into o from public.ks_paid_renewal_send_operations where operation_id=p_operation for update;
  if not found or o.claim_token is distinct from p_claim then raise exception 'paid_renewal_send_claim_required';end if;
  select * into p from public.ks_paid_renewal_provider_proofs where operation_id=p_operation;
  if found then if p.result is distinct from p_result or p.balance_after is distinct from p_balance then raise exception 'paid_renewal_saved_proof_changed';end if;return false;end if;
  insert into public.ks_paid_renewal_provider_proofs(operation_id,result,result_expiry,balance_after,observed_at)
    values(p_operation,p_result,(p_result->>'expiresAt')::timestamptz,p_balance,p_checked);
  update public.ks_paid_renewal_send_operations set state='provider_verified',result_expiry=(p_result->>'expiresAt')::timestamptz where operation_id=p_operation;return true;
end; $$;
create function public.ks_complete_paid_renewal(p_operation uuid,p_claim uuid,p_current jsonb,p_checked timestamptz)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.ks_paid_renewal_send_operations%rowtype;r public.ks_paid_renewal_review_bindings%rowtype;p public.ks_paid_renewal_provider_proofs%rowtype;q jsonb;n integer;
begin
  select * into o from public.ks_paid_renewal_send_operations where operation_id=p_operation for update;
  if not found or o.claim_token is distinct from p_claim then raise exception 'paid_renewal_send_claim_required';end if;
  if o.state='complete' then return jsonb_build_object('state','complete','replayed',true,'mayDispatch',false);end if;
  select * into strict p from public.ks_paid_renewal_provider_proofs where operation_id=p_operation;
  if o.state<>'provider_verified' or p.result is distinct from p_current then raise exception 'paid_renewal_current_result_changed';end if;
  perform public.ks_assert_paid_renewal_provider_result(p_operation,p_current,p.balance_after,p_checked);
  select * into strict r from public.ks_paid_renewal_review_bindings where operation_id=p_operation;
  select quote_canonical::jsonb into strict q from public.ks_paid_renewal_quote_approvals where approval_id=o.approval_id;
  insert into public.ks_paid_renewal_completions(operation_id,checkout_session_id,user_id,customer_id,old_expiry,new_expiry,connections,package_name)
    values(p_operation,r.checkout_session_id,r.user_id,r.customer_id,(q->>'previousExpiresAt')::timestamptz,p.result_expiry,(q->>'connections')::integer,q->>'packageName');
  update public.iptv_customers set expiration_at=p.result_expiry,connections_allowed=(q->>'connections')::integer,package_name=q->>'packageName'
    where id=r.customer_id and external_id::text=q->>'lineId' and username=q->>'username' and expiration_at=(q->>'previousExpiresAt')::timestamptz
      and connections_allowed=(r.binding->>'currentConnections')::integer and package_name is not distinct from r.binding->>'currentPackageName';
  get diagnostics n=row_count;if n<>1 then raise exception 'paid_renewal_completion_service_changed';end if;
  update public.ks_setup_order_queue set fulfillment_status='setup_complete' where checkout_session_id=r.checkout_session_id and user_id=r.user_id and fulfillment_status='awaiting_activation';
  get diagnostics n=row_count;if n<>1 then raise exception 'paid_renewal_completion_queue_changed';end if;
  update public.ks_paid_renewal_send_operations set state='complete' where operation_id=p_operation;
  delete from public.ks_paid_renewal_send_reseller_slots where operation_id=p_operation;
  return jsonb_build_object('state','complete','replayed',false,'mayDispatch',false);
end; $$;
revoke all on function public.ks_paid_renewal_completion_owner(uuid),public.ks_guard_paid_renewal_completion_evidence(),
 public.ks_assert_paid_renewal_provider_result(uuid,jsonb,bigint,timestamptz),public.ks_assert_paid_renewal_complete_state(uuid),
 public.ks_paid_renewal_complete_commit(),public.ks_paid_renewal_release_completed_slot(),
 public.ks_paid_renewal_completion_context(uuid,uuid,uuid,text,uuid,text,bigint),public.ks_prepare_paid_renewal_completion(uuid,uuid,text,boolean,bigint,timestamptz),
 public.ks_verify_paid_renewal_completion(uuid,uuid,jsonb,bigint,timestamptz),public.ks_complete_paid_renewal(uuid,uuid,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.ks_paid_renewal_completion_owner(uuid),public.ks_guard_paid_renewal_completion_evidence(),
 public.ks_assert_paid_renewal_provider_result(uuid,jsonb,bigint,timestamptz),public.ks_assert_paid_renewal_complete_state(uuid),
 public.ks_paid_renewal_complete_commit(),public.ks_paid_renewal_release_completed_slot(),
 public.ks_paid_renewal_completion_context(uuid,uuid,uuid,text,uuid,text,bigint),public.ks_prepare_paid_renewal_completion(uuid,uuid,text,boolean,bigint,timestamptz),
 public.ks_verify_paid_renewal_completion(uuid,uuid,jsonb,bigint,timestamptz),public.ks_complete_paid_renewal(uuid,uuid,jsonb,timestamptz) to service_role;
commit;
