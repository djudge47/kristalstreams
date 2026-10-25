// Browser-safe support context. Server ownership checks stay in ks-customer-setup.
const intervals = { bronze: 'monthly', silver: '3 months', gold: '6 months', platinum: 'yearly' };
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function cleanOrder(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || typeof value.reference !== 'string' || !/^cs_(test_|live_)?[A-Za-z0-9]{1,200}$/.test(value.reference)
    || typeof value.testMode !== 'boolean'
    || (value.testMode ? value.reference.startsWith('cs_live_') : value.reference.startsWith('cs_test_'))
    || !Object.hasOwn(intervals, value.tier) || value.interval !== intervals[value.tier]
    || !Number.isInteger(value.connections) || value.connections < 1 || value.connections > 5
    || !Number.isSafeInteger(value.amountCents) || value.amountCents <= 0 || value.amountCents > 100000000
    || value.currency !== 'usd' || !validDate(value.recordedAt)
    || !['awaiting_activation', 'requires_review', 'setup_complete', 'setup_expired', 'renewal_complete'].includes(value.status)
    || (value.status === 'renewal_complete'
      ? value.testMode !== false || value.providerActivated !== false || value.renewalCompleted !== true
        || !validDate(value.expiresAt) || !validDate(value.completedAt)
        || Date.parse(value.completedAt) < Date.parse(value.recordedAt) || Date.parse(value.expiresAt) <= Date.parse(value.completedAt)
      : value.renewalCompleted !== undefined || value.completedAt !== undefined)
    || (value.status === 'setup_complete' || value.status === 'setup_expired'
      ? value.testMode !== true || !validDate(value.expiresAt) || value.providerActivated !== (value.status === 'setup_complete')
      : value.providerActivated !== false || (value.status !== 'renewal_complete' && value.expiresAt !== undefined))) throw new Error('Order details could not be verified.');
  return {
    reference: value.reference, tier: value.tier, interval: value.interval, connections: value.connections,
    amountCents: value.amountCents, currency: 'usd', recordedAt: new Date(value.recordedAt).toISOString(),
    status: value.status, testMode: value.testMode, providerActivated: value.providerActivated,
    ...(['setup_complete', 'setup_expired', 'renewal_complete'].includes(value.status) ? { expiresAt: new Date(value.expiresAt).toISOString() } : {}),
    ...(value.status === 'renewal_complete' ? { renewalCompleted: true, completedAt: new Date(value.completedAt).toISOString() } : {}),
  };
}

export function readSetupHelpOrders(payload, accountId) {
  if (!uuid(accountId) || payload?.accountId !== accountId || payload.mode !== 'read-only'
    || typeof payload.testMode !== 'boolean' || !Array.isArray(payload.orders) || payload.orders.length > 5
    || !validDate(payload.checkedAt)) throw new Error('Order details could not be verified.');
  const orders = payload.orders.map(cleanOrder);
  for (const order of orders) checkExpiry(order, payload.checkedAt);
  if (orders.some(order => order.testMode !== payload.testMode)) throw new Error('Order details could not be verified.');
  if (new Set(orders.map(order => order.reference)).size !== orders.length) throw new Error('Order details could not be verified.');
  return { orders, checkedAt: new Date(payload.checkedAt).toISOString() };
}

function checkExpiry(order, checkedAt) {
  if (order.status === 'renewal_complete') {
    if (Date.parse(order.completedAt) > Date.parse(checkedAt) + 60000) throw new Error('Order details could not be verified.');
    return;
  }
  if (order.expiresAt !== undefined && (Date.parse(order.expiresAt) > Date.parse(checkedAt)) !== (order.status === 'setup_complete')) {
    throw new Error('Order details could not be verified.');
  }
}

// This text is a support snapshot, never payment/provisioning authorization.
export function setupHelpDetails(order, checkedAt) {
  const safe = cleanOrder(order);
  if (!validDate(checkedAt)) throw new Error('Order details could not be verified.');
  checkExpiry(safe, checkedAt);
  const tier = safe.tier[0].toUpperCase() + safe.tier.slice(1);
  return [
    safe.testMode ? '--- Saved test-order details for support ---' : '--- Saved paid-order details for support ---',
    `Order reference: ${safe.reference}`,
    `Plan: ${tier} / ${safe.interval}`,
    `Connections ordered: ${safe.connections}`,
    `${safe.testMode ? 'Test amount' : 'Paid amount'}: ${(safe.amountCents / 100).toFixed(2)} USD`,
    `Payment recorded: ${safe.recordedAt}`,
    `Saved setup status: ${{ awaiting_activation: 'awaiting activation', requires_review: 'requires review', setup_complete: 'setup confirmed', setup_expired: 'service period ended', renewal_complete: 'renewal completed' }[safe.status]}`,
    ...(safe.expiresAt ? [`${safe.status === 'renewal_complete' ? 'Expiry recorded for this renewal' : 'Saved service expiry'}: ${safe.expiresAt}`] : []),
    `Details checked: ${new Date(checkedAt).toISOString()}`,
    safe.testMode ? 'Preview test payment only. No real card charge was made.' : 'Payment recorded.',
    ...(safe.status === 'renewal_complete' ? [`Renewal completed: ${safe.completedAt}`] : []),
    safe.status === 'renewal_complete' ? 'This renewal was completed. Current service details are shown separately on your dashboard; this is not a live playback check. Do not pay again for this order.'
      : safe.status === 'setup_complete' ? 'Saved streaming setup is confirmed. Open your dashboard for your saved streaming login.'
      : safe.status === 'setup_expired' ? 'The saved service period has ended. Contact support about renewal; do not pay again for this order.'
        : safe.status === 'requires_review' ? 'Streaming setup needs review. Do not pay again.'
          : 'Streaming setup is pending confirmation. Do not pay again.',
  ].join('\n');
}
