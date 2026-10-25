import { PaymentError, getPlan, validatePaidSession } from './ks-payment-validation.js';
import { buildRequestedRenewalReview } from './ks-crm-renewal-order-review.js';
import { buildPackageSummary } from '../_shared/ks-roomba-package-summary.js';
import { createHash } from 'node:crypto';
import { creditUnits } from './ks-paid-approval.js';
const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
const date = v => typeof v === 'string' && Number.isFinite(Date.parse(v));
const reasons = new Set(['binding_matches','renewal_route_required','ownership_or_service_changed','explicit_selection_required',
  'current_service_requires_review','saved_service_facts_changed']);
const unavailable = () => new PaymentError(503, 'Your payment is recorded, but renewal verification needs attention. Contact support; do not pay again.');
function publicReview(data, reference, owner) {
  if (!data || data.reference !== reference || data.accountId !== owner || data.mayDispatch !== false || data.providerActivated !== false
    || !['awaiting_verification','review_required'].includes(data.state) || !reasons.has(data.reason)
    || !(data.operationId === null || uuid(data.operationId)) || typeof data.replayed !== 'boolean'
    || !(data.preparedAt === null || date(data.preparedAt))
    || ((data.operationId === null) !== (data.preparedAt === null))
    || (data.state === 'awaiting_verification' && (!data.operationId || data.reason !== 'binding_matches'))) throw unavailable();
  return { reference, operationId: data.operationId, state: data.state, reason: data.reason,
    preparedAt: data.preparedAt, replayed: data.replayed, mayDispatch: false, providerActivated: false };
}

export async function preparePaidRenewalReview(session, ownerId, admin) {
  const payment = validatePaidSession(session, true, ownerId);
  const { data, error } = await admin.rpc('ks_prepare_paid_renewal_review', { p_session: payment.sessionId, p_user: payment.userId });
  if (error) throw unavailable();
  return publicReview(data, payment.sessionId, payment.userId);
}

// Internal current-binding read. No caller-provided customer, line, plan or
// provider endpoint is accepted. A review identity is never execution consent.
async function currentReview(admin, reference, ownerId, operationId) {
  const { data, error } = await admin.rpc('ks_check_paid_renewal_review', { p_session: reference, p_user: ownerId, p_operation: operationId });
  if (error || data?.reference !== reference || data.accountId !== ownerId || data.operationId !== operationId
    || !['awaiting_verification','review_required'].includes(data.state) || !reasons.has(data.reason)
    || data.mayDispatch !== false || data.providerActivated !== false || !/^[a-f0-9]{64}$/.test(data.fingerprint || '')) throw unavailable();
  if (data.state === 'review_required') return { ...data, binding: null };
  const b = data.binding;
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw unavailable();
  const plan = getPlan(b.tier, b.connections);
  if (b.purpose !== 'paid-renewal-review/v1' || b.reference !== reference || b.userId !== ownerId || !uuid(b.customerId)
    || !/^pi_[A-Za-z0-9]+$/.test(b.paymentIntentId || '') || !/^[1-9]\d{0,14}$/.test(b.lineId || '')
    || !/^[A-Za-z0-9_.-]{3,64}$/.test(b.username || '') || b.amountCents !== plan.cents || b.durationDays !== plan.days
    || b.currency !== 'usd' || !Number.isInteger(b.currentConnections) || b.currentConnections < 1 || b.currentConnections > 5
    || !(b.currentPackageName === null || (typeof b.currentPackageName === 'string' && b.currentPackageName.length <= 200))
    || !date(b.currentExpiresAt) || !date(b.ownerConfirmedAt)) throw unavailable();
  return data;
}

// Internal evidence stays on the server; HTTP receives result only.
export async function inspectPaidRenewalReview({ admin, provider, reference, ownerId, operationId, now = Date.now }) {
  if (!uuid(ownerId) || !uuid(operationId) || typeof reference !== 'string' || !/^cs_live_[A-Za-z0-9]+$/.test(reference)
    || typeof provider?.snapshot !== 'function') throw unavailable();
  const before = await currentReview(admin, reference, ownerId, operationId);
  const stopped = () => ({ result: { reference, operationId, state: 'review_required', mayDispatch: false, providerActivated: false }, quote: null });
  if (before.state !== 'awaiting_verification') return stopped();
  const b = before.binding;
  const customer = { id: b.customerId, external_id: b.lineId, username: b.username, expiration_at: b.currentExpiresAt,
    connections_allowed: b.currentConnections, package_name: b.currentPackageName };
  const snapshot = await provider.snapshot(customer);
  const requested = { months: ({ bronze: 1, silver: 3, gold: 6, platinum: 12 })[b.tier], connections: b.connections };
  const review = buildRequestedRenewalReview({ ...snapshot, customer }, requested, now());
  const currentPackage = buildPackageSummary(snapshot.packages, snapshot.checkedAt).packages.find(p => p.id === String(snapshot.line.packageId));
  if (b.currentPackageName !== null && currentPackage?.name !== b.currentPackageName) return stopped();
  if (snapshot.line.connections !== b.currentConnections) return stopped();
  const after = await currentReview(admin, reference, ownerId, operationId);
  if (after.state !== 'awaiting_verification' || after.fingerprint !== before.fingerprint
    || JSON.stringify(after.binding) !== JSON.stringify(before.binding) || Date.parse(review.validUntil) <= now()) return stopped();
  const result = { reference, operationId, state: review.status === 'catalog_compatible' ? 'verified_for_review' : 'review_required',
    mayDispatch: false, providerActivated: false, requestedMonths: requested.months, requestedConnections: requested.connections,
    checkedAt: review.checkedAt, validUntil: review.validUntil, blockers: [...review.blockers] };
  if (review.status !== 'catalog_compatible') return { result, quote: null };
  const catalog = buildPackageSummary(snapshot.packages, snapshot.checkedAt).packages;
  const target = catalog.find(p => p.id === review.packageId);
  const canonicalPackage = p => ({ ...p, bouquets: [...p.bouquets].sort((a,b) => a-b) });
  const hash = value => createHash('sha256').update(value).digest('hex');
  const costUnits = String(creditUnits(review.credits));
  const facts = { purpose: 'paid-renewal-quote/v1', reference, operationId, bindingFingerprint: before.fingerprint,
    resellerId: String(snapshot.account.id), lineId: b.lineId, username: b.username, customerId: b.customerId,
    currentPackageId: currentPackage.id, packageId: target.id, packageName: target.name,
    months: requested.months, connections: requested.connections, previousExpiresAt: new Date(b.currentExpiresAt).toISOString(),
    bouquetIds: [...review.currentGroupIds], catalogFingerprint: hash(JSON.stringify([canonicalPackage(currentPackage),canonicalPackage(target)])), costUnits };
  const canonical = JSON.stringify(facts), fingerprint = hash(canonical);
  result.quote = { fingerprint, costCredits: String(review.credits), packageName: target.name,
    currentMonths: review.currentMonths, currentConnections: review.currentConnections };
  return { result, quote: { canonical, fingerprint, costUnits, balanceUnits: String(creditUnits(snapshot.account.credits)),
    checkedAt: review.checkedAt, validUntil: review.validUntil } };
}

export async function verifyPaidRenewalReview(input) { return (await inspectPaidRenewalReview(input)).result; }
