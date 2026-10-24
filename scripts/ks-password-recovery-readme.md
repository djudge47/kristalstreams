# Website password recovery readiness and account binding

The previous reset page showed an expired-link message before session initialization completed. Any signed-in session enabled its form, readiness survived sign-out, and an unguarded update targeted whichever account the main SDK client held at dispatch. Duplicate submissions, delayed checks and unmounts were unbounded, and raw Auth errors reached the page.

An application-lifetime observer now loads before App/lazy routes. Only the SDK's `PASSWORD_RECOVERY` event establishes a private in-memory recovery grant. An ordinary initial/signed-in session, query-string flag or previously persisted login does not establish recovery readiness. The SDK still handles the existing PKCE exchange; the application does not parse callback credentials or exchange a code itself. Initialization displays Checking and is bounded at twenty seconds, with a next-task grace for the SDK's recovery notification. Auth callbacks only update local state; they never await SDK methods while the Auth lock may be held.

The grant requires a confirmed non-anonymous email identity with a UUID. Same-session initialization/focus events preserve it, same-owner token refresh replaces its private token copy, and sign-out, changed identity/session or main-account updates revoke it. Tokens are not exposed in the subscribable view, written into an additional persistent store or logged. The main SDK's existing persistence and PKCE configuration remain unchanged.

Submission validates password length/confirmation and synchronously blocks duplicates. It checks the captured main owner, initializes the existing memory-only isolated-client factory with the recovery session, independently verifies its owner, and rechecks the main owner before dispatch. The password PUT uses only the isolated client and its captured owner, so a later main-account switch cannot redirect it. This shared factory disables persistence, auto-refresh and URL detection. The recovery path deliberately does **not** sign out that borrowed session: revoking it would revoke the actual website recovery session. Current-password Security verification still creates and locally revokes its own separate sign-in session; that workflow is unchanged.

Success requires a matching confirmed returned owner. Known weak/same-password rejections offer explicit correction without replay. Other rejected, missing, foreign, timed-out or lost update results remain conservatively uncertain and block resubmission in this browser runtime. Twenty seconds bounds local waiting, not server execution; an already dispatched SDK write is not undone or cancelled. Every late preflight result checks current revision, mount and phase before proceeding. Changed accounts/unmounts cannot show the prior account's success. The form clears sensitive inputs at dispatch, disables the whole fieldset while pending and remounts on a changed recovery revision. Status/error messages are fixed and accessible; raw Auth errors are never displayed.

After success the page explicitly says to use the new password on the next sign-in, with a real Sign in link. It does not claim to have signed out the main or all other sessions. The grant is consumed. A full reload without a fresh SDK recovery event intentionally requires a new reset link, or the existing Security flow for an already signed-in account; a persisted flag/session is not used to reconstruct recovery proof. Cross-device/email-template/redirect delivery and real owner recovery remain outside these fictional tests. No global Auth enforcement change is claimed: these are this website's recovery UI and update-binding rules.

## Verification

```
node scripts/test-ks-password-recovery.mjs
node scripts/test-ks-website-password.mjs
npm run check
node scripts/test-ks-framework-upgrade.mjs
```

Five actual-controller/installed-SDK groups cover checking/grant readiness, invalid identities/inputs, memory-only owner-pinned request order, duplicate submissions, session changes and unmounts before/after dispatch, twenty-second deadlines and late results, definite password-policy rejection, ambiguous response locking, returned-owner validation and disposal. Their fetch adapter allows only fictional Auth user GET/PUT paths and never falls back to real network. Main reads are fictional; no real session is retrieved.

The existing real-production-code Chromium fixture adds a complete 320px PKCE recovery-code exchange through the installed SDK, lazy-route readiness, cleared/disabled inputs during a held update, matching success, no overflow, normal/signed-out denial, and reload without a fresh grant. Its external origins stay blocked. The original three profile/reply/ticket writes remain independently validated; exactly one separately constrained fictional PKCE POST and one password PUT are added. No arbitrary Auth write, recovery-email send or real service access is allowed. CI runs both the new suite and all preceding account/support/CRM/financial/native fixtures.

The complete generated stylesheet retains the reviewed `c4d0cdb8af063ddae829b2f656eee490d594122774f6c94a5971b60136eab241` baseline. Dependencies, Auth configuration, database/schema/grants, existing account credentials, customer records, financial/provider execution flags, CRM/XUI integration and the installed native APK are unchanged. Production release evidence is recorded in the completion audit and PR after all seven exact-commit workflows pass.

Primary guidance reviewed: Supabase's [password-based Auth guide](https://supabase.com/docs/guides/auth/passwords), [Auth initialization reference](https://supabase.com/docs/reference/javascript/auth-initialize), [changelog](https://supabase.com/changelog), and the installed Auth SDK source for initialization, PKCE exchange, Auth notifications, setSession and updateUser. The upcoming TLS cipher retirement is a separate compatibility follow-up and requires no configuration or APK change for this repair.
