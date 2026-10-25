-- Routing records a review destination, never authority to activate or spend.
-- No backfill, customer changes, provider calls, or rollout switches.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

create table public.ks_paid_order_routes (
  checkout_session_id text primary key references public.ks_setup_order_queue(checkout_session_id) on delete restrict,
  payment_intent_id text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  livemode boolean not null,
  request_kind text check(request_kind in ('new_service','renewal','requires_review')),
  destination text not null check(destination in ('new_service_review','renewal_review','manual_review')),
  reason text not null check(reason in ('new_service_requested','approved_service_link','missing_intent',
    'unverified_intent','owner_unconfirmed','review_requested','existing_service','service_link_missing',
    'service_links_ambiguous','service_link_stale','receipt_requires_review')),
  customer_id uuid references public.iptv_customers(id) on delete restrict,
  external_id bigint,
  routed_at timestamptz not null default clock_timestamp(),
  check((destination='renewal_review')=(customer_id is not null)),
  check((customer_id is null)=(external_id is null)),
  check(destination<>'renewal_review' or request_kind='renewal'),
  check(destination<>'new_service_review' or request_kind='new_service')
);
create index ks_paid_order_routes_customer_idx on public.ks_paid_order_routes(customer_id) where customer_id is not null;
create index ks_paid_order_routes_owner_idx on public.ks_paid_order_routes(user_id);
alter table public.ks_paid_order_routes enable row level security;
revoke all on public.ks_paid_order_routes from public,anon,authenticated,service_role;
grant select,insert on public.ks_paid_order_routes to service_role;

-- Only minimal Auth columns are read. No email/name matching to CRM records.
-- A single stale link also blocks assignment; do not silently choose another.
create function public.ks_paid_order_route_candidate(p_session text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.ks_payment_receipts%rowtype; q public.ks_setup_order_queue%rowtype;
  i public.ks_setup_purchase_intents%rowtype; u record; c record; link_count integer;
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

create function public.ks_guard_paid_order_route()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op<>'INSERT' then raise exception 'paid_order_route_is_immutable'; end if;
  if (to_jsonb(new)-'routed_at') is distinct from public.ks_paid_order_route_candidate(new.checkout_session_id) then
    raise exception 'paid_order_route_binding_mismatch'; end if;
  new.routed_at:=clock_timestamp();
  return new;
end; $$;
create trigger ks_paid_order_route_guard before insert or update or delete on public.ks_paid_order_routes
  for each row execute function public.ks_guard_paid_order_route();

create function public.ks_route_paid_order(p_session text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved public.ks_paid_order_routes%rowtype; candidate jsonb; replay boolean;
begin
  -- Serializes confirmation/webhook retries, including the initially absent row.
  if p_session is null or length(p_session)>200 or p_session !~ '^cs_(test_|live_)?[A-Za-z0-9]+$' then
    raise exception 'invalid_paid_order_reference'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_session,73103));
  candidate:=public.ks_paid_order_route_candidate(p_session);
  select * into saved from public.ks_paid_order_routes where checkout_session_id=p_session;
  replay:=found;
  if not replay then
    insert into public.ks_paid_order_routes(checkout_session_id,payment_intent_id,user_id,livemode,request_kind,
      destination,reason,customer_id,external_id)
    values(candidate->>'checkout_session_id',candidate->>'payment_intent_id',(candidate->>'user_id')::uuid,
      (candidate->>'livemode')::boolean,candidate->>'request_kind',candidate->>'destination',candidate->>'reason',
      (candidate->>'customer_id')::uuid,(candidate->>'external_id')::bigint) returning * into saved;
  elsif (saved.payment_intent_id,saved.user_id,saved.livemode) is distinct from
    (candidate->>'payment_intent_id',(candidate->>'user_id')::uuid,(candidate->>'livemode')::boolean) then
    raise exception 'paid_order_route_binding_mismatch';
  end if;
  -- CRM target/line identity stays private. This projection grants no execution.
  return jsonb_build_object('ok',true,'reference',saved.checkout_session_id,'account_id',saved.user_id,
    'test_mode',not saved.livemode,'request_kind',saved.request_kind,'destination',saved.destination,
    'reason',saved.reason,'routed_at',saved.routed_at,'replayed',replay);
end; $$;
revoke all on function public.ks_paid_order_route_candidate(text),public.ks_guard_paid_order_route(),
  public.ks_route_paid_order(text) from public,anon,authenticated;
grant execute on function public.ks_paid_order_route_candidate(text),public.ks_guard_paid_order_route(),
  public.ks_route_paid_order(text) to service_role;
commit;
