-- Synthetic rows only, rolled back. Existing user IDs are kept inside the transaction and never returned.
begin;
do $test$
declare
  owners uuid[]; a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid();
  token_a uuid; token_b uuid; result jsonb; failed boolean;
  envelope jsonb:=jsonb_build_object('version',1,'keyId','synthetic','iv',repeat('A',16),'tag',repeat('A',22)||'==','ciphertext',repeat('A',64));
begin
  select array_agg(id) into owners from (select id from auth.users u where not exists(select 1 from public.ks_roomba_trial_attempts t where t.admin_id=u.id) order by id limit 2) eligible;
  assert cardinality(owners)=2,'two existing fixture owners required';
  insert into public.ks_payment_receipts(checkout_session_id,payment_intent_id,user_id,livemode,tier,connections,duration_days,amount_cents,currency,activated)
    values('cs_test_DurableFixtureA','pi_DurableFixtureA',owners[1],false,'bronze',1,30,2000,'usd',false),
      ('cs_test_DurableFixtureB','pi_DurableFixtureB',owners[2],false,'bronze',1,30,2000,'usd',false),
      ('cs_test_DurableFixtureC','pi_DurableFixtureC',owners[2],false,'bronze',1,30,2000,'usd',false);
  insert into public.ks_preview_paid_orders(checkout_session_id) values('cs_test_DurableFixtureA'),('cs_test_DurableFixtureB'),('cs_test_DurableFixtureC');
  perform set_config('role','service_role',true);
  failed:=false;
  begin
    perform public.ks_reserve_preview_provisioning(a,'cs_test_DurableFixtureA',owners[1],repeat('a',64),'99999','90001',1,1,1,array[13,14],envelope,repeat('b',64));
  exception when others then failed:=sqlerrm='new_customer_review_required'; end;
  assert failed,'new customer confirmation required';
  result:=public.ks_reserve_preview_provisioning(a,'cs_test_DurableFixtureA',owners[1],repeat('a',64),'99999','90001',1,1,1,array[13,14],envelope,repeat('b',64),true);
  assert result->>'fresh'='true' and result->>'state'='reserved','fresh durable reservation'; token_a:=(result->>'claimToken')::uuid;
  result:=public.ks_reserve_preview_provisioning(gen_random_uuid(),'cs_test_DurableFixtureA',owners[1],repeat('a',64),'99999','90001',1,1,1,array[13,14],envelope,repeat('b',64),true);
  assert result->>'fresh'='false' and (result->>'attemptId')::uuid=a and (result->>'claimToken')::uuid=token_a,'durable replay';
  failed:=false;
  begin perform public.ks_reserve_preview_provisioning(c,'cs_test_DurableFixtureA',owners[2],repeat('a',64),'99999','90001',1,1,1,array[13,14],envelope,repeat('b',64),true);
  exception when others then failed:=sqlerrm='verified_pending_test_receipt_required'; end;
  assert failed,'wrong owner rejected';
  failed:=false;
  begin perform public.ks_reserve_preview_provisioning(c,'cs_test_DurableFixtureA',owners[1],repeat('c',64),'99999','90001',1,1,1,array[13,14],envelope,repeat('b',64),true);
  exception when others then failed:=sqlerrm='attempt_binding_changed'; end;
  assert failed,'changed binding rejected';
  assert public.ks_begin_preview_provisioning(a,token_a),'one dispatch claim';
  assert not public.ks_begin_preview_provisioning(a,token_a),'no second dispatch across calls';
  failed:=false;
  begin perform public.ks_complete_preview_login(a,token_a); exception when others then failed:=sqlerrm='provider_verification_required'; end;
  assert failed,'cannot hand off before provider verification';
  assert public.ks_reconcile_preview_provisioning(a,token_a),'ambiguous send persists';
  assert not public.ks_begin_preview_provisioning(a,token_a),'reconciliation cannot dispatch';
  assert not public.ks_reconcile_preview_provisioning(a,token_a),'reconciliation replay';
  failed:=false;
  begin update public.ks_preview_provisioning_attempts set state='reserved' where attempt_id=a;
  exception when others then failed:=sqlerrm='invalid_attempt_transition'; end;
  assert failed,'state cannot be reset';
  result:=public.ks_reserve_preview_provisioning(b,'cs_test_DurableFixtureB',owners[2],repeat('d',64),'99999','90001',1,1,1,array[13,14],envelope,repeat('e',64),true);
  token_b:=(result->>'claimToken')::uuid;
  assert public.ks_begin_preview_provisioning(b,token_b),'second owner dispatch';
  failed:=false;
  begin perform public.ks_record_preview_provider_result(b,token_b,'9999001','99999','90001',repeat('e',64),5,array[13,14],now()+interval '1 month');
  exception when others then failed:=sqlerrm='provider_result_requires_review'; end;
  assert failed,'wrong provider allowance rejected';
  failed:=false;
  begin perform public.ks_record_preview_provider_result(b,gen_random_uuid(),'9999001','99999','90001',repeat('e',64),1,array[13,14],now()+interval '1 month');
  exception when others then failed:=sqlerrm='invalid_attempt_claim'; end;
  assert failed,'wrong claim token rejected';
  assert public.ks_record_preview_provider_result(b,token_b,'9999001','99999','90001',repeat('e',64),1,array[13,14],now()+interval '1 month'),'verified result saved';
  failed:=false;
  begin insert into public.ks_preview_streaming_logins(attempt_id,checkout_session_id,user_id) values(b,'cs_test_DurableFixtureB',owners[1]);
  exception when others then failed:=sqlerrm='verified_owner_login_binding_required'; end;
  assert failed,'cannot insert a login binding for a different owner';
  assert public.ks_complete_preview_login(b,token_b),'login binding committed';
  assert not public.ks_complete_preview_login(b,token_b),'login handoff replay';
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
  assert (public.ks_preview_provisioning_foundation_status()->>'browserAccessRevoked')::boolean,'foundation privilege report';
  perform set_config('role','none',true);
end;
$test$;
rollback;
select jsonb_build_object('rolledBack',true,'remainingAttempts',(select count(*) from public.ks_preview_provisioning_attempts),
  'remainingLogins',(select count(*) from public.ks_preview_streaming_logins)) as synthetic_test_result;
