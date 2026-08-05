create table if not exists public.iptv_payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.iptv_customers(id) on delete cascade,
  amount numeric(10,2) not null default 0,
  payment_method text not null default 'manual',
  payment_status text not null default 'paid',
  paid_at timestamptz not null default now(),
  period_start timestamptz,
  period_end timestamptz,
  reference text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.iptv_customer_activity (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.iptv_customers(id) on delete cascade,
  activity_type text not null,
  title text not null,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists public.iptv_reminder_queue (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.iptv_customers(id) on delete cascade,
  channel text not null check (channel in ('email','sms','manual')),
  reminder_type text not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists iptv_payments_customer_paid_idx on public.iptv_payments(customer_id, paid_at desc);
create index if not exists iptv_activity_customer_created_idx on public.iptv_customer_activity(customer_id, created_at desc);
create index if not exists iptv_reminders_schedule_idx on public.iptv_reminder_queue(status, scheduled_for);

create or replace function public.log_iptv_customer_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status = 'paid'
     and (old.payment_status is distinct from 'paid' or old.last_payment_at is distinct from new.last_payment_at) then
    insert into public.iptv_payments (
      customer_id, amount, payment_method, payment_status, paid_at, period_start, period_end, notes
    ) values (
      new.id,
      coalesce(new.monthly_price, 0),
      'manual',
      'paid',
      coalesce(new.last_payment_at, now()),
      coalesce(old.renewal_at, now()),
      new.renewal_at,
      'Recorded from Kristal Streams CRM'
    );

    insert into public.iptv_customer_activity (customer_id, activity_type, title, details)
    values (
      new.id,
      'payment',
      'Payment recorded',
      concat('Payment of $', coalesce(new.monthly_price, 0), ' recorded. Next renewal: ', coalesce(new.renewal_at::text, 'not set'))
    );
  end if;

  if old.renewal_at is distinct from new.renewal_at then
    insert into public.iptv_customer_activity (customer_id, activity_type, title, details)
    values (new.id, 'renewal', 'Renewal date updated', concat('Renewal changed to ', coalesce(new.renewal_at::text, 'not set')));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_log_iptv_customer_payment on public.iptv_customers;
create trigger trg_log_iptv_customer_payment
after update on public.iptv_customers
for each row execute function public.log_iptv_customer_payment();

create or replace view public.iptv_crm_kpis as
select
  count(*)::integer as total_customers,
  count(*) filter (where account_status = 'active')::integer as active_customers,
  count(*) filter (where online)::integer as online_now,
  count(*) filter (where trial)::integer as trial_customers,
  count(*) filter (where payment_status is distinct from 'paid')::integer as unpaid_customers,
  count(*) filter (where renewal_at >= now() and renewal_at < now() + interval '7 days')::integer as renewals_next_7_days,
  coalesce(sum(monthly_price) filter (where account_status = 'active'), 0)::numeric(10,2) as monthly_recurring_revenue
from public.iptv_customers;
