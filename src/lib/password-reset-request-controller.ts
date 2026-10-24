type RequestResult = { error: { status?: number } | null };
export interface ResetRequestState {
  status: 'idle' | 'pending' | 'accepted' | 'rejected' | 'uncertain' | 'unavailable';
  message: string | null;
  canStartAgain: boolean;
}
const unknown = 'The reset request could not be confirmed. Check your inbox before requesting another link. Leaving this page does not cancel a submitted request.';
const accepted = 'If this address is eligible for website password recovery, check its inbox and spam folder for a reset link. This response does not confirm email delivery.';

/** Public email request only. Never signs in, changes a password or checks
 * whether an account exists. The SDK owns the existing PKCE verifier flow.
 */
export function createPasswordResetRequestController(configured: boolean, origin: string, request: (email: string, options: { redirectTo: string }) => Promise<RequestResult>) {
  let state: ResetRequestState = { status: 'idle', message: null, canStartAgain: false };
  let pending = false, cooledDown = false, disposed = false;
  let deadline: number | undefined, cooldown: number | undefined;
  const listeners = new Set<() => void>();
  const publish = (status: ResetRequestState['status'], message: string | null = null) => {
    if (disposed) return;
    state = { status, message, canStartAgain: !pending && cooledDown && ['accepted', 'rejected', 'uncertain'].includes(status) };
    for (const listener of listeners) listener();
  };
  const refresh = () => publish(state.status, state.message);

  return {
    getState: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async submit(value: string) {
      if (disposed || pending || state.status !== 'idle') return;
      const email = value.trim();
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+$/.test(email) || [...email].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
        publish('idle', 'Enter a valid website account email address.'); return;
      }
      let redirectTo: string;
      try {
        const url = new URL(origin);
        if (!['https:', 'http:'].includes(url.protocol) || url.origin !== origin) throw new Error('origin');
        redirectTo = `${url.origin}/reset-password`;
      } catch { publish('unavailable', 'Website password recovery is unavailable here. Open the Kristal Streams website or contact support.'); return; }
      if (!configured) { publish('unavailable', 'Website password recovery is unavailable here. Open the Kristal Streams website or contact support.'); return; }
      pending = true; cooledDown = false; publish('pending');
      let timer: number | undefined;
      cooldown = window.setTimeout(() => { cooldown = undefined; cooledDown = true; refresh(); }, 60_000);
      const transport = Promise.resolve().then(() => request(email, { redirectTo })).finally(() => { pending = false; refresh(); });
      try {
        const timeout = new Promise<never>((_, reject) => { timer = window.setTimeout(() => reject(new Error('timeout')), 20_000); deadline = timer; });
        const result = await Promise.race([transport, timeout]);
        // A local timeout has already published uncertainty. A late SDK result
        // can release the explicit new-draft gate, never overwrite that outcome.
        if (disposed) return;
        if (result?.error === null) publish('accepted', accepted);
        else if (result?.error?.status === 429) publish('rejected', 'Too many reset requests. Wait before trying again, or contact support.');
        else if (result?.error?.status && result.error.status >= 400 && result.error.status < 500) publish('rejected', 'This reset request was not accepted. Check the email address, wait and try again, or contact support.');
        else publish('uncertain', unknown);
      } catch { publish('uncertain', unknown); }
      finally { window.clearTimeout(timer); if (deadline === timer) deadline = undefined; }
    },
    startAgain() {
      if (disposed || !state.canStartAgain || pending) return;
      cooledDown = false; publish('idle');
    },
    dispose() { disposed = true; window.clearTimeout(deadline); window.clearTimeout(cooldown); listeners.clear(); },
  };
}
