begin;

create table public.ks_order_email_state (
  checkout_session_id text primary key references public.ks_payment_receipts(checkout_session_id),
  first_attempt_at timestamptz not null default now(),
  send_payload jsonb not null,
  sent_at timestamptz,
  resend_email_id text
);
alter table public.ks_order_email_state enable row level security;
revoke all on public.ks_order_email_state from public, anon, authenticated;
grant select, insert, update on public.ks_order_email_state to service_role;

create function public.ks_prepare_order_email(p_session_id text, p_customer_email text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  receipt public.ks_payment_receipts%rowtype;
  notification public.ks_order_email_state%rowtype;
  email_body jsonb;
  subject_line text;
  message_body text;
begin
  if p_customer_email is null or p_customer_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Customer email is unavailable';
  end if;

  select * into receipt from public.ks_payment_receipts
  where checkout_session_id = p_session_id for update;
  if not found then raise exception 'Confirmed payment receipt not found'; end if;
  if receipt.livemode and not receipt.activated then
    raise exception 'Live payment has not finished account activation';
  end if;

  select * into notification from public.ks_order_email_state
  where checkout_session_id = p_session_id;

  if not found then
    subject_line := case when receipt.livemode
      then 'PAID ORDER - Kristal Streams - ' || initcap(receipt.tier)
      else 'TEST ORDER - Kristal Streams - No customer setup needed' end;
    message_body := concat_ws(E'\n',
      case when receipt.livemode then 'A customer payment was confirmed. Manual streaming setup is required.'
        else 'This is a SANDBOX TEST. No real charge was made. Do not create a customer line.' end,
      '',
      'Customer email: ' || p_customer_email,
      'Account ID: ' || receipt.user_id::text,
      'Plan: ' || initcap(receipt.tier),
      'Connections: ' || receipt.connections::text,
      'Access duration: ' || receipt.duration_days::text || ' days',
      'Amount: USD ' || to_char(receipt.amount_cents::numeric / 100, 'FM999999990.00'),
      'Checkout session: ' || receipt.checkout_session_id,
      'Payment intent: ' || receipt.payment_intent_id,
      'Receipt recorded (UTC): ' || to_char(receipt.recorded_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
      '',
      case when receipt.livemode
        then 'Next: create the streaming line in the reseller panel and deliver credentials to this customer. The website account was updated; reseller provisioning is manual.'
        else 'Next: confirm this test alert arrived in Zoho and triggered your phone notification.' end
    );
    email_body := jsonb_build_object(
      'from', 'Kristal Streams <noreply@kristalstream.com>',
      'to', jsonb_build_array('support@kristalstream.com'),
      'reply_to', p_customer_email,
      'subject', subject_line,
      'text', message_body
    );
    insert into public.ks_order_email_state(checkout_session_id, send_payload)
    values (p_session_id, email_body) returning * into notification;
  end if;

  return jsonb_build_object(
    'session_id', receipt.checkout_session_id,
    'test_mode', not receipt.livemode,
    'first_attempt_at', notification.first_attempt_at,
    'sent_at', notification.sent_at,
    'send_payload', notification.send_payload
  );
end;
$$;
revoke all on function public.ks_prepare_order_email(text,text) from public, anon, authenticated;
grant execute on function public.ks_prepare_order_email(text,text) to service_role;

commit;
