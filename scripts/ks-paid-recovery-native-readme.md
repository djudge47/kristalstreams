# Native guarded worker recovery checks

The existing guarded Preview worker must not resend a provider creation after
an uncertain reply or repeat its CRM/encrypted-login completion after a retry.
The current review reservation must also continue to exclude the older worker.
This suite verifies those boundaries on disposable native PostgreSQL without
enabling an execution route. It exposed a timestamp-comparison defect in the
existing recovery code; the accompanying patch corrects that comparison.

## Recovery defect and fix

After a provider-result acknowledgement is lost, the saved native row correctly
remains `provider_verified`. Its PostgreSQL JSON expiry can use `+00:00`, while
the provider normalizer uses `Z`. The worker compared those strings directly
and raised `saved_provider_result_changed` for the same instant, preventing
local completion. The new native suite reproduced that failure on both 17.6
and 17.11 before the fix.

The worker now compares parsed expiry instants. It retains exact provider-line
identity, rejects invalid or changed saved expiry, and reuses the existing
verified result without a second create. Two regression checks cover matching
database formatting and changed/invalid expiry. Dispatch permission, ownership,
provider validation, durable locks and spending limits are unchanged.

## Native verification boundary

`test-ks-paid-recovery-native.mjs` accepts only a loopback URL whose database is
`ks_paid_recovery_native_test`, plus the exact disposable acknowledgement. It
does not read `DATABASE_URL`, project secrets or provider configuration. Global
`fetch` throws. The scoped workflow uses pinned official Actions, read-only
repository permissions, no project secrets and an eight-minute job limit.

The harness loads the eight hash-verified application SQL sources and installed
checkout-binding migration. The handoff prototype is absent; the shared reseller
exclusion remains installed and active. Three independent psql backends use
READ COMMITTED and bounded statement/lock timeouts. Only fictional database
rows change. No connected project data, provider line, email, charge or real
credit balance is touched.

The actual `createGuardedPaidExecutor` and `createPaidExecutionStore` execute
their existing signed approval, encrypted-login, eligibility and recovery code.
A fixture client sends the store's scoped reads and named RPC arguments to
native PostgreSQL; Auth identity and Stripe/provider responses are fictional.
This client is a test adapter, not a test of deployed PostgREST, Auth or provider
transport. Each SQL RPC resolves after its implicit transaction commits.

Fifteen cases cover:

- Ordinary completion and exact retries across independent worker connections.
- Lost begin, provider-result and completion acknowledgements after SQL commit.
- An uncertain provider response, which retains stopped durable ownership.
- A SQL fault after CRM writes, complete rollback and local-only retry.
- Two actual executor callers with at most one fictional provider creation.
- Native same-attempt begin commit/rollback races and completion races, with
  observed backend lock waits before release.
- Review ownership blocking the real signed executor before any create.
- Both directions of uncommitted advisory contention, commit visibility and
  rollback recovery across different customer orders on the same physical
  reseller, while preserving cross-protocol exclusion. These SQL-only races
  never run a provider adapter before transaction commit.
- Browser denial for internal attempts, encrypted owner bindings and RPCs.

Completed cases retain one CRM customer, fulfillment and encrypted owner-login
binding, release the old dispatch slot, keep receipt activation false and leave
full profile rows unchanged. Lost begin and uncertain provider cases retain the
saved dispatch/reconciliation state; the test never clears it to permit another
creation. Review reservations are not converted to dispatch authority.

The scoped workflow runs on PostgreSQL 17.6 (matching the connected catalog
check) and 17.11. Retained reports bind the source commit, server version,
foundation hashes and selected execution-source hashes to every result.

This covers the existing worker's bounded recovery and selected native lock
orders. The reviewed handoff remains isolated/unrouted. Full live ownership,
completion, renewal, uncertain-operation reconciliation, completion-aware
receipts/alerts/customer status and connected release verification remain open.
The durable receipt queue can still report `setup_complete` where its current
receipt validator and pending-only owner/alert views do not yet consume the
completion contract. Keep live rollout flags off while that integration is
unfinished; these tests supply no new execution permission.

## Verified result — October 20, 2026

[Actions run 39374779188](https://github.com/djudge47/kristalstreams/actions/runs/39374779188)
passed all **15 cases on each of PostgreSQL 17.6 and 17.11** for source
`770c9291774a4cf2fe4a5dcc057844e77823fa53`, tree
`46c4b6046da1c218faf1cd7587e32473db30d7b2`. Each job used three distinct native
backends, real row/advisory contention and the unchanged current exclusion guard.

Both downloaded ZIP digests were checked against GitHub's artifact metadata.
The reports' source commit, actual server version, fifteen passing results,
execution-source hashes and all foundation SQL hashes were independently
verified before retaining:

- [`paid-recovery-native-170006-20261020.json`](../docs/verification/paid-recovery-native-170006-20261020.json)
- [`paid-recovery-native-170011-20261020.json`](../docs/verification/paid-recovery-native-170011-20261020.json)

The existing receipt/migration suite also passed eighteen cases on each server
at this source in
[run 39374779204](https://github.com/djudge47/kristalstreams/actions/runs/39374779204).
The existing worker, reviewed-completion adapter and bounded test-control suites
passed **24 + 9 + 19 = 52 local checks**. Focused JavaScript lint passes on the
three changed code/test files; the Vite build passed in 9.68 seconds. Application
code and SQL are unchanged by the subsequent evidence-only follow-up.

No connected migration was applied, no execution setting was enabled, and no
production promotion occurred. This fixes the source recovery defect; it does
not establish a deployed live provider/customer setup flow.
