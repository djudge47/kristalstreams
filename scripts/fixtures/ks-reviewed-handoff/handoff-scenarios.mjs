import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {json,literal,denied,providerResult,complete,summary,fixture,prepareAttempt} from './fixtures.mjs';
import {makeHandoff,capture,transfer,settle,handoffSummary,insertJournal} from './handoff-fixtures.mjs';

export async function runHandoffSequential({admin,a,b,check}) {
 const snap=async f=>({...await summary(admin,f),...await handoffSummary(admin,f)});
 const rollbackFailure=async(sql,message)=>{
  await a.request('begin;');
  try {await a.request(sql); await a.request(denied('set constraints all immediate',message));}
  finally {await a.request('rollback;');}
 };
 await check('prototype transfers once and retains the exact reserved budget',async()=>{
  const f=await makeHandoff(admin,a); const first=await json(a,transfer(f));
  assert.equal(first.would_dispatch,true); assert.equal(first.may_dispatch,false);
  const replay=await json(b,transfer(f));assert.equal(replay.replayed,true);assert.equal(replay.would_dispatch,false);
  const s=await snap(f);assert.equal(s.reviewSlots,0);assert.equal(s.dispatchSlots,1);assert.equal(s.handoffs,1);
  assert.equal(s.reserved,'1500000');assert.equal(s.spent,'0');assert.equal(s.attemptState,'dispatching');
 });
 await check('a second captured approval for the same claim cannot create a second transfer decision',async()=>{
  const f=await makeHandoff(admin,a),other={...f,approval:randomUUID(),approvalHash:'f'.repeat(64)};
  await json(a,capture(other));assert.equal((await json(a,transfer(f))).would_dispatch,true);
  await b.request(denied(`perform ${transfer(other)}`,'proto_replay_binding_changed'));
  assert.equal((await snap(f)).handoffs,1);assert.equal((await snap(f)).reserved,'1500000');
 });
 await check('prototype completion settles once using fresh balance and preserves original review evidence',async()=>{
  const f=await makeHandoff(admin,a);await json(a,transfer(f));await json(a,providerResult(f));
  assert.equal((await json(a,settle(f))).replayed,false);assert.equal((await json(b,settle(f))).replayed,true);
  const s=await snap(f);assert.equal(s.oldBalance,'100500000');assert.equal(s.freshBalance,'100000000');
  assert.equal(s.crm,1);assert.equal(s.logins,1);assert.equal(s.fulfillments,1);assert.equal(s.audits,1);
  assert.equal(s.reviewQueue,'setup_complete');assert.equal(s.previewQueue,'setup_complete');
  assert.equal(s.reserved,'0');assert.equal(s.spent,'1500000');assert.equal(s.dispatchSlots,0);assert.equal(s.receiptActivated,false);
 });
 await check('later standalone completion cannot commit without transferred review settlement',async()=>{
  const f=await makeHandoff(admin,a);await json(a,transfer(f));await json(a,providerResult(f));const before=await snap(f);
  await rollbackFailure(`select ${complete(f)};`,'proto_review_settlement_required');
  assert.deepEqual(await snap(f),before);assert.equal((await json(b,settle(f))).replayed,false);
 });
 await check('journal-only and source-deletion-only transactions cannot commit',async()=>{
  const f=await makeHandoff(admin,a),before=await snap(f);
  await rollbackFailure(`${insertJournal(f)};`,'proto_handoff_transaction_incomplete');
  assert.deepEqual(await snap(f),before);
  await rollbackFailure(`${insertJournal(f)};delete from public.ks_setup_review_reseller_slots where claim_id=${literal(f.claim)};`,'proto_handoff_transaction_incomplete');
  assert.deepEqual(await snap(f),before);
 });
 await check('faults at journal, source delete, destination insert, state update and deferred commit restore ownership',async()=>{
  const cases=[
   ['after insert','public.ks_proto_reservation_handoffs',false],
   ['after delete','public.ks_setup_review_reseller_slots',false],
   ['after insert','public.ks_preview_reseller_dispatches',false],
   ['after update','public.ks_preview_provisioning_attempts',false],
   ['after insert','public.ks_proto_reservation_handoffs',true]
  ];
  for(const [event,table,deferred] of cases){
   const f=await makeHandoff(admin,a),before=await snap(f);
   await admin.request(`create function public.ks_proto_fault() returns trigger language plpgsql as $$begin raise exception 'proto_injected_failure';end;$$;
    create ${deferred?'constraint ':''}trigger ks_proto_fault ${event} on ${table} ${deferred?'deferrable initially deferred ':''}for each row execute function public.ks_proto_fault();`);
   if(deferred)await rollbackFailure(`select ${transfer(f)};`,'proto_injected_failure');
   else await a.request(denied(`perform ${transfer(f)}`,'proto_injected_failure'));
   await admin.request(`drop trigger ks_proto_fault on ${table};drop function public.ks_proto_fault();`);
   assert.deepEqual(await snap(f),before);
  }
 });
 await check('wrong attempt token cannot consume approval or move the reservation',async()=>{
  const f=await makeHandoff(admin,a),before=await snap(f);
  await b.request(denied(`perform ${transfer({...f,token:randomUUID()})}`,'proto_attempt_token_required'));
  assert.deepEqual(await snap(f),before);
 });
 await check('approval cannot bind a different customer or unrelated attempt',async()=>{
  const f=await makeHandoff(admin,a,{capture:false}),other=await prepareAttempt(admin,await fixture(admin));
  await a.request(denied(`perform ${capture({...f,attempt:other.attempt})}`,'proto_approval_binding_required'));
  assert.equal((await snap(f)).handoffs,0);assert.equal((await snap(f)).reviewSlots,1);
 });
 await check('revoking the review policy stops an unused handoff approval',async()=>{
  const f=await makeHandoff(admin,a),before=await snap(f);
  await admin.request(`update public.ks_setup_review_policies set revoked_at=clock_timestamp() where policy_id=${literal(f.policy)};`);
  await a.request(denied(`perform ${transfer(f)}`,'proto_current_policy_required'));assert.deepEqual(await snap(f),before);
 });
 await check('expired, stale and future approval evidence cannot be recorded',async()=>{
  for(const option of [{expiry:"clock_timestamp()-interval '1 second'"},{evidence:"clock_timestamp()-interval '31 seconds'"},{evidence:"clock_timestamp()+interval '1 minute'"}]){
   const f=await makeHandoff(admin,a,{capture:false});
   await a.request(denied(`perform ${capture(f,option)}`,'proto_fresh_approval_required'));
   assert.equal((await snap(f)).handoffs,0);
  }
 });
 await check('trial upgrade cannot enter the new-line prototype operation',async()=>{
  const f=await makeHandoff(admin,a,{capture:false});
  await a.request(denied(`perform ${capture(f,{operation:'trial_upgrade'})}`,'proto_approval_binding_required'));
 });
 await check('insufficient fresh reserve fails without double-counting or moving budget',async()=>{
  const f=await makeHandoff(admin,a,{balance:'1500000'}),before=await snap(f);
  await a.request(denied(`perform ${transfer(f)}`,'proto_reserved_budget_required'));assert.deepEqual(await snap(f),before);
 });
 await check('immutable evidence and the extra row-lock grant cannot permit slot edits',async()=>{
  const f=await makeHandoff(admin,a);
  await a.request(denied(`update public.ks_setup_review_reseller_slots set reserved_at=reserved_at where claim_id=${literal(f.claim)}`,'reseller_reservation_is_immutable'));
  await admin.request(denied(`update public.ks_proto_execution_approvals set balance_units=1 where approval_id=${literal(f.approval)}`,'proto_evidence_is_immutable'));
  await json(a,transfer(f));
  await admin.request(denied(`delete from public.ks_proto_reservation_handoffs where claim_id=${literal(f.claim)}`,'proto_evidence_is_immutable'));
 });
 await check('uncertain provider outcome holds reservation and denies every further simulated send',async()=>{
  const f=await makeHandoff(admin,a);await json(a,transfer(f));
  await json(a,`public.ks_reconcile_preview_provisioning(${literal(f.attempt)},${literal(f.token)})`);
  const replay=await json(b,transfer(f));assert.equal(replay.would_dispatch,false);assert.equal(replay.state,'reconciliation_required');
  const s=await snap(f);assert.equal(s.dispatchSlots,1);assert.equal(s.reserved,'1500000');assert.equal(s.spent,'0');
  await a.request(denied(`delete from public.ks_preview_reseller_dispatches where attempt_id=${literal(f.attempt)}`,'unresolved_dispatch_remains_locked'));
 });
 await check('prototype tables and functions remain private invoker objects with no Auth read grant',async()=>{
  const counts=await json(admin,`(select count(*) from pg_class where oid in ('public.ks_proto_execution_approvals'::regclass,
    'public.ks_proto_reservation_handoffs'::regclass) and relrowsecurity and not has_table_privilege('authenticated',oid,'select')
    and not has_table_privilege('anon',oid,'select'))`);assert.equal(counts,2);
  assert.equal(await json(admin,"has_table_privilege('service_role','auth.users','select')"),false);
  assert.equal(await json(admin,`(select count(*) from pg_proc where proname like 'ks_proto_%' and
    (prosecdef or not (proconfig @> array['search_path=""']) or has_function_privilege('anon',oid,'execute')
     or has_function_privilege('authenticated',oid,'execute')))`),0);
 });
 await check('changed handoff cost cannot manufacture transfer evidence',async()=>{
  const f=await makeHandoff(admin,a),before=await snap(f);
  const sql=insertJournal(f).replace('c.utc_day,c.cost_units,','c.utc_day,c.cost_units+1,');
  await a.request(denied(sql,'proto_handoff_binding_required'));assert.deepEqual(await snap(f),before);
 });
 await check('raw reserve adjustment after transfer cannot commit inconsistent budget state',async()=>{
  const f=await makeHandoff(admin,a);await json(a,transfer(f));const before=await snap(f);
  await rollbackFailure(`update public.ks_setup_review_budgets set reserved_units=reserved_units+1 where reseller_id=${literal(f.reseller)};`,'proto_handoff_transaction_incomplete');
  assert.deepEqual(await snap(f),before);
 });
 await check('settlement succeeds after policy revocation without authorizing another send',async()=>{
  const f=await makeHandoff(admin,a);await json(a,transfer(f));await json(a,providerResult(f));
  await admin.request(`update public.ks_setup_review_policies set revoked_at=clock_timestamp() where policy_id=${literal(f.policy)};`);
  assert.equal((await json(b,settle(f))).replayed,false);assert.equal((await json(a,transfer(f))).would_dispatch,false);
 });
 await check('completed history does not block later different-customer work on the same reseller',async()=>{
  const first=await makeHandoff(admin,a);await json(a,transfer(first));await json(a,providerResult(first));await json(a,settle(first));
  const second=await makeHandoff(admin,a,{reseller:first.reseller});await json(a,transfer(second));
  await json(a,providerResult(second));await json(a,settle(second));
  assert.equal((await snap(second)).spent,'3000000');assert.equal((await snap(second)).reserved,'0');
  assert.equal((await snap(first)).audits,1);assert.equal((await snap(second)).audits,1);
 });
}
