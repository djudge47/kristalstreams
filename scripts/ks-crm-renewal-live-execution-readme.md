# Protected renewal execution and recovery draft

When a provider accepts a renewal but its response is lost, retrying the edit
could spend credits twice. This draft records a committed dispatch decision
before one provider call and uses durable status to recover without resending.
The subsequent Preview bridge and documented transport are described in
`ks-crm-renewal-live-connection-readme.md`. Live SQL installation and actual
provider sending remain disabled; no real renewal has been performed.

## Components and authority

- `ks-crm-renewal-live-consent.js`: dedicated HMAC consent, immutable operation
  and consent IDs, actor/customer/full-plan binding and original five-minute
  deadline. `identify()` verifies the same signed identity after expiry solely
  for lookup; `verify()` still requires unexpired consent, both confirmations
  and fresh unchanged evidence. Neither returns dispatch permission.
- `ks-crm-renewal-live-plan.js`: builds purpose-separated live evidence and the
  existing documented preservation form from a fresh validated snapshot. A
  live plan cannot be used as a simulation plan or vice versa.
- `ks-crm-renewal-live-ledger.js`: explicit service-client adapter restricted
  to the active Kristal Stream project and new `ks_crm_live_` RPCs. The adapter
  never changes a switch, reads the test ledger or creates credentials.
- `ks-crm-renewal-live-execution.js`: injected executor, tested with fake
  provider adapters and actual isolated SQL. The calling trusted server must
  independently authenticate and authorize the administrator; a UUID argument
  or adapter label is not authentication. No runtime environment fallback exists.
- `fixtures/ks-crm-renewal/live.sql`: **disposable test database only**, hard
  guarded to `ks_disposable_crm_renewal_test`. It refuses a changed three-protocol
  guard, creates six private RLS tables, starts a separate execution switch off,
  and preserves all three installed reseller-exclusion protocols. This is not
  a deployable Supabase migration and has not been installed on a connected DB.

Service role is trusted server authority. Invoker functions require its table
privileges; they do not protect against a compromised service key. Browser roles
have neither table nor function access. Claims remain server-only.

## Dispatch and recovery contract

1. Verify signed attempt identity and read the disabled-by-default gate. An
   unreadable switch or lookup stops before provider work. Existing `complete`
   attempts replay locally. Only saved `provider_verified` results may resume
   local completion. All other existing attempts require reconciliation.
2. For a missing attempt, require both explicit confirmations and unexpired
   consent. Read saved CRM identity and fresh provider account/line/packages.
   Rebuild and compare the full signed plan. Evidence must be at most 30 seconds
   old; its deadline is the earlier of consent expiry and evidence +30 seconds.
3. Reserve immutable live evidence, then commit begin with a unique consumed
   line version and a shared physical-reseller slot. Only a fresh reservation
   plus a successfully acknowledged `true` begin permits the next step. Lost
   reserve or begin replies stop; replay or lookup cannot recreate permission.
4. Recheck the gate and deadline after begin. Invoke `provider.renew` once with
   the preserving multipart form. The transport contract forbids automatic HTTP
   retries, direct fallback or redirects that replay an edit. The subsequent
   transport implements the supplied guide's documented `edit_line` contract;
   real sending remains separately gated off.
5. Require safe normalized return and independent readback to match line,
   reseller, package, connections, exact sorted groups and paid/active flags.
   Require equal provider expiry and exact account credit debit, then persist a
   verified result. Normalizers must discard passwords and other raw secrets.
6. Re-read the provider line before atomic SQL completion. Update only saved
   `expiration_at` with exact customer/external-ID/username/old-expiry matching,
   write one completion audit, mark complete and release the reseller slot in
   the same transaction. Other CRM, billing and integration columns are untouched.

Provider uncertainty retains the line version and reseller slot. No automatic
reset, resend, release or inferred success is provided. A lost result-save reply
can recover only if SQL actually contains a verified result. A lost completion
reply replays the completed operation without a provider call. Recovery after
consent expiry never starts new dispatch; gate-off also blocks local completion.

## Validation and remaining activation work

The PGlite preflight and PostgreSQL 17.6/17.11 independent-session CI execute the
same unmodified draft SQL, actual executor, consent and ledger adapter. Tests
cover disabled/missing gates, test/live separation, immutable lookup bindings,
lost reserve/begin/result/completion replies, stale post-commit evidence, debit
and readback drift, changed CRM expiry, replay races, retained reservations,
shared setup/test exclusions, native contention, rollback and atomic completion.
All identities and provider effects are fictional; external fetch is forbidden.

The Preview bridge now supplies owner-only authentication, same-origin request
controls, an explicit single-send provider transport and safe normalizers.
Before real activation: review a connected installation separately, issue a
dedicated key and complete a separately approved controlled provider test. The
27–32 day/month bounds reject gross duration errors but do not establish exact
calendar, DST or month-end behavior. Actual credential retention is also still
unverified. Production enablement, real renewal and credit spend are not included.

Local preflight:

```sh
KS_RENEWAL_SCHEMA=installation KS_PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node scripts/test-ks-crm-renewal-db.mjs
node scripts/test-ks-crm-renewal-live-consent.mjs
```
