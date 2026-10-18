-- Preview-only durable guard and encrypted login handoff. No provider action or entitlement change.
create table public.ks_preview_provisioning_attempts (
  attempt_id uuid primary key,
  checkout_session_id text not null unique references public.ks_payment_receipts(checkout_session_id) on delete restrict,
  user_id uuid not null unique references auth.users(id) on delete restrict,
  payment_intent_id text not null unique,
  binding_hash text not null check(binding_hash ~ '^[a-f0-9]{64}$'),
  claim_token uuid not null default gen_random_uuid(),
  reseller_id text not null check(reseller_id ~ '^[1-9][0-9]{0,14}$'),
  package_id text not null check(package_id ~ '^[1-9][0-9]{0,11}$'),
  package_months integer not null check(package_months in (1,3,6,12)),
  connections integer not null check(connections between 1 and 5),
  expected_credits numeric not null check(expected_credits > 0 and expected_credits <= 1000000),
  bouquet_ids integer[] not null check(cardinality(bouquet_ids) between 1 and 2000),
  login_envelope jsonb not null check(jsonb_typeof(login_envelope)='object' and login_envelope->>'version'='1'
    and length(login_envelope->>'ciphertext') between 32 and 2048),
  username_hash text not null check(username_hash ~ '^[a-f0-9]{64}$'),
  state text not null default 'reserved' check(state in ('reserved','dispatching','provider_verified','credentials_ready','reconciliation_required')),
  provider_line_id text,
  provider_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(reseller_id,provider_line_id),
  check((state not in ('provider_verified','credentials_ready')) or
    (provider_line_id is not null and provider_line_id ~ '^[1-9][0-9]{0,14}$' and provider_expires_at is not null))
);
create table public.ks_preview_streaming_logins (
  attempt_id uuid primary key references public.ks_preview_provisioning_attempts(attempt_id) on delete restrict,
  checkout_session_id text not null unique references public.ks_payment_receipts(checkout_session_id) on delete restrict,
  user_id uuid not null unique references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table public.ks_preview_provisioning_attempts enable row level security;
alter table public.ks_preview_streaming_logins enable row level security;
revoke all on public.ks_preview_provisioning_attempts,public.ks_preview_streaming_logins from public,anon,authenticated,service_role;
grant select,insert,update on public.ks_preview_provisioning_attempts to service_role;
grant select,insert on public.ks_preview_streaming_logins to service_role;

create function public.ks_guard_preview_provisioning() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='UPDATE' then
    if (to_jsonb(new)-array['state','provider_line_id','provider_expires_at','updated_at']) is distinct from
      (to_jsonb(old)-array['state','provider_line_id','provider_expires_at','updated_at']) then raise exception 'immutable_attempt_binding'; end if;
    if not ((old.state='reserved' and new.state='dispatching') or
      (old.state='dispatching' and new.state in ('provider_verified','reconciliation_required')) or
      (old.state='provider_verified' and new.state='credentials_ready')) then raise exception 'invalid_attempt_transition'; end if;
    if old.state <> 'dispatching' and (new.provider_line_id is distinct from old.provider_line_id or new.provider_expires_at is distinct from old.provider_expires_at) then raise exception 'immutable_provider_result'; end if;
  elsif new.state <> 'reserved' or new.provider_line_id is not null or new.provider_expires_at is not null then raise exception 'reserved_attempt_required'; end if;
  new.updated_at := now(); return new;
end; $$;
create trigger ks_guard_preview_provisioning before insert or update on public.ks_preview_provisioning_attempts
for each row execute function public.ks_guard_preview_provisioning();

create function public.ks_reserve_preview_provisioning(p_attempt_id uuid,p_session_id text,p_user_id uuid,p_binding_hash text,
  p_reseller_id text,p_package_id text,p_months integer,p_connections integer,p_credits numeric,p_bouquets integer[],
  p_envelope jsonb,p_username_hash text,p_new_customer_confirmed boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  r public.ks_payment_receipts%rowtype; a public.ks_preview_provisioning_attempts%rowtype;
  prices integer[]; days integer; months integer; fresh boolean := false;
begin
  if p_new_customer_confirmed is distinct from true or p_user_id is null or p_attempt_id is null then raise exception 'new_customer_review_required'; end if;
  select * into r from public.ks_payment_receipts where checkout_session_id=p_session_id for update;
  if not found or r.user_id is distinct from p_user_id or r.livemode is distinct from false or r.activated is distinct from false
    or r.expires_at is not null or r.currency <> 'usd' or r.connections <> p_connections
    or not exists(select 1 from public.ks_preview_paid_orders where checkout_session_id=p_session_id) then raise exception 'verified_pending_test_receipt_required'; end if;
  case r.tier
    when 'bronze' then prices:=array[2000,3500,5000,6500,8000];days:=30;months:=1;
    when 'silver' then prices:=array[4500,7500,11000,14000,17500];days:=90;months:=3;
    when 'gold' then prices:=array[6000,10500,15000,19500,24000];days:=180;months:=6;
    when 'platinum' then prices:=array[9500,16500,23500,30500,37500];days:=365;months:=12;
    else raise exception 'invalid_receipt';
  end case;
  if r.amount_cents is distinct from prices[r.connections] or r.duration_days <> days or p_months is distinct from months
    or p_binding_hash is null or p_binding_hash !~ '^[a-f0-9]{64}$' or p_username_hash is null or p_username_hash !~ '^[a-f0-9]{64}$'
    or p_reseller_id is null or p_package_id is null or p_credits is null or p_credits <= 0 or p_credits > 1000000
    or p_bouquets is null or cardinality(p_bouquets) not between 1 and 2000
    or exists(select 1 from unnest(p_bouquets) b where b is null or b <= 0)
    or cardinality(p_bouquets) <> (select count(distinct b) from unnest(p_bouquets) b)
    or p_envelope is null or jsonb_typeof(p_envelope) <> 'object'
    or (select array_agg(k order by k) from jsonb_object_keys(p_envelope) k) is distinct from array['ciphertext','iv','keyId','tag','version']::text[]
    or p_envelope->>'version' is distinct from '1' or coalesce(p_envelope->>'keyId','') !~ '^[A-Za-z0-9_-]{1,32}$'
    or coalesce(p_envelope->>'iv','') !~ '^[A-Za-z0-9+/]{16}$' or coalesce(p_envelope->>'tag','') !~ '^[A-Za-z0-9+/]{22}==$'
    or length(p_envelope->>'ciphertext') not between 32 and 2048 or coalesce(p_envelope->>'ciphertext','') !~ '^[A-Za-z0-9+/]+={0,2}$' then raise exception 'invalid_attempt_binding'; end if;
  -- This operator identity is not a purchaser/line binding. Conservatively require separate review of any prior trial activity.
  if exists(select 1 from public.ks_roomba_trial_attempts where admin_id=p_user_id) then raise exception 'prior_trial_activity_requires_review'; end if;
  select * into a from public.ks_preview_provisioning_attempts where checkout_session_id=p_session_id for update;
  if found then
    if a.user_id is distinct from p_user_id or a.binding_hash is distinct from p_binding_hash
      or a.reseller_id is distinct from p_reseller_id or a.package_id is distinct from p_package_id
      or a.package_months is distinct from p_months or a.connections is distinct from p_connections
      or a.expected_credits is distinct from p_credits or a.bouquet_ids is distinct from p_bouquets
      or a.username_hash is distinct from p_username_hash then raise exception 'attempt_binding_changed'; end if;
  else
    insert into public.ks_preview_provisioning_attempts(attempt_id,checkout_session_id,user_id,payment_intent_id,binding_hash,
      reseller_id,package_id,package_months,connections,expected_credits,bouquet_ids,login_envelope,username_hash)
    values(p_attempt_id,p_session_id,p_user_id,r.payment_intent_id,p_binding_hash,p_reseller_id,p_package_id,p_months,p_connections,p_credits,p_bouquets,p_envelope,p_username_hash)
    returning * into a; fresh:=true;
  end if;
  return jsonb_build_object('fresh',fresh,'attemptId',a.attempt_id,'state',a.state,'claimToken',a.claim_token);
end; $$;

create function public.ks_begin_preview_provisioning(p_attempt_id uuid,p_claim_token uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare a public.ks_preview_provisioning_attempts%rowtype;
begin
  select * into a from public.ks_preview_provisioning_attempts where attempt_id=p_attempt_id for update;
  if not found or a.claim_token is distinct from p_claim_token then raise exception 'invalid_attempt_claim'; end if;
  if a.state <> 'reserved' then return false; end if;
  update public.ks_preview_provisioning_attempts set state='dispatching' where attempt_id=a.attempt_id;
  return true;
end; $$;

create function public.ks_record_preview_provider_result(p_attempt_id uuid,p_claim_token uuid,p_line_id text,p_reseller_id text,
  p_package_id text,p_username_hash text,p_connections integer,p_bouquets integer[],p_expires_at timestamptz)
returns boolean language plpgsql security invoker set search_path='' as $$
declare a public.ks_preview_provisioning_attempts%rowtype;
begin
  select * into a from public.ks_preview_provisioning_attempts where attempt_id=p_attempt_id for update;
  if not found or a.claim_token is distinct from p_claim_token then raise exception 'invalid_attempt_claim'; end if;
  if a.state <> 'dispatching' or p_line_id is null or p_line_id !~ '^[1-9][0-9]{0,14}$'
    or p_reseller_id is distinct from a.reseller_id or p_package_id is distinct from a.package_id
    or p_username_hash is distinct from a.username_hash or p_connections is distinct from a.connections
    or p_bouquets is distinct from a.bouquet_ids or p_expires_at is null
    or p_expires_at < now()+make_interval(days=>27*a.package_months)
    or p_expires_at > now()+make_interval(days=>32*a.package_months) then raise exception 'provider_result_requires_review'; end if;
  update public.ks_preview_provisioning_attempts set state='provider_verified',provider_line_id=p_line_id,provider_expires_at=p_expires_at where attempt_id=a.attempt_id;
  return true;
end; $$;

create function public.ks_reconcile_preview_provisioning(p_attempt_id uuid,p_claim_token uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare a public.ks_preview_provisioning_attempts%rowtype;
begin
  select * into a from public.ks_preview_provisioning_attempts where attempt_id=p_attempt_id for update;
  if not found or a.claim_token is distinct from p_claim_token then raise exception 'invalid_attempt_claim'; end if;
  if a.state='reconciliation_required' then return false; end if;
  if a.state <> 'dispatching' then raise exception 'invalid_attempt_transition'; end if;
  update public.ks_preview_provisioning_attempts set state='reconciliation_required' where attempt_id=a.attempt_id;
  return true;
end; $$;

create function public.ks_complete_preview_login(p_attempt_id uuid,p_claim_token uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare a public.ks_preview_provisioning_attempts%rowtype;
begin
  select * into a from public.ks_preview_provisioning_attempts where attempt_id=p_attempt_id for update;
  if not found or a.claim_token is distinct from p_claim_token then raise exception 'invalid_attempt_claim'; end if;
  if a.state='credentials_ready' then return false; end if;
  if a.state <> 'provider_verified' then raise exception 'provider_verification_required'; end if;
  insert into public.ks_preview_streaming_logins(attempt_id,checkout_session_id,user_id) values(a.attempt_id,a.checkout_session_id,a.user_id);
  update public.ks_preview_provisioning_attempts set state='credentials_ready' where attempt_id=a.attempt_id;
  return true;
end; $$;

create function public.ks_preview_provisioning_foundation_status() returns jsonb language sql stable security invoker set search_path='' as $$
select jsonb_build_object('version',1,'durableAttempts',true,'encryptedLoginTable',true,
  'browserAccessRevoked',not has_table_privilege('anon','public.ks_preview_provisioning_attempts','SELECT')
    and not has_table_privilege('authenticated','public.ks_preview_provisioning_attempts','SELECT')
    and not has_table_privilege('anon','public.ks_preview_streaming_logins','SELECT')
    and not has_table_privilege('authenticated','public.ks_preview_streaming_logins','SELECT'));
$$;

revoke all on function public.ks_guard_preview_provisioning() from public,anon,authenticated;
revoke all on function public.ks_reserve_preview_provisioning(uuid,text,uuid,text,text,text,integer,integer,numeric,integer[],jsonb,text,boolean) from public,anon,authenticated;
revoke all on function public.ks_begin_preview_provisioning(uuid,uuid) from public,anon,authenticated;
revoke all on function public.ks_record_preview_provider_result(uuid,uuid,text,text,text,text,integer,integer[],timestamptz) from public,anon,authenticated;
revoke all on function public.ks_reconcile_preview_provisioning(uuid,uuid) from public,anon,authenticated;
revoke all on function public.ks_complete_preview_login(uuid,uuid) from public,anon,authenticated;
revoke all on function public.ks_preview_provisioning_foundation_status() from public,anon,authenticated;
grant execute on function public.ks_guard_preview_provisioning() to service_role;
grant execute on function public.ks_reserve_preview_provisioning(uuid,text,uuid,text,text,text,integer,integer,numeric,integer[],jsonb,text,boolean) to service_role;
grant execute on function public.ks_begin_preview_provisioning(uuid,uuid) to service_role;
grant execute on function public.ks_record_preview_provider_result(uuid,uuid,text,text,text,text,integer,integer[],timestamptz) to service_role;
grant execute on function public.ks_reconcile_preview_provisioning(uuid,uuid) to service_role;
grant execute on function public.ks_complete_preview_login(uuid,uuid) to service_role;
grant execute on function public.ks_preview_provisioning_foundation_status() to service_role;
comment on table public.ks_preview_provisioning_attempts is 'Preview foundation only. No provider send path. Sticky dispatch/reconciliation guard; never reset after a possible send. Credentials are application-encrypted.';
comment on table public.ks_preview_streaming_logins is 'Server-only owner binding to encrypted credentials after provider verification. No plaintext login or automatic email.';
alter table public.ks_preview_provisioning_attempts add constraint ks_preview_login_envelope_shape check (
  login_envelope ?& array['version','keyId','iv','tag','ciphertext'] and login_envelope-array['version','keyId','iv','tag','ciphertext']='{}'::jsonb
  and login_envelope->>'version'='1' and login_envelope->>'keyId' ~ '^[A-Za-z0-9_-]{1,32}$'
  and login_envelope->>'iv' ~ '^[A-Za-z0-9+/]{16}$' and login_envelope->>'tag' ~ '^[A-Za-z0-9+/]{22}==$'
  and login_envelope->>'ciphertext' ~ '^[A-Za-z0-9+/]+={0,2}$');
create function public.ks_guard_preview_login_binding() returns trigger language plpgsql security invoker set search_path='' as $$
declare a public.ks_preview_provisioning_attempts%rowtype;
begin
 select * into a from public.ks_preview_provisioning_attempts where attempt_id=new.attempt_id;
 if not found or a.state <> 'provider_verified' or a.user_id is distinct from new.user_id or a.checkout_session_id is distinct from new.checkout_session_id
   or a.provider_expires_at <= now() or not exists(select 1 from public.ks_payment_receipts r where r.checkout_session_id=a.checkout_session_id and r.user_id=a.user_id and r.livemode=false)
 then raise exception 'verified_owner_login_binding_required'; end if;
 return new;
end; $$;
create trigger ks_guard_preview_login_binding before insert on public.ks_preview_streaming_logins for each row execute function public.ks_guard_preview_login_binding();
revoke all on function public.ks_guard_preview_login_binding() from public,anon,authenticated;
grant execute on function public.ks_guard_preview_login_binding() to service_role;
