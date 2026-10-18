-- Private Preview order queue. Does not change payment receipt/profile fulfillment.
create table public.ks_preview_paid_orders (
  checkout_session_id text primary key references public.ks_payment_receipts(checkout_session_id) on delete restrict,
  fulfillment_status text not null default 'awaiting_activation' check (fulfillment_status = 'awaiting_activation'),
  queued_at timestamptz not null default now()
);
create index ks_preview_paid_orders_queued_at_idx on public.ks_preview_paid_orders (queued_at desc, checkout_session_id);
alter table public.ks_preview_paid_orders enable row level security;
revoke all on table public.ks_preview_paid_orders from public, anon, authenticated, service_role;
grant select, insert on table public.ks_preview_paid_orders to service_role;
comment on table public.ks_preview_paid_orders is 'Server-only sandbox payment queue. No activation, customer line, password or automatic customer merge.';

create function public.ks_queue_preview_paid_order(p_session_id text, p_user_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  receipt public.ks_payment_receipts%rowtype;
  prices integer[];
  days integer;
  inserted integer;
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
  return jsonb_build_object('ok',true,'order_status','awaiting_activation','test_mode',true,'provider_activated',false,'replayed',inserted = 0);
end;
$$;
revoke all on function public.ks_queue_preview_paid_order(text,uuid) from public, anon, authenticated;
grant execute on function public.ks_queue_preview_paid_order(text,uuid) to service_role;

create function public.ks_list_preview_paid_orders()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(item order by queued_at desc, session_id),'[]'::jsonb) from (
    select q.queued_at, q.checkout_session_id as session_id,
      jsonb_build_object('sessionId',r.checkout_session_id,'userId',r.user_id,'testMode',not r.livemode,
        'tier',r.tier,'connections',r.connections,'amountCents',r.amount_cents,'currency',r.currency,
        'receiptDurationDays',r.duration_days,'websiteActivated',r.activated,'orderStatus',q.fulfillment_status,
        'recordedAt',r.recorded_at,'queuedAt',q.queued_at,
        'accountLabel',coalesce(nullif(p.full_name,''),nullif(p.email,''),'Website account')) as item
    from public.ks_preview_paid_orders q
    join public.ks_payment_receipts r on r.checkout_session_id = q.checkout_session_id
    left join public.profiles p on p.id = r.user_id
    order by q.queued_at desc,q.checkout_session_id limit 50
  ) saved_orders;
$$;
revoke all on function public.ks_list_preview_paid_orders() from public, anon, authenticated;
grant execute on function public.ks_list_preview_paid_orders() to service_role;
