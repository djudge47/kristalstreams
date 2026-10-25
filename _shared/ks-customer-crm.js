import {retailPlans} from './ks-retail-pricing.js';
export const portalUuid = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const portalPaymentId=v=>portalUuid(v)||(typeof v==='string'&&/^cs_live_[A-Za-z0-9]{1,192}$/.test(v));
// Preserve PostgreSQL microseconds in keyset order; Date.parse alone rounds ties.
const paymentTime=v=>BigInt(Date.parse(v))*1000n+BigInt((/\.([0-9]{1,6})(?:Z|[+-][0-9]{2}:[0-9]{2})$/.exec(v)?.[1]||'').padEnd(6,'0').slice(3)||'0');
const date = v => typeof v === 'string' && v.length <= 40 && Number.isFinite(Date.parse(v));
const text = (v, max = 300) => v === null || (typeof v === 'string' && v.length <= max);
export const portalEmail = v => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export function readPortalLink(v, customerId) {
  if (!v || v.customerId !== customerId || !portalUuid(v.customerId) || !portalUuid(v.userId)
    || !Number.isSafeInteger(v.panelId) || v.panelId <= 0 || !text(v.username) || !v.username
    || !text(v.customerName) || !portalEmail(v.email) || v.email !== v.email.trim().toLowerCase()
    || !date(v.emailConfirmedAt) || typeof v.linked !== 'boolean') throw Error('The account link could not be verified. Review it again.');
  return { customerId:v.customerId, panelId:v.panelId, username:v.username, customerName:v.customerName,
    userId:v.userId, email:v.email, emailConfirmedAt:v.emailConfirmedAt, linked:v.linked };
}
export function readCustomerCrm(v, accountId, allowLookahead = false) {
  if (!v || !portalUuid(accountId) || v.accountId !== accountId || !date(v.checkedAt)
    || !Array.isArray(v.services) || !Array.isArray(v.payments) || v.payments.length > (allowLookahead ? 201 : 200)) throw Error('Your service details could not be verified.');
  const ids = new Set();
  const services = v.services.map(s => {
    if (!portalUuid(s?.customerId) || ids.has(s.customerId) || !text(s.username) || !s.username || !text(s.name)
      || !text(s.packageName) || !Number.isSafeInteger(s.connections) || s.connections < 0 || s.connections > 1000
      || (s.expiresAt !== null && !date(s.expiresAt)) || !text(s.savedStatus, 80) || typeof s.legacyPaid !== 'boolean'
      || !date(s.updatedAt)) throw Error('Your service details could not be verified.');
    ids.add(s.customerId);
    return { customerId:s.customerId, username:s.username, name:s.name, packageName:s.packageName, connections:s.connections,
      expiresAt:s.expiresAt, savedStatus:s.savedStatus, legacyPaid:s.legacyPaid, updatedAt:s.updatedAt };
  });
  const seen = new Set(); let previous;
  const payments = v.payments.map(p => {
    if (!portalPaymentId(p?.id) || seen.has(p.id) || !ids.has(p.customerId) || !Number.isSafeInteger(p.amountCents)
      || p.amountCents <= 0 || !text(p.method, 100) || !date(p.paidAt)
      || (p.months !== null && ![1,3,6,12].includes(p.months))
      || (p.connections !== null && (!Number.isInteger(p.connections) || p.connections < 1 || p.connections > 5))
      || ((p.months === null) !== (p.connections === null))
      || (previous && (paymentTime(p.paidAt) > paymentTime(previous.paidAt)
        || (paymentTime(p.paidAt) === paymentTime(previous.paidAt) && p.id >= previous.id)))) throw Error('Your payment details could not be verified.');
    const website=p.source==='website_checkout';
    const plan=Object.values(retailPlans).find(plan=>plan.months===p.months);
    if(website ? portalUuid(p.id)||p.method!=='stripe_checkout'||!plan||p.amountCents!==plan.prices[p.connections-1]
      ||!date(p.renewalCompletedAt)||!date(p.renewalExpiresAt)||paymentTime(p.renewalCompletedAt)<paymentTime(p.paidAt)
      ||Date.parse(p.renewalCompletedAt)>Date.parse(v.checkedAt)+60000||Date.parse(p.renewalExpiresAt)<=Date.parse(p.renewalCompletedAt)
      : !portalUuid(p.id)||p.source!==undefined||p.renewalCompletedAt!==undefined||p.renewalExpiresAt!==undefined) throw Error('Your payment details could not be verified.');
    seen.add(p.id); previous = p;
    return { id:p.id,customerId:p.customerId,amountCents:p.amountCents,method:p.method,paidAt:p.paidAt,months:p.months,connections:p.connections,
      ...(website?{source:'website_checkout',renewalCompletedAt:p.renewalCompletedAt,renewalExpiresAt:p.renewalExpiresAt}:{}) };
  });
  const cursor = v.nextCursor ?? null;
  if (cursor !== null && (!date(cursor.paidAt) || !portalPaymentId(cursor.id) || !payments.length
    || cursor.paidAt !== payments.at(-1).paidAt || cursor.id !== payments.at(-1).id)) throw Error('Your payment page could not be verified.');
  return { accountId,checkedAt:v.checkedAt,services,payments,nextCursor:cursor ? {paidAt:cursor.paidAt,id:cursor.id} : null };
}
export function savedServiceLabel(service, now = Date.now()) {
  if (service.savedStatus === 'disabled' || service.savedStatus === 'banned') return 'Disabled';
  if (service.expiresAt && Date.parse(service.expiresAt) <= now) return 'Service period ended';
  if (service.savedStatus === 'active' && service.expiresAt) return 'Within saved service period';
  return 'Contact support to confirm service';
}
