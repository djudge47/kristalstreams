export type PurchaseKind = 'new_service' | 'renewal' | 'requires_review';
const prefix = 'ks-checkout-v1:';
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
type Attempt = { requestId: string; reference?: string };
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

export function checkoutAttemptKey(userId: string, plan: string, price: number, interval: string, connections: number, kind: PurchaseKind) {
  return prefix + JSON.stringify([userId, plan, price, interval, connections, kind]);
}

export function savedCheckoutAttempt(storage: Store, key: string, randomId = () => crypto.randomUUID()): Attempt {
  const saved = storage.getItem(key);
  if (saved !== null) {
    const attempt = JSON.parse(saved) as Attempt;
    if (!uuid(attempt?.requestId)) throw new Error('Your saved checkout needs review. Contact support before starting another payment.');
    return attempt;
  }
  const attempt = { requestId: randomId() };
  if (!uuid(attempt.requestId)) throw new Error('Unable to prepare checkout. Please contact support.');
  storage.setItem(key, JSON.stringify(attempt));
  return attempt;
}

export function saveCheckoutReference(storage: Store, key: string, requestId: string, reference: string) {
  const saved = savedCheckoutAttempt(storage, key);
  if (!/^cs_test_[A-Za-z0-9]+$/.test(reference) || saved.requestId !== requestId
    || (saved.reference !== undefined && saved.reference !== reference)) {
    throw new Error('Checkout verification needs attention. Contact support before paying.');
  }
  storage.setItem(key, JSON.stringify({ requestId, reference }));
}

// Only a server-confirmed receipt clears its matching attempt. Errors, reloads,
// cancellation and age never silently replace an uncertain payment request.
export function completeCheckoutAttempt(storage: Store, reference: string) {
  for (let index = storage.length - 1; index >= 0; index--) {
    const key = storage.key(index);
    if (!key?.startsWith(prefix)) continue;
    try {
      const saved = JSON.parse(storage.getItem(key) || '{}') as Attempt;
      if (saved.reference === reference) storage.removeItem(key);
    } catch { /* Leave malformed records for explicit review. */ }
  }
}
