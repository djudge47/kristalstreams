import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { restoreSessionAfterStripe } from '../lib/stripe';
import { readWebsitePlan } from '../lib/website-plan';
import type { SupportScope } from '../lib/support-tickets';
import { useSupportRead } from '../lib/useSupportRead';
import CustomerCrmService, { type CustomerServiceState } from './CustomerCrmService';

const date = (value: string | null) => value ? new Date(value).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not recorded';
export default function SubscriptionWorkspace({ accountId }: { accountId: string }) {
  const [revision, setRevision] = useState(0), [service, setService] = useState<CustomerServiceState | null>(null);
  const generation = useRef(0);
  const load = useCallback(async (scope: SupportScope) => {
    // Keep the existing checkout-return recovery; every resulting read still
    // verifies the exact owner captured by this workspace before dispatch.
    if (new URLSearchParams(window.location?.search ?? '').get('success') === 'true') await restoreSessionAfterStripe();
    return readWebsitePlan(supabase, accountId, scope);
  }, [accountId]);
  const profile = useSupportRead(`${accountId}:${revision}`, load);
  const serviceChanged = useCallback((next: CustomerServiceState) => { if (next.accountId === accountId && revision === generation.current) setService(next); }, [accountId, revision]);
  const showWebsite = service?.accountId === accountId && ['unlinked', 'hidden'].includes(service.status);
  const refresh = () => { generation.current += 1; setService(null); setRevision(generation.current); };
  return <div className="min-w-0 space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold text-white sm:text-3xl">Subscription Details</h1><button type="button" onClick={refresh} className="min-h-12 rounded-xl border border-gray-600 px-4 text-sm font-semibold text-white">Refresh subscription</button></header>
    <CustomerCrmService key={`${accountId}:${revision}`} accountId={accountId} onServiceStateChange={serviceChanged} />
    {showWebsite && <section aria-label="Saved website plan" className="min-w-0 rounded-xl border border-gray-800 bg-dark-100 p-5 sm:p-8">
      <h2 className="text-xl font-semibold text-white">Saved website plan</h2>
      <p className="mt-3 text-sm text-gray-300">This record describes website access. It does not confirm streaming activation, a received payment or service expiration. If you already paid, contact support before paying again.</p>
      {profile.status === 'loading' ? <p role="status" className="mt-4 text-sm text-gray-400">Loading your saved website plan…</p> : profile.status !== 'ready' ? <p role="alert" className="mt-4 text-sm text-amber-200">{profile.status === 'missing' ? 'Your website plan record was not found. This does not mean a streaming payment or service is missing.' : 'Your website plan could not be checked. Refresh to try again; this does not mean your streaming service is inactive.'}</p> : <>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-400">Website plan recorded</dt><dd className="mt-1 break-words capitalize text-white">{profile.value.tier?.trim() || 'Not recorded'}</dd></div><div><dt className="text-gray-400">Saved website status</dt><dd className="mt-1 break-words capitalize text-white">{profile.value.status?.trim() || 'Not recorded'}</dd></div><div><dt className="text-gray-400">Connections recorded for website access</dt><dd className="mt-1 text-white">{profile.value.connections ?? 'Not recorded'}</dd></div></dl>
        {profile.value.tier === 'demo' && <p className="mt-4 text-sm text-gray-300">A website demo record is not a paid streaming subscription.</p>}
        <h3 className="mt-6 font-semibold text-white">Website Plan Access Period</h3><p className="mt-2 text-sm text-gray-400">These dates describe the website record and do not confirm streaming-service expiration.</p>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-400">Website record updated</dt><dd className="mt-1 break-words text-white">{date(profile.value.updatedAt)}</dd></div><div><dt className="text-gray-400">Website access expires</dt><dd className="mt-1 break-words text-white">{date(profile.value.expiresAt)}</dd></div></dl>
      </>}
    </section>}
    {!service && <p role="status" className="text-sm text-gray-400">Checking this account’s streaming service before showing any website-plan fallback…</p>}
    <nav aria-label="Subscription help" className="flex flex-wrap gap-3"><Link to="/client/support/new" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-4 font-semibold text-white">Get subscription help</Link><Link to="/pricing" className="inline-flex min-h-12 items-center rounded-xl border border-gray-600 px-4 text-sm font-semibold text-white">View current plans</Link></nav>
  </div>;
}
