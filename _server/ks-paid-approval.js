import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { validatePaidSession } from './ks-payment-validation.js';
import { validateMappedPackage } from './ks-roomba-plan-mapping.js';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function creditUnits(value) {
  if (!['number', 'string'].includes(typeof value) || !/^\d{1,7}(?:\.\d{1,6})?$/.test(String(value))) throw new Error('invalid_credit_value');
  const [whole, fraction = ''] = String(value).split('.');
  const units = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, '0'));
  if (units > 1000000000000n) throw new Error('invalid_credit_value');
  return units;
}
export function paidReviewBinding({ session, ownerId, approverId, entry, currentPackage, account, checkedAt }, now) {
  if (!uuid(ownerId) || !uuid(approverId) || !Number.isFinite(checkedAt) || checkedAt > now || now - checkedAt > 30000) throw new Error('fresh_paid_review_required');
  const payment = validatePaidSession(session, false, ownerId), selected = validateMappedPackage(entry, currentPackage);
  if (entry.tier !== payment.tier || entry.connections !== payment.connections || !/^[1-9]\d{0,14}$/.test(String(account?.id))) throw new Error('invalid_paid_review');
  const balanceUnits = creditUnits(account.credits), costUnits = creditUnits(selected.credits);
  if (costUnits <= 0n || balanceUnits < costUnits) throw new Error('insufficient_credits');
  return { version: 1, environment: 'preview', purpose: 'one-new-paid-line', ownerId, approverId,
    sessionId: payment.sessionId, intentId: payment.intentId, amountCents: payment.cents, tier: payment.tier,
    connections: payment.connections, resellerId: String(account.id), packageFingerprint: entry.provider.fingerprint,
    costUnits: String(costUnits), balanceUnits: String(balanceUnits) };
}
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function secret(env) {
  if (env.VERCEL_ENV !== 'preview' || typeof env.ROOMBA_PREVIEW_SECRET !== 'string' || env.ROOMBA_PREVIEW_SECRET.length < 32
    || /\s/.test(env.ROOMBA_PREVIEW_SECRET)) throw new Error('approval_configuration_unavailable');
  return env.ROOMBA_PREVIEW_SECRET;
}
const sign = (encoded, env) => createHmac('sha256', secret(env)).update(`ks-new-paid-approval-v1\0${encoded}`).digest('hex');
export function issuePaidApproval(input, env = process.env, now = Date.now()) {
  const binding = paidReviewBinding(input, now);
  const expires = now + 120000;
  const encoded = Buffer.from(JSON.stringify({ bindingHash: digest(binding), approverId: binding.approverId, expires, nonce: randomUUID() })).toString('base64url');
  return { token: `${encoded}.${sign(encoded, env)}`, expiresAt: new Date(expires).toISOString() };
}
export function verifyPaidApproval(token, input, env = process.env, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 2048) throw new Error('paid_approval_required');
  const [encoded, signature, extra] = token.split('.');
  if (extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(encoded || '') || !/^[a-f0-9]{64}$/.test(signature || '')
    || !timingSafeEqual(Buffer.from(signature), Buffer.from(sign(encoded, env)))) throw new Error('paid_approval_required');
  let approval;
  try { approval = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); } catch { throw new Error('paid_approval_required'); }
  const binding = paidReviewBinding(input, now);
  if (approval.bindingHash !== digest(binding) || approval.approverId !== input.approverId || !uuid(approval.nonce)
    || !Number.isSafeInteger(approval.expires) || approval.expires <= now || approval.expires > now + 120000) throw new Error('paid_review_changed_or_expired');
  return binding;
}
