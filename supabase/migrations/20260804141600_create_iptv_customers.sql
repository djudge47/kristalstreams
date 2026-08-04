-- IPTV customer import table for Kristal Streams admin CRM.
-- This is separate from public.profiles because these are IPTV service accounts,
-- not necessarily Supabase login users.

create table if not exists public.iptv_customers (
  id uuid primary key default gen_random_uuid(),
  external_id bigint not null unique,
  username text not null,
  iptv_password text,
  owner text,
  account_status text not null default 'active',
  online boolean not null default false,
  trial boolean not null default false,
  active_connections integer not null default 0,
  connections_allowed integer not null default 1,
  expiration_at timestamptz,
  last_connection_at timestamptz,
  last_connection_label text,
  last_channel text,
  source text not null default 'panel_screenshot_import',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists iptv_customers_username_idx
on public.iptv_customers (username);

create index if not exists iptv_customers_owner_idx
on public.iptv_customers (owner);

create index if not exists iptv_customers_account_status_idx
on public.iptv_customers (account_status);

create index if not exists iptv_customers_expiration_at_idx
on public.iptv_customers (expiration_at);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists iptv_customers_set_updated_at on public.iptv_customers;

create trigger iptv_customers_set_updated_at
before update on public.iptv_customers
for each row
execute function public.set_updated_at();

alter table public.iptv_customers enable row level security;

drop policy if exists "Admin can read IPTV customers" on public.iptv_customers;

create policy "Admin can read IPTV customers"
on public.iptv_customers
for select
to authenticated
using ((auth.jwt() ->> 'email') = 'djudge47@gmail.com');

drop policy if exists "Admin can manage IPTV customers" on public.iptv_customers;

create policy "Admin can manage IPTV customers"
on public.iptv_customers
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'djudge47@gmail.com')
with check ((auth.jwt() ->> 'email') = 'djudge47@gmail.com');

insert into public.iptv_customers (
  external_id,
  username,
  iptv_password,
  owner,
  account_status,
  online,
  trial,
  active_connections,
  connections_allowed,
  expiration_at,
  last_connection_at,
  last_connection_label,
  last_channel
) values
  (3015348, 'fdjudge57', 'Felsug893', 'donaldj9528', 'expired', false, false, 0, 1, '2026-07-15 22:57:49+00', null, 'Never', null),
  (2572531, 'Tim.Johnson', 'Allgood2250', 'donaldj9528', 'active', true, false, 1, 1, '2027-08-04 17:46:37+00', null, 'Online: 11m 17s', 'USA ESPN HD'),
  (2167040, 'Kevin.Allen', 'Kaleigh1', 'donaldj9528', 'active', false, false, 0, 3, '2026-12-13 16:04:31+00', '2026-08-02 02:51:02+00', '2026-08-02 02:51:02', null),
  (1546288, 'RickyAllen', 'squeezer990', 'donaldj9528', 'active', false, false, 0, 2, '2027-02-06 16:12:11+00', '2026-03-08 04:08:12+00', '2026-03-08 04:08:12', null),
  (1524319, 'MonteCozzens', 'Ravens23', 'donaldj9528', 'active', false, false, 0, 4, '2026-12-16 21:17:07+00', '2026-08-01 20:38:08+00', '2026-08-01 20:38:08', null),
  (1522763, 'RonaldGooch', 'MNmVDx4bvT', 'donaldj9528', 'active', false, false, 0, 1, '2027-01-29 12:44:58+00', '2026-07-19 18:28:20+00', '2026-07-19 18:28:20', null),
  (1464143, 'MannyRose', 'Tryout12', 'donaldj9528', 'active', false, false, 0, 1, '2026-12-29 21:54:02+00', '2026-08-03 00:40:47+00', '2026-08-03 00:40:47', null),
  (1460432, 'KentPhelps', 'gAUsMUyGjC', 'donaldj9528', 'active', false, false, 0, 2, '2026-12-26 17:04:06+00', '2026-07-31 22:58:06+00', '2026-07-31 22:58:06', null),
  (1424947, 'Nachelle27', 'Torey0320', 'donaldj9528', 'active', false, false, 0, 1, '2026-12-07 17:30:06+00', '2026-08-02 23:36:32+00', '2026-08-02 23:36:32', null),
  (1365435, 'Mojo4464', '2392maxwell', 'donaldj9528', 'active', true, false, 1, 3, '2026-11-07 08:08:49+00', null, 'Online: 8m 48s', 'USA ABC 6 WSYX COLUMBUS'),
  (1295642, 'scoreone4u2', 'Starkey1812', 'donaldj9528', 'active', false, false, 0, 1, '2026-12-02 16:58:00+00', '2026-08-03 15:39:37+00', '2026-08-03 15:39:37', null),
  (1263076, 'Nick1018', 'Sasso3136', 'donaldj9528', 'active', true, false, 1, 1, '2026-09-17 12:18:40+00', null, 'Online: 4h 10m 33s', 'USA BET HER'),
  (1261888, 'grob0313774', 'Jpschion', 'donaldj9528', 'active', false, false, 0, 1, '2026-12-19 12:11:48+00', '2026-08-01 21:48:06+00', '2026-08-01 21:48:06', null),
  (1174472, 'EdwardHL', 'A0718yah', 'donaldj9528', 'active', false, false, 0, 4, '2026-09-09 18:11:23+00', '2026-07-28 22:30:05+00', '2026-07-28 22:30:05', null),
  (1020687, 'Shebacat', 'Duckie3939', 'donaldj9528', 'expired', false, false, 0, 1, '2026-05-13 16:55:40+00', '2026-02-28 11:08:48+00', '2026-02-28 11:08:48', null),
  (918807, 'Ashes1224', 'Pimpin1958', 'donaldj9528', 'active', true, false, 1, 2, '2027-03-07 09:08:03+00', null, 'Online: 3h 5m 26s', 'MS | Columbus | CBS WCBI'),
  (707020, 'don.judge', 'Shareshow1977', 'donaldj9528', 'active', false, false, 0, 4, '2026-10-28 13:36:18+00', '2026-08-04 02:43:02+00', '2026-08-04 02:43:02', null)
on conflict (external_id) do update set
  username = excluded.username,
  iptv_password = excluded.iptv_password,
  owner = excluded.owner,
  account_status = excluded.account_status,
  online = excluded.online,
  trial = excluded.trial,
  active_connections = excluded.active_connections,
  connections_allowed = excluded.connections_allowed,
  expiration_at = excluded.expiration_at,
  last_connection_at = excluded.last_connection_at,
  last_connection_label = excluded.last_connection_label,
  last_channel = excluded.last_channel,
  updated_at = now();
