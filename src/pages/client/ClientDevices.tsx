import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Monitor, Smartphone, Laptop, Tv, X } from 'lucide-react';

interface StreamingSession {
  id: string;
  user_id: string;
  device_info: {
    type: string;
    name: string;
    os?: string;
    browser?: string;
  };
  started_at: string;
  ended_at: string | null;
}

const ClientDevices: React.FC = () => {
  const [sessions, setSessions] = useState<StreamingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSessions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error('No user found');

        const { data, error } = await supabase
          .from('streaming_sessions')
          .select('*')
          .eq('user_id', user.id)
          .is('ended_at', null)
          .order('started_at', { ascending: false });

        if (error) throw error;

        setSessions(data);
      } catch (err) {
        console.error('Error loading sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    getSessions();
  }, []);

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-6 h-6" />;
      case 'desktop':
        return <Laptop className="w-6 h-6" />;
      case 'tv':
        return <Tv className="w-6 h-6" />;
      default:
        return <Monitor className="w-6 h-6" />;
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('streaming_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (err) {
      console.error('Error ending session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-dark-200 rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-dark-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-8">
        <Monitor className="text-primary w-8 h-8 mr-4" />
        <h1 className="text-3xl font-bold text-white">Active Devices</h1>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      ) : sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-dark-100 rounded-xl p-6 border border-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-dark-200 p-3 rounded-lg mr-4">
                    {getDeviceIcon(session.device_info.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">
                      {session.device_info.name}
                    </h3>
                    <div className="text-sm text-gray-400">
                      {session.device_info.os && (
                        <span>{session.device_info.os}</span>
                      )}
                      {session.device_info.browser && (
                        <span> • {session.device_info.browser}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleEndSession(session.id)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                  title="End session"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-100 rounded-xl p-8 border border-gray-800 text-center">
          <Monitor className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Active Devices</h2>
          <p className="text-gray-400">
            You don't have any active streaming sessions at the moment.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientDevices;