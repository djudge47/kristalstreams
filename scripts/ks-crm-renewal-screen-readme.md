# CRM renewal approval preview

On a saved CRM customer, select **Review renewal**. The authenticated Preview-only
GET reads the saved CRM identity, current reseller, matching line and current
package. The main card shows the customer username/line, package, term, exact
provider credit cost, balance at check, existing expiration, connection allowance
and exact channel group IDs to preserve.

A valid selection may be smaller than the package catalog. The preview uses the
same preserving planner as the offline renewal work; it never expands the line's
selection to the package's full list. The stricter full-package comparison remains
available in collapsed details and continues to require manual review when the
sets differ. Unknown groups, bad identities, incompatible packages, disabled or
expired lines, unreadable costs and insufficient credits block preservation.

The planning helper's internal preservation-confirmation parameter expresses a
hypothetical choice for this feasibility check. It does not assert human consent.
The response includes no plan fingerprint, form, approval capability, reseller
identity, password or credentials. Only current numeric group IDs and fixed
messages are added to the existing allowlisted response.

Evidence expires 30 seconds after the first provider read starts. Cached reviews
are re-read after that window. The browser also expires the visible review, clears
its checkbox on expiry or refresh, and hides details immediately if the customer
identity changes. A slow provider check can return an already-expired review; it
does not get a new validity period merely because the request completed.

The checkbox acknowledges review only on the current screen. It saves no approval
or durable record. **Approve renewal — unavailable** is always disabled. The
existing renewal endpoint remains GET-only; there is no new HTTP mutation route,
provider edit, database write, payment or customer charge. Production remains
blocked. No function file was added to the twelve-function deployment.

Verification executes the actual React click/auth/fetch path against the shared
route with fictional dependencies and renders its resulting markup. Tests cover
a four-group selection within a 107-group catalog, fixed manual-review cases,
expired evidence, confirmation reset, identity changes and malformed responses.
This synthetic component/route check does not assert live browser or provider
verification. Remaining live work is documented in
`scripts/ks-crm-renewal-durable-readme.md`.
