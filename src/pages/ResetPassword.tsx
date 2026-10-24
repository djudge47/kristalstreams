import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { passwordRecovery } from '../lib/password-recovery';
import type { RecoveryState } from '../lib/password-recovery-controller';

const RecoveryForm: React.FC<{ state: RecoveryState }> = ({ state }) => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const busy = useRef(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current || state.status !== 'ready') return;
    busy.current = true;
    const pending = passwordRecovery.submit(password, confirmation, () => mounted.current);
    if (passwordRecovery.getState().status === 'submitting') { setPassword(''); setConfirmation(''); }
    try { await pending; } finally { busy.current = false; }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset disabled={state.status === 'submitting'} className="space-y-6">
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-300">New website password</label>
          <input id="password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none" required />
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-300">Confirm website password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none" required />
        </div>
        {state.message && <p role="alert" className="text-sm text-red-400">{state.message}</p>}
        <button type="submit" className="w-full btn-primary">{state.status === 'submitting' ? 'Updating website password...' : 'Update website password'}</button>
      </fieldset>
      <p className="text-sm text-gray-300" role="status">{state.status === 'submitting' ? 'Please wait while your password update is checked.' : 'This changes your website password.'}</p>
    </form>
  );
};

const ResetPassword: React.FC = () => {
  const state = useSyncExternalStore(passwordRecovery.subscribe, passwordRecovery.getState);
  return (
    <div className="min-h-screen py-12 container-padding">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-3xl font-bold text-white">Choose a New Password</h1>
        <div className="rounded-xl border border-gray-800 bg-dark-100 p-8">
          {state.status === 'ready' || state.status === 'submitting' ? <RecoveryForm key={state.revision} state={state} /> : (
            <div className="space-y-4 text-gray-300">
              <p role="status">{state.status === 'checking' ? 'Checking your website password-reset link...' : state.status === 'complete' ? 'Website password updated. Use your new password the next time you sign in.' : state.message}</p>
              {state.status !== 'checking' && <Link to={state.status === 'complete' || state.status === 'uncertain' ? '/login' : '/forgot-password'} className="text-primary hover:underline">{state.status === 'complete' || state.status === 'uncertain' ? 'Go to website sign in' : 'Request another password reset'}</Link>}
              {state.status === 'unavailable' && <p><Link to="/client/security" className="text-primary hover:underline">Open website Security</Link></p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
