import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { readSetupHelpOrders } from '../../_shared/ks-setup-help.js';
import type { SetupHelpOrder } from '../../_shared/ks-setup-help.js';

type View = { kind: 'loading' | 'hidden' | 'signed_out' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; orders: SetupHelpOrder[]; checkedAt: string };

const CustomerSetupStatus: React.FC<{ accountId: string }> = ({ accountId }) => {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const request = useRef<AbortController | null>(null);
  const checkStatus = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    setView({ kind: 'loading' });
    try {
      const { data, error } = await supabase.auth.getSession();
      if (controller.signal.aborted || request.current !== controller) return;
      if (error || !data.session?.access_token || data.session.user.id !== accountId) {
        setView({ kind: 'signed_out' });
        return;
      }
      const response = await fetch('/api/ks-customer-setup', {
        method: 'GET', cache: 'no-store', signal: controller.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' },
      });
      if (controller.signal.aborted || request.current !== controller) return;
      // Existing live receipt-only orders remain readable after a rollout pause.
      if (response.status === 404) { setView({ kind: 'hidden' }); return; }
      if (response.status === 401) { setView({ kind: 'signed_out' }); return; }
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted || request.current !== controller) return;
      if (!response.ok) throw new Error(payload?.error || 'Your saved order status is temporarily unavailable.');
      const result = readSetupHelpOrders(payload, accountId);
      setView({ kind: 'ready', ...result });
    } catch (failure) {
      if (request.current === controller) setView({ kind: 'error', message: controller.signal.aborted
        ? 'The order check took too long. You can check again.'
        : failure instanceof Error ? failure.message : 'Your saved order status is temporarily unavailable.' });
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) request.current = null;
    }
  }, [accountId]);

  useEffect(() => {
    void checkStatus();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id !== accountId) {
        request.current?.abort(); request.current = null;
        setView({ kind: 'signed_out' });
      }
    });
    return () => { request.current?.abort(); request.current = null; subscription.unsubscribe(); };
  }, [accountId, checkStatus]);

  if (view.kind === 'hidden' || (view.kind === 'ready' && view.orders.length === 0)) return null;

  const needsReview = view.kind === 'ready' && view.orders.some(order => order.status === 'requires_review');
  const allRenewed = view.kind === 'ready' && view.orders.every(order => order.status === 'renewal_complete');
  const allComplete = view.kind === 'ready' && view.orders.every(order => order.status === 'setup_complete');
  const allExpired = view.kind === 'ready' && view.orders.every(order => order.status === 'setup_expired');
  const allPending = view.kind === 'ready' && view.orders.every(order => order.status === 'awaiting_activation');

  return <section aria-labelledby="customer-order-heading" className="mb-8 min-w-0 rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-950/20 via-dark-100 to-dark-200 p-5 sm:p-7">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Your order</p>
        <h2 id="customer-order-heading" className="mt-2 text-xl font-bold text-white sm:text-2xl">{view.kind === 'ready' ? needsReview ? 'Payment recorded — setup needs attention' : allRenewed ? 'Renewal completed' : allComplete ? 'Streaming setup confirmed' : allExpired ? 'Service period ended' : allPending ? 'Payment received — setup pending' : 'Your streaming orders' : 'Streaming setup status'}</h2>
      </div>
      {view.kind !== 'signed_out' && <button type="button" onClick={checkStatus} disabled={view.kind === 'loading'} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-600 bg-dark-200 px-4 py-3 text-sm font-semibold text-white transition hover:border-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 disabled:opacity-60">{view.kind === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}{view.kind === 'loading' ? 'Checking...' : 'Check setup status'}</button>}
    </div>
    <div role="status" aria-live="polite" className="sr-only">{view.kind === 'loading' ? 'Checking your saved order status.' : view.kind === 'ready' ? 'Saved order statuses loaded. Check each order for its setup status.' : ''}</div>
    {view.kind === 'loading' && <p className="mt-4 text-sm text-gray-400">Checking your saved payment and setup status...</p>}
    {view.kind === 'signed_out' && <p className="mt-4 text-sm leading-6 text-gray-300">Your account session changed. <Link to="/login" className="font-semibold text-primary underline underline-offset-4">Sign in again</Link> to reload your own order status.</p>}
    {view.kind === 'error' && <div role="alert" className="mt-4 text-sm leading-6 text-amber-200"><p>{view.message}</p><p className="mt-2">This does not mean your payment failed. If you already paid, please do not pay again. Contact support if you need help.</p></div>}
    {view.kind === 'ready' && <>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">Your payment records are saved. Check each order below for its streaming setup status.</p>
      <div className="mt-5 space-y-3">{view.orders.map(order => <article key={order.reference} className="min-w-0 rounded-xl border border-white/10 bg-dark-300/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold capitalize text-white">{order.tier} · {order.interval}</h3><span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">{order.testMode ? 'Preview · Test payment' : 'Payment recorded'}</span></div>
        <p className={`mt-4 flex items-center gap-2 text-sm font-semibold ${['setup_complete', 'renewal_complete'].includes(order.status) ? 'text-emerald-300' : 'text-amber-200'}`}>{['setup_complete', 'renewal_complete'].includes(order.status) ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <Clock3 className="h-5 w-5" aria-hidden="true" />}{['setup_complete', 'renewal_complete'].includes(order.status) ? order.status === 'renewal_complete' ? 'Renewal completed' : 'Saved setup confirmed' : order.status === 'setup_expired' ? 'Service period ended' : order.status === 'requires_review' ? 'Setup needs review' : 'Streaming setup pending'}</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
          <div><dt className="text-gray-500">{order.testMode ? 'Test amount' : 'Paid amount'}</dt><dd className="mt-1 font-semibold text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.amountCents / 100)}</dd></div>
          <div><dt className="text-gray-500">Connections ordered</dt><dd className="mt-1 text-white">{order.connections}</dd></div>
          <div><dt className="text-gray-500">Payment recorded</dt><dd className="mt-1 text-white">{new Date(order.recordedAt).toLocaleString()}</dd></div>
          {order.status === 'renewal_complete' && <div><dt className="text-gray-500">Renewal completed</dt><dd className="mt-1 text-white">{new Date(order.completedAt).toLocaleString()}</dd></div>}
          {order.expiresAt && <div><dt className="text-gray-500">{order.status === 'renewal_complete' ? 'Expiry recorded for this renewal' : 'Saved service expiry'}</dt><dd className="mt-1 font-semibold text-white">{new Date(order.expiresAt).toLocaleString()}</dd></div>}
        </dl>
        {order.testMode && <p className="mt-3 text-xs leading-5 text-cyan-200/80">This test payment did not charge your card.</p>}
        <p className="mt-3 text-xs leading-5 text-gray-300">{['setup_complete', 'renewal_complete'].includes(order.status) ? order.status === 'renewal_complete' ? 'This renewal was completed. Your streaming service panel shows current saved details, which may include later changes. This is not a live playback check.' : 'Saved streaming setup is confirmed for this order.' : order.status === 'setup_expired' ? 'This saved service period has ended. Contact support about renewal; do not pay again for this order.' : order.status === 'requires_review' ? 'Streaming setup needs review. Contact support; do not pay again for this order.' : 'Streaming setup has not yet been confirmed for this order.'}</p>
        <details className="mt-3 text-xs text-gray-400"><summary className="cursor-pointer font-medium">Order reference for support</summary><p className="mt-2 break-all">{order.reference}</p></details>
      </article>)}</div>
      <p className="mt-4 text-sm leading-6 text-gray-300">Please do not pay again for these orders. Your website plan and existing streaming access are separate from each order shown here.</p>
      <p className="mt-2 text-xs leading-5 text-gray-500">Saved status checked {new Date(view.checkedAt).toLocaleString()}.</p>
    </>}
    {view.kind !== 'loading' && <Link to="/client/support/new" state={{ setupHelp: true }} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 sm:w-auto"><MessageSquare className="h-4 w-4" aria-hidden="true" />Get setup help</Link>}
  </section>;
};

export default CustomerSetupStatus;
