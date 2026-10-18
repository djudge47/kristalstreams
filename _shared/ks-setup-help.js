// Browser-safe support context. Server ownership checks stay in ks-customer-setup.
const intervals = { bronze: 'monthly', silver: '3 months', gold: '6 months', platinum: 'yearly' };
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function cleanOrder(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || typeof value.reference !== 'string' || !/^cs_(test_)?[A-Za-z0-9]{1,200}$/.test(value.reference)
    || !Object.hasOwn(intervals, value.tier) || value.interval !== intervals[value.tier]
    || !Number.isInteger(value.connections) || value.connections < 1 || value.connections > 5
    || !Number.isSafeInteger(value.amountCents) || value.amountCents <= 0 || value.amountCents > 100000000
    || value.currency !== 'usd' || !validDate(value.recordedAt)
    || value.status !== 'awaiting_activation' || value.testMode !== true || value.providerActivated !== false) throw new Error('Order details could not be verified.');
  return {
    reference: value.reference, tier: value.tier, interval: value.interval, connections: value.connections,
    amountCents: value.amountCents, currency: 'usd', recordedAt: new Date(value.recordedAt).toISOString(),
    status: 'awaiting_activation', testMode: true, providerActivated: false,
  };
}

export function readSetupHelpOrders(payload, accountId) {
  if (!uuid(accountId) || payload?.accountId !== accountId || payload.mode !== 'read-only'
    || payload.testMode !== true || !Array.isArray(payload.orders) || payload.orders.length > 5
    || !validDate(payload.checkedAt)) throw new Error('Order details could not be verified.');
  const orders = payload.orders.map(cleanOrder);
  if (new Set(orders.map(order => order.reference)).size !== orders.length) throw new Error('Order details could not be verified.');
  return { orders, checkedAt: new Date(payload.checkedAt).toISOString() };
}

// This text is a support snapshot, never payment/provisioning authorization.
export function setupHelpDetails(order, checkedAt) {
  const safe = cleanOrder(order);
  if (!validDate(checkedAt)) throw new Error('Order details could not be verified.');
  const tier = safe.tier[0].toUpperCase() + safe.tier.slice(1);
  return [
    '--- Saved test-order details for support ---',
    `Order reference: ${safe.reference}`,
    `Plan: ${tier} / ${safe.interval}`,
    `Connections ordered: ${safe.connections}`,
    `Test amount: ${(safe.amountCents / 100).toFixed(2)} USD`,
    `Payment recorded: ${safe.recordedAt}`,
    'Saved setup status: awaiting activation',
    `Details checked: ${new Date(checkedAt).toISOString()}`,
    'Preview test payment only. No real charge or streaming activation was made.',
  ].join('\n');
}
