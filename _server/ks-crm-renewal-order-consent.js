import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { buildOrderRenewalEvidence, orderRenewalPurpose as purpose } from './ks-crm-renewal-order-plan.js';

const uuid = value => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
const iso = value => typeof value === 'string' && Number.isFinite(Date.parse(value))
  && new Date(value).toISOString() === value;
const fields = ['purpose','kind','actorId','customerId','operationId','consentId','fingerprint','snapshotAt','issuedAt','expiresAt','requestedMonths','requestedConnections'];
const windowMs = 300000;

// Consent is not a dispatch capability. There is no route, environment fallback,
// provider transport, ledger adapter or execution-switch mutation in this module.
// A future trusted server must independently authenticate/authorize actorId and
// use a dedicated random key, never the Preview/test or rehearsal signing key.
export function createOrderRenewalConsent({ key, now } = {}) {
  if (!Buffer.isBuffer(key) || key.length !== 32 || typeof now !== 'function') throw Error('dedicated_changed_order_consent_key_required');
  const signingKey = Buffer.from(key);
  const sign = encoded => createHmac('sha256', signingKey).update(`${purpose}\0${encoded}`).digest('hex');
  function current(input) {
    const at = now();
    if (!Number.isSafeInteger(at) || !uuid(input?.actorId)
      || input.preserveCurrentSelectionConfirmed !== true || input.creditSpendConfirmed !== true || input.unusedTimeLossConfirmed !== true || input.providerTestConfirmed !== true) {
      throw Error('explicit_changed_order_consent_required');
    }
    const { plan } = buildOrderRenewalEvidence(input, at);
    if (!uuid(plan.customerId)) throw Error('canonical_changed_order_consent_customer_required');
    if (Date.parse(input.customer?.expiration_at) !== Date.parse(plan.previousExpiresAt)) throw Error('changed_order_consent_crm_expiry_mismatch');
    return { at, plan, actorId: input.actorId, fingerprint: plan.fingerprint };
  }
  const receipt = payload => Object.freeze({ purpose, mode: 'changed-order-consent-only', mayDispatch: false,
    actorId: payload.actorId, customerId: payload.customerId, operationId: payload.operationId,
    consentId: payload.consentId, fingerprint: payload.fingerprint, snapshotAt: payload.snapshotAt,
    issuedAt: payload.issuedAt, expiresAt: payload.expiresAt, requestedMonths: payload.requestedMonths, requestedConnections: payload.requestedConnections });
  function identify(token, { actorId, customerId } = {}) {
    const at = now();
    if (!Number.isSafeInteger(at) || !uuid(actorId) || !uuid(customerId)
      || typeof token !== 'string' || token.length > 1100) throw Error('changed_order_consent_required');
    const [encoded, signature, extra] = token.split('.');
    if (extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(encoded || '') || !/^[a-f0-9]{64}$/.test(signature || '')
      || !timingSafeEqual(Buffer.from(signature), Buffer.from(sign(encoded)))) throw Error('changed_order_consent_required');
    let payload;
    try { payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); } catch { throw Error('changed_order_consent_required'); }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)
      || Object.keys(payload).length !== fields.length || fields.some(field => !Object.hasOwn(payload, field))
      || ![1,3,6,12].includes(payload.requestedMonths) || !Number.isInteger(payload.requestedConnections) || payload.requestedConnections < 1 || payload.requestedConnections > 5
      || payload.purpose !== purpose || payload.kind !== 'consent_only'
      || ![payload.actorId,payload.customerId,payload.operationId,payload.consentId].every(uuid)
      || payload.actorId !== actorId || payload.customerId !== customerId || !/^[a-f0-9]{64}$/.test(payload.fingerprint || '')
      || !iso(payload.snapshotAt) || !iso(payload.issuedAt) || !iso(payload.expiresAt)
      || Date.parse(payload.snapshotAt) > Date.parse(payload.issuedAt)
      || Date.parse(payload.issuedAt) - Date.parse(payload.snapshotAt) > 30000
      || Date.parse(payload.issuedAt) > at
      || Date.parse(payload.expiresAt) !== Date.parse(payload.issuedAt) + windowMs) throw Error('changed_order_consent_changed_or_expired');
    return receipt(payload);
  }
  return Object.freeze({
    // Read-only attempt identity, including after expiry. Never permits a new
    // reservation/begin; verify() still requires fresh matching unexpired facts.
    identify,
    issue(input) {
      const c = current(input);
      const payload = { purpose, kind: 'consent_only', actorId: c.actorId, customerId: c.plan.customerId,
        operationId: randomUUID(), consentId: randomUUID(), fingerprint: c.fingerprint,
        requestedMonths: c.plan.months, requestedConnections: c.plan.connections, snapshotAt: c.plan.checkedAt, issuedAt: new Date(c.at).toISOString(), expiresAt: new Date(c.at + windowMs).toISOString() };
      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
      return Object.freeze({ ...receipt(payload), token: `${encoded}.${sign(encoded)}` });
    },
    verify(token, input) {
      const payload = identify(token, { actorId: input?.actorId, customerId: input?.customer?.id });
      const c = current({ ...input, requested: { months: payload.requestedMonths, connections: payload.requestedConnections } });
      if (payload.fingerprint !== c.fingerprint || Date.parse(payload.expiresAt) <= c.at) throw Error('changed_order_consent_changed_or_expired');
      return receipt(payload);
    },
  });
}
