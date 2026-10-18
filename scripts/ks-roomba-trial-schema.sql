-- One controlled Preview trial. No credentials or provider payloads are stored.
create table public.ks_roomba_trial_attempts (
  slot text primary key check (slot = 'preview_trial_activation_v1'),
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  admin_id uuid not null,
  reseller_id text not null,
  package_id text not null check (package_id = '1'),
  username text not null check (username ~ '^[A-Za-z0-9_.-]{3,64}$'),
  state text not null check (state in ('submitting', 'succeeded', 'unknown')),
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (state <> 'succeeded' or (result is not null and jsonb_typeof(result) = 'object'))
);
alter table public.ks_roomba_trial_attempts enable row level security;
revoke all on table public.ks_roomba_trial_attempts from public, anon, authenticated, service_role;
grant select, insert, update on table public.ks_roomba_trial_attempts to service_role;
comment on table public.ks_roomba_trial_attempts is
  'Server-only first-trial guard. Never delete/reset after an ambiguous provider request. No plaintext passwords.';
