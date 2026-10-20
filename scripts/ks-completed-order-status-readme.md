# Completed-order rechecks and owner status

The pending-only customer query previously dropped completed orders. Rechecking
a completed payment could also reach the ordinary notification path. This draft
adds a separate saved-completion check, preserves payment records after expiry,
and skips pending/setup email invocation when a completed payment is rechecked.
It enables no provider operation or live completion contract.

## Completion evidence

`ks-preview-completion-status.js` reads the existing Preview fulfillment with
explicit FK hints for its attempt, owner-login binding, receipt and CRM customer.
All four owner fields and the receipt's Sandbox mode are filtered in the query;
checkout references are bounded to the requested five orders, with one extra
row allowed only to detect an invalid oversized result. Every returned binding
is checked again in the server. Missing, duplicate, foreign or inconsistent
proof stops the response instead of inventing pending/ready service.

The validator matches purchaser, checkout, payment intent, fixed catalog,
connection count, package months, credentials-ready attempt, provider line,
CRM identity/source/allowance and expiry, plus the saved owner-login binding.
Receipt activation must remain false and its website expiry null. Completion
and receipt dates must agree with the saved chronology; the provider term is
bounded. Equivalent timestamp representations are compared as instants.

The query selects no username, password or encrypted envelope. The returned
metadata contains only setup state and normalized service expiry. A current
saved period is `setup_complete`; at or after its expiry it is `setup_expired`
with no current provider-ready flag. This is saved completion evidence, not a
fresh provider read or playback/availability test.

A read-only connected catalog check confirmed every explicit relationship name;
see `docs/verification/completion-relationships-20261020.json`. No migration,
grant, policy or Auth setting is needed or changed. Deployed PostgREST/Preview
end-to-end verification remains separate.

## Payment and notification behavior

For a completed Sandbox queue, shared fulfillment verifies the separate proof
before returning completion/expiry metadata. Confirmed and expired rechecks
invoke no pending/setup notification. Missing proof preserves the payment but
returns a sanitized verification error with “do not pay again.” This path does
not create a line, update a profile, reserve work or grant access.

An existing completed receipt-only queue is accepted only as a replay of both
receipt and queue. Its money remains acknowledged, while the response requires
review rather than claiming live service readiness or sending a pending alert.
The live owner view applies the same review boundary to a completed queue.
No live proof, credential handoff or provider completion was invented.

Legacy frozen email records and delivery keys are unchanged. Already prepared
or ambiguous notification work still requires its existing reconciliation rules;
this patch does not cancel an in-flight delivery or send a completion email.
The protected pending handler continues to reject non-pending queue states.

## Customer and support views

The owner status endpoint now includes completed Preview queues and performs
one additional batched proof read only when needed. Pending-only reads keep one
queue query. Server auth, owner filters, five-row bound, no-store caching and
independent response validation remain. An expired period stays visible rather
than appearing unpaid or currently ready. Recent orders remain bounded to five.

Dashboard cards show a status per order, so a mixed list cannot label every order
pending or ready. Verified service expiry appears only for completed/expired
Preview orders. Payment confirmation distinguishes expiry from payment failure.
Support context and its actual ticket form carry the selected order's real mode,
setup state and saved expiry; they no longer label every entry as a pending test
or claim no streaming activation occurred after a completed setup. Nothing is
submitted until the user explicitly creates the ticket.

Browser parsers bind the response account and mode, whitelist fields, and require
dated, consistent completion/expiry capabilities. Live provider-ready responses,
missing expiry and contradictory flags are rejected. Existing credential reveal
remains a separate protected Preview-only flow.

## Verification — October 20, 2026

**121 local checks passed** across completion proof/actual fulfillment, real-SDK
owner queries, receipt/live-rollout handling, payment/support presentation,
initial rendering of the actual dashboard/payment/ticket components, legacy
and pending email, Preview queue and protected login regressions. Test data and
transports are fictional or intercepted. The twelve actual-component renders
are initial-render checks, not a signed-in browser flow or ticket submission.
The Vite build passed in 11.28 seconds. Focused JS lint and targeted React lint
pass; the installed TS ESLint rule needs explicit default options, as in the
earlier validation, without disabling it or changing dependencies. TypeScript
retains exactly the same 45 baseline diagnostics, with no new diagnostics.
See `docs/verification/completed-status-local-20261020.json`.

[Native run 39376156622](https://github.com/djudge47/kristalstreams/actions/runs/39376156622)
passed **17 cases on each of PostgreSQL 17.6 and 17.11**, source
`f756b1a4cb78f49c67df909db56ffaa5bfb4efad`, tree
`07758988d64df713d560f22abc902e32c4312eb6`. In addition to the prior fifteen
worker recovery/ownership cases, the actual worker commits a completion despite
a lost acknowledgement, then the new native read joins feed the actual proof
validator, owner mapper, browser parser, support snapshot and payment presenter.
One CRM/fulfillment/encrypted owner binding remains; status reads create no
additional provider request and preserve full profiles. At the saved expiry
boundary, the same records become expired rather than current-ready or unpaid.

Both downloaded report ZIP digests, tested commit, actual server versions,
seventeen results, execution/helper source hashes and all foundation SQL hashes
were independently verified. Retained reports:

- `docs/verification/completed-status-native-170006-20261020.json`
- `docs/verification/completed-status-native-170011-20261020.json`

The existing receipt/migration suite also passed eighteen checks on each server
at this source in
[run 39376156645](https://github.com/djudge47/kristalstreams/actions/runs/39376156645).
No SQL source or migration changed in this follow-up. Later documentation/report
commits preserve the tested application, harness and SQL.

The live owner/completion/credential lifecycle, renewal/trial conversion,
uncertain-operation reconciliation, completion-email protocol, reviewed handoff
integration and connected end-to-end release checks remain open. The live
receipt-only flag stays absent; nothing was merged, migrated or promoted to
production, and no real line, charge, email, ticket or credit spend occurred.
