-- Explicit live renewal target; no checkout, payment or provider operation.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
alter table public.ks_live_checkout_requests
  add column renewal_customer_id uuid references public.iptv_customers(id) on delete restrict,
  add column renewal_external_id bigint,
  drop constraint ks_live_checkout_requests_binding_version_check,
  add constraint ks_live_checkout_requests_binding_version_check check(binding_version in (1,2)),
  add constraint ks_live_checkout_service_binding_check check(
    (binding_version=1 and renewal_customer_id is null and renewal_external_id is null)
    or (binding_version=2 and kind='renewal' and renewal_customer_id is not null and renewal_external_id is not null and renewal_external_id>0)
  );
create index ks_live_checkout_requests_customer_idx on public.ks_live_checkout_requests(renewal_customer_id) where renewal_customer_id is not null;
create function public.ks_reserve_live_service_checkout_request(p_user_id uuid,p_request_id uuid,p_tier text,p_connections integer,
  p_kind text,p_origin text,p_email text,p_customer uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved public.ks_live_checkout_requests%rowtype; days integer; cents integer; stamp bigint; panel bigint;
begin
  if p_user_id is null or p_request_id is null or p_kind is null or p_tier is null or p_connections is null
    or p_email is null or p_origin is null or p_connections not between 1 and 5
    or p_kind not in ('new_service','renewal','requires_review') then raise exception 'invalid_checkout_request'; end if;
  -- Revalidate the confirmed Auth owner with existing minimal column grants.
  -- This function never reads user metadata, sessions or credentials.
  if not exists(select 1 from auth.users u where u.id=p_user_id
    and lower(btrim(u.email))=lower(btrim(p_email)) and u.email_confirmed_at is not null
    and u.is_anonymous is not true) then raise exception 'confirmed_checkout_owner_required'; end if;
  if not exists(select 1 from public.profiles p where p.id=p_user_id
    and lower(btrim(p.email))=lower(btrim(p_email))) then raise exception 'checkout_owner_profile_required'; end if;
  if p_kind is distinct from 'renewal' or p_customer is null then raise exception 'renewal_service_required'; end if;
  select c.external_id into panel from public.ks_crm_portal_links l
    join auth.users u on u.id=l.user_id join public.iptv_customers c on c.id=l.customer_id and c.external_id=l.external_id
    where l.user_id=p_user_id and l.customer_id=p_customer and l.email_at_link=lower(btrim(u.email))
      and l.confirmed_at_link=u.email_confirmed_at and u.is_anonymous is not true
      and coalesce(c.source,'') not like 'roomba_preview%' and c.payment_status is distinct from 'preview_test'
      and c.trial is not true and c.external_id>0;
  if not found then raise exception 'renewal_service_unavailable'; end if;
  case p_tier
    when 'bronze' then days:=30; cents:=(array[2000,3500,5000,6500,8000])[p_connections];
    when 'silver' then days:=90; cents:=(array[4500,7500,11000,14000,17500])[p_connections];
    when 'gold' then days:=180; cents:=(array[6000,10500,15000,19500,24000])[p_connections];
    when 'platinum' then days:=365; cents:=(array[9500,16500,23500,30500,37500])[p_connections];
    else raise exception 'invalid_checkout_plan';
  end case;
  stamp:=floor(extract(epoch from clock_timestamp()));
  insert into public.ks_live_checkout_requests(binding_version,renewal_customer_id,renewal_external_id,user_id,request_id,tier,connections,duration_days,amount_cents,kind,
    customer_email,return_origin,created_epoch,expires_epoch)
    values(2,p_customer,panel,p_user_id,p_request_id,p_tier,p_connections,days,cents,p_kind,p_email,p_origin,stamp,stamp+3600)
    on conflict(user_id,request_id) do nothing;
  select * into saved from public.ks_live_checkout_requests where user_id=p_user_id and request_id=p_request_id for update;
  if (saved.binding_version,saved.renewal_customer_id,saved.renewal_external_id,saved.tier,saved.connections,saved.duration_days,saved.amount_cents,saved.kind,saved.customer_email,saved.return_origin)
    is distinct from (2,p_customer,panel,p_tier,p_connections,days,cents,p_kind,p_email,p_origin) then raise exception 'checkout_request_binding_changed'; end if;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.ks_reserve_live_service_checkout_request(uuid,uuid,text,integer,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.ks_reserve_live_service_checkout_request(uuid,uuid,text,integer,text,text,text,uuid) to service_role;

create or replace function public.ks_paid_order_route_candidate(p_session text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.ks_payment_receipts%rowtype; q public.ks_setup_order_queue%rowtype;
  i public.ks_setup_purchase_intents%rowtype; u record; c record; b public.ks_live_checkout_requests%rowtype; link_count integer;
  kind text; dest text := 'manual_review'; why text; customer uuid; panel bigint;
begin
  if p_session is null or length(p_session)>200 or p_session !~ '^cs_(test_|live_)?[A-Za-z0-9]+$' then
    raise exception 'invalid_paid_order_reference'; end if;
  select * into r from public.ks_payment_receipts where checkout_session_id=p_session;
  if not found then raise exception 'paid_order_receipt_required'; end if;
  select * into q from public.ks_setup_order_queue where checkout_session_id=p_session;
  if not found or (q.payment_intent_id,q.user_id,q.livemode,q.tier,q.connections,q.duration_days,q.amount_cents,q.currency)
    is distinct from (r.payment_intent_id,r.user_id,r.livemode,r.tier,r.connections,r.duration_days,r.amount_cents,r.currency)
    then raise exception 'paid_order_queue_mismatch'; end if;
  select * into i from public.ks_setup_purchase_intents where checkout_session_id=p_session;
  if i.checkout_session_id is null then why:='missing_intent';
  elsif i.user_id is distinct from r.user_id or i.source is distinct from 'authenticated_checkout'
    or i.captured_at>r.recorded_at or i.new_service_attested is distinct from (i.kind='new_service')
    then why:='unverified_intent';
  else kind:=i.kind; end if;

  select id,email,email_confirmed_at,is_anonymous into u from auth.users where id=r.user_id;
  if q.fulfillment_status is distinct from 'awaiting_activation' or r.activated or r.expires_at is not null then
    why:='receipt_requires_review';
  elsif u.id is null or u.email_confirmed_at is null or u.is_anonymous is true
    or nullif(btrim(u.email),'') is null then why:='owner_unconfirmed';
  elsif why is null then
    select count(*) into link_count from public.ks_crm_portal_links where user_id=r.user_id;
    if kind='requires_review' then why:='review_requested';
    elsif kind='new_service' then
      if link_count>0 then why:='existing_service';
      else dest:='new_service_review'; why:='new_service_requested'; end if;
    elsif r.livemode and exists(select 1 from public.ks_live_checkout_requests
      where checkout_session_id=p_session and user_id=r.user_id and binding_version=2) then
      select * into b from public.ks_live_checkout_requests where checkout_session_id=p_session and user_id=r.user_id and binding_version=2;
      select v.id,v.external_id into c from public.ks_crm_portal_links l
        join public.iptv_customers v on v.id=l.customer_id and v.external_id=l.external_id
        where l.user_id=r.user_id and l.customer_id=b.renewal_customer_id and v.external_id=b.renewal_external_id
          and (b.tier,b.connections,b.duration_days,b.amount_cents,b.currency) is not distinct from
            (r.tier,r.connections,r.duration_days,r.amount_cents,r.currency)
          and l.email_at_link=lower(btrim(u.email)) and l.confirmed_at_link=u.email_confirmed_at
          and coalesce(v.source,'') not like 'roomba_preview%' and v.payment_status is distinct from 'preview_test' and v.trial is not true;
      if not found then why:='service_link_stale';
      else dest:='renewal_review'; why:='approved_service_link'; customer:=c.id; panel:=c.external_id; end if;
    elsif link_count=0 then why:='service_link_missing';
    elsif link_count<>1 then why:='service_links_ambiguous';
    else
      select v.id,v.external_id into c from public.ks_crm_portal_links l
        join public.iptv_customers v on v.id=l.customer_id and v.external_id=l.external_id
        where l.user_id=r.user_id and l.email_at_link=lower(btrim(u.email))
          and l.confirmed_at_link=u.email_confirmed_at
          and coalesce(v.source,'') not like 'roomba_preview%'
          and v.payment_status is distinct from 'preview_test' and v.trial is not true;
      if not found then why:='service_link_stale';
      else dest:='renewal_review'; why:='approved_service_link'; customer:=c.id; panel:=c.external_id; end if;
    end if;
  end if;
  return jsonb_build_object('checkout_session_id',r.checkout_session_id,'payment_intent_id',r.payment_intent_id,
    'user_id',r.user_id,'livemode',r.livemode,'request_kind',kind,'destination',dest,'reason',why,
    'customer_id',customer,'external_id',panel);
end; $$;


create function public.ks_checkout_services_snapshot(p_user uuid,p_email text,p_after uuid default null)
returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('accountId',p_user,'checkedAt',now(),'services',coalesce((
    select jsonb_agg(jsonb_build_object('customerId',s.id,'username',s.username,'connections',s.connections_allowed,
      'expiresAt',s.expiration_at) order by s.id) from (
      select c.id,c.username,c.connections_allowed,c.expiration_at from public.ks_crm_portal_links l
        join auth.users u on u.id=l.user_id join public.iptv_customers c on c.id=l.customer_id and c.external_id=l.external_id
      where l.user_id=p_user and l.email_at_link=p_email and lower(btrim(u.email))=p_email
        and u.email_confirmed_at=l.confirmed_at_link and u.is_anonymous is not true
        and coalesce(c.source,'') not like 'roomba_preview%' and c.payment_status is distinct from 'preview_test'
        and c.trial is not true and c.external_id>0 and (p_after is null or c.id>p_after)
      order by c.id limit 51
    ) s
  ),'[]'::jsonb));
$$;
revoke all on function public.ks_checkout_services_snapshot(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.ks_checkout_services_snapshot(uuid,text,uuid) to service_role;
commit;
