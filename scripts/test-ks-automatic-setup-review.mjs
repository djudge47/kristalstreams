import assert from 'node:assert/strict';
import { reviewAutomaticSetupCandidate as review } from '../_server/ks-automatic-setup-review.js';
import { createGuardedWorkerFixture } from '../_server/ks-guarded-paid-fixtures.js';
async function fixture(live = false) {
  const f = createGuardedWorkerFixture(), now = f.now;
  const session = structuredClone(f.session); session.created = now / 1000 - 1;
  if (live) { session.id = 'cs_live_FictionalAutomaticReview'; session.livemode = true;
    session.payment_intent.livemode = true; session.payment_intent.latest_charge.livemode = true; }
  const owner = session.metadata.user_id, at = new Date(now - 500).toISOString();
  const receipt = { checkout_session_id: session.id, payment_intent_id: session.payment_intent.id, user_id: owner,
    livemode: live, tier: 'bronze', connections: 1, duration_days: 30, amount_cents: 2000, currency: 'usd',
    activated: false, expires_at: null, recorded_at: at };
  const policy = { version: 1, mode: 'review-only', environment: live ? 'production' : 'preview',
    policyId: '00000000-0000-4000-8000-000000000051', resellerId: '99999',
    notBefore: new Date(now - 10000).toISOString(), expiresAt: new Date(now + 3600000).toISOString(),
    perOrderCreditUnits: '2000000', dailyCreditUnits: '20000000', minReserveCreditUnits: '5000000',
    packages: [{ tier: 'bronze', connections: 1, packageId: f.review.entry.provider.id,
      packageFingerprint: f.review.entry.provider.fingerprint, maxCreditUnits: '1500000' }] };
  const input = { checkedAt: now, session, receipt,
    queue: { ...receipt, queued_at: at, fulfillment_status: 'awaiting_activation' },
    customer: { user: { id: owner, email: 'fictional@example.invalid', email_confirmed_at: '2030-01-01T00:00:00Z', is_anonymous: false },
      profile: { id: owner, email: 'fictional@example.invalid', subscription_status: 'inactive', active_connections: 0, subscription_expires_at: null } },
    history: { userId: owner, checkedAt: now, localHistoryChecked: true, priorProviderLine: false, priorTrial: false,
      priorFulfillment: false, existingCrmCustomer: false, ambiguous: false },
    purchaseIntent: { source: 'authenticated_checkout', userId: owner, sessionId: session.id, kind: 'new_service',
      newServiceAttested: true, capturedAt: new Date(now - 1000).toISOString() },
    attempt: { userId: owner, sessionId: session.id, checkedAt: now, state: 'none' },
    provider: await f.provider.snapshot(),
    budget: { policyId: policy.policyId, resellerId: '99999', environment: policy.environment, utcDay: '2030-01-15',
      checkedAt: now, resellerDispatchAvailable: true, spentUnits: '0', reservedUnits: '0' },
  };
  const environment = policy.environment;
  const result = () => review(input, { env: { VERCEL_ENV: environment, KS_AUTOMATIC_SETUP_REVIEW_POLICY: JSON.stringify(policy) }, now });
  return { input, policy, result, now, calls: f.calls };
}
const eligible = r => { assert.equal(r.decision, 'eligible_for_durable_claim_review'); assert.equal(r.mayDispatch, false); };
const blocked = (r, reason) => { assert.equal(r.decision, 'manual_review'); assert.equal(r.mayDispatch, false); if (reason) assert.equal(r.reason, reason); };
let count = 0;
async function check(label, fn) { await fn(); count++; console.log(`PASS: ${label}`); }
await check('no server review policy disables evaluation before reading any candidate evidence', async () => {
  const input = new Proxy({}, { get() { assert.fail('disabled policy read input'); } });
  assert.equal(review(input, { env: {} }).decision, 'disabled');
});
await check('complete Preview evidence is review-eligible but cannot dispatch or mutate input', async () => {
  const f = await fixture(), before = structuredClone(f.input); eligible(f.result());
  assert.deepEqual(f.input, before); assert.equal(f.calls.creates, 0); assert.equal(f.calls.begins, 0);
});
await check('settled live evidence is reviewable without enabling production execution', async () => { eligible((await fixture(true)).result()); });
await check('malformed, expired, oversized, wrong-environment or activation-mode policies fail closed', async () => {
  for (const patch of [{ mode: 'execute' }, { enabled: true }, { expiresAt: '2020-01-01' }, { resellerId: 99999 },
    { perOrderCreditUnits: '-1' }, { dailyCreditUnits: '1' }, { packages: [] }, { environment: 'unknown' }]) {
    const f = await fixture(); Object.assign(f.policy, patch); blocked(f.result(), 'review_policy_invalid');
  }
  const f = await fixture(); blocked(review(f.input, { env: { VERCEL_ENV: 'preview', KS_AUTOMATIC_SETUP_REVIEW_POLICY: '{' }, now: f.now }));
});
await check('unpaid, incomplete, underpaid or mixed-environment sessions fail settlement', async () => {
  for (const patch of [{ payment_status: 'unpaid' }, { status: 'open' }, { amount_total: 1 }, { livemode: true }]) {
    const f = await fixture(); Object.assign(f.input.session, patch); blocked(f.result(), 'verified_settled_payment_required');
  }
});
await check('refunds, disputes, uncaptured funds and wrong intent amounts stop review', async () => {
  for (const patch of [{ refunded: true }, { disputed: true }, { captured: false }, { amount_refunded: 1 }, { amount: 1 }]) {
    const f = await fixture(); Object.assign(f.input.session.payment_intent.latest_charge, patch); blocked(f.result(), 'verified_settled_payment_required');
  }
  const f = await fixture(); f.input.session.payment_intent.amount_received = 1; blocked(f.result());
});
await check('receipt and queue must match the exact purchaser, intent, mode and purchased catalog terms', async () => {
  for (const table of ['receipt','queue']) for (const patch of [{ user_id: 'wrong' }, { amount_cents: 1 }, { duration_days: 365 }, { payment_intent_id: 'pi_other' }]) {
    const f = await fixture(); Object.assign(f.input[table], patch); blocked(f.result(), 'verified_pending_order_required');
  }
});
await check('legacy activated receipts and orders already requiring review cannot auto-progress', async () => {
  for (const table of ['receipt','queue']) { const f = await fixture(); Object.assign(f.input[table], table === 'receipt' ? { activated: true } : { fulfillment_status: 'requires_review' }); blocked(f.result()); }
});
await check('historical orders and reversed or future recording timestamps are held', async () => {
  for (const patch of [{ session: { created: 1 } }, { receipt: { recorded_at: '2040-01-01T00:00:00Z' } }, { queue: { queued_at: '2000-01-01T00:00:00Z' } }]) {
    const f = await fixture(); for (const [key, value] of Object.entries(patch)) Object.assign(f.input[key], value); blocked(f.result(), 'order_outside_review_window');
  }
});
await check('anonymous, unconfirmed, changed-email or mismatched profile identities require review', async () => {
  for (const patch of [{ is_anonymous: true }, { email_confirmed_at: null }, { email: 'other@example.invalid' }]) {
    const f = await fixture(); Object.assign(f.input.customer.user, patch); blocked(f.result(), 'confirmed_customer_identity_required');
  }
});
await check('active website access, active connections or any prior service expiry blocks a new line', async () => {
  for (const patch of [{ subscription_status: 'active' }, { active_connections: 1 }, { subscription_expires_at: '2020-01-01T00:00:00Z' }]) {
    const f = await fixture(); Object.assign(f.input.customer.profile, patch); blocked(f.result(), 'existing_website_service_requires_review');
  }
});
await check('prior trials, provider lines, fulfillments, CRM matches, ambiguity and missing history stop', async () => {
  for (const key of ['priorProviderLine','priorTrial','priorFulfillment','existingCrmCustomer','ambiguous']) {
    const f = await fixture(); f.input.history[key] = true; blocked(f.result(), 'existing_or_unknown_service_requires_review');
  }
  const f = await fixture(); delete f.input.history.priorTrial; blocked(f.result());
});
await check('renewals and missing or unbound authenticated new-service declarations require review', async () => {
  for (const patch of [{ kind: 'renewal' }, { newServiceAttested: false }, { source: 'browser_metadata' }, { sessionId: 'cs_test_other' }]) {
    const f = await fixture(); Object.assign(f.input.purchaseIntent, patch); blocked(f.result(), 'new_service_purchase_intent_required');
  }
});
await check('every existing or unknown attempt stays stopped, including ambiguous and completed attempts', async () => {
  for (const state of [undefined,'reserved','dispatching','provider_verified','credentials_ready','reconciliation_required']) {
    const f = await fixture(); f.input.attempt.state = state; blocked(f.result(), 'existing_or_unknown_attempt_requires_review');
  }
});
await check('order, customer-history, attempt, provider and budget snapshots must all be fresh', async () => {
  for (const key of ['input','history','attempt','provider','budget']) {
    const f = await fixture(); (key === 'input' ? f.input : f.input[key]).checkedAt = f.now - 31000; blocked(f.result());
  }
});
await check('changed package cost or channel groups invalidate the approved fingerprint', async () => {
  for (const patch of [{ paid: { count: 1, unit: 'months', credits: 1.6 } }, { bouquets: [99] }]) {
    const f = await fixture(); Object.assign(f.input.provider.packages[0], patch); blocked(f.result(), 'package_or_cost_not_in_review_policy');
  }
});
await check('wrong reseller, unapproved package IDs or fingerprints stop', async () => {
  const f = await fixture(); f.input.provider.account.id = '88888'; blocked(f.result(), 'fresh_reseller_snapshot_required');
  for (const patch of [{ packageId: '88888' }, { packageFingerprint: 'a'.repeat(64) }]) {
    const g = await fixture(); Object.assign(g.policy.packages[0], patch); blocked(g.result(), 'package_or_cost_not_in_review_policy');
  }
});
await check('per-package ceilings are compared as exact integer credit units', async () => {
  const f = await fixture(); f.policy.packages[0].maxCreditUnits = '1499999'; blocked(f.result(), 'package_or_cost_not_in_review_policy');
  f.policy.packages[0].maxCreditUnits = '1500000'; eligible(f.result());
});
await check('daily limits include both spent and already-reserved credits', async () => {
  const f = await fixture(); f.input.budget.spentUnits = '18000000'; f.input.budget.reservedUnits = '1000000'; blocked(f.result(), 'daily_credit_limit_reached');
  f.input.budget.spentUnits = '17500000'; eligible(f.result());
});
await check('provider balance must preserve the configured reserve after outstanding reservations', async () => {
  const f = await fixture(); f.input.provider.account.credits = '6.499999'; blocked(f.result(), 'reseller_credit_reserve_required');
  f.input.provider.account.credits = '6.5'; eligible(f.result()); f.input.budget.reservedUnits = '1'; blocked(f.result());
});
await check('stale or wrong policy/day/reseller/mode budgets and a busy reseller cannot progress', async () => {
  for (const patch of [{ policyId: 'wrong' }, { utcDay: '2030-01-14' }, { resellerId: '88888' }, { environment: 'production' },
    { spentUnits: '-1' }, { reservedUnits: 0 }, { resellerDispatchAvailable: false }]) {
    const f = await fixture(); Object.assign(f.input.budget, patch); blocked(f.result(), 'fresh_durable_budget_snapshot_required');
  }
});
await check('browser-style policy overrides cannot enable review and never produce an approval token', async () => {
  const f = await fixture(); f.input.policy = f.policy; f.input.enabled = true;
  assert.equal(review(f.input, { env: {}, now: f.now }).decision, 'disabled');
  const result = f.result(); eligible(result); assert.equal('approvalToken' in result, false);
  assert.equal(result.candidate.purpose, 'automatic-setup-review-only');
});
await check('review binding changes with policy limits or reserved credit balances', async () => {
  const f = await fixture(); const first = f.result().candidateHash;
  f.policy.dailyCreditUnits = '21000000'; assert.notEqual(f.result().candidateHash, first);
  const second = f.result().candidateHash; f.input.budget.reservedUnits = '1'; assert.notEqual(f.result().candidateHash, second);
});
await check('review result excludes customer email, credentials and raw provider secrets', async () => {
  const f = await fixture(); f.input.provider.account.api_key = 'MUST_NOT_LEAK'; f.input.customer.password = 'MUST_NOT_LEAK';
  const result = f.result(); eligible(result); const json = JSON.stringify(result);
  assert.ok(!json.includes('MUST_NOT_LEAK')); assert.ok(!json.includes('fictional@example.invalid'));
});
console.log(`${count} automatic-setup review checks passed. No real policy, budget reservation, provider request, credit spend or account change occurred.`);
