create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'contact_form',
  customer_name text,
  customer_email text,
  subject text not null default 'Contact Form Submission',
  message text not null default '',
  status text not null default 'open' check (status in ('unread', 'open', 'pending', 'resolved', 'closed')),
  priority text not null default 'normal',
  category text not null default 'Website Contact',
  reply_to text,
  resend_email_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_created_at_idx on public.support_tickets (created_at desc);
create index if not exists support_tickets_status_idx on public.support_tickets (status);
create index if not exists support_tickets_customer_email_idx on public.support_tickets (customer_email);

alter table public.support_tickets enable row level security;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row
execute function public.set_updated_at();

drop policy if exists "Admin can read support tickets" on public.support_tickets;
create policy "Admin can read support tickets"
on public.support_tickets
for select
to authenticated
using ((auth.jwt() ->> 'email') = 'djudge47@gmail.com');

drop policy if exists "Admin can update support tickets" on public.support_tickets;
create policy "Admin can update support tickets"
on public.support_tickets
for update
to authenticated
using ((auth.jwt() ->> 'email') = 'djudge47@gmail.com')
with check ((auth.jwt() ->> 'email') = 'djudge47@gmail.com');
