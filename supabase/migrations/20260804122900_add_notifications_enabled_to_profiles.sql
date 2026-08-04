-- Adds a notification preference flag used by the client settings page.
-- Safe to run more than once.

alter table public.profiles
add column if not exists notifications_enabled boolean not null default false;

create index if not exists profiles_notifications_enabled_idx
on public.profiles (notifications_enabled);
