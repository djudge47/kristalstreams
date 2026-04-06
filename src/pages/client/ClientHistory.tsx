import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { History, Play, Clock } from 'lucide-react';

interface StreamingSession {
  id: string;
  channel_id: string;
  started_at: string;
  ended_at: string;
  device_info: {
    type: string;
    name: string;
  };
}

const ClientHistory: React.FC = () => {
  const [sessions, setSessions] = useState<StreamingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error('No user found');

        const { data, error } = await supabase
          .from('streaming_sessions')
          .select('*')
          .eq('user_id', user.id)
          .not('ended_at', 'is', null)
          .order('started_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        setSessions(data);
      } catch (err) {
        console.error('Error loading history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    getHistory();
  }, []);

  const formatDuration = (start: string, end: string) => {
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-dark-200 rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-dark-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-8">
        <History className="text-primary w-8 h-8 mr-4" />
        <h1 className="text-3xl font-bold text-white">Streaming History</h1>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      ) : sessions.length > 0 ? (
        <div className="bg-dark-100 rounded-xl overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Channel</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Device</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Started</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-dark-200 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Play className="text-primary w-4 h-4 mr-2" />
                        <span className="text-white">{session.channel_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {session.device_info.name}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {new Date(session.started_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDuration(session.started_at, session.ended_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-dark-100 rounded-xl p-8 border border-gray-800 text-center">
          <History className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Streaming History</h2>
          <p className="text-gray-400">
            You haven't watched any content yet. Start streaming to see your history here.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientHistory;