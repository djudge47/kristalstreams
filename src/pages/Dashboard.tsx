import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { subscribeToTickets, getUnreadTicketCount, useNotificationStore } from '../lib/api';
import VideoPlayer from '../components/VideoPlayer';
import {
  User,
  CreditCard,
  Monitor,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  Bell,
  Play,
  Film,
  Settings,
  Search,
  Tv
} from 'lucide-react';

interface Profile {
  email: string;
  full_name: string | null;
  subscription_tier: string;
  subscription_status: string;
  connections_allowed: number;
  active_connections: number;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);
  const [channelSearch, setChannelSearch] = useState('');
  const [channelCategory, setChannelCategory] = useState('all');
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    window.scrollTo(0, 0);

    const getProfile = async () => {
      try {
        // Wait for auth to settle (fixes Google OAuth double-entry)
        let user = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data, error: authError } = await supabase.auth.getUser();
          if (!authError && data.user) {
            user = data.user;
            break;
          }
          // Wait a moment for auth to settle
          await new Promise(r => setTimeout(r, 500));
        }
        
        if (!user) {
          if (mounted) navigate('/login');
          return;
        }

        // Subscribe to ticket updates
        unsubscribe = subscribeToTickets(user.id);
        await getUnreadTicketCount(user.id);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select()
          .eq('id', user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const newProfile = {
              id: user.id,
              email: user.email,
              full_name: null,
              subscription_tier: 'basic',
              subscription_status: 'inactive',
              connections_allowed: 1,
              active_connections: 0
            };

            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single();

            if (createError) throw createError;
            if (mounted) setProfile(createdProfile);
          } else {
            throw profileError;
          }
        } else if (mounted) {
          setProfile(profile);
        }

        // Fetch tickets
        const { data: ticketData, error: ticketError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ticketError) throw ticketError;
        if (mounted) setTickets(ticketData);

      } catch (err) {
        console.error('Error in dashboard:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getProfile();
    return () => { 
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (selectedChannel?.stream_url) {
      setResolvedStreamUrl(null);
      fetch('/api/resolve-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: selectedChannel.stream_url }),
      })
        .then(r => r.json())
        .then(data => setResolvedStreamUrl(data.url))
        .catch(() => setResolvedStreamUrl(selectedChannel.stream_url.replace('http://', 'https://').replace(':80/', '/')));
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (showPlayer && channels.length === 0) {
      const fetchChannels = async () => {
        try {
          const { data, error: fetchError } = await supabase.from('channels').select('*').order('name');
          console.log('Channels fetch result:', { data, error: fetchError });
          if (fetchError) {
            console.error('Channel fetch error:', fetchError);
            return;
          }
          if (data && data.length > 0) {
            setChannels(data);
            setSelectedChannel(data[0]);
          }
        } catch (err) {
          console.error('Channel fetch exception:', err);
        }
      };
      fetchChannels();
    }
  }, [showPlayer]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-500/10 text-green-500';
      case 'closed':
        return 'bg-gray-500/10 text-gray-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-blue-500/10 text-blue-500';
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
      <div className="min-h-screen py-12 bg-dark-300">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-dark-200 rounded w-1/4"></div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-dark-200 rounded-xl"></div>
                ))}
              </div>
              <div className="h-64 bg-dark-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12 bg-dark-300">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Dashboard</h2>
            <p className="text-gray-400 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen py-12 bg-dark-300">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <User className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Profile Not Found</h2>
            <p className="text-gray-400 mb-8">We couldn't find your profile information.</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-dark-300">
      {showPlayer && (
        <div className="fixed inset-0 z-[9999] bg-black flex">
          {/* Channel Sidebar */}
          <div className="w-64 md:w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">Channels</h2>
                <button onClick={() => setShowPlayer(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" value={channelSearch} onChange={e => setChannelSearch(e.target.value)}
                  placeholder="Search channels..." className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm" />
              </div>
              {channels.length > 0 && (
                <select value={channelCategory} onChange={e => setChannelCategory(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="all">All Categories</option>
                  {[...new Set(channels.map(c => c.category).filter(Boolean))].sort().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {channels.length === 0 ? (
                <div className="p-4 text-center">
                  <Tv size={32} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-gray-400 text-sm">No channels available</p>
                  <p className="text-gray-500 text-xs mt-1">Add channels in the admin panel</p>
                </div>
              ) : (
                channels
                  .filter(c => {
                    const matchSearch = c.name?.toLowerCase().includes(channelSearch.toLowerCase());
                    const matchCat = channelCategory === 'all' || c.category === channelCategory;
                    return matchSearch && matchCat;
                  })
                  .map(channel => (
                    <button key={channel.id} onClick={() => setSelectedChannel(channel)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                        selectedChannel?.id === channel.id ? 'bg-red-600/20 border-l-2 border-red-500' : 'hover:bg-gray-800'
                      }`}>
                      {channel.logo_url ? (
                        <img src={channel.logo_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <Tv size={14} className="text-gray-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate">{channel.name}</p>
                        {channel.category && <p className="text-gray-500 text-xs truncate">{channel.category}</p>}
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* Video Player */}
          <div className="flex-1 flex items-center justify-center p-4">
            {selectedChannel ? (
              <div className="w-full max-w-7xl">
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="text-white text-xl font-semibold">{selectedChannel.name}</h3>
                  {selectedChannel.category && <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">{selectedChannel.category}</span>}
                </div>
                <VideoPlayer
                  src={resolvedStreamUrl || ''}
                  title={selectedChannel.name}
                  autoplay={true}
                />
              </div>
            ) : (
              <div className="text-center">
                <Tv size={64} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">Select a channel to start watching</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <div className="flex items-center space-x-4">
              {unreadCount > 0 && (
                <div className="relative">
                  <Bell className="w-6 h-6 text-primary animate-pulse" />
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                </div>
              )}
              <button
                onClick={() => setShowPlayer(true)}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Live TV
              </button>
              <button
                onClick={() => navigate('/client/support/new')}
                className="flex items-center bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Support Ticket
              </button>
              {profile.email === 'djudge47@gmail.com' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Admin Panel
                </button>
              )}
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Account Status */}
            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center mb-4">
                <User className="text-primary w-6 h-6 mr-3" />
                <h2 className="text-xl font-semibold text-white">Account</h2>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400">{profile.email}</p>
                <p className="text-gray-400">{profile.full_name || 'Name not set'}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  profile.subscription_status === 'active' 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {profile.subscription_status}
                </span>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center mb-4">
                <CreditCard className="text-primary w-6 h-6 mr-3" />
                <h2 className="text-xl font-semibold text-white">Subscription</h2>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400">Plan: {profile.subscription_tier}</p>
                <div className="flex items-center text-gray-400">
                  <Monitor className="w-4 h-4 mr-2" />
                  {profile.active_connections} / {profile.connections_allowed} devices
                </div>
              </div>
            </div>

            {/* Support Status */}
            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center mb-4">
                <MessageSquare className="text-primary w-6 h-6 mr-3" />
                <h2 className="text-xl font-semibold text-white">Support</h2>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400">{tickets.length} Active Tickets</p>
                <button
                  onClick={() => navigate('/client/support')}
                  className="text-primary hover:text-red-700 transition-colors duration-200"
                >
                  View Support History
                </button>
              </div>
            </div>
          </div>

          {/* Recent Support Tickets */}
          <div className="bg-dark-100 rounded-xl border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Recent Support Tickets</h2>
            </div>
            <div className="overflow-x-auto">
              {tickets.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="bg-dark-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Subject</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Priority</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {tickets.map((ticket) => (
                      <tr 
                        key={ticket.id}
                        className="hover:bg-dark-200 transition-colors duration-200 cursor-pointer"
                        onClick={() => navigate('/client/support')}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 text-primary mr-2" />
                            <span className="text-white">{ticket.subject}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status === 'open' ? (
                              <Clock className="w-3 h-3 mr-1" />
                            ) : (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No support tickets yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;