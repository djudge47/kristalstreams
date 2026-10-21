# Separate consent contract for a future live renewal workflow

The connected CRM review and simulation-only test save have been verified. The
installed SQL intentionally accepts only `simulation_only` plans; enabling its
execution switch must never turn those saved test records into real renewals.
Leave that switch off. This module prepares the separate live-consent contract,
without importing it into an application route or adding provider transport.

The issuer requires a dedicated explicitly supplied 32-byte key, a controlled
clock, an actor UUID supplied by a trusted caller, and separate explicit channel
preservation and credit-spend confirmations. A future authenticated admin route
must verify the actor independently; a UUID argument is not authentication. No
Preview/rehearsal/environment signing-key fallback exists here, and no actual key
has been provisioned.

Consent binds a single operation/consent ID, actor, customer and purpose-separated
fingerprint of the entire checked plan: saved/provider identity, reseller,
package/catalog, term, connections, original expiry, exact selected groups, cost
and balance. Original snapshot, issuance and five-minute deadline are signed.
Issuing or verifying requires evidence no older than 30 seconds, active paid
service, sufficient credits and matching saved/provider expiry. Verifying fresh,
unchanged evidence after operator review does not extend the original consent.
Every result explicitly says `mayDispatch: false`.

No route, live worker, ledger, enablement, migration or XUI edit is included.
Consent verification alone must never be used as permission to send a renewal.
Before execution can be considered, a separately reviewed implementation must:

1. Authenticate and authorize the administrator and show the exact cost/term and
   preserved selection before requesting explicit credit-spend confirmation.
2. Use separate live ledger/state/purpose binding; never consume existing test or
   rehearsal records. Coordinate durable line-version claims and reseller-wide
   exclusion with both existing setup protocols. Persist and commit a dispatch
   decision before any external write; a lost acknowledgement must stop.
3. Recheck the full plan with fresh provider evidence, then send only documented
   fields once. Validate provider result, independent line readback, unchanged
   identity/selection/allowance and exact credit debit before any CRM completion.
4. Update only saved provider expiry with identity/old-expiry compare-and-swap.
   Resume local completion without another edit after a lost reply. Retain
   uncertain operations for manual reconciliation, with no automatic resend.
5. Verify actual provider credential retention and calendar behavior through a
   separately authorized controlled renewal. The current synthetic evidence does
   not prove either behavior. No customer or spend has been selected/authorized.

Tests forbid external fetch and cover explicit confirmations, every plan-field
drift, original deadlines, fresh-evidence checks, wrong actors/keys/purposes,
test-token rejection, immutable attempts and absence of execution authority.
Existing authenticated test-save and SQL execution safeguards remain unchanged.
