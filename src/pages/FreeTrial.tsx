import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface TrialReceipt {
  test_mode: boolean;
  notification_status: 'sent' | 'pending';
  message: string;
}

const FreeTrial: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [receipt, setReceipt] = useState<TrialReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    window.scrollTo(0, 0);
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) { setSession(data.session); setCheckingSession(false); }
    }).catch(() => { if (mounted) setCheckingSession(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const requestTrial = async (signedIn: Session) => {
    const response = await fetch('/api/start-demo', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${signedIn.access_token}` },
      body: JSON.stringify({ fullName: fullName.trim() }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'Unable to save your trial request. Please try again.');
    setReceipt({ test_mode: payload.test_mode === true, notification_status: payload.notification_status, message: payload.message });
  };

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (loading || checkingSession) return;
    setLoading(true); setError(null);
    try {
      if (session) { await requestTrial(session); return; }
      if (password.length < 8 || password.length > 128) throw new Error('Use a password between 8 and 128 characters.');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), password,
        options: { data: { full_name: fullName.trim() || null }, emailRedirectTo: `${window.location.origin}/login` },
      });
      setPassword('');
      if (signUpError) throw new Error(/already registered|already exists/i.test(signUpError.message)
        ? 'Please sign in to your existing account to request a trial.' : signUpError.message);
      if (data.session) { setSession(data.session); await requestTrial(data.session); }
      else setConfirmEmail(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save your trial request.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen py-24 container-padding">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gradient mb-3">Start Your 36-Hour Trial</h1>
        <p className="text-gray-400 mb-6">Request a 36-hour trial with 1 connection. We will email you with the next steps for streaming setup.</p>
        <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
          {checkingSession ? <p className="text-gray-300" role="status">Checking your account...</p> : receipt ? (
            <div className="space-y-5" role="status">
              <h2 className="text-xl font-semibold text-white">{receipt.test_mode ? 'Test request received' : 'Trial request received'}</h2>
              <p className="text-gray-300">{receipt.message}</p>
              {receipt.test_mode && <p className="text-sm text-amber-300">This Preview test does not activate a live trial or create streaming credentials.</p>}
              {receipt.notification_status === 'sent' && <p className="text-gray-400 text-sm">Check your inbox and spam folder for your acknowledgment. Streaming setup instructions will follow separately.</p>}
              {receipt.notification_status === 'pending' && <button type="button" disabled={loading} onClick={handleSubmit} className="w-full btn-primary">{loading ? 'Checking...' : 'Retry confirmation email'}</button>}
              <button type="button" onClick={() => navigate('/dashboard')} className="w-full btn-primary">Go to Dashboard</button>
              {error && <p className="text-red-300" role="alert">{error}</p>}
            </div>
          ) : confirmEmail && !session ? (
            <div className="space-y-5" role="status">
              <h2 className="text-xl font-semibold text-white">Check your email</h2>
              <p className="text-gray-300">If this address is eligible for signup, you will receive an account confirmation email. Confirm your email, then return here and sign in to finish your trial request.</p>
              <Link to="/login" state={{ from: '/free-trial' }} className="block text-center btn-primary">Sign In to Continue</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {session && <p className="text-gray-300 text-sm">Requesting a trial for <span className="font-medium text-white break-all">{session.user.email}</span></p>}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input id="fullName" type="text" autoComplete="name" maxLength={120} value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="Your name" />
              </div>
              {!session && <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <input id="email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Create Password</label>
                  <input id="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="At least 8 characters" />
                  <p className="mt-2 text-xs text-gray-500">Use this password to sign back into your website account.</p>
                </div>
              </>}
              {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300" role="alert">{error}</div>}
              <button type="submit" disabled={loading} className="w-full btn-primary disabled:cursor-not-allowed disabled:opacity-70">{loading ? 'Saving your request...' : session ? 'Request 36-Hour Trial' : 'Create Account for Your Trial'}</button>
              {!session && <p className="text-sm text-gray-400 text-center">Already have an account? <Link to="/login" state={{ from: '/free-trial' }} className="text-primary hover:underline">Sign in</Link></p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreeTrial;
