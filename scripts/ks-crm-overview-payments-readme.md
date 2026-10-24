# Command Center received-payment summary

The Command Center previously fetched only eight payment rows without status and labeled every result Paid. Zero-value history, pending/refunded records, or newer non-receipts could hide actual older receipts.

The overview now reuses `loadCrmPayments` and `isReceivedPayment` from the customer workspace. It reads every 200-row page with the existing RLS client, selects only the allowed payment summary fields, requires paid status plus a positive finite amount and valid received timestamp, sorts by date/ID and only then displays eight rows. Separate actual payments by the same customer remain separate. Received dates/times use America/New_York. Historical rows, payment amounts, customer billing/service records and XUI are not modified.

Loading, successfully empty data and unavailable reads are distinct. A failed later page clears stale/partial receipts and offers Refresh; it never claims the customer has not paid. Ordinary read recovery issues only GET requests.

`node scripts/test-ks-crm-overview-payments.mjs` exercises the real compiled component and shared loader using the actual Supabase client with fictional GET transport: loading, 200+ pagination, zero/pending/refunded exclusion, genuine repeat payments, New York date boundary, eight-row post-filter ordering, empty history, failed later page and refresh recovery. Six scenarios pass; existing payment-summary tests still pass. The suite runs in the Application quality PR workflow, and the existing CRM status workflow covers the legacy overview rendering.

This is a source/Preview correction for audit F09. No database migration, financial write, email, provider call, execution-flag change, Edge deployment or production promotion is involved. Full type checks, zero-warning lint, app-quality regressions and production build pass. See the completion audit and PR for final deployment/CI evidence.
