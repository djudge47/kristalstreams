import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { changeWebsitePassword, passwordValidationError } from '../../lib/website-password';
import { Shield, Key, AlertTriangle } from 'lucide-react';

export default function ClientSecurity() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const revision = useRef(0);
  const account = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    mounted.current = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user.id ?? null;
      if ((account.current !== undefined && account.current !== next) || (account.current === undefined && busy.current)) {
        revision.current += 1;
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setSuccess(null);
        setError('Your account session changed. Sign in again before changing your website password.');
      }
      account.current = next;
    });
    return () => { mounted.current = false; revision.current += 1; subscription.unsubscribe(); };
  }, []);

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    setError(null); setSuccess(null);
    const input = { currentPassword, newPassword, confirmPassword };
    const validation = passwordValidationError(input);
    if (validation) { setError(validation); return; }
    busy.current = true; setLoading(true);
    const startedAt = revision.current;
    const stillCurrent = () => mounted.current && revision.current === startedAt;
    try {
      await changeWebsitePassword(input, stillCurrent);
      if (stillCurrent()) setSuccess('Website password updated. Use your new password the next time you sign in.');
    } catch (problem) {
      if (stillCurrent()) setError(problem instanceof Error ? problem.message : 'The website password-change result could not be confirmed. Use password recovery before trying again.');
    } finally {
      busy.current = false;
      if (mounted.current) {
        setLoading(false);
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      }
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-4"><Shield className="h-8 w-8 text-primary" aria-hidden="true" /><h1 className="text-3xl font-bold text-white">Security Settings</h1></div>
      <section aria-labelledby="website-password-heading" className="rounded-xl border border-gray-800 bg-dark-100 p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-3"><Key className="h-6 w-6 text-primary" aria-hidden="true" /><h2 id="website-password-heading" className="text-xl font-semibold text-white">Change Website Password</h2></div>
        <p id="website-password-help" className="mb-6 text-sm text-gray-300">Verify your current website password to change it. Your streaming player login is separate. If you forgot your website password or use another sign-in method, use <Link to="/login" className="text-primary underline">Forgot your password?</Link> on the sign-in page.</p>
        <form onSubmit={handlePasswordChange} className="space-y-6" aria-describedby="website-password-help" aria-busy={loading}>
          <fieldset disabled={loading} className="space-y-6">
            <legend className="sr-only">Website password change</legend>
            <div>
              <label htmlFor="current-website-password" className="mb-2 block text-sm font-medium text-gray-300">Current Website Password</label>
              <input id="current-website-password" type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none" required />
            </div>
            <div>
              <label htmlFor="new-website-password" className="mb-2 block text-sm font-medium text-gray-300">New Website Password</label>
              <input id="new-website-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={event => setNewPassword(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none" required />
            </div>
            <div>
              <label htmlFor="confirm-website-password" className="mb-2 block text-sm font-medium text-gray-300">Confirm New Website Password</label>
              <input id="confirm-website-password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none" required />
            </div>
          </fieldset>
          {error && <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4"><AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" aria-hidden="true" /><p className="text-red-300">{error}</p></div>}
          {success && <p role="status" className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-300">{success}</p>}
          <div className="flex justify-end"><button type="submit" disabled={loading} className="rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-red-700 disabled:bg-gray-700">{loading ? 'Verifying and updating…' : 'Update Website Password'}</button></div>
        </form>
      </section>
      <section aria-labelledby="security-recommendations" className="mt-8 rounded-xl border border-gray-800 bg-dark-100 p-6 sm:p-8">
        <h2 id="security-recommendations" className="mb-4 text-xl font-semibold text-white">Security Recommendations</h2>
        <ul className="list-disc space-y-3 pl-5 text-gray-300">
          <li>Use a unique, long website password and a password manager.</li>
          <li>Use at least 8 characters and follow any additional account requirements.</li>
          <li>Change your password if you suspect it has been exposed.</li>
          <li>Keep website and streaming credentials private.</li>
        </ul>
      </section>
    </div>
  );
}
