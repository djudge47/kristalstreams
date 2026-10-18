import Stripe from 'stripe';
import { createGuardedPaidExecutor } from './ks-guarded-paid-executor.js';
import { createPaidExecutionStore } from './ks-paid-execution-store.js';
import { createPaidProviderAdapter } from './ks-paid-provider.js';

// Internal constructor only. No deployed route/webhook constructs or invokes this worker.
// An authenticated, bounded approval entrypoint still needs a separately approved release.
export function createInternalPaidSetupWorker({ admin, env = process.env } = {}) {
  const key = env.STRIPE_SECRET_KEY;
  if (env.VERCEL_ENV !== 'preview' || typeof key !== 'string' || !/^[sr]k_test_[A-Za-z0-9]+$/.test(key)) throw new Error('preview_paid_worker_unavailable');
  const stripe = new Stripe(key, { apiVersion: '2026-08-26.dahlia', timeout: 15000, maxNetworkRetries: 0 });
  const execute = createGuardedPaidExecutor({ env, store: createPaidExecutionStore(admin, env), provider: createPaidProviderAdapter({ env }),
    payments: { retrieve: id => stripe.checkout.sessions.retrieve(id, { expand: ['payment_intent.latest_charge'] }) } });
  return async ({ accessToken, ...input }) => {
    if (typeof accessToken !== 'string' || !accessToken || /\s/.test(accessToken)) throw new Error('administrator_sign_in_required');
    const { data, error } = await admin.auth.getUser(accessToken);
    const user = data?.user;
    if (error || !user?.id || user.is_anonymous || !user.email_confirmed_at || user.email?.toLowerCase() !== 'djudge47@gmail.com') throw new Error('administrator_sign_in_required');
    return execute({ ...input, approverId: user.id });
  };
}
