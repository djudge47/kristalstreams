# Separate review intent from fresh save evidence

The connected test save returned "This review expired. Load a new renewal review
before saving." That branch runs after the three fresh provider reads. The
original implementation made the initial read, the operator's confirmation and
the save-time reread share one 30-second window, so otherwise valid saves could
expire while XUI was being checked.

The v2 test-review intent gives the operator five minutes after issuance to
confirm exactly the displayed plan. Its signature binds the verified actor,
customer, operation/approval UUIDs, full plan fingerprint, original snapshot time,
issuance and deadline. It is still simulation-only and is never live renewal
authorization. Purpose, derived signing-key domain and approval-audit hash domain
are versioned together; v1 tokens are rejected on the new endpoint.

Snapshot freshness has not been extended. Issuance still requires a snapshot no
older than 30 seconds. Saving reauthenticates the admin, verifies execution remains
disabled, rereads the saved customer, and fetches user_info, the server-selected
get_line and packages. It rebuilds and compares the entire plan fingerprint,
including balance, cost, package catalog, identity, expiry, allowance and exact
groups. New evidence starts before these reads and must be no older than 30
seconds at reservation. The unchanged SQL independently enforces that bound.
The saved approval expires no later than fresh evidence plus 30 seconds, and
never beyond the signed intent's deadline. No database migration, provider edit,
new live capability or enablement is included.

The browser keeps confirmation available during the five-minute intent, clearly
says that saving checks XUI again, and still blocks expired intent, changed
customers, double clicks and new reviews after an uncertain save. A saved v2
attempt remains readable after intent expiry without a new provider read or RPC.
An old v1 attempt must be investigated on its original deployment or by a bounded
database read rather than presented as an unsaved v2 attempt.

Regression coverage includes a 12-second initial read, a minute of operator
review, and a 12-second reread: it succeeds with new, 12-second-old SQL evidence.
An expired intent fails before provider reads; a 33-second reread still cannot
reserve. Actual component clicks exercise confirmation after the displayed
snapshot expires. Existing exact-plan drift, signature/actor/origin/project,
lost-reply, immutable replay and disabled-execution tests remain in force. The
real HTTP/SQL fixture checks the unchanged installed SQL in disposable databases.
