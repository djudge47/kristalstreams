# Disposable renewal ledger and approval rehearsal

This draft adds database-backed safeguards to the offline renewal work in #18.
It is a **disposable prototype**, not a connected migration or live integration.
The application still has no renewal submission route, provider edit adapter or
renewal approval screen. All live writes remain disabled.

## What is implemented

- A separate HMAC approval purpose for offline renewal rehearsal, using an
  explicitly supplied disposable 32-byte key. The approval binds one operation,
  approver, plan fingerprint and evidence timestamp. The plan fingerprint covers
  the customer, line, reseller, package, term, connections, current group selection,
  old expiry, catalog and exact credit cost/balance. Both approval and evidence
  expire within the bounded review period. Every result says it cannot dispatch.
- Private, RLS-enabled service-only approval, operation, consumed line-version,
  reseller-reservation and completion tables. No customer credentials, provider
  keys, raw metadata or arbitrary provider payloads are stored. The claim token
  stays in the trusted worker/database boundary; it is never customer output.
- Persistent operation binding and line-version uniqueness. A repeated begin
  cannot produce another fictional decision, even with a new operation ID for
  the same line and old expiry. An uncertain dispatch keeps its reservation.
- The existing physical-reseller lock namespace coordinates renewals with both
  existing paid dispatch and review reservations. Changes to the shared trigger
  occur **only inside the disposable database**. Existing schema source files,
  migrations and application integration code are preserved.
- A deferred freshness check rejects a transaction that outlives its approval.
  Commit must succeed before any future external action could be considered.
- Verified result recording requires matching identity, package, connections,
  exact groups, returned/readback expiry and debit. Atomic CRM completion updates
  only `expiration_at` after matching the stored customer identity and old expiry,
  inserts one completion audit, and releases the reseller reservation together.
  Consumed line versions remain retained. Completion replay does not update CRM
  again. No automatic reset, retry of an uncertain edit or reconciliation release
  is provided.

## Verification

```sh
node scripts/test-ks-crm-renewal-approval.mjs
KS_PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node scripts/test-ks-crm-renewal-db.mjs
```

The local preflight uses PGlite 0.5.11 installed outside the repository. It creates
and removes its own temporary database directory, and executes the unchanged
prototype SQL in `ks_disposable_crm_renewal_test`. The wrong-database refusal is
also tested. PGlite is single-session syntax/behavior evidence, not a substitute
for native concurrency tests; it introduces no application dependency.

The `Native CRM renewal rehearsal` workflow runs unchanged installation SQL and
shared sequential cases on disposable PostgreSQL 17.6 and 17.11 services. Its
independent connections test competing operations, commit/rollback, shared locks
with the actual historical setup functions, concurrent completion, replacement
worker connections and browser-role denial. The harness refuses non-loopback
addresses, other database names and missing disposable acknowledgement. It blocks
external fetch and cannot construct a provider edit adapter. Reports record the
source commit and hashes, test outcomes and server version.

The existing paid/setup foundations are loaded from the checked-in source
manifest. Neither those files nor an actual customer's record is modified.

## Trust boundary and work required before live use

The server's service role is trusted. SQL records an approver audit identity; it
does not authenticate a human or independently verify HMAC signatures. The
rehearsal module likewise receives an approver ID from its caller, rather than
asserting that someone has signed in. A future authenticated administrator route
must verify identity, confirmation and authorization independently, show the exact
selection/term/cost for explicit consent, verify the appropriate capability, and
recheck current provider/catalog/credit evidence. The current rehearsal tokens
are deliberately incompatible with live purposes.

The fixture adapter runs the actual #18 simulation worker through the SQL ledger,
including accepted timeouts, failed result saves and lost verification/completion
replies. It is restricted to the disposable harness and fictional provider. A
separately reviewed application server adapter must preserve these semantics, await
a durable successful commit, recheck freshness, and never treat a lost reply as
permission to resend. Persistent locks cannot exclude edits performed outside
the CRM directly in the reseller panel; the live operating procedure must handle
that source of credit or line changes.

Provider expiry bounds remain deliberately broad; they do not establish exact
calendar, DST or month-end semantics. Credential preservation has not been proven
against a live provider. Expired lines, trial conversion and package changes are
excluded. A reviewed installation migration, authenticated integration, recovery
procedure and separately approved controlled provider test are still required.

Never apply `scripts/fixtures/ks-crm-renewal/prototype.sql` to Supabase. Its hard
database-name guard is intentional. No deployment, production promotion, feature
flag, payment, email, credit spend or live customer edit is part of this draft.
