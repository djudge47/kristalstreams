# Read-only bulk comparison of saved CRM accounts

The CRM has a **Check all XUI accounts** control above the saved-order panels.
It checks every loaded CRM account, independent of the customer-list search or
filter. It does not enumerate XUI accounts absent from the CRM. Between 1 and
1000 distinct, complete saved identities are supported; an invalid or duplicate
identity blocks the run before any network request rather than dropping rows.

Clicking starts a browser-controlled sequential batch. Each GET to the existing
`/api/ks-roomba-crm?view=customer-comparison&customerId=<UUID>` reauthenticates
the confirmed administrator, reads only the saved ID/Panel ID/username, and
uses the existing documented `user_info`, `get_line` and `packages` reads.
The line ID, username and owning reseller must match. Only the matching package
ID/name and allowlisted status fields are returned. Missing catalog membership
remains unverified; no package or expiration is inferred from a screenshot.
There is no renewal review, approval token, payment, database write or provider
mutation in this view. The active-project and Preview-only gates remain.

Requests start at least 30 seconds apart. A 429 is retried at most twice, with
bounded waiting, then explicitly reported as failed. Authentication or connection
configuration failure stops the batch with incomplete coverage. Network and
malformed-response errors produce fixed text. The control never treats failed
or unchecked rows as verified. Stop cancels waiting or an in-flight read and
retains completed rows. Navigation, refresh or a changed saved snapshot cancels
and clears the run. No automatic polling, background task or browser storage is
used. About 10 minutes should be allowed for 20 accounts with the tab open.

For each verified identity the report compares package, connection allowance,
expiration, service status and trial flag. Exact timestamp instants are compared;
display is fixed to America/New_York with seconds and timezone. Missing or naive
saved dates remain unverified. Saved package names are compared to catalog names
without inferring a term, price, payment, playback or live connection count.
Results are transient review data and do not change stored CRM values.

The snapshot/report copies an explicit allowlist, never a whole CRM object.
Existing legacy CRM password UI/storage is outside this change; no credentials,
direct line URLs, notes, reseller balances or channel groups enter this report.
The deployment still has twelve API files and adds no environment variables,
schema migration, purchase flag or production promotion.

Validation: `node scripts/test-ks-crm-bulk-check.mjs` runs eleven synthetic checks,
including twenty accounts through the real authenticated route and provider-read
handler, complete coverage, identity/reseller gates, stop/retry behavior,
unverified differences, no secret leakage, and actual React result rendering.
Existing customer-status (13), renewal-review (37), and requested-order (18)
checks pass. ESLint and the Vite build pass. The application TypeScript check
retains 47 pre-existing diagnostics and has none in the changed components.
These tests do not claim that the owner's signed-in live batch has run; the owner
starts that read-only check from the existing Windows CRM session after Preview
deployment.
