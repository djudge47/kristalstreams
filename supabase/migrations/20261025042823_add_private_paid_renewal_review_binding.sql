-- Paid renewal review identity only. No provider dispatch, budget reservation,
-- CRM/profile/receipt changes, live gate or historical-operation adoption.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
create table public.ks_paid_renewal_review_bindings (
  checkout_session_id text primary key references public.ks_paid_order_routes(checkout_session_id) on delete restrict,
  operation_id uuid not null unique default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  customer_id uuid not null references public.iptv_customers(id) on delete restrict,
  payment_intent_id text not null unique,
  binding jsonb not null,
  fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'),
  prepared_at timestamptz not null default clock_timestamp()
);
create index ks_paid_renewal_review_owner_idx on public.ks_paid_renewal_review_bindings(user_id);
create index ks_paid_renewal_review_customer_idx on public.ks_paid_renewal_review_bindings(customer_id);
alter table public.ks_paid_renewal_review_bindings enable row level security;
revoke all on public.ks_paid_renewal_review_bindings from public,anon,authenticated,service_role;
grant select,insert on public.ks_paid_renewal_review_bindings to service_role;

create function public.ks_paid_renewal_current_binding(p_session text,p_user uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.ks_payment_receipts%rowtype; route public.ks_paid_order_routes%rowtype;
  b public.ks_live_checkout_requests%rowtype; fresh jsonb; c record; u record;
begin
  if p_user is null or p_session is null or length(p_session)>200 or p_session !~ '^cs_live_[A-Za-z0-9]+$' then
    raise exception 'paid_renewal_identity_required'; end if;
  select * into r from public.ks_payment_receipts where checkout_session_id=p_session and user_id=p_user;
  if not found or not r.livemode then raise exception 'paid_renewal_owner_required'; end if;
  select * into route from public.ks_paid_order_routes where checkout_session_id=p_session;
  if not found or route.user_id is distinct from p_user or not route.livemode
    or route.destination<>'renewal_review' or route.request_kind<>'renewal'
    then return jsonb_build_object('state','review_required','reason','renewal_route_required'); end if;
  fresh:=public.ks_paid_order_route_candidate(p_session);
  if fresh->>'destination' is distinct from 'renewal_review'
    or fresh->>'customer_id' is distinct from route.customer_id::text
    or fresh->>'external_id' is distinct from route.external_id::text then
    return jsonb_build_object('state','review_required','reason','ownership_or_service_changed'); end if;
  select * into b from public.ks_live_checkout_requests where checkout_session_id=p_session and user_id=p_user;
  if not found or b.binding_version<>2 or b.renewal_customer_id is distinct from route.customer_id
    or b.renewal_external_id is distinct from route.external_id then
    return jsonb_build_object('state','review_required','reason','explicit_selection_required'); end if;
  select id,email,email_confirmed_at,is_anonymous into u from auth.users where id=p_user;
  select id,external_id,username,expiration_at,connections_allowed,package_name,account_status,trial into c
    from public.iptv_customers where id=route.customer_id;
  if not found or c.external_id is distinct from route.external_id or c.username !~ '^[A-Za-z0-9_.-]{3,64}$'
    or c.username is null or c.trial is distinct from false or c.account_status is distinct from 'active'
    or c.expiration_at is null or c.expiration_at<=clock_timestamp()
    or date_trunc('second',c.expiration_at) is distinct from c.expiration_at
    or c.connections_allowed not between 1 and 5 or c.connections_allowed is null
    or (c.package_name is not null and length(c.package_name)>200) then
    return jsonb_build_object('state','review_required','reason','current_service_requires_review'); end if;
  return jsonb_build_object('state','awaiting_verification','reason','binding_matches','binding',jsonb_build_object(
    'purpose','paid-renewal-review/v1','reference',r.checkout_session_id,'paymentIntentId',r.payment_intent_id,
    'userId',r.user_id,'customerId',route.customer_id,'lineId',route.external_id::text,'username',c.username,
    'tier',r.tier,'connections',r.connections,'durationDays',r.duration_days,'amountCents',r.amount_cents,'currency',r.currency,
    'currentConnections',c.connections_allowed,'currentPackageName',c.package_name,
    'currentExpiresAt',to_char(c.expiration_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'ownerEmail',lower(btrim(u.email)),
    'ownerConfirmedAt',to_char(u.email_confirmed_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')));
end; $$;

create function public.ks_guard_paid_renewal_review_binding()
returns trigger language plpgsql security invoker set search_path='' as $$
declare current jsonb;
begin
  if tg_op<>'INSERT' then raise exception 'paid_renewal_review_is_immutable'; end if;
  current:=public.ks_paid_renewal_current_binding(new.checkout_session_id,new.user_id);
  if current->>'state' is distinct from 'awaiting_verification' or new.binding is distinct from current->'binding'
    or new.customer_id::text is distinct from new.binding->>'customerId'
    or new.payment_intent_id is distinct from new.binding->>'paymentIntentId'
    or new.fingerprint is distinct from encode(sha256(convert_to(new.binding::text,'UTF8')),'hex') then
    raise exception 'paid_renewal_review_binding_changed'; end if;
  new.prepared_at:=clock_timestamp();return new;
end; $$;
create trigger ks_paid_renewal_review_binding_guard before insert or update or delete on public.ks_paid_renewal_review_bindings
  for each row execute function public.ks_guard_paid_renewal_review_binding();

create function public.ks_prepare_paid_renewal_review(p_session text,p_user uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare current jsonb; saved public.ks_paid_renewal_review_bindings%rowtype; replay boolean; stamp text;
begin
  perform pg_advisory_xact_lock(hashtextextended('ks-paid-renewal-review/v1:'||coalesce(p_session,''),0));
  current:=public.ks_paid_renewal_current_binding(p_session,p_user);
  select * into saved from public.ks_paid_renewal_review_bindings where checkout_session_id=p_session and user_id=p_user;
  replay:=found;
  if current->>'state'='awaiting_verification' then
    stamp:=encode(sha256(convert_to((current->'binding')::text,'UTF8')),'hex');
    if not replay then
      insert into public.ks_paid_renewal_review_bindings(checkout_session_id,user_id,customer_id,payment_intent_id,binding,fingerprint)
      values(p_session,p_user,(current->'binding'->>'customerId')::uuid,current->'binding'->>'paymentIntentId',current->'binding',stamp)
      returning * into saved;
    elsif saved.fingerprint is distinct from stamp or saved.binding is distinct from current->'binding' then
      current:=jsonb_build_object('state','review_required','reason','saved_service_facts_changed');
    end if;
  end if;
  if current->>'state'='review_required' then
    update public.ks_setup_order_queue set fulfillment_status='requires_review'
      where checkout_session_id=p_session and user_id=p_user and fulfillment_status='awaiting_activation';
  end if;
  -- Public/owner projection contains no provider or customer identity fields.
  return jsonb_build_object('reference',p_session,'accountId',p_user,'operationId',saved.operation_id,
    'state',current->>'state','reason',current->>'reason','preparedAt',saved.prepared_at,'replayed',replay,
    'mayDispatch',false,'providerActivated',false);
end; $$;

create function public.ks_check_paid_renewal_review(p_session text,p_user uuid,p_operation uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare current jsonb; saved public.ks_paid_renewal_review_bindings%rowtype;
begin
  current:=public.ks_paid_renewal_current_binding(p_session,p_user);
  select * into saved from public.ks_paid_renewal_review_bindings where checkout_session_id=p_session and user_id=p_user and operation_id=p_operation;
  if not found then raise exception 'saved_paid_renewal_review_required'; end if;
  if current->>'state'='awaiting_verification' and saved.binding is distinct from current->'binding' then
    current:=jsonb_build_object('state','review_required','reason','saved_service_facts_changed'); end if;
  return jsonb_build_object('reference',p_session,'accountId',p_user,'operationId',saved.operation_id,
    'state',current->>'state','reason',current->>'reason','fingerprint',saved.fingerprint,
    'binding',case when current->>'state'='awaiting_verification' then saved.binding else null end,
    'mayDispatch',false,'providerActivated',false);
end; $$;
revoke all on function public.ks_paid_renewal_current_binding(text,uuid),public.ks_guard_paid_renewal_review_binding(),
  public.ks_prepare_paid_renewal_review(text,uuid),public.ks_check_paid_renewal_review(text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.ks_paid_renewal_current_binding(text,uuid),public.ks_guard_paid_renewal_review_binding(),
  public.ks_prepare_paid_renewal_review(text,uuid),public.ks_check_paid_renewal_review(text,uuid,uuid) to service_role;
commit;
