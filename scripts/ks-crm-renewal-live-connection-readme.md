# Protected CRM renewal connection

The existing CRM function now routes four Preview-only renewal views to the
authenticated live bridge. No extra function file is added. The shared API body
limit is 2 KB; each handler retains its own smaller strict body/schema checks.
Existing test approvals remain separate and cannot authorize live dispatch.

## Source and supported operation

Request and response fields follow the supplied
`xui-one-1.5.5-reseller-api(1).md`, uploaded October 14, 2026, sections “Renew a
paid line” and “Responses and integration notes.” The guide documents multipart
`edit_line&id=LINE_ID`, the active same-package renewal fields and a returned
line in `data`. The approved endpoint remains the configured HTTPS Roomba URL.
Package IDs and actual selected groups come from fresh account/line/package
reads, never guide examples. Expired service, trials, package changes and altered
groups/allowance remain outside this path.

`ks-crm-renewal-live-provider.js` validates/copies only the documented preserving
form and sends one multipart POST through strict TLS Fixie. Redirects, retries,
alternate endpoints, direct fallback and non-documented fields are rejected.
Streaming readers discard provider passwords, keys and raw metadata. Only safe
normalized DTOs reach the executor. This does not prove that omitted provider
credentials remain unchanged; that still needs the controlled provider test.
Ten-second per-call limits and a 48-second provider budget bound a request below
the existing 60-second function duration. Any uncertainty retains durable state.

## HTTP and UI

- `renewal-live-readiness`: authenticated GET; checks configuration and gates.
  It sends no provider requests and does not assert connectivity or live access.
- `renewal-live-review`: same-origin JSON POST with CRM customer UUID and both
  confirmations; reads a fresh full snapshot, issues dedicated live consent and
  returns the exact term/cost/allowance/selection for a second explicit review.
  It writes no approval or dispatch record.
- `renewal-live-execute`: same-origin JSON POST with the original signed token,
  CRM customer UUID and both confirmations; invokes the protected executor.
  Neither endpoint accepts a client-supplied line, package, cost or destination.
- `renewal-live-status`: same-origin authenticated POST with the same signed
  identity. Reads only the live ledger, even with execution disabled and after
  consent expiry. It never constructs a provider adapter or resumes dispatch.

Every view uses `auth.getUser` and the confirmed, non-anonymous Kristal Streams
owner allowlist. Service access is fixed to project `wftfxerblhlsxiijtfbo`. No
claim, service key, raw provider error or private ledger plan is returned.

The CRM row adds **Protected live renewal → Check renewal readiness**. A source
renewal review must be displayed before preparing a live review; the returned
fresh live quote clears confirmations and requires them again before sending.
Production is unavailable. An off or unreadable gate never exposes a usable
send control. API state remains authoritative if a page is stale.

Before an execute request, the UI saves its original signed attempt in versioned
tab session storage. A reload restores status controls and prevents replacing
an uncertain attempt with a new one. Storage failure blocks the send. Verified
results can finish only CRM completion; uncertain states offer status and
reconciliation. A missing record is closable only after authenticated server
lookup confirms absence beyond the consent deadline plus a one-minute margin.
Only a confirmed completion removes a pending reference automatically.

## Deployment boundary

This change does not install the live SQL draft, provision a signing key, change
environment values, enable either SQL switch, promote Production or send a real
renewal. `fixtures/ks-crm-renewal/live.sql` remains hard guarded to the disposable
test database and is not a connected installation migration.

The route requires all of these before live execution: a separately reviewed
live installation, test SQL execution **off**, live SQL execution **on**, a
server-only `KS_CRM_LIVE_RENEWAL_ENABLED=true` release, a dedicated random 32-byte
lowercase hex `KS_CRM_LIVE_RENEWAL_CONSENT_KEY`, and the existing approved provider
configuration. No signing-key fallback to the Preview secret exists. Do not
enable sending merely to exercise the readiness UI. A controlled real renewal
still requires approval of its exact current customer, duration and credit cost;
credential retention and exact calendar/DST semantics remain unverified.

## Evidence

Tests cover the real React click/hook/fetch path through the real shared route,
Auth checks, executor and service adapter into actual isolated SQL. Native CI
adds PostgreSQL 17.6/17.11 independent-session contention and rollback checks.
Provider writes in all tests are fictional. A separate transport suite validates
the real request builder/streaming normalizer against injected HTTP responses,
including secrets, redirects, malformed responses and accepted timeouts.

This is synthetic UI/HTTP/SQL verification, not a signed-in deployed-browser
test or proof of an actual provider renewal. Connected verification remains
SELECT-only, and existing app, CRM/customer and XUI data remain untouched.
