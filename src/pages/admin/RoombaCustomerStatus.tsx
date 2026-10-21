import React, { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LineStatus {
  customerId: string; lineId: string; username: string; checkedAt: string; expiresAt: string;
  connectionsAllowed: number; trial: boolean; enabled: boolean; adminEnabled: boolean;
  access: 'expired' | 'disabled' | 'within_service_period';
}
interface Props { customerId: string; panelId: number; username: string }

const RoombaCustomerStatus: React.FC<Props> = ({ customerId, panelId, username }) => {
  const [line, setLine] = useState<LineStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    setLine(null); setError(null); setBusy(false);
    return () => { const request = controller.current; controller.current = null; request?.abort(); };
  }, [customerId, panelId, username]);

  const check = async () => {
    if (controller.current) return;
    const request = new AbortController(); controller.current = request;
    setBusy(true); setError(null); setLine(null);
    const timeout = window.setTimeout(() => request.abort(), 45000);
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session?.access_token) throw new Error('Please sign in again to your admin account.');
      const response = await fetch(`/api/ks-roomba-customer-status?customerId=${encodeURIComponent(customerId)}`, {
        method: 'GET', cache: 'no-store', signal: request.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null);
      if (controller.current !== request || request.signal.aborted) return;
      if (!response.ok) throw new Error(payload?.error || 'XUI status could not be checked.');
      const result = payload?.line;
      if (payload?.mode !== 'read-only' || payload.databaseWrites !== false || result?.customerId !== customerId
        || result.lineId !== String(panelId) || result.username !== username || !Number.isFinite(Date.parse(result.checkedAt))
        || !Number.isFinite(Date.parse(result.expiresAt)) || !Number.isInteger(result.connectionsAllowed)
        || ![result.trial, result.enabled, result.adminEnabled].every(value => typeof value === 'boolean')
        || !['expired', 'disabled', 'within_service_period'].includes(result.access)) throw new Error('The matching XUI status could not be verified.');
      setLine(result);
    } catch (failure) {
      if (controller.current === request) setError(request.signal.aborted ? 'The status check timed out. Try again shortly.'
        : failure instanceof Error ? failure.message : 'XUI status could not be checked.');
    } finally {
      window.clearTimeout(timeout);
      if (controller.current === request) { controller.current = null; setBusy(false); }
    }
  };
  const expired = line && Date.parse(line.expiresAt) <= Date.now();
  return <div className="border-t border-gray-800 px-4 py-3">
    <button type="button" disabled={busy} onClick={() => void check()}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-500/30 px-3 py-2 text-xs font-semibold text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
      {busy ? 'Checking XUI…' : 'Check XUI status'}
    </button>
    <div aria-live="polite" role="status">{line && <div className="mt-3 space-y-1 text-xs leading-5 text-gray-300">
      <p className="font-semibold text-cyan-300">{expired ? 'Expired' : line.access === 'disabled' ? 'Disabled' : 'Enabled · within service period'}{line.trial ? ' · Trial' : ''}</p>
      <p>Provider expires: {new Date(line.expiresAt).toLocaleString()}</p>
      <p>Connections allowed: {line.connectionsAllowed} · Line {line.enabled ? 'enabled' : 'disabled'} · Provider {line.adminEnabled ? 'enabled' : 'disabled'}</p>
      <p className="text-gray-400">Checked {new Date(line.checkedAt).toLocaleString()}. This does not confirm playback or whether the customer is online.</p>
    </div>}</div>
    {error && <p role="alert" className="mt-3 text-xs leading-5 text-amber-200">{error}</p>}
  </div>;
};

export default RoombaCustomerStatus;
