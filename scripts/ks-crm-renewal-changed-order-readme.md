# Protected changed-order purchase

The requested-order catalog review can check all supported standard terms and
connection allowances. It cannot authorize a provider write. The separate
protected purchase path is a controlled test for the owner-observed change from
**6 months / 4 connections to 6 months / 3 connections**. Other changes remain
read-only until their provider behavior has been reviewed.

The owner's XUI preview warned that this change starts from purchase time rather
than the existing expiration. That is UI evidence, not verification of a committed
API package change. The API guide explicitly leaves package changes unverified.
The purchase controls require acceptance of unused-time loss and an explicit
controlled-test acknowledgment as well as the exact order/channel and credit
confirmations. Reading a quote does not spend credits.

## Independent authorization

- Preview only; fixed active Kristal Stream Supabase project, verified confirmed
  nonanonymous `djudge47@gmail.com` administrator, same-origin HTTPS JSON POST.
- `KS_CRM_ORDER_RENEWAL_ENABLED=true`, an explicitly configured
  `KS_CRM_ORDER_RENEWAL_CUSTOMER_ID`, and the new SQL execution control must all
  authorize the selected customer. Existing test and same-package execution
  controls must both be off. No route can mutate a switch.
- Dedicated random 32-byte `KS_CRM_ORDER_RENEWAL_CONSENT_KEY`, distinct from the
  Preview and same-package keys. No fallback. Keys and release configuration are
  not provisioned by this change.
- Purpose-separated five-minute consent binds the original operation, approver,
  customer, requested dimensions and fingerprint. Test and same-package consent
  do not authorize a changed-order operation.
- The server resolves the unique standard package from a fresh provider catalog,
  uses its exact credit cost and preserves only the existing selected group IDs.
  Client-supplied package IDs, costs, future expirations and destinations are
  rejected. Snapshot freshness is 30 seconds from the first provider read.
- Fresh review includes the saved CRM expiration, connections and package label
  (including a previously unassigned/null label); all must still match at begin
  and local completion. Payment status is never inferred or changed.

## Once-only dispatch and completion

The new private `ks_crm_order_renewal_*` namespace has an immutable approval,
operation claim, old-line-version constraint, reseller slot and completion.
It shares the existing physical-reseller advisory lock with all four prior
protocols. A committed begin is mandatory. A lost reservation/begin reply cannot
cause an automatic dispatch or retry. Uncertainty retains the reservation; there
is no reset, resend, delete-to-unlock or automatic reconciliation endpoint.

The existing bounded Fixie transport is reused with an explicit changed-order
write policy and its separate release gate. It sends one documented multipart
`edit_line` request: trial, selected package, duration, connection allowance and
repeated explicit `bouquets_selected[]`. It omits password, username, notes,
provider expiration, member and price override fields. No redirects or retries.

The returned line and an independent line read must agree on identity, reseller,
requested package and allowance, exact channel subset, enabled paid status and
expiration. The independent account read must show exactly the approved debit.
The expected policy is calendar months from the committed dispatch time in
America/New_York, with a two-minute allowance for provider timing/rounding. This
is a conservative expectation based on the observed UI: a different duration,
remaining-time carryover, DST ambiguity or month-end policy remains locked for
reconciliation. The app never silently adopts an unexpected API policy.

Only after both application and SQL verification does one transaction compare
and update CRM `expiration_at`, `connections_allowed` and `package_name` together,
insert the completion and release the slot. Other billing, account and contact
fields are preserved. A verified result can recover the local completion without
another provider purchase. An expired signed identity can look up the original
attempt, including while sending is disabled; it cannot create a new attempt.

The UI stores the original signed attempt before execute, restores status-only
controls on reload, and blocks execution when local persistence is unavailable.
Changing requested dimensions invalidates a prepared purchase. Success does not
prove playback or preservation of the existing login: both still require a
separately authorized controlled provider test and an owner playback check. Safe
provider DTOs never retain the password and cannot establish that fact.

## Installation and validation

`scripts/ks-crm-order-renewal-installation-schema.sql` requires the exact reviewed
four-protocol predecessor and disabled old controls, refuses existing work or
reapplication, creates only private invoker functions/RLS tables and seeds the
new switch **false**. It intentionally replaces only the shared exclusion
function to include the fifth namespace. The SQL verifier checks all three off
controls, worker inability to enable, private permissions, the exact five-way
guard and triggers, and empty new work tables.

The migration copy is identical to that script. No migration enables purchasing,
renews a line, sends mail, changes a password or edits a customer. Run the exact
script and verifier in disposable databases before installing; never adapt a
fixture DB guard to make a production rehearsal run.

Local single-session preflight (PGlite 0.5.11 installed outside the repository):

```bash
KS_PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node scripts/test-ks-crm-renewal-order-db.mjs
```

Native CI runs the same test file on PostgreSQL 17.6 and 17.11 using independent
sessions in `ks_disposable_crm_renewal_test`. It checks commit/rollback races for
begin and atomic completion, distinct approvals on one old line version, and
shared reseller contention. The suite also covers SQL boundary validation,
expiry/cost/group/CRM drift, wrong debit, lost acknowledgments, accepted timeout,
control conflicts, real authenticated HTTP and actual React click/storage paths.
All use synthetic records and fake provider adapters. They do not establish live
provider behavior or authorize a credit spend.
