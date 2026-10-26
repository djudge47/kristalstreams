import { createHash } from 'node:crypto';
import { validatePaidSession } from './ks-payment-validation.js';
import { verifySettledPaidIntent } from './ks-paid-settlement.js';
import { verifiedCheckoutIntent } from './ks-checkout-intent.js';
import { buildPaidPlanMapping, validateMappedPackage } from './ks-roomba-plan-mapping.js';
import { creditUnits } from './ks-paid-approval.js';

const uuid = v => typeof v === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const hash = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const columns = 'checkout_session_id,payment_intent_id,user_id,livemode,tier,connections,duration_days,amount_cents,currency';
const stop = (reference, reason) => ({ reference, state: 'review_required', reason, mayDispatch: false, providerActivated: false });
const unavailable = () => { throw Error('new_service_review_unavailable'); };
async function one(query) {
  const { data, error } = await query.maybeSingle();
  if (error) unavailable();
  return data;
}
async function exists(query) {
  const { data, error } = await query.limit(1);
  if (error || !Array.isArray(data) || data.length > 1) unavailable();
  return data.length !== 0;
}

// These are current facts, never an execution claim. Re-read after remote reads;
// a future dispatcher must still acquire a durable order/reseller/budget claim.
async function evidence(admin, reference) {
  const receipt = await one(admin.from('ks_payment_receipts').select(`${columns},activated,expires_at,recorded_at`).eq('checkout_session_id', reference));
  if (!uuid(receipt?.user_id) || receipt.checkout_session_id !== reference) unavailable();
  const owner = receipt.user_id;
  const [{ data: auth, error: authError }, profile, queue, route] = await Promise.all([
    admin.auth.admin.getUserById(owner),
    one(admin.from('profiles').select('id,email,subscription_status,active_connections,subscription_expires_at').eq('id', owner)),
    one(admin.from('ks_setup_order_queue').select(`${columns},fulfillment_status,queued_at`).eq('checkout_session_id', reference)),
    one(admin.from('ks_paid_order_routes').select('checkout_session_id,user_id,livemode,request_kind,destination,reason,customer_id,external_id').eq('checkout_session_id', reference)),
  ]);
  if (authError || auth?.user?.id !== owner || profile?.id !== owner) unavailable();
  const user = auth.user;
  if (typeof user.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) || user.email.length > 254) unavailable();
  // Email matching only blocks possible duplicates. It never merges identities.
  const history = await Promise.all([
    exists(admin.from('ks_crm_portal_links').select('user_id').eq('user_id', owner)),
    exists(admin.from('iptv_customers').select('id').ilike('email', user.email.trim().replace(/[\\%_]/g, '\\$&'))),
    exists(admin.from('ks_roomba_trial_attempts').select('admin_id').eq('admin_id', owner)),
    exists(admin.from('ks_preview_paid_fulfillments').select('user_id').eq('user_id', owner)),
    exists(admin.from('ks_preview_provisioning_attempts').select('user_id').eq('user_id', owner)),
    exists(admin.from('ks_setup_review_claims').select('user_id').eq('user_id', owner)),
    exists(admin.from('ks_setup_order_queue').select('user_id').eq('user_id', owner).neq('checkout_session_id', reference)),
  ]);
  return { receipt, queue, route, profile, history, user: { id: owner, email: user.email,
    is_anonymous: user.is_anonymous, email_confirmed_at: user.email_confirmed_at } };
}

function pending(e, payment, at) {
  const { receipt, queue, route, user, profile, history } = e;
  const matches = row => row && columns.split(',').every(k => row[k] === ({ checkout_session_id: payment.sessionId,
    payment_intent_id: payment.intentId, user_id: payment.userId, livemode: payment.livemode, tier: payment.tier,
    connections: payment.connections, duration_days: payment.days, amount_cents: payment.cents, currency: 'usd' })[k]);
  if (!matches(receipt) || !matches(queue) || receipt.activated !== false || receipt.expires_at !== null
    || queue.fulfillment_status !== 'awaiting_activation' || !Number.isFinite(Date.parse(receipt.recorded_at))
    || !Number.isFinite(Date.parse(queue.queued_at)) || Date.parse(receipt.recorded_at) > Date.parse(queue.queued_at)
    || Date.parse(queue.queued_at) > at) return 'pending_payment_required';
  if (route?.checkout_session_id !== payment.sessionId || route.user_id !== payment.userId || route.livemode !== payment.livemode
    || route.request_kind !== 'new_service' || route.destination !== 'new_service_review' || route.reason !== 'new_service_requested'
    || route.customer_id !== null || route.external_id !== null) return 'new_service_route_required';
  if (user.is_anonymous !== false || !Number.isFinite(Date.parse(user.email_confirmed_at)) || Date.parse(user.email_confirmed_at) > at
    || typeof profile.email !== 'string' || profile.email.trim().toLowerCase() !== user.email.trim().toLowerCase()) return 'confirmed_owner_required';
  if (profile.subscription_status !== 'inactive' || profile.active_connections !== 0 || profile.subscription_expires_at !== null
    || history.some(Boolean)) return 'existing_or_uncertain_service';
  return null;
}

// Verification only: no create/edit transport, credentials, mutation RPC or mail.
export async function reviewPaidNewService({ admin, payments, provider, reference, environment, now = Date.now }) {
  const live = environment === 'production';
  if (!['preview', 'production'].includes(environment) || typeof reference !== 'string' || reference.length > 200
    || !(live ? /^cs_live_[A-Za-z0-9]+$/ : /^cs_test_[A-Za-z0-9]+$/).test(reference)) unavailable();
  const started = now();
  if (!Number.isSafeInteger(started)) unavailable();
  const before = await evidence(admin, reference);
  const session = await payments.retrieve(reference);
  let payment, intent;
  try {
    if (session?.id !== reference) throw Error('wrong_session');
    payment = validatePaidSession(session, live, before.user.id);
    verifySettledPaidIntent(session, payment, live);
    if (typeof session.customer_email !== 'string' || session.customer_email.trim().toLowerCase() !== before.user.email.trim().toLowerCase()) throw Error('purchase_owner_email_changed');
    if (session.metadata?.checkout_binding_version !== '1') throw Error('new_checkout_binding_required');
    intent = await verifiedCheckoutIntent(session, { admin, live, environment }, before.user.id);
  } catch { return stop(reference, 'settled_bound_payment_required'); }
  if (intent.kind !== 'new_service' || intent.newServiceAttested !== true) return stop(reference, 'new_service_intent_required');
  const reason = pending(before, payment, started);
  if (reason) return stop(reference, reason);
  const snapshot = await provider.snapshot();
  if (!Number.isSafeInteger(snapshot?.checkedAt) || snapshot.checkedAt < started || snapshot.checkedAt > now()
    || !/^[1-9]\d{0,14}$/.test(snapshot.account?.id || '')) unavailable();
  let selected, entry;
  try {
    const mapping = buildPaidPlanMapping({ schemaVersion: 1, readOnly: true,
      checkedAt: new Date(snapshot.checkedAt).toISOString(), packages: snapshot.packages });
    entry = mapping.entries.find(v => v.tier === payment.tier && v.connections === payment.connections);
    selected = validateMappedPackage(entry, snapshot.packages.find(v => v.id === entry?.provider.id));
    if (creditUnits(snapshot.account.credits) < creditUnits(selected.credits)) return stop(reference, 'insufficient_provider_credits');
  } catch { return stop(reference, 'provider_catalog_requires_review'); }
  // A refund or ownership/service change during a slow provider read must stop.
  const after = await evidence(admin, reference);
  const finalSession = await payments.retrieve(reference);
  try {
    const latest = validatePaidSession(finalSession, live, before.user.id);
    verifySettledPaidIntent(finalSession, latest, live);
    if (typeof finalSession.customer_email !== 'string' || finalSession.customer_email.trim().toLowerCase() !== after.user.email.trim().toLowerCase()) throw Error('purchase_owner_email_changed');
    const finalIntent = await verifiedCheckoutIntent(finalSession, { admin, live, environment }, before.user.id);
    if (finalSession.id !== reference || JSON.stringify(latest) !== JSON.stringify(payment)
      || JSON.stringify(finalIntent) !== JSON.stringify(intent)) throw Error('payment_changed');
  } catch { return stop(reference, 'payment_changed_during_review'); }
  const checked = now();
  if (!Number.isSafeInteger(checked) || checked < started || checked - started >= 30000) return stop(reference, 'review_expired');
  if (hash(before) !== hash(after) || pending(after, payment, checked)) return stop(reference, 'service_changed_during_review');
  return { reference, state: 'verified_for_review', reason: 'new_service_checks_passed', mayDispatch: false, providerActivated: false,
    checkedAt: new Date(checked).toISOString(), validUntil: new Date(started + 30000).toISOString(),
    plan: payment.tier, months: selected.duration.count, connections: payment.connections, amountCents: payment.cents,
    packageName: selected.name, costCredits: String(selected.credits),
    quoteFingerprint: hash({ purpose: 'new-service-review/v1', reference, owner: payment.userId, intent: payment.intentId,
      evidence: hash(after), reseller: snapshot.account.id, package: entry.provider.fingerprint,
      balance: String(creditUnits(snapshot.account.credits)), checkedAt: checked }) };
}
