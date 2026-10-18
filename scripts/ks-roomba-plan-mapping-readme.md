# Paid package mapping review

`scripts/review-ks-roomba-plan-mapping.mjs` accepts the private JSON package export and writes a new private review draft. It performs no network or database operation. Do not commit an actual exported catalog or generated mapping to this public repository.

The review matches the selected standard package family, excluding packages labelled Without Adults, trials, migrated entries and 24-month packages. Each Bronze/Silver/Gold/Platinum plan and allowance from one to five connections must have exactly one named package whose paid duration, connection limit and channel selections are complete and consistent. IDs and credit costs are retained from that package; costs are never inferred by multiplying months and connections. Retail prices and receipt intervals come from `getPlan`, the existing checkout validator.

Each draft records its uploaded source timestamp, a catalog fingerprint and twenty entries with exact provider IDs, duration, credit cost and channel groups. These are administrator-uploaded observations, not a current authenticated provider read. The draft always says `review_draft` and `paidProvisioningEnabled: false`, regardless of caller metadata. It neither configures nor enables checkout fulfillment.

`validateMappedPackage` detects changes in the package ID/name, duration, cost, allowance, groups or saved mapping against a subsequent normalized package read. Group ordering is canonicalized. Before any future approved provider operation, code must retrieve fresh packages, validate the persisted approved mapping and bind the purchaser to the correct customer/line. This helper is not a substitute for that authentication, durable per-order claims, cost approval, ambiguity handling, provider-result verification or CRM transaction.

Provider calendar-month durations remain separate from the current payment receipt's 30/90/180/365-day fields. Paid activation/renewal and live rollout remain unimplemented. Six offline checks cover all twenty synthetic combinations, alternatives/ambiguity, inconsistent fields, package drift, protected draft state and no network calls.
