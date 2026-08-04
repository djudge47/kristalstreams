-- Fix admin CRM access for IPTV customer records.
-- This keeps IPTV panel accounts readable only to Donald's admin accounts.

alter table public.iptv_customers enable row level security;

grant select, insert, update, delete on public.iptv_customers to authenticated;

drop policy if exists "Admin can read IPTV customers" on public.iptv_customers;
drop policy if exists "Admin can manage IPTV customers" on public.iptv_customers;

create policy "Admin can read IPTV customers"
on public.iptv_customers
for select
to authenticated
using (
  (auth.jwt() ->> 'email') in (
    'djudge47@gmail.com',
    'djudge47@yahoo.com'
  )
);

create policy "Admin can manage IPTV customers"
on public.iptv_customers
for all
to authenticated
using (
  (auth.jwt() ->> 'email') in (
    'djudge47@gmail.com',
    'djudge47@yahoo.com'
  )
)
with check (
  (auth.jwt() ->> 'email') in (
    'djudge47@gmail.com',
    'djudge47@yahoo.com'
  )
);
