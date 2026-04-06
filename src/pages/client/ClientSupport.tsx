import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MessageSquare, Plus, Clock, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
}

interface TicketReply {
  id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
  user_id: string;
}

const ClientSupport: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchReplies(selectedTicket.id);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_replies')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data);
    } catch (err) {
      console.error('Error fetching replies:', err);
      setError('Failed to load replies');
    }
  };

  const handleNewTicket = () => {
    navigate('/client/support/new');
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: newMessage.trim(),
          is_staff: false
        });

      if (error) throw error;

      setNewMessage('');
      fetchReplies(selectedTicket.id);
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'closed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-500';
      case 'normal':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <MessageSquare className="text-primary w-8 h-8 mr-4" />
          <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
        </div>
        <button
          onClick={handleNewTicket}
          className="flex items-center bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Ticket
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-500">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Your Tickets</h2>
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`bg-dark-100 rounded-xl p-6 border transition-all duration-200 cursor-pointer ${
                  selectedTicket?.id === ticket.id
                    ? 'border-primary'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-medium text-white">{ticket.subject}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm border ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{ticket.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                  <span className={`flex items-center ${getPriorityColor(ticket.priority)}`}>
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {ticket.priority}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-dark-100 rounded-xl border border-gray-800">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No support tickets yet</p>
            </div>
          )}
        </div>

        {selectedTicket && (
          <div className="bg-dark-100 rounded-xl border border-gray-800 p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">{selectedTicket.subject}</h2>
                <span className={`inline-block px-3 py-1 rounded-full text-sm border ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
              </div>
              <p className="text-gray-400">{selectedTicket.description}</p>
            </div>

            <div className="space-y-4 mb-6">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-4 rounded-lg ${
                    reply.is_staff
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-dark-200 border border-gray-800'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {reply.is_staff && (
                      <span className="flex items-center text-primary text-sm font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Support Staff
                      </span>
                    )}
                    <span className="text-gray-500 text-sm ml-auto">
                      {new Date(reply.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300">{reply.message}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your reply..."
                className="w-full bg-dark-200 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                rows={4}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSendReply}
                  disabled={sending || !newMessage.trim()}
                  className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 disabled:bg-gray-700"
                >
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSupport;