# Support email and profile security repair — prepared for review

Scope: active Supabase project `wftfxerblhlsxiijtfbo` only. This change addresses audit F01–F03 and the ticket persistence needed to make those fixes reliable. It does not operate XUI, change prices, create payments, activate subscriptions, send a test email, enable execution flags, or promote production.

## Resulting behavior

- Public contact remains available without signing in. Only the fixed support inbox can receive its email. The server saves one contact ticket before attempting notification. Contact tickets can have a null Auth owner; existing rows are untouched. Browser clients cannot insert public contact records or change ticket recipients.
- Staff replies require a fresh confirmed non-anonymous administrator identity and an exact ticket ID. The server resolves website-ticket email from its current confirmed Auth owner. Guest contact replies use the saved contact email. A browser-supplied recipient is rejected. A staff reply is saved to `ticket_replies`, visible to the ticket owner, and displays its separate email state.
- `sent` means the mail provider accepted the request, not inbox delivery. A timeout, uncertain response, or failed final write never authorizes another provider attempt. Request IDs are permanent unique reservations. Matching replays return saved state; changed payloads conflict. Resend also receives the documented `Idempotency-Key` header, but correctness does not depend on its 24-hour retention. There is no automatic retry or reconciliation reset.
- A global transaction lock serializes the durable quotas: 100 total dispatches/hour, 30 public contacts/hour, three public contacts per email/hour, and 20 requests per verified sender/hour. READ COMMITTED is required. No IP, Auth metadata, session table, password, provider credential, or payment data is read. The private ledger stores a content fingerprint/email hash and minimal dispatch state; customer text stays in the ticket/thread.
- Anonymous newsletter/welcome sending is closed. Confirmations require a confirmed website login and can only target that account's email. Their message templates are fixed. Newsletter UI checks `result.success` and no longer mistakes an error object for success. It describes a recorded request, not an implemented mailing-list subscription. The separate legacy EmailJS registration helper is unchanged.
- Incoming support requests from signed-in customers go only to the support inbox. The browser no longer duplicates contact-ticket inserts or sends an automatic reply to an unverified submitted address.
- A read-only GET capability checks that the repaired function and schema are installed. Updated screens do not POST to the legacy deployed function. The existing production contact request remains compatible: the server supplies a deterministic hourly ID for matching legacy retries. Old arbitrary-recipient staff requests are rejected and must use the updated ticket form.

## Profile permissions

Browser UPDATE is limited to `full_name` and `notifications_enabled`. Identity, service status, tier, expiration, connection counts, payment references, deletion and truncation cannot be changed by browser clients. The authenticated INSERT policy permits only the user's own Auth ID/email with the exact inactive/basic/one-connection/zero-stream/no-payment baseline. This supports both minimal new missing-profile recovery and older dashboards that explicitly include those same defaults; paid/active insertion is rejected. The auth trigger and service-role payment updates retain their privileges. Existing profile and service values are not rewritten.

Ticket grants also make recipient/source ownership and email-delivery fields server-owned. Customers retain own-ticket creation and own non-staff replies. Browser status/priority updates remain restricted by the existing row policies. A contact record with no Auth owner is not automatically attached to a website user based on an email match.

All new functions are SECURITY INVOKER with an empty search path. Their EXECUTE privilege and the RLS-enabled dispatch table are service-only. Auth SELECT remains limited to `id,email,email_confirmed_at,is_anonymous`. Gateway JWT verification remains off solely because contact is public; every other action authenticates in the handler and is rechecked by SQL. CORS is an exact origin allowlist and is not used as authentication. Browser input and provider/database error text are not logged or echoed as private diagnostics.

## Release gate and order

The CLI-created migration is `supabase/migrations/20261022211913_ks_support_and_profile_hardening.sql`, byte-identical to `scripts/ks-support-profile-hardening-schema.sql`. It is prepared, not applied. The Edge Function repair is prepared, not deployed. Preview frontend publishing is separate from installing the shared backend.

Before live application, verify the current function/schema and retain the existing deployed function version for rollback. Record aggregate ticket/reply/profile counts and the three OFF renewal controls. Apply the migration to the active project, then deploy **only** `resend-email` with both its index and handler, retaining `verify_jwt=false`. Required runtime variables are the existing Supabase URL/anon/service credentials and Resend key; the support destination defaults to `support@kristalstream.com`. No secret values belong in the browser or review notes. The configured support destination must match the frontend's fixed inbox. The exact production domains and existing review-branch alias are allowed; other Preview domains require a separately reviewed exact-origin addition.

After deployment, a no-body GET should report `capability: ks-support/v1, ready: true` without creating a ticket or sending mail. Recheck browser column grants and service-only function/table privileges and run security advisors. Confirm existing customer/profile/payment values and execution flags are unchanged. The updated Preview can then be tested while signed in. A real mail-delivery check requires approval for the exact recipient/message; isolated fixtures are not inbox-delivery evidence. Do not promote the entire feature branch merely to ship a small security fix without reviewing its inherited changes.

The SQL and function belong to a coordinated release. Reverting to the insecure old email function is not a safe rollback; failures should remain closed. No ledger row should be deleted/reset to resend an uncertain mail. There is no automated resolver; review provider delivery records manually before any separately authorized replacement message.

## Verification

- `KS_PGLITE_MODULE=/path/to/pglite/dist/index.js node scripts/test-ks-support-hardening.mjs`: actual SQL, permissions, default-only recovery, public contact, owner-resolved staff replies, replay, rate limits, error outcomes and handler authorization with fictional accounts/stub transport.
- `node scripts/test-ks-support-client.mjs`: actual client, captured account, coalesced clicks, reload recovery, no cleartext session-storage content, malformed responses, and legacy-backend readiness.
- `node scripts/test-ks-support-ui.mjs`: actual admin/newsletter components; a ticket without a browser email can use its verified server owner, double clicks are blocked, uncertain delivery preserves the message, and error objects never produce newsletter success.
- `scripts/test-ks-support-native.mjs`: independently connected sessions on an explicitly acknowledged, fresh, loopback-only `ks_support_hardening_test` database. Duplicate requests reserve one send/ticket; competing requests cannot exceed the sender quota. The workflow supplies disposable PostgreSQL 17.11. No connected customer database is permitted.
- Targeted ESLint and Vite build; full TypeScript remains separately assessed against the 45-diagnostic baseline.

Provider references: https://supabase.com/docs/guides/database/postgres/column-level-security and https://resend.com/blog/engineering-idempotency-keys .
