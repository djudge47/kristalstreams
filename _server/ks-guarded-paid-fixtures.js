import { createHash } from 'node:crypto';
import { createGuardedPaidExecutor } from './ks-guarded-paid-executor.js';
import { issuePaidApproval } from './ks-paid-approval.js';
import { buildPaidPlanMapping } from './ks-roomba-plan-mapping.js';
import { sealStreamingLogin } from './ks-login-envelope.js';
import { simulationSession, simulationOwner } from './ks-new-paid-simulation.js';

// Fictional records only. No network, real key, Supabase client or provider adapter is imported.
const hash = value => createHash('sha256').update(value).digest('hex');
export function createGuardedWorkerFixture(fault = '') {
  const now = Date.UTC(2030, 0, 15, 12), attemptId = '00000000-0000-4000-8000-000000000031', approverId = '00000000-0000-4000-8000-000000000032';
  const env = { VERCEL_ENV: 'preview', ROOMBA_PREVIEW_SECRET: 'synthetic_approval_secret_not_real_0123456789', KS_LOGIN_ENCRYPTION_KEY: Buffer.alloc(32, 3).toString('base64') };
  const packages = [1, 3, 6, 12].flatMap((months, i) => Array.from({ length: 5 }, (_, j) => ({ id: String(1000 + i * 5 + j), name: `${months} Months + ${j + 1} Connections`, maxConnections: j + 1,
    paid: { count: months, unit: 'months', credits: (i + 1) * (j + 1) + 0.5 }, trial: null, bouquets: [13, 14], issues: [] })));
  const entry = buildPaidPlanMapping({ schemaVersion: 1, readOnly: true, checkedAt: new Date(now).toISOString(), packages }).entries[0];
  const session = simulationSession('bronze', 1);
  session.payment_intent = { id: 'pi_SimulatedNewCustomer', status: 'succeeded', livemode: false, currency: 'usd', amount: 2000, amount_received: 2000,
    latest_charge: { id: 'ch_Fictional', payment_intent: 'pi_SimulatedNewCustomer', livemode: false, currency: 'usd', amount: 2000, paid: true, captured: true, disputed: false, refunded: false, amount_refunded: 0 } };
  const login = { username: 'ks_fixture_paid_customer', password: 'synthetic_password_only_0123456789' };
  const account = { id: '99999', username: 'synthetic_reseller', credits: '100.5' };
  const review = { session, ownerId: simulationOwner, approverId, entry, currentPackage: packages[0], account, checkedAt: now };
  const approval = issuePaidApproval(review, env, now);
  const row = { attempt_id: attemptId, user_id: simulationOwner, checkout_session_id: session.id, payment_intent_id: session.payment_intent.id,
    claim_token: '00000000-0000-4000-8000-000000000033', state: 'reserved', reseller_id: account.id, package_id: entry.provider.id,
    package_months: 1, connections: 1, expected_credits: 1.5, bouquet_ids: [13, 14], username_hash: hash(login.username),
    binding_hash: hash(JSON.stringify({ sessionId: session.id, ownerId: simulationOwner, intentId: session.payment_intent.id,
      tier: 'bronze', connections: 1, amountCents: 2000, resellerId: account.id, packageFingerprint: entry.provider.fingerprint })),
    login_envelope: sealStreamingLogin(login, { environment: 'preview', ownerId: simulationOwner, sessionId: session.id, attemptId }, env) };
  const line = { id: '9999901', username: login.username, resellerId: account.id, packageId: entry.provider.id, connections: 1,
    trial: false, enabled: true, adminEnabled: true, expiresAt: new Date(now + 31 * 86400000).toISOString(), bouquetIds: [13, 14] };
  const calls = { creates: 0, begins: 0, verified: 0, completed: 0, reconciled: 0, paymentReads: 0 };
  let completionFailed = false;
  const store = {
    async load() { return structuredClone(row); },
    async assertNewCustomer() { if (fault === 'existing_customer') throw new Error('existing_streaming_access_requires_review'); },
    async begin(_attempt, signed) {
      calls.begins++; if (row.state !== 'reserved') return false;
      if (signed.costUnits !== '1500000' || signed.balanceUnits !== '100500000' || !/^[a-f0-9]{64}$/.test(signed.tokenHash)) throw new Error('invalid_signed_cost');
      row.state = 'dispatching';
      if (fault === 'lost_begin_reply') throw new Error('synthetic_lost_reply');
      return true;
    },
    async verified(_attempt, result) {
      row.state = 'provider_verified'; row.provider_line_id = result.id; row.provider_expires_at = result.expiresAt; calls.verified++;
      if (fault === 'lost_verified_reply') throw new Error('synthetic_lost_reply');
    },
    async reconcile() { if (row.state === 'dispatching') { row.state = 'reconciliation_required'; calls.reconciled++; } },
    async complete(_attempt, username) {
      if (username !== login.username) throw new Error('wrong_login');
      if (fault === 'completion_failure' && !completionFailed) { completionFailed = true; throw new Error('synthetic_transaction_rollback'); }
      if (row.state !== 'credentials_ready') { calls.completed++; row.state = 'credentials_ready'; }
    },
  };
  const provider = {
    async snapshot() { return { checkedAt: fault === 'stale_snapshot' ? now - 31000 : now, account: { ...account, credits: fault === 'changed_balance' ? '101.5' : account.credits },
      packages: fault === 'changed_package' ? packages.map(p => ({ ...p, bouquets: [99] })) : packages }; },
    async create() { calls.creates++; if (fault === 'timeout') throw new Error('synthetic_timeout'); return structuredClone(line); },
    async line() { return fault === 'wrong_line' ? { ...line, id: '9999902' } : fault === 'wrong_groups' ? { ...line, bouquetIds: [99] } : structuredClone(line); },
    async account() { return { ...account, credits: fault === 'unexpected_debit' ? '98' : '99' }; },
  };
  const payments = { async retrieve() { calls.paymentReads++; return fault === 'refunded' ? { ...session, payment_intent: { ...session.payment_intent, latest_charge: { ...session.payment_intent.latest_charge, amount_refunded: 100 } } } : structuredClone(session); } };
  const execute = createGuardedPaidExecutor({ store, provider, payments, env, now: () => now });
  return { execute, input: { attemptId, ownerId: simulationOwner, approverId, approvalToken: approval.token, confirmed: true }, row, calls, review, env, now, login, session, provider, store, payments };
}

export async function runGuardedPaidWorkerChecks() {
  const checks = [];
  const check = async (id, label, fn) => { if (await fn() !== true) throw new Error('guarded_worker_check_failed'); checks.push({ id, label, passed: true }); };
  await check('success', 'Verified creation and local completion', async () => { const f = createGuardedWorkerFixture(); const r = await f.execute(f.input); return r.state === 'credentials_ready' && f.calls.creates === 1 && f.calls.completed === 1; });
  await check('duplicates', 'Concurrent and repeated attempts create once', async () => { const f = createGuardedWorkerFixture(); await Promise.all(Array.from({ length: 12 }, () => f.execute(f.input))); const r = await f.execute(f.input); return r.state === 'credentials_ready' && f.calls.creates === 1 && f.calls.completed === 1; });
  await check('timeout', 'Uncertain provider result stays locked', async () => { const f = createGuardedWorkerFixture('timeout'); await f.execute(f.input); const r = await f.execute(f.input); return r.state === 'reconciliation_required' && f.calls.creates === 1 && f.calls.completed === 0; });
  await check('begin_reply', 'Lost dispatch acknowledgement never sends', async () => { const f = createGuardedWorkerFixture('lost_begin_reply'); try { await f.execute(f.input); } catch { /* expected */ } const r = await f.execute(f.input); return r.state === 'reconciliation_required' && f.calls.creates === 0; });
  await check('local_retry', 'Completion retry reuses verified provider result', async () => { const f = createGuardedWorkerFixture('completion_failure'); const first = await f.execute(f.input); const r = await f.execute(f.input); return first.state === 'completion_pending' && r.state === 'credentials_ready' && f.calls.creates === 1 && f.calls.completed === 1 && f.calls.paymentReads === 2; });
  await check('changed_review', 'Changed balance, package or stale snapshot stops', async () => { for (const fault of ['changed_balance', 'changed_package', 'stale_snapshot']) { const f = createGuardedWorkerFixture(fault); try { await f.execute(f.input); return false; } catch { if (f.calls.creates || f.calls.begins) return false; } } return true; });
  await check('payment_access', 'Refunds and existing access stop before dispatch', async () => { for (const fault of ['refunded', 'existing_customer']) { const f = createGuardedWorkerFixture(fault); try { await f.execute(f.input); return false; } catch { if (f.calls.creates || f.calls.begins) return false; } } return true; });
  await check('verification', 'Wrong line, groups or debit requires review', async () => { for (const fault of ['wrong_line', 'wrong_groups', 'unexpected_debit']) { const f = createGuardedWorkerFixture(fault); const r = await f.execute(f.input); await f.execute(f.input); if (r.state !== 'reconciliation_required' || f.calls.creates !== 1 || f.calls.completed) return false; } return true; });
  await check('approval', 'Explicit signed credit approval is required', async () => { for (const patch of [{ confirmed: false }, { approvalToken: 'invalid' }]) { const f = createGuardedWorkerFixture(); try { await f.execute({ ...f.input, ...patch }); return false; } catch { if (f.calls.creates || f.calls.begins) return false; } } return true; });
  return checks;
}
