# Paid order routing

Installed in the active Kristal Stream project as migration `20261025031536` on October 24, 2026 (America/New_York). The SQL bytes match the CLI-generated draft tested at `6523e7e`; the filename was aligned to the connected migration history. Three connected function-body hashes match, private permissions/guard are verified and existing customer/payment state is unchanged. Website integration remains in draft PR #33 and has not been promoted to Production.

The receipt-only fulfillment path now saves a private, immutable review destination before requesting its existing pending-order notification. This is a review destination, not provider activation or credit authorization. The live receipt-only flag remains off; no execution gate changes are included.

| Saved evidence | Review destination |
| --- | --- |
| Confirmed owner, authenticated new-service intent captured before the receipt, no approved existing-service link | New service review; existing eligibility checks still apply |
| Confirmed owner, saved renewal intent, exactly one current approved CRM ownership link | Renewal review for that exact customer and external line |
| No saved intent, help requested, no/multiple/stale links, unconfirmed owner or legacy receipt | Manual review with a fixed reason |

Names and email equality against CRM records never create ownership. The private portal link must match the Auth UUID, current confirmed email and confirmation timestamp, CRM customer UUID and current external line ID. Preview customers and trial lines cannot become ordinary renewal targets. All links count when detecting ambiguity, including stale links.

`ks_paid_order_routes` references the durable queue and stores its canonical payment identity, purchaser, mode, original request kind and exact review target. RLS, server-only privileges and an invoker trigger validate every insert. Updates/deletes fail, including for the table owner. Concurrent confirmation/webhook retries serialize on a per-session transaction lock and return the first saved decision. Approving a link later does not silently reassign an earlier payment.

`ks_route_paid_order` returns a minimal projection. Private CRM/line/payment-intent identifiers are omitted; the server validates the response against the verified paid Stripe session and whitelists the public routing fields. A routing/storage failure preserves the recorded payment, stops notification and requests recovery without another payment or a legacy-activation fallback. Historical review/completed receipts preserve their existing early-return behavior.

Installation is additive and performs no backfill or writes to receipts, queues, profiles, CRM records or provider data. It makes no Stripe, email or provider request. The source change requires the migration before any release that uses it. It adds no API function or environment variable.

## Release boundaries

- Current Production checkout still lacks live authenticated purchase-intent capture; the existing v1 binding is Preview/test only. Existing/unbound receipts therefore need manual review. This change does not claim to finish live checkout binding.
- New-service review is not proof that the owner has never had service; the established eligibility and conflict checks remain required.
- A saved renewal destination is historical review evidence. A future executor must revalidate current ownership, receipt, line, requested order, provider package/cost, execution policy and completion status before any provider action. An immutable route must never be treated as a current authorization grant.
- Multiple owned services need an explicit, authenticated service selector and a reviewed binding protocol. This change deliberately does not choose one arbitrarily.
- No live rollout switch, renewal control, paid entitlement, customer message, real payment or reseller credit operation is enabled by this work.

## Verification

The shared SQL suite executes the actual migration in isolated PGlite and native PostgreSQL 17.6/17.11. Four workflows passed at `6523e7e`, including 34 checks on each native database version. The 14 routing cases cover exact ownership, both receipt modes, ambiguous/stale/absent links, foreign/late intent, retries after identity/link changes, guard enforcement, private grants and unchanged customer/payment state. Native checks additionally observe actual lock waits for duplicate confirmations and rollback recovery. Fifteen fulfillment cases exercise the real `fulfill()` path using intercepted transport; 15 pending-notification integration cases use actual receipt/routing/notification SQL and a lost acknowledgement to prove one receipt, route and delivery identity. The production build, strict TypeScript, zero-warning lint, nine application-quality scenarios and 13 payment-validation cases also passed locally.

Run isolated SQL with `KS_PGLITE_MODULE` pointing to the disposable PGlite 0.5.10 installation and `node scripts/test-ks-paid-order-routing-db.mjs`. Native checks use the existing loopback-only `scripts/test-ks-live-receipt-native.mjs` harness and workflow. No connected customer or provider is used as a test fixture.
