// Minimal read surfaces for disposable tests only. Full paid-renewal tests use
// the actual receipt/completion migrations and add only legacy payment tables.
export const legacyPaymentSupportSql=`
  alter table public.iptv_customers add column updated_at timestamptz not null default now();
  create table public.iptv_payments(id uuid primary key,customer_id uuid references public.iptv_customers(id),amount numeric,payment_method text,payment_status text,paid_at timestamptz,reference text);
  create table public.ks_crm_renewal_payments(payment_id uuid,customer_id uuid,amount_cents int,paid_at timestamptz,months int,connections int);
  grant select on public.iptv_payments,public.ks_crm_renewal_payments to service_role;`;
export const emptyPaidHistorySupportSql=`
  alter table public.iptv_payments add column reference text;
  create table public.ks_paid_renewal_completions(operation_id uuid,checkout_session_id text,user_id uuid,customer_id uuid,new_expiry timestamptz,completed_at timestamptz,connections integer);
  create table public.ks_payment_receipts(checkout_session_id text,user_id uuid,amount_cents bigint,tier text,recorded_at timestamptz,connections integer,livemode boolean,activated boolean,expires_at timestamptz,currency text,payment_intent_id text);
  create table public.ks_setup_order_queue(checkout_session_id text,user_id uuid,livemode boolean,fulfillment_status text);
  create table public.ks_paid_renewal_provider_proofs(operation_id uuid,result_expiry timestamptz);
  create table public.ks_paid_renewal_expectations(operation_id uuid);
  create table public.ks_paid_renewal_send_operations(operation_id uuid,state text,result_expiry timestamptz);
  create table public.ks_paid_renewal_review_bindings(operation_id uuid,user_id uuid,checkout_session_id text,customer_id uuid,binding jsonb);
  grant select on public.ks_paid_renewal_completions,public.ks_payment_receipts,public.ks_setup_order_queue,public.ks_paid_renewal_provider_proofs,
    public.ks_paid_renewal_expectations,public.ks_paid_renewal_send_operations,public.ks_paid_renewal_review_bindings to service_role;`;
