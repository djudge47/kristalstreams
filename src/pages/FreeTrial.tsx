import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const FreeTrial: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Generate a random password for the trial account
      const password = Math.random().toString(36).slice(-8);

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            subscription_tier: 'trial',
            subscription_status: 'active',
          },
        },
      });

      if (signUpError) {
        if (signUpError.message === 'User already registered') {
          // If user exists, try to sign them in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: password, // This will likely fail, but that's okay
          });

          if (signInError) {
            // If sign in fails, redirect to login page
            navigate('/login', { 
              state: { 
                message: 'This email is already registered. Please log in to access your account.' 
              }
            });
            return;
          }
        } else {
          throw signUpError;
        }
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-32 container-padding">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gradient mb-6">Start Your Free Trial</h1>
        <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Starting trial...' : 'Start 36-Hour Free Trial'}
            </button>
            <p className="text-sm text-gray-400 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary-dark">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FreeTrial;