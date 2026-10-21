-- INSTALLATION DRAFT: active Kristal Stream project wftfxerblhlsxiijtfbo only.
-- Execution remains disabled; install only after explicit review/approval.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

-- Refuse schema drift rather than replacing an unreviewed shared guard.
do $preflight$ begin
  if to_regclass('public.ks_preview_reseller_dispatches') is null
    or to_regclass('public.ks_setup_review_reseller_slots') is null
    or to_regprocedure('public.ks_guard_reseller_reservation_exclusion()') is null
    then raise exception 'renewal_foundation_prerequisites_required'; end if;
  lock table public.ks_preview_reseller_dispatches, public.ks_setup_review_reseller_slots
    in share row exclusive mode;
  if not exists(select 1 from pg_proc where oid='public.ks_guard_reseller_reservation_exclusion()'::regprocedure
    and not prosecdef and provolatile='v' and proconfig @> array['search_path=""']
    and encode(sha256(convert_to(prosrc,'UTF8')),'hex')='d7d5bfdcda6a8ee331784c1ed07e65d4be41db8ad1f8a81dda6c625e82ac8c77')
    then raise exception 'reviewed_reseller_guard_required'; end if;
  if (select count(*) from information_schema.columns c join (values
    ('iptv_customers','id','uuid'),('iptv_customers','external_id','int8'),
    ('iptv_customers','username','text'),('iptv_customers','expiration_at','timestamptz'),
    ('profiles','id','uuid'),('ks_preview_reseller_dispatches','reseller_id','text'),
    ('ks_setup_review_reseller_slots','reseller_id','text')) expected(t,n,u)
    on c.table_name=expected.t and c.column_name=expected.n and c.udt_name=expected.u
    where c.table_schema='public')<>7 then raise exception 'reviewed_renewal_columns_required'; end if;
  if (select count(*) from pg_trigger where tgfoid='public.ks_guard_reseller_reservation_exclusion()'::regprocedure
    and tgrelid in ('public.ks_preview_reseller_dispatches'::regclass,'public.ks_setup_review_reseller_slots'::regclass)
    and not tgisinternal and tgenabled='O' and tgtype=23)<>2
    then raise exception 'reviewed_reseller_triggers_required'; end if;
  if exists(select 1 from public.ks_preview_reseller_dispatches a
      join public.ks_setup_review_reseller_slots b using(reseller_id))
    then raise exception 'existing_reseller_reservations_require_reconciliation'; end if;
end $preflight$;

create table public.ks_crm_renewal_control (
  singleton boolean primary key default true check(singleton),
  execution_enabled boolean not null default false
);
alter table public.ks_crm_renewal_control enable row level security;
revoke all on public.ks_crm_renewal_control from public,anon,authenticated,service_role;
grant select on public.ks_crm_renewal_control to service_role;
insert into public.ks_crm_renewal_control(singleton,execution_enabled) values(true,false);
create function public.ks_crm_assert_renewal_execution() returns void
language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.ks_crm_renewal_control where singleton and execution_enabled)
    then raise exception 'renewal_execution_disabled'; end if;
end; $$;

create table public.ks_crm_renewal_approvals (
  approval_id uuid primary key, operation_id uuid not null unique,
  approver_id uuid not null references public.profiles(id),
  customer_id uuid not null references public.iptv_customers(id),
  line_id text not null check(line_id ~ '^[1-9][0-9]{0,14}$'),
  username text not null check(username ~ '^[A-Za-z0-9_.-]{3,64}$'),
  reseller_id text not null check(reseller_id ~ '^[1-9][0-9]{0,14}$'),
  package_id text not null check(package_id ~ '^[1-9][0-9]{0,11}$'),
  months integer not null check(months in (1,3,6,12)),
  connections integer not null check(connections between 1 and 5),
  groups integer[] not null,
  old_expiry timestamptz not null,
  cost_units bigint not null check(cost_units between 1 and 1000000000000),
  balance_units bigint not null check(balance_units between cost_units and 1000000000000),
  plan_fingerprint text not null check(plan_fingerprint ~ '^[a-f0-9]{64}$'),
  catalog_fingerprint text not null check(catalog_fingerprint ~ '^[a-f0-9]{64}$'),
  input_hash text not null check(input_hash ~ '^[a-f0-9]{64}$'),
  approval_hash text not null unique check(approval_hash ~ '^[a-f0-9]{64}$'),
  evidence_at timestamptz not null, expires_at timestamptz not null,
  approved_at timestamptz not null default clock_timestamp()
);
create table public.ks_crm_renewal_operations (
  operation_id uuid primary key,
  approval_id uuid not null unique references public.ks_crm_renewal_approvals(approval_id),
  claim_token uuid not null default gen_random_uuid(),
  state text not null default 'reserved' check(state in
    ('reserved','dispatching','provider_verified','reconciliation_required','complete')),
  result_expiry timestamptz,
  check((state in ('provider_verified','complete')) = (result_expiry is not null))
);
create table public.ks_crm_renewal_line_versions (
  reseller_id text not null, line_id text not null, old_expiry timestamptz not null,
  operation_id uuid not null unique references public.ks_crm_renewal_operations(operation_id),
  primary key(reseller_id,line_id,old_expiry)
);
create table public.ks_crm_renewal_reseller_slots (
  reseller_id text primary key,
  operation_id uuid not null unique references public.ks_crm_renewal_operations(operation_id)
);
create table public.ks_crm_renewal_completions (
  operation_id uuid primary key references public.ks_crm_renewal_operations(operation_id),
  customer_id uuid not null references public.iptv_customers(id),
  old_expiry timestamptz not null, new_expiry timestamptz not null,
  completed_at timestamptz not null default clock_timestamp()
);
create index ks_crm_renewal_approver_idx on public.ks_crm_renewal_approvals(approver_id);
create index ks_crm_renewal_customer_idx on public.ks_crm_renewal_approvals(customer_id);
create index ks_crm_renewal_completion_customer_idx on public.ks_crm_renewal_completions(customer_id);
alter table public.ks_crm_renewal_approvals enable row level security;
alter table public.ks_crm_renewal_operations enable row level security;
alter table public.ks_crm_renewal_line_versions enable row level security;
alter table public.ks_crm_renewal_reseller_slots enable row level security;
alter table public.ks_crm_renewal_completions enable row level security;
revoke all on public.ks_crm_renewal_approvals,public.ks_crm_renewal_operations,
  public.ks_crm_renewal_line_versions,public.ks_crm_renewal_reseller_slots,
  public.ks_crm_renewal_completions from public,anon,authenticated,service_role;
grant select,insert on public.ks_crm_renewal_approvals,public.ks_crm_renewal_operations,
  public.ks_crm_renewal_line_versions,public.ks_crm_renewal_reseller_slots,
  public.ks_crm_renewal_completions to service_role;
grant update(state,result_expiry) on public.ks_crm_renewal_operations to service_role;
grant delete on public.ks_crm_renewal_reseller_slots to service_role;
grant update(expiration_at) on public.iptv_customers to service_role;

-- Coordinate with the existing physical-reseller exclusion. No second lock namespace.
create or replace function public.ks_guard_reseller_reservation_exclusion()
returns trigger language plpgsql volatile security invoker set search_path='' as $$
begin
  if tg_table_schema<>'public' or tg_table_name not in
    ('ks_preview_reseller_dispatches','ks_setup_review_reseller_slots','ks_crm_renewal_reseller_slots')
    then raise exception 'unsupported_reseller_reservation_table'; end if;
  if tg_op<>'INSERT' then raise exception 'reseller_reservation_is_immutable'; end if;
  if new.reseller_id is null or new.reseller_id !~ '^[1-9][0-9]{0,14}$'
    then raise exception 'canonical_reseller_reservation_required'; end if;
  if current_setting('transaction_isolation')<>'read committed'
    then raise exception 'reseller_reservation_requires_read_committed'; end if;
  if not pg_try_advisory_xact_lock(hashtextextended('ks-reseller-reservation/v1:'||new.reseller_id,0))
    then raise exception 'reseller_reservation_busy'; end if;
  if (tg_table_name<>'ks_preview_reseller_dispatches' and exists(
      select 1 from public.ks_preview_reseller_dispatches where reseller_id=new.reseller_id))
    or (tg_table_name<>'ks_setup_review_reseller_slots' and exists(
      select 1 from public.ks_setup_review_reseller_slots where reseller_id=new.reseller_id))
    or (tg_table_name<>'ks_crm_renewal_reseller_slots' and exists(
      select 1 from public.ks_crm_renewal_reseller_slots where reseller_id=new.reseller_id))
    then raise exception 'reseller_reserved_for_other_work'; end if;
  return new;
end; $$;
create trigger ks_reseller_reservation_exclusion before insert or update
on public.ks_crm_renewal_reseller_slots for each row
execute function public.ks_guard_reseller_reservation_exclusion();

create function public.ks_crm_renewal_immutable() returns trigger
language plpgsql security invoker set search_path='' as $$
begin raise exception 'renewal_evidence_is_immutable'; end; $$;
create trigger ks_crm_renewal_approval_immutable before update or delete
on public.ks_crm_renewal_approvals for each row execute function public.ks_crm_renewal_immutable();
create trigger ks_crm_renewal_version_immutable before update or delete
on public.ks_crm_renewal_line_versions for each row execute function public.ks_crm_renewal_immutable();
create trigger ks_crm_renewal_completion_immutable before update or delete
on public.ks_crm_renewal_completions for each row execute function public.ks_crm_renewal_immutable();

create function public.ks_crm_reserve_renewal(p_operation uuid,p_approval uuid,p_approver uuid,
  p_plan jsonb,p_expires timestamptz,p_approval_hash text) returns jsonb
language plpgsql volatile security invoker set search_path='' as $$
declare a public.ks_crm_renewal_approvals%rowtype;
  o public.ks_crm_renewal_operations%rowtype; input_hash text; selection integer[];
begin
  if p_plan is null or jsonb_typeof(p_plan)<>'object' or p_plan - array[
    'version','kind','executionEnabled','customerId','lineId','username','resellerId','packageId',
    'months','connections','previousExpiresAt','bouquetIds','catalogFingerprint','costUnits',
    'balanceUnits','checkedAt','fingerprint'] <> '{}'::jsonb
    or p_plan->>'version' is distinct from '1' or p_plan->>'kind' is distinct from 'simulation_only'
    or p_plan->'executionEnabled' is distinct from 'false'::jsonb
    then raise exception 'offline_renewal_plan_required'; end if;
  input_hash:=encode(sha256(convert_to(p_plan::text,'UTF8')),'hex');
  select * into o from public.ks_crm_renewal_operations where operation_id=p_operation;
  if found then
    select * into strict a from public.ks_crm_renewal_approvals where approval_id=o.approval_id;
    if (a.approval_id,a.approver_id,a.input_hash,a.expires_at,a.approval_hash)
      is distinct from (p_approval,p_approver,input_hash,p_expires,p_approval_hash)
      then raise exception 'renewal_operation_binding_changed'; end if;
    return jsonb_build_object('claimToken',o.claim_token,'state',o.state,'replayed',true,'may_dispatch',false);
  end if;
  if p_operation is null or p_approval is null or p_approver is null
    or (p_plan->>'checkedAt')::timestamptz is null
    or (p_plan->>'checkedAt')::timestamptz>clock_timestamp()
    or (p_plan->>'checkedAt')::timestamptz<clock_timestamp()-interval '30 seconds'
    or p_expires is null or p_expires<=clock_timestamp()
    or p_expires>(p_plan->>'checkedAt')::timestamptz+interval '60 seconds'
    or (p_plan->>'previousExpiresAt')::timestamptz<=clock_timestamp()
    or date_trunc('second',(p_plan->>'previousExpiresAt')::timestamptz)
      is distinct from (p_plan->>'previousExpiresAt')::timestamptz
    then raise exception 'fresh_renewal_approval_required'; end if;
  select array_agg(value::integer order by ordinality) into selection
    from jsonb_array_elements_text(p_plan->'bouquetIds') with ordinality;
  if cardinality(selection) is null or cardinality(selection) not between 1 and 2000
    or exists(select 1 from jsonb_array_elements(p_plan->'bouquetIds') g where jsonb_typeof(g)<>'number')
    or exists(select 1 from unnest(selection) g where g is null or g<=0)
    or selection is distinct from (select array_agg(distinct g order by g) from unnest(selection) g)
    then raise exception 'canonical_renewal_selection_required'; end if;
  if not exists(select 1 from public.iptv_customers where id=(p_plan->>'customerId')::uuid
    and external_id::text=p_plan->>'lineId' and username=p_plan->>'username'
    and expiration_at=(p_plan->>'previousExpiresAt')::timestamptz)
    then raise exception 'renewal_crm_identity_changed'; end if;
  insert into public.ks_crm_renewal_approvals(approval_id,operation_id,approver_id,customer_id,
    line_id,username,reseller_id,package_id,months,connections,groups,old_expiry,cost_units,
    balance_units,plan_fingerprint,catalog_fingerprint,input_hash,approval_hash,evidence_at,expires_at)
  values(p_approval,p_operation,p_approver,(p_plan->>'customerId')::uuid,p_plan->>'lineId',
    p_plan->>'username',p_plan->>'resellerId',p_plan->>'packageId',(p_plan->>'months')::integer,
    (p_plan->>'connections')::integer,selection,(p_plan->>'previousExpiresAt')::timestamptz,
    (p_plan->>'costUnits')::bigint,(p_plan->>'balanceUnits')::bigint,p_plan->>'fingerprint',
    p_plan->>'catalogFingerprint',input_hash,p_approval_hash,(p_plan->>'checkedAt')::timestamptz,p_expires);
  insert into public.ks_crm_renewal_operations(operation_id,approval_id)
    values(p_operation,p_approval) returning * into o;
  return jsonb_build_object('claimToken',o.claim_token,'state',o.state,'replayed',false,'may_dispatch',false);
end; $$;

create function public.ks_crm_begin_renewal(p_operation uuid,p_claim uuid) returns boolean
language plpgsql volatile security invoker set search_path='' as $$
declare o public.ks_crm_renewal_operations%rowtype; a public.ks_crm_renewal_approvals%rowtype; n integer;
begin
  perform public.ks_crm_assert_renewal_execution();
  if current_setting('transaction_isolation')<>'read committed' then raise exception 'renewal_read_committed_required'; end if;
  select * into o from public.ks_crm_renewal_operations where operation_id=p_operation for update;
  if not found or o.claim_token is distinct from p_claim then raise exception 'renewal_claim_required'; end if;
  if o.state<>'reserved' then return false; end if;
  select * into strict a from public.ks_crm_renewal_approvals where approval_id=o.approval_id;
  if a.expires_at<=clock_timestamp() or a.evidence_at>clock_timestamp()
    or a.evidence_at<clock_timestamp()-interval '30 seconds' or a.old_expiry<=clock_timestamp()
    then raise exception 'fresh_renewal_approval_required'; end if;
  perform 1 from public.iptv_customers where id=a.customer_id and external_id::text=a.line_id
    and username=a.username and expiration_at=a.old_expiry for update;
  if not found then raise exception 'renewal_crm_identity_changed'; end if;
  insert into public.ks_crm_renewal_line_versions values(a.reseller_id,a.line_id,a.old_expiry,p_operation)
    on conflict do nothing;
  get diagnostics n=row_count;
  if n<>1 then return false; end if;
  insert into public.ks_crm_renewal_reseller_slots values(a.reseller_id,p_operation);
  update public.ks_crm_renewal_operations set state='dispatching' where operation_id=p_operation;
  return true; -- Requires owner-enabled execution; installation leaves it disabled.
end; $$;

create function public.ks_crm_renewal_fresh_commit() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if new.state='dispatching' and not exists(select 1 from public.ks_crm_renewal_approvals a
    where a.approval_id=new.approval_id and a.expires_at>clock_timestamp()
    and a.evidence_at between clock_timestamp()-interval '30 seconds' and clock_timestamp()
    and a.old_expiry>clock_timestamp()) then raise exception 'fresh_renewal_approval_required'; end if;
  return null;
end; $$;
create constraint trigger ks_crm_renewal_fresh_commit after update on public.ks_crm_renewal_operations
deferrable initially deferred for each row execute function public.ks_crm_renewal_fresh_commit();

create function public.ks_crm_verify_renewal(p_operation uuid,p_claim uuid,p_result jsonb,
  p_returned_expiry timestamptz,p_balance bigint) returns boolean
language plpgsql security invoker set search_path='' as $$
declare o public.ks_crm_renewal_operations%rowtype; a public.ks_crm_renewal_approvals%rowtype; expiry timestamptz;
begin
  perform public.ks_crm_assert_renewal_execution();
  select * into o from public.ks_crm_renewal_operations where operation_id=p_operation for update;
  if not found or o.claim_token is distinct from p_claim then raise exception 'renewal_claim_required'; end if;
  select * into strict a from public.ks_crm_renewal_approvals where approval_id=o.approval_id;
  expiry:=(p_result->>'expiresAt')::timestamptz;
  if p_result is null or p_result-'expiresAt' is distinct from jsonb_build_object(
    'customerId',a.customer_id::text,'lineId',a.line_id,'username',a.username,'resellerId',a.reseller_id,
    'packageId',a.package_id,'connections',a.connections,'bouquetIds',to_jsonb(a.groups),
    'enabled',true,'adminEnabled',true,'trial',false)
    or expiry is null or expiry is distinct from p_returned_expiry or expiry<=clock_timestamp()
    or expiry<a.old_expiry+a.months*interval '27 days' or expiry>a.old_expiry+a.months*interval '32 days'
    or p_balance is distinct from a.balance_units-a.cost_units
    then raise exception 'renewal_result_requires_reconciliation'; end if;
  if o.state='provider_verified' and o.result_expiry=expiry then return false; end if;
  if o.state<>'dispatching' then raise exception 'renewal_dispatch_required'; end if;
  if not exists(select 1 from public.ks_crm_renewal_reseller_slots where operation_id=p_operation)
    then raise exception 'renewal_reservation_required'; end if;
  update public.ks_crm_renewal_operations set state='provider_verified',result_expiry=expiry where operation_id=p_operation;
  return true;
end; $$;

create function public.ks_crm_stop_renewal(p_operation uuid,p_claim uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
  perform 1 from public.ks_crm_renewal_operations where operation_id=p_operation and claim_token=p_claim for update;
  if not found then raise exception 'renewal_claim_required'; end if;
  update public.ks_crm_renewal_operations set state='reconciliation_required'
    where operation_id=p_operation and state in ('reserved','dispatching');
  -- No reset, resend, slot release or automatic reconciliation is provided.
end; $$;

create function public.ks_crm_renewal_release() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.ks_crm_renewal_operations o
    join public.ks_crm_renewal_completions c using(operation_id)
    where o.operation_id=old.operation_id and o.state='complete')
    then raise exception 'unresolved_renewal_remains_locked'; end if;
  return old;
end; $$;
create trigger ks_crm_renewal_release before delete on public.ks_crm_renewal_reseller_slots
for each row execute function public.ks_crm_renewal_release();

create function public.ks_crm_complete_renewal(p_operation uuid,p_claim uuid,p_current_expiry timestamptz)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.ks_crm_renewal_operations%rowtype; a public.ks_crm_renewal_approvals%rowtype; n integer;
begin
  perform public.ks_crm_assert_renewal_execution();
  select * into o from public.ks_crm_renewal_operations where operation_id=p_operation for update;
  if not found or o.claim_token is distinct from p_claim then raise exception 'renewal_claim_required'; end if;
  select * into strict a from public.ks_crm_renewal_approvals where approval_id=o.approval_id;
  if o.state='complete' then
    return jsonb_build_object('state','complete','replayed',true,'may_dispatch',false);
  end if;
  if o.state<>'provider_verified' or p_current_expiry is distinct from o.result_expiry
    or p_current_expiry<=clock_timestamp() then raise exception 'verified_current_renewal_required'; end if;
  update public.iptv_customers set expiration_at=o.result_expiry where id=a.customer_id
    and external_id::text=a.line_id and username=a.username and expiration_at=a.old_expiry;
  get diagnostics n=row_count;
  if n<>1 then raise exception 'renewal_crm_identity_changed'; end if;
  insert into public.ks_crm_renewal_completions(operation_id,customer_id,old_expiry,new_expiry)
    values(p_operation,a.customer_id,a.old_expiry,o.result_expiry);
  update public.ks_crm_renewal_operations set state='complete' where operation_id=p_operation;
  delete from public.ks_crm_renewal_reseller_slots where operation_id=p_operation;
  return jsonb_build_object('state','complete','replayed',false,'may_dispatch',false);
end; $$;

-- Invoker functions, empty search path, service-only execution. No browser role.
do $grants$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'ks_crm_%renewal%'
  loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $grants$;
commit;
