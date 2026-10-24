-- Run only after the owner confirms XUI activation was the old payment record.
-- Replace the two controlled placeholders with a validated applied batch UUID and count.
-- This is an operational transaction, not a schema migration or provider action.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
lock table public.ks_crm_order_renewal_control,public.ks_crm_renewal_control,
 public.ks_crm_live_renewal_control in share row exclusive mode;
lock table public.iptv_customers,public.iptv_payments,public.iptv_customer_activity in share row exclusive mode;
create temporary table ks_legacy_input on commit drop as
 select '__APPLIED_BATCH_UUID__'::uuid as batch_id, __EXPECTED_COUNT__::integer as expected_count;
create temporary table ks_legacy_targets on commit drop as
 select c.id,c.payment_status from public.iptv_customers c
 join public.ks_crm_service_sync_items i on i.customer_id=c.id
 join public.ks_crm_service_sync_batches b on b.id=i.batch_id
 join ks_legacy_input x on x.batch_id=b.id
 where b.state='applied' and c.source='panel_screenshot_import' and not c.trial
 and c.payment_status in ('paid','unpaid','legacy_paid');
create temporary table ks_legacy_before on commit drop as
 select c.id,c.payment_status,c.monthly_price,c.last_payment_at,c.renewal_at,c.package_name,
 c.connections_allowed,c.expiration_at,c.account_status,c.trial,c.source,
 c.customer_name,c.email,c.phone,c.notes,c.device_notes
 from public.iptv_customers c;
create temporary table ks_legacy_payments_before on commit drop as
 select id,customer_id,amount,payment_method,payment_status,paid_at,period_start,period_end from public.iptv_payments;
do $confirm$
declare expected integer; n integer;
begin
 select expected_count into expected from ks_legacy_input;
 if expected is null or expected not between 1 and 200 or (select count(*) from ks_legacy_targets)<>expected
   then raise exception 'legacy_manifest_changed'; end if;
 if exists(select 1 from public.ks_crm_order_renewal_control where execution_enabled)
  or exists(select 1 from public.ks_crm_renewal_control where execution_enabled)
  or exists(select 1 from public.ks_crm_live_renewal_control where execution_enabled)
   then raise exception 'renewal_controls_must_be_off'; end if;
 if exists(select 1 from public.iptv_customers c join ks_legacy_targets t on t.id=c.id
   where c.monthly_price is distinct from 0::numeric or exists(
     select 1 from public.iptv_payments p where p.customer_id=c.id and p.amount is distinct from 0::numeric))
   then raise exception 'actual_payment_or_rate_requires_review'; end if;
 update public.iptv_customers c set payment_status='legacy_paid'
 from ks_legacy_targets t where c.id=t.id and t.payment_status<>'legacy_paid';
 get diagnostics n=row_count;
 if n<>(select count(*) from ks_legacy_targets where payment_status<>'legacy_paid')
   then raise exception 'legacy_update_conflict'; end if;
 insert into public.iptv_customer_activity(customer_id,activity_type,title,details)
 select t.id,'legacy_payment_confirmation','Paid under old pricing — owner confirmed',
  'Owner confirmed that XUI activation was the record of payment for the imported service term. Historical payment amount and date are unknown. Confirmation time is not a payment date. New website pricing applies at next renewal. No receipt, charge, provider renewal or credit spend was created.'
 from ks_legacy_targets t where t.payment_status<>'legacy_paid';
 -- Only classification and the normal updated_at trigger may change.
 if exists(select id,monthly_price,last_payment_at,renewal_at,package_name,connections_allowed,expiration_at,account_status,trial,source,customer_name,email,phone,notes,device_notes from ks_legacy_before
    except select id,monthly_price,last_payment_at,renewal_at,package_name,connections_allowed,expiration_at,account_status,trial,source,customer_name,email,phone,notes,device_notes from public.iptv_customers)
   or exists(select id,payment_status from ks_legacy_before where id not in (select id from ks_legacy_targets)
    except select id,payment_status from public.iptv_customers where id not in (select id from ks_legacy_targets))
 then raise exception 'unrelated_customer_field_changed'; end if;
 if exists((select * from ks_legacy_payments_before except select id,customer_id,amount,payment_method,payment_status,paid_at,period_start,period_end from public.iptv_payments)
   union all (select id,customer_id,amount,payment_method,payment_status,paid_at,period_start,period_end from public.iptv_payments except select * from ks_legacy_payments_before))
   then raise exception 'payment_history_must_not_change'; end if;
end $confirm$;
commit;
