import { createPasswordVerificationClient, supabase } from './supabase';

export interface WebsitePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const passwordValidationError = ({ currentPassword, newPassword, confirmPassword }: WebsitePasswordInput) => {
  if (!currentPassword) return 'Enter your current website password.';
  if (newPassword !== confirmPassword) return 'New passwords do not match.';
  if (newPassword.length < 8) return 'Use at least 8 characters for your new website password.';
  return null;
};

class PasswordChangeError extends Error {}
const uncertain = 'The password-change result could not be confirmed. Try signing in with your new website password, or use password recovery before attempting another change.';

/** Called only from an explicit customer submission; never stores or logs inputs. */
export async function changeWebsitePassword(input: WebsitePasswordInput, stillCurrent: () => boolean) {
  const validation = passwordValidationError(input);
  if (validation) throw new PasswordChangeError(validation);
  const checkCurrent = () => {
    if (!stillCurrent()) throw new PasswordChangeError('Your account session changed. Sign in again before changing your website password.');
  };
  checkCurrent();
  let verification: ReturnType<typeof createPasswordVerificationClient> | null = null;
  let updateStarted = false;
  try {
    const initial = await supabase.auth.getUser();
    checkCurrent();
    const owner = initial.data.user;
    if (initial.error || !owner?.id || !owner.email || !owner.email_confirmed_at || owner.is_anonymous) {
      throw new PasswordChangeError('Sign in to your confirmed website account before changing its password.');
    }
    verification = createPasswordVerificationClient();
    const signedIn = await verification.auth.signInWithPassword({ email: owner.email, password: input.currentPassword });
    checkCurrent();
    if (signedIn.error || !signedIn.data.session || signedIn.data.user?.id !== owner.id) {
      throw new PasswordChangeError('Your current website password could not be verified. Check it or use website password recovery.');
    }
    // Recheck the main account after verification; update only the isolated,
    // verified account, never whichever account the main client holds later.
    const current = await supabase.auth.getUser();
    checkCurrent();
    if (current.error || current.data.user?.id !== owner.id || current.data.user.email !== owner.email) {
      throw new PasswordChangeError('Your account session changed. Sign in again before changing your website password.');
    }
    updateStarted = true;
    // The installed SDK forwards attributes unchanged. Its older type omits
    // this documented field; a named object preserves structural type checks.
    const attributes = { password: input.newPassword, current_password: input.currentPassword };
    const result = await verification.auth.updateUser(attributes);
    if (result.error) {
      const { code, status } = result.error;
      if (!status || status >= 500) throw new PasswordChangeError(uncertain);
      if (code === 'weak_password') throw new PasswordChangeError('Choose a stronger website password that meets your account requirements.');
      if (code === 'same_password') throw new PasswordChangeError('Choose a website password different from your current password.');
      throw new PasswordChangeError('Your website password was not changed. Sign in again or use website password recovery.');
    }
    if (result.data.user?.id !== owner.id) throw new PasswordChangeError(uncertain);
  } catch (error) {
    if (error instanceof PasswordChangeError) throw error;
    throw new PasswordChangeError(updateStarted ? uncertain : 'Your website password could not be verified. Check your connection and try again.');
  } finally {
    // Revoke only the temporary session. Cleanup failure cannot authorize a
    // retry or turn an accepted password update into a second update.
    if (verification) {
      try { await verification.auth.signOut({ scope: 'local' }); } catch { /* No credential/error logging. */ }
    }
  }
}
