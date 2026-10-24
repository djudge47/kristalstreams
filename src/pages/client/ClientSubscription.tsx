import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useVerifiedWebsiteAccount } from '../../lib/useVerifiedWebsiteAccount';
import SubscriptionWorkspace from '../../components/SubscriptionWorkspace';

export default function ClientSubscription() {
  const account = useVerifiedWebsiteAccount();
  useEffect(() => { window.scrollTo?.(0, 0); }, []);
  if (account.status === 'ready' && account.accountId) return <SubscriptionWorkspace key={account.accountId} accountId={account.accountId} />;
  return <section className="min-w-0 space-y-4"><h1 className="text-2xl font-bold text-white sm:text-3xl">Subscription Details</h1>
    {account.status === 'loading' ? <p role="status" className="text-gray-400">Checking your website account…</p> : account.status === 'unavailable' ? <><p role="alert" className="text-amber-200">Your account could not be checked. Please try again.</p><button type="button" onClick={() => void account.retry()} className="min-h-12 rounded-xl border border-gray-600 px-4 font-semibold text-white">Try account check again</button></> : account.status === 'unconfirmed' ? <p className="text-gray-300">Confirm your website email before viewing service and payment records.</p> : <Link to="/login" state={{ from: '/client/subscription' }} className="inline-flex min-h-12 items-center text-primary underline">Sign in to your website account</Link>}
    <p><Link to="/support" className="inline-flex min-h-12 items-center text-primary underline">Get account help</Link></p>
  </section>;
}
