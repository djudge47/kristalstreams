-- STAGED ONLY. Requires the reviewed receipt/queue schema and existing legacy
-- ks_order_email_state table. Do not apply until the complete rollout is ready.
begin;
create table public.ks_pending_order_alerts (
  checkout_session_id text primary key references public.ks_setup_order_queue(checkout_session_id) on delete restrict,
  first_attempt_at timestamptz not null default now(),
  send_payload jsonb not null,
  sent_at timestamptz,
  resend_email_id text,
  check ((sent_at is null) = (resend_email_id is null))
);
alter table public.ks_pending_order_alerts enable row level security;
revoke all on table public.ks_pending_order_alerts from public,anon,authenticated,service_role;
grant select,insert on table public.ks_pending_order_alerts to service_role;
grant update(sent_at,resend_email_id) on table public.ks_pending_order_alerts to service_role;

create function public.ks_guard_pending_order_alert()
returns trigger language plpgsql security invoker set search_path = '' as $guard$
begin
  if tg_op = 'DELETE' then raise exception 'pending_alert_cannot_be_deleted'; end if;
  if (new.checkout_session_id,new.first_attempt_at,new.send_payload)
     is distinct from (old.checkout_session_id,old.first_attempt_at,old.send_payload) then
    raise exception 'pending_alert_payload_is_frozen';
  end if;
  if old.sent_at is not null and (new.sent_at,new.resend_email_id) is distinct from (old.sent_at,old.resend_email_id) then
    raise exception 'pending_alert_delivery_is_final';
  end if;
  return new;
end;
$guard$;
revoke all on function public.ks_guard_pending_order_alert() from public,anon,authenticated;
grant execute on function public.ks_guard_pending_order_alert() to service_role;
create trigger ks_pending_order_alert_guard before update or delete on public.ks_pending_order_alerts
  for each row execute function public.ks_guard_pending_order_alert();

create function public.ks_prepare_pending_order_alert(p_session_id text,p_user_id uuid,p_customer_email text)
returns jsonb language plpgsql security invoker set search_path = '' as $prepare$
declare
  receipt public.ks_payment_receipts%rowtype;
  queued public.ks_setup_order_queue%rowtype;
  alert public.ks_pending_order_alerts%rowtype;
  legacy public.ks_order_email_state%rowtype;
  payload jsonb;
  term text;
begin
  if p_user_id is null or p_customer_email is null or length(p_customer_email) > 254
    or p_customer_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'pending_alert_customer_required';
  end if;
  select * into receipt from public.ks_payment_receipts where checkout_session_id=p_session_id for update;
  if not found or receipt.user_id is distinct from p_user_id then raise exception 'pending_alert_receipt_required'; end if;
  select * into queued from public.ks_setup_order_queue where checkout_session_id=p_session_id for update;
  if not found or
    (queued.payment_intent_id,queued.user_id,queued.livemode,queued.tier,queued.connections,
      queued.duration_days,queued.amount_cents,queued.currency)
    is distinct from
    (receipt.payment_intent_id,receipt.user_id,receipt.livemode,receipt.tier,receipt.connections,
      receipt.duration_days,receipt.amount_cents,receipt.currency) then
    raise exception 'pending_alert_queue_required';
  end if;
  select * into alert from public.ks_pending_order_alerts where checkout_session_id=p_session_id for update;
  if found and alert.sent_at is not null then
    return jsonb_build_object('ok',true,'reference',p_session_id,'test_mode',not receipt.livemode,'status','already_sent');
  end if;
  if receipt.activated or receipt.expires_at is not null or queued.fulfillment_status <> 'awaiting_activation' then
    return jsonb_build_object('ok',true,'reference',p_session_id,'test_mode',not receipt.livemode,'status','requires_review');
  end if;
  -- Preserve prior delivery history during rollout. An old ambiguous send must
  -- not be retried using this new idempotency namespace.
  select * into legacy from public.ks_order_email_state where checkout_session_id=p_session_id;
  if found then
    return jsonb_build_object('ok',true,'reference',p_session_id,'test_mode',not receipt.livemode,
      'status',case when legacy.sent_at is not null then 'legacy_already_sent' else 'requires_review' end);
  end if;
  if alert.checkout_session_id is null then
    term := case receipt.tier when 'bronze' then 'Monthly' when 'silver' then '3 months'
      when 'gold' then '6 months' when 'platinum' then 'Yearly' else null end;
    if term is null then raise exception 'pending_alert_plan_required'; end if;
    payload := jsonb_build_object(
      'from','Kristal Streams <noreply@kristalstream.com>',
      'to',jsonb_build_array('support@kristalstream.com'),
      'reply_to',p_customer_email,
      'subject',case when receipt.livemode then 'PAID ORDER - Setup pending' else 'TEST PAYMENT - Setup pending' end || ' - Kristal Streams - ' || initcap(receipt.tier),
      'text',concat_ws(E'\n',
        case when receipt.livemode then 'Payment received. Streaming setup is pending.'
          else 'SANDBOX TEST: no real Stripe charge was made. Streaming setup is pending.' end,
        'This alert does not confirm streaming activation and does not authorize spending reseller credits.',
        '', 'Customer email: ' || p_customer_email, 'Account ID: ' || receipt.user_id::text,
        'Plan: ' || initcap(receipt.tier) || ' - ' || term, 'Connections ordered: ' || receipt.connections,
        'Amount: USD ' || to_char(receipt.amount_cents::numeric/100,'FM999999990.00'),
        'Checkout session: ' || receipt.checkout_session_id,
        'Payment recorded (UTC): ' || to_char(receipt.recorded_at at time zone 'UTC','YYYY-MM-DD HH24:MI:SS'),
        '', 'Setup was pending when this alert was prepared. Check the saved CRM order for the current result.',
        'Do not create another line or ask the customer to pay again because setup is pending.'
      )
    );
    insert into public.ks_pending_order_alerts(checkout_session_id,send_payload)
      values(p_session_id,payload) returning * into alert;
  end if;
  return jsonb_build_object('ok',true,'reference',p_session_id,'test_mode',not receipt.livemode,
    'status','prepared','first_attempt_at',alert.first_attempt_at,'send_payload',alert.send_payload);
end;
$prepare$;
revoke all on function public.ks_prepare_pending_order_alert(text,uuid,text) from public,anon,authenticated;
grant execute on function public.ks_prepare_pending_order_alert(text,uuid,text) to service_role;

create function public.ks_complete_pending_order_alert(p_session_id text,p_email_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $complete$
declare
  alert public.ks_pending_order_alerts%rowtype;
begin
  if p_email_id is null or length(p_email_id)>200 or p_email_id !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'pending_alert_delivery_required';
  end if;
  select * into alert from public.ks_pending_order_alerts where checkout_session_id=p_session_id for update;
  if not found then raise exception 'prepared_pending_alert_required'; end if;
  if alert.sent_at is not null then
    if alert.resend_email_id is distinct from p_email_id then raise exception 'pending_alert_delivery_conflict'; end if;
  else
    update public.ks_pending_order_alerts set sent_at=now(),resend_email_id=p_email_id
      where checkout_session_id=p_session_id returning * into alert;
  end if;
  return jsonb_build_object('ok',true,'reference',p_session_id,'status','sent');
end;
$complete$;
revoke all on function public.ks_complete_pending_order_alert(text,text) from public,anon,authenticated;
grant execute on function public.ks_complete_pending_order_alert(text,text) to service_role;
commit;
