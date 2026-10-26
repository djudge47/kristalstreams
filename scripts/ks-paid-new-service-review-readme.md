# Paid new-service order verification

Paid website purchases already have a persisted service declaration and an
immutable destination. This change adds the missing administrator review for
orders routed to `new_service_review`. It does **not** connect checkout or a
webhook to a provider writer and does not enable automatic activation.

The CRM's **Paid new-service orders** panel loads only on request. It lists
pending queues among the latest 50 new-service routes in the current payment
environment, then checks a selected reference through the existing shared
payment-review function. The list is bounded, not an exhaustive backlog count.

Both GET and POST require a fresh confirmed, nonanonymous administrator check
using Supabase `getUser`, the fixed Kristal Streams project and private/no-store
responses. POST also enforces the website origin and accepts only a reference;
the browser cannot choose an owner, provider URL, package, cost, or approval.
The service client loads the receipt, pending queue, immutable routing and
original authenticated checkout binding. Current Auth identity, profile and
local CRM/trial/setup/claim/order history must be unambiguous. An email match
only stops possible duplication; it never proves ownership or merges accounts.

The reviewer retrieves expanded Stripe settlement/charge evidence, checks the
captured undisputed/unrefunded amount, and matches all saved checkout terms.
It then reads XUI account/catalog through the existing HTTPS/TLS-proxy GET-only
adapter with an explicit production-review opt-in. Existing worker and provider
write gates remain Preview-only. No write method is added to the reader.
Twenty standard package mappings must remain internally consistent; the chosen
package supplies provider calendar months and exact credit cost. A balance check
does not reserve credits or establish a safe automatic-spending budget.

After provider reads the reviewer reloads local evidence and independently
rechecks Stripe payment/binding. A refund, service/identity/history change,
missing information or 30-second expiry stops the quote. Output contains no
customer email, provider credentials, owner ID, channel list or claim token.
Every result explicitly has `mayDispatch:false` and `providerActivated:false`.
The quote fingerprint is a review identifier, never an execution capability.

## Verification

`node scripts/test-ks-paid-new-service-review.mjs` uses real supabase-js request
construction with every Auth/PostgREST request intercepted. Scenarios cover
production/sandbox separation, settlement/refunds, bound declarations, existing
service/history, missing records, unavailable reads, catalog ambiguity, credit
shortfall, changes during remote reads, expiry, administrator authorization,
same-origin/body checks, throttling, shared routing and fixed GET-only transport.

`node scripts/test-ks-new-service-orders-browser.mjs` exercises the actual React
component at phone and desktop widths with intercepted Auth/HTTP. It checks lazy
loading, review output, stale-quote clearing, errors, throttling, account changes
and touch/width behavior. CI runs both suites with the existing application and
payment regressions. No connected payment, provider, email or database mutation
is part of either test.

Local verification on October 26, 2026: all 15 new server scenarios and eight
new phone/desktop browser journeys passed. Type checking, full lint, nine
application-quality scenarios, production Vite build and shared payment API
bundling passed. Existing guarded-execution (24), automatic-review (24), payment
validation (13), receipt-only rollout (16) and pending-order (6) scenarios passed
with intercepted or fictional external effects. These results do not establish
a live provider activation or production release.

## Remaining automatic activation work

This review is the first production new-service integration step, not the full
activation release. Current local history cannot prove the absence of an
unrecorded manually created provider account. A future execution path must
revalidate eligibility, payment and quote, commit a single durable order and
shared reseller/budget claim, persist generated credentials encrypted before
dispatch, and use a separately approved single-send provider operation. A lost
or uncertain response must stop for reconciliation, never retry creation.

Production completion must atomically bind provider proof, CRM, purchaser-owned
login handoff and order status, with retries restricted to local completion.
Completion notifications must follow verified service completion. Existing
Preview fulfillment tables and approval keys are not production authority.
One exact package/credit impact and a controlled live test still require owner
approval before any real provider creation. No schema, gate, key or spending
policy is changed by this PR.
