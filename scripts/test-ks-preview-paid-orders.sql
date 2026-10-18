-- Transactional integration test. No synthetic payment or queue row is retained.
begin;
set local role service_role;
do $$
declare
  owner_id uuid;
  before_profile jsonb;
  result jsonb;
  repeat_result jsonb;
  first_time timestamptz;
  original_customers bigint;
  original_payments bigint;
begin
  select user_id into owner_id from public.ks_payment_receipts where not livemode limit 1;
  if owner_id is null then raise exception 'An existing test receipt is required'; end if;
  select to_jsonb(p) into before_profile from public.profiles p where id=owner_id;
  select count(*) into original_customers from public.iptv_customers;
  select count(*) into original_payments from public.iptv_payments;
  perform public.ks_apply_paid_checkout('cs_test_ksPendingIntegration','pi_ksPendingIntegration',owner_id,false,'bronze',1,30,2000,'usd');
  begin
    perform public.ks_queue_preview_paid_order('cs_test_missingReceipt',owner_id);
    raise exception 'Missing receipt was accepted';
  exception when raise_exception then if sqlerrm <> 'verified_test_receipt_required' then raise; end if; end;
  begin
    perform public.ks_queue_preview_paid_order('cs_test_ksPendingIntegration','00000000-0000-4000-8000-000000000099');
    raise exception 'Wrong owner was accepted';
  exception when raise_exception then if sqlerrm <> 'verified_test_receipt_required' then raise; end if; end;
  insert into public.ks_payment_receipts(checkout_session_id,payment_intent_id,user_id,livemode,tier,connections,duration_days,amount_cents,currency)
    values('cs_live_ksPendingIntegration','pi_ksPendingLiveIntegration',owner_id,true,'bronze',1,30,2000,'usd');
  begin
    perform public.ks_queue_preview_paid_order('cs_live_ksPendingIntegration',owner_id);
    raise exception 'Live receipt was accepted';
  exception when raise_exception then if sqlerrm <> 'verified_test_receipt_required' then raise; end if; end;
  insert into public.ks_payment_receipts(checkout_session_id,payment_intent_id,user_id,livemode,tier,connections,duration_days,amount_cents,currency)
    values('cs_test_ksUnderpaymentIntegration','pi_ksUnderpaymentIntegration',owner_id,false,'bronze',5,30,2000,'usd');
  begin
    perform public.ks_queue_preview_paid_order('cs_test_ksUnderpaymentIntegration',owner_id);
    raise exception 'Underpaid receipt was accepted';
  exception when raise_exception then if sqlerrm <> 'verified_test_receipt_required' then raise; end if; end;
  result := public.ks_queue_preview_paid_order('cs_test_ksPendingIntegration',owner_id);
  select queued_at into first_time from public.ks_preview_paid_orders where checkout_session_id='cs_test_ksPendingIntegration';
  repeat_result := public.ks_queue_preview_paid_order('cs_test_ksPendingIntegration',owner_id);
  if result->>'order_status' <> 'awaiting_activation' or result->>'provider_activated' <> 'false'
    or result->>'replayed' <> 'false' or repeat_result->>'replayed' <> 'true' then raise exception 'Queue result invalid'; end if;
  if (select count(*) from public.ks_preview_paid_orders where checkout_session_id='cs_test_ksPendingIntegration') <> 1
    or (select queued_at from public.ks_preview_paid_orders where checkout_session_id='cs_test_ksPendingIntegration') is distinct from first_time then raise exception 'Queue replay duplicated or changed the order'; end if;
  if (select to_jsonb(p) from public.profiles p where id=owner_id) is distinct from before_profile
    or (select count(*) from public.iptv_customers) <> original_customers
    or (select count(*) from public.iptv_payments) <> original_payments then raise exception 'Unrelated customer or profile changed'; end if;
  if not exists(select 1 from jsonb_array_elements(public.ks_list_preview_paid_orders()) x where x->>'sessionId'='cs_test_ksPendingIntegration') then raise exception 'Queued payment missing from list'; end if;
end;
$$;
rollback;
select jsonb_build_object('rolled_back',true,
  'browser_can_read',has_table_privilege('authenticated','public.ks_preview_paid_orders','SELECT'),
  'anon_can_queue',has_function_privilege('anon','public.ks_queue_preview_paid_order(text,uuid)','EXECUTE'),
  'browser_can_queue',has_function_privilege('authenticated','public.ks_queue_preview_paid_order(text,uuid)','EXECUTE'),
  'browser_can_list',has_function_privilege('authenticated','public.ks_list_preview_paid_orders()','EXECUTE'),
  'server_can_delete',has_table_privilege('service_role','public.ks_preview_paid_orders','DELETE'),
  'security_definer',(select bool_or(prosecdef) from pg_proc where oid in ('public.ks_queue_preview_paid_order(text,uuid)'::regprocedure,'public.ks_list_preview_paid_orders()'::regprocedure)));
