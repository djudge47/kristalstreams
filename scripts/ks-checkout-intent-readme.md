# Authenticated checkout intent — prepared, disabled

A checkout must identify the authenticated purchaser, canonical plan and declared
service purpose before its Stripe payment URL is returned. This change adds that
binding for a separately gated Preview checkout. It authorizes no Roomba work.

## Behavior

- `api/checkout.js` still authenticates with Supabase `getUser`, verifies the
  profile and validates the submitted plan against the server catalog.
- The new path additionally requires a confirmed, non-anonymous account and an
  explicit `new_service`, `renewal` or `requires_review` choice. A new-service
  declaration is customer intent, **not** proof of new-customer eligibility.
  Existing customer-history and policy checks remain mandatory downstream.
- A private immutable request saves the verified owner/email, server-derived
  price/duration/connections, purpose and validated return origin. SQL derives
  the financial terms independently; tests compare all twenty catalog entries.
- Stripe creation uses a persisted request UUID and owner-derived idempotency key.
  Parameters, integration identifier and one-hour expiry remain identical on an
  exact retry. Only pending requests less than twenty minutes old can call create;
  older unresolved operations require reconciliation rather than a replacement.
- The current Stripe session is retrieved before returning a URL. Only a matching
  open, unpaid test session on `https://checkout.stripe.com` is eligible.
- One database transaction inserts the existing private purchase intent and binds
  the request to that session. A failed or lost acknowledgement returns no URL;
  an exact retry recovers the same committed binding/session. Existing intents
  are never adopted or overwritten.
- Marked bound payments pass an additional database-backed owner/plan/purpose
  check before the existing receipt, queue and notification flow. Both the
  signed webhook and owner confirmation use that shared flow. This does not
  replace the legacy payment recorder or enable provider dispatch.
- Browser session storage retains the request UUID across errors, cancellation
  and reloads. Only a confirmed matching receipt clears its saved reference.
  This is retry protection within that tab, not global deduplication across
  devices, cleared storage, different plans/purposes or newly opened tabs.

## Rollout boundary

The migration was generated with Supabase CLI 2.121.0 and tested only in an isolated
PGlite database. It has **not** been applied to the connected project. No environment
variable was set, no deployment promoted and no activation policy created.

Both `KS_CHECKOUT_INTENT_ENABLED=true` on the server and
`VITE_KS_CHECKOUT_INTENT_ENABLED=true` at client build time are required for the new
flow. Their defaults are off. The server additionally requires Preview and test
payment mode; production cannot use this binding version. An enabled server
rejects clients missing the choice/request ID. A new client hitting a disabled
server receives an error, with no fallback to an unbound checkout.

The ledger, RPCs and trigger use RLS, explicit service-only grants, invoker
privileges and an empty function search path. No extra Auth table read grant or
security-definer function is introduced. Account confirmation comes from the
server's verified Auth response; SQL separately matches its profile/email.

The SQL request row is locked for binding and is unique by owner/request; session
IDs are also unique. A bound row cannot be rebound, reset or deleted. The existing
purchase-intent immutability guard remains unchanged. No historical intent is
backfilled. Before a later Preview enablement, connected schema/ACL verification
and an approved Stripe test with actual webhooks/browser behavior remain needed.

General automatic activation, trial conversion, renewal execution, real-credit
authorization and the production payment-only entitlement correction remain
separate unfinished work. No new execution adapter or API entrypoint is added.

## Verification

With isolated `@electric-sql/pglite@0.5.10` available, set `KS_PGLITE_MODULE` to its
`dist/index.js` file URL, then run:

```sh
node scripts/test-ks-checkout-intent.mjs
node scripts/test-ks-checkout-attempt.mjs
node scripts/test-ks-checkout-view.mjs
node scripts/test-ks-checkout-origin.mjs
```

The SQL suite runs the exact new migration against eight hash-verified foundation
scripts. Stripe is an in-memory fixture with idempotency behavior. It covers lost
reservation/create/bind replies, real SQL rollback of an intent insert, immutable
history, changed purchaser/plan/purpose, completed/expired sessions, private grants,
production/anonymous/unconfirmed rejection and no provider/budget side effects.
PGlite uses one SQL session; overlapping JavaScript calls are not native connection
contention, deadlock or real Stripe evidence. Initial UI rendering uses a payment
module fixture and does not simulate browser clicks.

The Vite build and targeted lint checks pass. Existing ESLint/TypeScript plugin
compatibility requires explicit options for `@typescript-eslint/no-unused-expressions`
in the targeted lint command; no package or lint configuration was changed.
Full TypeScript diagnostics match the unchanged `d77bcb5` baseline exactly; the
repository-wide type check retains its 45 existing diagnostics. Existing handoff, receipt, pending-order,
automatic-review and payment-presentation regression suites also pass.

Results: 25 isolated SQL/checkout checks, 6 browser-storage retry checks, 2 initial
render checks and 10 origin checks passed, along with 96 existing regression
checks. No actual Stripe API request, email, charge or provider operation was made
by these tests. Both the default-off and client-flag-enabled Vite builds pass.
