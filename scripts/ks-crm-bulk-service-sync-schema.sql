-- CRM-only review ledger. No provider action, payment or customer DML on install.
create table public.ks_crm_service_sync_batches (
  id uuid primary key,
  actor_id uuid not null,
  customer_ids uuid[] not null check (cardinality(customer_ids) between 1 and 200),
  state text not null default 'reviewing' check (state in ('reviewing','review_ready','applied')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '2 hours',
  applied_at timestamptz,
  applied_count integer not null default 0
);
create table public.ks_crm_service_sync_items (
  batch_id uuid not null references public.ks_crm_service_sync_batches(id) on delete cascade,
  customer_id uuid not null,
  line_id bigint not null,
  username text not null,
  source text not null,
  expected_updated_at timestamptz not null,
  before_values jsonb not null,
  after_values jsonb,
  checked_at timestamptz,
  state text not null default 'pending' check (state in ('pending','ready','matched','blocked','failed')),
  reason text,
  primary key(batch_id,customer_id)
);
alter table public.ks_crm_service_sync_batches enable row level security;
alter table public.ks_crm_service_sync_items enable row level security;
revoke all on public.ks_crm_service_sync_batches,public.ks_crm_service_sync_items from public,anon,authenticated;
grant select,insert,update on public.ks_crm_service_sync_batches,public.ks_crm_service_sync_items to service_role;

create function public.ks_crm_service_sync_status(p_batch uuid,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare b record; result jsonb;
begin
  select id,state,expires_at,applied_at,applied_count,customer_ids into b
    from public.ks_crm_service_sync_batches where id=p_batch and actor_id=p_actor;
  if not found then raise exception 'sync_batch_not_found'; end if;
  select jsonb_build_object('batchId',b.id,'state',b.state,'expiresAt',b.expires_at,
    'appliedAt',b.applied_at,'appliedCount',b.applied_count,'total',cardinality(b.customer_ids),
    'items',coalesce(jsonb_agg(jsonb_build_object('customerId',customer_id,'panelId',line_id::text,
      'username',username,'before',before_values,'after',after_values,'checkedAt',checked_at,
      'state',state,'reason',reason) order by username,customer_id),'[]'::jsonb)) into result
    from public.ks_crm_service_sync_items where batch_id=p_batch;
  return result;
end; $$;

create function public.ks_crm_service_sync_create(p_batch uuid,p_actor uuid,p_customers uuid[])
returns jsonb language plpgsql security invoker set search_path='' as $$
declare ids uuid[]; existing record; n integer;
begin
  if p_batch is null or p_actor is null or p_customers is null or cardinality(p_customers) not between 1 and 200
    or array_position(p_customers,null) is not null then raise exception 'invalid_sync_manifest'; end if;
  select array_agg(distinct v order by v) into ids from unnest(p_customers) v;
  if cardinality(ids)<>cardinality(p_customers) then raise exception 'duplicate_sync_identity'; end if;
  -- Serialize create/recovery for the same owner-supplied batch UUID.
  perform pg_advisory_xact_lock(hashtextextended(p_batch::text,0));
  select actor_id,customer_ids into existing from public.ks_crm_service_sync_batches where id=p_batch;
  if found then
    if existing.actor_id<>p_actor or existing.customer_ids<>ids then raise exception 'sync_manifest_conflict'; end if;
    return public.ks_crm_service_sync_status(p_batch,p_actor);
  end if;
  select count(*) into n from public.iptv_customers where id=any(ids)
    and external_id>0 and external_id<1000000000000000 and username ~ '^[A-Za-z0-9_.-]{3,64}$';
  if n<>cardinality(ids) then raise exception 'invalid_sync_identity'; end if;
  if exists(select 1 from public.iptv_customers where id=any(ids) group by external_id having count(*)>1)
    or exists(select 1 from public.iptv_customers where id=any(ids) group by lower(username) having count(*)>1)
    then raise exception 'duplicate_sync_identity'; end if;
  insert into public.ks_crm_service_sync_batches(id,actor_id,customer_ids) values(p_batch,p_actor,ids);
  insert into public.ks_crm_service_sync_items(batch_id,customer_id,line_id,username,source,expected_updated_at,before_values)
    select p_batch,id,external_id,username,source,updated_at,jsonb_build_object('package_name',package_name,
      'connections_allowed',connections_allowed,'expiration_at',expiration_at,'account_status',account_status,'trial',trial)
    from public.iptv_customers where id=any(ids);
  return public.ks_crm_service_sync_status(p_batch,p_actor);
end; $$;

create function public.ks_crm_service_sync_review(p_batch uuid,p_actor uuid,p_customer uuid,p_values jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare b record; i record; c record; proposed jsonb; expiry timestamptz; checked timestamptz;
  next_state text; why text; conn integer; pkg text; service_state text;
begin
  select state,expires_at into b from public.ks_crm_service_sync_batches where id=p_batch and actor_id=p_actor for update;
  if not found then raise exception 'sync_batch_not_found'; end if;
  if b.state='applied' then return public.ks_crm_service_sync_status(p_batch,p_actor); end if;
  if now()>=b.expires_at then raise exception 'sync_review_expired'; end if;
  select line_id,username,source,expected_updated_at,before_values,state into i
    from public.ks_crm_service_sync_items where batch_id=p_batch and customer_id=p_customer;
  if not found then raise exception 'sync_customer_not_in_manifest'; end if;
  if i.state<>'pending' then return public.ks_crm_service_sync_status(p_batch,p_actor); end if;
  if jsonb_typeof(p_values)<>'object' or p_values is null then raise exception 'invalid_sync_evidence'; end if;
  if p_values ? 'failure' then
    if (select count(*) from jsonb_object_keys(p_values))<>1 or p_values->>'failure' is null or p_values->>'failure' not in ('read_failed','identity_changed')
      then raise exception 'invalid_sync_evidence'; end if;
    next_state:='failed'; why:=p_values->>'failure';
  else
    if (select count(*) from jsonb_object_keys(p_values))<>9 or not p_values ?& array[
      'lineId','username','packageName','expiresAt','connectionsAllowed','trial','enabled','adminEnabled','checkedAt']
      or p_values->>'lineId' is distinct from i.line_id::text or p_values->>'username' is distinct from i.username
      or jsonb_typeof(p_values->'connectionsAllowed')<>'number'
      or jsonb_typeof(p_values->'trial')<>'boolean' or jsonb_typeof(p_values->'enabled')<>'boolean'
      or jsonb_typeof(p_values->'adminEnabled')<>'boolean'
      or (p_values->>'expiresAt') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$'
      or (p_values->>'checkedAt') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$'
      then raise exception 'invalid_sync_evidence'; end if;
    expiry:=(p_values->>'expiresAt')::timestamptz; checked:=(p_values->>'checkedAt')::timestamptz;
    conn:=(p_values->>'connectionsAllowed')::integer; pkg:=p_values->>'packageName';
    if not isfinite(expiry) or not isfinite(checked) or expiry is null or checked is null
      or checked>now()+interval '5 seconds' or checked<now()-interval '5 minutes'
      or conn not between 1 and 32 then raise exception 'invalid_sync_evidence'; end if;
    select external_id,username,updated_at,source,trial into c from public.iptv_customers where id=p_customer;
    if not found or c.external_id<>i.line_id or c.username<>i.username or c.updated_at<>i.expected_updated_at then
      next_state:='blocked'; why:='crm_changed';
    elsif pkg is null or btrim(pkg)='' or length(pkg)>160 or pkg ~ '[[:cntrl:]]' then
      next_state:='blocked'; why:='package_unverified';
    elsif (p_values->>'trial')::boolean is distinct from c.trial then
      next_state:='blocked'; why:='trial_classification_changed';
    else
      service_state:=case when expiry<=now() then 'expired'
        when not (p_values->>'enabled')::boolean or not (p_values->>'adminEnabled')::boolean then 'suspended' else 'active' end;
      proposed:=jsonb_build_object('package_name',pkg,'connections_allowed',conn,'expiration_at',expiry,
        'account_status',service_state,'trial',c.trial);
      if proposed=i.before_values then next_state:='matched';
      elsif c.source='roomba_preview_paid' then next_state:='blocked'; why:='protected_preview_account';
      else next_state:='ready'; end if;
    end if;
  end if;
  update public.ks_crm_service_sync_items set state=next_state,reason=why,after_values=proposed,checked_at=checked
    where batch_id=p_batch and customer_id=p_customer;
  if not exists(select 1 from public.ks_crm_service_sync_items where batch_id=p_batch and state='pending') then
    update public.ks_crm_service_sync_batches set state='review_ready' where id=p_batch;
  end if;
  return public.ks_crm_service_sync_status(p_batch,p_actor);
end; $$;

create function public.ks_crm_service_sync_apply(p_batch uuid,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare b record; i record; c record; billing_before jsonb; billing_after jsonb; n integer:=0; payments_before bigint;
begin
  select state,expires_at,customer_ids into b from public.ks_crm_service_sync_batches where id=p_batch and actor_id=p_actor for update;
  if not found then raise exception 'sync_batch_not_found'; end if;
  if b.state='applied' then return public.ks_crm_service_sync_status(p_batch,p_actor); end if;
  if now()>=b.expires_at then raise exception 'sync_review_expired'; end if;
  if b.state<>'review_ready' or exists(select 1 from public.ks_crm_service_sync_items where batch_id=p_batch and state='pending')
    or (select count(*) from public.ks_crm_service_sync_items where batch_id=p_batch)<>cardinality(b.customer_ids)
    then raise exception 'sync_review_incomplete'; end if;
  -- Deterministic customer locks; every update and audit entry is one transaction.
  for i in select customer_id,line_id,username,source,expected_updated_at,after_values,checked_at
    from public.ks_crm_service_sync_items where batch_id=p_batch and state='ready' order by customer_id loop
    select external_id,username,source,updated_at,trial,payment_status,monthly_price,last_payment_at,renewal_at into c
      from public.iptv_customers where id=i.customer_id for update;
    if not found or c.external_id<>i.line_id or c.username<>i.username or c.source<>i.source
      or c.updated_at<>i.expected_updated_at or c.source='roomba_preview_paid'
      or c.trial is distinct from (i.after_values->>'trial')::boolean
      or i.checked_at is null or i.checked_at<now()-interval '2 hours' then raise exception 'sync_crm_conflict'; end if;
    if i.after_values->>'account_status'='active' and (i.after_values->>'expiration_at')::timestamptz<=now() then raise exception 'sync_review_expired'; end if;
    billing_before:=jsonb_build_object('payment_status',c.payment_status,'monthly_price',c.monthly_price,
      'last_payment_at',c.last_payment_at,'renewal_at',c.renewal_at);
    select count(*) into payments_before from public.iptv_payments where customer_id=i.customer_id;
    update public.iptv_customers set package_name=i.after_values->>'package_name',
      connections_allowed=(i.after_values->>'connections_allowed')::integer,
      expiration_at=(i.after_values->>'expiration_at')::timestamptz,
      account_status=i.after_values->>'account_status' where id=i.customer_id;
    select jsonb_build_object('payment_status',payment_status,'monthly_price',monthly_price,
      'last_payment_at',last_payment_at,'renewal_at',renewal_at) into billing_after
      from public.iptv_customers where id=i.customer_id;
    if billing_after is distinct from billing_before or (select count(*) from public.iptv_payments where customer_id=i.customer_id)<>payments_before
      then raise exception 'sync_billing_changed'; end if;
    insert into public.iptv_customer_activity(customer_id,activity_type,title,details)
      values(i.customer_id,'crm_bulk_service_sync','XUI service details reconciled in CRM',
        'CRM-only batch '||p_batch::text||'. XUI checked at '||i.checked_at::text||'. Verified service fields: '||i.after_values::text||'. Billing and provider service unchanged.');
    n:=n+1;
  end loop;
  update public.ks_crm_service_sync_batches set state='applied',applied_at=now(),applied_count=n where id=p_batch;
  return public.ks_crm_service_sync_status(p_batch,p_actor);
end; $$;

revoke all on function public.ks_crm_service_sync_status(uuid,uuid) from public,anon,authenticated;
revoke all on function public.ks_crm_service_sync_create(uuid,uuid,uuid[]) from public,anon,authenticated;
revoke all on function public.ks_crm_service_sync_review(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.ks_crm_service_sync_apply(uuid,uuid) from public,anon,authenticated;
grant execute on function public.ks_crm_service_sync_status(uuid,uuid) to service_role;
grant execute on function public.ks_crm_service_sync_create(uuid,uuid,uuid[]) to service_role;
grant execute on function public.ks_crm_service_sync_review(uuid,uuid,uuid,jsonb) to service_role;
grant execute on function public.ks_crm_service_sync_apply(uuid,uuid) to service_role;
