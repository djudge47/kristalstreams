-- Run after schema installation, before linking the real saved trial.
-- All fixture writes and links are rolled back, including deliberate failures.
begin;
set local role service_role;
do $$
declare
  receipt public.ks_roomba_trial_attempts%rowtype;
  linked jsonb;
  repeated jsonb;
  customer public.iptv_customers%rowtype;
begin
  select * into receipt from public.ks_roomba_trial_attempts
    where slot = 'preview_trial_activation_v1' for update;
  assert receipt.state = 'succeeded' and receipt.crm_customer_id is null,
    'This test requires the verified, not-yet-linked trial.';

  begin
    perform public.ks_link_roomba_trial_to_crm('00000000-0000-4000-8000-000000000000');
    raise exception 'wrong administrator was accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'verified_trial_required' then raise; end if;
  end;
  begin
    update public.ks_roomba_trial_attempts set state = 'unknown' where slot = receipt.slot;
    perform public.ks_link_roomba_trial_to_crm(receipt.admin_id);
    raise exception 'unknown provider result was accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'verified_trial_required' then raise; end if;
  end;
  begin
    update public.ks_roomba_trial_attempts set result = result || '{"connections":2}'::jsonb where slot = receipt.slot;
    perform public.ks_link_roomba_trial_to_crm(receipt.admin_id);
    raise exception 'invalid trial allowance was accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'invalid_trial_receipt' then raise; end if;
  end;
  begin
    insert into public.iptv_customers(external_id,username,source)
      values((receipt.result->>'lineId')::bigint, 'synthetic_conflict', 'rolled_back_test');
    perform public.ks_link_roomba_trial_to_crm(receipt.admin_id);
    raise exception 'existing customer identity was overwritten';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'crm_identity_conflict' then raise; end if;
  end;

  linked := public.ks_link_roomba_trial_to_crm(receipt.admin_id);
  repeated := public.ks_link_roomba_trial_to_crm(receipt.admin_id);
  assert linked->>'ok' = 'true' and linked->>'replayed' = 'false';
  assert repeated->>'customerId' = linked->>'customerId' and repeated->>'replayed' = 'true';
  select * into customer from public.iptv_customers where id = (linked->>'customerId')::uuid;
  assert customer.username = receipt.username and customer.external_id = (receipt.result->>'lineId')::bigint;
  assert customer.expiration_at = (receipt.result->>'expiresAt')::timestamptz;
  assert customer.trial and customer.connections_allowed = 1 and customer.payment_status = 'trial';
  assert customer.monthly_price = 0 and customer.iptv_password is null and customer.last_payment_at is null;
  assert customer.email is null and customer.renewal_at is null;
  assert (select count(*) from public.iptv_customers where external_id = customer.external_id) = 1;
  assert (select count(*) from public.iptv_customer_activity where customer_id = customer.id and activity_type = 'roomba_setup_linked') = 1;
  assert (select count(*) from public.iptv_payments where customer_id = customer.id) = 0;
  begin
    delete from public.iptv_customers where id = customer.id;
    raise exception 'linked customer audit record was deleted';
  exception when foreign_key_violation then null;
  end;
end $$;
rollback;
select
  (select crm_customer_id is null from public.ks_roomba_trial_attempts where slot = 'preview_trial_activation_v1') as test_rolled_back,
  has_function_privilege('anon','public.ks_link_roomba_trial_to_crm(uuid)','execute') as anon_can_link,
  has_function_privilege('authenticated','public.ks_link_roomba_trial_to_crm(uuid)','execute') as browser_can_link,
  has_function_privilege('service_role','public.ks_link_roomba_trial_to_crm(uuid)','execute') as server_can_link,
  (select prosecdef from pg_proc where oid = 'public.ks_link_roomba_trial_to_crm(uuid)'::regprocedure) as security_definer;
