import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useVerifiedWebsiteAccount } from '../lib/useVerifiedWebsiteAccount';
import DashboardWorkspace from '../components/DashboardWorkspace';

export default function Dashboard() {
  const account = useVerifiedWebsiteAccount();
  useEffect(() => { window.scrollTo?.(0, 0); }, []);
  return <div className="min-h-screen bg-dark-300 py-32"><div className="container mx-auto px-4"><div className="mx-auto min-w-0 max-w-6xl">
    {account.status === 'ready' && account.accountId ? <DashboardWorkspace key={account.accountId} accountId={account.accountId} /> : <section className="space-y-4"><h1 className="text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
      {account.status === 'loading' ? <p role="status" className="text-gray-400">Checking your website account…</p> : account.status === 'unavailable' ? <><p role="alert" className="text-amber-200">Your account could not be checked. Please try again.</p><button type="button" onClick={() => void account.retry()} className="min-h-12 rounded-xl border border-gray-600 px-4 font-semibold text-white">Try account check again</button></> : account.status === 'unconfirmed' ? <p className="text-gray-300">Confirm your website email before viewing your dashboard.</p> : <Link to="/login" state={{ from: '/dashboard' }} className="inline-flex min-h-12 items-center text-primary underline">Sign in to your website account</Link>}
      <p><Link to="/support" className="inline-flex min-h-12 items-center text-primary underline">Get account help</Link></p>
    </section>}
  </div></div></div>;
}
