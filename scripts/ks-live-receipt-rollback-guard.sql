-- STAGED ONLY. Apply as a new reviewed migration before enabling the live
-- receipt-only rollout. Never rerun the installed receipt/queue foundation.
begin;
create function public.ks_guard_receipt_only_activation()
returns trigger language plpgsql security invoker set search_path = '' as $guard$
begin
  if old.livemode and
    (new.activated,new.expires_at) is distinct from (old.activated,old.expires_at)
    and exists(select 1 from public.ks_setup_order_queue q
      where q.checkout_session_id=old.checkout_session_id and q.livemode) then
    -- The old recorder updates profiles before receipts in one transaction.
    -- Rejecting its receipt update also rolls back its profile mutation.
    raise exception 'receipt_only_order_cannot_use_legacy_activation';
  end if;
  return new;
end;
$guard$;
revoke all on function public.ks_guard_receipt_only_activation() from public,anon,authenticated;
grant execute on function public.ks_guard_receipt_only_activation() to service_role;
create trigger ks_receipt_only_activation_guard before update on public.ks_payment_receipts
  for each row execute function public.ks_guard_receipt_only_activation();
commit;
