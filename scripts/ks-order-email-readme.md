# Kristal Streams paid-order alerts

The payment backend calls the private `ks-order-notification` Edge Function only after validating the paid Stripe session and recording its receipt. Both the success page and signed webhook use the same fulfillment function.

The Edge Function requires the project service-role credential, looks up the receipt and customer through the admin API, and sends only to support@kristalstream.com using the existing RESEND_API_KEY. No new key is needed in Vercel or the browser.

Live alerts identify the purchased plan, connections, duration, customer email and payment references, and explicitly say reseller setup is manual. Sandbox alerts are marked TEST and must not result in a real customer line.

The private notification table stores a frozen request body and the provider email ID. Repeated requests for a recorded notification are skipped. Concurrent/ambiguous sends use the same Resend idempotency key and body. Unknown outcomes older than 23 hours require manual reconciliation against provider logs, instead of risking another send after Resend's 24-hour deduplication window.

The SQL in ks-order-email-schema.sql was applied through the connected Supabase project as part of this update. Keep the SQL with the source; do not run it again against the same project. A CLI-generated migration remains to be created once the local Supabase CLI is available.

Verification: run `node scripts/test-ks-order-email.mjs`, then deploy the website to Preview and resend the existing sandbox checkout event to its current preview endpoint. Verify one alert reaches Zoho and the phone, then resend again and confirm no duplicate email. Rebuild for Production only after that passes. Reseller API/line creation and desktop notification troubleshooting are separate.
