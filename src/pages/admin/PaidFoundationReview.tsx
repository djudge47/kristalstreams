import React, { useEffect, useRef, useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PaidFoundationReview: React.FC = () => {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null); const owner = useRef<string | null>(null);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (owner.current && session?.user.id !== owner.current) { request.current?.abort(); request.current = null; setConfigured(null); setLoading(false); }
    });
    return () => { subscription.unsubscribe(); request.current?.abort(); request.current = null; };
  }, []);
  const check = async () => {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    setLoading(true); setError(''); setConfigured(null);
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (controller.signal.aborted || request.current !== controller) return;
      if (authError || !data.session?.access_token) throw new Error('Please sign in again.'); owner.current = data.session.user.id;
      const response = await fetch('/api/ks-preview-paid-orders?view=foundation', { cache: 'no-store', signal: controller.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' } });
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted || request.current !== controller) return;
      if (!response.ok) throw new Error(payload?.error || 'Foundation review is unavailable.');
      const f = payload?.foundation;
      if (f?.version !== 1 || f.durableAttempts !== true || f.browserAccessRevoked !== true || f.encryptedLoginTable !== true
        || f.ownerOnlyHandoffImplemented !== true || typeof f.encryptionConfigured !== 'boolean' || f.providerExecutionEnabled !== false || f.liveTestReady !== false) throw new Error('Foundation status could not be verified.');
      setConfigured(f.encryptionConfigured);
    } catch (failure) { if (request.current === controller) setError(controller.signal.aborted ? 'The status check took too long.' : failure instanceof Error ? failure.message : 'Foundation review is unavailable.'); }
    finally { window.clearTimeout(timeout); if (request.current === controller) { request.current = null; setLoading(false); } }
  };
  return <div className="mt-5 border-t border-white/10 pt-4">
    <button type="button" onClick={check} disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Database className="h-4 w-4" aria-hidden="true" />}{loading ? 'Checking foundation...' : 'Check setup foundation'}</button>
    {error && <p role="alert" className="mt-3 text-sm text-amber-200">{error}</p>}
    {configured !== null && <div role="status" className="mt-4 rounded-xl border border-emerald-400/20 bg-gray-900 p-4 text-sm leading-6 text-gray-300">
      <h4 className="font-semibold text-white">Durable setup foundation installed</h4>
      <ul className="mt-3 space-y-2"><li>Persistent attempts and duplicate dispatch guard: installed</li><li>Encrypted login tables and account-only retrieval: installed</li><li>Direct browser table access: blocked</li><li>Server encryption key: <span className={configured ? 'text-emerald-300' : 'text-amber-300'}>{configured ? 'Configured' : 'Needs configuration'}</span></li></ul>
      <p className="mt-3 text-amber-200">Real activation is still disabled. Live transport, fresh execution checks and separate credit approval are required before a paid test.</p>
    </div>}
  </div>;
};
export default PaidFoundationReview;
