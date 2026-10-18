import { createHash } from 'node:crypto';
import { getPlan, validatePaidSession } from './ks-payment-validation.js';
import { verifySettledPaidIntent } from './ks-paid-settlement.js';
import { buildPaidPlanMapping, validateMappedPackage } from './ks-roomba-plan-mapping.js';
import { creditUnits } from './ks-paid-approval.js';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const fresh = (at, now) => Number.isSafeInteger(at) && at <= now && now - at <= 30000;
const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const email = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const money = (value, positive = true) => typeof value === 'string' && /^(0|[1-9]\d{0,12})$/.test(value)
  && BigInt(value) <= 1000000000000n && (!positive || BigInt(value) > 0n);
const keys = (value, expected) => value && Object.keys(value).sort().join(',') === expected.split(',').sort().join(',');
const stop = reason => ({ decision: 'manual_review', reason, mayDispatch: false });

function readPolicy(raw, environment, now) {
  const policy = JSON.parse(raw);
  if (!keys(policy, 'version,mode,environment,policyId,resellerId,notBefore,expiresAt,perOrderCreditUnits,dailyCreditUnits,minReserveCreditUnits,packages')
    || policy.version !== 1 || policy.mode !== 'review-only' || policy.environment !== environment
    || !uuid(policy.policyId) || typeof policy.resellerId !== 'string' || !/^[1-9]\d{0,14}$/.test(policy.resellerId)
    || !date(policy.notBefore) || !date(policy.expiresAt) || Date.parse(policy.notBefore) > now
    || Date.parse(policy.expiresAt) <= now || Date.parse(policy.expiresAt) - Date.parse(policy.notBefore) > 86400000
    || !money(policy.perOrderCreditUnits) || !money(policy.dailyCreditUnits) || !money(policy.minReserveCreditUnits, false)
    || BigInt(policy.perOrderCreditUnits) > BigInt(policy.dailyCreditUnits)
    || !Array.isArray(policy.packages) || !policy.packages.length || policy.packages.length > 20) throw new Error('invalid_review_policy');
  const seen = new Set();
  for (const pkg of policy.packages) {
    if (!keys(pkg, 'tier,connections,packageId,packageFingerprint,maxCreditUnits')) throw new Error('invalid_review_policy');
    const plan = getPlan(pkg.tier, pkg.connections), id = `${plan.tier}/${plan.connections}`;
    if (plan.tier !== pkg.tier || !Number.isInteger(pkg.connections) || seen.has(id)
      || typeof pkg.packageId !== 'string' || !/^[1-9]\d{0,14}$/.test(pkg.packageId)
      || !/^[a-f0-9]{64}$/.test(pkg.packageFingerprint || '') || !money(pkg.maxCreditUnits)
      || BigInt(pkg.maxCreditUnits) > BigInt(policy.perOrderCreditUnits)) throw new Error('invalid_review_policy');
    seen.add(id);
  }
  return policy;
}

// Pure, server-only eligibility review. No database/client/provider adapter is
// imported, no approval token is issued and every result has mayDispatch:false.
// A future worker must authenticate, reload these facts and atomically claim
// both the one-time order and budget before a separately authorized dispatch.
export function reviewAutomaticSetupCandidate(input, { env = process.env, now = Date.now() } = {}) {
  if (!env.KS_AUTOMATIC_SETUP_REVIEW_POLICY) return { decision: 'disabled', reason: 'review_policy_absent', mayDispatch: false };
  if (!['preview', 'production'].includes(env.VERCEL_ENV) || !Number.isSafeInteger(now)) return stop('review_environment_invalid');
  let policy;
  try { policy = readPolicy(env.KS_AUTOMATIC_SETUP_REVIEW_POLICY, env.VERCEL_ENV, now); } catch { return stop('review_policy_invalid'); }
  const live = env.VERCEL_ENV === 'production';
  const { session, receipt, queue, customer, history, purchaseIntent, attempt, provider, budget } = input || {};
  let payment;
  try {
    payment = validatePaidSession(session, live, customer?.user?.id);
    verifySettledPaidIntent(session, payment, live);
  } catch { return stop('verified_settled_payment_required'); }
  if (!fresh(input?.checkedAt, now)) return stop('fresh_order_evidence_required');
  const binding = row => row?.checkout_session_id === payment.sessionId && row.payment_intent_id === payment.intentId
    && row.user_id === payment.userId && row.livemode === live && row.tier === payment.tier
    && row.connections === payment.connections && row.duration_days === payment.days
    && row.amount_cents === payment.cents && row.currency === 'usd';
  if (!binding(receipt) || !binding(queue) || receipt.activated !== false || receipt.expires_at !== null
    || queue.fulfillment_status !== 'awaiting_activation' || !date(receipt.recorded_at) || !date(queue.queued_at)) return stop('verified_pending_order_required');
  const start = Date.parse(policy.notBefore), recorded = Date.parse(receipt.recorded_at);
  if (!Number.isSafeInteger(session.created) || session.created * 1000 < start || session.created * 1000 > now
    || recorded < session.created * 1000 || recorded > now || Date.parse(queue.queued_at) < recorded
    || Date.parse(queue.queued_at) > now) return stop('order_outside_review_window');
  const user = customer?.user, profile = customer?.profile;
  if (!uuid(user?.id) || user.id !== payment.userId || user.is_anonymous !== false || !email(user.email)
    || !date(user.email_confirmed_at) || Date.parse(user.email_confirmed_at) > now || profile?.id !== user.id
    || !email(profile.email) || profile.email.toLowerCase() !== user.email.toLowerCase()) return stop('confirmed_customer_identity_required');
  if (profile.subscription_status !== 'inactive' || profile.active_connections !== 0 || profile.subscription_expires_at !== null) return stop('existing_website_service_requires_review');
  if (history?.userId !== user.id || history.localHistoryChecked !== true || !fresh(history.checkedAt, now)
    || !['priorProviderLine', 'priorTrial', 'priorFulfillment', 'existingCrmCustomer', 'ambiguous'].every(key => history[key] === false)) return stop('existing_or_unknown_service_requires_review');
  if (purchaseIntent?.source !== 'authenticated_checkout' || purchaseIntent.userId !== user.id
    || purchaseIntent.sessionId !== payment.sessionId || purchaseIntent.kind !== 'new_service'
    || purchaseIntent.newServiceAttested !== true || !date(purchaseIntent.capturedAt)
    || Date.parse(purchaseIntent.capturedAt) < start || Date.parse(purchaseIntent.capturedAt) > recorded) return stop('new_service_purchase_intent_required');
  if (attempt?.userId !== user.id || attempt.sessionId !== payment.sessionId || !fresh(attempt.checkedAt, now)
    || attempt.state !== 'none') return stop('existing_or_unknown_attempt_requires_review');
  if (!fresh(provider?.checkedAt, now) || provider?.account?.id !== policy.resellerId) return stop('fresh_reseller_snapshot_required');
  let selected, entry, cost, balance;
  try {
    const mapping = buildPaidPlanMapping({ schemaVersion: 1, readOnly: true, checkedAt: new Date(provider.checkedAt).toISOString(), packages: provider.packages });
    entry = mapping.entries.find(row => row.tier === payment.tier && row.connections === payment.connections);
    selected = validateMappedPackage(entry, provider.packages.find(pkg => pkg.id === entry?.provider.id));
    cost = creditUnits(selected.credits); balance = creditUnits(provider.account.credits);
  } catch { return stop('provider_catalog_requires_review'); }
  const approved = policy.packages.find(pkg => pkg.tier === payment.tier && pkg.connections === payment.connections);
  if (!approved || selected.id !== approved.packageId || entry.provider.fingerprint !== approved.packageFingerprint
    || cost > BigInt(approved.maxCreditUnits) || cost > BigInt(policy.perOrderCreditUnits)) return stop('package_or_cost_not_in_review_policy');
  const utcDay = new Date(now).toISOString().slice(0, 10);
  if (budget?.policyId !== policy.policyId || budget.resellerId !== policy.resellerId || budget.environment !== policy.environment
    || budget.utcDay !== utcDay || !fresh(budget.checkedAt, now) || budget.resellerDispatchAvailable !== true
    || !money(budget.spentUnits, false) || !money(budget.reservedUnits, false)) return stop('fresh_durable_budget_snapshot_required');
  const spent = BigInt(budget.spentUnits), reserved = BigInt(budget.reservedUnits);
  if (spent + reserved + cost > BigInt(policy.dailyCreditUnits)) return stop('daily_credit_limit_reached');
  if (balance < reserved + cost + BigInt(policy.minReserveCreditUnits)) return stop('reseller_credit_reserve_required');
  const candidate = { version: 1, purpose: 'automatic-setup-review-only', environment: policy.environment,
    policyId: policy.policyId, userId: user.id, sessionId: payment.sessionId, intentId: payment.intentId,
    policyHash: createHash('sha256').update(JSON.stringify(policy)).digest('hex'),
    resellerId: policy.resellerId, packageId: selected.id, packageFingerprint: entry.provider.fingerprint,
    costUnits: String(cost), balanceUnits: String(balance), spentUnits: String(spent), reservedUnits: String(reserved),
    budgetUtcDay: utcDay, purchaseIntentCapturedAt: purchaseIntent.capturedAt, checkedAt: now };
  return { decision: 'eligible_for_durable_claim_review', reason: 'read_only_checks_passed', mayDispatch: false,
    candidate, candidateHash: createHash('sha256').update(JSON.stringify(candidate)).digest('hex') };
}
