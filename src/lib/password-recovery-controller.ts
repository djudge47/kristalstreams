import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

type Auth = SupabaseClient['auth'];
type RecoveryStatus = 'checking' | 'unavailable' | 'ready' | 'submitting' | 'complete' | 'uncertain';
export interface RecoveryState { status: RecoveryStatus; revision: number; message: string | null }
const unavailable = 'Open a new website password-reset link from your email. If you are already signed in, you can change your website password in Security.';
const uncertain = 'The password-reset result could not be confirmed. Try signing in with your new website password before requesting another reset. Do not submit this change again.';
const ownerId = (user: User | null | undefined) => user && !user.is_anonymous && user.email && user.email_confirmed_at && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(user.id) ? user.id : null;

export const recoveryPasswordError = (password: string, confirmation: string) => {
  if (password.length < 8) return 'Use at least 8 characters for your new website password.';
  if (password !== confirmation) return 'The passwords do not match.';
  return null;
};

/** One browser-lifetime observer catches recovery before the lazy route mounts.
 * Only the SDK recovery event creates a grant. Tokens stay private in memory;
 * neither route parameters nor an ordinary signed-in session create a grant.
 */
export function createPasswordRecoveryController(main: Pick<Auth, 'getUser' | 'onAuthStateChange'>, createIsolated: () => Pick<Auth, 'setSession' | 'getUser' | 'updateUser'>) {
  let state: RecoveryState = { status: 'checking', revision: 0, message: null };
  let grant: { owner: string; access_token: string; refresh_token: string } | null = null;
  let disposed = false;
  let ambiguousWrite = false;
  let writePending = false;
  const listeners = new Set<() => void>();
  const publish = (status: RecoveryStatus, message: string | null = null, revision = state.revision) => {
    if (disposed) return;
    state = { status, message, revision };
    for (const listener of listeners) listener();
  };
  let initialTimer: number | undefined = window.setTimeout(() => publish('unavailable', unavailable), 20_000);
  const clearInitial = () => { window.clearTimeout(initialTimer); initialTimer = undefined; };
  const revoke = () => {
    clearInitial(); grant = null;
    if (!ambiguousWrite) publish('unavailable', unavailable, state.revision + 1);
  };
  const { data: { subscription } } = main.onAuthStateChange((event, session: Session | null) => {
    if (disposed) return;
    const owner = ownerId(session?.user);
    if (event === 'PASSWORD_RECOVERY') {
      clearInitial();
      if (ambiguousWrite || writePending) return;
      if (!owner || !session?.access_token || !session.refresh_token) { revoke(); return; }
      grant = { owner, access_token: session.access_token, refresh_token: session.refresh_token };
      publish('ready', null, state.revision + 1);
    } else if (grant) {
      if (!owner || owner !== grant.owner || event === 'SIGNED_OUT' || event === 'USER_UPDATED') { revoke(); return; }
      if (event === 'TOKEN_REFRESHED' && session) {
        grant = { owner, access_token: session.access_token, refresh_token: session.refresh_token };
      } else if (event === 'SIGNED_IN' && session?.access_token !== grant.access_token) revoke();
    } else if (state.status === 'checking' && event === 'INITIAL_SESSION') {
      // The SDK may schedule PASSWORD_RECOVERY immediately after initialization.
      clearInitial(); initialTimer = window.setTimeout(() => { initialTimer = undefined; if (state.status === 'checking') publish('unavailable', unavailable); }, 0);
    }
  });

  return {
    getState: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async submit(password: string, confirmation: string, isMounted: () => boolean) {
      if (disposed || ambiguousWrite || writePending || state.status !== 'ready' || !grant) return;
      const invalid = recoveryPasswordError(password, confirmation);
      if (invalid) { publish('ready', invalid); return; }
      const captured = { ...grant }, revision = state.revision;
      let updateStarted = false;
      let timer: number | undefined;
      const current = () => !disposed && isMounted() && state.revision === revision && state.status === 'submitting';
      const check = () => { if (!current()) throw new Error('changed'); };
      publish('submitting');
      const operation = async () => {
        const before = await main.getUser(); check();
        if (before.error || ownerId(before.data.user) !== captured.owner) throw new Error('changed');
        const isolated = createIsolated();
        const initialized = await isolated.setSession({ access_token: captured.access_token, refresh_token: captured.refresh_token }); check();
        if (initialized.error || ownerId(initialized.data.user) !== captured.owner) throw new Error('changed');
        const verified = await isolated.getUser(); check();
        if (verified.error || ownerId(verified.data.user) !== captured.owner) throw new Error('changed');
        const beforeWrite = await main.getUser(); check();
        if (beforeWrite.error || ownerId(beforeWrite.data.user) !== captured.owner) throw new Error('changed');
        // This client is pinned to the recovery account even if the main account
        // changes after dispatch. No update is ever sent through the main client.
        updateStarted = true; writePending = true;
        const result = await isolated.updateUser({ password }); check();
        if (result.error) {
          if (result.error.code === 'weak_password' && result.error.status === 422) return 'Choose a stronger website password that meets your account requirements.';
          if (result.error.code === 'same_password' && result.error.status === 422) return 'Choose a password different from your current website password.';
          // A rejection or lost response must never trigger an automatic retry.
          throw new Error('update');
        }
        if (ownerId(result.data.user) !== captured.owner) throw new Error('update');
        return null;
      };
      try {
        const deadline = new Promise<never>((_, reject) => { timer = window.setTimeout(() => reject(new Error('timeout')), 20_000); });
        const message = await Promise.race([operation(), deadline]);
        if (!current()) return;
        if (message) publish('ready', message);
        else { grant = null; publish('complete'); }
      } catch {
        // Deadlines stop local waiting, not an already dispatched Auth request.
        // Keep that uncertainty locked even if a later Auth event arrives.
        if (updateStarted) ambiguousWrite = true;
        if (disposed || state.revision !== revision) return;
        grant = null;
        publish(updateStarted ? 'uncertain' : 'unavailable', updateStarted ? uncertain : unavailable, isMounted() ? revision : revision + 1);
      } finally {
        window.clearTimeout(timer);
        if (updateStarted) writePending = false;
        // Do not sign out this isolated client: it borrowed the recovery session,
        // so revoking it would also revoke the website's actual recovery session.
      }
    },
    dispose() { disposed = true; grant = null; clearInitial(); subscription.unsubscribe(); listeners.clear(); },
  };
}
