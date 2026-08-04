import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, AlertCircle } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'activating' | 'success' | 'error'>('activating');
  const [message, setMessage] = useState('Activating your Kristal Streams subscription...');

  useEffect(() => {
    const activateSubscription = async () => {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setStatus('error');
        setMessage('Missing Stripe checkout session. Please contact support if your payment was completed.');
        return;
      }

      try {
        const response = await fetch('/api/confirm-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to activate subscription.');
        }

        setStatus('success');
        setMessage('Your subscription is active. Taking you to your dashboard...');
        window.setTimeout(() => navigate('/dashboard?payment=success', { replace: true }), 1200);
      } catch (error) {
        console.error('Payment activation error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Unable to activate subscription.');
      }
    };

    activateSubscription();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-dark-300 px-4 py-24 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-dark-100 p-8 text-center shadow-2xl shadow-black/40">
        {status === 'activating' && (
          <Loader className="mx-auto mb-6 h-14 w-14 animate-spin text-primary" />
        )}
        {status === 'success' && (
          <CheckCircle className="mx-auto mb-6 h-14 w-14 text-green-500" />
        )}
        {status === 'error' && (
          <AlertCircle className="mx-auto mb-6 h-14 w-14 text-red-500" />
        )}

        <h1 className="mb-4 text-3xl font-bold">
          {status === 'activating' && 'Payment received'}
          {status === 'success' && 'Subscription activated'}
          {status === 'error' && 'Activation needs attention'}
        </h1>

        <p className="mb-8 text-gray-300">{message}</p>

        {status === 'error' && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition hover:bg-red-700"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/support')}
              className="rounded-lg bg-white/10 px-6 py-3 font-medium text-white transition hover:bg-white/15"
            >
              Contact Support
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
