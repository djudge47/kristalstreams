import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, Key, AlertTriangle } from 'lucide-react';

const ClientSecurity: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-8">
        <Shield className="text-primary w-8 h-8 mr-4" />
        <h1 className="text-3xl font-bold text-white">Security Settings</h1>
      </div>

      <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
        <div className="flex items-center mb-6">
          <Key className="text-primary w-6 h-6 mr-3" />
          <h2 className="text-xl font-semibold text-white">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start">
              <AlertTriangle className="text-red-500 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start">
              <Shield className="text-green-500 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-green-500">{success}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 disabled:bg-gray-700"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-dark-100 rounded-xl p-8 border border-gray-800">
        <div className="flex items-center mb-6">
          <AlertTriangle className="text-primary w-6 h-6 mr-3" />
          <h2 className="text-xl font-semibold text-white">Security Recommendations</h2>
        </div>

        <ul className="space-y-4 text-gray-300">
          <li className="flex items-start">
            <Shield className="w-5 h-5 text-primary mr-3 mt-1" />
            Use a strong password with at least 8 characters
          </li>
          <li className="flex items-start">
            <Shield className="w-5 h-5 text-primary mr-3 mt-1" />
            Include numbers, symbols, and both uppercase and lowercase letters
          </li>
          <li className="flex items-start">
            <Shield className="w-5 h-5 text-primary mr-3 mt-1" />
            Don't reuse passwords from other accounts
          </li>
          <li className="flex items-start">
            <Shield className="w-5 h-5 text-primary mr-3 mt-1" />
            Change your password regularly
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ClientSecurity;