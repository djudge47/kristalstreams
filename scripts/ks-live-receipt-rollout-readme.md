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
Preview's pending/completed-payment flow retains its existing behavior.

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
rewritten, and prior activated receipts are not revoked. This guard is staged
SQL, not an installed migration. A read-only connected check on October 20
confirmed that both this guard and the pending-alert table are absent. Future provider-confirmed live completion must
be reviewed against it rather than bypassing or dropping it.

## Release prerequisites remain open

Do not enable the new flag as part of this preparation. Before any coordinated
release, review and generate new migrations for the pending-alert SQL and the
rollback guard; verify them against the current full connected schema. The bounded native
receipt/alert contention checks below now pass; broader worker/completion
contention and connected rollout verification remain open. The receipt/queue foundation is already installed;
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

`test-ks-live-receipt-native.mjs` and the scoped GitHub Actions workflow prepare
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
Subsequent evidence-only commits do not change the tested harness or SQL.

This fixture database is still not the full connected Supabase project. The
checks perform no native provider dispatch, live owner/completion flow or
migration on that project. Connected DDL compatibility and the broader release
prerequisites above remain open.
