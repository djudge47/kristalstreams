import assert from 'node:assert/strict';
import { recordPaymentReceipt } from '../_server/ks-receipt-only.js';

const owner = '00000000-0000-4000-8000-000000000001';
const session = {
  id: 'cs_test_FictionalReceipt', livemode: false, mode: 'payment', status: 'complete', payment_status: 'paid',
  currency: 'usd', amount_total: 2000, amount_subtotal: 2000, payment_intent: 'pi_FictionalReceipt',
  metadata: { user_id: owner, plan: 'bronze', connections: '1', interval: 'monthly', price: '20', duration_days: '30' },
};
const result = {
  ok: true, payment_recorded: true, test_mode: true, receipt_reference: session.id,
  account_id: owner, tier: 'bronze', connections_allowed: 1, activated: false, provider_activated: false,
  legacy_website_activated: false, order_status: 'awaiting_activation', recorded_at: '2026-10-18T00:00:00Z', replayed: false,
};
let count = 0;
async function check(label, fn) { await fn(); count++; console.log(`PASS: ${label}`); }
function backend(reply = result, error = null) {
  return { rpc: async (name, args) => {
    assert.equal(name, 'ks_record_paid_checkout');
    assert.equal(args.p_user_id, owner);
    assert.equal(args.p_amount_cents, 2000);
    return { data: reply, error };
  } };
}
await check('sandbox payment stays pending and never grants readiness', async () => {
  const recorded = await recordPaymentReceipt(session, false, owner, backend());
  assert.equal(recorded.activated, false); assert.equal(recorded.provider_activated, false);
  assert.equal(recorded.order_status, 'awaiting_activation');
});
await check('live payment also stays pending', async () => {
  const live = { ...session, id: 'cs_live_FictionalReceipt', livemode: true };
  const recorded = await recordPaymentReceipt(live, true, owner, backend({ ...result, test_mode: false, receipt_reference: live.id }));
  assert.equal(recorded.test_mode, false); assert.equal(recorded.activated, false);
});
await check('unpaid, incomplete, foreign-owner, wrong-environment and underpaid sessions never reach storage', async () => {
  const forbidden = { rpc: () => assert.fail('invalid payment reached storage') };
  for (const changed of [{ payment_status: 'unpaid' }, { status: 'open' }, { amount_total: 1 }, { livemode: true },
    { metadata: { ...session.metadata, user_id: '00000000-0000-4000-8000-000000000002' } }]) {
    await assert.rejects(() => recordPaymentReceipt({ ...session, ...changed }, false, owner, forbidden));
  }
});
await check('wrong receipt owner, reference, mode, tier or allowance is rejected', async () => {
  for (const change of [{ account_id: 'wrong' }, { receipt_reference: 'cs_test_Other' }, { test_mode: false },
    { tier: 'platinum' }, { connections_allowed: 5 }]) {
    await assert.rejects(() => recordPaymentReceipt(session, false, owner, backend({ ...result, ...change })), /do not pay again/);
  }
});
await check('receipt recording cannot accept provider readiness or a missing pending status', async () => {
  for (const change of [{ activated: true }, { provider_activated: true }, { order_status: 'setup_complete' },
    { recorded_at: 'invalid' }, { replayed: null }, { payment_recorded: false }, { ok: false }]) {
    await assert.rejects(() => recordPaymentReceipt(session, false, owner, backend({ ...result, ...change })));
  }
});
await check('old website activation requires review without claiming streaming service', async () => {
  const recorded = await recordPaymentReceipt(session, false, owner, backend({ ...result, legacy_website_activated: true, order_status: 'requires_review' }));
  assert.equal(recorded.order_status, 'requires_review'); assert.equal(recorded.activated, false);
  await assert.rejects(() => recordPaymentReceipt(session, false, owner, backend({ ...result, legacy_website_activated: true })));
});
await check('receipt replay is preserved without triggering any other side effect', async () => {
  assert.equal((await recordPaymentReceipt(session, false, owner, backend({ ...result, replayed: true }))).replayed, true);
});
await check('unknown database fields are excluded from the response', async () => {
  const recorded = await recordPaymentReceipt(session, false, owner, backend({ ...result, password: 'fictional', payment_intent: 'pi_private' }));
  assert.equal('password' in recorded, false); assert.equal('payment_intent' in recorded, false); assert.equal('account_id' in recorded, false);
});
await check('database failure or an incomplete reply cannot return false success', async () => {
  await assert.rejects(() => recordPaymentReceipt(session, false, owner, backend(null, { message: 'offline' })), /do not pay again/);
  await assert.rejects(() => recordPaymentReceipt(session, false, owner, backend({ ok: true })), /do not pay again/);
});
console.log(`${count} receipt-only checks passed. No provider, Stripe, email or database call was made.`);
