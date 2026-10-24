import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { readSetupHelpOrders, setupHelpDetails } from '../../../_shared/ks-setup-help.js';
import { useVerifiedWebsiteAccount } from '../../lib/useVerifiedWebsiteAccount';
import { createSupportTicket, SupportFailure, SUPPORT_CATEGORIES } from '../../lib/support-tickets';
import type { SetupHelpOrder } from '../../../_shared/ks-setup-help.js';

const categories = SUPPORT_CATEGORIES;

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' }
];

type OrderContext = { kind: 'none' | 'loading' | 'unavailable' | 'signed_out' }
  | { kind: 'ready'; accountId: string; checkedAt: string; orders: SetupHelpOrder[] };

export const NewTicketForm = ({ accountId }: { accountId: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const setupHelp = location.state?.setupHelp === true;
  const [subject, setSubject] = useState(setupHelp ? 'Streaming setup help' : '');
  const [description, setDescription] = useState(setupHelp ? 'I need help with the streaming setup for my order.' : '');
  const [category, setCategory] = useState<string>(setupHelp ? 'Streaming' : categories[0]);
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderContext, setOrderContext] = useState<OrderContext>({ kind: setupHelp ? 'loading' : 'none' });
  const [selectedReference, setSelectedReference] = useState('');
  const orderRequest = useRef<AbortController | null>(null);
  const orderOwner = useRef<string | null>(null);
  const submitting = useRef(false);
  const active = useRef(false), blocked = useRef(false);
  const saveRequest = useRef<AbortController | null>(null);
  const orderTimer = useRef<number | undefined>(), saveTimer = useRef<number | undefined>();
  const [uncertain, setUncertain] = useState(false);
  useEffect(() => { active.current = true; return () => { active.current = false; saveRequest.current?.abort(); saveRequest.current = null; orderRequest.current?.abort(); orderRequest.current = null; window.clearTimeout(orderTimer.current); window.clearTimeout(saveTimer.current); }; }, []);
  const selectedOrder = orderContext.kind === 'ready'
    ? orderContext.orders.find(order => order.reference === selectedReference) : undefined;
  const needsOrderSelection = orderContext.kind === 'ready' && orderContext.orders.length > 0 && !selectedOrder;

  const checkOrderContext = useCallback(async () => {
    if (!active.current || !setupHelp || orderRequest.current || submitting.current || blocked.current) return;
    const controller = new AbortController();
    orderRequest.current = controller;
    const timeout = window.setTimeout(() => { if (!active.current || orderRequest.current !== controller) return; orderRequest.current = null; controller.abort(); setOrderContext({ kind: 'unavailable' }); setSelectedReference(''); }, 20000); orderTimer.current = timeout;
    setOrderContext({ kind: 'loading' });
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active.current || controller.signal.aborted || orderRequest.current !== controller) return;
      if (sessionError || !data.session?.access_token || data.session.user.id !== accountId) { setOrderContext({ kind: 'signed_out' }); return; }
      orderOwner.current = data.session.user.id;
      const response = await fetch('/api/ks-customer-setup', {
        method: 'GET', cache: 'no-store', signal: controller.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null);
      if (!active.current || controller.signal.aborted || orderRequest.current !== controller) return;
      if (response.status === 401) { setOrderContext({ kind: 'signed_out' }); return; }
      if (!response.ok) throw new Error('order_unavailable');
      const result = readSetupHelpOrders(payload, data.session.user.id);
      setOrderContext({ kind: 'ready', accountId: data.session.user.id, ...result });
      setSelectedReference(previous => result.orders.some(order => order.reference === previous)
        ? previous : result.orders.length === 1 ? result.orders[0].reference : '');
    } catch {
      if (active.current && orderRequest.current === controller) setOrderContext({ kind: 'unavailable' });
    } finally {
      window.clearTimeout(timeout);
      if (orderRequest.current === controller) orderRequest.current = null;
    }
  }, [setupHelp, accountId]);

  useEffect(() => {
    if (!setupHelp) return;
    void checkOrderContext();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active.current) return;
      if (!session || (orderOwner.current && session.user.id !== orderOwner.current)) {
        orderRequest.current?.abort(); orderRequest.current = null;
        setSelectedReference(''); setOrderContext({ kind: 'signed_out' });
        setSubject(''); setDescription(''); setError(null);
      }
    });
    return () => { orderRequest.current?.abort(); orderRequest.current = null; subscription.unsubscribe(); };
  }, [setupHelp, checkOrderContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active.current || blocked.current || submitting.current || orderContext.kind === 'loading' || needsOrderSelection) return;
    if (orderContext.kind === 'signed_out') { setError('Sign in again before creating a ticket.'); return; }
    if (!subject.trim() || !description.trim() || subject.trim().length > 200 || description.trim().length > 10000) { setError('Enter a subject and describe how we can help.'); return; }
    const controller = new AbortController(); saveRequest.current = controller;
    const isCurrent = () => active.current && saveRequest.current === controller;
    submitting.current = true; setLoading(true); setError(null);
    const unknown = () => { blocked.current = true; setUncertain(true); setError('Your ticket may already have been created. Check your support tickets before starting another one. This form will not retry automatically.'); };
    const timeout = window.setTimeout(() => { if (!isCurrent()) return; saveRequest.current = null; controller.abort(); submitting.current = false; setLoading(false); unknown(); }, 20000); saveTimer.current = timeout;
    try {
      const ticketDescription = selectedOrder && orderContext.kind === 'ready'
        ? `${description.trim()}\n\n${setupHelpDetails(selectedOrder, orderContext.checkedAt)}` : description.trim();
      await createSupportTicket(supabase, accountId, { subject, description: ticketDescription, category, priority }, { signal: controller.signal, isCurrent });
      if (isCurrent()) navigate('/client/support', { replace: true });
    } catch (err) {
      if (!isCurrent()) return;
      if (!(err instanceof SupportFailure) || err.code === 'uncertain') unknown();
      else if (err.code === 'changed') { blocked.current = true; setSubject(''); setDescription(''); setSelectedReference(''); setOrderContext({ kind: 'signed_out' }); setError('Your account changed. Sign in again before creating a ticket.'); }
      else setError(err.code === 'invalid' ? 'Use a subject of 1–200 characters and a description of 1–10,000 characters, with a listed category and priority.' : 'Your account could not be verified. Please try again before creating a ticket.');
    } finally {
      window.clearTimeout(timeout);
      if (saveRequest.current === controller) { saveRequest.current = null; submitting.current = false; if (active.current) setLoading(false); }
    }
  };

  return (
    <div>
      <div className="flex items-center mb-8">
        <MessageSquare className="text-primary w-8 h-8 mr-4 shrink-0" />
        <h1 className="min-w-0 text-2xl sm:text-3xl font-bold text-white">{setupHelp ? 'Get setup help' : 'New Support Ticket'}</h1>
      </div>

      <div className="max-w-2xl">
        {setupHelp && <section className="mb-6 min-w-0 rounded-xl border border-amber-400/20 bg-amber-500/5 p-4 sm:p-5" aria-labelledby="setup-help-order-title">
          <h2 id="setup-help-order-title" className="font-semibold text-white">Order details for your ticket</h2>
          <p className="mt-2 text-sm leading-6 text-gray-300">Review your message below. Nothing is sent until you choose Create Ticket.</p>
          <div role="status" aria-live="polite" className="mt-3 text-sm leading-6 text-gray-400">
            {orderContext.kind === 'loading' && 'Checking the saved orders belonging to your account...'}
            {orderContext.kind === 'unavailable' && <>Saved order details could not be attached. You can <button type="button" disabled={loading || blocked.current} onClick={checkOrderContext} className="font-semibold text-primary underline underline-offset-4">check again</button> or describe your issue and create a general ticket.</>}
            {orderContext.kind === 'signed_out' && <>Your sign-in session changed. <Link to="/login" className="font-semibold text-primary underline underline-offset-4">Sign in again</Link>, then return from your dashboard.</>}
            {orderContext.kind === 'ready' && orderContext.orders.length === 0 && 'No saved order details are available to attach. You can still describe your issue and create a general ticket.'}
          </div>
          {orderContext.kind === 'ready' && orderContext.orders.length > 1 && <div className="mt-4"><label htmlFor="setup-help-order" className="mb-2 block text-sm font-medium text-gray-300">Choose the order you need help with</label><select id="setup-help-order" disabled={loading || blocked.current} value={selectedReference} onChange={event => setSelectedReference(event.target.value)} className="min-h-12 w-full rounded-lg border border-gray-700 bg-dark-200 px-3 py-2 text-sm text-white"><option value="">Select an order</option>{orderContext.orders.map(order => <option key={order.reference} value={order.reference}>{order.tier} / {order.interval} / {new Date(order.recordedAt).toLocaleDateString()} / {order.reference.slice(-8)}</option>)}</select></div>}
          {selectedOrder && orderContext.kind === 'ready' && <>
            <p className="mt-4 inline-block rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">{selectedOrder.testMode ? 'Preview · Test payment' : 'Payment recorded'}</p>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-400">Plan</dt><dd className="mt-1 capitalize text-white">{selectedOrder.tier} · {selectedOrder.interval}</dd></div><div><dt className="text-gray-400">Connections ordered</dt><dd className="mt-1 text-white">{selectedOrder.connections}</dd></div><div><dt className="text-gray-400">{selectedOrder.testMode ? 'Test amount' : 'Paid amount'}</dt><dd className="mt-1 text-white">${(selectedOrder.amountCents / 100).toFixed(2)} USD</dd></div><div><dt className="text-gray-400">Payment recorded</dt><dd className="mt-1 text-white">{new Date(selectedOrder.recordedAt).toLocaleString()}</dd></div><div><dt className="text-gray-400">Saved setup status</dt><dd className="mt-1 text-white">{{ awaiting_activation: 'Pending confirmation', requires_review: 'Review needed', setup_complete: 'Setup confirmed', setup_expired: 'Service period ended' }[selectedOrder.status]}</dd></div>{selectedOrder.expiresAt && <div><dt className="text-gray-400">Saved service expiry</dt><dd className="mt-1 text-white">{new Date(selectedOrder.expiresAt).toLocaleString()}</dd></div>}<div className="sm:col-span-2"><dt className="text-gray-400">Order reference</dt><dd className="mt-1 break-all text-white">{selectedOrder.reference}</dd></div></dl>
            <p className="mt-4 text-xs leading-5 text-gray-400">These saved details, their setup status and check time will be included with your message.{selectedOrder.testMode ? ' This test payment did not charge your card.' : ' Please do not pay again for this order.'}</p>
          </>}
        </section>}
        <form onSubmit={handleSubmit} className="space-y-6" aria-busy={loading}>
          {error && (
            <div role="alert" className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start">
              <AlertCircle className="text-red-500 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {uncertain && <Link to="/client/support" className="inline-flex min-h-12 items-center rounded-xl border border-gray-600 px-4 font-semibold text-white">Check my support tickets</Link>}
          <fieldset disabled={loading || blocked.current} className="space-y-6"><legend className="sr-only">New support ticket details</legend>
          <div>
            <label htmlFor="ticket-subject" className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="ticket-subject"
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-dark-200 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label htmlFor="ticket-category" className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-dark-200 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ticket-priority" className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <select
              id="ticket-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-dark-200 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ticket-description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              maxLength={10000}
              className="w-full bg-dark-200 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary resize-none"
              required
            />
          </div>

          </fieldset>
          <p className="text-sm text-gray-400">Creates a ticket in your website account. This does not confirm email delivery.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={() => navigate(setupHelp ? '/dashboard' : '/client/support')}
              className="min-h-12 px-6 py-3 border border-gray-800 rounded-lg text-gray-300 hover:bg-dark-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || blocked.current || orderContext.kind === 'loading' || orderContext.kind === 'signed_out' || needsOrderSelection}
              className="min-h-12 bg-primary hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 disabled:bg-gray-700 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function NewTicket() {
  const account = useVerifiedWebsiteAccount();
  const location = useLocation();
  const setupHelp = location.state?.setupHelp === true;
  if (account.status === 'ready' && account.accountId) return <NewTicketForm key={`${account.accountId}:${setupHelp ? 'setup' : 'general'}`} accountId={account.accountId} />;
  return <section className="min-w-0 space-y-4"><h1 className="text-2xl font-bold text-white">New Support Ticket</h1>
    {account.status === 'loading' ? <p role="status" className="text-gray-400">Checking your website account…</p> : account.status === 'unavailable' ? <><p role="alert" className="text-amber-200">Your account could not be checked.</p><button type="button" onClick={() => void account.retry()} className="min-h-12 rounded-xl border border-gray-600 px-4 font-semibold text-white">Try account check again</button></> : account.status === 'unconfirmed' ? <p className="text-gray-300">Confirm your website email before creating a support ticket.</p> : <Link to="/login" state={{ from: '/client/support/new' }} className="inline-flex min-h-12 items-center text-primary underline">Sign in to your website account</Link>}
    <p><Link to="/support" className="inline-flex min-h-12 items-center text-primary underline">Other ways to get support</Link></p>
  </section>;
}
