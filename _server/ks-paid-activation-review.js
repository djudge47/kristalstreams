import Stripe from 'stripe';
import { paidOrderSnapshot } from './ks-preview-paid-orders.js';
import { validatePaidSession } from './ks-payment-validation.js';
import { verifySettledPaidIntent } from './ks-guarded-paid-executor.js';
import { buildPaidPlanMapping } from './ks-roomba-plan-mapping.js';
import { creditUnits } from './ks-paid-approval.js';
import { loginEncryptionKey } from './ks-login-envelope.js';
import { createPaidReadAdapter } from './ks-paid-provider-read.js';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const states = ['reserved','dispatching','provider_verified','credentials_ready','reconciliation_required'];
const eligibilityReasons = { existing_website_access_requires_review: 'existing_website_access', existing_streaming_access_requires_review: 'existing_streaming_access' };
const defaultPayments = env => {
  if (typeof env.STRIPE_SECRET_KEY !== 'string' || !/^[sr]k_test_[A-Za-z0-9]+$/.test(env.STRIPE_SECRET_KEY)) throw new Error('test_payment_configuration_required');
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-08-26.dahlia', timeout: 15000, maxNetworkRetries: 0 });
  return { retrieve: id => stripe.checkout.sessions.retrieve(id, { expand: ['payment_intent.latest_charge'] }) };
};

// GET-only review. Never imports the real POST adapter, execution store or SDK worker constructor.
export function createPaidActivationReviewHandler({ createClient, env = process.env, now = Date.now,
  paymentsFactory = defaultPayments, providerFactory = createPaidReadAdapter, captureVerifiedReview } = {}) {
  const options = { auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(8000) }) } };
  let active = false, lastStarted = 0;
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('Vary', 'Authorization');
    if (env.VERCEL_ENV !== 'preview') return res.status(404).json({ error: 'Paid activation review is available in Preview only.' });
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'This is a read-only review. Paid activation is not released.' }); }
    const token = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!token) return res.status(401).json({ error: 'Please sign in to your administrator account.' });
    const reference = req.query?.sessionId;
    if (typeof reference !== 'string' || reference.length > 200 || !/^cs_(test_)?[A-Za-z0-9]+$/.test(reference)) return res.status(400).json({ error: 'Choose a saved sandbox payment.' });
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'Test review is unavailable.' });
    let claimed = false, stage = 'administrator';
    try {
      const { data, error } = await createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, options).auth.getUser(token);
      const adminUser = data?.user;
      if (error || !uuid(adminUser?.id)) return res.status(401).json({ error: 'Please sign in again.' });
      if (adminUser.is_anonymous || !adminUser.email_confirmed_at || adminUser.email?.toLowerCase() !== 'djudge47@gmail.com') return res.status(403).json({ error: 'Administrator access is required.' });
      // Warm-instance throttling only; every review still authenticates first. No execution guarantee relies on it.
      if (active || (lastStarted > 0 && now() - lastStarted < 30000)) { res.setHeader('Retry-After', '30'); return res.status(429).json({ error: 'Wait 30 seconds before reviewing again.' }); }
      active = true; claimed = true; lastStarted = now();
      stage = 'saved_order';
      const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
      const { data: rows, error: listError } = await admin.rpc('ks_list_preview_paid_orders');
      if (listError) throw new Error('saved_orders_unavailable');
      const order = paidOrderSnapshot(rows).find(row => row.sessionId === reference);
      if (!order) return res.status(409).json({ error: 'This sandbox payment is not in the pending queue. No customer was selected.' });
      stage = 'stripe_payment';
      const session = await paymentsFactory(env).retrieve(reference);
      const payment = validatePaidSession(session, false, order.userId);
      if (payment.sessionId !== reference || payment.tier !== order.tier || payment.connections !== order.connections || payment.cents !== order.amountCents) throw new Error('payment_changed');
      verifySettledPaidIntent(session, payment);
      stage = 'customer_and_provider';
      const [ownerResult, profileResult, trialResult, attemptResult, receiptResult, eligibleResult, foundationResult, executionResult, snapshot] = await Promise.all([
        admin.auth.admin.getUserById(order.userId),
        admin.from('profiles').select('id,email').eq('id', order.userId).maybeSingle(),
        admin.from('ks_roomba_trial_attempts').select('admin_id,state').eq('admin_id', order.userId).limit(1),
        admin.from('ks_preview_provisioning_attempts').select('attempt_id,user_id,checkout_session_id,state').eq('checkout_session_id', reference).eq('user_id', order.userId).maybeSingle(),
        admin.from('ks_payment_receipts').select('checkout_session_id,payment_intent_id,user_id,livemode,tier,connections,duration_days,amount_cents,currency,activated,expires_at').eq('checkout_session_id', reference).eq('user_id', order.userId).maybeSingle(),
        admin.rpc('ks_assert_preview_new_customer', { p_user_id: order.userId }),
        admin.rpc('ks_preview_provisioning_foundation_status'),
        admin.rpc('ks_preview_paid_execution_status'),
        Promise.resolve().then(() => providerFactory({ env, now }).snapshot()).catch(() => { throw new Error('review_provider_read_unavailable'); }),
      ]);
      stage = 'customer_records';
      const receipt = receiptResult.data;
      if (receiptResult.error || receipt?.checkout_session_id !== reference || receipt.payment_intent_id !== payment.intentId
        || receipt.user_id !== order.userId || receipt.livemode !== false || receipt.activated !== false || receipt.expires_at !== null
        || receipt.tier !== payment.tier || receipt.connections !== payment.connections || receipt.duration_days !== payment.days
        || receipt.amount_cents !== payment.cents || receipt.currency !== 'usd') throw new Error('saved_payment_changed');
      const owner = ownerResult.data?.user, profile = profileResult.data;
      if (ownerResult.error || profileResult.error || trialResult.error || attemptResult.error || !uuid(owner?.id)
        || owner.id !== order.userId || owner.is_anonymous || typeof owner.email !== 'string' || owner.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner.email)
        || profile?.id !== order.userId || typeof profile.email !== 'string' || profile.email.toLowerCase() !== owner.email.toLowerCase()) throw new Error('customer_identity_unavailable');
      if (!Array.isArray(trialResult.data) || trialResult.data.length > 1 || trialResult.data.some(row => row.admin_id !== order.userId || !['submitting','succeeded','unknown'].includes(row.state))) throw new Error('trial_activity_unavailable');
      const attempt = attemptResult.data;
      if (attempt && (!uuid(attempt.attempt_id) || attempt.user_id !== order.userId || attempt.checkout_session_id !== reference || !states.includes(attempt.state))) throw new Error('attempt_unavailable');
      const foundation = foundationResult.data, execution = executionResult.data;
      if (foundationResult.error || executionResult.error || foundation?.version !== 1 || foundation.durableAttempts !== true || foundation.encryptedLoginTable !== true || foundation.browserAccessRevoked !== true
        || execution?.version !== 1 || execution.atomicCompletion !== true || execution.resellerDispatchLock !== true || execution.browserAccessRevoked !== true) throw new Error('foundation_unavailable');
      const blockers = [];
      if (trialResult.data.length) blockers.push('prior_trial_activity');
      if (!owner.email_confirmed_at) blockers.push('customer_email_unconfirmed');
      if (eligibleResult.error) {
        const reason = eligibilityReasons[eligibleResult.error.message];
        if (!reason || eligibleResult.error.code !== 'P0001') throw new Error('eligibility_unavailable');
        blockers.push(reason);
      } else if (eligibleResult.data !== true) throw new Error('eligibility_unavailable');
      if (attempt) blockers.push('existing_setup_attempt');
      try { loginEncryptionKey(env); } catch { blockers.push('encryption_missing'); }
      stage = 'provider_packages';
      if (!Number.isFinite(snapshot.checkedAt) || snapshot.checkedAt > now() || now() - snapshot.checkedAt > 30000 || !/^[1-9]\d{0,14}$/.test(String(snapshot.account?.id))) throw new Error('stale_provider_review');
      const mapping = buildPaidPlanMapping({ schemaVersion: 1, readOnly: true, checkedAt: new Date(snapshot.checkedAt).toISOString(), packages: snapshot.packages });
      const entry = mapping.entries.find(row => row.tier === payment.tier && row.connections === payment.connections);
      const balance = creditUnits(snapshot.account.credits), cost = creditUnits(entry.provider.credits);
      if (balance < cost) blockers.push('insufficient_credits');
      const { data: lock, error: lockError } = await admin.from('ks_preview_reseller_dispatches').select('attempt_id,reseller_id').eq('reseller_id', String(snapshot.account.id)).maybeSingle();
      if (lockError || (lock && (!uuid(lock.attempt_id) || lock.reseller_id !== String(snapshot.account.id)))) throw new Error('dispatch_status_unavailable');
      if (lock) blockers.push('reseller_dispatch_locked');
      // The final timestamp/age check includes all dependent database reads.
      if (now() - snapshot.checkedAt > 30000) throw new Error('stale_provider_review');
      // Private factory callback for the separately gated approval control. Its
      // internal records never become part of this GET response.
      captureVerifiedReview?.({ admin, adminUser, session, payment, order, owner, snapshot, entry,
        currentPackage: snapshot.packages.find(row => row.id === entry.provider.id), attempt, blockers: [...new Set(blockers)] });
      return res.status(200).json({ review: { version: 1, adminAccountId: adminUser.id, reference, customer: { accountId: owner.id, email: owner.email },
        plan: { tier: payment.tier, connections: payment.connections, interval: payment.interval, amountCents: payment.cents,
          providerMonths: entry.provider.duration.count, bouquetCount: entry.provider.bouquetIds.length },
        creditCostUnits: String(cost), balanceUnits: String(balance), projectedBalanceUnits: balance >= cost ? String(balance - cost) : null,
        checkedAt: new Date(now()).toISOString(), providerCheckedAt: new Date(snapshot.checkedAt).toISOString(), blockers: [...new Set(blockers)],
        status: blockers.length ? 'blocked' : 'review_only', mode: 'read-only', previewOnly: true, canActivate: false,
        creditApprovalRecorded: false, approvalTokenIssued: false, databaseWrites: false, realProviderWrites: 0 } });
    } catch (failure) {
      if (failure?.message === 'review_provider_read_unavailable') stage = 'provider_connection';
      const labels = { administrator: 'Administrator sign-in', saved_order: 'Saved payment', stripe_payment: 'Stripe test payment', customer_and_provider: 'Customer or provider data',
        customer_records: 'Customer and saved receipt', provider_packages: 'Current Roomba packages or credits' };
      return res.status(503).json({ stage, error: `${labels[stage]} could not be verified. Nothing was activated or reserved. Do not pay again for a saved payment.` });
    } finally { if (claimed) active = false; }
  };
}
