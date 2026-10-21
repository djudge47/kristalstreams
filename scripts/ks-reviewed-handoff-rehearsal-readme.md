# Signed approval to atomic review handoff rehearsal

The existing payment executor cannot acquire a dispatch slot while a review
reservation holds the same reseller. The shared exclusion guard correctly
rejects that combination. This change exercises the existing signed approval
and encrypted attempt against the previously tested atomic handoff prototype.

`_server/ks-reviewed-handoff-rehearsal.js` is **isolated rehearsal code**, with
no API import, real store constructor, provider-create method, environment
enable switch, or connected migration. Every result contains
`simulation: true` and `mayDispatch: false`. Its dependency markers are test
wiring conventions, not authentication or authority to spend credits.

## Behavior

- Require exact new-line input, explicit confirmation, the bound administrator's
  existing HMAC approval, a freshly settled sandbox payment and confirmed
  new-customer eligibility. Unknown fields, including trial-upgrade intent, fail.
- Bind the review claim, saved attempt, purchaser, checkout, payment intent,
  reseller, package fingerprint, calendar months, connections, channel groups
  and exact integer credit cost. Decrypt the existing AES-GCM envelope with its
  owner/order/attempt context and verify its saved username hash.
- Use the fresh approved execution balance while retaining the claim's original
  historical balance. Do not reserve the cost twice or overwrite old evidence.
- Capture immutable approval evidence, then transfer through one committed SQL
  transaction. The adapter must resolve only after commit and deferred checks.
  Capture failure makes no transfer; an uncertain transfer reply supplies no
  decision and is never retried automatically.
- Only a fresh committed winning response can return a fictional
  `wouldDispatch: true`. All saved and concurrent replays deny a second decision.
  Check freshness and the UTC budget day again after acknowledgement. Expired,
  stale, malformed or uncertain responses preserve the stopped reservation.
- Existing verified provider results use the prototype's atomic local
  completion: CRM, encrypted owner login, both queues, audit and reserved-to-spent
  accounting commit once. This module neither creates a line nor completes one.

## Recovered SQL fixture

`scripts/fixtures/ks-reviewed-handoff/prototype.sql` is byte-for-byte the earlier
disposable prototype, SHA-256
`edf3bdfe11d5c6ef4439f00d19ef5aaba930835c03cdc80007afe20b1d56aa97`.
It is not a migration and refuses databases other than
`ks_disposable_handoff_test`. Never install it in the connected project.

The fixture loader verifies all eight original application-schema hashes at
`f434a3a2220a0ac09dd83aa367dfb9b78aaaebe3` against the repository SQL files.
Fixtures contain fictional customer, payment, provider and approval records.
Browser grants remain revoked, RLS remains enabled and functions are invokers
with empty search paths. The original exclusion guard is unchanged.

The PGlite preflight explicitly removes only the native database-name guard and
uses the existing SHA-256 fixture overload instead of pgcrypto. A separate test
runs the unmodified SQL and verifies wrong-database rejection before table
creation. The preflight is not a connected Supabase installation.

## Verification

Use the same temporary, pinned `@electric-sql/pglite@0.5.10` dependency as the
other isolated database suites. Set `KS_PGLITE_MODULE` to its `dist/index.js`
file URL, then run:

```sh
node scripts/test-ks-reviewed-handoff-rehearsal.mjs
```

The suite covers 19 recovered SQL handoff scenarios plus 21 boundary/integration
checks: signed approval and encrypted-login bindings, fresh versus historical
balance, safe capture-reply recovery, lost transfer replies, deferred commit
failure, overlapping JavaScript callers, revocation, wrong identity/intent/cost,
corrupted envelope, stale review day, refunds, existing service, changed balance,
wrong token, stale/day-advanced/malformed acknowledgements, completion replay,
construction restrictions, wrong-database refusal, and the twelve-entrypoint
boundary. It makes no network request and constructs no provider-write adapter.

PGlite has one SQL session. JavaScript overlap is **not** independent PostgreSQL
contention or deadlock evidence. The simulated day advance does not establish
native midnight rollover behavior; stale-day and freshness checks can both stop
that case. The earlier owner-executed 50 native cases remain separate evidence
for the unchanged SQL prototype. The new native signed integration is described below.

Also run the existing setup execution rehearsal, guarded paid execution and
bounded paid-test-control suites. No dependency or lockfile change is required.

## Native signed integration

`test-ks-reviewed-handoff-native.mjs` uses three persistent, independent `psql`
connections against **only** a loopback database named
`ks_disposable_handoff_test`, with `KS_NATIVE_DISPOSABLE_ACK=reviewed-handoff-fixtures`.
It installs the original hash-checked prototype without removing its safety
check and verifies all eight historical foundation hashes. A separate process
with `ON_ERROR_STOP=on` proves the unmodified prototype rejects the `postgres`
database before creating either prototype table.

The shared signed fixtures/scenarios run the actual HMAC approval, AES envelope
and rehearsal module with fictional settled payment/package/account data. They
import no provider transport or application simulation fixture. Every SQL adapter
resolves only after the implicit transaction and deferred checks finish. The
PGlite runner retains all forty earlier checks; its overlapping callers remain
single-session evidence.

The new workflow runs PostgreSQL 17.6 and 17.11 with no project secrets or npm
application dependencies. Besides the recovered SQL and shared signed cases,
it observes a real competing backend's row-lock wait through `pg_stat_activity`:
commit produces replay only; rollback lets the waiting transaction win. The
rollback test's initial SQL row is provisional and never reaches the JavaScript
rehearsal. A native one-second approval expiry rejects deferred commit and
restores the exact source reservation. Two independently connected signed
callers synchronize after loading the reserved attempt and receive at most one
committed fictional decision. Additional cases check the shared advisory lock,
browser denials, isolation restrictions and unchanged website entitlement
fields. External `fetch` throws and no provider-create dependency exists.

Reports bind the exact tested commit, PostgreSQL version, every named result,
the prototype/integration sources and foundation hashes. Native midnight
rollover, all cross-protocol lock orders and a real authenticated server adapter
remain outside this bounded test. Actions run `39377445650` passed all **48 checks on each version** for source
`d9cd67baaffa4aff06eced08e7d18d141972be46`, tree
`fa0e1b7033aea385d29babefd20341aa1513cb76`. The ZIP digests, exact source,
server versions, results, thirteen integration hashes and eight foundation hashes
were independently verified and retained in
`docs/verification/signed-handoff-native-170006-20261020.json` and
`signed-handoff-native-170011-20261020.json`.

All forty local PGlite checks and 24 guarded-worker, 9 completion-adapter and
19 bounded-control regressions also passed (92 total). Four edited test modules
pass focused JavaScript lint; YAML parsing and whitespace checks pass. No
application runtime or SQL prototype changed, so this follow-up required no new
application build or connected database check. The first native run identified
only the test adapter's blank SQL NULL output; explicit `psql` null formatting
corrected the adapter. Both final native suites pass with the original SQL.
The existing worker (17 cases) and receipt/migration (18 cases) suites also pass
on both versions at this source in runs `39377445606` and `39377445695`.

## Remaining workflow integration

This closes the isolated signed-approval-to-handoff test gap. It does not make
general activation ready. Still required are real server authorization and
bounded execution policy, trusted checkout-intent capture, a reviewed connected
ownership lifecycle/adapter, complete native time and lock-order coverage, the live completion/notification
and ownership lifecycle, and release of the prepared correction to legacy
production payment-only entitlement activation. No real policy, spent test scope,
encryption key, route, connected schema or production setting is changed here.
