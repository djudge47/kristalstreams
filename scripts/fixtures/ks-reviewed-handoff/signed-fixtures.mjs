import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createReviewedHandoffRehearsal } from '../../../_server/ks-reviewed-handoff-rehearsal.js';
import { buildPaidPlanMapping } from '../../../_server/ks-roomba-plan-mapping.js';
import { issuePaidApproval } from '../../../_server/ks-paid-approval.js';
import { sealStreamingLogin } from '../../../_server/ks-login-envelope.js';
import { fixture, json, literal, reserveReview, prepareAttempt, adminId } from './fixtures.mjs';
import { transfer } from './handoff-fixtures.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');

// Data only: no application fixture or transport constructor is imported.
function fictionalReview() {
 const env={VERCEL_ENV:'preview',ROOMBA_PREVIEW_SECRET:'fictional_handoff_approval_secret_0123456789',KS_LOGIN_ENCRYPTION_KEY:Buffer.alloc(32,3).toString('base64')};
 const packages=[1,3,6,12].flatMap((months,i)=>Array.from({length:5},(_,j)=>({id:String(1000+i*5+j),name:`${months} Months + ${j+1} Connections`,maxConnections:j+1,
  paid:{count:months,unit:'months',credits:(i+1)*(j+1)+0.5},trial:null,bouquets:[13,14],issues:[]})));
 const entry=buildPaidPlanMapping({schemaVersion:1,readOnly:true,checkedAt:new Date().toISOString(),packages}).entries[0];
 const session={livemode:false,mode:'payment',status:'complete',payment_status:'paid',currency:'usd',amount_total:2000,amount_subtotal:2000,
  payment_intent:{status:'succeeded',livemode:false,currency:'usd',amount:2000,amount_received:2000,
   latest_charge:{id:'ch_FictionalHandoff',livemode:false,currency:'usd',amount:2000,paid:true,captured:true,disputed:false,refunded:false,amount_refunded:0}},
  metadata:{plan:'bronze',connections:'1',interval:'monthly',price:'20',duration_days:'30'}};
 return {env,login:{password:'fictional_handoff_password_0123456789'},session,review:{entry,currentPackage:packages[0],account:{username:'fictional_handoff_reseller'}},provider:{snapshot:async()=>({packages})}};
}

export function signedHandoffFixtureFactory(admin, worker) {
 return async function setup(fault = '') {
  const old = fictionalReview();
  const env = { ...old.env, NODE_ENV: 'test' };
  const f = await fixture(admin, { fingerprint: old.review.entry.provider.fingerprint,
    envelopeFactory: value => sealStreamingLogin({ username: value.username, password: old.login.password },
      { environment: 'preview', ownerId: value.owner, sessionId: value.session, attemptId: value.attempt }, env) });
  f.claim = (await json(worker, reserveReview(f))).claim_id;
  f.bindingHash = hash(JSON.stringify({ sessionId: f.session, ownerId: f.owner, intentId: f.payment,
    tier: 'bronze', connections: 1, amountCents: 2000, resellerId: f.reseller, packageFingerprint: f.fingerprint }));
  await prepareAttempt(admin, f);
  const savedSession = structuredClone(old.session);
  savedSession.id = f.session; savedSession.metadata.user_id = f.owner;
  savedSession.payment_intent.id = f.payment; savedSession.payment_intent.latest_charge.payment_intent = f.payment;
  let clock = Date.now(); const capturedAt = clock;
  const account = { ...old.review.account, id: f.reseller, credits: '100' };
  const review = { ...old.review, session: savedSession, ownerId: f.owner, approverId: adminId, account, checkedAt: capturedAt };
  const signed = issuePaidApproval(review, env, clock);
  const calls = { captures: 0, transfers: 0, paymentReads: 0 };
  const makeStore = connection => ({ kind: 'isolated-simulation',
    async load() {
      const state = await json(connection, `jsonb_build_object(
        'claim',(select to_jsonb(c) from public.ks_setup_review_claims c where claim_id=${literal(f.claim)}),
        'attempt',(select to_jsonb(a) from public.ks_preview_provisioning_attempts a where attempt_id=${literal(f.attempt)}),
        'handoff',(select to_jsonb(h) from public.ks_proto_reservation_handoffs h where claim_id=${literal(f.claim)}))`);
      if (fault === 'wrong_owner') state.claim.user_id = randomUUID();
      if (fault === 'wrong_intent') state.attempt.payment_intent_id = 'pi_Other';
      if (fault === 'changed_cost') state.claim.cost_units = 1000000;
      if (fault === 'wrong_token') state.attempt.claim_token = randomUUID();
      if (fault === 'corrupt_envelope') state.attempt.login_envelope.ciphertext = 'AAAA';
      if (fault === 'old_day') state.claim.utc_day = '2000-01-01';
      return state;
    },
    async assertOwnerAndEligibility(ownerId) {
      assert.equal(ownerId, f.owner);
      if (fault === 'existing_customer') throw new Error('new_customer_required');
      assert.equal(await json(connection, `public.ks_assert_preview_new_customer(${literal(f.owner)})`), true);
    },
    async capture(e) {
      calls.captures++;
      const prior = await json(connection, `(select to_jsonb(p) from public.ks_proto_execution_approvals p where approval_id=${literal(e.approvalId)})`);
      if (prior) {
        assert.equal(prior.approval_hash, e.tokenHash); assert.equal(prior.claim_id, e.claimId); assert.equal(prior.attempt_id, e.attemptId);
        return;
      }
      await json(connection, `public.ks_proto_capture_approval(${literal(e.approvalId)},${literal(e.claimId)},${literal(e.attemptId)},
        ${literal(e.approverId)},${literal(e.tokenHash)},${literal(e.balanceUnits)}::bigint,${literal(e.evidenceAt)}::timestamptz,${literal(e.expiresAt)}::timestamptz)`);
      if (fault === 'lost_capture_reply' && calls.captures === 1) throw new Error('fictional_lost_reply');
      if (fault === 'revoke_after_capture') await admin.request(`update public.ks_setup_review_policies set revoked_at=clock_timestamp() where policy_id=${literal(f.policy)};`);
    },
    async transfer(e, token) {
      calls.transfers++;
      // An implicit PostgreSQL transaction commits and runs deferred checks
      // before request resolves. There is no provisional transaction callback.
      if (fault === 'deferred_transfer_failure') await admin.request(`create function public.ks_test_commit_fault() returns trigger language plpgsql as $$begin raise exception 'synthetic_commit_failure';end;$$;
        create constraint trigger ks_test_commit_fault after insert on public.ks_proto_reservation_handoffs deferrable initially deferred for each row execute function public.ks_test_commit_fault();`);
      let result;
      try { result = await json(connection, transfer({ approval: e.approvalId, token })); }
      finally { if (fault === 'deferred_transfer_failure') await admin.request('drop trigger ks_test_commit_fault on public.ks_proto_reservation_handoffs;drop function public.ks_test_commit_fault();'); }
      if (fault === 'lost_transfer_reply') throw new Error('fictional_lost_reply');
      if (fault === 'stale_after_commit') clock += 31000;
      if (fault === 'day_after_commit') clock = Date.parse(`${f.day}T23:59:59.999Z`) + 1;
      if (fault === 'malformed_reply') return { ...result, may_dispatch: true };
      return result;
    },
  });
  const store = makeStore(worker);
  const payments = { kind: 'isolated-simulation', async retrieve(id) {
    calls.paymentReads++; assert.equal(id, f.session);
    const value = structuredClone(savedSession);
    if (fault === 'refunded') value.payment_intent.latest_charge.amount_refunded = 1;
    return value;
  } };
  const provider = { kind: 'isolated-simulation', async snapshot() {
    return { account: { ...account, credits: fault === 'changed_balance' ? '99' : account.credits },
      packages: (await old.provider.snapshot()).packages, checkedAt: capturedAt };
  } };
  const input = { claimId: f.claim, attemptId: f.attempt, ownerId: f.owner, approverId: adminId, approvalToken: signed.token, confirmed: true };
  return { f, input, calls, store, env, provider, payments, makeStore, clock: () => clock, run: createReviewedHandoffRehearsal({ store, provider, payments, env, now: () => clock }) };
 };
}
