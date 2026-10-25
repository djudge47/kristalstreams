-- Private read projection only. Preserve the legacy UUID-cursor RPC and all
-- payment/customer records. No financial backfill, entitlement or provider write.
begin;
set local lock_timeout='5s';set local statement_timeout='30s';
create function public.ks_client_crm_snapshot_v2(p_user uuid,p_email text,p_before_at timestamptz default null,p_before_id text default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
  if p_user is null or p_email is null or length(p_email)>254 or p_email<>lower(btrim(p_email))
    or ((p_before_at is null)<>(p_before_id is null))
    or (p_before_id is not null and (length(p_before_id)>200 or p_before_id !~ '^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|cs_live_[A-Za-z0-9]+)$'))
    then raise exception 'customer_payment_page_invalid';end if;
  with owned as materialized (
    select c.id,c.external_id,c.username,c.customer_name,c.package_name,c.connections_allowed,c.expiration_at,c.account_status,c.payment_status,c.updated_at
    from public.ks_crm_portal_links l join auth.users u on u.id=l.user_id
    join public.iptv_customers c on c.id=l.customer_id and c.external_id=l.external_id
    where l.user_id=p_user and l.email_at_link=p_email and lower(btrim(u.email))=p_email
      and u.email_confirmed_at=l.confirmed_at_link and u.email_confirmed_at is not null and u.is_anonymous is not true
      and coalesce(c.source,'') not like 'roomba_preview%' and c.payment_status is distinct from 'preview_test'
  ), manual as materialized (
    select p.id::text collate "C" id,p.customer_id,(p.amount*100)::bigint cents,p.payment_method method,p.paid_at,r.months,r.connections,
      'manual'::text source,null::timestamptz completed_at,null::timestamptz renewed_expiry
    from public.iptv_payments p join owned v on v.id=p.customer_id
    left join public.ks_crm_renewal_payments r on r.payment_id=p.id and r.customer_id=p.customer_id and r.amount_cents=p.amount*100 and r.paid_at=p.paid_at
    where p.payment_status='paid' and p.amount>0
      and (p_before_at is null or (p.paid_at,p.id::text collate "C")<(p_before_at,p_before_id collate "C"))
    order by p.paid_at desc,p.id::text collate "C" desc limit 21
  ), website as materialized (
    select c.checkout_session_id collate "C" id,c.customer_id,r.amount_cents::bigint cents,'stripe_checkout'::text method,r.recorded_at paid_at,
      case r.tier when 'bronze' then 1 when 'silver' then 3 when 'gold' then 6 when 'platinum' then 12 end months,r.connections,
      'website_checkout'::text source,c.completed_at,c.new_expiry renewed_expiry
    from public.ks_paid_renewal_completions c join owned v on v.id=c.customer_id
    join public.ks_payment_receipts r on r.checkout_session_id=c.checkout_session_id and r.user_id=c.user_id
    join public.ks_setup_order_queue q on q.checkout_session_id=c.checkout_session_id and q.user_id=c.user_id
    join public.ks_paid_renewal_provider_proofs p on p.operation_id=c.operation_id and p.result_expiry=c.new_expiry
    join public.ks_paid_renewal_expectations e on e.operation_id=p.operation_id
    join public.ks_paid_renewal_send_operations o on o.operation_id=c.operation_id and o.state='complete' and o.result_expiry=c.new_expiry
    join public.ks_paid_renewal_review_bindings b on b.operation_id=c.operation_id and b.user_id=c.user_id
      and b.checkout_session_id=c.checkout_session_id and b.customer_id=c.customer_id
    where c.user_id=p_user and v.external_id::text=b.binding->>'lineId' and v.username=b.binding->>'username'
      and c.checkout_session_id ~ '^cs_live_[A-Za-z0-9]+$' and length(c.checkout_session_id)<=200
      and r.livemode and not r.activated and r.expires_at is null and q.livemode and q.fulfillment_status='setup_complete'
      and r.connections=c.connections and r.currency='usd' and r.recorded_at<=c.completed_at and c.new_expiry>c.completed_at and c.completed_at<=now()
      and (p_before_at is null or (r.recorded_at,c.checkout_session_id collate "C")<(p_before_at,p_before_id collate "C"))
      -- A same-owner, same-amount received receipt with the exact Stripe
      -- reference is already represented in manual history; never count twice.
      and not exists(select 1 from public.iptv_payments existing where existing.customer_id=c.customer_id and existing.payment_status='paid'
        and existing.amount*100=r.amount_cents and existing.reference in (r.checkout_session_id,r.payment_intent_id))
    order by r.recorded_at desc,c.checkout_session_id collate "C" desc limit 21
  ), page as materialized (
    select * from (select * from manual union all select * from website) combined
    order by paid_at desc,id collate "C" desc limit 21
  ) select jsonb_build_object('accountId',p_user,'checkedAt',now(),
    'services',coalesce((select jsonb_agg(jsonb_build_object('customerId',id,'username',username,'name',customer_name,'packageName',package_name,
      'connections',connections_allowed,'expiresAt',expiration_at,'savedStatus',account_status,'legacyPaid',coalesce(payment_status='legacy_paid',false),'updatedAt',updated_at) order by id) from owned),'[]'::jsonb),
    'payments',coalesce((select jsonb_agg(jsonb_build_object('id',id,'customerId',customer_id,'amountCents',cents,'method',method,
      'paidAt',to_char(paid_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'months',months,'connections',connections)
      ||case when source='website_checkout' then jsonb_build_object('source',source,'renewalCompletedAt',completed_at,'renewalExpiresAt',renewed_expiry) else '{}'::jsonb end
      order by paid_at desc,id collate "C" desc) from page),'[]'::jsonb)) into result;
  return result;
end; $$;
revoke all on function public.ks_client_crm_snapshot_v2(uuid,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.ks_client_crm_snapshot_v2(uuid,text,timestamptz,text) to service_role;
commit;
