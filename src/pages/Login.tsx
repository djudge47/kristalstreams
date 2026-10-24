import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { loginDestination } from '../lib/loginDestination';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>((location.state as { message?: string } | null)?.message || null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    if (!hasSupabaseConfig) {
      setError('Account sign-in is unavailable on this preview. Please contact support.');
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message === 'Invalid login credentials' ? 'Invalid email or password.' : signInError.message);
        return;
      }
      if (!data.session) {
        setError('Sign-in did not complete. Please try again.');
        return;
      }
      navigate(loginDestination((location.state as { from?: unknown } | null)?.from), { replace: true });
    } catch {
      setError('Could not connect to account sign-in. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
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
            <Link to="/forgot-password" className="inline-flex min-h-12 items-center text-sm text-primary hover:underline">Forgot your password?</Link>
            <p className="text-center text-sm text-gray-400">Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up here</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
