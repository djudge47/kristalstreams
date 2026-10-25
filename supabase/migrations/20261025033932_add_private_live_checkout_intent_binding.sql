-- Additive live checkout intent capture. No backfill, activation, rollout or spending.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
create table public.ks_live_checkout_requests (
  user_id uuid not null references auth.users(id) on delete restrict,
  request_id uuid not null,
  binding_version integer not null default 1 check(binding_version=1),
  livemode boolean not null default true check(livemode=true),
  tier text not null check(tier in ('bronze','silver','gold','platinum')),
  connections integer not null check(connections between 1 and 5),
  duration_days integer not null,
  amount_cents integer not null,
  currency text not null default 'usd' check(currency='usd'),
  kind text not null check(kind in ('new_service','renewal','requires_review')),
  customer_email text not null,
  return_origin text not null check(return_origin = 'https://kristalstream.com'),
  created_epoch bigint not null,
  expires_epoch bigint not null,
  checkout_session_id text unique references public.ks_setup_purchase_intents(checkout_session_id) on delete restrict,
  bound_at timestamptz,
  primary key(user_id,request_id),
  check(expires_epoch=created_epoch+3600),
  check(checkout_session_id is null or checkout_session_id ~ '^cs_live_[A-Za-z0-9]+$'),
  check((checkout_session_id is null)=(bound_at is null))
);
alter table public.ks_live_checkout_requests enable row level security;
revoke all on public.ks_live_checkout_requests from public,anon,authenticated,service_role;
grant select,insert on public.ks_live_checkout_requests to service_role;
grant update(checkout_session_id,bound_at) on public.ks_live_checkout_requests to service_role;

create function public.ks_guard_live_checkout_request()
returns trigger language plpgsql security invoker set search_path='' as $$
declare intent public.ks_setup_purchase_intents%rowtype;
begin
  if tg_op='DELETE' then raise exception 'checkout_request_is_immutable'; end if;
  if tg_op='INSERT' then
    if new.checkout_session_id is not null then raise exception 'checkout_request_must_start_unbound'; end if;
    return new;
  end if;
  if (to_jsonb(new)-array['checkout_session_id','bound_at']) is distinct from
     (to_jsonb(old)-array['checkout_session_id','bound_at'])
    or old.checkout_session_id is not null or new.checkout_session_id is null or new.bound_at is null then
    raise exception 'checkout_request_is_immutable';
  end if;
  select * into intent from public.ks_setup_purchase_intents where checkout_session_id=new.checkout_session_id;
  if not found or intent.user_id is distinct from new.user_id or intent.kind is distinct from new.kind
    or intent.source is distinct from 'authenticated_checkout'
    or intent.new_service_attested is distinct from (new.kind='new_service')
    or intent.captured_at is distinct from new.bound_at then raise exception 'checkout_intent_binding_mismatch'; end if;
  return new;
end;
$$;
revoke all on function public.ks_guard_live_checkout_request() from public,anon,authenticated;
grant execute on function public.ks_guard_live_checkout_request() to service_role;
create trigger ks_live_checkout_request_history before insert or update or delete on public.ks_live_checkout_requests
  for each row execute function public.ks_guard_live_checkout_request();

create function public.ks_reserve_live_checkout_request(p_user_id uuid,p_request_id uuid,p_tier text,p_connections integer,
  p_kind text,p_origin text,p_email text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved public.ks_live_checkout_requests%rowtype; days integer; cents integer; stamp bigint;
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
  case p_tier
    when 'bronze' then days:=30; cents:=(array[2000,3500,5000,6500,8000])[p_connections];
    when 'silver' then days:=90; cents:=(array[4500,7500,11000,14000,17500])[p_connections];
    when 'gold' then days:=180; cents:=(array[6000,10500,15000,19500,24000])[p_connections];
    when 'platinum' then days:=365; cents:=(array[9500,16500,23500,30500,37500])[p_connections];
    else raise exception 'invalid_checkout_plan';
  end case;
  stamp:=floor(extract(epoch from clock_timestamp()));
  insert into public.ks_live_checkout_requests(user_id,request_id,tier,connections,duration_days,amount_cents,kind,
    customer_email,return_origin,created_epoch,expires_epoch)
    values(p_user_id,p_request_id,p_tier,p_connections,days,cents,p_kind,p_email,p_origin,stamp,stamp+3600)
    on conflict(user_id,request_id) do nothing;
  select * into saved from public.ks_live_checkout_requests where user_id=p_user_id and request_id=p_request_id for update;
  if (saved.tier,saved.connections,saved.duration_days,saved.amount_cents,saved.kind,saved.customer_email,saved.return_origin)
    is distinct from (p_tier,p_connections,days,cents,p_kind,p_email,p_origin) then raise exception 'checkout_request_binding_changed'; end if;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.ks_reserve_live_checkout_request(uuid,uuid,text,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.ks_reserve_live_checkout_request(uuid,uuid,text,integer,text,text,text) to service_role;

create function public.ks_bind_live_checkout_request(p_user_id uuid,p_request_id uuid,p_session_id text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved public.ks_live_checkout_requests%rowtype; intent public.ks_setup_purchase_intents%rowtype; stamp timestamptz;
begin
  if p_session_id is null or p_session_id !~ '^cs_live_[A-Za-z0-9]+$' then raise exception 'invalid_checkout_session'; end if;
  select * into saved from public.ks_live_checkout_requests where user_id=p_user_id and request_id=p_request_id for update;
  if not found then raise exception 'checkout_request_missing'; end if;
  if saved.checkout_session_id is not null and saved.checkout_session_id is distinct from p_session_id then
    raise exception 'checkout_session_binding_changed'; end if;
  if saved.checkout_session_id is null then
    stamp:=clock_timestamp();
    if extract(epoch from stamp)<saved.created_epoch or extract(epoch from stamp)>=saved.expires_epoch then
      raise exception 'checkout_binding_window_closed'; end if;
    -- A pre-existing intent is ambiguous: never adopt or overwrite it.
    insert into public.ks_setup_purchase_intents(checkout_session_id,user_id,kind,new_service_attested,source,captured_at)
      values(p_session_id,p_user_id,saved.kind,saved.kind='new_service','authenticated_checkout',stamp);
    update public.ks_live_checkout_requests set checkout_session_id=p_session_id,bound_at=stamp
      where user_id=p_user_id and request_id=p_request_id returning * into saved;
  end if;
  select * into intent from public.ks_setup_purchase_intents where checkout_session_id=p_session_id;
  if not found or intent.user_id is distinct from saved.user_id or intent.kind is distinct from saved.kind
    or intent.source is distinct from 'authenticated_checkout'
    or intent.new_service_attested is distinct from (saved.kind='new_service')
    or intent.captured_at is distinct from saved.bound_at then raise exception 'checkout_intent_binding_mismatch'; end if;
  return jsonb_build_object('request',to_jsonb(saved),'intent',to_jsonb(intent));
end;
$$;
revoke all on function public.ks_bind_live_checkout_request(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.ks_bind_live_checkout_request(uuid,uuid,text) to service_role;
commit;
