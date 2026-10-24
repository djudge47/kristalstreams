import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { readSupportThread, saveSupportReply, SupportFailure, type SupportScope } from '../lib/support-tickets';
import { useSupportRead } from '../lib/useSupportRead';

export default function SupportTicketThread({ accountId, ticketId, onBack }: { accountId: string; ticketId: string; onBack: () => void }) {
  const [page, setPage] = useState(0), [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false), [notice, setNotice] = useState<{ kind: 'saved' | 'error' | 'uncertain'; text: string } | null>(null);
  const active = useRef(false), writing = useRef<AbortController | null>(null), blocked = useRef(false);
  const deadline = useRef<number | undefined>();
  const load = useCallback((scope: SupportScope) => readSupportThread(supabase, accountId, ticketId, page, scope), [accountId, ticketId, page]);
  const read = useSupportRead(`${accountId}:${ticketId}:${page}`, load);
  const heldSnapshot = useRef<unknown>(null);
  useEffect(() => { active.current = true; return () => { active.current = false; writing.current?.abort(); writing.current = null; window.clearTimeout(deadline.current); }; }, []);
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!active.current || writing.current || blocked.current || read.status !== 'ready' || read.value.ticket.owner !== accountId || read.value.ticket.id !== ticketId) return;
    const controller = new AbortController(); writing.current = controller;
    const isCurrent = () => active.current && writing.current === controller;
    setSending(true); setNotice(null);
    const uncertain = () => { blocked.current = true; heldSnapshot.current = read.value; setNotice({ kind: 'uncertain', text: 'Your reply may have been saved. Refresh the conversation and check before starting another reply. It will not be sent again automatically.' }); };
    const timeout = window.setTimeout(() => { if (!isCurrent()) return; writing.current = null; controller.abort(); setSending(false); uncertain(); }, 20000); deadline.current = timeout;
    try {
      await saveSupportReply(supabase, accountId, ticketId, draft, { signal: controller.signal, isCurrent });
      if (!isCurrent()) return;
      setDraft(''); setNotice({ kind: 'saved', text: 'Reply saved in your ticket. This does not confirm email delivery.' });
      if (page === 0) void read.reload(); else setPage(0);
    } catch (error) {
      if (!isCurrent()) return;
      if (!(error instanceof SupportFailure) || error.code === 'uncertain') uncertain();
      else { if (error.code === 'changed') { setDraft(''); blocked.current = true; void read.reload(); } setNotice({ kind: 'error', text: error.code === 'invalid' ? 'Enter a reply of 1 to 4,000 characters.' : 'Your account or ticket could not be verified. Refresh the conversation before replying.' }); }
    } finally { window.clearTimeout(timeout); if (writing.current === controller) { writing.current = null; if (active.current) setSending(false); } }
  };
  const reviewed = blocked.current && read.status === 'ready' && read.value !== heldSnapshot.current;
  return <section aria-label="Ticket conversation" className="min-w-0 space-y-4">
    <div className="flex flex-wrap justify-between gap-3"><button type="button" disabled={sending} onClick={onBack} className="min-h-12 rounded-xl border border-gray-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Back to tickets</button><button type="button" disabled={sending || read.status === 'loading'} onClick={() => void read.reload()} className="min-h-12 rounded-xl border border-gray-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Refresh conversation</button></div>
    {read.status === 'loading' && <p role="status" className="text-sm text-gray-400">Loading this conversation…</p>}
    {read.status !== 'ready' && read.status !== 'loading' && <p role="alert" className="rounded-xl border border-amber-500/30 p-4 text-sm text-amber-200">{read.status === 'missing' ? 'This ticket is no longer available to your account.' : read.status === 'changed' ? 'Your account changed. Sign in again to view this conversation.' : 'This conversation could not be loaded. Refresh to try again.'}</p>}
    {read.status === 'ready' && <>
      <header className="min-w-0 rounded-xl border border-gray-800 bg-dark-100 p-5"><h2 className="break-words text-xl font-semibold text-white">{read.value.ticket.subject}</h2><p className="mt-2 break-words text-sm text-gray-400">{read.value.ticket.status} · {read.value.ticket.category}</p><p className="mt-4 whitespace-pre-wrap break-words text-sm text-gray-300">{read.value.ticket.description}</p></header>
      <p className="text-sm text-gray-400">{page === 0 ? 'Latest replies' : 'Earlier replies'} · Page {page + 1}. Replies on each page run from oldest to newest. Scroll within the replies to read this page.</p>
      {read.value.items.length ? <ol aria-label="Ticket replies" tabIndex={0} className="max-h-80 space-y-3 overflow-y-auto overscroll-contain rounded-lg pr-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{read.value.items.map(reply => <li key={reply.id} className="min-w-0 rounded-xl border border-gray-800 bg-dark-100 p-4"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className={reply.staff ? 'font-semibold text-primary' : 'font-semibold text-white'}>{reply.staff ? 'Support staff' : 'You'}</span><time className="text-gray-400" dateTime={reply.createdAt}>{new Date(reply.createdAt).toLocaleString()}</time></div><p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-300">{reply.message}</p>{reply.staff && reply.delivery !== 'not_requested' && <p className="mt-2 text-xs text-gray-400">{reply.delivery === 'sent' ? 'Email accepted for sending' : 'Saved in your ticket; email delivery is not confirmed'}</p>}</li>)}</ol> : <p className="rounded-xl border border-gray-800 p-4 text-sm text-gray-400">{page === 0 ? 'No replies yet.' : 'No replies on this page. Return to newer replies.'}</p>}
      <nav aria-label="Conversation pages" className="flex flex-wrap justify-between gap-3"><button type="button" disabled={sending || !read.value.hasMore} onClick={() => setPage(value => value + 1)} className="min-h-12 rounded-lg border border-gray-600 px-4 text-white disabled:opacity-50">Earlier replies</button><button type="button" disabled={sending || page === 0} onClick={() => setPage(value => value - 1)} className="min-h-12 rounded-lg border border-gray-600 px-4 text-white disabled:opacity-50">Newer replies</button></nav>
      <form onSubmit={event => void send(event)} className="space-y-3"><label htmlFor="customer-ticket-reply" className="block text-sm font-medium text-gray-300">Your reply</label><textarea id="customer-ticket-reply" value={draft} disabled={sending || blocked.current} maxLength={4000} rows={4} onChange={event => { setDraft(event.target.value); if (notice?.kind !== 'uncertain') setNotice(null); }} className="w-full min-w-0 resize-none rounded-lg border border-gray-700 bg-dark-200 px-4 py-3 text-white disabled:opacity-50" /><p className="text-sm text-gray-400">Saved in this ticket. An email notification is not promised.</p><button type="submit" disabled={sending || blocked.current || !draft.trim()} className="min-h-12 rounded-lg bg-primary px-6 py-2 font-semibold text-white disabled:opacity-50">{sending ? 'Saving reply…' : 'Save reply'}</button></form>
    </>}
    {notice && <p role={notice.kind === 'saved' ? 'status' : 'alert'} className={`text-sm ${notice.kind === 'saved' ? 'text-green-300' : 'text-amber-200'}`}>{notice.text}</p>}
    {reviewed && <button type="button" onClick={() => { blocked.current = false; heldSnapshot.current = null; setDraft(''); setNotice(null); }} className="min-h-12 rounded-xl border border-gray-600 px-4 text-sm font-semibold text-white">I checked the conversation — start a new reply</button>}
  </section>;
}
