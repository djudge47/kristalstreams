# Atomic setup review reservation preparation

This proposed SQL is **uninstalled, unrouted and review-only**. It seeds no policy, package approval, checkout intent, budget or claim. Nothing calls the provider or changes an XUI balance. `ks_reserve_setup_review` always returns `may_dispatch:false` and `state:reserved_for_review`; it is not an execution claim or real-credit authorization. No existing API, database function, grant, environment setting, customer or paid test is modified.

## Stored boundaries

The proposal requires the staged receipt/queue schema and existing local new-customer/Preview guard tables. It adds six service-only RLS tables:

- Review policies pin a reseller/environment, review-only mode, immutable policy hash, at-most-24-hour window, per-order/day limits and minimum reserve. The runtime can read or irreversibly revoke a policy; it cannot create one, raise limits, change packages or undo revocation.
- Reviewed package rules pin tier/connections, package identity/fingerprint and maximum exact integer credit units. They are not a price retrieved from the provider; trusted backend review must still verify the current provider cost.
- Immutable purchase intents bind a checkout and purchaser to an authenticated new-service declaration or a renewal/review request. No browser has write access. The current checkout does not populate these rows yet.
- Daily budgets use physical reseller plus UTC day, shared across policies and environments. A new policy cannot reset the day's existing ceiling or spent/reserved totals. Spent values represent local bookkeeping, not all external reseller activity. The runtime can only increase reservations at this stage.
- Immutable claims bind one checkout, payment intent and new-service purchaser to one policy/package/cost/evidence snapshot. They contain no login or provider password. One claim per purchaser prevents another automatic new-service order from bypassing the renewal boundary.
- A physical-reseller slot permits one outstanding review claim across policies, UTC days and environments. The FK to the claim is deferred until transaction completion so it can be acquired in the claim's insert guard.

Policy/package setup belongs to a later separately reviewed control-plane operation. Every policy installed by this proposal would still be review-only; the schema cannot represent a dispatch-enabled mode. Service SELECT/INSERT and limited column UPDATE grants, RLS with no browser policies, empty function search paths, SECURITY INVOKER and immutable/delete guards protect the records. SQL reads no Auth user table or user-editable metadata. Auth confirmation must be freshly checked by the future backend using the existing admin API, not by adding Auth-table SELECT grants.

## Transaction

`ks_reserve_setup_review` takes the checkout/owner and pinned policy/package/cost/balance/UTC-day/evidence/hash fields. An exact replay returns the original reservation without adding credits again; changed bindings stop. The candidate hash is an audit binding, never a bearer authorization token.

The claim's mandatory insert guard also protects direct service INSERT. It locks the profile, receipt and queued order in the existing recorder's order, rechecks inactive/no-known-service status with the existing history function, verifies immutable receipt/queue/mode/policy/package/intent fields, and rejects stale evidence or known unresolved Preview reseller work. It takes a shared policy lock, reserves the unique reseller slot and locks the shared daily budget before checking spent/reserved/proposed cost and the minimum provider balance. Current UTC day, evidence age and policy expiry are rechecked using `clock_timestamp()` after possible lock waits. Only then is the integer reservation incremented.

Slot, daily reservation and claim are one database transaction. A failure after any intermediate write rolls all of them back. New claims are never automatically reclaimed, expired, deleted, repriced or reused by another order. A saved review reservation remains readable after policy revocation, but it never gains dispatch permission. Provider balance is supplied as fresh trusted backend evidence; SQL cannot verify a remote balance or Stripe charge by itself.

## Verification

`scripts/test-ks-setup-review-claim-db.mjs` uses the same temporary **@electric-sql/pglite@0.5.10** dependency as earlier isolated SQL tests. Set `KS_PGLITE_MODULE` to its `dist/index.js` file URL before running it. It loads the proposed schema and fictional users/policies/orders into local in-memory PostgreSQL, runs each scenario in a transaction, rolls it back and closes the instance. It never connects to Supabase, Stripe, Resend or Roomba.

**23 database scenarios passed**, including exact credit reservation, unchanged profiles, repeated/lost-reply recovery, wrong binding/owner/mode, second order/customer/reseller collisions, revocation/expiry, renewal and prior-service stops, package caps, persisted spent/reserved limits, daily-cap preservation, exact minimum-balance boundaries, freshness/UTC day, injected failure after partial writes, direct-INSERT enforcement, role grants and immutable history. Deferred FK integrity is explicitly checked on the happy path. Targeted ESLint passed. A read-only connected-project check confirmed the proposed claim/budget tables are absent, the single completed paid test remains, and no old provider dispatch lock is outstanding.

PGlite executes one database session. These tests prove constraint and transaction behavior in that engine; they do **not** prove simultaneous sessions, lock-wait timing, deadlock handling or deployed migration compatibility. Verify those against a disposable full PostgreSQL deployment before launch.

## Still required before execution

The current Preview worker uses its older dispatch-lock protocol. The new guard observes old work but does not make those separate protocols mutually exclusive: all provider-credit writers must adopt one unified claim/dispatch lifecycle before any automatic creation is enabled. This SQL contains no dispatch transition, completion, spent-credit settlement, safe slot release, cancellation or reconciliation resolver. A committed review reservation intentionally stays stopped until those operations are designed and separately verified; do not install and seed it as a working automatic queue.

Next connect trusted checkout-intent capture and fresh eligibility loading; implement the separately authorized one-time dispatch transition, provider verification, atomic CRM/owner-login completion and budget settlement, safe local completion retry and reconciliation without another creation; then integrate notification/UI state. Preserve existing spent trial/paid guards and encryption keys. Policy limits, automatic real-credit spending, production rollout and another real paid test remain unapproved by this preparation.

The next execution algorithm is now exercised by the isolated rehearsal documented in `ks-setup-execution-rehearsal-readme.md`. Its fictional PostgreSQL adapter demonstrates one-shot dispatch and atomic local settlement/recovery; it does not install that contract in this schema or unlock these review claims.
