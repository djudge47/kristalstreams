# Automatic renewal retail pricing

The shared customer catalog is `_shared/ks-retail-pricing.js`. The public pricing
chart, all eight plan-detail pages, server payment validation, requested-order UI
and CRM card use these same 20 unchanged published prices. Production pricing
source at commit bb793edd92dc4b0c42bb92316f2e5d2b48322337 was compared before
centralizing the values. No public price, checkout amount or provider credit cost
was changed.

For example, Gold / 6 months / 3 connections costs $150 for the full term.
`monthly_price` stores the $25 monthly equivalent, used by existing MRR totals.
The CRM card shows the term total and labels the monthly equivalent separately.
Unknown packages are not guessed, recorded custom display rates are retained,
and trial/Preview records remain excluded from customer revenue.

`scripts/ks-crm-renewal-retail-pricing-schema.sql` installs private invoker
functions and two AFTER INSERT triggers on the existing live and changed-order
completion tables. Inside the verified purchase transaction, these set
`renewal_at` to the independently verified new expiration and `monthly_price` to
the published price divided by the term (rounded to cents). Package labels and
connection counts must agree. Unrecognized package prices stay unchanged.
The functions use empty search paths, are unavailable to browser roles, and
perform no provider or payment call. Failure rolls back completion; the original
provider-verified attempt can finish locally without another provider purchase.

The installation changes no customer records, payment receipts, purchase controls
or existing purchase/verification functions. Only completed verified renewals
invoke the automatic persistence. A separately checked one-customer correction
can fill the existing completed don.judge order's zero price from this catalog.

A plan price and provider credit spend are not evidence of a customer payment.
This feature does not set `payment_status` or `last_payment_at`, insert a payment,
charge Stripe, or enable live renewal. Missing receipt evidence is displayed as
“No payment recorded.”

Verification includes every published price, aliases and exact checkout amounts,
actual pricing-chart rendering, exclusion/unknown/custom-rate cases, and real
SQL/HTTP/React renewal fixtures with rollback and one-purchase recovery checks.
Native PostgreSQL 17.6/17.11 rehearsals run in credential-free disposable databases.
