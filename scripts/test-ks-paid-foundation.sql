-- Synthetic rows only, rolled back. Existing user IDs are kept inside the transaction and never returned.
begin;
do $test$
declare
  owners uuid[]; a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid();
  approver uuid; token_a uuid; token_b uuid; result jsonb; failed boolean;
  envelope jsonb:=jsonb_build_object('version',1,'keyId','synthetic','iv',repeat('A',16),'tag',repeat('A',22)||'==','ciphertext',repeat('A',64));
begin
  select array_agg(id) into owners from (select id from auth.users u where u.email_confirmed_at is not null and u.is_anonymous=false and not exists(select 1 from public.ks_roomba_trial_attempts t where t.admin_id=u.id) order by id limit 2) eligible;
  assert cardinality(owners)=2,'two existing fixture owners required';
  select id into approver from auth.users where lower(email)='djudge47@gmail.com' and email_confirmed_at is not null;
  assert approver is not null,'confirmed administrator required';
  -- Temporary fixture eligibility only; all profile updates roll back with this transaction.
  update public.profiles set subscription_status='inactive',active_connections=0,subscription_expires_at=null where id=any(owners);
  insert into public.ks_payment_receipts(checkout_session_id,payment_intent_id,user_id,livemode,tier,connections,duration_days,amount_cents,currency,activated)
    values('cs_test_DurableFixtureA','pi_DurableFixtureA',owners[1],false,'bronze',1,30,2000,'usd',false),
      ('cs_test_DurableFixtureB','pi_DurableFixtureB',owners[2],false,'bronze',1,30,2000,'usd',false),
      ('cs_test_DurableFixtureC','pi_DurableFixtureC',owners[2],false,'bronze',1,30,2000,'usd',false);
  insert into public.ks_preview_paid_orders(checkout_session_id) values('cs_test_DurableFixtureA'),('cs_test_DurableFixtureB'),('cs_test_DurableFixtureC');
  perform set_config('role','service_role',true);
  failed:=false;
  begin
    perform public.ks_reserve_preview_provisioning(a,'cs_test_DurableFixtureA',owners[1],repeat('a',64),'99998','90001',1,1,1,array[13,14],envelope,repeat('b',64));
  exception when others then failed:=sqlerrm='new_customer_review_required'; end;
  assert failed,'new customer confirmation required';
  result:=public.ks_reserve_preview_provisioning(a,'cs_test_DurableFixtureA',owners[1],repeat('a',64),'99998','90001',1,1,1,array[13,14],envelope,repeat('b',64),true);
  assert result->>'fresh'='true' and result->>'state'='reserved','fresh durable reservation'; token_a:=(result->>'claimToken')::uuid;
  result:=public.ks_reserve_preview_provisioning(gen_random_uuid(),'cs_test_DurableFixtureA',owners[1],repeat('a',64),'99998','90001',1,1,1,array[13,14],envelope,repeat('b',64),true);
  assert result->>'fresh'='false' and (result->>'attemptId')::uuid=a and (result->>'claimToken')::uuid=token_a,'durable replay';
  failed:=false;
  begin perform public.ks_reserve_preview_provisioning(c,'cs_test_DurableFixtureA',owners[2],repeat('a',64),'99998','90001',1,1,1,array[13,14],envelope,repeat('b',64),true);
  exception when others then failed:=sqlerrm='verified_pending_test_receipt_required'; end;
  assert failed,'wrong owner rejected';
  failed:=false;
  begin perform public.ks_reserve_preview_provisioning(c,'cs_test_DurableFixtureA',owners[1],repeat('c',64),'99998','90001',1,1,1,array[13,14],envelope,repeat('b',64),true);
  exception when others then failed:=sqlerrm='attempt_binding_changed'; end;
  assert failed,'changed binding rejected';
  failed:=false;
  begin perform public.ks_begin_preview_provisioning(a,token_a); exception when others then failed:=sqlerrm='use_bounded_preview_credit_approval'; end;
  assert failed,'legacy unapproved dispatch is disabled';
  failed:=false;
  begin perform public.ks_begin_approved_preview_provisioning(a,token_a,approver,repeat('a',64),now()+interval '119 seconds',1,100000000); exception when others then failed:=sqlerrm='bounded_credit_approval_required'; end;
  assert failed,'wrong approved cost cannot dispatch';
  assert public.ks_begin_approved_preview_provisioning(a,token_a,approver,repeat('a',64),now()+interval '119 seconds',1000000,100000000),'one dispatch claim';
  -- A different customer cannot overlap a paid dispatch on the same reseller.
  failed:=false;
  begin
    result:=public.ks_reserve_preview_provisioning(b,'cs_test_DurableFixtureB',owners[2],repeat('d',64),'99998','90001',1,1,1,array[13,14],envelope,encode(extensions.digest('ks_synthetic_fixture','sha256'),'hex'),true);
    token_b:=(result->>'claimToken')::uuid;
    assert not public.ks_begin_approved_preview_provisioning(b,token_b,approver,repeat('a',64),now()+interval '119 seconds',1000000,100000000),'reseller-wide concurrency guard';
    raise exception 'synthetic_block_rollback';
  exception when others then failed:=sqlerrm='synthetic_block_rollback'; end;
  assert failed,'global dispatch test rolled back';

  assert not public.ks_begin_approved_preview_provisioning(a,token_a,approver,repeat('a',64),now()+interval '119 seconds',1000000,100000000),'no second dispatch across calls';
  failed:=false;
  begin perform public.ks_complete_preview_login(a,token_a); exception when others then failed:=sqlerrm='provider_verification_required'; end;
  assert failed,'cannot hand off before provider verification';
  assert public.ks_reconcile_preview_provisioning(a,token_a),'ambiguous send persists';
  assert not public.ks_begin_approved_preview_provisioning(a,token_a,approver,repeat('a',64),now()+interval '119 seconds',1000000,100000000),'reconciliation cannot dispatch';
  assert not public.ks_reconcile_preview_provisioning(a,token_a),'reconciliation replay';
  failed:=false;
  begin update public.ks_preview_provisioning_attempts set state='reserved' where attempt_id=a;
  exception when others then failed:=sqlerrm='invalid_attempt_transition'; end;
  assert failed,'state cannot be reset';
  result:=public.ks_reserve_preview_provisioning(b,'cs_test_DurableFixtureB',owners[2],repeat('d',64),'99999','90001',1,1,1,array[13,14],envelope,encode(extensions.digest('ks_synthetic_fixture','sha256'),'hex'),true);
  token_b:=(result->>'claimToken')::uuid;
  assert public.ks_begin_approved_preview_provisioning(b,token_b,approver,repeat('a',64),now()+interval '119 seconds',1000000,100000000),'second owner dispatch';
  failed:=false;
  begin perform public.ks_record_preview_provider_result(b,token_b,'9999001','99999','90001',encode(extensions.digest('ks_synthetic_fixture','sha256'),'hex'),5,array[13,14],now()+interval '1 month');
  exception when others then failed:=sqlerrm='provider_result_requires_review'; end;
  assert failed,'wrong provider allowance rejected';
  failed:=false;
  begin perform public.ks_record_preview_provider_result(b,gen_random_uuid(),'9999001','99999','90001',encode(extensions.digest('ks_synthetic_fixture','sha256'),'hex'),1,array[13,14],now()+interval '1 month');
  exception when others then failed:=sqlerrm='invalid_attempt_claim'; end;
  assert failed,'wrong claim token rejected';
  assert public.ks_record_preview_provider_result(b,token_b,'9999001','99999','90001',encode(extensions.digest('ks_synthetic_fixture','sha256'),'hex'),1,array[13,14],now()+interval '1 month'),'verified result saved';
  failed:=false;
  begin insert into public.ks_preview_streaming_logins(attempt_id,checkout_session_id,user_id) values(b,'cs_test_DurableFixtureB',owners[1]);
  exception when others then failed:=sqlerrm='verified_owner_login_binding_required'; end;
  assert failed,'cannot insert a login binding for a different owner';
  failed:=false;
  begin
    insert into public.iptv_customers(external_id,username,source) values(9999001,'ks_collision_fixture','synthetic_sql_fixture');
    perform public.ks_commit_preview_paid_setup(b,token_b,'ks_synthetic_fixture');
  exception when others then failed:=sqlerrm='crm_identity_conflict'; end;
  assert failed,'CRM conflict does not partially complete';
  assert not exists(select 1 from public.ks_preview_streaming_logins where attempt_id=b),'failed completion exposes no login';
  assert not exists(select 1 from public.ks_preview_paid_fulfillments where attempt_id=b),'failed completion leaves no binding';
  assert (select state='provider_verified' from public.ks_preview_provisioning_attempts where attempt_id=b),'verified provider result survives local completion failure';
  result:=public.ks_commit_preview_paid_setup(b,token_b,'ks_synthetic_fixture');
  assert result->>'ok'='true' and result->>'replayed'='false','atomic CRM/order/login completion';
  result:=public.ks_commit_preview_paid_setup(b,token_b,'ks_synthetic_fixture');
  assert result->>'replayed'='true','completion replay';
  result:=public.ks_queue_preview_paid_order('cs_test_DurableFixtureB',owners[2]);
  assert result->>'order_status'='setup_complete' and result->>'provider_activated'='true','webhook replay preserves completed order';
  assert not exists(select 1 from jsonb_array_elements(public.ks_list_preview_paid_orders()) x where x->>'sessionId'='cs_test_DurableFixtureB'),'completed order not listed as pending';
  assert (select count(*)=1 from public.ks_preview_paid_fulfillments where attempt_id=b),'one completion';
  assert (select fulfillment_status='setup_complete' from public.ks_preview_paid_orders where checkout_session_id='cs_test_DurableFixtureB'),'pending queue completed';
  assert (select count(*)=1 from public.iptv_customer_activity x join public.ks_preview_paid_fulfillments f on f.crm_customer_id=x.customer_id where f.attempt_id=b),'one CRM activity';
  assert not exists(select 1 from public.iptv_payments p join public.ks_preview_paid_fulfillments f on f.crm_customer_id=p.customer_id where f.attempt_id=b),'no live revenue/payment manufactured';
  assert (select c.iptv_password is null and c.monthly_price=0 and c.payment_status='preview_test' and c.renewal_at is null from public.iptv_customers c join public.ks_preview_paid_fulfillments f on f.crm_customer_id=c.id where f.attempt_id=b),'no plaintext password or live billing';
  assert not exists(select 1 from public.ks_preview_reseller_dispatches where attempt_id=b),'verified completion releases reseller lock';
  failed:=false; begin delete from public.ks_preview_reseller_dispatches where attempt_id=a; exception when others then failed:=sqlerrm='unresolved_dispatch_remains_locked'; end;
  assert failed,'ambiguous reseller lock cannot be deleted';
  failed:=false; begin update public.iptv_customers set payment_status='paid' where source='roomba_preview_paid' and username='ks_synthetic_fixture'; exception when others then failed:=sqlerrm='verified_preview_customer_immutable'; end;
  assert failed,'Preview setup cannot become live billing through CRM edit';
  assert (select count(*)=1 from public.ks_preview_streaming_logins where attempt_id=b and user_id=owners[2] and checkout_session_id='cs_test_DurableFixtureB'),'one owner-bound login';
  failed:=false;
  begin perform public.ks_reserve_preview_provisioning(c,'cs_test_DurableFixtureC',owners[2],repeat('f',64),'99999','90001',1,1,1,array[13,14],envelope,repeat('f',64),true);
  exception when unique_violation then failed:=true; end;
  assert failed,'another purchase cannot create a second new-customer identity';
  failed:=false;
  begin update public.ks_preview_provisioning_attempts set login_envelope=login_envelope||'{"password":"never-store-plaintext"}'::jsonb where attempt_id=b;
  exception when others then failed:=sqlerrm='immutable_attempt_binding'; end;
  assert failed,'encrypted binding cannot be replaced';
  assert not has_table_privilege('service_role','public.ks_preview_provisioning_attempts','DELETE'),'no service reset/delete';
  assert not has_table_privilege('service_role','public.ks_preview_streaming_logins','UPDATE'),'no login identity overwrite';
  assert not has_table_privilege('anon','public.ks_preview_provisioning_attempts','SELECT'),'anon attempts access revoked';
  assert not has_table_privilege('authenticated','public.ks_preview_streaming_logins','SELECT'),'browser login table access revoked';
  assert not has_function_privilege('authenticated','public.ks_begin_preview_provisioning(uuid,uuid)','EXECUTE'),'browser dispatch RPC revoked';
  assert not has_function_privilege('anon','public.ks_complete_preview_login(uuid,uuid)','EXECUTE'),'anon completion RPC revoked';
  assert not has_table_privilege('anon','public.ks_preview_reseller_dispatches','SELECT'),'private reseller lock';
  assert not has_table_privilege('authenticated','public.ks_preview_paid_fulfillments','SELECT'),'private completion binding';
  assert not has_function_privilege('authenticated','public.ks_commit_preview_paid_setup(uuid,uuid,text)','EXECUTE'),'browser atomic completion revoked';
  assert (public.ks_preview_provisioning_foundation_status()->>'browserAccessRevoked')::boolean,'foundation privilege report';
  perform set_config('role','none',true);
end;
$test$;
rollback;
select jsonb_build_object('rolledBack',true,'remainingAttempts',(select count(*) from public.ks_preview_provisioning_attempts),
  'remainingLogins',(select count(*) from public.ks_preview_streaming_logins),
  'remainingFulfillments',(select count(*) from public.ks_preview_paid_fulfillments),
  'remainingDispatchLocks',(select count(*) from public.ks_preview_reseller_dispatches),
  'remainingPaidPreviewCustomers',(select count(*) from public.iptv_customers where source='roomba_preview_paid')) as synthetic_test_result;
