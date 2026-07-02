import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { sendWelcomeEmail } from '../lib/emailjs';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (signUpError) {
      setLoading(false);
      if (/already registered|already exists/i.test(signUpError.message)) {
        navigate('/login', { state: { message: 'This email is already registered. Sign in instead.' } });
        return;
      }
      setError(signUpError.message);
      return;
    }

    try {
      await sendWelcomeEmail({
        user_name: email.split('@')[0],
        user_email: email,
        subscription_plan: 'Free Trial',
      });
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
    }

    setLoading(false);
    if (data.session) {
      navigate('/dashboard');
    } else {
      navigate('/login', { state: { message: 'Account created. Check your email to confirm the account, then sign in.' } });
    }
  };

  return (
    <div className="min-h-screen py-12 container-padding">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-3xl font-bold text-white">Create Account</h1>
        <div className="rounded-xl border border-gray-800 bg-dark-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">Email Address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="w-full rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none" required />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-300">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="w-full rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none" required />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-300">Confirm Password</label>
              <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className="w-full rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none" required />
            </div>
            {error && <div className="rounded-lg border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-300">{error}</div>}
            <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Creating account...' : 'Create Account'}</button>
            <p className="text-center text-sm text-gray-400">Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
