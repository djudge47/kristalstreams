-- Immutable approval of a paid-renewal quote only. No dispatch authority,
-- credit reservation, customer/receipt write, release flag or provider action.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
create table public.ks_paid_renewal_quote_approvals (
  operation_id uuid primary key references public.ks_paid_renewal_review_bindings(operation_id) on delete restrict,
  approval_id uuid not null unique default gen_random_uuid(),
  approver_id uuid not null references auth.users(id) on delete restrict,
  quote_canonical text not null check(length(quote_canonical) between 2 and 32768),
  quote_fingerprint text not null check(quote_fingerprint ~ '^[a-f0-9]{64}$'),
  cost_units bigint not null check(cost_units between 1 and 1000000000000),
  balance_units bigint not null check(balance_units between cost_units and 1000000000000),
  checked_at timestamptz not null,
  valid_until timestamptz not null,
  approved_at timestamptz not null default clock_timestamp()
);
create index ks_paid_renewal_quote_approver_idx on public.ks_paid_renewal_quote_approvals(approver_id);
alter table public.ks_paid_renewal_quote_approvals enable row level security;
revoke all on public.ks_paid_renewal_quote_approvals from public,anon,authenticated,service_role;
grant select,insert on public.ks_paid_renewal_quote_approvals to service_role;

create function public.ks_paid_renewal_quote_actor(p_actor uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from auth.users where id=p_actor and email_confirmed_at is not null
    and is_anonymous is distinct from true and lower(btrim(email))='djudge47@gmail.com') then
    raise exception 'paid_renewal_quote_admin_required'; end if;
end; $$;

create function public.ks_guard_paid_renewal_quote_approval() returns trigger
language plpgsql security invoker set search_path='' as $$
declare q jsonb; saved public.ks_paid_renewal_review_bindings%rowtype; current jsonb; b jsonb;
  expected_keys text[]:=array['purpose','reference','operationId','bindingFingerprint','resellerId','lineId','username',
    'customerId','currentPackageId','packageId','packageName','months','connections','previousExpiresAt','bouquetIds','catalogFingerprint','costUnits'];
begin
  if tg_op<>'INSERT' then raise exception 'paid_renewal_quote_is_immutable'; end if;
  perform public.ks_paid_renewal_quote_actor(new.approver_id);
  select * into saved from public.ks_paid_renewal_review_bindings where operation_id=new.operation_id;
  if not found then raise exception 'saved_paid_renewal_review_required'; end if;
  current:=public.ks_check_paid_renewal_review(saved.checkout_session_id,saved.user_id,new.operation_id);
  if current->>'state' is distinct from 'awaiting_verification' then raise exception 'paid_renewal_service_changed'; end if;
  b:=current->'binding';q:=new.quote_canonical::jsonb;
  if jsonb_typeof(q) is distinct from 'object' then raise exception 'paid_renewal_quote_invalid'; end if;
  if (select count(*) from jsonb_object_keys(q))<>cardinality(expected_keys) or not q ?& expected_keys
    or q->>'purpose' is distinct from 'paid-renewal-quote/v1'
    or q->>'reference' is distinct from saved.checkout_session_id or q->>'operationId' is distinct from new.operation_id::text
    or q->>'bindingFingerprint' is distinct from saved.fingerprint
    or q->>'customerId' is distinct from b->>'customerId' or q->>'lineId' is distinct from b->>'lineId'
    or q->>'username' is distinct from b->>'username'
    or q->>'resellerId' is null or q->>'resellerId' !~ '^[1-9][0-9]{0,14}$'
    or q->>'currentPackageId' is null or q->>'currentPackageId' !~ '^[1-9][0-9]{0,11}$'
    or q->>'packageId' is null or q->>'packageId' !~ '^[1-9][0-9]{0,11}$'
    or q->>'catalogFingerprint' is null or q->>'catalogFingerprint' !~ '^[a-f0-9]{64}$'
    or q->>'connections' is distinct from b->>'connections'
    or q->>'months' is distinct from (case b->>'tier' when 'bronze' then '1' when 'silver' then '3' when 'gold' then '6' when 'platinum' then '12' end)
    or q->>'previousExpiresAt' is null or (q->>'previousExpiresAt')::timestamptz is distinct from (b->>'currentExpiresAt')::timestamptz
    or q->>'costUnits' is distinct from new.cost_units::text
    or q->>'packageName' is null or length(q->>'packageName')>200
    or not (q->>'packageName' ~* ('^'||(q->>'months')||'\s+months?\s*\+\s*'||(q->>'connections')||'\s+connections?$'))
    or jsonb_typeof(q->'bouquetIds') is distinct from 'array'
    or new.quote_fingerprint is distinct from encode(sha256(convert_to(new.quote_canonical,'UTF8')),'hex') then
    raise exception 'paid_renewal_quote_invalid'; end if;
  if jsonb_array_length(q->'bouquetIds') not between 1 and 2000
    or exists(select 1 from jsonb_array_elements(q->'bouquetIds') v
      where jsonb_typeof(v) is distinct from 'number' or v::text !~ '^[1-9][0-9]{0,9}$') then
    raise exception 'paid_renewal_quote_groups_invalid'; end if;
  if exists(select 1 from (select v::bigint as n,lag(v::bigint) over(order by ord) as previous
      from jsonb_array_elements_text(q->'bouquetIds') with ordinality as t(v,ord)) g
      where n>2147483647 or n<=previous) then raise exception 'paid_renewal_quote_groups_invalid'; end if;
  if new.checked_at is null or new.checked_at>clock_timestamp() or new.checked_at+interval '30 seconds'<=clock_timestamp()
    then raise exception 'paid_renewal_quote_expired'; end if;
  new.approved_at:=clock_timestamp();new.valid_until:=new.checked_at+interval '30 seconds';return new;
end; $$;
create trigger ks_paid_renewal_quote_approval_guard before insert or update or delete on public.ks_paid_renewal_quote_approvals
  for each row execute function public.ks_guard_paid_renewal_quote_approval();

create function public.ks_lookup_paid_renewal_quote_approval(p_session text,p_user uuid,p_operation uuid,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare current jsonb; saved public.ks_paid_renewal_quote_approvals%rowtype; reason text:='quote_current';
begin
  perform public.ks_paid_renewal_quote_actor(p_actor);
  current:=public.ks_check_paid_renewal_review(p_session,p_user,p_operation);
  select * into saved from public.ks_paid_renewal_quote_approvals where operation_id=p_operation;
  if not found then return null; end if;
  if saved.approver_id is distinct from p_actor then raise exception 'paid_renewal_quote_actor_changed'; end if;
  if current->>'state' is distinct from 'awaiting_verification' then reason:='service_changed';
  elsif saved.valid_until<=clock_timestamp() then reason:='quote_expired'; end if;
  return jsonb_build_object('reference',p_session,'operationId',p_operation,'approvalId',saved.approval_id,
    'state',case when reason='quote_current' then 'approval_saved' else 'review_required' end,'reason',reason,
    'quoteFingerprint',saved.quote_fingerprint,'costUnits',saved.cost_units::text,
    'approvedAt',saved.approved_at,'validUntil',saved.valid_until,'approvalSaved',true,'replayed',true,
    'mayDispatch',false,'providerActivated',false);
end; $$;

create function public.ks_save_paid_renewal_quote_approval(p_session text,p_user uuid,p_operation uuid,p_actor uuid,
  p_canonical text,p_fingerprint text,p_cost bigint,p_balance bigint,p_checked timestamptz)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare prior jsonb;
begin
  if current_setting('transaction_isolation')<>'read committed' then raise exception 'paid_renewal_quote_requires_read_committed'; end if;
  perform pg_advisory_xact_lock(hashtextextended('ks-paid-renewal-quote/v1:'||coalesce(p_operation::text,''),0));
  prior:=public.ks_lookup_paid_renewal_quote_approval(p_session,p_user,p_operation,p_actor);
  if prior is not null then
    if prior->>'quoteFingerprint' is distinct from p_fingerprint or prior->>'costUnits' is distinct from p_cost::text
      or not exists(select 1 from public.ks_paid_renewal_quote_approvals where operation_id=p_operation and quote_canonical=p_canonical)
      then raise exception 'paid_renewal_quote_approval_conflict'; end if;
    return prior;
  end if;
  insert into public.ks_paid_renewal_quote_approvals(operation_id,approver_id,quote_canonical,quote_fingerprint,cost_units,balance_units,checked_at,valid_until)
    values(p_operation,p_actor,p_canonical,p_fingerprint,p_cost,p_balance,p_checked,p_checked+interval '30 seconds');
  return public.ks_lookup_paid_renewal_quote_approval(p_session,p_user,p_operation,p_actor)||jsonb_build_object('replayed',false);
end; $$;
revoke all on function public.ks_paid_renewal_quote_actor(uuid),public.ks_guard_paid_renewal_quote_approval(),
  public.ks_lookup_paid_renewal_quote_approval(text,uuid,uuid,uuid),
  public.ks_save_paid_renewal_quote_approval(text,uuid,uuid,uuid,text,text,bigint,bigint,timestamptz) from public,anon,authenticated;
grant execute on function public.ks_paid_renewal_quote_actor(uuid),public.ks_guard_paid_renewal_quote_approval(),
  public.ks_lookup_paid_renewal_quote_approval(text,uuid,uuid,uuid),
  public.ks_save_paid_renewal_quote_approval(text,uuid,uuid,uuid,text,text,bigint,bigint,timestamptz) to service_role;
commit;
