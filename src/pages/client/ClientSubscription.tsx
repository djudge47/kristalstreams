import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, Clock, CreditCard, Monitor, Package, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { restoreSessionAfterStripe } from '../../lib/stripe';

interface ProfileSubscription {
  id: string;
  email: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  connections_allowed: number | null;
  active_connections: number | null;
  subscription_expires_at: string | null;
  updated_at?: string | null;
}

const planComparison = [
  { name: '36-Hour Demo', type: 'Trial', duration: '36 hours', connections: '1', billing: 'Free', note: 'Bronze-level preview access, expires quickly' },
  { name: 'Bronze', type: 'Paid', duration: '1 month', connections: '1–5', billing: 'Paid checkout', note: 'Entry paid package for active customers' },
  { name: 'Silver', type: 'Paid', duration: '3 months', connections: '1–5', billing: 'Paid checkout', note: 'Longer access window' },
  { name: 'Gold', type: 'Paid', duration: '6 months', connections: '1–5', billing: 'Paid checkout', note: 'Best mid-term value' },
  { name: 'Platinum', type: 'Paid', duration: '12 months', connections: '1–5', billing: 'Paid checkout', note: 'Longest access window' },
];

const formatDate = (value?: string | null) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getTimeRemaining = (value?: string | null) => {
  if (!value) return 'No expiration set';
  const expires = new Date(value).getTime();
  const diff = expires - Date.now();
  if (Number.isNaN(expires)) return 'No expiration set';
  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ${hours % 24} hr remaining`;
  return `${hours} hr ${minutes} min remaining`;
};

const ClientSubscription: React.FC = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<ProfileSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const restored = await restoreSessionAfterStripe();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session && !restored) {
          navigate('/login');
          return;
        }

        if (!session) {
          setSubscription(null);
          return;
        }

        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('id, email, subscription_tier, subscription_status, connections_allowed, active_connections, subscription_expires_at, updated_at')
          .eq('id', session.user.id)
          .maybeSingle();

        if (queryError) throw queryError;
        setSubscription(data);
      } catch (err) {
        console.error('Error loading subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [navigate]);

  const isActive = subscription?.subscription_status === 'active';
  const isDemo = subscription?.subscription_tier === 'demo';
  const planName = useMemo(() => {
    if (isDemo) return '36-Hour Demo';
    const tier = subscription?.subscription_tier || 'No plan';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }, [isDemo, subscription?.subscription_tier]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-dark-200 rounded w-1/4" />
        <div className="h-12 bg-dark-200 rounded" />
        <div className="h-12 bg-dark-200 rounded" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-8">
        <CreditCard className="text-primary w-8 h-8 mr-4" />
        <h1 className="text-3xl font-bold text-white">Subscription Details</h1>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      ) : subscription && isActive ? (
        <div className="space-y-6">
          {isDemo && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-yellow-100">
              <div className="flex items-start gap-3">
                <Clock className="mt-1 h-5 w-5 text-yellow-300" />
                <div>
                  <h2 className="text-lg font-semibold text-white">36-Hour Demo Access</h2>
                  <p className="mt-1 text-sm text-yellow-100/80">
                    This is temporary trial access. It gives the customer a Bronze-level preview with 1 connection, but it is not a paid Bronze subscription.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
            <div className="flex items-center mb-6">
              <Package className="text-primary w-6 h-6 mr-3" />
              <h2 className="text-xl font-semibold text-white">Current Plan</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-2">Plan Type</div>
                <div className="bg-dark-200 rounded-lg px-4 py-3 text-white">{planName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Status</div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-green-400 capitalize">
                  {subscription.subscription_status}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
            <div className="flex items-center mb-6">
              <Monitor className="text-primary w-6 h-6 mr-3" />
              <h2 className="text-xl font-semibold text-white">Connections</h2>
            </div>
            <div className="bg-dark-200 rounded-lg px-4 py-3 text-white">
              {subscription.active_connections ?? 0} / {subscription.connections_allowed ?? 1} devices
            </div>
          </div>

          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
            <div className="flex items-center mb-6">
              <Calendar className="text-primary w-6 h-6 mr-3" />
              <h2 className="text-xl font-semibold text-white">Access Period</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-2">Started / Updated</div>
                <div className="bg-dark-200 rounded-lg px-4 py-3 text-white">
                  {formatDate(subscription.updated_at)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Expires</div>
                <div className="bg-dark-200 rounded-lg px-4 py-3 text-white">
                  {formatDate(subscription.subscription_expires_at)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Time Remaining</div>
                <div className={`rounded-lg px-4 py-3 ${isDemo ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20' : 'bg-dark-200 text-white'}`}>
                  {getTimeRemaining(subscription.subscription_expires_at)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
            <div className="flex items-center mb-6">
              <ShieldCheck className="text-primary w-6 h-6 mr-3" />
              <h2 className="text-xl font-semibold text-white">Demo vs Paid Tiers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="px-4 py-3 text-left">Access</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Duration</th>
                    <th className="px-4 py-3 text-left">Connections</th>
                    <th className="px-4 py-3 text-left">Billing</th>
                    <th className="px-4 py-3 text-left">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {planComparison.map((plan) => (
                    <tr key={plan.name} className={`border-b border-gray-800/70 ${plan.name === planName ? 'bg-primary/10' : ''}`}>
                      <td className="px-4 py-3 text-white font-medium">{plan.name}</td>
                      <td className="px-4 py-3 text-gray-300">{plan.type}</td>
                      <td className="px-4 py-3 text-gray-300">{plan.duration}</td>
                      <td className="px-4 py-3 text-gray-300">{plan.connections}</td>
                      <td className="px-4 py-3 text-gray-300">{plan.billing}</td>
                      <td className="px-4 py-3 text-gray-300">{plan.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-dark-100 rounded-xl p-8 border border-gray-800 text-center">
          <AlertCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Active Subscription</h2>
          <p className="text-gray-400 mb-6">
            You do not have an active subscription or demo access yet. Choose a plan or start the 36-hour demo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              View Plans
            </button>
            <button
              type="button"
              onClick={() => navigate('/free-trial')}
              className="bg-white/10 hover:bg-white/15 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Start 36-Hour Demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSubscription;
