# Requested renewal order review

After **Check XUI status**, **Change renewal order** allows an administrator to
choose 1, 3, 6 or 12 months and 1–5 connections. **Review requested order** uses
the existing shared CRM function with the new GET-only `customer-renewal-order`
view. It accepts only a saved CRM UUID and the requested month/connection counts.
No provider package, cost, line reference, destination or execution confirmation
is accepted from the browser.

The existing confirmed administrator, active Supabase project and Preview gates
apply. The server reads the saved identity and expiration, then the documented
`user_info`, `get_line` and `packages` actions. It independently resolves a unique
standard package from that fresh catalog and quotes its exact credit cost. It
requires an enabled, unexpired nontrial line, matching CRM/provider expiration,
verified current package/allowance, a sufficient readable credit balance and a
valid selected group subset in both the current and requested packages. It never
expands that subset to the full package. Alternative package families, ambiguous
targets, missing fields and unknown channel selections require manual review.

The response is catalog feasibility, not live readiness. It returns no renewal
plan, form, approval token, predicted expiration, test approval, reseller identity
or private catalog. A compatible catalog does not establish the provider's
behavior when changing package or connection allowance. Treatment of remaining
time, connection-limit timing and the exact debit still require provider
verification before a real changed-order renewal. The UI states that limit and
has no save, approval or execute control for this review.

Each requested term/allowance has a separate cache key; only current and matching
candidate packages are retained. Cached reviews still recheck administrator and
saved identity/expiration and preserve candidate ambiguity. Evidence expires 30
seconds after the first provider read starts. The browser clears the quote on
selection changes and failed refreshes, hides it on customer identity changes,
and marks expired snapshots. The route never writes a customer or approval,
changes execution switches, calls `edit_line`, spends credits, changes a password,
charges a payment or sends email. Existing same-package approval and execution
protocols are unchanged. Deployment remains at twelve functions.

Verification: `node scripts/test-ks-crm-renewal-order-review.mjs` exercises the
actual server helper, authenticated route and React selection/click/render path
with fictional dependencies. It covers all supported dimensions, exact decimal
credits, subset preservation, incompatible/missing/ambiguous packages, expired
or mismatched evidence, failed reads, request validation, cache isolation,
concurrency and malformed responses. These synthetic checks do not verify live
provider package-change semantics. The existing parent component fixture stubs
this independently tested child to isolate its flat simulated hook store.
