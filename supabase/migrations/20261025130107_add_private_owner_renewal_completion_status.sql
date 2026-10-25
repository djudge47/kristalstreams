-- Read-only historical renewal status. No dispatch, entitlement or financial write.
begin;
set local lock_timeout='5s';set local statement_timeout='30s';
create function public.ks_owner_paid_renewal_completions(p_user uuid,p_sessions text[])
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
  if p_user is null or p_sessions is null or cardinality(p_sessions) not between 1 and 5
    or array_ndims(p_sessions) is distinct from 1
    or exists(select 1 from unnest(p_sessions) s where s is null or length(s)>200 or s !~ '^cs_live_[A-Za-z0-9]+$')
    or (select count(distinct s) from unnest(p_sessions) s)<>cardinality(p_sessions)
    then raise exception 'bounded_owner_renewal_references_required';end if;
  -- One database snapshot binds the historical proof to its receipt and current
  -- approved owner link. Later renewals or manual service edits do not rewrite
  -- this receipt's completed term or imply current playback availability.
  select coalesce(jsonb_agg(jsonb_build_object(
    'reference',c.checkout_session_id,'accountId',c.user_id,'status','renewal_complete',
    'testMode',false,'providerActivated',false,'renewalCompleted',true,
    'expiresAt',c.new_expiry,'completedAt',c.completed_at,
    'tier',r.tier,'connections',r.connections,'durationDays',r.duration_days,
    'amountCents',r.amount_cents,'currency',r.currency,'recordedAt',r.recorded_at
  ) order by c.checkout_session_id),'[]'::jsonb) into result
  from public.ks_paid_renewal_completions c
  join public.ks_payment_receipts r on r.checkout_session_id=c.checkout_session_id and r.user_id=c.user_id
  join public.ks_setup_order_queue q on q.checkout_session_id=c.checkout_session_id and q.user_id=c.user_id
  join public.ks_paid_renewal_provider_proofs p on p.operation_id=c.operation_id and p.result_expiry=c.new_expiry
  join public.ks_paid_renewal_expectations e on e.operation_id=p.operation_id
  join public.ks_paid_renewal_send_operations o on o.operation_id=c.operation_id and o.state='complete' and o.result_expiry=c.new_expiry
  join public.ks_paid_renewal_review_bindings b on b.operation_id=c.operation_id and b.user_id=c.user_id
    and b.checkout_session_id=c.checkout_session_id and b.customer_id=c.customer_id
  join public.iptv_customers v on v.id=c.customer_id and v.external_id::text=b.binding->>'lineId' and v.username=b.binding->>'username'
  join public.ks_crm_portal_links l on l.customer_id=c.customer_id and l.user_id=c.user_id and l.external_id=v.external_id
  join auth.users u on u.id=c.user_id and u.email_confirmed_at=l.confirmed_at_link
    and lower(btrim(u.email))=l.email_at_link and u.email_confirmed_at is not null and u.is_anonymous is distinct from true
  where c.user_id=p_user and c.checkout_session_id=any(p_sessions)
    and r.livemode and r.activated=false and r.expires_at is null and q.livemode and q.fulfillment_status='setup_complete'
    and r.connections=c.connections and r.currency='usd'
    and r.recorded_at<=c.completed_at and c.new_expiry>c.completed_at and c.completed_at<=now();
  return result;
end; $$;
revoke all on function public.ks_owner_paid_renewal_completions(uuid,text[]) from public,anon,authenticated;
grant execute on function public.ks_owner_paid_renewal_completions(uuid,text[]) to service_role;
commit;
