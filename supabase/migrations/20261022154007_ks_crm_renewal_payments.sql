-- Receipt-only manual renewal payments. Installation creates no payments.
create table public.ks_crm_renewal_payments(
 id uuid primary key,actor_id uuid not null,customer_id uuid not null references public.iptv_customers(id),
 payment_id uuid not null unique references public.iptv_payments(id),
 months integer not null check(months in (1,3,6,12)),connections integer not null check(connections between 1 and 5),
 catalog_cents integer not null check(catalog_cents>0),amount_cents integer not null check(amount_cents between 1 and 1000000),
 paid_at timestamptz not null,method text not null check(method in ('cash','cash_app','zelle','paypal','venmo','bank_transfer','card_external','other')),
 reference text not null check(length(reference)<=120),adjustment_reason text not null check(length(adjustment_reason)<=300),
 request_hash text not null,recorded_at timestamptz not null default now());
create index ks_crm_renewal_payments_customer_idx on public.ks_crm_renewal_payments(customer_id,recorded_at desc);
alter table public.ks_crm_renewal_payments enable row level security;
revoke all on public.ks_crm_renewal_payments from public,anon,authenticated;
grant select,insert on public.ks_crm_renewal_payments to service_role;
grant insert(id,customer_id,amount,payment_method,payment_status,paid_at,period_start,period_end,reference,notes) on public.iptv_payments to service_role;
grant insert(customer_id,activity_type,title,details) on public.iptv_customer_activity to service_role;

create function public.ks_crm_renewal_payment_status(p_receipt uuid,p_actor uuid)
returns jsonb language sql security invoker set search_path='' as $$
 select jsonb_build_object('receiptId',id,'paymentId',payment_id,'customerId',customer_id,'months',months,'connections',connections,
 'catalogCents',catalog_cents,'amountCents',amount_cents,'paidAt',to_char(paid_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'method',method,'reference',reference,'adjustmentReason',adjustment_reason,'recordedAt',recorded_at,'serviceUpdated',false)
 from public.ks_crm_renewal_payments where id=p_receipt and actor_id=p_actor;
$$;
create function public.ks_crm_renewal_payment_record(p_receipt uuid,p_actor uuid,p_input jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare m integer; n integer; cents integer; catalog integer; at_time timestamptz; customer uuid; old_receipt record; c record; payment uuid; fingerprint text;
begin
 if p_receipt is null or p_actor is null or jsonb_typeof(p_input) is distinct from 'object'
 or (select array_agg(key order by key) from jsonb_object_keys(p_input) key) is distinct from
 array['adjustmentReason','amountCents','catalogCents','connections','customerId','method','months','paidAt','reference']::text[]
 then raise exception 'payment_input_invalid'; end if;
 fingerprint=encode(sha256(convert_to(p_input::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(p_receipt::text,0));
 select actor_id,request_hash into old_receipt from public.ks_crm_renewal_payments where id=p_receipt;
 if found then
  if old_receipt.actor_id<>p_actor or old_receipt.request_hash<>fingerprint then raise exception 'payment_reference_conflict'; end if;
  return public.ks_crm_renewal_payment_status(p_receipt,p_actor);
 end if;
 if coalesce(p_input->>'months','') !~ '^(1|3|6|12)$' or coalesce(p_input->>'connections','') !~ '^[1-5]$'
 or coalesce(p_input->>'amountCents','') !~ '^[1-9][0-9]{0,6}$' or coalesce(p_input->>'catalogCents','') !~ '^[1-9][0-9]{0,6}$'
 or coalesce(p_input->>'customerId','') !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
 or coalesce(p_input->>'paidAt','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$'
 or coalesce(p_input->>'method','') not in ('cash','cash_app','zelle','paypal','venmo','bank_transfer','card_external','other')
 or jsonb_typeof(p_input->'reference') is distinct from 'string' or jsonb_typeof(p_input->'adjustmentReason') is distinct from 'string'
 or length(p_input->>'reference')>120 or length(p_input->>'adjustmentReason')>300
 then raise exception 'payment_input_invalid'; end if;
 m=(p_input->>'months')::integer;n=(p_input->>'connections')::integer;cents=(p_input->>'amountCents')::integer;at_time=(p_input->>'paidAt')::timestamptz;customer=(p_input->>'customerId')::uuid;
 catalog=(case m when 1 then array[2000,3500,5000,6500,8000] when 3 then array[4500,7500,11000,14000,17500]
 when 6 then array[6000,10500,15000,19500,24000] when 12 then array[9500,16500,23500,30500,37500] end)[n];
 if catalog<>(p_input->>'catalogCents')::integer then raise exception 'payment_price_changed'; end if;
 if cents not between 1 and 1000000 or at_time<'2000-01-01T00:00:00Z'::timestamptz or at_time>now()+interval '5 minutes'
 or (cents<>catalog and length(btrim(p_input->>'adjustmentReason'))<3) then raise exception 'payment_input_invalid'; end if;
 select trial,payment_status,source into c from public.iptv_customers where id=customer for update;
 if not found or coalesce(c.trial,false) or coalesce(c.payment_status,'') in ('personal','trial','preview_test')
 or coalesce(c.source,'') in ('roomba_preview_trial','roomba_preview_paid') then raise exception 'payment_customer_excluded'; end if;
 payment=gen_random_uuid();
 insert into public.iptv_payments(id,customer_id,amount,payment_method,payment_status,paid_at,period_start,period_end,reference,notes)
 values(payment,customer,cents::numeric/100,'manual_'||(p_input->>'method'),'paid',at_time,null,null,nullif(p_input->>'reference',''),
 format('Owner-confirmed renewal payment: %s months, %s connections. Website price $%s. XUI service unchanged by this receipt. %s',m,n,catalog::numeric/100,p_input->>'adjustmentReason'));
 insert into public.ks_crm_renewal_payments(id,actor_id,customer_id,payment_id,months,connections,catalog_cents,amount_cents,paid_at,method,reference,adjustment_reason,request_hash)
 values(p_receipt,p_actor,customer,payment,m,n,catalog,cents,at_time,p_input->>'method',p_input->>'reference',p_input->>'adjustmentReason',fingerprint);
 insert into public.iptv_customer_activity(customer_id,activity_type,title,details)
 values(customer,'renewal_payment','Renewal payment recorded — service unchanged',format('Received $%s for requested %s months and %s connections. Receipt %s. No XUI renewal or credit spend.',cents::numeric/100,m,n,p_receipt));
 return public.ks_crm_renewal_payment_status(p_receipt,p_actor);
end; $$;
revoke all on function public.ks_crm_renewal_payment_status(uuid,uuid),public.ks_crm_renewal_payment_record(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.ks_crm_renewal_payment_status(uuid,uuid),public.ks_crm_renewal_payment_record(uuid,uuid,jsonb) to service_role;
