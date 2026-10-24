# Bulk CRM correction from verified XUI service details

The Preview CRM now has Prepare bulk CRM update. One saved review covers 1-200
existing CRM accounts, including a 100-account customer list, with automatic
sequential checks and one approval/apply action for all eligible corrections.
The previous comparison remains available in collapsed read-only controls.

Preparation snapshots each selected CRM identity and updated_at in a private,
owner-bound database batch. Only the existing documented user_info, get_line and
packages GET reads are used. Server-side ID, username and reseller checks remain.
No browser-supplied service values are accepted. Review storage contains only
allowlisted identity and service fields; passwords, direct line URLs, contact
information, raw provider metadata, reseller balances and channel groups are not
copied. No provider write adapter, activation flag or new credential is added.

Checks are paced at 30 seconds with bounded 429 retries. Progress and completed
proposals are durable. Pause, refresh and lost review responses can resume the
same batch, skipping checked accounts. Session storage retains only its UUID.
Reviews expire two hours after creation. All selected accounts must reach a
terminal review result before apply is allowed; incomplete batches cannot apply.
Missing packages, failed reads, changed identities/CRM rows, trial classification
changes and protected Preview accounts remain unchanged and appear separately.

The administrator reviews proposed before/after values and checks one explicit
approval before Apply N CRM updates. That POST accepts only the batch UUID and
confirmation. One SQL transaction locks the ready customer rows in UUID order,
verifies their identities/source/updated_at and review lifetime, then changes
only package_name, connections_allowed, expiration_at and account_status.
Payments, monthly_price, last_payment_at, renewal_at, trial classification,
passwords, owner labels, notes and provider settings remain unchanged. Existing
payment triggers run normally; protected billing values and payment counts are
asserted unchanged. A conflict rolls back all eligible updates and audit rows.
Unclear accounts are skipped, rather than assigned guessed service values.

The same transaction records per-account history and an applied batch receipt.
Repeated apply returns that receipt without another customer write. A lost apply
response blocks another apply until Check saved result resolves the original
batch. Successful updates refresh the CRM list; the saved result remains visible.
The server requires Preview, the active project and confirmed administrator,
plus exact HTTPS same-origin JSON for POST. Existing non-bulk CRM views retain
the 2 KB body limit; only the bounded bulk manifest uses the new 16 KB parser.
The deployment still has twelve function files and is not promoted to production.

Installed migration: 20261022125229, ks_crm_bulk_service_sync_review. Its SQL is
byte-identical to scripts/ks-crm-bulk-service-sync-schema.sql, SHA256
f3fb278659209af6ec8f88ecaa4f05100fb7d4192a77105490c9751a4ece12cc.
Two RLS-enabled tables and four invoker/empty-search-path functions are private
to service_role; anon/authenticated have no table or function access.
Installation created no batches/items and changed no customer record. The 20
safe customer records retain digest
c5e5e9dfc42f89a0d692d10c9563cc80f586fcc836eecf9b463c4bf7d7ba52bf.
Payment count remains 4, reminders 1, purchase/completion counts 1/1, and all
three purchase controls remain OFF. Security advisor warnings are unchanged.

Validation: ten isolated SQL/HTTP cases run 100 fictional accounts through the
real authenticated route, provider-read handler and SQL review, followed by one
atomic 96-account apply with three protected/unclear accounts skipped and one
already matching account. They verify payment-trigger behavior, preservation of
personal credit-funded billing and credentials, rollback on conflict, expiry,
private grants and repeated-apply recovery. Six client/UI cases exercise all 100
paced checks, durable resumption, stop/retries, manifest validation and one actual
React checkbox/apply click producing a single 100-account request. No connected
customer or provider is used for these tests. The pinned isolated SQL runtime is
PGlite 0.3.14; CI installs it outside the application dependencies.

Existing status (13), read-only bulk (11), renewal-review (37) and requested-order
(18) checks pass. ESLint and Vite build pass. TypeScript retains the same 47
existing diagnostics, none in the changed components. The live owner review and
bulk apply still require the signed-in Windows CRM session; no actual bulk apply
has been performed during implementation.
