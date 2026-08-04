-- Adds the subscription fields Kristal Streams needs after Stripe checkout.
-- Safe to run more than once because every column/index uses IF NOT EXISTS where supported.

alter table public.profiles
add column if not exists subscription_tier text not null default 'bronze';

alter table public.profiles
add column if not exists subscription_status text not null default 'inactive';

alter table public.profiles
add column if not exists connections_allowed integer not null default 1;

alter table public.profiles
add column if not exists active_connections integer not null default 0;

alter table public.profiles
add column if not exists subscription_expires_at timestamptz;

alter table public.profiles
add column if not exists stripe_checkout_session_id text;

alter table public.profiles
add column if not exists stripe_payment_intent_id text;

alter table public.profiles
add column if not exists updated_at timestamptz not null default now();

-- Helpful indexes for client/admin lookups.
create index if not exists profiles_subscription_status_idx
on public.profiles (subscription_status);

create index if not exists profiles_subscription_tier_idx
on public.profiles (subscription_tier);

create index if not exists profiles_stripe_checkout_session_id_idx
on public.profiles (stripe_checkout_session_id);

-- Keeps updated_at fresh when profile rows change.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Optional guardrails so bad counts do not get stored.
alter table public.profiles
drop constraint if exists profiles_connections_allowed_range;

alter table public.profiles
add constraint profiles_connections_allowed_range
check (connections_allowed between 1 and 5);

alter table public.profiles
drop constraint if exists profiles_active_connections_nonnegative;

alter table public.profiles
add constraint profiles_active_connections_nonnegative
check (active_connections >= 0);

-- Make sure active connections cannot exceed the plan allowance.
alter table public.profiles
drop constraint if exists profiles_active_connections_within_allowed;

alter table public.profiles
add constraint profiles_active_connections_within_allowed
check (active_connections <= connections_allowed);
