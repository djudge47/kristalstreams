-- Prepared only: apply to the active Kristal Stream project after release review.
begin;

-- Browser profile edits cannot change billing, entitlement or identity fields.
revoke insert,update,delete,truncate,references,trigger on public.profiles from public,anon,authenticated;
revoke select on public.profiles from public,anon;
revoke insert(id,email,full_name,subscription_tier,subscription_status,connections_allowed,active_connections,created_at,updated_at,subscription_expires_at,stripe_checkout_session_id,stripe_payment_intent_id,notifications_enabled),
 update(id,email,full_name,subscription_tier,subscription_status,connections_allowed,active_connections,created_at,updated_at,subscription_expires_at,stripe_checkout_session_id,stripe_payment_intent_id,notifications_enabled),
 references(id,email,full_name,subscription_tier,subscription_status,connections_allowed,active_connections,created_at,updated_at,subscription_expires_at,stripe_checkout_session_id,stripe_payment_intent_id,notifications_enabled)
 on public.profiles from public,anon,authenticated;
grant select on public.profiles to authenticated;
grant insert(id,email,full_name),update(full_name,notifications_enabled) on public.profiles to authenticated;
-- Older dashboard builds supply these same safe defaults on missing-profile
-- recovery. INSERT policy pins them; UPDATE of these columns remains denied.
grant insert(subscription_tier,subscription_status,connections_allowed,active_connections) on public.profiles to authenticated;
drop policy if exists "Users can create their profile" on public.profiles;
create policy "Users can create their profile" on public.profiles for insert to authenticated
 with check (id=(select auth.uid()) and lower(email)=lower((select auth.jwt())->>'email')
  and subscription_tier='basic' and subscription_status='inactive' and connections_allowed=1 and active_connections=0
  and subscription_expires_at is null and stripe_checkout_session_id is null and stripe_payment_intent_id is null);

-- Public contact records have no Auth owner. Only the server creates those rows.
alter table public.support_tickets alter column user_id drop not null;
revoke insert,update,delete,truncate,references,trigger on public.support_tickets from public,anon,authenticated;
drop policy if exists "Anon can create contact tickets" on public.support_tickets;
drop policy if exists "Authenticated can create support tickets" on public.support_tickets;
create policy "Authenticated can create support tickets" on public.support_tickets for insert to authenticated
 with check (user_id=(select auth.uid()));
grant insert(user_id,subject,description,category,priority,status),update(status,priority,updated_at)
 on public.support_tickets to authenticated;

alter table public.ticket_replies add column if not exists delivery_status text not null default 'not_requested'
 check(delivery_status in ('not_requested','sending','sent','failed','unknown'));
revoke insert,update,delete,truncate,references,trigger on public.ticket_replies from public,anon,authenticated;
grant insert(ticket_id,user_id,message,is_staff) on public.ticket_replies to authenticated;

create table public.ks_support_dispatches (
 request_id uuid primary key,
 kind text not null check(kind in ('contact','support','ticket_reply','welcome','newsletter')),
 actor_id uuid references auth.users(id) on delete restrict,
 ticket_id uuid references public.support_tickets(id) on delete restrict,
 fingerprint text not null,
 email_hash text not null,
 state text not null default 'sending' check(state in ('sending','sent','failed','unknown')),
 created_at timestamptz not null default now(),
 finished_at timestamptz,
 provider_id text
);
create index ks_support_dispatches_created on public.ks_support_dispatches(created_at);
create index ks_support_dispatches_actor on public.ks_support_dispatches(actor_id,created_at);
create index ks_support_dispatches_email on public.ks_support_dispatches(email_hash,created_at);
create index ks_support_dispatches_ticket on public.ks_support_dispatches(ticket_id);
alter table public.ks_support_dispatches enable row level security;
revoke all on public.ks_support_dispatches from public,anon,authenticated;
grant select,insert,update on public.ks_support_dispatches to service_role;
grant select,insert,update on public.support_tickets,public.ticket_replies to service_role;
grant usage on schema auth to service_role;
grant select(id,email,email_confirmed_at,is_anonymous) on auth.users to service_role;

create function public.ks_support_reserve(p_id uuid,p_kind text,p_actor uuid,p_ticket uuid,p_email text,p_name text,p_subject text,p_message text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 u record;t record;existing public.ks_support_dispatches%rowtype;
 email text;name text;subject text;message text;fingerprint text;v_email_hash text;
 ticket uuid;recipient text;reply_to text;hour_start timestamptz:=now()-interval '1 hour';
begin
 if current_setting('transaction_isolation')<>'read committed' then raise exception 'support_read_committed_required';end if;
 if p_id is null or p_kind is null or p_kind not in ('contact','support','ticket_reply','welcome','newsletter') then raise exception 'support_invalid_request';end if;
 if p_kind<>'contact' then
  select id,lower(btrim(a.email)) as email from auth.users a where a.id=p_actor and a.email_confirmed_at is not null and not coalesce(a.is_anonymous,false) into u;
  if not found then raise exception 'support_confirmed_account_required';end if;
 end if;
 if p_kind='ticket_reply' then
  if u.email<>'djudge47@gmail.com' then raise exception 'support_admin_required';end if;
  select s.id,s.user_id,s.customer_email,s.customer_name,s.subject from public.support_tickets s where s.id=p_ticket into t;
  if not found then raise exception 'support_ticket_unavailable';end if;
  if t.user_id is not null then
   select lower(btrim(a.email)) from auth.users a where a.id=t.user_id and a.email_confirmed_at is not null and not coalesce(a.is_anonymous,false) into email;
  else email:=lower(btrim(t.customer_email));end if;
  recipient:=email;reply_to:=null;name:=left(coalesce(t.customer_name,'Customer'),120);subject:='Re: '||left(t.subject,196);message:=p_message;ticket:=t.id;
 elsif p_kind='contact' then
  if p_actor is not null or p_ticket is not null then raise exception 'support_invalid_request';end if;
  email:=lower(btrim(p_email));name:=p_name;subject:=p_subject;message:=p_message;reply_to:=email;
 else
  if p_ticket is not null or p_email is distinct from u.email then raise exception 'support_account_mismatch';end if;
  email:=u.email;name:='Customer';
  if p_kind='support' then subject:=p_subject;message:=p_message;reply_to:=email;
  elsif p_kind='welcome' then recipient:=email;subject:='Welcome to Kristal Streams';message:='Your website account email is confirmed. Streaming service and payment status are shown separately in your account.';
  else recipient:=email;subject:='Kristal Streams newsletter request';message:='Your request to receive Kristal Streams updates has been recorded. This is not a purchase or streaming activation confirmation.';end if;
 end if;
 if email is null or length(email)>254 or email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  or coalesce(length(name),0)>120 or coalesce(length(subject),0) not between 1 and 200
  or coalesce(length(message),0) not between 1 and 8000 or subject ~ '[\r\n]' then raise exception 'support_invalid_request';end if;
 fingerprint:=encode(sha256(convert_to(jsonb_build_array(p_kind,p_actor,p_ticket,email,name,subject,message)::text,'UTF8')),'hex');
 v_email_hash:=encode(sha256(convert_to(email,'UTF8')),'hex');
 -- A single atomic reservation serializes the bounded global and per-owner quotas.
 perform pg_advisory_xact_lock(8264102201);
 select d.* from public.ks_support_dispatches d where d.request_id=p_id into existing;
 if found then
  if existing.fingerprint<>fingerprint then raise exception 'support_request_changed';end if;
  return jsonb_build_object('dispatch',false,'requestId',p_id,'ticketId',existing.ticket_id,'state',existing.state);
 end if;
 if (select count(*) from public.ks_support_dispatches d where d.created_at>=hour_start)>=100
  or (p_kind='contact' and (select count(*) from public.ks_support_dispatches d where d.kind='contact' and d.created_at>=hour_start)>=30)
  or (p_kind='contact' and (select count(*) from public.ks_support_dispatches d where d.kind='contact' and d.email_hash=v_email_hash and d.created_at>=hour_start)>=3)
  or (p_actor is not null and (select count(*) from public.ks_support_dispatches d where d.actor_id=p_actor and d.created_at>=hour_start)>=20)
 then raise exception 'support_rate_limited';end if;
 if p_kind in ('contact','support') then
  ticket:=p_id;
  insert into public.support_tickets(id,user_id,subject,description,category,priority,status,source,customer_name,customer_email,message,reply_to)
   values(ticket,case when p_kind='contact' then null else p_actor end,subject,message,'Website Contact','normal','open',case when p_kind='contact' then 'contact_form' else 'portal_support' end,name,email,message,email);
 elsif p_kind='ticket_reply' then
  insert into public.ticket_replies(id,ticket_id,user_id,message,is_staff,delivery_status) values(p_id,ticket,p_actor,message,true,'sending');
 end if;
 insert into public.ks_support_dispatches(request_id,kind,actor_id,ticket_id,fingerprint,email_hash) values(p_id,p_kind,p_actor,ticket,fingerprint,v_email_hash);
 return jsonb_build_object('dispatch',true,'requestId',p_id,'ticketId',ticket,'state','sending','recipient',recipient,'replyTo',reply_to,'subject',subject,'message',message);
end;$$;

create function public.ks_support_finish(p_id uuid,p_state text,p_provider text default null)
returns void language plpgsql security invoker set search_path='' as $$
declare d public.ks_support_dispatches%rowtype;
begin
 if p_state not in ('sent','failed','unknown') or p_state is null or length(coalesce(p_provider,''))>200 then raise exception 'support_invalid_result';end if;
 select * from public.ks_support_dispatches where request_id=p_id for update into d;
 if not found then raise exception 'support_request_unavailable';end if;
 if d.state<>'sending' then
  if d.state=p_state and d.provider_id is not distinct from p_provider then return;end if;
  raise exception 'support_result_conflict';
 end if;
 update public.ks_support_dispatches set state=p_state,provider_id=p_provider,finished_at=now() where request_id=p_id;
 if d.kind='ticket_reply' then
  update public.ticket_replies set delivery_status=p_state where id=p_id and ticket_id=d.ticket_id and user_id=d.actor_id and is_staff;
  if p_state='sent' then update public.support_tickets set status='pending',updated_at=now() where id=d.ticket_id;end if;
 elsif d.kind in ('contact','support') and p_state='sent' then
  update public.support_tickets set resend_email_id=p_provider where id=d.ticket_id;
 end if;
end;$$;
revoke all on function public.ks_support_reserve(uuid,text,uuid,uuid,text,text,text,text),public.ks_support_finish(uuid,text,text) from public,anon,authenticated;
grant execute on function public.ks_support_reserve(uuid,text,uuid,uuid,text,text,text,text),public.ks_support_finish(uuid,text,text) to service_role;
create function public.ks_support_ready() returns boolean language sql security invoker set search_path='' as $$select true$$;
revoke all on function public.ks_support_ready() from public,anon,authenticated;
grant execute on function public.ks_support_ready() to service_role;
commit;
