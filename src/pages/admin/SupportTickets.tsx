import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, RefreshCw, Search, TicketCheck, X } from 'lucide-react';

type SupportTicket = {
  id?: string;
  source?: string;
  customer_name?: string;
  customer_email?: string;
  user_name?: string;
  user_email?: string;
  from_name?: string;
  from_email?: string;
  subject?: string;
  message?: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  reply_to?: string;
  resend_email_id?: string;
  created_at?: string;
  updated_at?: string;
};

const getTicketName = (ticket: SupportTicket) =>
  ticket.customer_name || ticket.user_name || ticket.from_name || 'Website Visitor';

const getTicketEmail = (ticket: SupportTicket) =>
  ticket.customer_email || ticket.user_email || ticket.from_email || ticket.reply_to || '';

const getTicketMessage = (ticket: SupportTicket) =>
  ticket.message || ticket.description || '';

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTickets(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load support tickets.';
      setTickets([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string | undefined, status: string) => {
    if (!id) return;

    const { error: updateError } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setTickets(previous => previous.map(ticket => ticket.id === id ? { ...ticket, status } : ticket));
    if (selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, status });
  };

  const filtered = useMemo(() => tickets.filter(ticket => {
    const searchText = [
      ticket.subject,
      getTicketMessage(ticket),
      getTicketName(ticket),
      getTicketEmail(ticket),
      ticket.status,
      ticket.category,
      ticket.priority,
      ticket.source,
    ].join(' ').toLowerCase();

    const matchSearch = searchText.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || (ticket.status || 'open') === statusFilter;
    return matchSearch && matchStatus;
  }), [tickets, search, statusFilter]);

  const counts = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(ticket => (ticket.status || 'open') === 'open').length,
    pending: tickets.filter(ticket => ticket.status === 'pending').length,
    resolved: tickets.filter(ticket => ticket.status === 'resolved').length,
  }), [tickets]);

  const statusColors: Record<string, string> = {
    open: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/60',
    closed: 'bg-gray-700 text-gray-300 border-gray-600',
    resolved: 'bg-green-900/50 text-green-300 border-green-700/60',
    pending: 'bg-blue-900/50 text-blue-300 border-blue-700/60',
    unread: 'bg-red-900/50 text-red-300 border-red-700/60',
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Inbox</h1>
          <p className="text-gray-400 text-sm mt-1">Contact form messages saved from the website.</p>
        </div>
        <button
          onClick={fetchTickets}
          className="inline-flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Total</p>
          <p className="text-white text-2xl font-bold mt-1">{counts.total}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Open</p>
          <p className="text-yellow-300 text-2xl font-bold mt-1">{counts.open}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Pending</p>
          <p className="text-blue-300 text-2xl font-bold mt-1">{counts.pending}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Resolved</p>
          <p className="text-green-300 text-2xl font-bold mt-1">{counts.resolved}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-200 rounded-xl p-4 mb-6">
          <p className="font-medium">Support inbox could not load.</p>
          <p className="text-sm mt-1 text-red-300">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6 lg:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search by name, email, subject, or message..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedTicket.subject || 'Ticket Details'}</h2>
                <p className="text-gray-400 text-sm mt-1">{getTicketName(selectedTicket)} • {getTicketEmail(selectedTicket) || 'No email'}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 text-sm">Status</span>
                  <select
                    value={selectedTicket.status || 'open'}
                    onChange={event => updateStatus(selectedTicket.id, event.target.value)}
                    className="mt-1 w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Category</span>
                  <p className="text-white mt-2">{selectedTicket.category || 'Website Contact'}</p>
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Message</span>
                <p className="text-white mt-2 bg-gray-700 rounded-lg p-4 whitespace-pre-wrap leading-relaxed">{getTicketMessage(selectedTicket) || '—'}</p>
              </div>

              {getTicketEmail(selectedTicket) && (
                <a
                  href={`mailto:${getTicketEmail(selectedTicket)}?subject=Re: ${encodeURIComponent(selectedTicket.subject || 'Kristal Streams Support')}`}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Mail size={16} />
                  Reply by Email
                </a>
              )}

              <div className="text-gray-500 text-xs border-t border-gray-700 pt-4 space-y-1">
                <p>Created: {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : '—'}</p>
                {selectedTicket.resend_email_id && <p>Resend ID: {selectedTicket.resend_email_id}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
          <TicketCheck size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-300 font-medium">No tickets found</p>
          <p className="text-gray-500 text-sm mt-1">New website contact messages will appear here after the function is redeployed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket, index) => {
            const email = getTicketEmail(ticket);
            const status = ticket.status || 'open';

            return (
              <div
                key={ticket.id || index}
                onClick={() => setSelectedTicket(ticket)}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-red-600/60 cursor-pointer transition-colors"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-white font-medium">{ticket.subject || 'No Subject'}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[status] || statusColors.open}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{getTicketName(ticket)}{email ? ` • ${email}` : ''}</p>
                    <p className="text-gray-500 text-sm mt-2 line-clamp-1">{getTicketMessage(ticket)}</p>
                  </div>
                  <div className="text-gray-500 text-xs shrink-0">
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
