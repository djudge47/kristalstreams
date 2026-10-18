import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { parseLoginAvailability, parseStreamingLogin, type StreamingLogin } from '../../_shared/ks-streaming-login-response.js';

const StreamingLoginHandoff: React.FC<{ accountId: string }> = ({ accountId }) => {
  const [available, setAvailable] = useState<{ reference: string; expiresAt: string }[]>([]);
  const [login, setLogin] = useState<StreamingLogin | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const revealRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), 20000);
    let active = true;
    const clear = () => { revealRequest.current?.abort(); revealRequest.current = null; setLogin(null); setLoading(false); };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id !== accountId) { controller.abort(); clear(); setAvailable([]); active = false; }
    });
    const visibility = () => { if (document.hidden) clear(); };
    document.addEventListener('visibilitychange', visibility);
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active || data.session?.user.id !== accountId || !data.session.access_token) return;
        const response = await fetch('/api/ks-customer-setup?view=login-availability', { cache: 'no-store', signal: controller.signal,
          headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' } });
        if (!response.ok) return;
        const payload = await response.json();
        if (active && !controller.signal.aborted) setAvailable(parseLoginAvailability(payload, accountId));
      } catch { /* No available-login claim is made if the independent read fails. */ }
      finally { window.clearTimeout(timeout); }
    })();
    return () => { active = false; controller.abort(); revealRequest.current?.abort(); revealRequest.current = null;
      window.clearTimeout(timeout); subscription.unsubscribe(); document.removeEventListener('visibilitychange', visibility); };
  }, [accountId]);
  useEffect(() => { if (!login) return; const timer = window.setTimeout(() => setLogin(null), 60000); return () => window.clearTimeout(timer); }, [login]);
  const reveal = async (reference: string) => {
    if (revealRequest.current) return;
    const controller = new AbortController(); revealRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    setLoading(true); setError(''); setLogin(null);
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (controller.signal.aborted || revealRequest.current !== controller) return;
      if (authError || data.session?.user.id !== accountId || !data.session.access_token) throw new Error('Please sign in again to view your streaming login.');
      const response = await fetch('/api/ks-customer-setup?view=streaming-login', { method: 'POST', cache: 'no-store', signal: controller.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ sessionId: reference }) });
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted || revealRequest.current !== controller) return;
      if (!response.ok) throw new Error(payload?.error || 'Your streaming login is unavailable.');
      if (!document.hidden) setLogin(parseStreamingLogin(payload, accountId, reference));
    } catch (failure) { if (revealRequest.current === controller) setError(controller.signal.aborted ? 'The login request took too long.' : failure instanceof Error ? failure.message : 'Your streaming login is unavailable.'); }
    finally { window.clearTimeout(timeout); if (revealRequest.current === controller) { revealRequest.current = null; setLoading(false); } }
  };
  if (available.length === 0) return null;
  return <section className="mb-6 rounded-2xl border border-emerald-400/20 bg-dark-100 p-5 sm:p-6" aria-labelledby="streaming-login-title">
    <div className="flex items-center gap-3"><LockKeyhole className="h-6 w-6 shrink-0 text-emerald-400" aria-hidden="true" /><h2 id="streaming-login-title" className="text-xl font-bold text-white">Your streaming login</h2></div>
    <p className="mt-3 text-sm leading-6 text-gray-300">Use this login in your streaming player. Your website sign-in stays separate. Keep your streaming password private.</p>
    {available.map(row => <div key={row.reference} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-400">Service expiry: {new Date(row.expiresAt).toLocaleString()}</p>
      <button type="button" disabled={loading} onClick={() => { if (login) setLogin(null); else void reveal(row.reference); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : login ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}{loading ? 'Retrieving...' : login ? 'Hide login' : 'Show streaming login'}
      </button>
    </div>)}
    {login && <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4"><dl className="space-y-4"><div><dt className="text-xs text-gray-400">Streaming username</dt><dd className="mt-1 break-all font-mono text-white">{login.username}</dd></div><div><dt className="text-xs text-gray-400">Streaming password</dt><dd className="mt-1 break-all font-mono text-white">{login.password}</dd></div></dl><p className="mt-4 text-xs text-gray-500">Hidden automatically after one minute or when you leave this tab.</p></div>}
    {error && <p role="alert" className="mt-3 text-sm text-amber-200">{error}</p>}
  </section>;
};
export default StreamingLoginHandoff;
