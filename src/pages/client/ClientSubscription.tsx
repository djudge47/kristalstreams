import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, CreditCard, Monitor, Package } from 'lucide-react';
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
  const planName = useMemo(() => {
    const tier = subscription?.subscription_tier || 'No plan';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }, [subscription?.subscription_tier]);

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
            <div className="grid md:grid-cols-2 gap-6">
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
