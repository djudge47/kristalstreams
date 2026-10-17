import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import TrialUpgradeReview from './TrialUpgradeReview';

type PaidOrder = {
  sessionId: string; userId: string; accountLabel: string; testMode: true;
  tier: string; connections: number; interval: string; amountCents: number;
  recordedAt: string; queuedAt: string; orderStatus: 'awaiting_activation'; providerActivated: false;
  canReviewTrial: boolean;
};
const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const PreviewPaidOrders: React.FC = () => {
  const [orders, setOrders] = useState<PaidOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);

  const checkOrders = async () => {
    if (busy.current) return;
    busy.current = true;
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    setLoading(true); setError(''); setOrders(null);
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session?.access_token) throw new Error('Please sign in again to your admin account.');
      const response = await fetch('/api/ks-preview-paid-orders', {
        method: 'GET', cache: 'no-store', signal: controller.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted || request.current !== controller) return;
      if (!response.ok || !Array.isArray(payload?.orders) || payload.mode !== 'read-only') throw new Error(payload?.error || 'The CRM order queue could not be checked.');
      setOrders(payload.orders as PaidOrder[]);
    } catch (failure) {
      if (request.current === controller) setError(controller.signal.aborted ? 'The order check took too long. Try again.' : failure instanceof Error ? failure.message : 'The order queue is unavailable.');
    } finally {
      window.clearTimeout(timeout); busy.current = false;
      if (request.current === controller) { request.current = null; setLoading(false); }
    }
  };

  return <section className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-gray-900 to-gray-950 p-5 sm:p-6" aria-labelledby="paid-orders-title">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Private Preview · Test payments</p><h2 id="paid-orders-title" className="mt-2 text-xl font-bold text-white">Paid orders awaiting activation</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">Confirmed test payments enter this queue once. Service stays unactivated while customer setup is pending.</p></div>
      <button type="button" onClick={checkOrders} disabled={loading} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-600 bg-gray-800 px-4 py-3 text-sm font-semibold text-white hover:border-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}{loading ? 'Checking orders...' : 'Check paid orders'}</button>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">{error}</p>}
    <div role="status" aria-live="polite" className="sr-only">{loading ? 'Checking saved payment orders.' : orders ? `${orders.length} test order${orders.length === 1 ? '' : 's'} awaiting activation.` : 'Payment orders have not been checked.'}</div>
    {orders?.length === 0 && <p className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-gray-300">No test payments are waiting in this queue.</p>}
    {orders && orders.length > 0 && <div className="mt-5 grid gap-4 lg:grid-cols-2">{orders.map(order => <article key={order.sessionId} className="min-w-0 rounded-2xl border border-white/10 bg-gray-950/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="break-words font-semibold text-white">{order.accountLabel}</h3><span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">Test payment</span></div>
      <p className="mt-3 flex items-center gap-2 font-semibold text-amber-300"><Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />Paid — awaiting activation</p>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-gray-500">Plan</dt><dd className="mt-1 capitalize text-white">{order.tier} · {order.interval}</dd></div>
        <div><dt className="text-gray-500">Test amount</dt><dd className="mt-1 text-white">{money(order.amountCents)}</dd></div>
        <div><dt className="text-gray-500">Connections purchased</dt><dd className="mt-1 text-white">{order.connections}</dd></div>
        <div><dt className="text-gray-500">Payment recorded</dt><dd className="mt-1 text-white">{new Date(order.recordedAt).toLocaleString()}</dd></div>
      </dl>
      <p className="mt-4 flex items-start gap-2 text-sm text-gray-400"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />Payment receipt saved. No Roomba service or expiry has been created for this order.</p>
      <details className="mt-4 text-xs text-gray-500"><summary className="cursor-pointer font-medium text-gray-400">Account and payment reference</summary><p className="mt-2 break-all">Account ID: {order.userId}</p><p className="mt-2 break-all">Checkout: {order.sessionId}</p><p className="mt-2">The account ID identifies the purchaser. Profile labels are display details, not a match to an existing streaming line.</p></details>
      {order.canReviewTrial && <TrialUpgradeReview sessionId={order.sessionId} />}
    </article>)}</div>}
    <p className="mt-4 text-xs leading-5 text-gray-500">Saved receipts only; this is not a live Stripe or Roomba status check. This Preview queue does not activate service, spend credits or add test payments to live customer revenue.</p>
  </section>;
};
export default PreviewPaidOrders;
