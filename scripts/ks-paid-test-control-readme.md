# Bounded Preview paid test

This release installs a disabled-by-default approval control in the existing private paid-order function. It does not enable or perform a real creation. The owner must separately approve the exact real-credit test before the branch-only server configuration is installed. Never place this configuration or login encryption key in a VITE variable.

## Scope

`KS_PREVIEW_PAID_TEST_SCOPE` is one server-only JSON value with exactly these keys, using fictional values here:

```json
{"enabled":true,"sessionId":"cs_test_FictionalOnly","ownerId":"00000000-0000-4000-8000-000000000001","customerEmail":"fictional@example.invalid","resellerId":"99999","creditUnits":"1000000"}
```

The server requires Preview on `codex/roomba-https-preview-f00470c0`, the exact saved sandbox checkout, a distinct confirmed customer, matching current email/reseller, canonical Bronze monthly/one-connection/$20 payment, and exactly one real credit. The existing encryption and preview-signing keys are reused. Do not replace encryption keys or reset spent trial/paid attempts.

No scope means the confirmed administrator sees the control as disabled. Forged request fields cannot enable it. Production rejects every control request. The existing ordinary review remains GET-only and never issues a token or writes state.

## Flow

`/api/ks-preview-paid-orders?view=paid-test-control` shares the existing function; no thirteenth function is added. GET reads the saved status. JSON POST requires an exact known same-origin browser request, current confirmed administrator, and installed exact scope. `prepare` repeats the complete read-only payment/customer/provider review and returns an in-memory two-minute HMAC quote. It reserves nothing. A matching reserved attempt may receive a fresh quote; dispatching or ambiguous attempts may not.

`execute` additionally requires the quote, explicit new-customer attestation, exact `SPEND 1 CREDIT` confirmation and integer credit amount. It rechecks the fresh review and signed balance/package identity before durable reservation. The SDK worker independently authenticates the administrator and revalidates the payment, customer, package, credits and encrypted immutable attempt before the one-time dispatch claim. Provider creation is through the fixed HTTPS/Fixie adapter with no transport retry. The existing reseller lock, forward-only states and atomic Preview CRM/order/encrypted-login completion remain authoritative. The real account is never matched by a display label supplied by the caller.

`complete` accepts only a saved verified result or already completed attempt. It supplies no approval token, so it cannot dispatch a reserved attempt. It may recheck the saved provider line and retry the atomic local completion without another creation. An uncertain result stays stopped for manual reconciliation; there is no automatic resend, lock TTL, reset or deletion route.

The shared function has a 300-second duration to allow bounded provider/Stripe/database checks on Fluid Compute. Browser creation/completion requests wait at most 270 seconds. A lost browser reply is resolved only by an explicit saved-status read. The browser never automatically submits creation, persists/copies credentials, or keeps an approval after expiry, account change, hidden tab or unmount. If the deployed project does not support a 300-second function, keep the scope absent and correct that platform configuration before a real test.

## Validation

Run `node scripts/test-ks-paid-test-control.mjs`, the existing paid-review/guarded-worker/payment/queue/login/customer suites, scoped TypeScript and React lint, and the build. Fixtures use fictional identities and injected provider/storage adapters. No test requires a real provider write, credit spend, email or customer mutation. Actual paid creation and owner login handoff remain unverified until a separately approved test completes.

The scope authorizes one saved order only. Remove it after verification; do not generalize it to every customer or to production. Trial conversion and existing-service changes remain excluded.
