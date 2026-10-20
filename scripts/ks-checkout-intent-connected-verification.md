# Connected checkout foundation verification

The user authorized applying the tested inactive database update from draft PR #12.
It was applied on October 19, 2026, at approximately 8:32 p.m. America/New_York
(October 20, 00:32 UTC). This installed database objects only; it did not enable
the new checkout or any provider operation.

## Applied source

- Recorded migration: `20261020003225_add_private_checkout_intent_binding`.
- Original CLI-generated filename used version `20261020001805`; the file was
  renamed to the database-recorded version without changing its SQL bytes.
- Git blob: `340148d3adde151399b7c6c5717b3b7f341b7704`.
- SQL SHA-256: `23afae59897c8e7b2732afcacab20ffd676142a00a2888efbfca1d83ac789834`.
- The connected migration history contains one statement entry whose SHA-256
  exactly matches the approved/tested source above.

## Connected checks

`ks_checkout_requests` exists as a base table, RLS is enabled, and its immutable
history trigger is enabled. All three new functions run as security invoker with
an empty search path.

| Access | Anonymous | Signed-in browser | Server service role |
|---|---|---|---|
| Read/insert checkout ledger | Denied | Denied | Allowed |
| Update session binding and bound timestamp | Denied | Denied | Allowed |
| Change plan or delete checkout request | Denied | Denied | Denied |
| Execute reservation/binding RPCs | Denied | Denied | Allowed |

Actual role-switched calls verified three access denials each for `anon` and
`authenticated`: ledger read, reservation RPC and binding RPC. Two service-role
calls with invalid null input reached their intended validation rejection. These
eight checks ran inside a rolled-back transaction and created no records. They
are native connected-role/validation checks, not a successful payment test.

The ledger and purchase-intent tables remain empty. No review policy or claim was
created; existing provider-attempt and payment-receipt counts are unchanged. No
extra permission to read private Auth email data was granted.

The security-advisor comparison added only the expected informational
[RLS-without-policies notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
for this server-only table. Browser privileges are explicitly revoked and no
browser RLS policy is intended. No new WARN or ERROR finding was introduced;
unrelated pre-existing Auth findings were not changed by this migration.

## Still disabled / unverified

Neither checkout enablement flag was set, no deployment was promoted, and no
automatic setup, trial conversion, renewal execution, credit spending, email or
Stripe API action occurred during this installation. The new empty database
foundation cannot authorize provider dispatch.

The isolated SQL/Stripe-fixture suite is rerun using the renamed file. A real
authenticated Preview checkout, webhook round trip and browser interaction are
still unverified. Existing deployment-management permissions do not allow the
agent to independently inspect or change Vercel environment settings; no attempt
was made to widen that access.
