import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CreditCard, Package, Calendar, AlertCircle } from 'lucide-react';
import { restoreSessionAfterStripe } from '../../lib/stripe';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

const ClientSubscription: React.FC = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initPage = async () => {
      try {
        // First try to restore session if coming from Stripe
        const restored = await restoreSessionAfterStripe();
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // If no session and restoration failed, redirect to login
          if (!restored) {
            navigate('/login');
            return;
          }
        }

        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session?.user.id)
          .maybeSingle();

        if (error) throw error;
        setSubscription(data);
      } catch (err) {
        console.error('Error loading subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [navigate]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-dark-200 rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          <div className="h-12 bg-dark-200 rounded"></div>
          <div className="h-12 bg-dark-200 rounded"></div>
        </div>
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
      ) : subscription ? (
        <div className="space-y-6">
          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
            <div className="flex items-center mb-6">
              <Package className="text-primary w-6 h-6 mr-3" />
              <h2 className="text-xl font-semibold text-white">Current Plan</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Plan Type
                </label>
                <div className="bg-dark-200 rounded-lg px-4 py-3 text-white">
                  {subscription.plan_id}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Status
                </label>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  subscription.status === 'active'
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {subscription.status}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
            <div className="flex items-center mb-6">
              <Calendar className="text-primary w-6 h-6 mr-3" />
              <h2 className="text-xl font-semibold text-white">Billing Period</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Current Period Start
                </label>
                <div className="bg-dark-200 rounded-lg px-4 py-3 text-white">
                  {new Date(subscription.current_period_start).toLocaleDateString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Current Period End
                </label>
                <div className="bg-dark-200 rounded-lg px-4 py-3 text-white">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200">
              Manage Subscription
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-dark-100 rounded-xl p-8 border border-gray-800 text-center">
          <AlertCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Active Subscription</h2>
          <p className="text-gray-400 mb-6">
            You don't have an active subscription. Choose a plan to start streaming.
          </p>
          <button className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200">
            View Plans
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientSubscription;