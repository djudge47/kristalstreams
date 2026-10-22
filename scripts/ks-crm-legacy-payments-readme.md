# Imported customer payments under old pricing

The owner confirmed on October 22, 2026 that activating customers in XUI was their record that payment had been received. XUI line data does not establish a customer dollar amount or payment date. This confirmation is owner testimony, not a provider payment receipt.

Existing regular screenshot-imported accounts can be classified `legacy_paid`, displayed as **Paid under old pricing**. Amount and date remain unknown. This status does not create an `iptv_payments` row, change past receipts, assign a historical retail price, or change service. Trials, preview accounts and personal provider-credit accounts are excluded. Expired service remains expired; historical payment is separate from a currently usable service period.

For this classification only, the CRM uses the verified service expiration as the next-renewal date for display and due filters, preserving the stored billing dates. The current shared website catalog supplies **Next renewal price**. A saved old custom rate cannot override the next-renewal catalog for a legacy account. Ordinary customer custom rates retain their prior behavior. Unknown historical payments are excluded from MRR and payment totals. Both CRM screens share the classification and due-date rules.

The one-month payment shortcut is disabled for these accounts because it would turn a missing amount into a $0 receipt. Normal actual-paid status supersedes the legacy classification when real payment details are recorded; this work does not enable recurring charging or provider execution. The existing four $0 manual entries are retained, not reinterpreted as actual amounts.

## Operational transaction

`scripts/ks-crm-legacy-payment-confirmation.sql` accepts two controlled placeholders: an already applied service-sync batch UUID and expected regular-account count. Validate those outside SQL, substitute only controlled values, and run against the active Kristal Stream project. It locks customers/payments/activity and execution controls, requires every renewal switch off, and checks the expected scoped count. Existing positive/unknown amounts or nonzero recorded rates require separate review. Only `payment_status` and its normal `updated_at` change, plus one activity per newly confirmed customer. An exact replay changes nothing. Service details, dates, notes and all existing payment rows are asserted unchanged in the same transaction. No permanent schema or function is added.

## Validation

`KS_PGLITE_MODULE=<isolated pinned PGlite path> node scripts/test-ks-crm-legacy-payments.mjs` exercises the operational SQL with the actual pre-existing payment trigger, excluded accounts, replay, real-payment conflict/rollback, expired-service classification, new-vs-custom pricing and actual rendering of both CRM pages. Fixtures are fictional and make no external requests. Existing CRM/retail/provider suites remain required.
