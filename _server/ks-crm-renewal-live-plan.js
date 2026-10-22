import { createHash } from 'node:crypto';
import { buildPreservingRenewalPlan, buildPreservingRenewalForm } from './ks-crm-renewal-plan.js';

export const liveRenewalPurpose = 'ks-crm-live-renewal-consent/v1';
export const liveRenewalFingerprint = plan => createHash('sha256')
  .update(`${liveRenewalPurpose}\0${plan.fingerprint}`).digest('hex');

// Built only from a fresh snapshot. This plan is evidence, never authority to
// dispatch. The consent, disabled gate and committed ledger decision are separate.
export function buildLiveRenewalEvidence(input, now) {
  const base = buildPreservingRenewalPlan({ ...input.context, customer: input.customer,
    preserveCurrentSelectionConfirmed: input.preserveCurrentSelectionConfirmed }, now);
  if (Date.parse(input.customer?.expiration_at) !== Date.parse(base.previousExpiresAt)) {
    throw Error('live_consent_crm_expiry_mismatch');
  }
  return { plan: { ...base, purpose: liveRenewalPurpose, kind: 'live_consent',
    fingerprint: liveRenewalFingerprint(base) }, form: () => buildPreservingRenewalForm(base) };
}
