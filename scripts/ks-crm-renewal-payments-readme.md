# Record a renewal payment without changing service

The Preview CRM **Record renewal payment** form replaces the one-month shortcut. Choose the customer's requested 1/3/6/12 months and 1–5 connections; the current shared website catalog supplies the full-term USD price. Actual amount, payment date/time and method are required and start blank. A differing received amount requires an explanation (for example, an agreed discount or partial payment). The displayed catalog price is never treated as proof of money received.

The administrator explicitly confirms that money has already been received. This form records an external/manual payment; it does not charge a card, contact a payment provider, send email, renew XUI, or spend credits. Trial, personal and Preview setup customers cannot receive these entries. A customer can request a different package without changing the current XUI package, connection allowance or expiration.

## Transaction and scope

The existing CRM function's `view=renewal-payment` accepts a small same-origin JSON POST or authenticated receipt-status GET. Preview, the active project and confirmed non-anonymous administrator are mandatory. Browser data supplies no actor, catalog price, customer status or service patch. Both server and SQL compute/check the existing catalog; one private service-invoker transaction inserts the actual full-term payment, requested-renewal receipt and history together. No customer row is updated, so the old automatic payment trigger is not invoked and no duplicate monthly receipt or invented service period is created. Existing prices, old-pricing classifications, payment rows and dates remain unchanged.

`ks_crm_renewal_payments` has RLS, no browser table privileges/policies, and no browser function execution. The two functions use empty search paths and security invoker. A transaction advisory lock and immutable request fingerprint bind the receipt UUID to the verified actor and complete payment data. Replaying an identical reference returns the original payment. Conflicting content or actor is rejected; any insert failure rolls back the receipt, payment and activity together.

## Response recovery

A versioned per-customer session-storage record retains only the payment reference and bounded payment form values, never login credentials. It is written before dispatch; storage failure prevents dispatch. An uncertain response freezes the form and offers **Check saved result** or **Retry same saved payment**, which always reuse the identical UUID/payload. Reopening the form recovers the same reference and never posts automatically. After a verified result, a second payment needs the explicit **Record another payment** action and new actual amount/date/method. Local submit locking also prevents two same-render submits from replacing the recovery reference.

The receipt/history records the chosen term/connections, actual amount/date/method, website price snapshot and any price-difference reason. `period_start` and `period_end` stay null until there is real service evidence. The current customer classification is deliberately not used as the receipt: legacy payment confirmation still describes the old service term. XUI renewal remains a separate reviewed action, not connected to this form.

## Verification

Use isolated PGlite 0.3.14:

```
KS_PGLITE_MODULE=<isolated-runtime>/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-ks-crm-renewal-payments.mjs
node scripts/test-ks-crm-renewal-payment-ui.mjs
```

Nine SQL/HTTP scenarios cover all 20 catalog totals, actual full-term payments, the old customer payment trigger, unchanged service/customer fields, strict auth/environment/origin/confirmation, exclusions, idempotency, actor/content conflicts, lost-response recovery, private grants and rollback. Three actual React interaction scenarios cover selectable pricing, blank actual amounts/dates, duplicate submission, uncertain-result recovery, reopening and explicit next-payment flow. Fixtures are fictional; no connected payment is created to test the form.

Installed in the active project as migration `20261022154007_ks_crm_renewal_payments`. Source/migration SHA256: `7ec4511b1cd15f9706fa23f10151e8fe80d81581f560185e42dc971310242cef`. Connected SELECT verification found zero new renewal receipts, the same four payment rows and 46 activity rows, and identical safe customer snapshot digest `23edac4df15d8d47ed01138531ff2edf` before and after installation. RLS, browser revocations and both private invoker functions passed permission checks. All three XUI purchase controls remain off; the one existing operation/completion was preserved. Security advisors retain the one pre-existing warning; the new no-policy INFO is intentional for server-only receipt storage. No real payment or XUI action was used for validation.
