# Connected disabled live renewal verification

Verified October 21, 2026, approximately 9:42 PM America/New_York
(October 22, 01:42 UTC), on active Kristal Stream project
`wftfxerblhlsxiijtfbo` only.

The approved installation succeeded through the migration connector as version
`20261022014159`, name `ks_crm_live_renewal_disabled_foundation`. An initial
connector request expired before applying; migration history and object absence
were checked before the successful retry. No installation was applied twice.
The recorded migration copy and installation source have identical SHA256:
`68b8ff045f1812171d9fbd85653d9b40ca3a8bcee2a5f033d77ecaa867985c23`.

All eight conditions in the unchanged SELECT-only installation verifier passed:

- Live execution is disabled.
- Test execution is disabled.
- Service role cannot insert, update or delete the live control.
- All six live tables have RLS and no browser-role data access.
- All ten live functions are private, service-callable invokers with empty search paths.
- All four reservation protocols retain their enabled exclusion triggers.
- The shared guard matches the reviewed source hash.
- No live approval, operation, line version, reservation or completion exists.

Before/after SELECT checks matched for all 19 customers' checked identity,
expiry, package and billing fields and the existing test approval/operation.
The comparison excluded passwords, line URLs, claim tokens and signing secrets.
The single saved test remained intact; test line-version, reservation and
completion counts stayed zero, as did both existing setup reservation counts.
Customer-field digest: `708618eff91e08403b126c98b28524d461816516c5b885046fb9bec4a32e597a`.
Test-approval digest: `11e4faf341fb4fd2b4a9963aada9245cfd9833b34521e4256dfa8ce81cfa51c0`.
Test-operation digest: `67b5bd103f43a851075d92f0797d920ef3f58b5550be011586992420eb4b9481`.

Security and performance advisor warnings matched the pre-install baseline.
Expected informational changes were six additional private no-policy RLS tables
and three initially unused indexes. No new unindexed foreign key was reported.
Existing unrelated warnings were not changed. Reference:
[private no-policy tables](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index),
[existing Auth protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection),
[existing policy performance warning](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan).

The exact SQL passed 80 isolated PGlite checks before installation. All five CI
workflows passed at source commit `e1bded9b035b1b1ba5396b157991715d30b52869`,
including native PostgreSQL 17.6/17.11 and the app checks. Native renewal run:
https://github.com/djudge47/kristalstreams/actions/runs/39701325708 .

This verifies the disabled database foundation. It does not establish an actual
provider renewal or a signed-in deployed-browser result. No signing key was
provisioned, server release enabled, provider request sent, credit spent or
Production deployment promoted. The separately approved controlled provider
test still needs a selected customer, current term/cost and explicit approval.
Credential retention and exact calendar/DST behavior remain unverified.
