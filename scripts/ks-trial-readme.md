# Trial requests and email notifications

The free-trial page uses Supabase signup and email confirmation, then submits an
authenticated request to `/api/start-demo`. The API validates the session with
`auth.getUser` and requires a confirmed email address. It never creates users,
confirms addresses, or changes passwords through the admin API. Existing users
sign in; the login page preserves only the known `/free-trial` return destination.

`ks_request_trial` records one request per user/environment under a profile row
lock. Replays keep the same ID and expiry. Paid accounts and previous legacy demo
accounts cannot receive a fresh trial. Production requests activate a 36-hour
website demo with one connection; Preview records a marked test without modifying
the customer's live profile. Streaming-line creation remains manual.

The private, JWT-protected `ks-trial-notification` function sends an alert to
`support@kristalstream.com` and an acknowledgment to the saved, verified customer
address. It reuses the existing Supabase `RESEND_API_KEY`; no new Vercel secret is
needed. Frozen messages and a separate provider idempotency key for each recipient
prevent duplicate delivery on retries. Ambiguous retries stop after 23 hours and
require reconciliation. Email failure returns an honest pending-notification
state while retaining the request; the page can retry without restarting a trial.

Both new tables and RPCs are service-role only, with RLS enabled on the tables.
Install `scripts/ks-trial-schema.sql`, deploy the Edge Function with JWT verification
enabled, and deploy the website/API together. Supabase must allow the site login
redirect URL for email confirmation. If confirmation opens another allowed site,
customers can return to the original tab and sign in to finish the trial request.

Validation:

- `node scripts/test-ks-trials.mjs` uses fake Auth, database, and mail dependencies.
- `scripts/test-ks-trial-schema.sql` validates real database transactions using
  synthetic accounts, then rolls back all fixtures and entitlement changes.
- Run `npm run build` and `npx tsc -p scripts/tsconfig.ks-trials.json --noEmit`.
  The existing whole-project TypeScript errors are separate from this change.

For the end-to-end Preview test, use a new account owned by the tester, confirm its
email and request a trial. Verify the clearly marked test alert in Zoho and the
customer acknowledgment. Retrying must preserve the expiry and recorded email IDs.
The test does not create a Roomba line or activate a live trial.
