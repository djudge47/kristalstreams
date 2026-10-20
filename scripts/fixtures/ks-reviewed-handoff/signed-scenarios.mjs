import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { createReviewedHandoffRehearsal } from '../../../_server/ks-reviewed-handoff-rehearsal.js';
import { json, literal, summary, providerResult } from './fixtures.mjs';
import { transfer, settle, handoffSummary } from './handoff-fixtures.mjs';
import { signedHandoffFixtureFactory } from './signed-fixtures.mjs';
export async function runSignedHandoffChecks({admin,worker,check,overlap=true}) {
 const setup=signedHandoffFixtureFactory(admin,worker);
 const snap=async f=>({...await summary(admin,f),...await handoffSummary(admin,f)});
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
  if (overlap) await check('overlapping JavaScript callers receive at most one committed fictional decision', async () => {
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
    const entrypoints = await readdir(new URL('../../../api/', import.meta.url)); assert.equal(entrypoints.length, 12);
    for (const file of entrypoints) {
      assert.ok(!(await readFile(new URL(`../../../api/${file}`, import.meta.url), 'utf8')).includes('ks-reviewed-handoff-rehearsal'));
    }
  });
}
