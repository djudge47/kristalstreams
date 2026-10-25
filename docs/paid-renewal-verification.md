# Paid renewal identity and current-service verification

The paid receipt path now prepares one immutable review identity for an explicitly selected live renewal. The identity is separate from the completed manual purchase and never adopts its operation or repeats its credits. Payment ownership, recorded order, v2 selected service and the current approved CRM link must agree. Retries, including a lost database acknowledgement, recover the same saved operation.

The private binding freezes the receipt/payment identity, owner confirmation, selected customer/line, purchased terms and current CRM service baseline. Current ownership, username, expiry, allowance or package changes block the saved review. Preparation moves only that pending paid order to `requires_review` when it cannot safely proceed. It never changes customer service, profiles, receipts or billing.

`POST /api/ks-preview-paid-orders?view=paid-renewal-verification` accepts the paid reference and optionally its existing operation ID. A confirmed administrator may recover that same review by reference. Caller-supplied owners, customer targets, provider URLs, plans and execution flags are rejected. This endpoint shares an existing function and adds no Vercel function.

The handler rechecks private current facts before and after an independent provider snapshot. Its fixed-endpoint, strict TLS/Fixie provider exposes only documented GET reads. It checks line/reseller identity, active nontrial status, CRM expiry/allowance/package agreement, a unique requested standard package, channel preservation, catalog cost, available balance and a 30-second evidence window. No provider password or API key reaches the response. All responses remain `mayDispatch:false` and `providerActivated:false`; `verified_for_review` is not execution consent or working access.

The current review deliberately requires an enabled, unexpired paid service. Missing, stale, ambiguous or unsupported cases remain for review. No new execution policy, future expiration calculation, durable dispatch claim, spend limit consent, reseller slot, automatic recovery/write, completion projection or credential delivery is implemented by this batch. Those remain separate work before coordinated release. Live flags and all existing manual renewal protocols stay unchanged.

Verification uses fictional payments, Auth, SQL and provider transport only:

- `scripts/test-ks-paid-renewal-verification.mjs`: actual migration/RPC, independent-read validation, lost-response recovery, drift, expiry, roles and administrator HTTP boundaries.
- `scripts/test-ks-checkout-intent.mjs`: actual selected checkout → paid receipt → route → stable renewal review, including replay.
- `scripts/test-ks-crm-renewal-live-http.mjs`: forced GET-only Production transport plus unchanged controlled write protections.
- `scripts/test-ks-live-receipt-native.mjs`: independent PostgreSQL sessions, concurrent preparation, first-writer rollback, service drift during a waiting retry, private roles and immutability.
- Application quality and existing receipt, recovery and signed-handoff workflows remain required.

The migration source is `supabase/migrations/20261025041152_add_private_paid_renewal_review_binding.sql`; connected installation and exact-source evidence are recorded separately when complete. Website changes remain staged in draft PR #33. No Production promotion, real payment, provider write, email or credit spend is part of this batch.
