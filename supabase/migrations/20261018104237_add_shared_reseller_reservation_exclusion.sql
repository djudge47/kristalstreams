-- Shared exclusion only: grants no dispatch permission and seeds no work.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

-- Prevent a writer from slipping between the preflight and trigger creation.
lock table public.ks_preview_reseller_dispatches,
  public.ks_setup_review_reseller_slots in share row exclusive mode;
do $preflight$
begin
  if exists(select 1 from public.ks_preview_reseller_dispatches a
    join public.ks_setup_review_reseller_slots b using(reseller_id)) then
    raise exception 'existing_reseller_reservations_require_reconciliation';
  end if;
  if exists(select 1 from public.ks_preview_reseller_dispatches
      where reseller_id !~ '^[1-9][0-9]{0,14}$')
    or exists(select 1 from public.ks_setup_review_reseller_slots
      where reseller_id !~ '^[1-9][0-9]{0,14}$') then
    raise exception 'canonical_reseller_reservation_required';
  end if;
end;
$preflight$;

create function public.ks_guard_reseller_reservation_exclusion()
returns trigger language plpgsql volatile security invoker set search_path=''
as $guard$
begin
  if tg_table_schema<>'public' or tg_table_name not in
    ('ks_preview_reseller_dispatches','ks_setup_review_reseller_slots') then
    raise exception 'unsupported_reseller_reservation_table';
  end if;
  if tg_op<>'INSERT' then raise exception 'reseller_reservation_is_immutable'; end if;
  if new.reseller_id is null or new.reseller_id !~ '^[1-9][0-9]{0,14}$' then
    raise exception 'canonical_reseller_reservation_required';
  end if;
  -- A fixed transaction snapshot could miss a reservation committed since
  -- transaction start. Do not silently run this protocol at another isolation.
  if pg_catalog.current_setting('transaction_isolation')<>'read committed' then
    raise exception 'reseller_reservation_requires_read_committed';
  end if;
  -- Both tables use the same physical-reseller key, across owners, policies,
  -- days and environments. Contention fails closed instead of waiting while
  -- holding the caller's receipt/profile/attempt row locks.
  if not pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtextextended(
    'ks-reseller-reservation/v1:' || new.reseller_id,0)) then
    raise exception 'reseller_reservation_busy';
  end if;
  -- Keep this SELECT separate from lock acquisition. VOLATILE + READ COMMITTED
  -- supplies a fresh snapshot, including the preceding lock owner's commit.
  if tg_table_name='ks_preview_reseller_dispatches' then
    if exists(select 1 from public.ks_setup_review_reseller_slots
      where reseller_id=new.reseller_id) then
      raise exception 'reseller_reserved_for_setup_review';
    end if;
  else
    if exists(select 1 from public.ks_preview_reseller_dispatches
      where reseller_id=new.reseller_id) then
      raise exception 'reseller_reserved_for_preview_dispatch';
    end if;
  end if;
  return new;
end;
$guard$;
revoke all on function public.ks_guard_reseller_reservation_exclusion()
  from public,anon,authenticated;
grant execute on function public.ks_guard_reseller_reservation_exclusion() to service_role;

create trigger ks_reseller_reservation_exclusion
before insert or update on public.ks_preview_reseller_dispatches
for each row execute function public.ks_guard_reseller_reservation_exclusion();
create trigger ks_reseller_reservation_exclusion
before insert or update on public.ks_setup_review_reseller_slots
for each row execute function public.ks_guard_reseller_reservation_exclusion();
comment on function public.ks_guard_reseller_reservation_exclusion() is
  'Shared non-waiting physical-reseller exclusion for Preview dispatch and review-only reservations. No authorization, transfer, reset or provider operation.';
commit;
