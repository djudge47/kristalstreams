import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { readSetupHelpOrders, setupHelpDetails } from '../../../_shared/ks-setup-help.js';
import type { SetupHelpOrder } from '../../../_shared/ks-setup-help.js';

const categories = [
  'Technical Issue',
  'Billing',
  'Account',
  'Streaming',
  'Content',
  'Other'
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' }
];

type OrderContext = { kind: 'none' | 'loading' | 'unavailable' | 'signed_out' }
  | { kind: 'ready'; accountId: string; checkedAt: string; orders: SetupHelpOrder[] };

const NewTicket: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setupHelp = location.state?.setupHelp === true;
  const [subject, setSubject] = useState(setupHelp ? 'Streaming setup help' : '');
  const [description, setDescription] = useState(setupHelp ? 'I need help with the streaming setup for my order.' : '');
  const [category, setCategory] = useState(setupHelp ? 'Streaming' : categories[0]);
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderContext, setOrderContext] = useState<OrderContext>({ kind: setupHelp ? 'loading' : 'none' });
  const [selectedReference, setSelectedReference] = useState('');
  const orderRequest = useRef<AbortController | null>(null);
  const orderOwner = useRef<string | null>(null);
  const submitting = useRef(false);
  const selectedOrder = orderContext.kind === 'ready'
    ? orderContext.orders.find(order => order.reference === selectedReference) : undefined;
  const needsOrderSelection = orderContext.kind === 'ready' && orderContext.orders.length > 0 && !selectedOrder;

  const checkOrderContext = useCallback(async () => {
    if (!setupHelp || orderRequest.current) return;
    const controller = new AbortController();
    orderRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    setOrderContext({ kind: 'loading' });
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (controller.signal.aborted || orderRequest.current !== controller) return;
      if (sessionError || !data.session?.access_token) { setOrderContext({ kind: 'signed_out' }); return; }
      orderOwner.current = data.session.user.id;
      const response = await fetch('/api/ks-customer-setup', {
        method: 'GET', cache: 'no-store', signal: controller.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted || orderRequest.current !== controller) return;
      if (response.status === 401) { setOrderContext({ kind: 'signed_out' }); return; }
      if (!response.ok) throw new Error('order_unavailable');
      const result = readSetupHelpOrders(payload, data.session.user.id);
      setOrderContext({ kind: 'ready', accountId: data.session.user.id, ...result });
      setSelectedReference(previous => result.orders.some(order => order.reference === previous)
        ? previous : result.orders.length === 1 ? result.orders[0].reference : '');
    } catch {
      if (orderRequest.current === controller) setOrderContext({ kind: 'unavailable' });
    } finally {
      window.clearTimeout(timeout);
      if (orderRequest.current === controller) orderRequest.current = null;
    }
  }, [setupHelp]);

  useEffect(() => {
    if (!setupHelp) return;
    void checkOrderContext();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    if (submitting.current || orderContext.kind === 'loading' || needsOrderSelection) return;
    if (orderContext.kind === 'signed_out') { setError('Sign in again before creating a ticket.'); return; }
    if (!subject.trim() || !description.trim()) { setError('Enter a subject and describe how we can help.'); return; }
    submitting.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Please sign in again before creating a ticket.');
      if (orderContext.kind === 'ready' && user.id !== orderContext.accountId) throw new Error('Your account changed. Reload the form before sending order details.');
      const ticketDescription = selectedOrder && orderContext.kind === 'ready'
        ? `${description.trim()}\n\n${setupHelpDetails(selectedOrder, orderContext.checkedAt)}` : description.trim();

      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: subject.trim(),
          description: ticketDescription,
          category,
          priority,
          status: 'open'
        });

      if (error) throw error;

      navigate('/client/support');
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      submitting.current = false;
      setLoading(false);
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
            {orderContext.kind === 'unavailable' && <>Saved order details could not be attached. You can <button type="button" onClick={checkOrderContext} className="font-semibold text-primary underline underline-offset-4">check again</button> or describe your issue and create a general ticket.</>}
            {orderContext.kind === 'signed_out' && <>Your sign-in session changed. <Link to="/login" className="font-semibold text-primary underline underline-offset-4">Sign in again</Link>, then return from your dashboard.</>}
            {orderContext.kind === 'ready' && orderContext.orders.length === 0 && 'No saved order details are available to attach. You can still describe your issue and create a general ticket.'}
          </div>
          {orderContext.kind === 'ready' && orderContext.orders.length > 1 && <div className="mt-4"><label htmlFor="setup-help-order" className="mb-2 block text-sm font-medium text-gray-300">Choose the order you need help with</label><select id="setup-help-order" value={selectedReference} onChange={event => setSelectedReference(event.target.value)} className="min-h-12 w-full rounded-lg border border-gray-700 bg-dark-200 px-3 py-2 text-sm text-white"><option value="">Select an order</option>{orderContext.orders.map(order => <option key={order.reference} value={order.reference}>{order.tier} / {order.interval} / {new Date(order.recordedAt).toLocaleDateString()} / {order.reference.slice(-8)}</option>)}</select></div>}
          {selectedOrder && orderContext.kind === 'ready' && <>
            <p className="mt-4 inline-block rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">{selectedOrder.testMode ? 'Preview · Test payment' : 'Payment recorded'}</p>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-400">Plan</dt><dd className="mt-1 capitalize text-white">{selectedOrder.tier} · {selectedOrder.interval}</dd></div><div><dt className="text-gray-400">Connections ordered</dt><dd className="mt-1 text-white">{selectedOrder.connections}</dd></div><div><dt className="text-gray-400">{selectedOrder.testMode ? 'Test amount' : 'Paid amount'}</dt><dd className="mt-1 text-white">${(selectedOrder.amountCents / 100).toFixed(2)} USD</dd></div><div><dt className="text-gray-400">Payment recorded</dt><dd className="mt-1 text-white">{new Date(selectedOrder.recordedAt).toLocaleString()}</dd></div><div><dt className="text-gray-400">Saved setup status</dt><dd className="mt-1 text-white">{{ awaiting_activation: 'Pending confirmation', requires_review: 'Review needed', setup_complete: 'Setup confirmed', setup_expired: 'Service period ended' }[selectedOrder.status]}</dd></div>{selectedOrder.expiresAt && <div><dt className="text-gray-400">Saved service expiry</dt><dd className="mt-1 text-white">{new Date(selectedOrder.expiresAt).toLocaleString()}</dd></div>}<div className="sm:col-span-2"><dt className="text-gray-400">Order reference</dt><dd className="mt-1 break-all text-white">{selectedOrder.reference}</dd></div></dl>
            <p className="mt-4 text-xs leading-5 text-gray-400">These saved details, their setup status and check time will be included with your message.{selectedOrder.testMode ? ' This test payment did not charge your card.' : ' Please do not pay again for this order.'}</p>
          </>}
        </section>}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div role="alert" className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start">
              <AlertCircle className="text-red-500 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-500">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="ticket-subject" className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="ticket-subject"
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
              className="w-full bg-dark-200 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary resize-none"
              required
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(setupHelp ? '/dashboard' : '/client/support')}
              className="min-h-12 px-6 py-3 border border-gray-800 rounded-lg text-gray-300 hover:bg-dark-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || orderContext.kind === 'loading' || orderContext.kind === 'signed_out' || needsOrderSelection}
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

export default NewTicket;
