# CRM XUI review read failures

The deployed renewal review returned a generic verification error after the
customer-expiration mismatch was corrected. That message alone does not identify
the failing external read or prove that the provider is unavailable.

Runtime log access for the active Preview was denied by the Vercel logs API
(HTTP 403); no Vercel CLI or local environment credentials were available for a
scoped fallback. The denied query is not evidence that logs were empty. No
signed-in browser session or deployment protection bypass was used.

The read-only status/review handler now identifies failures in the account,
CRM-selected line or package-list read. It maps only fixed categories for timeout,
rate limiting, upstream refusal, configuration, invalid response, connection,
identity mismatch and failed verification. Raw errors, provider bodies, URLs,
keys, passwords, tokens and customer identities are never returned or logged.
Only the fixed view/stage/category tuple is written to application warnings.

Authorization, exact-project restriction, provider GET allowlist, ownership
checks, freshness, cooldown and all renewal execution gates remain unchanged.
There is no automatic retry and no fallback to a different provider endpoint.
This change writes no CRM or XUI data and spends no credits. It improves failure
evidence; it does not claim to repair an external connection that has not yet
been observed directly.

Verification executes the real shared route, synthetic provider failures and the
actual React click/fetch/render path. It checks package timeout wording, stage
mapping, refusal/rate-limit distinctions, removal of a previous ready review,
and exclusion of arbitrary provider errors. Existing status/test-approval checks
also pass. A deployed signed-in retry is still needed to observe the current
external failure with the new diagnostic.

The connected retry succeeded after the exhausted Fixie allowance was increased,
but saving the test approval returned the older generic pre-reservation error.
A SELECT-only read confirmed no test approval/operation for the selected customer,
the corrected expiration unchanged, and live execution still disabled. The save
handler now reports fixed categories for its saved-customer, account, line,
package and plan verification steps as well. Proxy refusal (including HTTP 407)
does not claim whether authentication or allowance caused it. Planner failures
are mapped from an explicit allowlist; arbitrary exception text stays private.
Post-reservation uncertainty still requires checking the same immutable attempt,
and is never reported as a definite failed save. No freshness window, identity
check, database write, retry or execution behavior was changed.
