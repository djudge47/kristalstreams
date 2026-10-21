# Customer setup-help handoff

Get setup help opens the existing client support form with only `setupHelp: true` in navigation state. Checkout IDs, credentials, account IDs and order claims are not passed through the URL or route state. The form independently reads the current authenticated owner's setup endpoint. A single order is selected automatically; multiple entries require a choice. Changed or missing identity clears the loaded details and typed draft.

The shared parser binds account/mode, bounds and deduplicates references, validates catalog/display fields, and whitelists output. Pending and review states never imply provider readiness. Completed and expired capabilities require a dated, consistent Preview completion response; live provider-ready data is rejected. The actual support card now shows the selected order's payment mode, setup state and verified expiry when present, so completed or paid live entries cannot inherit false pending-test/no-activation copy.

The editable form includes the selected snapshot and its check timestamp only when the user chooses Create Ticket. Opening, refreshing or selecting an order submits nothing. The submit handler verifies the current user against the loaded context before inserting under that user's ID. Its local submission guard prevents parallel clicks, not durable exactly-once recovery after an ambiguous insert.

These details remain customer-authored support text, not protected payment evidence or provisioning authority. A ticket draft changes no payment, CRM or provider status and supplies no credit approval. Missing saved details leave a general ticket available. No new email trigger, schema, grant or endpoint is introduced.

Six shared-helper checks, twelve real-SDK owner API checks, and actual dashboard/support/payment initial renders cover pending, review, confirmed, expired and mixed states. Native completion/expiry cases also feed the actual support snapshot. See `ks-completed-order-status-readme.md` for the current full validation record. No real ticket was submitted for these checks; deployed browser review remains separate.
