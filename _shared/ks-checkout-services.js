import { portalUuid } from './ks-customer-crm.js';
export function readCheckoutServices(value, accountId, lookahead = false) {
  if (!value || !portalUuid(accountId) || value.accountId !== accountId
    || typeof value.checkedAt !== 'string' || !Number.isFinite(Date.parse(value.checkedAt))
    || !Array.isArray(value.services) || value.services.length > (lookahead ? 51 : 50)) throw Error('Your linked services could not be verified.');
  let previous = '';
  const services = value.services.map(s => {
    if (!portalUuid(s?.customerId) || s.customerId <= previous || typeof s.username !== 'string' || !s.username || s.username.length > 300
      || !Number.isSafeInteger(s.connections) || s.connections < 0 || s.connections > 1000
      || !(s.expiresAt === null || (typeof s.expiresAt === 'string' && Number.isFinite(Date.parse(s.expiresAt))))) throw Error('Your linked services could not be verified.');
    previous = s.customerId;
    return { customerId: s.customerId, username: s.username, connections: s.connections, expiresAt: s.expiresAt };
  });
  const nextCursor = value.nextCursor ?? null;
  if (nextCursor !== null && (!portalUuid(nextCursor) || services.at(-1)?.customerId !== nextCursor)) throw Error('Your service page could not be verified.');
  return { accountId, checkedAt: value.checkedAt, services, nextCursor };
}
