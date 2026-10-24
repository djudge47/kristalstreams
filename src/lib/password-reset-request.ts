import { createPasswordResetRequestController } from './password-reset-request-controller';
import { hasSupabaseConfig, supabase } from './supabase';

// Cached for this browser runtime so leaving/reopening the form cannot send a
// second request while the first SDK operation or local cooldown is pending.
export const passwordResetRequest = createPasswordResetRequestController(
  hasSupabaseConfig,
  window.location.origin,
  (email, options) => supabase.auth.resetPasswordForEmail(email, options),
);
