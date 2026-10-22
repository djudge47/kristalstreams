-- Customer retail prices, not provider credits or evidence of payment.
-- No customer data is changed by this installation. Purchase controls stay off.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $preflight$ begin
  lock table public.ks_crm_renewal_control,public.ks_crm_live_renewal_control,
    public.ks_crm_order_renewal_control,public.iptv_customers in share row exclusive mode;
  if not exists(select 1 from public.ks_crm_renewal_control where singleton and not execution_enabled)
    or not exists(select 1 from public.ks_crm_live_renewal_control where singleton and not execution_enabled)
    or not exists(select 1 from public.ks_crm_order_renewal_control where singleton and not execution_enabled)
    then raise exception 'renewal_controls_must_be_off'; end if;
  if to_regprocedure('public.ks_crm_retail_monthly_price(text,integer)') is not null
    then raise exception 'renewal_retail_pricing_already_installed'; end if;
end $preflight$;

-- Snapshot of _shared/ks-retail-pricing.js; parity is checked for all 20 plans.
create function public.ks_crm_retail_monthly_price(p_package text,p_connections integer)
returns numeric language sql immutable strict security invoker set search_path='' as $$
  select round(c.cents::numeric / (100*c.months),2)
  from (values
    (1,1,2000),
    (1,2,3500),
    (1,3,5000),
    (1,4,6500),
    (1,5,8000),
    (3,1,4500),
    (3,2,7500),
    (3,3,11000),
    (3,4,14000),
    (3,5,17500),
    (6,1,6000),
    (6,2,10500),
    (6,3,15000),
    (6,4,19500),
    (6,5,24000),
    (12,1,9500),
    (12,2,16500),
    (12,3,23500),
    (12,4,30500),
    (12,5,37500)
  ) c(months,connections,cents),
  lateral (select regexp_match(p_package,'^(1|3|6|12) months? \+ ([1-5]) connections?$','i') as parts) parsed
  where c.months=(parsed.parts)[1]::integer and c.connections=(parsed.parts)[2]::integer
    and c.connections=p_connections;
$$;
revoke all on function public.ks_crm_retail_monthly_price(text,integer) from public,anon,authenticated;
grant execute on function public.ks_crm_retail_monthly_price(text,integer) to service_role;

-- Completion is inserted inside the existing verified renewal transaction.
-- These fields roll back with completion if any identity or persistence check fails.
create function public.ks_crm_sync_completed_renewal_pricing()
returns trigger language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
  if tg_table_schema<>'public' or tg_table_name not in
    ('ks_crm_order_renewal_completions','ks_crm_live_renewal_completions') or tg_op<>'INSERT'
    then raise exception 'verified_renewal_completion_required'; end if;
  update public.iptv_customers set renewal_at=new.new_expiry,
    monthly_price=coalesce(public.ks_crm_retail_monthly_price(package_name,connections_allowed),monthly_price)
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
create trigger ks_sync_renewal_retail_pricing after insert on public.ks_crm_order_renewal_completions
  for each row execute function public.ks_crm_sync_completed_renewal_pricing();
create trigger ks_sync_renewal_retail_pricing after insert on public.ks_crm_live_renewal_completions
  for each row execute function public.ks_crm_sync_completed_renewal_pricing();
commit;
