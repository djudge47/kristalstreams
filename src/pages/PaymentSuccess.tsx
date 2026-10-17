import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'checking' | 'success' | 'test' | 'error'>('checking');
  const [message, setMessage] = useState('Checking your payment with Stripe...');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let redirect: number | undefined;
    const confirm = async () => {
      setStatus('checking');
      setMessage('Checking your payment with Stripe...');
      try {
        if (!sessionId) throw new Error('Missing checkout session. Contact support if you completed payment.');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Please sign in to the account used for this purchase, then return to this page.');
        const response = await fetch('/api/confirm-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ sessionId }),
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => ({}));
        if (controller.signal.aborted) return;
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Payment verification could not finish. Contact support; do not pay again.');
        if (payload.test_mode === true && payload.activated === false) {
          setStatus('test');
          setMessage(payload.order_status === 'awaiting_activation'
            ? 'Your test payment is confirmed and saved in the CRM as paid — awaiting activation. No real charge or streaming service activation was made.'
            : 'Your test payment was confirmed and recorded. No real charge or live service activation was made.');
        } else if (payload.activated === true && payload.test_mode === false) {
          setStatus('success');
          setMessage('Your payment is confirmed and your website plan is active. Streaming login and setup instructions are supplied separately. Taking you to your dashboard...');
          redirect = window.setTimeout(() => navigate('/dashboard?payment=success', { replace: true }), 1200);
        } else throw new Error('Payment is recorded, but activation needs attention. Contact support; do not pay again.');
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Unable to verify payment. Please contact support.');
      }
    };
    void confirm();
    return () => { controller.abort(); if (redirect !== undefined) window.clearTimeout(redirect); };
  }, [navigate, sessionId, attempt]);

  return (
    <div className="min-h-screen bg-dark-300 px-4 py-24 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-dark-100 p-8 text-center shadow-2xl shadow-black/40" role="status" aria-live="polite">
        {status === 'checking' ? <Loader className="mx-auto mb-6 h-14 w-14 animate-spin text-primary" /> :
          status === 'error' ? <AlertCircle className="mx-auto mb-6 h-14 w-14 text-red-500" /> :
          <CheckCircle className="mx-auto mb-6 h-14 w-14 text-green-500" />}
        <h1 className="mb-4 text-3xl font-bold">
          {status === 'checking' ? 'Verifying payment' : status === 'test' ? 'Test payment confirmed' : status === 'success' ? 'Payment confirmed' : 'Verification needs attention'}
        </h1>
        <p className="mb-8 text-gray-300">{message}</p>
        {status === 'error' && <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={() => setAttempt(value => value + 1)} className="rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-red-700">Check Again</button>
          <button onClick={() => navigate('/support')} className="rounded-lg bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/15">Contact Support</button>
        </div>}
        {status === 'test' && <button onClick={() => navigate('/dashboard')} className="rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-red-700">Go to Dashboard</button>}
      </div>
    </div>
  );
};

export default PaymentSuccess;
