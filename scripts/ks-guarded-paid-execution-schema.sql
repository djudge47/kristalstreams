-- Preview only. Installs guards and atomic local completion; enables no provider endpoint.
create table public.ks_preview_reseller_dispatches (
  reseller_id text primary key,
  attempt_id uuid not null unique references public.ks_preview_provisioning_attempts(attempt_id) on delete restrict,
  approver_id uuid not null references auth.users(id) on delete restrict,
  approval_hash text not null check(approval_hash ~ '^[a-f0-9]{64}$'),
  approval_expires_at timestamptz not null,
  credit_cost_units numeric not null check(credit_cost_units > 0 and credit_cost_units = trunc(credit_cost_units)),
  balance_units numeric not null check(balance_units >= credit_cost_units and balance_units <= 1000000000000 and balance_units = trunc(balance_units)),
  claimed_at timestamptz not null default now()
);
create table public.ks_preview_paid_fulfillments (
  attempt_id uuid primary key references public.ks_preview_provisioning_attempts(attempt_id) on delete restrict,
  checkout_session_id text not null unique references public.ks_payment_receipts(checkout_session_id) on delete restrict,
  user_id uuid not null unique references auth.users(id) on delete restrict,
  crm_customer_id uuid not null unique references public.iptv_customers(id) on delete restrict,
  approver_id uuid not null references auth.users(id) on delete restrict,
  approval_hash text not null check(approval_hash ~ '^[a-f0-9]{64}$'),
  credit_cost_units numeric not null check(credit_cost_units>0 and credit_cost_units=trunc(credit_cost_units)),
  balance_before_units numeric not null check(balance_before_units>=credit_cost_units and balance_before_units=trunc(balance_before_units)),
  approved_at timestamptz not null,
  completed_at timestamptz not null default now()
);
alter table public.ks_preview_reseller_dispatches enable row level security;
alter table public.ks_preview_paid_fulfillments enable row level security;
revoke all on public.ks_preview_reseller_dispatches,public.ks_preview_paid_fulfillments from public,anon,authenticated,service_role;
grant select,insert,delete on public.ks_preview_reseller_dispatches to service_role;
grant select,insert on public.ks_preview_paid_fulfillments to service_role;

create function public.ks_assert_preview_new_customer(p_user_id uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare p public.profiles%rowtype;
begin
 -- The server verifies confirmation with Auth admin getUserById; SQL does not read auth.users.
 select * into p from public.profiles where id=p_user_id;
 if not found or p.subscription_status='active' or p.active_connections<>0
   or p.subscription_expires_at>now() then raise exception 'existing_website_access_requires_review'; end if;
 if exists(select 1 from public.ks_roomba_trial_attempts where admin_id=p_user_id)
   or exists(select 1 from public.ks_preview_paid_fulfillments where user_id=p_user_id)
   or exists(select 1 from public.iptv_customers where lower(email)=lower(p.email))
 then raise exception 'existing_streaming_access_requires_review'; end if;
 -- An email match is only a conservative stop, never an ownership merge.
 return true;
end; $$;

create function public.ks_guard_preview_dispatch_release() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.ks_preview_provisioning_attempts a join public.ks_preview_paid_fulfillments f using(attempt_id)
   where a.attempt_id=old.attempt_id and a.state='credentials_ready') then raise exception 'unresolved_dispatch_remains_locked'; end if;
 return old;
end; $$;
create trigger ks_guard_preview_dispatch_release before delete on public.ks_preview_reseller_dispatches
for each row execute function public.ks_guard_preview_dispatch_release();

create function public.ks_begin_approved_preview_provisioning(p_attempt_id uuid,p_claim_token uuid,p_approver_id uuid,
 p_approval_hash text,p_approval_expires_at timestamptz,p_credit_cost_units numeric,p_balance_units numeric)
returns boolean language plpgsql security invoker set search_path='' as $$
declare a public.ks_preview_provisioning_attempts%rowtype; claimed integer;
begin
 select * into a from public.ks_preview_provisioning_attempts where attempt_id=p_attempt_id for update;
 if not found or a.claim_token is distinct from p_claim_token then raise exception 'invalid_attempt_claim'; end if;
 if a.state<>'reserved' then return false; end if;
 -- Administrator authorization belongs to the trusted server caller. This is its audit identity.
 if p_approver_id is null or not exists(select 1 from public.profiles where id=p_approver_id)
   or p_approval_hash is null or p_approval_hash !~ '^[a-f0-9]{64}$'
   or p_approval_expires_at is null or p_approval_expires_at<=clock_timestamp() or p_approval_expires_at>clock_timestamp()+interval '2 minutes'
   or p_credit_cost_units is distinct from a.expected_credits*1000000
   or p_credit_cost_units<>trunc(p_credit_cost_units) or p_balance_units is null
   or p_balance_units<p_credit_cost_units or p_balance_units>1000000000000 or p_balance_units<>trunc(p_balance_units)
 then raise exception 'bounded_credit_approval_required'; end if;
 perform public.ks_assert_preview_new_customer(a.user_id);
 insert into public.ks_preview_reseller_dispatches(reseller_id,attempt_id,approver_id,approval_hash,approval_expires_at,credit_cost_units,balance_units)
 values(a.reseller_id,a.attempt_id,p_approver_id,p_approval_hash,p_approval_expires_at,p_credit_cost_units,p_balance_units)
 on conflict do nothing;
 get diagnostics claimed=row_count;
 if claimed<>1 then return false; end if;
 update public.ks_preview_provisioning_attempts set state='dispatching' where attempt_id=a.attempt_id;
 return true;
end; $$;

-- Preserve the old internal RPC for old diagnostics, but require the same approval/lock first.
create or replace function public.ks_begin_preview_provisioning(p_attempt_id uuid,p_claim_token uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 raise exception 'use_bounded_preview_credit_approval';
end; $$;

alter table public.ks_preview_paid_orders drop constraint ks_preview_paid_orders_fulfillment_status_check;
alter table public.ks_preview_paid_orders add constraint ks_preview_paid_orders_fulfillment_status_check
check(fulfillment_status in ('awaiting_activation','setup_complete'));
grant update(fulfillment_status) on public.ks_preview_paid_orders to service_role;

create function public.ks_commit_preview_paid_setup(p_attempt_id uuid,p_claim_token uuid,p_username text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.ks_preview_provisioning_attempts%rowtype; r public.ks_payment_receipts%rowtype;
 f public.ks_preview_paid_fulfillments%rowtype; c public.iptv_customers%rowtype; approval public.ks_preview_reseller_dispatches%rowtype; customer_id uuid;
begin
 -- Consistent lock order: receipt before attempt (the reservation uses this order too).
 select r0.* into r from public.ks_payment_receipts r0 join public.ks_preview_provisioning_attempts a0
 on a0.checkout_session_id=r0.checkout_session_id where a0.attempt_id=p_attempt_id for update of r0;
 select * into a from public.ks_preview_provisioning_attempts where attempt_id=p_attempt_id for update;
 if not found or a.claim_token is distinct from p_claim_token or r.user_id is distinct from a.user_id
   or r.livemode is distinct from false or r.activated is distinct from false or r.expires_at is not null
   or r.payment_intent_id is distinct from a.payment_intent_id
   or p_username is null or p_username !~ '^[A-Za-z0-9_.-]{8,64}$'
   or encode(extensions.digest(p_username,'sha256'),'hex')<>a.username_hash then raise exception 'verified_paid_setup_required'; end if;
 select * into f from public.ks_preview_paid_fulfillments where attempt_id=a.attempt_id;
 if found then
   select * into c from public.iptv_customers where id=f.crm_customer_id;
   if a.state<>'credentials_ready' or f.user_id<>a.user_id or f.checkout_session_id<>a.checkout_session_id
     or not found or c.source<>'roomba_preview_paid' or c.external_id<>a.provider_line_id::bigint or c.username<>p_username
   then raise exception 'paid_completion_binding_changed'; end if;
   return jsonb_build_object('ok',true,'state','credentials_ready','replayed',true);
 end if;
 if a.state<>'provider_verified' or a.provider_expires_at<=clock_timestamp()
   or not exists(select 1 from public.ks_preview_reseller_dispatches where attempt_id=a.attempt_id and reseller_id=a.reseller_id)
   or not exists(select 1 from public.ks_preview_paid_orders where checkout_session_id=a.checkout_session_id and fulfillment_status='awaiting_activation')
 then raise exception 'verified_paid_setup_required'; end if;
 perform public.ks_assert_preview_new_customer(a.user_id);
 if exists(select 1 from public.iptv_customers where external_id=a.provider_line_id::bigint or username=p_username) then raise exception 'crm_identity_conflict'; end if;
 insert into public.iptv_customers(external_id,username,customer_name,package_name,trial,connections_allowed,expiration_at,
   renewal_at,monthly_price,payment_status,account_status,source)
 values(a.provider_line_id::bigint,p_username,'Private Preview paid setup',initcap(r.tier)||' · '||a.package_months||' months',false,
   a.connections,a.provider_expires_at,null,0,'preview_test','active','roomba_preview_paid') returning id into customer_id;
 select * into strict approval from public.ks_preview_reseller_dispatches where attempt_id=a.attempt_id;
 insert into public.ks_preview_paid_fulfillments(attempt_id,checkout_session_id,user_id,crm_customer_id,approver_id,approval_hash,credit_cost_units,balance_before_units,approved_at)
 values(a.attempt_id,a.checkout_session_id,a.user_id,customer_id,approval.approver_id,approval.approval_hash,approval.credit_cost_units,approval.balance_units,approval.claimed_at);
 insert into public.iptv_customer_activity(customer_id,activity_type,title,details)
 values(customer_id,'roomba_preview_paid_setup','Verified Preview paid setup',
   'Sandbox payment with separately approved real provider setup. No live customer charge or revenue recorded. Login remains encrypted.');
 perform public.ks_complete_preview_login(a.attempt_id,a.claim_token);
 update public.ks_preview_paid_orders set fulfillment_status='setup_complete' where checkout_session_id=a.checkout_session_id;
 delete from public.ks_preview_reseller_dispatches where attempt_id=a.attempt_id;
 return jsonb_build_object('ok',true,'state','credentials_ready','replayed',false);
end; $$;

create function public.ks_guard_preview_paid_customer() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='UPDATE' and old.source='roomba_preview_paid' and
   (to_jsonb(new)-array['notes','device_notes','device_name','device_type','updated_at']) is distinct from
   (to_jsonb(old)-array['notes','device_notes','device_name','device_type','updated_at']) then raise exception 'verified_preview_customer_immutable'; end if;
 if new.source='roomba_preview_paid' and (new.iptv_password is not null or new.trial<>false or new.payment_status<>'preview_test'
   or new.monthly_price is distinct from 0::numeric or new.renewal_at is not null or new.last_payment_at is not null
   or new.email is not null or new.phone is not null) then raise exception 'preview_customer_has_no_live_billing'; end if;
 return new;
end; $$;
create trigger ks_guard_preview_paid_customer before insert or update on public.iptv_customers
for each row execute function public.ks_guard_preview_paid_customer();

-- Completed Preview orders leave the pending list. Their service/CRM/login binding is retained above.
create or replace function public.ks_list_preview_paid_orders()
returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(item order by queued_at desc,session_id),'[]'::jsonb) from (
 select q.queued_at,q.checkout_session_id as session_id,
 jsonb_build_object('sessionId',r.checkout_session_id,'userId',r.user_id,'testMode',not r.livemode,
 'tier',r.tier,'connections',r.connections,'amountCents',r.amount_cents,'currency',r.currency,
 'receiptDurationDays',r.duration_days,'websiteActivated',r.activated,'orderStatus',q.fulfillment_status,
 'recordedAt',r.recorded_at,'queuedAt',q.queued_at,'accountLabel',coalesce(nullif(p.full_name,''),nullif(p.email,''),'Website account')) as item
 from public.ks_preview_paid_orders q join public.ks_payment_receipts r using(checkout_session_id)
 left join public.profiles p on p.id=r.user_id where q.fulfillment_status='awaiting_activation'
 order by q.queued_at desc,q.checkout_session_id limit 50) saved_orders;
$$;

revoke all on function public.ks_assert_preview_new_customer(uuid) from public,anon,authenticated;
revoke all on function public.ks_guard_preview_dispatch_release() from public,anon,authenticated;
revoke all on function public.ks_begin_approved_preview_provisioning(uuid,uuid,uuid,text,timestamptz,numeric,numeric) from public,anon,authenticated;
revoke all on function public.ks_commit_preview_paid_setup(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.ks_guard_preview_paid_customer() from public,anon,authenticated;
grant execute on function public.ks_assert_preview_new_customer(uuid) to service_role;
grant execute on function public.ks_guard_preview_dispatch_release() to service_role;
grant execute on function public.ks_begin_approved_preview_provisioning(uuid,uuid,uuid,text,timestamptz,numeric,numeric) to service_role;
grant execute on function public.ks_commit_preview_paid_setup(uuid,uuid,text) to service_role;
grant execute on function public.ks_guard_preview_paid_customer() to service_role;
comment on table public.ks_preview_paid_fulfillments is 'Preview-only atomic CRM/order/encrypted-login completion. Does not activate a live website entitlement.';

-- Login handoff cannot be completed independently of its CRM/order transaction.
alter table public.ks_preview_streaming_logins add constraint ks_preview_login_fulfillment_fk
foreign key(attempt_id) references public.ks_preview_paid_fulfillments(attempt_id) on delete restrict;

create or replace function public.ks_queue_preview_paid_order(p_session_id text, p_user_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  receipt public.ks_payment_receipts%rowtype;
  prices integer[];
  days integer;
  inserted integer; saved_status text;
begin
  if p_session_id is null or p_user_id is null then raise exception 'verified_test_receipt_required'; end if;
  select * into receipt from public.ks_payment_receipts where checkout_session_id = p_session_id for update;
  if not found or receipt.user_id is distinct from p_user_id or receipt.livemode is distinct from false
    or receipt.activated is distinct from false or receipt.expires_at is not null
    or receipt.currency is distinct from 'usd' or receipt.connections not between 1 and 5 then
    raise exception 'verified_test_receipt_required';
  end if;
  case receipt.tier
    when 'bronze' then prices := array[2000,3500,5000,6500,8000]; days := 30;
    when 'silver' then prices := array[4500,7500,11000,14000,17500]; days := 90;
    when 'gold' then prices := array[6000,10500,15000,19500,24000]; days := 180;
    when 'platinum' then prices := array[9500,16500,23500,30500,37500]; days := 365;
    else raise exception 'verified_test_receipt_required';
  end case;
  if receipt.amount_cents is distinct from prices[receipt.connections] or receipt.duration_days is distinct from days then
    raise exception 'verified_test_receipt_required';
  end if;
  insert into public.ks_preview_paid_orders(checkout_session_id) values(receipt.checkout_session_id) on conflict do nothing;
  get diagnostics inserted = row_count;
  select fulfillment_status into saved_status from public.ks_preview_paid_orders where checkout_session_id=receipt.checkout_session_id;
  if saved_status='setup_complete' and not exists(select 1 from public.ks_preview_paid_fulfillments f join public.ks_preview_provisioning_attempts a using(attempt_id) join public.ks_preview_streaming_logins l using(attempt_id) where f.checkout_session_id=receipt.checkout_session_id and f.user_id=receipt.user_id and a.state='credentials_ready') then raise exception 'completion_binding_required'; end if;
  return jsonb_build_object('ok',true,'order_status',saved_status,'test_mode',true,'provider_activated',saved_status='setup_complete','replayed',inserted = 0);
end;
$$;
create function public.ks_preview_paid_execution_status() returns jsonb
language sql stable security invoker set search_path='' as $$
select jsonb_build_object('version',1,'atomicCompletion',true,'resellerDispatchLock',true,
 'browserAccessRevoked',not has_table_privilege('anon','public.ks_preview_reseller_dispatches','SELECT')
 and not has_table_privilege('authenticated','public.ks_preview_reseller_dispatches','SELECT')
 and not has_table_privilege('anon','public.ks_preview_paid_fulfillments','SELECT')
 and not has_table_privilege('authenticated','public.ks_preview_paid_fulfillments','SELECT')
 and not has_function_privilege('authenticated','public.ks_commit_preview_paid_setup(uuid,uuid,text)','EXECUTE')
 and not has_function_privilege('anon','public.ks_begin_approved_preview_provisioning(uuid,uuid,uuid,text,timestamptz,numeric,numeric)','EXECUTE'));
$$;
revoke all on function public.ks_preview_paid_execution_status() from public,anon,authenticated;
grant execute on function public.ks_preview_paid_execution_status() to service_role;
