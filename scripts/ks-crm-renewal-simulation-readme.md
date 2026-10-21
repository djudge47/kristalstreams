# Offline CRM renewal planning and simulation

This draft models renewing an existing active paid line while preserving its
current channel groups, package, username and connection allowance. It adds no
HTTP route, UI submission button, provider transport, database migration or live
adapter. Nothing imports it into an application execution path.

Run the synthetic checks with:

```sh
node scripts/test-ks-crm-renewal-simulation.mjs
```

All fixtures are fictional. The suite blocks external fetch and supplies only
simulation adapters. No connected credentials are needed.

## Planning

The planner requires explicit confirmation to preserve the current selection,
evidence no more than 30 seconds old, matching CRM/provider identity and reseller,
an enabled active paid line, a supported standard current package, matching
connection allowance, validated channel groups and sufficient exact credit units.
The existing selection may be a strict subset of the package catalog, but must
contain no unknown or duplicate groups. The form sends exactly that selection;
it never replaces it with the full package selection.

The offline multipart form contains only `trial`, `package`, `package_duration`,
`max_connections` and repeated `bouquets_selected[]`. It omits credentials,
expiry, notes, reseller identity and cost overrides. The evidence digest detects
changed inputs; it is neither authentication nor permission to spend credits.

The existing read-only renewal review and its manual-review block remain intact.
This simulation does not bypass that block in the application.

## Simulated operation and recovery

The runner requires adapters explicitly marked `simulation`. It reserves an
operation, reads fresh provider and CRM evidence, binds a simulated dispatch to
that evidence, verifies the returned line against a fresh readback and checks the
exact credit debit. The simulated CRM commit changes only provider expiration;
it preserves billing fields. A completed operation replays without another edit.

Uncertain dispatches stop for reconciliation. Once the provider result is saved,
local completion can resume through reads and an idempotent CRM commit without
another provider edit. Tests cover concurrent requests, changed evidence,
timeouts after acceptance, lost replies, malformed results and local failures.

The test ledger uses in-memory Maps and Sets. These model atomic operation
claims, consumed line versions and reseller exclusion, but provide no durable or
cross-process guarantees. The adapter label is a developer contract, not a
security boundary. These modules must not be wired to live adapters as-is.

The provider-returned expiry is authoritative. Broad 27–32 day-per-month bounds
reject gross duration errors; they do not verify exact calendar, month-end or DST
semantics. The fake provider retaining a password does not establish that the
real provider will retain credentials when the form omits them.

## Required before any live renewal

- Implement service-only durable operation claims, line-version uniqueness and
  reconciliation records with authenticated, explicit approval bound to the
  customer, line, selection, term and credit cost.
- Coordinate reseller-wide exclusion with existing paid/trial creation guards;
  an in-memory renewal lock alone cannot protect the shared credit balance.
- Implement an idempotent CRM expiration update with identity and old-expiry
  compare-and-swap protection, including recovery after lost replies.
- Verify provider calendar behavior and credential retention through a separately
  approved controlled test, with reviewed recovery procedures.
- Review and authorize the live integration separately. Expired lines, package
  changes and trial conversion are outside this draft.
