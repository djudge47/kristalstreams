import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '../../lib/stripe';
import { getProductConfig } from '../../lib/stripe-config';
import { Loader } from 'lucide-react';

interface LocationState {
  plan: 'basic' | 'standard' | 'premium' | 'ultimate';
  interval: 'monthly' | 'yearly';
  price: number;
}

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = location.state as LocationState;

  useEffect(() => {
    if (!state?.plan || !state?.interval || !state?.price) {
      navigate('/pricing');
      return;
    }

    const initCheckout = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Starting checkout with:', {
          plan: state.plan,
          interval: state.interval,
          price: state.price
        });
        
        const productConfig = getProductConfig(state.plan, state.interval);
        if (!productConfig) {
          throw new Error('Invalid product configuration');
        }
        await createCheckoutSession(productConfig.priceId, productConfig.mode);
      } catch (err) {
        console.error('Checkout error:', err);
        let errorMessage = 'Failed to start checkout process. Please try again later.';
        
        if (err instanceof Error) {
          if (err.message.includes('Unable to connect to Stripe checkout service')) {
            errorMessage = 'Unable to connect to the payment service. Please ensure you are connected to Supabase and try again.';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    initCheckout();
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800 text-center">
            {loading ? (
              <div className="space-y-4">
                <Loader className="w-12 h-12 text-primary animate-spin mx-auto" />
                <h2 className="text-2xl font-semibold text-white">
                  Preparing Your Checkout...
                </h2>
                <p className="text-gray-400">
                  Please wait while we redirect you to our secure payment page.
                </p>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-white">
                  Checkout Error
                </h2>
                <p className="text-red-500">{error}</p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="bg-primary hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                >
                  Back to Plans
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;