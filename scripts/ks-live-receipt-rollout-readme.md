# Live payment receipt-only rollout — prepared, disabled

A paid order must not grant website access or announce working streaming
service. This draft connects the existing receipt-only recorder to the shared
webhook/owner-confirmation flow, owner status, support context and pending alert
protocol. **It has not been enabled, merged, migrated or deployed to production.**
The current running legacy live recorder still has its earlier activation
behavior. These changes do not establish that production is repaired.

## Draft behavior

`runtime()` captures `KS_LIVE_RECEIPT_ONLY_ENABLED=true`. Only Production/live
mode accepts that switch; Preview and other environments reject a mismatched
switch before retrieving a Stripe session. The flag is unset by default and no
environment setting was changed. The separate existing live-payment enablement
gate remains in place.

With this rollout enabled, `fulfill()` validates the canonical paid Stripe
session and calls `ks_record_paid_checkout`, which saves the receipt and durable
setup queue in one transaction. It does not call the old activating recorder,
write a profile, invent service expiry, call a provider or spend reseller credit.
An older activated receipt stays intact and returns `requires_review`; its
website access is not proof of provider setup. Such review-blocked receipts do
not initiate a new pending email. No caller-supplied recipient is accepted.

Pending orders use the existing protected notification function with explicit
`protocol=receipt-only-v1`. The new router preserves the legacy handler and its
delivery identity for requests with no protocol. The pending handler independently
checks backend authorization and the saved receipt/queue, freezes a support
message, and reuses its established provider deduplication key. Notification
failure keeps the payment/queue saved and requests recovery with “do not pay
again”; it never initiates streaming setup.

The owner status endpoint can read pending or review-blocked live queue entries
only for the authenticated, confirmed owner. Queries filter by owner and live
mode, then independently validate returned ownership, catalog and receipt data.
Responses expose no credentials, payment-intent ID or invented service expiry.
The existing customer panel and support context distinguish actual payments
from Sandbox payments and show pending/review state without a ready claim.
Preview still records test payments without website activation. Its completed/expired status and payment rechecks now use the separate proof contract described in `ks-completed-order-status-readme.md`.

## A paused rollout must preserve accepted orders

The new-order flag controls admission, not the protocol of an accepted order.
When the flag is off, `fulfill()` checks for an existing live durable queue first.
A queued order continues through the receipt-only path; a lookup failure stops
without falling back to activation. Already accepted live orders remain readable
by their owner after the switch is paused.

The proposed `ks-live-receipt-rollback-guard.sql` additionally rejects changes to
activation/expiry on a live receipt already bound to that queue. If older code
calls the legacy recorder, its receipt update fails and PostgreSQL rolls back
the profile mutation in that same transaction. Existing account data is not
rewritten, and prior activated receipts are not revoked. This guard is included
in the draft migration, which remains uninstalled. A read-only connected check on October 20
confirmed that both this guard and the pending-alert table are absent. Future provider-confirmed live completion must
be reviewed against it rather than bypassing or dropping it.

## Release prerequisites remain open

Do not enable the new flag as part of this preparation. Before any coordinated
release, review the new combined pending-alert/rollback-guard migration and its
bounded connected dependency checks described below. The exact migration and
native receipt/alert contention checks pass; broader worker/completion
contention and connected rollout execution remain open. The receipt/queue foundation is already installed;
do not rerun its creation script. Preserve deployed legacy email payloads and
their deduplication history. Deploy the protected notification router and its
dependencies before enabling the server path.

The broader live owner/completion lifecycle, reviewed worker/claim/recovery
policy, renewal/trial-conversion behavior, notifications for completed queues,
operator handling and connected end-to-end release checks remain separate work.
This draft grants no dispatch authority. It does not enable live checkout,
change any existing customer access, seed an activation policy or authorize a
charge, email, new line, credit spend or production promotion. Existing-event
Sandbox replay remains unverified; these fictional tests do not replace it.

## Validation

Run the live rollout, customer API, customer status view, payment presentation,
receipt, setup-help, legacy/pending notification and Preview order regression
scripts. Run `test-ks-receipt-only-db.mjs` and
`test-ks-pending-order-email-db.mjs` with the temporary
`@electric-sql/pglite@0.5.10` module set through `KS_PGLITE_MODULE`.

The SQL integration executes the actual `fulfill` function, receipt RPC,
notification router, pending handler and alert RPCs against fictional data. It
simulates lost notification acknowledgement and verifies one receipt, queue,
alert and delivery identity after retries, unchanged full profile data, and a
legacy activation attempt rolled back by the proposed guard. Other checks use
intercepted Stripe/email transports, real Supabase SDK query construction with
fictional responses, and static rendering of the actual customer component.

PGlite has one SQL session. Those embedded checks do not prove native
contention; the separate native follow-up below supplies bounded receipt/alert
contention evidence. Neither suite proves deployed Stripe/Resend delivery,
actual live owner status or provider activation. 135 checks passed across the listed suites. The Vite build (10.65 seconds) and focused lint pass. TypeScript retains the same
45 baseline diagnostics, with none added; the repository is not type-clean.

## Native database follow-up

The initial `test-ks-live-receipt-native.mjs` and scoped GitHub Actions workflow ran
twelve independent-session checks on a disposable PostgreSQL 17.11 service.
They load the hash-verified application foundation, installed checkout-binding
source, legacy email/recorder and proposed pending-alert/rollback-guard SQL.
The harness accepts only a specifically named loopback fixture database with
an explicit disposable acknowledgement. It never reads `DATABASE_URL` or uses
Supabase, Stripe, email or reseller credentials.

The cases observe real backend lock waits before commit/rollback, then check
duplicate receipts and payment intents, frozen alert preparation, final delivery
acknowledgements, lock timeout recovery, legacy activation rollback and preserved
historical access. Each retained report binds the source commit, SQL hashes and
native server version to the results. The runner has read-only repository
permissions, no project secrets, pinned official Actions and an eight-minute cap.

The local workspace has no native PostgreSQL or Docker. The suite ran in
[GitHub Actions run 39370096443](https://github.com/djudge47/kristalstreams/actions/runs/39370096443)
on October 20, 2026. **All twelve checks passed** on PostgreSQL 17.11, using
three distinct backends and observed lock waits. The tested source commit is
`5ed9d589801334a1ffa80d1e39ebe8244e5257bd`; its tested tree matched the local tree.

The downloaded artifact's SHA-256 was verified against GitHub's digest, then
its server version, source commit, twelve success results and SQL hashes were
checked. The retained report is
[`docs/verification/receipt-native-20261020.json`](../docs/verification/receipt-native-20261020.json).
The immediate evidence-only follow-up preserved that tested harness and SQL.
The migration follow-up below expands the harness and tests the combined file.

This fixture database is still not the full connected Supabase project. The
checks perform no native provider dispatch, live owner/completion flow or
migration on that project. The follow-up below checks current connected
dependencies without applying DDL; broader release prerequisites remain open.

## CLI-generated migration and connected compatibility follow-up

The reviewed file is
[`20261020044005_add_live_receipt_pending_alerts_and_rollback_guard.sql`](../supabase/migrations/20261020044005_add_live_receipt_pending_alerts_and_rollback_guard.sql).
Supabase CLI 2.121.0 generated its empty filename with `migration new`; the
reviewed SQL was then filled locally. Automatic approval review blocked the
CLI's unrelated telemetry request after file creation; no telemetry retry was
needed. No project link, database push or migration apply was performed.

One transaction installs both new SQL sections without recreating the existing
foundation. Its five-second lock timeout and thirty-second statement timeout
bound installation. Locks follow receipt → queue → legacy email order before
DDL, so installation cannot hold queue while waiting for an in-flight receipt
writer. The preflight rejects existing rollout objects, changed column
signatures, widened browser permissions, missing RLS/service permissions,
changed reviewed function bodies/configuration and a missing/disabled queue
guard. It preserves the queue's column-scoped update permission. Historical
CRLF is normalized to LF for the body fingerprint; other content is exact.

Read-only catalog checks at **2026-10-20 04:43:37 UTC** passed for all three
receipt/queue/legacy-alert tables, four function bodies and private grants, and
the current queue trigger. The connected server reports PostgreSQL **17.6**;
all five new objects are absent. Existing constraints and column definitions
were captured in
[`receipt-migration-connected-20261020.json`](../docs/verification/receipt-migration-connected-20261020.json).
The security advisor was checked; its existing findings and remediation links
are recorded there. No policy, grant, Auth setting or customer record changed.

[Actions run 39371053392](https://github.com/djudge47/kristalstreams/actions/runs/39371053392)
tested the **exact combined migration** on separate disposable PostgreSQL
**17.6 and 17.11** services. All **18 checks passed on each version**, for source
`8d0d4ae34335c1a5bdba659ccc2ceab8d5f91e8d` and tree
`7a2ebd468b0d4f51304be7a60110bd28b9504f2c`. The six new cases prove rejection
of permission/function/column drift without partial DDL, full rollback on a
lock timeout, safe installation while a receipt writer finishes, and safe
rejection of reapplication. The existing twelve contention cases then execute
against those installed objects. The legacy function fixture uses connected
CRLF line endings; reviewed-source parity and all SQL hashes are checked.

Both downloaded artifact digests, source commits, actual server versions,
eighteen results and SQL hashes were independently verified. Retained reports:

- [`receipt-migration-native-170006-20261020.json`](../docs/verification/receipt-migration-native-170006-20261020.json)
- [`receipt-migration-native-170011-20261020.json`](../docs/verification/receipt-migration-native-170011-20261020.json)

These are bounded catalog compatibility and disposable installation results,
not an application of DDL to Supabase or a complete live-release verification.
The rollout remains disabled and production's old recorder remains unchanged.
Review connected execution and notification deployment with the remaining
owner/completion/renewal/recovery work before any separate production release.
Pausing the flag must retain the guard and saved orders; dropping these objects
is not a safe rollback procedure.

## Guarded worker recovery follow-up

Native worker testing exposed a real recovery defect: a saved PostgreSQL expiry
using `+00:00` was rejected against the provider's equivalent `Z` timestamp.
The source worker now compares expiry instants while still rejecting a changed
line or invalid/changed expiry. A lost provider-result acknowledgement can
therefore recover local completion without creating another line.

Fifteen native worker/recovery/ownership cases passed on each of PostgreSQL
17.6 and 17.11 in
[run 39374779188](https://github.com/djudge47/kristalstreams/actions/runs/39374779188).
They execute the actual worker/store code with fictional Auth, Stripe and
provider responses, native SQL commits and observed independent backend locks.
See [`ks-paid-recovery-native-readme.md`](ks-paid-recovery-native-readme.md)
for the bounded cases, source/artifact verification and retained reports.

These results cover selected existing-worker recovery and lock orders. The
reviewed handoff remains a separate isolated rehearsal. Native signed-handoff
integration, full ownership/time-boundary coverage, live completion/renewal/
reconciliation, completion-aware receipt/alert/owner status and connected
release verification remain open. No new execution authority was enabled.

## Completed Preview order follow-up

The new completion proof reader joins saved fulfillment, attempt, receipt, CRM and owner-login bindings without selecting credentials. Completed Preview queues now remain visible with a verified current or expired service period. Shared payment rechecks skip pending/setup notification only after that proof is checked. An existing completed live receipt-only queue preserves payment and returns review instead of inventing live readiness or emitting a pending alert.

Per-order dashboard cards, payment confirmation and the actual support form now distinguish pending, review, confirmed and expired service while preserving payment mode. A receipt or queue flag alone still cannot prove readiness. See `ks-completed-order-status-readme.md` and the retained validation reports.

All 121 focused local checks pass, including real-SDK query construction and twelve actual-component initial renders. Native run 39376156622 passes seventeen cases on each of PostgreSQL 17.6 and 17.11, including lost-reply completion through the proof/status/support/payment layers and the expiry boundary. The receipt/migration suite also passes eighteen cases per version at the same tested source. No SQL migration changed or ran against the connected project.

This closes the bounded completed Preview status/payment-recheck gap. Full live completion and owner credential support, completion-email policy, reviewed handoff integration, renewal/reconciliation and connected browser/release verification remain open. The live rollout flag is absent and general provider activation remains off.
