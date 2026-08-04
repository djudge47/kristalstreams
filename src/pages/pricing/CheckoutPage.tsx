import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '../../lib/stripe';
import { ArrowLeft, CheckCircle, CreditCard, Loader, Lock, ShieldCheck, Sparkles } from 'lucide-react';

interface LocationState {
  plan: string;
  interval: string;
  price: number;
  connections?: number;
}

const formatPlanName = (plan: string) => {
  if (!plan) return 'Streaming Plan';
  return plan.charAt(0).toUpperCase() + plan.slice(1).replace(/-/g, ' ');
};

const formatInterval = (interval: string) => {
  if (!interval) return 'Subscription';
  return interval.charAt(0).toUpperCase() + interval.slice(1).replace(/-/g, ' ');
};

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = location.state as LocationState;

  const planName = formatPlanName(state?.plan);
  const billingLabel = formatInterval(state?.interval);
  const price = Number(state?.price || 0).toFixed(2);
  const connections = Math.max(1, Math.min(5, Number(state?.connections || 1)));

  useEffect(() => {
    if (!state?.plan || !state?.interval || !state?.price) {
      navigate('/pricing');
    }
  }, [state, navigate]);

  const handleSecurePayment = async () => {
    if (!state?.plan || !state?.interval || !state?.price || loading) return;

    setLoading(true);
    setError(null);

    try {
      await createCheckoutSession(state.plan, state.price, state.interval, connections);
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start checkout. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (!state) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-dark-300 py-16 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/pricing')}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:border-primary/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to plans
        </button>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <section className="rounded-3xl border border-white/10 bg-dark-100/80 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Kristal Streams secure checkout
            </div>

            <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Review your order
            </h1>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
              Confirm your plan below, then continue to Stripe’s secure payment page to complete your purchase.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <Lock className="mb-3 h-6 w-6 text-primary" />
                <h3 className="font-semibold">Secure payment</h3>
                <p className="mt-1 text-sm text-gray-400">Protected Stripe checkout</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <CreditCard className="mb-3 h-6 w-6 text-primary" />
                <h3 className="font-semibold">Fast setup</h3>
                <p className="mt-1 text-sm text-gray-400">Complete payment online</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <ShieldCheck className="mb-3 h-6 w-6 text-primary" />
                <h3 className="font-semibold">Account ready</h3>
                <p className="mt-1 text-sm text-gray-400">Plan details confirmed</p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/10 p-5">
              {error ? (
                <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                onClick={handleSecurePayment}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-white shadow-xl shadow-primary/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70 sm:text-lg"
              >
                {loading ? <Loader className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                {loading ? 'Opening secure payment...' : 'Continue to Secure Payment'}
              </button>

              <p className="mt-4 text-center text-sm text-gray-300">
                You will review and enter payment details on Stripe’s secure hosted checkout page.
              </p>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-gradient-to-b from-dark-100 to-dark-200 p-6 shadow-2xl shadow-black/40 md:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Order summary</p>
                <h2 className="mt-2 text-2xl font-bold">{planName}</h2>
              </div>
              <div className="rounded-2xl bg-primary/15 p-3">
                <CreditCard className="h-7 w-7 text-primary" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-4">
                <span className="text-gray-400">Billing</span>
                <span className="font-medium">{billingLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-4">
                <span className="text-gray-400">Connections</span>
                <span className="font-medium">{connections}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-4">
                <span className="text-gray-400">Plan price</span>
                <span className="text-xl font-bold">${price}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-5">
                <span className="text-lg font-semibold">Total due today</span>
                <span className="text-3xl font-bold text-primary">${price}</span>
              </div>
            </div>

            <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                <span>HD and 4K streaming access</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                <span>Movies, shows, sports, and live channels</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                <span>Support across compatible devices</span>
              </div>
            </div>

            <p className="mt-6 text-center text-xs leading-relaxed text-gray-500">
              Payment details are handled securely by Stripe. Kristal Streams does not store your full card information.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
