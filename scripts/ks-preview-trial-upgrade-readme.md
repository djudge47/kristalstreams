# Existing-trial upgrade preflight

The private Preview CRM checks the administrator-owned test order against the saved trial, current reseller account, current line and standard package catalog. **Paid execution is not implemented or enabled.** This response cannot authorize a provider write.

## Why conversion is blocked

The supplied `xui-one-1.5.5-reseller-api(1).md` guide documents `edit_line` for renewing an active paid line. It explicitly says that expired renewal, package changes and trial-to-paid conversion have not been verified. It also warns that omitting bouquets in an edit can alter the selection. These renewal examples must not be treated as verified conversion semantics. Roomba must confirm the multipart fields, whether omitting credentials preserves both login values, how an active or expired trial's final expiry is calculated, and which credits are deducted before a guarded conversion action can be implemented and separately approved.

There is no `edit_line` request, paid activation handler, signed approval token, provider debit, customer write or paid-attempt claim in this change. A database claim, durable purchaser-to-line binding and ambiguity lock will be required before adding any provider write. The current read-only response is not that binding. No environment flag can turn this endpoint into a write operation.

## Private request flow

`GET /api/ks-preview-trial-upgrade?sessionId=...` is Preview-only and GET-only. Supabase `getUser` verifies the confirmed, non-anonymous administrator. The saved pending sandbox payment must belong to that exact signed-in account. This is a controlled self-test only; do not generalize it to customer accounts by matching names, emails, usernames or the operator who created a trial.

The existing saved-trial checker verifies receipt ownership and the linked CRM customer identity. The receipt supplies the original reseller ID, line ID, username and expiry. Caller-supplied line IDs, actions, packages, costs, credentials, URLs and approval tokens are ignored. Existing package reads use the fixed HTTPS/Fixie transport, bounded streaming parser, 60-second warm cache and failure cooldown. All twenty standard plan/connection combinations must be unambiguous.

After verifying the saved trial, two read-only requests obtain the current reseller account and the single server-selected `get_line` result in parallel. The latter is internal server transport only, not a new public route. Neither request follows redirects, falls back to direct/HTTP access, or automatically retries. The stream parser discards passwords and other unselected fields; only bounded line identity, package, expiry, allowance, flags and bouquet IDs survive. It validates the whole JSON response, including trailing data, even if mislabeled `text/html`.

The line must match the saved ID, username, reseller ID, trial package, one-connection limit and exact expiry, and both enabled flags must be true. Expired trials stop with a conflict instead of inventing expired-conversion behavior. Current bouquets must exactly match both the trial package and proposed standard paid package, and the verified account must have enough credits for the returned package cost. Simultaneous current-line checks share one read pair per warm instance; subsequent checks have a 30-second cooldown. Current-line results are not reused as execution authorization.

The response whitelists the saved payment/trial references, proposed package cost and duration, channel-group count, available credits and check timestamps. Successful preflight sets `requiresCurrentLineCheck: false` but always returns `draftOnly: true`, `providerActionSent: false`, and `execution: { enabled: false, reason: 'trial_conversion_unverified' }`. It does not mark the order active, calculate a paid expiry, claim that service was upgraded, or send email. The panel makes the provider-documentation block visible. The planned credential-retention policy is not a verified conversion guarantee.

Trial creation remains disabled; its spent single-attempt guard is unchanged. Existing paid-order/receipt tables, profiles, CRM records, payment status, production routing and production fulfillment are unchanged. A test Stripe payment is not real customer revenue and cannot fund reseller credits.

## Verification

`node scripts/test-ks-roomba-line.mjs` covers fixed destinations and IDs, auth/environment/method guards, private field stripping and bounds, malformed responses, redirects and no retries, exact line/reseller/group comparison, expiry and credit/freshness failures. `node scripts/test-ks-preview-trial-upgrade.mjs` covers purchaser ownership, saved-trial conflicts, package matching, current-line failures, concurrent read deduplication/cooldown and unconditional conversion blocking. Synthetic data only; neither test makes real provider requests or database mutations. Existing transport, controlled trial and CRM tests also need to pass after the streaming field whitelist changes. A signed-in check of the new current-line result remains pending after deployment.
