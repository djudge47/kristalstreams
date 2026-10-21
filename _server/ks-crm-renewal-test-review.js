import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { buildPreservingRenewalPlan } from './ks-crm-renewal-plan.js';

const purpose = 'ks-crm-renewal-test-review/v1';
export const renewalUuid = value => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
const iso = value => typeof value === 'string' && Number.isFinite(Date.parse(value))
  && new Date(value).toISOString() === value;
const key = secret => {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) throw Error('test_review_unavailable');
  // Domain-separated key; these signatures cannot authorize provider actions or
  // be confused with the offline rehearsal's tokens. No new credential is stored.
  return createHmac('sha256', secret).update('ks-crm-renewal-test-review-key/v1').digest();
};
const sign = (encoded, secret) => createHmac('sha256', key(secret)).update(`${purpose}\0${encoded}`).digest('hex');

export function issueRenewalTestReview({ context, customer, actorId, secret, now }) {
  try {
    if (!renewalUuid(actorId)) throw Error('test_review_unavailable');
    const plan = buildPreservingRenewalPlan({ ...context, customer, preserveCurrentSelectionConfirmed: true }, now);
    if (Date.parse(customer.expiration_at) !== Date.parse(plan.previousExpiresAt)) {
      return { available: false, reason: 'The saved CRM expiration and XUI expiration must match before a test approval can be saved.' };
    }
    const payload = { purpose, actorId, customerId: customer.id, operationId: randomUUID(), approvalId: randomUUID(),
      fingerprint: plan.fingerprint, checkedAt: plan.checkedAt, expiresAt: new Date(Date.parse(plan.checkedAt) + 30000).toISOString() };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return { available: true, token: `${encoded}.${sign(encoded, secret)}`, operationId: payload.operationId,
      approvalId: payload.approvalId, expiresAt: payload.expiresAt };
  } catch {
    return { available: false, reason: 'Test approval is unavailable. Reload current details or review this customer manually.' };
  }
}

// Expired signed evidence may be used only to look up this exact saved attempt.
// The handler independently refuses a new reservation after expiry.
export function verifyRenewalTestReview(token, { actorId, secret, now }) {
  if (typeof token !== 'string' || token.length > 950) throw Error('invalid_test_review');
  const [encoded, signature, extra] = token.split('.');
  if (extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(encoded || '') || !/^[a-f0-9]{64}$/.test(signature || '')
    || !timingSafeEqual(Buffer.from(signature), Buffer.from(sign(encoded, secret)))) throw Error('invalid_test_review');
  let p;
  try { p = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); } catch { throw Error('invalid_test_review'); }
  const fields = ['purpose','actorId','customerId','operationId','approvalId','fingerprint','checkedAt','expiresAt'];
  if (!p || typeof p !== 'object' || Object.keys(p).length !== fields.length || fields.some(f => !Object.hasOwn(p, f))
    || p.purpose !== purpose || p.actorId !== actorId || ![p.actorId,p.customerId,p.operationId,p.approvalId].every(renewalUuid)
    || !/^[a-f0-9]{64}$/.test(p.fingerprint) || !iso(p.checkedAt) || !iso(p.expiresAt)
    || Date.parse(p.checkedAt) > now || Date.parse(p.expiresAt) !== Date.parse(p.checkedAt) + 30000) throw Error('invalid_test_review');
  return p;
}

export const renewalTestApprovalHash = token => createHash('sha256')
  .update(`ks-crm-renewal-test-approval/v1\0${token}`).digest('hex');
