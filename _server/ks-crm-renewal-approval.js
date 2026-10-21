import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { assertSimulationRenewalPlan } from './ks-crm-renewal-plan.js';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const purpose = 'offline-crm-renewal-rehearsal';

// A disposable rehearsal capability, deliberately incompatible with every live
// approval purpose. No environment key, HTTP handler or authenticated-user claim
// is read here. The future server must independently verify its administrator.
export function createRenewalApprovalRehearsal({ kind, key, now } = {}) {
  if (kind !== 'simulation' || !Buffer.isBuffer(key) || key.length !== 32 || typeof now !== 'function') throw new Error('renewal_rehearsal_configuration_required');
  const signingKey = Buffer.from(key);
  const sign = encoded => createHmac('sha256', signingKey).update(`ks-crm-renewal-rehearsal-v1\0${encoded}`).digest('hex');
  function binding({ operationId, approverId, plan, preserveCurrentSelectionConfirmed }) {
    assertSimulationRenewalPlan(plan);
    const checked = Date.parse(plan.checkedAt), at = now();
    if (!uuid(operationId) || !uuid(approverId) || preserveCurrentSelectionConfirmed !== true
      || !Number.isSafeInteger(at) || !Number.isFinite(checked) || checked > at || at - checked > 30000
      || Date.parse(plan.previousExpiresAt) <= at) throw new Error('fresh_explicit_renewal_review_required');
    return { purpose, simulation: true, operationId, approverId, fingerprint: plan.fingerprint, checkedAt: plan.checkedAt };
  }
  return {
    issue(input) {
      const approved = binding(input);
      const payload = { ...approved, approvalId: randomUUID(), expires: now() + 30000 };
      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
      return { token: `${encoded}.${sign(encoded)}`, approvalId: payload.approvalId, expiresAt: new Date(payload.expires).toISOString(), simulation: true, mayDispatch: false };
    },
    verify(token, input) {
      if (typeof token !== 'string' || token.length > 2048) throw new Error('renewal_rehearsal_approval_required');
      const [encoded, signature, extra] = token.split('.');
      if (extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(encoded || '') || !/^[a-f0-9]{64}$/.test(signature || '')
        || !timingSafeEqual(Buffer.from(signature), Buffer.from(sign(encoded)))) throw new Error('renewal_rehearsal_approval_required');
      let payload;
      try { payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); } catch { throw new Error('renewal_rehearsal_approval_required'); }
      const approved = binding(input);
      if (Object.entries(approved).some(([name, value]) => payload[name] !== value) || !uuid(payload.approvalId)
        || !Number.isSafeInteger(payload.expires) || payload.expires <= now() || payload.expires > now() + 30000) throw new Error('renewal_rehearsal_approval_changed_or_expired');
      return { ...approved, approvalId: payload.approvalId, expiresAt: new Date(payload.expires).toISOString(), mayDispatch: false };
    },
  };
}
