-- Administrator historical receipt projection only. No records or flags change.
begin;
set local lock_timeout='5s';set local statement_timeout='30s';
create function public.ks_admin_website_payment_history(p_actor uuid,p_before_at timestamptz default null,p_before_id text default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
  if not exists(select 1 from auth.users where id=p_actor and lower(btrim(email))='djudge47@gmail.com'
    and email_confirmed_at is not null and is_anonymous is not true) then raise exception 'payment_history_admin_required';end if;
  if ((p_before_at is null)<>(p_before_id is null)) or (p_before_id is not null and (length(p_before_id)>200 or p_before_id !~ '^cs_live_[A-Za-z0-9]+$'))
    then raise exception 'payment_history_cursor_invalid';end if;
  -- Completed-at ownership remains an immutable historical fact. Subsequent
  -- customer confirmation, username or service edits do not erase admin audit.
  with website as materialized (
    select c.checkout_session_id collate "C" id,c.customer_id,r.amount_cents::bigint cents,'stripe_checkout'::text method,r.recorded_at paid_at,
      case r.tier when 'bronze' then 1 when 'silver' then 3 when 'gold' then 6 when 'platinum' then 12 end months,r.connections,
      'website_checkout'::text source,c.completed_at,c.new_expiry renewed_expiry
    from public.ks_paid_renewal_completions c join public.iptv_customers v on v.id=c.customer_id
    join public.ks_payment_receipts r on r.checkout_session_id=c.checkout_session_id and r.user_id=c.user_id
    join public.ks_setup_order_queue q on q.checkout_session_id=c.checkout_session_id and q.user_id=c.user_id
    join public.ks_paid_renewal_provider_proofs p on p.operation_id=c.operation_id and p.result_expiry=c.new_expiry
    join public.ks_paid_renewal_expectations e on e.operation_id=p.operation_id
    join public.ks_paid_renewal_send_operations o on o.operation_id=c.operation_id and o.state='complete' and o.result_expiry=c.new_expiry
    join public.ks_paid_renewal_review_bindings b on b.operation_id=c.operation_id and b.user_id=c.user_id
      and b.checkout_session_id=c.checkout_session_id and b.customer_id=c.customer_id
    where true
      and c.checkout_session_id ~ '^cs_live_[A-Za-z0-9]+$' and length(c.checkout_session_id)<=200
      and r.livemode and not r.activated and r.expires_at is null and q.livemode and q.fulfillment_status='setup_complete'
      and r.connections=c.connections and r.currency='usd' and r.recorded_at<=c.completed_at and c.new_expiry>c.completed_at and c.completed_at<=now()
      and (p_before_at is null or (r.recorded_at,c.checkout_session_id collate "C")<(p_before_at,p_before_id collate "C"))
      -- A same-owner, same-amount received receipt with the exact Stripe
      -- reference is already represented in manual history; never count twice.
      and not exists(select 1 from public.iptv_payments existing where existing.customer_id=c.customer_id and existing.payment_status='paid'
        and existing.amount*100=r.amount_cents and existing.reference in (r.checkout_session_id,r.payment_intent_id))
    order by r.recorded_at desc,c.checkout_session_id collate "C" desc limit 201
  ) select jsonb_build_object('accountId',p_actor,'checkedAt',now(),'payments',coalesce((select jsonb_agg(jsonb_build_object(
    'id',id,'customer_id',customer_id,'amount_cents',cents,'payment_method',method,'payment_status','recorded',
    'paid_at',to_char(paid_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'months',months,'connections',connections,
    'source','website_checkout','renewal_completed_at',completed_at,'renewal_expires_at',renewed_expiry)
    order by paid_at desc,id collate "C" desc) from website),'[]'::jsonb)) into result;
  return result;
end; $$;
revoke all on function public.ks_admin_website_payment_history(uuid,timestamptz,text) from public,anon,authenticated;
grant execute on function public.ks_admin_website_payment_history(uuid,timestamptz,text) to service_role;
commit;
