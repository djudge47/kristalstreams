# New-customer paid setup — private simulation

The administrator's pending sandbox payment now offers **Run new-customer simulation** in the CRM payment queue. GET `/api/ks-preview-paid-orders?view=new-customer-simulation&sessionId=...` verifies a confirmed, non-anonymous administrator with Supabase getUser, requires the chosen saved test receipt to belong to that exact account, then reads the standard package catalog through the existing fixed HTTPS/Fixie reader. Only a catalog checked within 65 seconds is accepted. The saved order is a plan template, not authorization to provision that purchaser or a binding to the existing trial.

The original no-view request still lists paid orders. An explicit fixed view dispatches to the simulation handler with its own independent auth/environment/method gates; unknown or multi-valued views are rejected. Both views share the existing deployment entrypoint, keeping the project at twelve API functions. The initially separate simulator route was removed after the hosting build reported the Hobby function-count limit. No rewrite, plan upgrade or other endpoint was removed.

The simulation creates a separate fictional purchaser, Stripe session, reseller and provider line. The catalog supplies exact package IDs/costs/bouquets/months, while website amount/allowance validation uses the existing canonical payment validator. The report distinguishes simulated creations/credits from zero real provider writes, credits, database changes and messages. No real trial, order, customer or website profile changes. POST is unconditionally rejected and no environment flag enables it. No paid transport adapter is imported or exposed. The payment confirmation/webhook paths are unchanged.

The offline `buildPaidCreationForm` prepares documented multipart fields: trial=0, generated-login placeholders, package, calendar package_duration, max_connections and repeated bouquets_selected[]. It sends no member_id, package_cost or exp_date. It is never passed to fetch. The simulated runner validates a complete paid sandbox session for its owner and exact current mapped package, blocks an existing streaming line, atomically reserves an attempt in a memory-only ledger, records creating before the simulated send, verifies both the creation response and a fresh exact-line read, checks the simulated debit, then commits the simulated CRM identity and credential handoff. Expiry comes from the simulated provider's response rather than receipt fixed-day counts. Implausible expired/short/long terms stop for review.

Duplicate/concurrent simulated requests share the unique reservation. Unknown/lost/mismatched provider outcomes and failed result persistence stop in reconciliation_required without a second create. A verified result may resume local CRM/handoff work using the same key. Secrets and unselected provider fields never appear in the browser report. Credentials exist only in fixture/adapter memory; this is **not** a deployed credential-storage solution or an email delivery test.

Eight visible checks cover normal success, duplicate notification, concurrency, timeout after creation, CRM retry, login-handoff retry, incorrect amount and existing access. A passed timeout check means the workflow correctly stopped for review, not that the customer became active. Each check starts an isolated in-memory fixture; their counters are not aggregate live spending or revenue. Opening/refreshing the review can repeat simulations but cannot repeat a real creation.

## Before a separately approved real test

This is a tested orchestration model, **not completed production payment-to-XUI automation**. Memory-only deduplication is not durable idempotency. No real credit test is possible through this route. A separate implementation/review must provide: service-only durable attempt reservations and purchaser-to-line uniqueness; encrypted pending-login storage and an authenticated customer handoff with durable delivery semantics; fresh server-side Stripe/receipt/ownership/package/account revalidation at execution; fixed HTTPS/Fixie paid transport without redirects/direct fallback/retries; a signed bounded confirmation with explicit credit approval; sticky ambiguity reconciliation after any possible send; atomic CRM/order completion only after provider verification; and adjustment of the legacy live payment RPC so payment alone cannot falsely mark streaming ready. Existing trial upgrades remain blocked and must keep the approved login-retention requirement. Do not route an existing trial purchaser into new creation automatically.

No new schema, RLS grants, notifications, dependencies, production release or public visibility changes are included. The UI resets on account change, guards concurrent clicks, aborts timed-out/unmounted reads, validates/whitelists the report and presents mobile-friendly stacked controls. Browser labels come from local constants, not arbitrary API text.

Validation commands:

```
node scripts/test-ks-new-paid-setup.mjs
node scripts/test-ks-preview-new-paid-setup.mjs
```

These exercise actual mapping, canonical payment checks, multipart construction and orchestration with synthetic provider/storage data. They do not validate live XUI creation, database crash recovery, login delivery or production activation. A signed-in Preview screenshot review is a separate final visual check.
