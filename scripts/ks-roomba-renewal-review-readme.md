# CRM renewal review (Preview, read only)

**Review renewal** on a customer card rechecks the current reseller, the exact
saved CRM line ID/username, and the provider package catalog. It shows the
current package term, exact published credit cost, balance at the check, and
fixed reasons for manual review. It never prepares or submits an `edit_line`
form, creates an approval token, updates CRM dates, records a payment, or sends
mail. Submission is not enabled.

The route shares the existing function:

`GET /api/ks-roomba-crm?view=customer-renewal&customerId=<UUID>`

The default receipt GET/POST and existing status view remain intact. Deployment
still contains twelve API function files. Authentication, active Supabase
project restriction, minimal CRM column selection, fixed HTTPS destination,
Fixie transport, streaming credential filtering and bounded cache behavior are
shared with the live-verified status check. The review adds a `packages` GET;
all three provider actions are read only. The UI makes no automatic request.

The documented verified renewal case is an **active paid line with its current
package**, unchanged channel groups and unchanged connection allowance. The
review requires a complete standard 1/3/6/12-calendar-month package, positive
published cost and a readable sufficient balance. It selects the package by
the line's current package ID, never by browser input, cheapest cost, website
tier or a fallback name. Trial conversion, expired/disabled lines, alternative
package families, mismatched groups/allowances and incomplete catalogs require
manual review. No package-change semantics are inferred from paid creation.

No new expiry is predicted: the provider must return it after any separately
approved future renewal. Provider calendar months are not converted into the
website receipt's fixed day count. Credits are reseller costs; this review
does not infer customer pricing, payment or an affordable future execution.

Reviews older than one minute lose readiness, including cache hits. Cache hits
still recheck authentication and CRM identity, and line expiry is recalculated.
The read-start timestamp is retained so slow catalog reads cannot make old
balance data appear newly checked. A failure clears the displayed old review.
A future write must revalidate all evidence, obtain concrete authorization,
claim a durable unique operation and reconcile an ambiguous provider result
before another attempt. The current response supplies none of that authority.

## Verification

`node scripts/test-ks-roomba-renewal-review.mjs` covers eighteen synthetic
scenarios: readiness, package/identity/ownership matching, credit bounds,
expiry and freshness boundaries, unsupported cases, safe output, method/auth
gates, exact GET actions, failures and concurrency. Four cases execute and
render the actual React component, including its click → fetch → shared route
→ synthetic provider → displayed result and removal of stale success on error.
These are isolated component tests, not a deployed browser or live renewal.
The prior 65 status/admin/transport/line/CRM checks remain in CI, plus lint and
the Vite build. No connected database query or migration is needed for this
extension; it uses the existing verified customer selection.
