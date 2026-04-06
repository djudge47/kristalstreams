import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MessageSquare, AlertCircle } from 'lucide-react';

const categories = [
  'Technical Issue',
  'Billing',
  'Account',
  'Streaming',
  'Content',
  'Other'
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' }
];

const NewTicket: React.FC = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
          status: 'open'
        });

      if (error) throw error;

      navigate('/client/support');
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-8">
        <MessageSquare className="text-primary w-8 h-8 mr-4" />
        <h1 className="text-3xl font-bold text-white">New Support Ticket</h1>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start">
              <AlertCircle className="text-red-500 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-500">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-dark-200 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-dark-200 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-dark-200 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full bg-dark-200 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary resize-none"
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/client/support')}
              className="px-6 py-2 border border-gray-800 rounded-lg text-gray-300 hover:bg-dark-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 disabled:bg-gray-700"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTicket;