import { createPasswordRecoveryController } from './password-recovery-controller';
import { createPasswordVerificationClient, supabase } from './supabase';

// Subscribe at application startup, before React's lazy recovery route mounts.
// Both isolated password workflows use nonpersistent clients; recovery never
// signs its borrowed session out or stores an additional credential copy.
export const passwordRecovery = createPasswordRecoveryController(
  supabase.auth,
  () => createPasswordVerificationClient().auth,
);
