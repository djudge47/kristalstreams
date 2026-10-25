import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useVerifiedWebsiteAccount } from '../lib/useVerifiedWebsiteAccount';
import { readCheckoutServices, type CheckoutService } from '../../_shared/ks-checkout-services.js';

type Props = { selected: string | undefined; onChange: (id: string | undefined) => void; disabled: boolean };
export default function CheckoutServiceSelect({ selected, onChange, disabled }: Props) {
  const account = useVerifiedWebsiteAccount();
  useEffect(() => { onChange(undefined); }, [account.accountId, account.status, onChange]);
  if (account.status === 'loading') return <p role="status" className="mb-4 text-sm text-gray-300">Checking your account…</p>;
  if (account.status === 'unavailable') return <div role="alert" className="mb-4 space-y-2 text-sm text-amber-200"><p>Your account could not be checked.</p><button type="button" disabled={disabled} onClick={() => void account.retry()} className="min-h-12 rounded-xl border border-gray-600 px-4">Try account check again</button></div>;
  if (account.status !== 'ready' || !account.accountId) return <p role="alert" className="mb-4 text-sm text-amber-200">Sign in with a confirmed website account to choose a service.</p>;
  return <OwnedServices key={account.accountId} selected={selected} onChange={onChange} disabled={disabled} accountId={account.accountId} />;
}

function OwnedServices({ accountId, selected, onChange, disabled }: Props & { accountId: string }) {
  const [services, setServices] = useState<CheckoutService[]>([]);
  const [cursor, setCursor] = useState<string | null>(null), [history, setHistory] = useState<(string | null)[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null), [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    setLoading(true); setError(''); setServices([]); setNextCursor(null);
    void (async () => {
      try {
        const { data, error: authError } = await supabase.auth.getSession();
        if (controller.signal.aborted) return;
        if (authError || data.session?.user.id !== accountId || !data.session?.access_token) throw Error('account_changed');
        const query = new URLSearchParams({ view: 'checkout-services', ...(cursor ? { afterId: cursor } : {}) });
        const response = await fetch(`/api/ks-customer-setup?${query}`, { cache: 'no-store', signal: controller.signal,
          headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' } });
        const body = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok) throw Error('service_check_failed');
        const page = readCheckoutServices(body, accountId);
        setServices(page.services); setNextCursor(page.nextCursor);
      } catch {
        if (!controller.signal.aborted) setError('Your linked services could not be checked. Try again or contact support before paying.');
      } finally {
        window.clearTimeout(timer);
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    const aborted = () => { setError('The service check took too long. Try again before paying.'); setLoading(false); };
    controller.signal.addEventListener('abort', aborted, { once: true });
    return () => { controller.signal.removeEventListener('abort', aborted); controller.abort(); window.clearTimeout(timer); };
  }, [accountId, cursor, retry]);
  const changePage = (id: string | null) => { onChange(undefined); setCursor(id); };
  return <div className="mb-5 space-y-3">
    <label htmlFor="renewal-service" className="block font-semibold">Which service are you renewing?</label>
    {loading ? <p role="status" className="text-sm text-gray-300">Loading your linked services…</p> : error ? <div role="alert" className="space-y-2 text-sm text-amber-200"><p>{error}</p><button type="button" disabled={disabled} onClick={() => { onChange(undefined); setRetry(n => n + 1); }} className="min-h-12 rounded-xl border border-gray-600 px-4">Try again</button></div> : <>
      <select id="renewal-service" value={selected ?? ''} disabled={disabled || !services.length} onChange={e => onChange(e.target.value || undefined)} className="min-h-12 w-full min-w-0 rounded-xl border border-gray-600 bg-dark-200 p-3 text-white">
        <option value="">Choose your linked service</option>
        {services.map(service => <option key={service.customerId} value={service.customerId}>{service.username} · {service.connections} connection{service.connections === 1 ? '' : 's'}</option>)}
      </select>
      {!services.length && <p className="text-sm text-gray-300">No renewable service is linked on this page. <Link to="/support" className="text-primary underline">Get account help</Link> before paying.</p>}
      {(history.length > 0 || nextCursor) && <div className="flex flex-wrap gap-3">
        {history.length > 0 && <button type="button" disabled={disabled} className="min-h-12 rounded-xl border border-gray-600 px-4" onClick={() => { changePage(history[history.length - 1] ?? null); setHistory(previous => previous.slice(0, -1)); }}>Previous services</button>}
        {nextCursor && <button type="button" disabled={disabled} className="min-h-12 rounded-xl border border-gray-600 px-4" onClick={() => { setHistory(previous => [...previous, cursor]); changePage(nextCursor); }}>More services</button>}
      </div>}
      <p className="text-sm text-gray-300">Your selected plan and connection count will apply to this service’s renewal request.</p>
    </>}
  </div>;
}
