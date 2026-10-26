import { useState } from 'react';
import { supabase } from '../../lib/supabase';

type Order = { reference: string; plan: string; connections: number; amountCents: number; queuedAt: string };
type Review = { reference: string; state: 'review_required' | 'verified_for_review'; reason: string;
  checkedAt?: string; validUntil?: string; months?: number; connections?: number; costCredits?: string; packageName?: string };
const ref = (v: unknown): v is string => typeof v === 'string' && /^cs_(live|test)_[A-Za-z0-9]{1,192}$/.test(v);
const date = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
const reasons: Record<string, string> = {
  pending_payment_required: 'The saved payment or setup status needs review.',
  new_service_route_required: 'This order is no longer marked for new service.',
  confirmed_owner_required: 'The purchaser’s confirmed account needs review.',
  existing_or_uncertain_service: 'Existing service, another order, or prior setup activity needs review.',
  settled_bound_payment_required: 'The payment and its original service request could not be confirmed.',
  new_service_intent_required: 'The customer’s original new-service request needs review.',
  insufficient_provider_credits: 'The provider balance is below this package’s credit cost.',
  provider_catalog_requires_review: 'The purchased plan could not be matched to the current provider catalog.',
  payment_changed_during_review: 'Payment details changed while checking. Review this same order again.',
  service_changed_during_review: 'Account or service details changed while checking. Review this same order again.',
  review_expired: 'The check took too long. Review this same order again.',
  new_service_checks_passed: 'Payment, account history and provider package checks passed.',
};

async function request(body?: { reference: string }) {
  const before = await supabase.auth.getSession(), session = before.data.session;
  if (before.error || !session?.access_token) throw Error('Sign in to your administrator account again.');
  const response = await fetch('/api/ks-preview-paid-orders?view=paid-new-service-review', {
    method: body ? 'POST' : 'GET', cache: 'no-store', signal: AbortSignal.timeout(55000),
    headers: { Authorization: `Bearer ${session.access_token}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json();
  const after = await supabase.auth.getSession();
  if (after.error || after.data.session?.user.id !== session.user.id || !response.ok
    || payload.mode !== 'verification-only' || payload.mayDispatch !== false || payload.providerActivated !== false) {
    throw Error(response.status === 429 ? 'Wait 30 seconds before checking again.' : 'The order could not be checked. Retry the same order; do not take another payment.');
  }
  return payload;
}

export default function NewServiceOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null), [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null), [review, setReview] = useState<Review | null>(null);
  async function load() {
    setBusy('list'); setError(null); setReview(null); setOrders(null);
    try {
      const payload = await request();
      const seen = new Set<string>();
      if (!Array.isArray(payload.orders) || payload.orders.length > 50 || payload.orders.some((o: Order) => {
        if (!ref(o?.reference) || seen.has(o.reference) || !['bronze', 'silver', 'gold', 'platinum'].includes(o.plan)
          || !Number.isInteger(o.connections) || o.connections < 1 || o.connections > 5 || !Number.isSafeInteger(o.amountCents)
          || o.amountCents <= 0 || !date(o.queuedAt)) return true;
        seen.add(o.reference); return false;
      })) throw Error('The order list could not be verified. Reload to try again.');
      setOrders(payload.orders.map((o: Order) => ({ reference: o.reference, plan: o.plan, connections: o.connections, amountCents: o.amountCents, queuedAt: o.queuedAt })));
    } catch (e) { setError(e instanceof Error ? e.message : 'The order list could not be checked.'); }
    finally { setBusy(null); }
  }
  async function inspect(reference: string) {
    setBusy(reference); setError(null); setReview(null);
    try {
      const p = await request({ reference });
      if (p.reference !== reference || !['review_required', 'verified_for_review'].includes(p.state) || !Object.prototype.hasOwnProperty.call(reasons, p.reason)
        || (p.state === 'verified_for_review' && (p.reason !== 'new_service_checks_passed' || !date(p.checkedAt) || !date(p.validUntil)
          || Date.parse(p.validUntil) <= Date.now() || ![1, 3, 6, 12].includes(p.months) || !Number.isInteger(p.connections)
          || p.connections < 1 || p.connections > 5 || typeof p.costCredits !== 'string' || !/^\d{1,7}(?:\.\d{1,6})?$/.test(p.costCredits)
          || typeof p.packageName !== 'string' || p.packageName.length > 160))) throw Error('The review could not be verified. Check this same order again.');
      setReview({ reference, state: p.state, reason: p.reason, checkedAt: p.checkedAt,
        validUntil: p.validUntil, months: p.months, connections: p.connections, costCredits: p.costCredits, packageName: p.packageName });
    } catch (e) { setError(e instanceof Error ? e.message : 'The order could not be checked.'); }
    finally { setBusy(null); }
  }
  return <details className="rounded-2xl border border-gray-700 p-4">
    <summary className="cursor-pointer text-sm font-semibold text-gray-200">Paid new-service orders</summary>
    <p className="mt-3 text-sm text-gray-400">Check paid website orders before setting up a new streaming account. Automatic activation is off.</p>
    <button type="button" disabled={busy !== null} onClick={() => void load()} className="mt-3 min-h-11 rounded-xl border border-cyan-500/40 px-4 py-2 text-sm font-semibold text-cyan-200 disabled:opacity-50">{busy === 'list' ? 'Loading orders…' : 'Load new-service orders'}</button>
    {error && <p role="alert" className="mt-3 text-sm text-amber-200">{error}</p>}
    {orders && <><p className="mt-3 text-xs text-gray-400">Pending orders from the latest 50 new-service requests. Refresh after recording or completing service.</p>
      {!orders.length ? <p role="status" className="mt-3 text-sm text-gray-400">No pending new-service orders found in this view.</p> : <ul className="mt-3 space-y-3">{orders.map(o => <li key={o.reference} className="rounded-xl border border-gray-700 p-3 text-sm text-gray-200">
        <p className="capitalize">{o.plan} · {o.connections} connection{o.connections === 1 ? '' : 's'} · {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(o.amountCents / 100)}</p>
        <p className="mt-1 text-xs text-gray-400">Recorded {new Date(o.queuedAt).toLocaleString()}</p>
        <details className="mt-2 text-xs text-gray-400"><summary className="cursor-pointer">Order reference</summary><p className="mt-1 break-all">{o.reference}</p></details>
        <button type="button" disabled={busy !== null} onClick={() => void inspect(o.reference)} className="mt-3 min-h-11 rounded-xl border border-cyan-500/40 px-4 py-2 font-semibold text-cyan-200 disabled:opacity-50">{busy === o.reference ? 'Checking order…' : 'Check new-service order'}</button>
        {review?.reference === o.reference && <div role="status" className="mt-3 rounded-lg border border-cyan-500/20 p-3"><p>{reasons[review.reason]}</p>{review.state === 'verified_for_review' && <><p className="mt-2">{review.months} months · {review.connections} connections · Provider cost: {review.costCredits} credits</p><p className="mt-1 text-xs text-gray-400">Checked {new Date(review.checkedAt!).toLocaleString()}. This is a review snapshot; check again before any later setup.</p></>}<p className="mt-2 text-xs text-gray-400">No streaming account was created and no credits were spent by this check.</p></div>}
      </li>)}</ul>}</>}
  </details>;
}
