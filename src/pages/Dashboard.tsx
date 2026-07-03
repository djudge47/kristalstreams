import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { subscribeToTickets, getUnreadTicketCount, useNotificationStore } from '../lib/api';
import InstallPrompt from '../components/InstallPrompt';
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
  Film,
  Upload,
  Shield,
  Download,
  Smartphone,
  Wifi,
} from 'lucide-react';

interface Profile {
  email: string;
  full_name: string | null;
  subscription_tier: string;
  subscription_status: string;
  connections_allowed: number;
  active_connections: number;
  is_admin: boolean | null;
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
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    window.scrollTo(0, 0);

    const getProfile = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        if (!user) {
          navigate('/login');
          return;
        }

        // Subscribe to ticket updates
        unsubscribe = subscribeToTickets(user.id);
        await getUnreadTicketCount(user.id).catch(() => {});

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, subscription_tier, subscription_status, connections_allowed, active_connections, is_admin')
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
          console.log('[Dashboard] profile loaded:', profile);
          setProfile(profile);
        }

        // Fetch tickets
        const { data: ticketData, error: ticketError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ticketError) throw ticketError;
        if (mounted) setTickets(ticketData ?? []);

      } catch (err: unknown) {
        console.error('Error in dashboard:', err);
        if (mounted) {
          const msg = err instanceof Error
            ? err.message
            : (typeof err === 'object' && err !== null && 'message' in err)
              ? String((err as { message: unknown }).message)
              : JSON.stringify(err);
          setError(msg || 'An unexpected error occurred');
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
      <div className="min-h-screen py-32 bg-dark-300">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-dark-200 rounded w-1/4"></div>
              <div className="grid md:grid-cols-3 gap-6">
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
      <div className="min-h-screen py-32 bg-dark-300">
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
      <div className="min-h-screen py-32 bg-dark-300">
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
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {unreadCount > 0 && (
                <div className="relative">
                  <Bell className="w-6 h-6 text-primary animate-pulse" />
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                </div>
              )}
              <button
                onClick={() => navigate('/client/import')}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Import </span>Channels
              </button>
              <button
                onClick={() => navigate('/client/support/new')}
                className="flex items-center bg-primary hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">New </span>Support Ticket
              </button>
            </div>
          </div>

          {/* Admin toolbar */}
          {profile?.is_admin === true && (
            <div className="flex flex-wrap items-center gap-2 bg-amber-600/10 border border-amber-600/30 rounded-xl px-4 py-3 mb-6">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-amber-400 text-sm font-medium mr-2">Admin</span>
              {[
                { label: 'Customers', path: '/admin/customers' },
                { label: 'Tickets', path: '/admin/tickets' },
                { label: 'Channels', path: '/admin/channels' },
                { label: 'Analytics', path: '/admin/analytics' },
                { label: 'Slider', path: '/admin/slider' },
                { label: 'Demo Reel', path: '/admin/demo-reel' },
                { label: 'Schedule', path: '/admin/schedule' },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="text-xs bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 hover:text-amber-100 border border-amber-600/30 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
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
                <p className="text-gray-400">Plan: <span className="text-white capitalize">{profile.subscription_tier}</span></p>
                <div className="flex items-center text-gray-400">
                  <Monitor className="w-4 h-4 mr-2" />
                  {profile.active_connections} / {profile.connections_allowed} devices
                </div>
                <button
                  onClick={() => navigate('/pricing')}
                  className="mt-2 text-primary hover:text-red-400 transition-colors duration-200 text-sm font-medium"
                >
                  View Plans
                </button>
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

          {/* PWA Install Banner */}
          <PwaInstallBanner />

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
      <InstallPrompt />
    </div>
  );
};

const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled || dismissed) return null;

  return (
    <div className="bg-dark-100 rounded-xl border border-gray-800 p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/20 p-3 rounded-xl flex-shrink-0">
          <Smartphone className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-lg mb-1">Install Kristal Streams App</h3>
          <p className="text-gray-400 text-sm mb-4">
            Get the full app experience — launch from your home screen, access content offline, and receive notifications.
          </p>
          <div className="flex flex-wrap gap-4 mb-4">
            {[
              { icon: Download, label: 'Home screen shortcut' },
              { icon: Wifi, label: 'Works offline' },
              { icon: Bell, label: 'Push notifications' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-gray-300">
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>
          {isIOS ? (
            <div className="bg-dark-200 rounded-lg p-4 text-sm text-gray-300">
              <p className="font-semibold text-white mb-2">Install on iOS:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Tap the Share button (square with arrow up)</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
          ) : (
            <div className="flex gap-3">
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="bg-primary hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Install App
                </button>
              )}
              <button
                onClick={() => setDismissed(true)}
                className="text-gray-400 hover:text-white px-5 py-2.5 rounded-lg border border-gray-700 hover:border-gray-500 font-medium transition-colors text-sm"
              >
                Not Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
