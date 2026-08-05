alter table if exists public.iptv_customers
  add column if not exists customer_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists package_name text,
  add column if not exists monthly_price numeric(10,2) default 0,
  add column if not exists payment_status text default 'unpaid',
  add column if not exists last_payment_at timestamptz,
  add column if not exists renewal_at timestamptz,
  add column if not exists device_name text,
  add column if not exists device_type text,
  add column if not exists device_notes text,
  add column if not exists notes text,
  add column if not exists xui_line_url text;

create index if not exists iptv_customers_renewal_at_idx
  on public.iptv_customers (renewal_at);

create index if not exists iptv_customers_payment_status_idx
  on public.iptv_customers (payment_status);

create index if not exists iptv_customers_customer_name_idx
  on public.iptv_customers (customer_name);

comment on column public.iptv_customers.iptv_password is
  'Sensitive IPTV credential. Display masked by default and restrict access to authorized administrators.';
