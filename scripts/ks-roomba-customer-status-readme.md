# CRM customer → XUI status (Preview)

Each customer card in `/admin/crm` has **Check XUI status**. This manually reads
the current provider line; it does not replace the saved CRM badges or billing
dates. The saved trial receipt link remains unchanged.

`GET /api/ks-roomba-crm?view=customer-status&customerId=<CRM UUID>`:

- Verifies a confirmed, non-anonymous administrator with Supabase `getUser` on
  every request. Only the active Kristal Stream project is accepted.
- Selects only `id,external_id,username` from the saved CRM customer. It never
  reads a CRM password or direct XUI URL. Browser-supplied panel IDs, usernames,
  provider URLs and actions are ignored.
- Uses the existing HTTPS/Fixie transport for documented `user_info` and
  `get_line` GET actions. The returned line ID and username must match the CRM;
  its reseller must match the current API account. A mismatch returns a fixed
  verification failure and no line data.
- The streaming provider reader discards passwords and unrelated fields. The
  browser receives only customer ID, line ID, username, expiry, connection
  allowance, trial/enabled flags, check time and access-period status.
- Requires `VERCEL_ENV=preview`, existing Supabase anon/service keys and existing
  Roomba/Fixie settings. No new environment flags or migrations are required.
  Production and development reject the route.
- Coalesces concurrent checks of the same identity; caps the warm cache at 100
  entries with a 60-second lifetime. Auth and the CRM identity are rechecked
  before cache use. Expiration is recalculated even on cache hits. A warm
  instance permits one upstream check at a time and backs off for 30 seconds;
  this is not a distributed rate limiter. There is no automatic polling.

Enabled and within the service period does **not** establish playback, online
presence, active connection count, payment, or successful setup. Unlimited or
otherwise unsupported provider expiry/bouquet formats fail verification rather
than guessing. No bulk `get_lines` import is used because that endpoint has not
been verified for this reseller API.

This step makes no database writes, creates no lines, renews nothing, sends no
mail, and spends no credits. Two-way mutations remain a separate reviewed step.

## Verification

`node scripts/test-ks-roomba-customer-status.mjs` exercises authorization, project
and method gates, minimal CRM selection, server-side line selection, identity
and reseller mismatch, safe field output, expiry/disable semantics, cache and
concurrency, failures, and the actual streaming transport with synthetic bodies.
Existing admin, transport, line and CRM receipt tests are retained.

Local build passed on October 21, 2026. The repository-wide TypeScript check has
pre-existing failures in unrelated files. Scoped ESLint requires explicit
`no-unused-expressions` options because the installed ESLint/plugin combination
throws while loading that rule with its current default configuration.

Read-only connected database validation found 19 CRM customers with saved line
references. This confirms the schema/data shape only, not provider ownership.
Vercel access works with the explicit project ID and its existing connection;
the earlier team-scoped 403 did not require reconnecting. The first Preview
failed because a thirteenth API file exceeded the Hobby function limit. The
status check now shares the existing CRM API file under `view=customer-status`,
keeping twelve functions. The default saved-receipt GET and POST remain routed
to their original handler. Live signed-in admin verification is still pending.
