import { Link } from 'react-router-dom';
import { Monitor } from 'lucide-react';
import CustomerCrmService from '../../components/CustomerCrmService';
import { useVerifiedWebsiteAccount } from '../../lib/useVerifiedWebsiteAccount';

export default function ClientDevices() {
  const account = useVerifiedWebsiteAccount();
  return <div className="min-w-0 space-y-5">
    <header className="flex items-center gap-3"><Monitor className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" /><h1 className="text-2xl font-bold text-white sm:text-3xl">Devices &amp; connections</h1></header>
    <section aria-labelledby="device-activity-heading" className="rounded-2xl border border-gray-700 bg-dark-100 p-5 sm:p-7">
      <h2 id="device-activity-heading" className="text-xl font-semibold text-white">Live device activity is unavailable</h2>
      <p className="mt-3 text-sm leading-6 text-gray-300">Live activity for your ONN, phone and other streaming players is not available on this website.</p>
      <p className="mt-3 text-sm leading-6 text-gray-400">This page cannot show who is watching or disconnect a streaming player. Use your player to stop playback, or contact support if you suspect someone else is using your service.</p>
    </section>
    {account.status === 'loading' && <p role="status" className="text-sm text-gray-400">Checking your website account…</p>}
    {account.status === 'unavailable' && <div role="alert" className="rounded-xl border border-amber-500/30 p-4 text-sm text-amber-200"><p>Your account could not be checked. Your connection allowance is unavailable.</p><button type="button" onClick={() => void account.retry()} className="mt-3 min-h-12 rounded-xl border border-gray-600 px-4 font-semibold text-white">Try account check again</button></div>}
    {account.status === 'unconfirmed' && <p className="text-sm text-gray-300">Confirm your website email before viewing your saved connection allowance.</p>}
    {account.status === 'signed_out' && <p className="text-sm text-gray-300"><Link to="/login" state={{ from: '/client/devices' }} className="text-primary underline">Sign in to your website account</Link> to check your saved connection allowance.</p>}
    {account.status === 'ready' && account.accountId && <CustomerCrmService key={account.accountId} accountId={account.accountId} view="connections" />}
    <nav aria-label="Device help" className="flex flex-wrap gap-3">
      <Link to="/client/support/new" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 py-2 font-semibold text-white">Get device help</Link>
      <Link to="/support/devices" className="inline-flex min-h-12 items-center rounded-xl border border-gray-600 px-5 py-2 font-semibold text-white">Device setup guides</Link>
    </nav>
  </div>;
}
