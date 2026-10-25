# Explicit service selection for renewal

Live renewal checkout now requires choosing an approved linked service. The selector shows usernames and connection allowances in a native mobile-friendly control. Its owner-scoped endpoint returns up to 50 choices per page with an explicit cursor; paging replaces the list and clears the former selection. Switching website accounts clears old choices. Read failures, unconfirmed identity and no eligible linked service keep payment disabled.

The read uses the existing `/api/ks-customer-setup?view=checkout-services` entrypoint, adding no API function. The server derives the owner from verified Auth and exposes no payment history, passwords, provider line identifiers or credentials. Its private invoker RPC joins only explicit approved portal links whose current Auth email/confirmation and current CRM external identity still match. Trial, stale and Preview-only links are excluded. An empty list is returned only after a successful verified read; storage or malformed-owner responses return an error.

The selected CRM UUID is input to a new private reserve RPC. The server revalidates ownership and derives the external line ID itself. Version 2 of the live request freezes both identifiers alongside the existing owner, purpose, canonical price, term and allowance before creating a Stripe session. The target cannot be changed by a retry or column update. Stripe metadata carries the customer UUID and binding version, which paid verification compares to the private record; metadata alone grants no authority. Line IDs stay server-side.

At routing time the current approved ownership link, external identity and receipt terms are checked again. The selected service can be identified even when the owner has multiple services. A changed or lost link becomes manual review, never a fallback to another account. The immutable first routing decision remains historical evidence; provider execution still needs independent current validation and separate authorization.

Preview v1 and existing live v1 keys/parameters remain unchanged. New selected-service browser requests use a v2 namespace including the chosen customer. An earlier uncertain live v1 renewal is retained for review instead of silently starting a replacement payment. Requests cannot be promoted from v1 to v2 or retargeted under an existing request ID. Existing routes and service/payment records are not backfilled.

## Validation and release

- Actual checkout SQL/handler tests cover multiple linked services, foreign/stale/trial choices, changed targets, lost acknowledgements, wrong metadata, changed provider identity and v1 recovery boundaries.
- Owner HTTP/SQL tests cover both website environments, 51 eligible records across bounded pages, malformed/foreign responses, Auth/query checks and private database permissions.
- Actual component browser journeys cover 390px touch and 1280px desktop layouts, explicit choice, paging, account switching, read-failure recovery, 44px controls and horizontal overflow. Auth/HTTP are intercepted and all records are fictional.
- Native PostgreSQL checks cover concurrent conflicting target choices, exact retries, binding/routing the selected account among two approved services, preserved v1 values/Preview definitions and private paged reads.
- React checks retain stable effect dependencies, abort/timeout cleanup, owner-keyed remounts, labeled native controls, announced errors/loading and bounded rendered lists. The reviewed stylesheet remains byte-identical.

The migration and website change are being verified before installation/release. No live rollout flag, payment, email, provider execution or credit spend is enabled by this work. General live completion, recovery and credential delivery remain unfinished.
