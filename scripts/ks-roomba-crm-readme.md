# Verified trial to CRM

`/admin/crm` now includes **Saved Roomba setup**. Its manual check reads only the stored trial receipt and linked customer identity. The new API makes no provider request. A saved creation result is clearly distinguished from a live connection/online check.

`GET /api/ks-roomba-crm` returns the bounded saved result, link status and whether trial creation is enabled in that Preview deployment. `POST` requires `confirmed: true` and calls the protected transaction to link the existing trial. Both operations verify the confirmed administrator with Supabase `getUser` and reject environments other than Preview. The caller cannot supply a target customer, provider line, package or administrator ID.

Install `scripts/ks-roomba-crm-schema.sql` once after the controlled trial schema. It adds a CRM customer reference and link timestamp to the server-only receipt table. The `ks_link_roomba_trial_to_crm` function is SECURITY INVOKER with an empty search path and EXECUTE granted only to service_role. It locks the fixed receipt row, checks its confirmed result and owner, and atomically creates one CRM customer, one activity entry and the link. Repeated calls return the same customer without duplicating activity. Existing customer identities are never overwritten or merged automatically. The foreign key prevents deletion of the linked audit record.

The CRM copy contains the confirmed line ID, streaming username, 36-hour Trial label, one-connection allowance and original provider expiry. It is marked as a zero-charge trial. Password, email and renewal date are left empty. No payment history, email or new reseller line is generated. Linking remains available while provider creation is disabled. Ordinary customers cannot read the protected receipt or execute the linking function directly.

Trial records have separate active/expired labels and do not enter unpaid, billing-due, overdue or recurring-value calculations. Trial payment/date shortcuts are disabled. Other customer billing rules retain their previous behavior. Expiry labels use the stored provider timestamp; this does not poll or mutate Roomba when a trial expires.

Validation:
- Eight offline CRM API/status checks cover authentication, Preview gating, ownership, confirmation, response redaction, conflicts, database failure, replay, trial classification and existing paid/unpaid behavior.
- `scripts/test-ks-roomba-crm.sql` is a **pre-link integration test**. It exercises ownership, unknown/malformed receipts, collision rejection, preserved provider fields, one-customer/one-activity replay, zero payments and deletion protection inside a rolled-back transaction. It intentionally requires the existing trial to be not yet linked. Do not rerun it after the real link is saved.
- The existing Roomba suites pass alongside these checks (68 synthetic checks total). Full Vite build, scoped strict TypeScript, targeted React lint and API bundle verification pass.
- The real, previously approved trial was linked once and a repeated call returned the same record. Database reads verified one activity, zero payments, no copied password and one provider attempt. No additional provider action was used for the CRM work.
- Security advisors add no new warning for this function. The existing informational [no-RLS-policy notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) is intentional for server-only receipt tables with public/browser grants revoked. The existing [leaked password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) is separate from this change.

## Next paid-order integration

The current payment handler verifies and records Stripe payments and sends an order alert; it does not call Roomba. Paid provisioning is not enabled by this change. Before implementing it:

1. Confirm the mapping from each website plan/connection allowance to the actual returned Roomba package, duration and bouquet selections. Do not reuse example IDs or trial settings for paid service.
2. Link the authenticated website purchaser to the correct CRM customer and existing provider line. An email or editable username alone is not a renewal target.
3. Keep verified payment receipt status separate from provider activation. A paid order must remain awaiting activation until a verified provider result is recorded; the website profile's active label alone is not proof of XUI access.
4. Add durable per-order activation/renewal claims and explicit handling of ambiguous provider results. Stripe resend/concurrency protection must extend through CRM and provider fulfillment, not stop at the payment receipt.
5. Test new activation and existing-line renewal independently in private Preview. Paid provider operations, reseller-credit spending and production rollout still need an approved concrete test before use.

One-time checkout payment and recurring card billing are separate features. This change does not enable either automatic paid XUI provisioning or recurring charging.
