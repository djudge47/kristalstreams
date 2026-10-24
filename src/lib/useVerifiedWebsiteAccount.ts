import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { portalUuid } from '../../_shared/ks-customer-crm.js';

type AccountState = { status: 'loading' | 'ready' | 'signed_out' | 'unconfirmed' | 'unavailable'; accountId: string | null };
const initial: AccountState = { status: 'loading', accountId: null };

export function useVerifiedWebsiteAccount() {
  const [state, setState] = useState<AccountState>(initial);
  const active = useRef(false);
  const generation = useRef(0);
  const timer = useRef<number | undefined>();
  const check = useCallback(async () => {
    if (!active.current) return;
    window.clearTimeout(timer.current);
    const version = ++generation.current;
    setState(initial);
    const deadline = window.setTimeout(() => { if (active.current && version === generation.current) { generation.current += 1; setState({ status: 'unavailable', accountId: null }); } }, 20000); timer.current = deadline;
    try {
      const result = await supabase.auth.getUser();
      if (!active.current || version !== generation.current) return;
      if (result.error?.name === 'AuthSessionMissingError' || (!result.error && !result.data.user)) {
        setState({ status: 'signed_out', accountId: null }); return;
      }
      if (result.error) throw Error('account_check_failed');
      const user = result.data.user;
      if (!user || user.is_anonymous || !portalUuid(user.id)) {
        setState({ status: 'signed_out', accountId: null }); return;
      }
      if (!user.email_confirmed_at) { setState({ status: 'unconfirmed', accountId: null }); return; }
      setState({ status: 'ready', accountId: user.id });
    } catch {
      if (active.current && version === generation.current) setState({ status: 'unavailable', accountId: null });
    } finally { window.clearTimeout(deadline); }
  }, []);

  useEffect(() => {
    active.current = true;
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (!active.current) return;
      generation.current += 1; window.clearTimeout(timer.current);
      // Clear the previous identity before checking any replacement account.
      setState(initial);
      queueMicrotask(() => { if (active.current) void check(); });
    });
    return () => { active.current = false; window.clearTimeout(timer.current); subscription.unsubscribe(); };
  }, [check]);

  return { ...state, retry: check };
}
