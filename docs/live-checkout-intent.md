# Checkout purpose and immutable paid-order routing

The private database prerequisite is installed in the active Kristal Stream project as migration `20261025033932`, October 24, 2026 (America/New_York). SQL bytes match the CLI-generated draft tested at `1af8633`; the repository filename now follows connected migration history. All three connected function-body hashes match. Existing Preview functions/requests/intents and customer payment/access state remain unchanged. Website integration is staged in PR #33 and has not been released to Production.

Live-capable authenticated checkout now captures `new_service`, `renewal` or `requires_review` in an immutable server record before returning a payment URL. Its owner UUID, email, approved catalog price, term, connections, purpose, canonical return origin, request ID and expiry are frozen. Stripe metadata must match that record when the paid session is verified; browser metadata alone grants no authority.

The additive `ks_live_checkout_requests` ledger leaves the installed Preview v1 table, functions, parameters, browser storage and Stripe idempotency keys unchanged. Production uses a separate live namespace and canonical `https://kristalstream.com` origin. The live SQL reserve function rechecks the confirmed Auth identity and existing profile using only the already-approved Auth columns. RLS, private table/column grants, invoker functions and immutable binding triggers protect the ledger.

New live checkout admission requires both existing server controls: `KS_CHECKOUT_INTENT_ENABLED=true` and receipt-only live fulfillment enabled. The existing client choice flag must be paired during the future coordinated release. No flag or configuration is changed by this patch. No provider dispatch, customer entitlement, budget reservation, email, charge, or activation occurs when intent is saved.

Once a live bound checkout has been accepted, fulfillment keeps its receipt-only protocol even when admission is paused before the first receipt/queue exists. Both webhook and owner confirmation use the same `fulfill()` implementation. A verified paid session records one receipt/queue, saves its immutable review route and uses the existing idempotent pending-alert protocol. A failed intent read stops before legacy activation or notification. It never creates a replacement payment.

Browser storage keeps separate live/test requests. Existing Preview keys remain v1. Retries send the saved request ID and, when known, the saved session reference. The server rejects a changed or wrong-mode reference before creating a Stripe session. Lost acknowledgements reuse the original frozen request and Stripe key; they never rotate IDs automatically. Confirmation clears only the matching saved reference. The public Stripe key determines client storage mode only; the server independently enforces the payment environment and every paid-session field.

## Review and release boundaries

- A new-service route remains an eligibility review, not permission to create a provider line.
- A renewal route needs exactly one approved current CRM ownership link. Missing, stale, multiple or trial links require review. Explicit selection for multiple services remains unfinished.
- This completes authenticated live-capable purchase-purpose capture and its connection to receipt/routing logic. It does not finish general live provider execution, live completion/recovery or credential delivery.
- Historical unbound checkout sessions retain their old recovery protocol. No backfill or intent is invented for them.
- Website changes remain staged until the full payment-to-service workflow and coordinated release are ready. A database migration must be installed before releasing code that uses it; installing the ledger does not enable checkout or automatic renewal.

## Validation

The existing checkout suite now executes both Preview and Production contexts against disposable SQL and a simulated Stripe transport. It covers all 20 approved combinations, owner/price/purpose binding, lost acknowledgements, same-key retry, wrong mode, immutable history, known references, paused admission and paid new-service/approved-renewal routing. Separate client tests compile the actual browser adapter and intercept Auth/HTTP to verify purpose/reference payloads, v1 storage preservation, failed requests and safe navigation. Native PostgreSQL 17.6/17.11 tests exercise concurrent reservation/binding, rollback recovery, grants and unchanged Preview function bodies. No connected customer, email, provider or payment is a test fixture.

Local results: 27 Preview and 31 Production checkout SQL/handler scenarios, seven storage/retry scenarios, six compiled client scenarios, 10 origin scenarios, two initial-render scenarios and 15 receipt-rollout scenarios passed. Strict TypeScript, zero-warning lint, nine application-quality cases and the production build passed. Native workflow `40158941780` passed 40 cases on each database version. Connected post-installation checks confirm zero live checkout requests, unchanged Preview definitions and billing/access digests, no new security warning and all three renewal execution controls off.
