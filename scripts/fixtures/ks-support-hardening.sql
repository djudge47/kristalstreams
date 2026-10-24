create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean default false);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.user',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('email',current_setting('request.email',true))$$;
 grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid(),auth.jwt() to anon,authenticated;
 create table public.profiles(id uuid primary key references auth.users(id),email text not null default '',full_name text,
 subscription_tier text not null default 'basic',subscription_status text not null default 'inactive',connections_allowed int not null default 1,
 active_connections int not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 subscription_expires_at timestamptz,stripe_checkout_session_id text,stripe_payment_intent_id text,notifications_enabled boolean not null default false);
 alter table public.profiles enable row level security;
 create policy "Users can view their profile" on public.profiles for select to authenticated using(id=auth.uid() or auth.jwt()->>'email'='djudge47@gmail.com');
 create policy "Users can update their profile" on public.profiles for update to authenticated using(id=auth.uid() or auth.jwt()->>'email'='djudge47@gmail.com') with check(id=auth.uid() or auth.jwt()->>'email'='djudge47@gmail.com');
 create policy "Users can create their profile" on public.profiles for insert to authenticated with check(id=auth.uid());
 create table public.support_tickets(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),subject text not null,description text not null,
 category text not null default 'Other',priority text not null default 'normal',status text not null default 'open',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 source text not null default 'contact_form',customer_name text,customer_email text,message text not null default '',reply_to text,resend_email_id text,raw_payload jsonb not null default '{}');
 create table public.ticket_replies(id uuid primary key default gen_random_uuid(),ticket_id uuid not null references public.support_tickets(id),user_id uuid not null references auth.users(id),message text not null,is_staff boolean not null default false,created_at timestamptz not null default now());
 alter table public.support_tickets enable row level security;alter table public.ticket_replies enable row level security;
 create policy tickets_read on public.support_tickets for select to authenticated using(user_id=auth.uid() or auth.jwt()->>'email'='djudge47@gmail.com');
 create policy tickets_update on public.support_tickets for update to authenticated using(user_id=auth.uid() or auth.jwt()->>'email'='djudge47@gmail.com') with check(user_id=auth.uid() or auth.jwt()->>'email'='djudge47@gmail.com');
 create policy "Anon can create contact tickets" on public.support_tickets for insert to anon with check(true);
 create policy "Authenticated can create support tickets" on public.support_tickets for insert to authenticated with check(true);
 create policy replies_read on public.ticket_replies for select to authenticated using(exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.user_id=auth.uid() or auth.jwt()->>'email'='djudge47@gmail.com')));
 create policy replies_insert on public.ticket_replies for insert to authenticated with check(user_id=auth.uid() and not is_staff and exists(select 1 from public.support_tickets t where t.id=ticket_id and t.user_id=auth.uid()));
 grant all on public.profiles,public.support_tickets,public.ticket_replies to anon,authenticated,service_role;
 grant update(subscription_tier) on public.profiles to authenticated;
 create table public.unrelated_service(id int,enabled boolean);insert into public.unrelated_service values(1,false);
