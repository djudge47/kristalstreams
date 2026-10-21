# CRM test approval: disabled execution

The Preview CRM can now save a **test approval** through the existing
`/api/ks-roomba-crm?view=renewal-test-approval` function. This is an authenticated,
explicit POST that records simulation-only evidence in the installed renewal
foundation. It is not permission to renew a line. The live approval button stays
disabled. No additional Vercel function or schema migration is required.

## User flow

Open a saved CRM customer and select Review renewal. Check the current customer,
term, cost, allowance and exact channel groups, then tick the review checkbox and
select Save test approval within five minutes. Saving checks XUI again and requires
the exact displayed plan to match. The confirmation appears
only after the server has read back the saved immutable binding and reserved
operation. It includes the operation reference and says that no renewal was sent
and no credits were spent.

The test saves one approval and one operation in state `reserved`. It consumes no
line version, holds no reseller reservation and creates no completion. It does
not update the customer, payment, receipt, channel selection or expiration. The
route has no provider write transport or begin/verify/complete RPC calls. It
cannot enable the execution control.

## Authorization and review binding

- Preview deployment and the exact active Supabase URL
  `https://wftfxerblhlsxiijtfbo.supabase.co` are mandatory.
- Supabase `getUser` verifies the Bearer token. Only the confirmed, non-anonymous
  administrator account `djudge47@gmail.com` can save. The database approver UUID
  comes from that verified identity, never browser input or user metadata.
- POST requires same-origin HTTPS JSON and only `reviewToken` plus an explicit
  `preserveCurrentSelectionConfirmed: true`, within the existing 1 KB body limit.
- The GET review performs no database write. It issues a signed v2 test intent
  binding the actor, customer, operation/approval UUIDs, complete plan fingerprint
  and a five-minute confirmation window starting when the review is issued. The
  displayed snapshot retains its original 30-second freshness window. It cannot
  be substituted for the new provider evidence required by the save handler.
- The HMAC uses a domain-separated key derived from the existing server-only
  Preview secret, which must be at least 32 bytes. Its purpose is distinct from
  offline rehearsal and any live renewal. The signed payload contains no provider
  credentials, reseller identity, raw provider response or service key. Its hash,
  not the token itself, is saved as the approval audit binding.
- The saved CRM expiration must already match the current provider expiration.
  A mismatch blocks saving; this flow does not repair or overwrite it.
- Before a new reserve, the server performs fresh documented GET reads of
  `user_info`, the CRM-selected `get_line`, and `packages`. It rebuilds the
  simulation-only plan and compares its complete fingerprint, including current
  balance, package catalog, term, credit cost, identity and exact selected groups.
  It rechecks intent expiry after those reads. The new provider evidence must still
  pass the unchanged 30-second planner/database checks. The saved approval expires
  at the earlier of fresh-evidence time plus 30 seconds or intent expiry. Additional
  package groups are never added. Original v1 tokens are rejected by the v2 route;
  they must be handled on their original deployment when investigating an old save.
- The existing reserve RPC independently checks current CRM identity/expiry,
  plan kind, freshness, immutable operation binding and approval audit identity.

See `scripts/ks-crm-renewal-test-timing-readme.md` for the connected timing failure
and regression coverage. No SQL migration or execution gate change is needed.

The route checks that execution is disabled before processing a save or replay.
If it is enabled, missing or unreadable, this test endpoint refuses the request.
No application environment/configuration flags were enabled for this work.

## Duplicate and uncertain outcomes

The signed operation/approval IDs are fixed per displayed review. A retry first
reads the same immutable binding and operation state. If already saved, it returns
the same references without provider reads or another reserve, even after the
review expires. A lost reserve reply is resolved with read-back only. Conflicting
bindings or non-reserved operation states are not returned as success. Claims
never leave the server.

The browser never automatically retries. An uncertain browser/save response
offers Check saved test approval and blocks starting a new review while checking
that attempt. The same token is retained in component memory. A page reload does
not preserve that pending token; use the saved database evidence for manual
investigation of an interrupted page rather than treating a reload as proof that
nothing was saved. This is not a live recovery or reconciliation feature.

Test records must remain test records. A future live worker must use separately
reviewed live approval authorization and purpose binding, not consume these test
reservations by turning on the execution switch. The current SQL accepts only
simulation-only plans. No provider mutation or real renewal validation has been
added by this change.

## Validation

Synthetic HTTP tests execute the real shared route and signed evidence checks,
covering admin/origin/project gates, altered fields/signatures, short secrets,
expired evidence, changed provider/CRM details, exact four-of-107 preservation,
failed/ambiguous storage and idempotent lost-reply recovery. Component interaction
tests exercise actual checkbox/save/fetch/render paths, stale clicks, duplicate
clicks, mismatched responses and recovery after a lost browser reply.

The installation SQL tests also run the actual HTTP handler against the unchanged
installed-schema SQL in the hard-named disposable database, verifying one saved
approval, reserved state, exact selection, no slot/version/completion, unchanged
CRM expiration and execution still disabled, including a lost SQL reply.
PGlite supplies local preflight; PostgreSQL 17.6/17.11 CI supplies native database
coverage. These tests create only fictional local/disposable records. No connected
customer approval, provider write, credit spend or production promotion is part
of development verification. A deployed signed-in browser check remains separate.
