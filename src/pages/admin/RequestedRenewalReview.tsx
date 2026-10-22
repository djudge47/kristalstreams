import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import OrderRenewalControls from './OrderRenewalControls';
import { getRetailPrice } from '../../../_shared/ks-retail-pricing.js';

interface Props { customerId: string; panelId: number; username: string; currentConnections: number; initialOrder?: { months: number; connections: number } }
interface OrderReview {
  kind: 'requested-renewal-review'; mode: 'read-only'; executionEnabled: false; sent: false;
  providerChangeVerified: false; status: 'needs_review' | 'catalog_compatible';
  checkedAt: string; validUntil: string; currentMonths: number | null; currentConnections: number;
  requestedMonths: number; requestedConnections: number; packageId: string | null; packageName: string | null;
  credits: number | null; creditsAvailable: number | null; currentGroupIds: number[];
  packageGroupCount: number | null; blockers: string[];
}
const monthsAllowed = [1, 3, 6, 12];
const date = (value: unknown): value is string => typeof value === 'string'
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
function validReview(payload: { [key: string]: unknown }, props: Props, months: number, connections: number): OrderReview {
  const r = payload?.requestedOrder as OrderReview | undefined;
  const line = payload?.line as { customerId?: string; lineId?: string; username?: string } | undefined;
  if (payload?.mode !== 'read-only' || payload.databaseWrites !== false
    || payload.testApproval !== undefined || payload.renewal !== undefined
    || line?.customerId !== props.customerId || line.lineId !== String(props.panelId) || line.username !== props.username
    || !r || r.kind !== 'requested-renewal-review' || r.mode !== 'read-only' || r.executionEnabled !== false
    || r.sent !== false || r.providerChangeVerified !== false || !['needs_review', 'catalog_compatible'].includes(r.status)
    || !date(r.checkedAt) || Date.parse(r.checkedAt) > Date.now() || !date(r.validUntil) || Date.parse(r.validUntil) !== Date.parse(r.checkedAt) + 30000
    || (r.currentMonths !== null && !monthsAllowed.includes(r.currentMonths))
    || !Number.isInteger(r.currentConnections) || r.currentConnections < 1 || r.currentConnections > 32
    || r.requestedMonths !== months || r.requestedConnections !== connections
    || (r.packageId !== null && (typeof r.packageId !== 'string' || !/^[1-9]\d{0,11}$/.test(r.packageId)))
    || (r.packageName !== null && r.packageName !== `${months} months · ${connections} connections`)
    || ![r.credits, r.creditsAvailable].every(value => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1000000))
    || !Array.isArray(r.currentGroupIds) || r.currentGroupIds.length > 2000
    || !r.currentGroupIds.every((value, i) => Number.isSafeInteger(value) && value > 0 && value <= 2147483647 && (i === 0 || value > r.currentGroupIds[i - 1]))
    || (r.packageGroupCount !== null && (!Number.isInteger(r.packageGroupCount) || r.packageGroupCount < 1 || r.packageGroupCount > 2000))
    || !Array.isArray(r.blockers) || r.blockers.length > 12 || !r.blockers.every(value => typeof value === 'string' && value.length <= 200)
    || (r.status === 'catalog_compatible' && (r.blockers.length || !r.currentMonths || !r.packageId || !r.packageName
      || !r.credits || r.creditsAvailable === null || r.creditsAvailable < r.credits || !r.currentGroupIds.length
      || r.packageGroupCount === null || r.packageGroupCount < r.currentGroupIds.length))
    || (r.status === 'needs_review' && !r.blockers.length)) throw Error('The requested-order review could not be verified.');
  return r;
}

export default function RequestedRenewalReview(props: Props) {
  const { customerId, panelId, username, currentConnections, initialOrder } = props;
  const identity = `${customerId}:${panelId}:${username}`;
  const [months, setMonths] = useState(initialOrder && monthsAllowed.includes(initialOrder.months) ? initialOrder.months : 12);
  const [connections, setConnections] = useState(initialOrder && Number.isInteger(initialOrder.connections) && initialOrder.connections >= 1 && initialOrder.connections <= 5 ? initialOrder.connections : Math.max(1, Math.min(5, currentConnections)));
  const [stored, setStored] = useState<{ identity: string; review: OrderReview } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState(Date.now());
  const controller = useRef<AbortController | null>(null);
  const review = stored?.identity === identity ? stored.review : null;
  useEffect(() => () => { const pending = controller.current; controller.current = null; pending?.abort(); }, [identity]);
  useEffect(() => {
    if (!review) return;
    const timer = window.setTimeout(() => setClock(Date.now()), Math.max(0, Date.parse(review.validUntil) - Date.now()) + 10);
    return () => window.clearTimeout(timer);
  }, [review]);
  const check = async () => {
    if (controller.current) return;
    const pending = new AbortController(); controller.current = pending;
    setBusy(true); setError(null); setStored(null);
    const timer = window.setTimeout(() => pending.abort(), 55000);
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session?.access_token) throw Error('Please sign in again to your admin account.');
      const query = new URLSearchParams({ view: 'customer-renewal-order', customerId, months: String(months), connections: String(connections) });
      const response = await fetch(`/api/ks-roomba-crm?${query}`, { method: 'GET', cache: 'no-store', signal: pending.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' } });
      const payload = await response.json().catch(() => null);
      if (controller.current !== pending || pending.signal.aborted) return;
      if (!response.ok) throw Error(payload?.error || 'The requested-order review could not be loaded.');
      const next = validReview(payload, props, months, connections);
      setStored({ identity, review: next }); setClock(Date.now());
    } catch (failure) {
      if (controller.current === pending) setError(pending.signal.aborted ? 'The requested-order check timed out. Try again shortly.'
        : failure instanceof Error ? failure.message : 'The requested-order review could not be loaded.');
    } finally {
      window.clearTimeout(timer);
      if (controller.current === pending) { controller.current = null; setBusy(false); }
    }
  };
  const expired = review && Date.parse(review.validUntil) <= Math.max(clock, Date.now());
  const retailPrice = getRetailPrice(months, connections);
  return <section className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-sm leading-6" aria-label="Change renewal order">
    <h3 className="font-semibold text-cyan-200">Change renewal order</h3>
    <p className="mt-1 text-xs text-gray-400">Choose the term and connection allowance requested for {username}. This checks XUI without submitting a renewal.</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <fieldset className="min-w-0 text-xs text-gray-300" disabled={busy}>
        <legend className="mb-1">Requested months</legend>
        <div className="flex flex-wrap gap-2">
          {monthsAllowed.map(value => <button key={value} type="button" aria-label={`${value} month${value === 1 ? '' : 's'}`} aria-pressed={months === value} disabled={busy}
            onClick={() => { setMonths(value); setStored(null); setError(null); }}
            className={`min-h-11 rounded-lg border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50 ${months === value ? 'border-cyan-300 bg-cyan-500/20 font-semibold text-cyan-100' : 'border-gray-700 bg-gray-950 text-white hover:border-cyan-400/60'}`}>
            {value} month{value === 1 ? '' : 's'}
          </button>)}
        </div>
      </fieldset>
      <fieldset className="min-w-0 text-xs text-gray-300" disabled={busy}>
        <legend className="mb-1">Requested connections</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map(value => <button key={value} type="button" aria-label={`${value} connection${value === 1 ? '' : 's'}`} aria-pressed={connections === value} disabled={busy}
            onClick={() => { setConnections(value); setStored(null); setError(null); }}
            className={`min-h-11 rounded-lg border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50 ${connections === value ? 'border-cyan-300 bg-cyan-500/20 font-semibold text-cyan-100' : 'border-gray-700 bg-gray-950 text-white hover:border-cyan-400/60'}`}>
            {value} connection{value === 1 ? '' : 's'}
          </button>)}
        </div>
      </fieldset>
    </div>
    <p className="mt-2 text-xs text-cyan-200">Requested: <strong>{months} months · {connections} connection{connections === 1 ? '' : 's'}</strong></p>
    {initialOrder && (months !== initialOrder.months || connections !== initialOrder.connections) && <p role="note" className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">These choices differ from the recorded payment selection ({initialOrder.months} months · {initialOrder.connections} connections). Check the payment arrangement before approving service. The payment record has not changed.</p>}
    {retailPrice && <p className="mt-1 text-xs text-gray-300">Customer plan price: <strong>${(retailPrice.totalCents / 100).toFixed(2)} / {months} month{months === 1 ? '' : 's'}</strong>. Payment is recorded separately.</p>}
    <button type="button" disabled={busy} onClick={() => void check()}
      className="mt-3 min-h-11 rounded-lg border border-cyan-400/40 px-3 py-2 text-xs font-semibold text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50">
      {busy ? 'Checking requested order…' : 'Review requested order'}
    </button>
    <div role="status" aria-live="polite">{review && <div className="mt-3 space-y-2 text-xs text-gray-300">
      <p className="font-semibold text-cyan-200">Requested order review · {review.status === 'catalog_compatible' && !expired ? 'Package supports the current channel selection' : 'Needs review'}</p>
      <table className="w-full text-left"><thead><tr><th scope="col">Order</th><th scope="col">Current</th><th scope="col">Requested</th></tr></thead>
        <tbody><tr><th scope="row" className="font-normal">Months</th><td>{review.currentMonths ?? 'Unverified'}</td><td>{review.requestedMonths}</td></tr>
          <tr><th scope="row" className="font-normal">Connections</th><td>{review.currentConnections}</td><td>{review.requestedConnections}</td></tr></tbody></table>
      <p>Provider package cost: <strong>{review.credits === null ? 'Unverified' : `${review.credits} credits`}</strong></p>
      <p>Reseller balance at check: {review.creditsAvailable === null ? 'Unverified' : `${review.creditsAvailable} credits`}</p>
      {review.currentGroupIds.length > 0 && <p>Groups to preserve: <code>{review.currentGroupIds.join(', ')}</code>. Additional package groups will not be added.</p>}
      {review.blockers.length > 0 && <ul className="list-disc pl-4 text-amber-200">{review.blockers.map(reason => <li key={reason}>{reason}</li>)}</ul>}
      {expired && <p className="text-amber-200">This snapshot has expired. Review the requested order again for current details.</p>}
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-amber-200">XUI can start a changed package from today. Unused service time may not carry over. Check the expiration shown in XUI’s purchase review before approving a purchase.</p>
      <p className="text-amber-200">Read-only review. Changing an existing XUI package, its remaining time and its connection allowance still needs provider verification. This quote alone cannot authorize a purchase.</p>
      <p>This requested-order check did not submit a purchase or change records.</p>
    </div>}</div>
    {error && <p role="alert" className="mt-3 text-xs text-amber-200">{error}</p>}
    <OrderRenewalControls customerId={customerId} panelId={panelId} username={username} months={months} connections={connections}
      hasSourceReview={Boolean(review?.status === 'catalog_compatible' && !expired)} />
  </section>;
}
