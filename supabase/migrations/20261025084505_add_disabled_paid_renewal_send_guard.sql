-- Disabled send guard only: no provider transport, completion, expiry policy,
-- customer mutation, credit debit, release or automatic retry is installed.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $preflight$ begin
  lock table public.ks_preview_reseller_dispatches,public.ks_setup_review_reseller_slots,
    public.ks_crm_renewal_reseller_slots,public.ks_crm_live_renewal_reseller_slots,
    public.ks_crm_order_renewal_reseller_slots,public.ks_crm_renewal_control,
    public.ks_crm_live_renewal_control,public.ks_crm_order_renewal_control in share row exclusive mode;
  if not exists(select 1 from pg_proc where oid='public.ks_guard_reseller_reservation_exclusion()'::regprocedure
    and not prosecdef and provolatile='v' and proconfig @> array['search_path=""']
    and encode(sha256(convert_to(prosrc,'UTF8')),'hex')='bcfe76ab1b25f2c41b302d6ef0f47f8209d7288f6ca20f4a1ef08804e965a884')
    then raise exception 'reviewed_five_protocol_guard_required'; end if;
  if (select count(*) from pg_trigger where tgfoid='public.ks_guard_reseller_reservation_exclusion()'::regprocedure
      and not tgisinternal and tgenabled='O' and tgtype=23)<>5 then raise exception 'reviewed_five_protocol_triggers_required'; end if;
  if exists(select 1 from public.ks_preview_reseller_dispatches) or exists(select 1 from public.ks_setup_review_reseller_slots)
    or exists(select 1 from public.ks_crm_renewal_reseller_slots) or exists(select 1 from public.ks_crm_live_renewal_reseller_slots)
    or exists(select 1 from public.ks_crm_order_renewal_reseller_slots) then raise exception 'existing_work_requires_reconciliation'; end if;
  if not exists(select 1 from public.ks_crm_renewal_control where singleton and not execution_enabled)
    or not exists(select 1 from public.ks_crm_live_renewal_control where singleton and not execution_enabled)
    or not exists(select 1 from public.ks_crm_order_renewal_control where singleton and not execution_enabled)
    then raise exception 'existing_execution_controls_must_be_off'; end if;
end $preflight$;
create table public.ks_paid_renewal_send_control(singleton boolean primary key default true check(singleton),
  execution_enabled boolean not null default false);
alter table public.ks_paid_renewal_send_control enable row level security;
revoke all on public.ks_paid_renewal_send_control from public,anon,authenticated,service_role;
grant select on public.ks_paid_renewal_send_control to service_role;
insert into public.ks_paid_renewal_send_control values(true,false);
create table public.ks_paid_renewal_send_operations(
  operation_id uuid primary key references public.ks_paid_renewal_review_bindings(operation_id) on delete restrict,
  approval_id uuid not null unique references public.ks_paid_renewal_quote_approvals(approval_id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  consent_id uuid not null unique,consent_hash text not null check(consent_hash ~ '^[a-f0-9]{64}$'),
  quote_fingerprint text not null check(quote_fingerprint ~ '^[a-f0-9]{64}$'),
  cost_units bigint not null check(cost_units between 1 and 1000000000000),
  evidence_at timestamptz not null,consent_issued_at timestamptz not null,consent_expires_at timestamptz not null,
  claim_token uuid not null unique default gen_random_uuid(),
  state text not null default 'reserved' check(state in ('reserved','send_started','reconciliation_required')),
  started_at timestamptz,created_at timestamptz not null default clock_timestamp(),
  check(state<>'send_started' or started_at is not null)
);
create index ks_paid_renewal_send_actor_idx on public.ks_paid_renewal_send_operations(actor_id);
create table public.ks_paid_renewal_send_line_versions(reseller_id text not null,line_id text not null,old_expiry timestamptz not null,
  operation_id uuid not null unique references public.ks_paid_renewal_send_operations(operation_id),primary key(reseller_id,line_id,old_expiry));
create table public.ks_paid_renewal_send_reseller_slots(reseller_id text primary key,
  operation_id uuid not null unique references public.ks_paid_renewal_send_operations(operation_id));
alter table public.ks_paid_renewal_send_operations enable row level security;
alter table public.ks_paid_renewal_send_line_versions enable row level security;
alter table public.ks_paid_renewal_send_reseller_slots enable row level security;
revoke all on public.ks_paid_renewal_send_operations,public.ks_paid_renewal_send_line_versions,
  public.ks_paid_renewal_send_reseller_slots from public,anon,authenticated,service_role;
grant select,insert on public.ks_paid_renewal_send_operations,public.ks_paid_renewal_send_line_versions,
  public.ks_paid_renewal_send_reseller_slots to service_role;
grant update(state,started_at) on public.ks_paid_renewal_send_operations to service_role;

create function public.ks_paid_renewal_send_enabled() returns boolean
language sql volatile security invoker set search_path='' as $$
  select exists(select 1 from public.ks_paid_renewal_send_control where singleton and execution_enabled)
    and exists(select 1 from public.ks_crm_renewal_control where singleton and not execution_enabled)
    and exists(select 1 from public.ks_crm_live_renewal_control where singleton and not execution_enabled)
    and exists(select 1 from public.ks_crm_order_renewal_control where singleton and not execution_enabled)
$$;
create function public.ks_assert_paid_renewal_send_facts(o public.ks_paid_renewal_send_operations) returns void
language plpgsql security invoker set search_path='' as $$
declare r public.ks_paid_renewal_review_bindings%rowtype; q public.ks_paid_renewal_quote_approvals%rowtype; current jsonb;
begin
  if not public.ks_paid_renewal_send_enabled() then raise exception 'paid_renewal_send_disabled'; end if;
  if current_setting('transaction_isolation')<>'read committed' then raise exception 'paid_renewal_send_requires_read_committed'; end if;
  select * into strict r from public.ks_paid_renewal_review_bindings where operation_id=o.operation_id;
  select * into q from public.ks_paid_renewal_quote_approvals where operation_id=o.operation_id and approval_id=o.approval_id;
  if not found or q.approver_id is distinct from o.actor_id or q.quote_fingerprint is distinct from o.quote_fingerprint
    or q.cost_units is distinct from o.cost_units then raise exception 'paid_renewal_send_quote_changed'; end if;
  current:=public.ks_lookup_paid_renewal_quote_approval(r.checkout_session_id,r.user_id,o.operation_id,o.actor_id);
  if current->>'state' is distinct from 'approval_saved' then raise exception 'paid_renewal_send_review_required'; end if;
  if o.evidence_at>clock_timestamp() or o.evidence_at+interval '30 seconds'<=clock_timestamp()
    or o.consent_issued_at>clock_timestamp() or o.consent_expires_at<=clock_timestamp()
    or o.consent_expires_at<>o.consent_issued_at+interval '5 minutes' then raise exception 'paid_renewal_send_evidence_expired'; end if;
end; $$;
create function public.ks_guard_paid_renewal_send_operation() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='DELETE' then raise exception 'paid_renewal_send_is_immutable'; end if;
  if tg_op='INSERT' then
    if new.state<>'reserved' or new.started_at is not null then raise exception 'paid_renewal_send_initial_state_required'; end if;
    perform public.ks_assert_paid_renewal_send_facts(new);new.created_at:=clock_timestamp();return new;
  end if;
  if (to_jsonb(new)-array['state','started_at']) is distinct from (to_jsonb(old)-array['state','started_at'])
    then raise exception 'paid_renewal_send_identity_is_immutable'; end if;
  if old.state='reserved' and new.state='send_started' then
    perform public.ks_assert_paid_renewal_send_facts(new);new.started_at:=clock_timestamp();
    if not exists(select 1 from public.ks_paid_renewal_send_reseller_slots where operation_id=new.operation_id)
      or not exists(select 1 from public.ks_paid_renewal_send_line_versions where operation_id=new.operation_id)
      then raise exception 'paid_renewal_send_reservations_required'; end if;
  elsif old.state in ('reserved','send_started') and new.state='reconciliation_required' then
    new.started_at:=old.started_at;
  else raise exception 'paid_renewal_send_transition_rejected'; end if;
  return new;
end; $$;
create trigger ks_paid_renewal_send_operation_guard before insert or update or delete on public.ks_paid_renewal_send_operations
  for each row execute function public.ks_guard_paid_renewal_send_operation();
create function public.ks_paid_renewal_send_fresh_commit() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if new.state='send_started' then perform public.ks_assert_paid_renewal_send_facts(new);end if;return null;
end; $$;
create constraint trigger ks_paid_renewal_send_commit_guard after update on public.ks_paid_renewal_send_operations
  deferrable initially deferred for each row execute function public.ks_paid_renewal_send_fresh_commit();
create function public.ks_paid_renewal_send_reservation_immutable() returns trigger
language plpgsql security invoker set search_path='' as $$
begin raise exception 'paid_renewal_send_reservation_requires_reconciliation';end; $$;
create trigger ks_paid_renewal_send_version_immutable before update or delete on public.ks_paid_renewal_send_line_versions
  for each row execute function public.ks_paid_renewal_send_reservation_immutable();
create trigger ks_paid_renewal_send_slot_immutable before delete on public.ks_paid_renewal_send_reseller_slots
  for each row execute function public.ks_paid_renewal_send_reservation_immutable();
create function public.ks_guard_paid_renewal_send_reservation() returns trigger
language plpgsql security invoker set search_path='' as $$
declare o public.ks_paid_renewal_send_operations%rowtype;q jsonb;
begin
  select * into strict o from public.ks_paid_renewal_send_operations where operation_id=new.operation_id;
  perform public.ks_assert_paid_renewal_send_facts(o);
  select quote_canonical::jsonb into strict q from public.ks_paid_renewal_quote_approvals where approval_id=o.approval_id;
  if o.state<>'reserved' or new.reseller_id is distinct from q->>'resellerId' then raise exception 'paid_renewal_send_reservation_changed';end if;
  if tg_table_name='ks_paid_renewal_send_line_versions' then
    if new.line_id is distinct from q->>'lineId' or new.old_expiry is distinct from (q->>'previousExpiresAt')::timestamptz
      then raise exception 'paid_renewal_send_reservation_changed';end if;
  end if;return new;
end; $$;
create trigger ks_paid_renewal_send_version_insert before insert on public.ks_paid_renewal_send_line_versions
  for each row execute function public.ks_guard_paid_renewal_send_reservation();
create trigger ks_paid_renewal_send_slot_insert before insert on public.ks_paid_renewal_send_reseller_slots
  for each row execute function public.ks_guard_paid_renewal_send_reservation();

create or replace function public.ks_guard_reseller_reservation_exclusion()
returns trigger language plpgsql volatile security invoker set search_path='' as $$
begin
  if tg_table_schema<>'public' or tg_table_name not in
    ('ks_preview_reseller_dispatches','ks_setup_review_reseller_slots','ks_crm_renewal_reseller_slots',
     'ks_crm_live_renewal_reseller_slots','ks_crm_order_renewal_reseller_slots','ks_paid_renewal_send_reseller_slots')
    then raise exception 'unsupported_reseller_reservation_table'; end if;
  if tg_op<>'INSERT' then raise exception 'reseller_reservation_is_immutable'; end if;
  if new.reseller_id is null or new.reseller_id !~ '^[1-9][0-9]{0,14}$' then raise exception 'canonical_reseller_reservation_required'; end if;
  if current_setting('transaction_isolation')<>'read committed' then raise exception 'reseller_reservation_requires_read_committed'; end if;
  if not pg_try_advisory_xact_lock(hashtextextended('ks-reseller-reservation/v1:'||new.reseller_id,0)) then raise exception 'reseller_reservation_busy'; end if;
  if (tg_table_name<>'ks_preview_reseller_dispatches' and exists(select 1 from public.ks_preview_reseller_dispatches where reseller_id=new.reseller_id))
    or(tg_table_name<>'ks_setup_review_reseller_slots' and exists(select 1 from public.ks_setup_review_reseller_slots where reseller_id=new.reseller_id))
    or(tg_table_name<>'ks_crm_renewal_reseller_slots' and exists(select 1 from public.ks_crm_renewal_reseller_slots where reseller_id=new.reseller_id))
    or(tg_table_name<>'ks_crm_live_renewal_reseller_slots' and exists(select 1 from public.ks_crm_live_renewal_reseller_slots where reseller_id=new.reseller_id))
    or(tg_table_name<>'ks_crm_order_renewal_reseller_slots' and exists(select 1 from public.ks_crm_order_renewal_reseller_slots where reseller_id=new.reseller_id))
    or(tg_table_name<>'ks_paid_renewal_send_reseller_slots' and exists(select 1 from public.ks_paid_renewal_send_reseller_slots where reseller_id=new.reseller_id))
    then raise exception 'reseller_reserved_for_other_work';end if;return new;
end; $$;
create trigger ks_reseller_reservation_exclusion before insert or update on public.ks_paid_renewal_send_reseller_slots
  for each row execute function public.ks_guard_reseller_reservation_exclusion();

create function public.ks_lookup_paid_renewal_send_guard(p_operation uuid,p_actor uuid,p_consent uuid,p_hash text,p_approval uuid,p_quote text,p_cost bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.ks_paid_renewal_send_operations%rowtype;
begin
  perform public.ks_paid_renewal_quote_actor(p_actor);
  select * into o from public.ks_paid_renewal_send_operations where operation_id=p_operation;
  if not found then return null;end if;
  if (o.actor_id,o.consent_id,o.consent_hash,o.approval_id,o.quote_fingerprint,o.cost_units)
    is distinct from (p_actor,p_consent,p_hash,p_approval,p_quote,p_cost) then raise exception 'paid_renewal_send_identity_changed';end if;
  return jsonb_build_object('state',o.state,'claimToken',o.claim_token,'startedAt',o.started_at,'replayed',true,'mayDispatch',false);
end; $$;
create function public.ks_reserve_paid_renewal_send_guard(p_operation uuid,p_actor uuid,p_consent uuid,p_hash text,p_approval uuid,p_quote text,p_cost bigint,
  p_checked timestamptz,p_issued timestamptz,p_expires timestamptz) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare prior jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('ks-paid-renewal-send/v1:'||coalesce(p_operation::text,''),0));
  prior:=public.ks_lookup_paid_renewal_send_guard(p_operation,p_actor,p_consent,p_hash,p_approval,p_quote,p_cost);
  if prior is not null then return prior;end if;
  insert into public.ks_paid_renewal_send_operations(operation_id,approval_id,actor_id,consent_id,consent_hash,quote_fingerprint,cost_units,
    evidence_at,consent_issued_at,consent_expires_at)
    values(p_operation,p_approval,p_actor,p_consent,p_hash,p_quote,p_cost,p_checked,p_issued,p_expires);
  return public.ks_lookup_paid_renewal_send_guard(p_operation,p_actor,p_consent,p_hash,p_approval,p_quote,p_cost)||jsonb_build_object('replayed',false);
end; $$;
create function public.ks_begin_paid_renewal_send_guard(p_operation uuid,p_claim uuid) returns boolean
language plpgsql volatile security invoker set search_path='' as $$
declare o public.ks_paid_renewal_send_operations%rowtype;q jsonb;r public.ks_paid_renewal_review_bindings%rowtype;n integer;
begin
  select * into o from public.ks_paid_renewal_send_operations where operation_id=p_operation for update;
  if not found or o.claim_token is distinct from p_claim then raise exception 'paid_renewal_send_claim_required';end if;
  if o.state<>'reserved' then return false;end if;
  perform public.ks_assert_paid_renewal_send_facts(o);
  select * into strict r from public.ks_paid_renewal_review_bindings where operation_id=p_operation;
  select quote_canonical::jsonb into strict q from public.ks_paid_renewal_quote_approvals where approval_id=o.approval_id;
  perform 1 from public.iptv_customers where id=r.customer_id and external_id::text=r.binding->>'lineId'
    and username=r.binding->>'username' and expiration_at=(r.binding->>'currentExpiresAt')::timestamptz
    and connections_allowed=(r.binding->>'currentConnections')::integer
    and package_name is not distinct from r.binding->>'currentPackageName' for update;
  if not found then raise exception 'paid_renewal_send_service_changed';end if;
  if exists(select 1 from public.ks_crm_renewal_line_versions where reseller_id=q->>'resellerId' and line_id=q->>'lineId' and old_expiry=(q->>'previousExpiresAt')::timestamptz)
    or exists(select 1 from public.ks_crm_live_renewal_line_versions where reseller_id=q->>'resellerId' and line_id=q->>'lineId' and old_expiry=(q->>'previousExpiresAt')::timestamptz)
    or exists(select 1 from public.ks_crm_order_renewal_line_versions where reseller_id=q->>'resellerId' and line_id=q->>'lineId' and old_expiry=(q->>'previousExpiresAt')::timestamptz)
    then raise exception 'paid_renewal_line_already_used';end if;
  insert into public.ks_paid_renewal_send_line_versions values(q->>'resellerId',q->>'lineId',(q->>'previousExpiresAt')::timestamptz,p_operation)
    on conflict do nothing;get diagnostics n=row_count;if n<>1 then return false;end if;
  insert into public.ks_paid_renewal_send_reseller_slots values(q->>'resellerId',p_operation);
  update public.ks_paid_renewal_send_operations set state='send_started' where operation_id=p_operation;return true;
end; $$;
create function public.ks_stop_paid_renewal_send_guard(p_operation uuid,p_claim uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
  update public.ks_paid_renewal_send_operations set state='reconciliation_required'
    where operation_id=p_operation and claim_token=p_claim and state in ('reserved','send_started');
end; $$;
revoke all on function public.ks_paid_renewal_send_enabled(),public.ks_assert_paid_renewal_send_facts(public.ks_paid_renewal_send_operations),
  public.ks_guard_paid_renewal_send_operation(),public.ks_paid_renewal_send_fresh_commit(),public.ks_paid_renewal_send_reservation_immutable(),
  public.ks_guard_paid_renewal_send_reservation(),
  public.ks_lookup_paid_renewal_send_guard(uuid,uuid,uuid,text,uuid,text,bigint),
  public.ks_reserve_paid_renewal_send_guard(uuid,uuid,uuid,text,uuid,text,bigint,timestamptz,timestamptz,timestamptz),
  public.ks_begin_paid_renewal_send_guard(uuid,uuid),public.ks_stop_paid_renewal_send_guard(uuid,uuid) from public,anon,authenticated;
grant execute on function public.ks_paid_renewal_send_enabled(),public.ks_assert_paid_renewal_send_facts(public.ks_paid_renewal_send_operations),
  public.ks_guard_paid_renewal_send_operation(),public.ks_paid_renewal_send_fresh_commit(),public.ks_paid_renewal_send_reservation_immutable(),
  public.ks_guard_paid_renewal_send_reservation(),
  public.ks_lookup_paid_renewal_send_guard(uuid,uuid,uuid,text,uuid,text,bigint),
  public.ks_reserve_paid_renewal_send_guard(uuid,uuid,uuid,text,uuid,text,bigint,timestamptz,timestamptz,timestamptz),
  public.ks_begin_paid_renewal_send_guard(uuid,uuid),public.ks_stop_paid_renewal_send_guard(uuid,uuid) to service_role;
commit;
