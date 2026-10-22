-- Private, explicitly approved identity links. Installing this creates no links.
create table public.ks_crm_portal_links (
  customer_id uuid primary key references public.iptv_customers(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  email_at_link text not null,
  confirmed_at_link timestamptz not null,
  external_id bigint not null,
  linked_by uuid not null references auth.users(id) on delete restrict,
  linked_at timestamptz not null default now()
);
create index ks_crm_portal_links_user_idx on public.ks_crm_portal_links(user_id);
alter table public.ks_crm_portal_links enable row level security;
revoke all on public.ks_crm_portal_links from public, anon, authenticated;
grant select, insert on public.ks_crm_portal_links to service_role;
grant usage on schema auth to service_role;
grant select(id,email,email_confirmed_at,is_anonymous) on auth.users to service_role;

create function public.ks_crm_portal_link_review(p_customer uuid, p_email text, p_actor uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c record; u record; existing record;
begin
  if not exists(select 1 from auth.users where id=p_actor and lower(email)='djudge47@gmail.com'
    and email_confirmed_at is not null and is_anonymous is not true) then raise exception 'portal_admin_required'; end if;
  if p_email is null or length(p_email)>254 or p_email<>lower(btrim(p_email)) or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    then raise exception 'portal_account_unavailable'; end if;
  select id,external_id,username,customer_name,source,payment_status into c from public.iptv_customers where id=p_customer for share;
  if not found or coalesce(c.source,'') like 'roomba_preview%' or c.payment_status='preview_test' then raise exception 'portal_customer_unavailable'; end if;
  if (select count(*) from auth.users where lower(btrim(email))=p_email)<>1 then raise exception 'portal_account_unavailable'; end if;
  select id,email,email_confirmed_at,is_anonymous into u from auth.users where lower(btrim(email))=p_email;
  if u.id is null or u.email_confirmed_at is null or u.is_anonymous is true then raise exception 'portal_account_unavailable'; end if;
  select user_id,email_at_link,confirmed_at_link,external_id into existing from public.ks_crm_portal_links where customer_id=p_customer;
  if found and (existing.user_id<>u.id or existing.email_at_link<>p_email or existing.confirmed_at_link<>u.email_confirmed_at or existing.external_id<>c.external_id)
    then raise exception 'portal_link_conflict'; end if;
  return jsonb_build_object('customerId',c.id,'panelId',c.external_id,'username',c.username,'customerName',c.customer_name,
    'userId',u.id,'email',p_email,'emailConfirmedAt',u.email_confirmed_at,'linked',existing.user_id is not null);
end; $$;

create function public.ks_crm_portal_link_save(p_customer uuid,p_user uuid,p_email text,p_confirmed_at timestamptz,p_panel bigint,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare reviewed jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_customer::text,0));
  reviewed=public.ks_crm_portal_link_review(p_customer,p_email,p_actor);
  if (reviewed->>'userId')::uuid is distinct from p_user or (reviewed->>'panelId')::bigint is distinct from p_panel
    or (reviewed->>'emailConfirmedAt')::timestamptz is distinct from p_confirmed_at then raise exception 'portal_review_changed'; end if;
  insert into public.ks_crm_portal_links(customer_id,user_id,email_at_link,confirmed_at_link,external_id,linked_by)
    values(p_customer,p_user,p_email,p_confirmed_at,p_panel,p_actor) on conflict(customer_id) do nothing;
  return reviewed || jsonb_build_object('linked',true);
end; $$;

-- Scope every read to a confirmed Auth UUID and the immutable admin-approved
-- link, never an editable profile email/name or a caller-selected customer ID.
create function public.ks_client_crm_snapshot(p_user uuid,p_email text,p_before_at timestamptz default null,p_before_id uuid default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with owned as materialized (
    select c.id,c.username,c.customer_name,c.package_name,c.connections_allowed,c.expiration_at,c.account_status,c.payment_status,c.updated_at
    from public.ks_crm_portal_links l join auth.users u on u.id=l.user_id
    join public.iptv_customers c on c.id=l.customer_id and c.external_id=l.external_id
    where l.user_id=p_user and l.email_at_link=p_email and lower(btrim(u.email))=p_email
      and u.email_confirmed_at=l.confirmed_at_link and u.is_anonymous is not true
      and coalesce(c.source,'') not like 'roomba_preview%' and c.payment_status is distinct from 'preview_test'
  ), page as materialized (
    select p.id,p.customer_id,p.amount,p.payment_method,p.paid_at,r.months,r.connections
    from public.iptv_payments p join owned c on c.id=p.customer_id
    left join public.ks_crm_renewal_payments r on r.payment_id=p.id and r.customer_id=p.customer_id
      and r.amount_cents=p.amount*100 and r.paid_at=p.paid_at
    where p.payment_status='paid' and p.amount>0
      and ((p_before_at is null and p_before_id is null) or (p.paid_at,p.id)<(p_before_at,p_before_id))
    order by p.paid_at desc,p.id desc limit 201
  ) select jsonb_build_object(
    'accountId',p_user,'checkedAt',now(),
    'services',coalesce((select jsonb_agg(jsonb_build_object('customerId',id,'username',username,'name',customer_name,
      'packageName',package_name,'connections',connections_allowed,'expiresAt',expiration_at,'savedStatus',account_status,
      'legacyPaid',coalesce(payment_status='legacy_paid',false),'updatedAt',updated_at) order by id) from owned),'[]'::jsonb),
    'payments',coalesce((select jsonb_agg(jsonb_build_object('id',id,'customerId',customer_id,'amountCents',(amount*100)::bigint,
      'method',payment_method,'paidAt',paid_at,'months',months,'connections',connections) order by paid_at desc,id desc) from page),'[]'::jsonb)
  );
$$;
revoke all on function public.ks_crm_portal_link_review(uuid,text,uuid),
  public.ks_crm_portal_link_save(uuid,uuid,text,timestamptz,bigint,uuid),
  public.ks_client_crm_snapshot(uuid,text,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.ks_crm_portal_link_review(uuid,text,uuid),
  public.ks_crm_portal_link_save(uuid,uuid,text,timestamptz,bigint,uuid),
  public.ks_client_crm_snapshot(uuid,text,timestamptz,uuid) to service_role;
