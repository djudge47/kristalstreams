import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { portalUuid } from '../../_shared/ks-customer-crm.js';

type AccountState = { status: 'loading' | 'ready' | 'signed_out' | 'unconfirmed' | 'unavailable'; accountId: string | null };
const initial: AccountState = { status: 'loading', accountId: null };

export function useVerifiedWebsiteAccount() {
  const [state, setState] = useState<AccountState>(initial);
  const active = useRef(false);
  const generation = useRef(0);
  const check = useCallback(async () => {
    const version = ++generation.current;
    setState(initial);
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
    }
  }, []);

  useEffect(() => {
    active.current = true;
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      generation.current += 1;
      // Clear the previous identity before checking any replacement account.
      setState(initial);
      queueMicrotask(() => { if (active.current) void check(); });
    });
    return () => { active.current = false; subscription.unsubscribe(); };
  }, [check]);

  return { ...state, retry: check };
}
