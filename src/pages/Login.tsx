import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>((location.state as { message?: string } | null)?.message || null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message === 'Invalid login credentials' ? 'Invalid email or password.' : signInError.message);
      return;
    }

    navigate('/dashboard');
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setResetLoading(true);
    setResetMessage(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetLoading(false);
    if (resetError) {
      setResetMessage(resetError.message);
      return;
    }

    setResetMessage('Password reset email sent. Check your inbox.');
  };

  return (
    <div className="min-h-screen py-12 container-padding">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-3xl font-bold text-white">Welcome Back</h1>
        <div className="rounded-xl border border-gray-800 bg-dark-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">Email Address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="w-full rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none" required />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-300">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="w-full rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none" required />
            </div>
            {notice && <div className="rounded-lg border border-green-500/40 bg-green-900/20 p-4 text-sm text-green-300">{notice}</div>}
            {error && <div className="rounded-lg border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-300">{error}</div>}
            <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Signing in...' : 'Sign In'}</button>
            <button type="button" onClick={() => { setShowForgotPassword(true); setResetEmail(email); }} className="w-full text-sm text-primary hover:underline">Forgot your password?</button>
            <p className="text-center text-sm text-gray-400">Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up here</Link></p>
          </form>
        </div>

        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-xl border border-gray-800 bg-dark-100 p-8">
              <h2 className="mb-4 text-xl font-semibold text-white">Reset Password</h2>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Email address" className="w-full rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none" required />
                {resetMessage && <p className="text-sm text-gray-300">{resetMessage}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={resetLoading} className="flex-1 rounded-lg bg-primary px-4 py-2 text-white hover:bg-red-700">{resetLoading ? 'Sending...' : 'Send Reset Email'}</button>
                  <button type="button" onClick={() => { setShowForgotPassword(false); setResetMessage(null); }} className="flex-1 rounded-lg bg-dark-200 px-4 py-2 text-white">Close</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
