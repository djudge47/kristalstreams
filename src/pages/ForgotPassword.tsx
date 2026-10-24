import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { passwordResetRequest } from '../lib/password-reset-request';

const ForgotPassword: React.FC = () => {
  const state = useSyncExternalStore(passwordResetRequest.subscribe, passwordResetRequest.getState);
  const [email, setEmail] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => { if (state.status === 'idle') input.current?.focus({ preventScroll: true }); }, [state.status]);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const pending = passwordResetRequest.submit(email);
    if (passwordResetRequest.getState().status === 'pending') setEmail('');
    void pending;
  };
  const again = () => {
    setEmail(''); passwordResetRequest.startAgain();
  };
  return (
    <div className="min-h-screen py-12 container-padding">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-3xl font-bold text-white">Reset your website password</h1>
        <section aria-label="Website password reset request" className="space-y-6 rounded-xl border border-gray-800 bg-dark-100 p-8">
          <p className="text-sm text-gray-300">Enter the email address for your Kristal Streams website account. Open the reset link in the same browser where you request it.</p>
          {(state.status === 'idle' || state.status === 'pending') && <form onSubmit={submit} className="space-y-4">
            <fieldset disabled={state.status !== 'idle'} className="space-y-4">
              <label htmlFor="recovery-email" className="block text-sm font-medium text-gray-300">Website account email</label>
              <input ref={input} id="recovery-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="min-h-12 w-full min-w-0 rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none disabled:opacity-50" required />
              <button type="submit" className="min-h-12 w-full btn-primary">{state.status === 'pending' ? 'Requesting reset link...' : 'Request reset link'}</button>
            </fieldset>
          </form>}
          <p role="status" className="text-sm text-gray-300">{state.status === 'pending' ? 'Your reset request is in progress. Leaving this page does not cancel it.' : state.message}</p>
          {['accepted', 'rejected', 'uncertain'].includes(state.status) && (
            <div className="space-y-4">
              <p className="text-sm text-gray-300">Check your inbox first. Another request is available after the current request finishes and a one-minute pause.</p>
              <button type="button" disabled={!state.canStartAgain} onClick={again} className="min-h-12 w-full rounded-lg border border-gray-700 px-4 py-2 text-white disabled:opacity-50">Start another reset request</button>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Link to="/login" className="inline-flex min-h-12 items-center text-primary hover:underline">Back to website sign in</Link>
            <Link to="/support" className="inline-flex min-h-12 items-center text-primary hover:underline">Get account help</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForgotPassword;
