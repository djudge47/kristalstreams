# Verified website password changes

The Security form previously required a current password but submitted only the new password. It now verifies that current website password using an isolated Supabase client before updating the same confirmed Auth identity. This affects the website account only; no CRM or streaming password is edited.

The main client's `getUser` checks the confirmed non-anonymous owner before and after verification. A successful password sign-in must return that exact owner ID. Password updates run through that verified temporary client, so a later main-session account change cannot redirect the update to a different account. The component cancels pending pre-update work on account change or unmount, clears sensitive fields and suppresses stale results. Duplicate submissions are blocked synchronously with a ref.

The isolated client uses the existing project URL and browser-safe anon key with persistence, auto-refresh and URL session detection disabled, plus a separate storage key. Its local temporary session is signed out in `finally`; cleanup failure is best effort and never causes an update retry. The main client's sign-in, sign-out and password update are not called. No password or Auth error is logged or saved in browser storage by this workflow.

The installed Auth SDK is 2.69.1. Its `updateUser` implementation spreads attributes into the request, so a named, structurally typed object forwards the documented `current_password` alongside the new password without a cast, dependency upgrade or global Auth-setting change. The prior successful sign-in verifies the current password even where the project-wide current-password requirement is off. This is the reviewed form's verification flow, not proof that every other Auth entry point enforces that global policy. Recovery and other sign-in methods remain separate; the page directs those customers to website password recovery.

An accepted update is reported only after its returned owner matches. Definitive rejection and an uncertain update result are distinct. Network/server ambiguity tells the customer to check sign-in or recover access before another attempt. There is no automatic password retry or recovery-email send. The page does not promise that all other sessions were revoked.

## Verification

```
node scripts/test-ks-website-password.mjs
npm run check
```

Six offline groups use the actual factory, helper, Auth SDK and form with fictional transport. They cover validation and account eligibility, request ordering and both password fields, no browser persistence/main-session mutation, failed verification and owner mismatch, session change/cancellation, server rejection/uncertain outcomes, local-only cleanup, double submission, field clearing and unmount cleanup. All Auth responses are fixtures; no real account is signed in, password changed, email sent or database record accessed. Application quality CI runs this suite after a fresh install.

Current provider guidance reviewed: [password security](https://supabase.com/docs/guides/auth/password-security), [updateUser](https://supabase.com/docs/reference/javascript/auth-updateuser), and [changelog](https://supabase.com/changelog). The changelog's upcoming removal of old TLS 1.2 cipher suites is a separate device-compatibility follow-up, not a reason to alter this auth flow or redistribute an unverified APK.

Source/Preview repair only. No production promotion, project Auth configuration, schema, Edge deployment, customer/service record, payment, XUI operation or execution flag is changed.
