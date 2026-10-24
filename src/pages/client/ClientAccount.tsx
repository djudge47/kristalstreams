import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import AccountProfileEditor from '../../components/AccountProfileEditor';
import { useVerifiedWebsiteAccount } from '../../lib/useVerifiedWebsiteAccount';

export default function ClientAccount() {
  const account = useVerifiedWebsiteAccount();
  return <div className="min-w-0 space-y-5">
    <header className="flex items-center gap-3"><User className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" /><h1 className="text-2xl font-bold text-white sm:text-3xl">Account information</h1></header>
    {account.status === 'loading' && <p role="status" className="text-sm text-gray-400">Checking your website account…</p>}
    {account.status === 'unavailable' && <section role="alert" className="rounded-xl border border-amber-500/30 p-4 text-sm text-amber-200"><p>Your account could not be checked. Please try again.</p><button type="button" onClick={() => void account.retry()} className="mt-3 min-h-12 rounded-xl border border-gray-600 px-4 font-semibold text-white">Try account check again</button></section>}
    {account.status === 'signed_out' && <p className="text-sm text-gray-300"><Link to="/login" state={{ from: '/client/account' }} className="text-primary underline">Sign in to your website account</Link> to view your account details.</p>}
    {account.status === 'unconfirmed' && <p className="text-sm text-gray-300">Confirm your website email before viewing or editing your account details.</p>}
    {account.status === 'ready' && account.accountId && <AccountProfileEditor key={account.accountId} accountId={account.accountId} />}
    <Link to="/support" className="inline-flex min-h-12 items-center rounded-xl border border-gray-600 px-5 py-2 font-semibold text-white">Get account help</Link>
  </div>;
}
