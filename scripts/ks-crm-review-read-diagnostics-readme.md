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
