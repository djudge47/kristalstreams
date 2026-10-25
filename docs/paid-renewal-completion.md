# Private paid-renewal completion and local recovery

Completion now requires a frozen pre-send expectation, a matching safe provider acknowledgement, an independent line/account read and the exact quoted credit debit. A separate fresh line read must still match before the local CRM transaction completes. No provider write is implemented or invoked by this adapter.

Timing is deliberately limited to the owner-reviewed six-month/four-connection → six-month/three-connection reset behavior. Before any future transport, a fresh independent review, explicit policy review and unused-time-loss confirmation are required. SQL computes and freezes the expected New York calendar expiry from the committed send-guard timestamp; it never derives the expected expiry from a returned provider result. Other timing/order combinations stay for review. This policy evidence is not a live execution route or new credit authorization.

The immutable expectation records the pre-send credit balance. Safe proof must match the exact customer/line/username/reseller/package, requested allowance and preserved channel groups, enabled nontrial state, whole-second expiry within the narrow reviewed timing window, and exact balance decrease. Missing expectations, mismatched acknowledgements or independent reads, wrong debits, changed ownership and unsupported policy cannot record success. An uncertain send is never adopted automatically from a later matching line.

After saved provider verification, local completion atomically:

- Rechecks the receipt owner, approved service link and unchanged original CRM baseline.
- Records one immutable completion, updates only that CRM service's expiry, allowance and package, and marks that paid queue complete.
- Moves the same operation to complete and releases only its verified reseller slot. Its line-version history remains immutable.

A deferred commit check rejects changed ownership or partial service/queue/completion state. Queue completion accepts the new live proof without weakening existing Preview completion or review-reset guards. Direct slot deletion remains blocked until verified local completion. Billing/payment history, profile entitlements, credentials, unrelated customers and the old manual operation remain unchanged.

Matching proof or completion retries recover the saved result. Lost acknowledgements, a failed queue write and consent/quote expiry or dispatch pause do not cause a provider resend. Local completion after an already verified provider result remains available with a fresh matching line read; ownership or CRM drift leaves it pending rather than overwriting manual changes.

The adapter `_server/ks-paid-renewal-completion.js` requires explicit trusted dependencies and the active project. It exposes no HTTP issuance/execution route. Its public projection contains no claim token, provider identity or credentials and always retains `mayDispatch:false` and `providerActivated:false`. `renewalCompleted` reports saved local completion, not current streaming availability. Customer-facing live completion projection and financial/account display integration remain separate release work; existing owner status still treats an unprojected live completed marker as requiring review.

Tests use disposable SQL and intercepted provider/Auth only. Actual SQL/adapter cases cover exact proof, unsupported policy, missing expectation, mismatch/credit failure, lost proof/completion acknowledgements, gate/consent pause and manual CRM drift. Native PostgreSQL cases race proof/completion workers, roll back completion, inject a queue-write failure, change ownership before commit, reject wrong proof, and recover verified work after quote expiry and dispatch pause. Existing manual and Preview regressions remain required.

Installed migration: `supabase/migrations/20261025091959_add_private_paid_renewal_completion.sql`. The exact SQL passed 70 native cases on each of PostgreSQL 17.6 and 17.11 before installation. Connected function bodies, private roles, deferred completion guard and conditional slot release were verified. Customer billing/access, historical manual operation and all existing count/digest values are unchanged; all four controls remain off and the new expectation/proof/completion tables remain empty. See `docs/verification/paid-renewal-completion-install-20261025.json`. Source remains staged in draft PR #33; all live controls stay off.
