import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { readSupportTickets } from '../lib/support-tickets';
import type { SupportScope } from '../lib/support-tickets';
import { useSupportRead } from '../lib/useSupportRead';
import SupportTicketThread from './SupportTicketThread';

export default function SupportTicketWorkspace({ accountId }: { accountId: string }) {
  const [page, setPage] = useState(0), [selected, setSelected] = useState<string | null>(null);
  const load = useCallback((scope: SupportScope) => readSupportTickets(supabase, accountId, page, scope), [accountId, page]);
  const read = useSupportRead(`${accountId}:${page}`, load);
  if (selected) return <SupportTicketThread key={`${accountId}:${selected}`} accountId={accountId} ticketId={selected} onBack={() => { setSelected(null); void read.reload(); }} />;
  return <section aria-label="Your support tickets" className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-gray-400">Open a ticket to read the conversation.</p><button type="button" onClick={() => void read.reload()} disabled={read.status === 'loading'} className="min-h-12 rounded-xl border border-gray-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Refresh tickets</button></div>
    {read.status === 'loading' && <p role="status" className="text-sm text-gray-400">Loading your support tickets…</p>}
    {read.status !== 'loading' && read.status !== 'ready' && <p role="alert" className="rounded-xl border border-amber-500/30 p-4 text-sm text-amber-200">{read.status === 'changed' ? 'Your account changed. Sign in again to view your tickets.' : 'Your tickets could not be loaded. Refresh to try again.'}</p>}
    {read.status === 'ready' && <>
      {read.value.items.length ? <ul aria-label="Ticket directory" className="space-y-3">{read.value.items.map(ticket => <li key={ticket.id}><button type="button" onClick={() => setSelected(ticket.id)} className="w-full min-w-0 rounded-xl border border-gray-800 bg-dark-100 p-4 text-left hover:border-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <span className="block break-words font-semibold text-white">{ticket.subject}</span><span className="mt-2 block break-words text-sm text-gray-400">{ticket.status} · {ticket.category} · {new Date(ticket.createdAt).toLocaleDateString()}</span>
      </button></li>)}</ul> : <p className="rounded-xl border border-gray-800 bg-dark-100 p-5 text-gray-400">{page === 0 ? 'No support tickets yet.' : 'No tickets on this page. Return to the previous page or refresh the first page.'}</p>}
      <nav aria-label="Ticket pages" className="flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={page === 0} onClick={() => setPage(value => value - 1)} className="min-h-12 rounded-lg border border-gray-600 px-4 text-white disabled:opacity-50">Previous</button><span className="text-sm text-gray-400">Page {page + 1}</span><button type="button" disabled={!read.value.hasMore} onClick={() => setPage(value => value + 1)} className="min-h-12 rounded-lg border border-gray-600 px-4 text-white disabled:opacity-50">Next</button></nav>
      {page > 0 && <button type="button" onClick={() => setPage(0)} className="min-h-12 text-sm text-primary underline">Back to first page</button>}
    </>}
    <Link to="/support" className="inline-flex min-h-12 items-center text-sm text-primary underline">Other ways to get support</Link>
  </section>;
}
