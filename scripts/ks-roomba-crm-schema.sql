-- Link the existing verified Preview trial to one CRM record. No provider call.
alter table public.ks_roomba_trial_attempts
  add column crm_customer_id uuid references public.iptv_customers(id) on delete restrict,
  add column crm_linked_at timestamptz;

create unique index ks_roomba_trial_crm_customer_idx
  on public.ks_roomba_trial_attempts(crm_customer_id) where crm_customer_id is not null;

create function public.ks_link_roomba_trial_to_crm(p_admin_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  receipt public.ks_roomba_trial_attempts%rowtype;
  customer public.iptv_customers%rowtype;
  line_id bigint;
  expires_at timestamptz;
  new_customer_id uuid;
begin
  -- Serialize repeats before checking/creating the customer and activity rows.
  select * into receipt from public.ks_roomba_trial_attempts
    where slot = 'preview_trial_activation_v1' for update;
  if not found or receipt.state <> 'succeeded' or receipt.admin_id <> p_admin_id
    or p_admin_id is null then
    raise exception using errcode = 'P0001', message = 'verified_trial_required';
  end if;
  if receipt.package_id <> '1'
    or coalesce(receipt.result->>'trial', '') <> 'true'
    or coalesce(receipt.result->>'connections', '') <> '1'
    or coalesce(receipt.result->>'username', '') <> receipt.username
    or coalesce(receipt.result->>'lineId', '') !~ '^[1-9][0-9]{0,14}$'
    or coalesce(receipt.result->>'expiresAt', '') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' then
    raise exception using errcode = 'P0001', message = 'invalid_trial_receipt';
  end if;
  line_id := (receipt.result->>'lineId')::bigint;
  begin
    expires_at := (receipt.result->>'expiresAt')::timestamptz;
  exception when others then
    raise exception using errcode = 'P0001', message = 'invalid_trial_receipt';
  end;

  if receipt.crm_customer_id is not null then
    select * into customer from public.iptv_customers where id = receipt.crm_customer_id;
    if not found or customer.external_id <> line_id or customer.username <> receipt.username then
      raise exception using errcode = 'P0001', message = 'crm_identity_conflict';
    end if;
    return jsonb_build_object('ok', true, 'customerId', customer.id, 'replayed', true);
  end if;

  -- Never merge by username, overwrite an imported customer, or manufacture a payment.
  if exists(select 1 from public.iptv_customers where external_id = line_id or username = receipt.username) then
    raise exception using errcode = 'P0001', message = 'crm_identity_conflict';
  end if;
  insert into public.iptv_customers (
    external_id, username, customer_name, package_name, trial,
    connections_allowed, expiration_at, renewal_at, monthly_price,
    payment_status, account_status, source
  ) values (
    line_id, receipt.username, 'Private portal trial', 'Trial · 36 hours', true,
    1, expires_at, null, 0, 'trial',
    case when expires_at <= now() then 'expired' else 'active' end,
    'roomba_preview_trial'
  ) returning id into new_customer_id;

  update public.ks_roomba_trial_attempts set crm_customer_id = new_customer_id, crm_linked_at = now()
    where slot = receipt.slot;
  insert into public.iptv_customer_activity(customer_id, activity_type, title, details)
    values(new_customer_id, 'roomba_setup_linked', 'Verified Roomba trial linked',
      'Existing 36-hour, one-connection trial linked from its confirmed provider receipt. No payment or new provider action.');
  return jsonb_build_object('ok', true, 'customerId', new_customer_id, 'replayed', false);
end;
$$;
revoke all on function public.ks_link_roomba_trial_to_crm(uuid) from public, anon, authenticated;
grant execute on function public.ks_link_roomba_trial_to_crm(uuid) to service_role;
comment on function public.ks_link_roomba_trial_to_crm(uuid) is
  'Server-only, idempotent CRM link from the existing verified trial. API verifies administrator and Preview environment.';
