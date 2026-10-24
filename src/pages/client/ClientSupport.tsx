import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useVerifiedWebsiteAccount } from '../../lib/useVerifiedWebsiteAccount';
import SupportTicketWorkspace from '../../components/SupportTicketWorkspace';

export default function ClientSupport() {
  const account = useVerifiedWebsiteAccount();
  return <div className="min-w-0 space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><MessageSquare className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" /><h1 className="text-2xl font-bold text-white sm:text-3xl">Support tickets</h1></div>{account.status === 'ready' && <Link to="/client/support/new" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-4 font-semibold text-white">New ticket</Link>}</header>
    {account.status === 'loading' && <p role="status" className="text-sm text-gray-400">Checking your website account…</p>}
    {account.status === 'signed_out' && <p className="text-sm text-gray-300"><Link to="/login" state={{ from: '/client/support' }} className="text-primary underline">Sign in to your website account</Link> to view your support tickets.</p>}
    {account.status === 'unconfirmed' && <p className="text-sm text-gray-300">Confirm your website email before viewing or replying to support tickets.</p>}
    {account.status === 'unavailable' && <section role="alert" className="rounded-xl border border-amber-500/30 p-4 text-sm text-amber-200"><p>Your account could not be checked. Please try again.</p><button type="button" onClick={() => void account.retry()} className="mt-3 min-h-12 rounded-xl border border-gray-600 px-4 font-semibold text-white">Try account check again</button></section>}
    {account.status === 'ready' && account.accountId && <SupportTicketWorkspace key={account.accountId} accountId={account.accountId} />}
  </div>;
}
