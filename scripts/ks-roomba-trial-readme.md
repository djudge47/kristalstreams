# Controlled Preview trial

The private `/admin/setup` review offers a separate controlled trial action for package ID 1 only: 36 hours, zero reseller credits and one connection. Paid package drafts remain preparation only.

Creation is **off by default**. `ROOMBA_TRIAL_CREATE_ENABLED` must equal the exact string `true` in Preview before the final checkbox/button can submit. Do not enable it or create a provider line until Donald approves the concrete final review. Production is rejected before external calls. This change does not connect customer payments or free-trial requests to provider provisioning.

`GET /api/ks-roomba-trial` checks saved status. `POST` with `operation: review` refreshes provider package/account details and returns a five-minute signed approval binding the verified admin, proposed credentials, channel selections and reseller account. Review performs no provider write. `operation: create` requires that approval plus `confirmed: true`; the server refreshes and compares provider details again.

Apply `scripts/ks-roomba-trial-schema.sql` once to the website database before enabling the feature. The server also needs its existing `SUPABASE_SERVICE_ROLE_KEY`. Browser callers never receive this key. Authorization uses server-verified `auth.getUser` and the existing confirmed administrator identity; editable profile/user metadata is ignored.

The database has one unique attempt slot across deployments. An atomic INSERT claims it before the only provider POST. A matching successful replay returns the saved receipt. Concurrent requests cannot both submit. Timeout, malformed response, provider rejection/redirect or uncertain receipt persistence leaves the slot locked. There is no retry/reset/delete endpoint and the service role has no DELETE grant. Any ambiguous attempt requires manual reseller-panel review. Never remove the guard to retry blindly.

Provider calls use the fixed HTTPS endpoint through the existing verified TLS Fixie proxy, no redirects or direct fallback. Only documented multipart `create_line` fields are submitted. The response reader discards passwords and unrelated values; a success needs the expected username, reseller, trial flag, connection count, expiry and line ID. Passwords remain browser memory only. The saved receipt contains no credentials; status recovery cannot recover a password.

Validation: `node scripts/test-ks-roomba-trial.mjs` uses synthetic Auth, provider and storage dependencies. The database unique-key/role test runs inside a rolled-back transaction, leaving zero attempt rows. The informational [RLS enabled without policies advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) is intentional: this is a server-only table with all public/anon/authenticated grants revoked, not a browser-owned table.

Before the first real trial: verify the latest signed-in Preview review, obtain approval, enable only the intended Preview branch, redeploy, then confirm once. Afterwards disable creation again and verify the saved result and app login. Do not promote this prototype to Production.
