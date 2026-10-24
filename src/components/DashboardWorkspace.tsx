import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { loadAccountProfile, ProfileFailure } from '../lib/account-profile';
import { readDashboardTickets, SupportFailure, type SupportScope } from '../lib/support-tickets';
import { useSupportRead } from '../lib/useSupportRead';
import CustomerSetupStatus from './CustomerSetupStatus';
import CustomerCrmService from './CustomerCrmService';
import StreamingLoginHandoff from './StreamingLoginHandoff';
import AdminShortcuts from './AdminShortcuts';
import PwaInstallBanner from './PwaInstallBanner';
import InstallPrompt from './InstallPrompt';

export default function DashboardWorkspace({ accountId }: { accountId: string }) {
  const load = useCallback(async (scope: SupportScope) => {
    try { return await loadAccountProfile(supabase, accountId, scope); }
    catch (error) { throw new SupportFailure(error instanceof ProfileFailure && (error.code === 'missing' || error.code === 'changed') ? error.code : 'unavailable'); }
  }, [accountId]);
  const account = useSupportRead(accountId, load);
  const isAdmin = account.status === 'ready' && account.value.accountId === accountId && account.value.email.toLowerCase() === 'djudge47@gmail.com';
  return <>
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-bold text-white sm:text-3xl">Dashboard</h1><Link to="/client/support/new" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-4 font-semibold text-white">New Support Ticket</Link></header>
    {isAdmin && <AdminShortcuts />}
    <CustomerSetupStatus key={accountId} accountId={accountId} />
    <CustomerCrmService key={`crm-${accountId}`} accountId={accountId} />
    <StreamingLoginHandoff key={`streaming-login-${accountId}`} accountId={accountId} />
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      <section aria-label="Website account summary" className="min-w-0 rounded-xl border border-gray-800 bg-dark-100 p-6"><h2 className="mb-4 text-xl font-semibold text-white">Your website account</h2>
        {account.status === 'loading' ? <p role="status" className="text-sm text-gray-400">Loading your account details…</p> : account.status === 'ready' ? <><p className="break-all text-gray-300">{account.value.email}</p><p className="mt-2 break-words text-gray-400">{account.value.fullName || 'Name not set'}</p></> : <p role="alert" className="text-sm text-amber-200">{account.status === 'missing' ? 'Your website profile was not found. Contact support for help.' : 'Your account details could not be loaded. Other dashboard sections remain available.'}</p>}
        <div className="mt-4 flex flex-wrap gap-3"><Link to="/client/account" className="inline-flex min-h-12 items-center text-sm text-primary underline">Manage my account</Link><button type="button" disabled={account.status === 'loading'} onClick={() => void account.reload()} className="min-h-12 text-sm text-primary underline disabled:opacity-50">Refresh account</button></div>
      </section>
      <section className="min-w-0 rounded-xl border border-gray-800 bg-dark-100 p-6"><h2 className="mb-4 text-xl font-semibold text-white">Service &amp; payment records</h2><p className="text-sm text-gray-300">See your linked streaming package, connection allowance, service expiration and received payments. Your website sign-in and streaming player login are separate.</p><Link to="/client/subscription" className="mt-4 inline-flex min-h-12 items-center text-sm text-primary underline">View service &amp; payment records</Link></section>
    </div>
    <section aria-labelledby="streaming-setup-heading" className="mb-8 rounded-xl border border-gray-800 bg-dark-100 p-6"><h2 id="streaming-setup-heading" className="mb-3 text-xl font-semibold text-white">Your streaming setup</h2><p className="text-sm text-gray-300">Use the streaming login and device instructions supplied separately by our team. If they are missing, open a support ticket with your trial or order reference. A recorded payment alone does not confirm streaming activation.</p><div className="mt-5 flex flex-col flex-wrap gap-3 sm:flex-row"><Link to="/support/getting-started" className="inline-flex min-h-12 items-center rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white">Getting Started Guide</Link><Link to="/download-app" className="inline-flex min-h-12 items-center rounded-lg border border-gray-700 px-4 py-3 text-sm font-medium text-gray-200">Apps &amp; device setup</Link><Link to="/client/support/new" state={{ setupHelp: true }} className="inline-flex min-h-12 items-center rounded-lg border border-gray-700 px-4 py-3 text-sm font-medium text-gray-200">Get Setup Help</Link></div></section>
    <PwaInstallBanner />
    <DashboardTicketSummary accountId={accountId} />
    <InstallPrompt />
  </>;
}

export function DashboardTicketSummary({ accountId }: { accountId: string }) {
  const load = useCallback((scope: SupportScope) => readDashboardTickets(supabase, accountId, scope), [accountId]);
  const read = useSupportRead(accountId, load);
  return <section aria-labelledby="dashboard-tickets-heading" className="min-w-0 rounded-xl border border-gray-800 bg-dark-100 p-5 sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 id="dashboard-tickets-heading" className="text-xl font-semibold text-white">Recent Support Tickets</h2><button type="button" disabled={read.status === 'loading'} onClick={() => void read.reload()} className="min-h-12 rounded-xl border border-gray-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Refresh tickets</button></div>
    {read.status === 'loading' ? <p role="status" className="text-sm text-gray-400">Loading your support summary…</p> : read.status !== 'ready' ? <p role="alert" className="text-sm text-amber-200">Your support summary could not be loaded. Refresh to try again, or open your support tickets.</p> : <>
      <p className="mb-4 text-sm text-gray-300">Active support tickets: <strong className="text-white">{read.value.activeCount}</strong></p>
      {read.value.tickets.length ? <ul aria-label="Recent support tickets" className="space-y-3">{read.value.tickets.map(ticket => <li key={ticket.id}><Link to="/client/support" state={{ ticketId: ticket.id }} className="block min-h-12 min-w-0 rounded-xl border border-gray-700 bg-dark-200 p-4 hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><span className="block break-words font-semibold text-white">{ticket.subject}</span><span className="mt-2 block break-words text-sm text-gray-400">{ticket.status} · {ticket.priority} · {new Date(ticket.createdAt).toLocaleDateString()}</span></Link></li>)}</ul> : <p className="text-sm text-gray-400">No support tickets yet.</p>}
    </>}
    <Link to="/client/support" className="mt-4 inline-flex min-h-12 items-center text-sm text-primary underline">View all support tickets</Link>
  </section>;
}
