// A read-only settlement check shared by the Preview executor and the staged
// automatic-setup review. It never retrieves a payment or grants entitlement.
export function verifySettledPaidIntent(session, payment, expectedLive = false) {
  const intent = session?.payment_intent, charge = intent?.latest_charge;
  if (typeof expectedLive !== 'boolean' || payment?.livemode !== expectedLive
    || !intent || typeof intent !== 'object' || intent.id !== payment.intentId || intent.status !== 'succeeded'
    || intent.livemode !== expectedLive || intent.currency !== 'usd' || intent.amount !== payment.cents || intent.amount_received !== payment.cents
    || !charge || typeof charge !== 'object' || !/^ch_[A-Za-z0-9]+$/.test(charge.id || '') || charge.livemode !== expectedLive
    || charge.payment_intent !== intent.id || charge.amount !== payment.cents || charge.currency !== 'usd'
    || charge.paid !== true || charge.captured !== true || charge.refunded !== false || charge.amount_refunded !== 0 || charge.disputed !== false) {
    throw new Error('settled_payment_required');
  }
}
