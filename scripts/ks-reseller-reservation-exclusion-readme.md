# Shared reseller reservation exclusion

Installed October 18, 2026 as migration **20261018104237_add_shared_reseller_reservation_exclusion**. The exported migration is byte-for-byte identical to the SQL recorded by Supabase. It installs one function and two triggers, without adding a table, reservation, policy, route, execution scope, environment setting or provider operation.

## Behavior

The older approved Preview worker and the new review-only reservation use different slot tables. Both now invoke `ks_guard_reseller_reservation_exclusion` before every INSERT. The trigger takes the same transaction-scoped advisory key for the canonical physical reseller, then checks the other table. An existing review slot blocks Preview dispatch; an existing Preview slot blocks review reservation. Owner, order, policy, budget day and environment cannot partition that exclusion. Even an apparently matching order cannot hold both slots. Same-table primary keys still enforce uniqueness.

The advisory key is `hashtextextended('ks-reseller-reservation/v1:' || reseller_id,0)`. `pg_try_advisory_xact_lock` rejects contention immediately with `reseller_reservation_busy`, rather than waiting while the caller holds profile/receipt/attempt row locks. This is not permission to retry a provider request. The caller must stop without dispatch; existing permanent attempt/ambiguity rules remain in force. A hash collision can conservatively block unrelated work but cannot permit two owners of the same reseller.

The function is explicitly VOLATILE, SECURITY INVOKER and has an empty search path. Its cross-table SELECT is a separate statement after lock acquisition. It requires READ COMMITTED, rejecting other requested isolation modes before acquiring a lock or inserting a slot. PostgreSQL documents [fresh per-query snapshots in VOLATILE functions](https://www.postgresql.org/docs/current/xfunc-volatility.html) and [fixed transaction snapshots at Repeatable Read](https://www.postgresql.org/docs/current/transaction-iso.html); an advisory lock alone would not repair a stale transaction snapshot. [Transaction-scoped advisory locks](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS) end with the transaction.

Malformed reseller IDs and UPDATEs, including same-value assignments, are rejected. Existing guarded DELETE/release functions are unchanged. There is no TTL, cancellation, transfer, reset or reconciliation resolver. A concurrently uncommitted release may conservatively block a new reservation; a later eligibility review can inspect the saved state. External manual XUI activity is outside this database exclusion.

Installation locks both slot tables before checking existing overlap/canonical IDs and creating the triggers. Any incompatible existing state aborts the whole migration without altering reservations. The service role already had SELECT on both tables. Only EXECUTE on the new invoker function is granted to that role; no browser or Auth-table privilege is added, and both tables retain RLS and revoked browser access.

## Completion integration boundary

The preceding completion bridge's historical fixture acquires a review slot and then the older dispatch slot for the same reseller. **That fixture is now intentionally rejected.** A review-only reservation cannot authorize or bypass the existing paid approval gate. The bridge is installed but unrouted and off; no current reviewed execution route can reach its former dual-slot happy path. Do not seed review policies or enable its adapter to work around this block.

A later separately reviewed ownership handoff must preserve exclusion, permanent one-shot authorization, budget accounting, encrypted credentials and verified completion. This migration supplies no handoff. Standalone, separately approved Preview attempts without a review slot still use their existing verified local completion/replay behavior. The existing completed paid test was not backfilled, reset, renewed or changed.

## Verification

- **17 isolated guard checks** cover install rollback for overlap/invalid IDs, private grants/RLS, each direction of cross-table exclusion, ON CONFLICT, same-table uniqueness, different resellers, invalid aliases, immutable slots, cross-table writes within one statement, rejected isolation modes and advisory release on rollback.
- **4 current application-schema integration checks** load the actual payment, claim, approval, encrypted-login and completion schemas plus the new guard. They prove the old dual-slot fixture is blocked, a review claim prevents the real approved-begin RPC from changing attempt state, an older slot blocks direct service insertion, guarded unresolved-slot deletion remains blocked, and standalone verified completion/replay still works.
- **23 review-claim regression scenarios** pass with the new guard loaded. **15 historical completion scenarios** run before the exclusion migration to retain migration-level coverage; they are not evidence that the current dual-slot bridge can execute. Targeted ESLint passed.

These suites use the existing temporary **@electric-sql/pglite@0.5.10** dependency outside the application. Set `KS_PGLITE_MODULE` to its `dist/index.js` file URL and run:

```sh
node scripts/test-ks-reseller-reservation-exclusion-db.mjs
node scripts/test-ks-reviewed-preview-completion-db.mjs
node scripts/test-ks-setup-review-claim-db.mjs
```

PGlite has one SQL session. These checks do not establish true simultaneous database sessions, the advisory-busy branch under another session, commit visibility races or the complete worker lock order. A management-channel probe did not observe an independently held synthetic advisory lock, so it did not exercise contention. Verify concurrent INSERT/commit/rollback and worker transactions on disposable full PostgreSQL before automatic execution. Do not describe overlapping JavaScript calls as independent database sessions.

Connected checks verified both enabled triggers, invoker/volatile/empty-search-path configuration, browser EXECUTE/read denial and service EXECUTE. Rolled-back service-role guard calls rejected invalid IDs and Repeatable Read before inserting any row. Before/after digests of profiles, receipts, CRM customers, provisioning attempts and encrypted owner logins were identical. Both slot tables and all new policies/claims/budgets remain empty; the single completed attempt/fulfillment/owner login remains. No provider, payment, email or additional credit was used.

Security advisors remain at eighteen informational [service-only RLS/no-policy notices](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) and the pre-existing [leaked-password-protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No unrelated security setting was changed. There is no new client code or API entrypoint and no production promotion. General automatic activation remains off.
