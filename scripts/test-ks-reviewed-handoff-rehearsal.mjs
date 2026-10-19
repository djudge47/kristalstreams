import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { createReviewedHandoffRehearsal } from '../_server/ks-reviewed-handoff-rehearsal.js';
import { createGuardedWorkerFixture } from '../_server/ks-guarded-paid-fixtures.js';
import { issuePaidApproval } from '../_server/ks-paid-approval.js';
import { sealStreamingLogin } from '../_server/ks-login-envelope.js';
import { bootstrap, fixture, json, literal, reserveReview, prepareAttempt, summary, providerResult, adminId } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { installPrototype, transfer, settle, handoffSummary } from './fixtures/ks-reviewed-handoff/handoff-fixtures.mjs';
import { runHandoffSequential } from './fixtures/ks-reviewed-handoff/handoff-scenarios.mjs';

const { PGlite } = await import(process.env.KS_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const session = role => ({ async request(sql) {
  const results = await db.exec(`set role ${role};${sql}`);
  return results.flatMap(result => result.rows).map(row => {
    const [column, value] = Object.entries(row)[0];
    return column === 'to_jsonb' || typeof value === 'object' ? JSON.stringify(value) : String(value);
  }).join('\n');
} });
const admin = session('postgres'), worker = session('service_role');
let checks = 0;
const check = async (label, fn) => { await fn(); checks++; console.log(`PASS: ${label}`); };
const snap = async f => ({ ...await summary(admin, f), ...await handoffSummary(admin, f) });
const hash = value => createHash('sha256').update(value).digest('hex');

async function setup(fault = '') {
  const old = createGuardedWorkerFixture();
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
  const store = { kind: 'isolated-simulation',
    async load() {
      const state = await json(admin, `jsonb_build_object(
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
      assert.equal(await json(worker, `public.ks_assert_preview_new_customer(${literal(f.owner)})`), true);
    },
    async capture(e) {
      calls.captures++;
      const prior = await json(admin, `(select to_jsonb(p) from public.ks_proto_execution_approvals p where approval_id=${literal(e.approvalId)})`);
      if (prior) {
        assert.equal(prior.approval_hash, e.tokenHash); assert.equal(prior.claim_id, e.claimId); assert.equal(prior.attempt_id, e.attemptId);
        return;
      }
      await json(worker, `public.ks_proto_capture_approval(${literal(e.approvalId)},${literal(e.claimId)},${literal(e.attemptId)},
        ${literal(e.approverId)},${literal(e.tokenHash)},${literal(e.balanceUnits)}::bigint,${literal(e.evidenceAt)}::timestamptz,${literal(e.expiresAt)}::timestamptz)`);
      if (fault === 'lost_capture_reply' && calls.captures === 1) throw new Error('fictional_lost_reply');
      if (fault === 'revoke_after_capture') await admin.request(`update public.ks_setup_review_policies set revoked_at=clock_timestamp() where policy_id=${literal(f.policy)};`);
    },
    async transfer(e, token) {
      calls.transfers++;
      // An implicit PostgreSQL transaction commits and runs deferred checks
      // before db.exec resolves. There is no provisional transaction callback.
      if (fault === 'deferred_transfer_failure') await admin.request(`create function public.ks_test_commit_fault() returns trigger language plpgsql as $$begin raise exception 'synthetic_commit_failure';end;$$;
        create constraint trigger ks_test_commit_fault after insert on public.ks_proto_reservation_handoffs deferrable initially deferred for each row execute function public.ks_test_commit_fault();`);
      let result;
      try { result = await json(worker, transfer({ approval: e.approvalId, token })); }
      finally { if (fault === 'deferred_transfer_failure') await admin.request('drop trigger ks_test_commit_fault on public.ks_proto_reservation_handoffs;drop function public.ks_test_commit_fault();'); }
      if (fault === 'lost_transfer_reply') throw new Error('fictional_lost_reply');
      if (fault === 'stale_after_commit') clock += 31000;
      if (fault === 'day_after_commit') clock = Date.parse(`${f.day}T23:59:59.999Z`) + 1;
      if (fault === 'malformed_reply') return { ...result, may_dispatch: true };
      return result;
    },
  };
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
  return { f, input, calls, store, env, provider, payments, run: createReviewedHandoffRehearsal({ store, provider, payments, env, now: () => clock }) };
}

try {
  await check('unmodified prototype refuses the wrong database before creating its tables', async () => {
    const sql = await readFile(new URL('./fixtures/ks-reviewed-handoff/prototype.sql', import.meta.url), 'utf8');
    await assert.rejects(() => db.exec(sql), /disposable_handoff_database_required/);
    assert.equal((await db.query("select to_regclass('public.ks_proto_execution_approvals') as target")).rows[0].target, null);
  });
  await bootstrap(admin, { pglitePreflight: true });
  await installPrototype(admin, { pglitePreflight: true });
  await runHandoffSequential({ admin, a: worker, b: worker, check });
  await check('real signed review and AES envelope bind the committed SQL handoff; a changed historical balance is retained', async () => {
    const t = await setup(); const result = await t.run(t.input);
    assert.deepEqual(result, { state: 'dispatching', replayed: false, simulation: true, mayDispatch: false, wouldDispatch: true });
    const s = await snap(t.f);
    assert.equal(s.oldBalance, '100500000'); assert.equal(s.freshBalance, '100000000');
    assert.equal(s.reserved, '1500000'); assert.equal(s.spent, '0'); assert.equal(s.reviewSlots, 0); assert.equal(s.dispatchSlots, 1);
    assert.equal((await t.run(t.input)).wouldDispatch, false); assert.equal(t.calls.transfers, 1);
    const nonce = JSON.parse(Buffer.from(t.input.approvalToken.split('.')[0], 'base64url')).nonce;
    await json(worker, `public.ks_reconcile_preview_provisioning(${literal(t.f.attempt)},${literal(t.f.token)})`);
    assert.equal((await t.run(t.input)).state, 'reconciliation_required');
    assert.equal((await json(worker, transfer({ approval: nonce, token: t.f.token }))).would_dispatch, false);
  });
  await check('captured approval reply loss can be read safely and never transfers on the failing call', async () => {
    const t = await setup('lost_capture_reply'); assert.equal((await t.run(t.input)).state, 'approval_capture_pending');
    assert.equal(t.calls.transfers, 0); assert.equal((await snap(t.f)).reviewSlots, 1);
    assert.equal((await t.run(t.input)).wouldDispatch, true); assert.equal(t.calls.transfers, 1);
  });
  await check('lost committed handoff reply never grants a second decision or releases the credit reservation', async () => {
    const t = await setup('lost_transfer_reply'); assert.equal((await t.run(t.input)).wouldDispatch, false);
    assert.equal((await t.run(t.input)).wouldDispatch, false); assert.equal(t.calls.transfers, 1);
    const s = await snap(t.f); assert.equal(s.handoffs, 1); assert.equal(s.reserved, '1500000'); assert.equal(s.dispatchSlots, 1);
  });
  await check('a deferred SQL failure cannot escape as a successful handoff decision', async () => {
    const t = await setup('deferred_transfer_failure'), before = await snap(t.f);
    assert.equal((await t.run(t.input)).wouldDispatch, false); assert.equal(t.calls.transfers, 1);
    assert.deepEqual(await snap(t.f), before);
  });
  await check('overlapping JavaScript callers receive at most one committed fictional decision', async () => {
    const t = await setup();
    const results = await Promise.allSettled(Array.from({ length: 6 }, () => t.run(t.input)));
    assert.equal(results.filter(row => row.status === 'fulfilled' && row.value.wouldDispatch).length, 1);
    assert.equal((await snap(t.f)).handoffs, 1); assert.equal((await snap(t.f)).reserved, '1500000');
  });
  await check('policy revocation after signed capture rolls transfer back with the review reservation intact', async () => {
    const t = await setup('revoke_after_capture'); assert.equal((await t.run(t.input)).state, 'reconciliation_required');
    const s = await snap(t.f); assert.equal(s.handoffs, 0); assert.equal(s.reviewSlots, 1); assert.equal(s.dispatchSlots, 0);
  });
  for (const fault of ['wrong_owner', 'wrong_intent', 'changed_cost', 'corrupt_envelope', 'old_day', 'refunded', 'existing_customer', 'changed_balance']) {
    await check(`${fault} stops before approval capture and preserves the saved reservation`, async () => {
      const t = await setup(fault), before = await snap(t.f);
      await assert.rejects(() => t.run(t.input)); assert.equal(t.calls.captures, 0); assert.deepEqual(await snap(t.f), before);
    });
  }
  await check('wrong attempt token is rejected by SQL before transfer', async () => {
    const t = await setup('wrong_token'); assert.equal((await t.run(t.input)).wouldDispatch, false);
    assert.equal((await snap(t.f)).handoffs, 0); assert.equal((await snap(t.f)).reviewSlots, 1);
  });
  for (const fault of ['stale_after_commit', 'day_after_commit', 'malformed_reply']) {
    await check(`${fault} denies the provisional decision after commit and preserves one stopped handoff`, async () => {
      const t = await setup(fault); assert.equal((await t.run(t.input)).wouldDispatch, false);
      assert.equal((await t.run(t.input)).wouldDispatch, false);
      const s = await snap(t.f); assert.equal(s.handoffs, 1); assert.equal(s.dispatchSlots, 1); assert.equal(s.reserved, '1500000');
    });
  }
  await check('verified transferred completion settles once and the rehearsal never supplies a second decision', async () => {
    const t = await setup(); await t.run(t.input); await json(worker, providerResult(t.f));
    assert.equal((await json(worker, settle(t.f))).replayed, false); assert.equal((await json(worker, settle(t.f))).replayed, true);
    const result = await t.run({ ...t.input, approvalToken: 'expired-or-removed' });
    assert.equal(result.state, 'credentials_ready'); assert.equal(result.wouldDispatch, false);
    const s = await snap(t.f); assert.equal(s.crm, 1); assert.equal(s.logins, 1); assert.equal(s.spent, '1500000'); assert.equal(s.reserved, '0');
  });
  await check('explicit approval, bound approver, and the simulation-only construction boundary are mandatory', async () => {
    const t = await setup();
    for (const patch of [{ confirmed: false }, { approverId: randomUUID() }, { approvalToken: 'forged' }, { operation: 'trial_upgrade' }]) await assert.rejects(() => t.run({ ...t.input, ...patch }));
    for (const patch of [{ env: { ...t.env, NODE_ENV: 'production' } }, { env: { ...t.env, VERCEL_ENV: 'production' } }, { store: {} }, { provider: {} }]) {
      assert.throws(() => createReviewedHandoffRehearsal({ ...t, ...patch }));
    }
    assert.equal(t.calls.captures, 0);
    const entrypoints = await readdir(new URL('../api/', import.meta.url)); assert.equal(entrypoints.length, 12);
    for (const file of entrypoints) {
      assert.ok(!(await readFile(new URL(`../api/${file}`, import.meta.url), 'utf8')).includes('ks-reviewed-handoff-rehearsal'));
    }
  });
  console.log(`Passed ${checks} isolated SQL/signed-handoff checks. No network or provider-create adapter exists. PGlite is one session; this is not native contention evidence.`);
} finally { await db.close(); }
