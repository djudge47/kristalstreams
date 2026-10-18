# One-time setup execution rehearsal

This stage prepares and exercises the **execution algorithm**, using an isolated PostgreSQL fixture and fictional Stripe/provider responses. It is not installed automatic activation. No API route imports it; no real provider, database or notification adapter is constructed. `automaticSetupExecutionStatus()` always reports disabled. Environment configuration cannot enable it. The rehearsal factory accepts only explicitly marked fictional dependencies in a test/Preview context; these markers are test wiring conventions, not authentication or a real spending authorization.

The earlier review-only policy and saved review claim remain review-only. The rehearsal does not change their schema, release their slots, settle their budgets or upgrade their permission. No execution policy, extra paid test or automatic real-credit spending has been approved. Existing paid/trial guards, accounts, encryption keys, website payment handling and production remain unchanged.

## Rehearsed order

The worker binds the exact purchaser, checkout, intent, tier and connections to the saved fictional claim. It retrieves an expanded succeeded/captured/unrefunded/undisputed sandbox payment again and checks confirmed-owner/new-service eligibility. Before a simulated creation it checks the current provider mapping/fingerprint, exact cost and balance, fresh evidence and the still-current reservation.

Generated credentials are encrypted with the existing AES-GCM owner/order/attempt/Preview binding and saved before dispatch. A lost preparation reply stops without creation; a later run loads the original envelope rather than replacing credentials. PostgreSQL JSONB may reorder keys, so saved package/proof comparisons use structural equality while preserving array order.

The adapter's begin operation must atomically compare `prepared` with `dispatching`. Only the call that receives its first successful acknowledgement can simulate creation. Repeated workers, a lost acknowledgement, `dispatching` or reconciliation state never gain a second permission. Evidence freshness and the policy window are checked again after the durable gate. Failure there retains the reservation for manual review; no automatic cancellation, reset or release is attempted.

One fictional creation and an independent line read must agree on line ID, generated username/password, reseller, package, connections, channel groups, paid/enabled flags and expiry. The existing provider-month duration bounds are used; no receipt-day expiry is invented and the provider's verified expiry is retained. The observed reseller balance deduction must equal the reserved exact integer credit cost. Only whitelisted proof fields are saved, never raw response bodies or plaintext passwords.

An uncertain provider/read/debit/proof-save result remains stopped with its reseller slot and credit reservation held. A lost verification acknowledgement cannot erase a saved verified proof. A subsequent `provider_verified` run rechecks payment and owner, decrypts the same login, independently reads the same saved line and performs **local completion only**, with no creation or new dispatch approval. Revoked/expired creation permission does not prevent completing already verified work; changed/refunded payment or changed provider evidence stops completion for review.

## Atomic completion contract

The test-only adapter places these writes in one PostgreSQL transaction: CRM identity/verified expiry, completion audit, owner-bound encrypted login handoff, completed order state, reserved-to-spent accounting, reseller slot release and final execution state. Unique owner/order/intent/line bindings prevent a second local completion. A failure after CRM insertion or after budget settlement rolls back the entire local transaction. Retrying uses the stored verified proof and never creates again. If the commit succeeded but its acknowledgement was lost, the final saved state returns without another settlement.

This adapter and its `ks_rehearsal` tables exist **only inside the test script**. They are not migrations or runtime Supabase functions, and they do not mutate `iptv_customers`, profiles, payment receipts, the proposed review tables or real budget/dispatch records. The fixture deliberately supplies no browser or service-role API. Its transaction behavior is evidence for the algorithm/adapter contract, not proof that the existing application schema already implements that contract.

## Validation

Run `scripts/test-ks-setup-execution-rehearsal.mjs` with the same temporary **@electric-sql/pglite@0.5.10** dependency used by earlier isolated tests. Set `KS_PGLITE_MODULE` to that dependency's `dist/index.js` file URL. It loads only fictional records into in-memory PostgreSQL and closes the instance afterward; no connection string or network credentials are used.

**49 checks passed:** 27 new isolated lifecycle scenarios and 22 existing guarded paid-execution regressions. Targeted ESLint and whitespace checks passed. The suite covers happy completion, repeated and overlapping JavaScript workers, lost preparation/dispatch/verification/completion replies, provider timeout, mismatched line/expiry/debit, proof/reconciliation write failures, transaction rollback at two stages, completion after review expiry, refund on completion retry, wrong owner, changed eligibility/catalog/balance, post-gate freshness/revocation, corrupted encryption, unavailable storage and output/password sanitization. API-entrypoint checks preserve the existing count of twelve. The PGlite engine has one SQL session: overlapping JavaScript calls exercise its durable compare-and-set, **not** full PostgreSQL multi-session contention, lock waiting or deadlocks.

## Remaining integration

Implement this tested contract in a separately reviewed unified application database lifecycle before connecting it to checkout/webhooks. The review-only reservation schema currently cannot settle spent credits or release a slot; its immutable guards must not be bypassed to make this simulation run. The old Preview worker also uses a separate lock protocol. All real-credit writers must share one authorization/locking protocol, with an explicitly approved execution policy, pinned limits, fresh trusted evidence, immutable credentials and a permanent reconciliation boundary.

Also finish authenticated checkout intent capture, live environment crypto/provider/completion/owner API support, website entitlement changes only after verified setup, notification/UI integration, and multi-session tests against disposable full PostgreSQL. Do not install a policy, toggle live spending, change production or run another paid creation from this preparation. There is no real execution switch to turn on in this stage.
