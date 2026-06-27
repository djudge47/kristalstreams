import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, TicketCheck, X } from 'lucide-react';

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      setTickets(data || []);
    } catch { setTickets([]); }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('support_tickets').update({ status }).eq('id', id);
    fetchTickets();
    if (selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, status });
  };

  const filtered = tickets.filter(t => {
    const matchSearch = JSON.stringify(t).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = {
    open: 'bg-yellow-900/50 text-yellow-400',
    closed: 'bg-gray-700 text-gray-400',
    resolved: 'bg-green-900/50 text-green-400',
    pending: 'bg-blue-900/50 text-blue-400',
    unread: 'bg-red-900/50 text-red-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <p className="text-gray-400">{tickets.length} total</p>
      </div>
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">{selectedTicket.subject || 'Ticket Details'}</h2>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div><span className="text-gray-400 text-sm">Status:</span>
                <select value={selectedTicket.status || 'open'} onChange={e => updateStatus(selectedTicket.id, e.target.value)}
                  className="ml-2 bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm">
                  <option value="open">Open</option><option value="pending">Pending</option>
                  <option value="resolved">Resolved</option><option value="closed">Closed</option>
                </select>
              </div>
              <div><span className="text-gray-400 text-sm">Message:</span>
                <p className="text-white mt-1 bg-gray-700 rounded-lg p-4">{selectedTicket.message || selectedTicket.description || '—'}</p>
              </div>
              <div className="text-gray-500 text-xs">Created: {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : '—'}</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
          <TicketCheck size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t, i) => (
            <div key={t.id || i} onClick={() => setSelectedTicket(t)}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{t.subject || 'No Subject'}</h3>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-1">{t.message || t.description || ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[t.status] || statusColors.open}`}>
                    {t.status || 'open'}
                  </span>
                  <span className="text-gray-500 text-xs">{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default SupportTickets;
