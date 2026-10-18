import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FlaskConical, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { parsePaidSimulationReport, type PaidSimulationPlan, type PaidSimulationReport } from '../../../_shared/ks-paid-simulation-report.js';

type Props = PaidSimulationPlan & { sessionId: string };
const NewPaidSetupSimulation: React.FC<Props> = ({ sessionId, tier, connections, interval, amountCents }) => {
  const [report, setReport] = useState<PaidSimulationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const owner = useRef<string | null>(null);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (owner.current && session?.user.id !== owner.current) {
        pending.current?.abort(); pending.current = null; busy.current = false; owner.current = null;
        setReport(null); setLoading(false); setError('Your account changed. Sign in again before running this review.');
      }
    });
    return () => { subscription.unsubscribe(); pending.current?.abort(); pending.current = null; };
  }, []);
  const run = async () => {
    if (busy.current) return;
    busy.current = true; const controller = new AbortController(); pending.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 50000);
    setLoading(true); setError(''); setReport(null);
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (controller.signal.aborted || pending.current !== controller) return;
      if (authError || !data.session?.access_token) throw new Error('Please sign in again to your admin account.');
      owner.current = data.session.user.id;
      const response = await fetch(`/api/ks-preview-paid-orders?view=new-customer-simulation&sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'GET', cache: 'no-store', signal: controller.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted || pending.current !== controller) return;
      if (!response.ok) throw new Error(payload?.error || 'The simulation is unavailable.');
      setReport(parsePaidSimulationReport(payload?.report, { tier, connections, interval, amountCents }));
    } catch (failure) {
      if (pending.current === controller) setError(controller.signal.aborted ? 'The simulation took too long. Try again.' : failure instanceof Error ? failure.message : 'The simulation is unavailable.');
    } finally {
      window.clearTimeout(timeout);
      if (pending.current === controller) { pending.current = null; busy.current = false; setLoading(false); }
    }
  };
  return <div className="mt-5 border-t border-white/10 pt-4">
    <h4 className="text-base font-semibold text-white">New-customer paid setup</h4>
    <p className="mt-2 text-sm leading-6 text-gray-400">Test the workflow with a fictional new customer. This saved test order supplies only the plan; your existing trial and real customer records stay unchanged.</p>
    <button type="button" onClick={run} disabled={loading} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 disabled:opacity-60">
      {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {loading ? 'Running simulated checks...' : 'Run new-customer simulation'}
    </button>
    {error && <p role="alert" className="mt-3 text-sm leading-6 text-amber-200">{error}</p>}
    <div role="status" aria-live="polite" className="sr-only">{loading ? 'Checking the saved test plan and simulating new-customer setup.' : report ? 'Eight simulated checks passed. Live activation remains disabled.' : ''}</div>
    {report && <div className="mt-4 min-w-0 rounded-xl border border-cyan-400/20 bg-gray-900 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Simulation only · No credits spent</p>
      <h5 className="mt-2 text-lg font-bold text-white">8 safety checks passed</h5>
      <p className="mt-2 text-sm leading-6 text-gray-300">Payment validation → package selection → provider verification → CRM update → login handoff.</p>
      <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-gray-500">Plan template</dt><dd className="mt-1 capitalize text-white">{report.plan.tier} · {report.plan.connections} connection{report.plan.connections === 1 ? '' : 's'}</dd></div>
        <div><dt className="text-gray-500">Provider duration</dt><dd className="mt-1 text-white">{report.plan.providerMonths} calendar month{report.plan.providerMonths === 1 ? '' : 's'}</dd></div>
        <div><dt className="text-gray-500">Expected cost of one real creation</dt><dd className="mt-1 font-semibold text-amber-300">{report.plan.expectedProviderCredits} Roomba credit{report.plan.expectedProviderCredits === 1 ? '' : 's'} · Not spent</dd></div>
        <div><dt className="text-gray-500">Real lines / CRM changes / messages</dt><dd className="mt-1 text-white">0 / 0 / 0</dd></div>
      </dl>
      <ul className="mt-5 space-y-3">{report.checks.map(check => <li key={check.id} className="flex items-start gap-2 text-sm leading-6 text-gray-300"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" /><span>{check.label}<span className="mt-0.5 block text-xs text-gray-500">{check.simulatedCreates} simulated creation{check.simulatedCreates === 1 ? '' : 's'} · {check.state === 'ready' ? 'Completed in simulation' : check.state === 'reconciliation_required' ? 'Stopped for review; no automatic resend' : 'Blocked before creation'}</span></span></li>)}</ul>
      <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-sm leading-6 text-amber-200">Live activation is disabled. Check the setup foundation below for durable storage and login configuration. Guarded live execution and your separate credit approval are still required. These simulations use memory-only adapters; they do not prove live provider or database behavior.</p>
      <p className="mt-3 text-xs leading-5 text-gray-500">Packages checked {new Date(report.catalogCheckedAt).toLocaleString()}. No payment was retried and no saved order was marked active.</p>
    </div>}
  </div>;
};
export default NewPaidSetupSimulation;
