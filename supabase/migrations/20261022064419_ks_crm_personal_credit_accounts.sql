-- Personal accounts use provider credits; they are not customer sales.
-- Retain verified service, renewal receipts and all execution controls.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $preflight$ begin
  lock table public.ks_crm_renewal_control,public.ks_crm_live_renewal_control,
    public.ks_crm_order_renewal_control in share row exclusive mode;
  if exists(select 1 from public.ks_crm_renewal_control where execution_enabled)
    or exists(select 1 from public.ks_crm_live_renewal_control where execution_enabled)
    or exists(select 1 from public.ks_crm_order_renewal_control where execution_enabled)
    then raise exception 'renewal_controls_must_be_off'; end if;
  if not exists(select 1 from pg_proc where oid='public.ks_crm_sync_completed_renewal_pricing()'::regprocedure
    and not prosecdef and proconfig @> array['search_path=""']
    and encode(sha256(convert_to(prosrc,'UTF8')),'hex')='f0a86a00b27a9925d910d7445d48eab35d9f1109693d709805bc57c0812ebfa5')
    then raise exception 'reviewed_retail_completion_required'; end if;
end $preflight$;
create or replace function public.ks_crm_sync_completed_renewal_pricing()
returns trigger language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
  if tg_table_schema<>'public' or tg_table_name not in
    ('ks_crm_order_renewal_completions','ks_crm_live_renewal_completions') or tg_op<>'INSERT'
    then raise exception 'verified_renewal_completion_required'; end if;
  update public.iptv_customers set renewal_at=new.new_expiry,
    monthly_price=case when payment_status='personal' then 0
      else coalesce(public.ks_crm_retail_monthly_price(package_name,connections_allowed),monthly_price) end
    where id=new.customer_id and expiration_at=new.new_expiry
      and not coalesce(trial,false) and coalesce(payment_status,'') not in ('trial','preview_test')
      and coalesce(source,'') not in ('roomba_preview_trial','roomba_preview_paid');
  get diagnostics n=row_count;
  if n<>1 then raise exception 'renewal_billing_customer_mismatch'; end if;
  return new;
end;
$$;
revoke all on function public.ks_crm_sync_completed_renewal_pricing() from public,anon,authenticated;
grant execute on function public.ks_crm_sync_completed_renewal_pricing() to service_role;
grant update(monthly_price,renewal_at) on public.iptv_customers to service_role;
commit;
