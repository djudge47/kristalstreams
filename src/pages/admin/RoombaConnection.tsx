import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, CreditCard, Loader2, RefreshCw, ShieldCheck, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type AccountResult = {
  status: 'connected';
  checkedAt: string;
  cached: boolean;
  account: { id: string | number | null; username: string | number | null; credits: string | number | null };
};

const RoombaConnection: React.FC = () => {
  const [result, setResult] = useState<AccountResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);

  useEffect(() => () => {
    const request = controller.current;
    controller.current = null;
    request?.abort();
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const checkConnection = async () => {
    if (busy.current || cooldown) return;
    busy.current = true;
    const request = new AbortController();
    controller.current = request;
    const timeout = window.setTimeout(() => request.abort(), 25000);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session?.access_token) throw new Error('Please sign in again to your admin account.');
      const response = await fetch('/api/ks-roomba-account', {
        method: 'GET', cache: 'no-store', signal: request.signal,
        headers: { Accept: 'application/json', Authorization: `Bearer ${data.session.access_token}` },
      });
      const payload = await response.json().catch(() => null);
      if (request.signal.aborted || controller.current !== request) return;
      if (!response.ok) {
        setCooldown(Math.min(60, Math.max(0, Number(payload?.retryAfterSeconds) || 0)));
        throw new Error(payload?.error || 'The connection could not be checked. Please try again.');
      }
      if (payload?.status !== 'connected' || !payload.account || !Number.isFinite(Date.parse(payload.checkedAt))) {
        throw new Error('The connection response could not be verified. Please try again.');
      }
      setResult(payload as AccountResult);
      const age = Math.max(0, Date.now() - Date.parse(payload.checkedAt));
      setCooldown(Math.max(1, Math.ceil((60000 - age) / 1000)));
    } catch (failure) {
      if (request.signal.aborted) {
        if (controller.current === request) setError('The check took too long. Please try again.');
      } else {
        setError(failure instanceof Error ? failure.message : 'The connection could not be checked.');
      }
    } finally {
      window.clearTimeout(timeout);
      busy.current = false;
      if (controller.current === request) {
        controller.current = null;
        setLoading(false);
      }
    }
  };

  const credits = result?.account.credits;
  const balance = credits === null || credits === undefined ? 'Unavailable'
    : typeof credits === 'number' ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(credits) : String(credits);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to dashboard
      </Link>
      <section className="overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/70 via-gray-900 to-gray-950 p-5 shadow-2xl shadow-black/30 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-red-300">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />Private admin · Preview
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Roomba connection</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-300 sm:text-base">Check your reseller account and available credits from your Kristal Streams admin area.</p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300">
            <Wifi className="h-7 w-7" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-gray-400">Check when you need an update. Results can be reused for up to one minute.</p>
          <button type="button" onClick={checkConnection} disabled={loading || cooldown > 0}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            {loading ? 'Checking connection...' : cooldown ? `Check again in ${cooldown}s` : result ? 'Refresh connection' : 'Check connection'}
          </button>
        </div>
      </section>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {loading ? 'Checking your Roomba connection.' : error ? 'Connection check failed.' : result ? 'Roomba connection verified. Account details are available below.' : 'Connection has not been checked.'}
      </div>
      {error && <div role="alert" className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-200">{error}</div>}

      {result ? (
        <section aria-label="Verified reseller account" className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-400" aria-hidden="true" /><div><h2 className="font-semibold text-emerald-300">Connected to Roomba</h2><p className="mt-1 text-xs text-gray-400">Account response verified through Fixie</p></div></div>
            <div className="flex items-center gap-2 text-xs text-gray-400"><Clock className="h-4 w-4" aria-hidden="true" /><span>Checked {new Date(result.checkedAt).toLocaleString()}{result.cached ? ' · Recent result' : ''}</span></div>
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-700 bg-gray-800/70 p-6"><dt className="flex items-center gap-2 text-sm text-gray-400"><CreditCard className="h-4 w-4 text-red-400" aria-hidden="true" />Available credits</dt><dd className="mt-3 break-words text-4xl font-bold tracking-tight text-white">{balance}</dd><p className="mt-2 text-xs text-gray-500">Reseller credits</p></div>
            <div className="min-w-0 rounded-2xl border border-gray-700 bg-gray-800/70 p-6"><dt className="text-sm text-gray-400">Reseller username</dt><dd className="mt-4 break-words text-xl font-semibold text-white">{result.account.username ?? 'Unavailable'}</dd></div>
            <div className="rounded-2xl border border-gray-700 bg-gray-800/70 p-6"><dt className="text-sm text-gray-400">Account ID</dt><dd className="mt-4 break-words text-xl font-semibold text-white">{result.account.id ?? 'Unavailable'}</dd></div>
          </dl>
        </section>
      ) : !loading && !error ? (
        <section className="rounded-3xl border border-dashed border-gray-700 bg-gray-800/30 px-5 py-12 text-center">
          <Wifi className="mx-auto h-8 w-8 text-gray-500" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-white">Ready to check your account</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">Select Check connection to retrieve your reseller details and credit balance.</p>
        </section>
      ) : null}
      <p className="flex items-start gap-2 px-1 text-xs leading-5 text-gray-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />This panel reads account information only. Customer creation, renewals and payments remain separate.</p>
    </div>
  );
};

export default RoombaConnection;
