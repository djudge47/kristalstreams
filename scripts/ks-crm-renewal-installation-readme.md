# Disabled CRM renewal foundation: installation review

Target: **Kristal Stream**, Supabase project **wftfxerblhlsxiijtfbo** only.
The SQL draft is `scripts/ks-crm-renewal-installation-schema.sql`. It has not been
applied to the connected database and is not an instruction to run it now.

## Exact database change

The transaction creates six RLS-enabled private tables for execution control,
approvals, operations, consumed line versions, reseller reservations and completion
audits, with supporting functions and indexes. Browser roles receive no table or
function access. Server functions run as the caller with an empty search path;
the existing trusted service role receives only their required privileges.

The execution control row is inserted **false**. The service role can read that
row but cannot enable, insert, change or delete it. Begin, result recording and CRM
completion reject calls while execution is disabled. Only a separately reviewed
database-owner change could enable those functions. No application flag, route,
provider transport or approval button is enabled by installation.

The draft replaces the existing reseller-exclusion trigger function so the two
existing setup protocols and the new renewal reservation table use the same
physical-reseller advisory lock. It does not replace their other functions or
triggers. Existing customer rows, subscriptions, receipts, payments and app/XUI
configuration are not updated by installation. The new completion function has a
column-limited `expiration_at` update grant for future use; its disabled execution
gate prevents that function from updating a CRM record now.

This shared exclusion change matters once reservations exist: overlapping setup
or renewal work on the same reseller stops rather than competing for its credit
balance. Owner-enabled execution still does not authenticate an administrator or
authorize a provider call. The underlying approval payload remains explicitly
simulation-only; a future live integration requires separate review.

## Preflight and transaction behavior

The draft refuses missing or changed prerequisites. It checks seven identity and
reservation columns, the exact reviewed shared-guard body hash, its invoker/volatile
settings and empty search path, and both enabled exclusion triggers. Conflicting
existing reservations also stop installation. The bounded transaction locks the
two reservation tables during the check and replacement, preventing a writer from
slipping between them. Lock timeout is five seconds; statement timeout is thirty
seconds. A failure rolls the transaction back. Reapplying the installation is not
a reset or repair action; existing target objects cause the transaction to fail.

Read-only catalog verification on October 21, 2026 found the seven expected column
types in the active project and the reviewed guard body hash
`d7d5bfdcda6a8ee331784c1ed07e65d4be41db8ad1f8a81dda6c625e82ac8c77`.
No `ks_crm_renewal_*` tables were present. This is a point-in-time check; the SQL
rechecks prerequisites inside the installation transaction. SQL prerequisite
checks do not identify a Supabase project by themselves; the installer must use
the exact project ID above and must never select another project.

After explicit approval, create/record a migration through the Supabase tooling,
apply it to that project only, then verify table/function privileges, disabled
control, zero new work/reservations/completions and the shared trigger definition.
Use the SELECT-only `scripts/ks-crm-renewal-installation-verify.sql`; every returned
check must be true before treating installation as complete.
Do not enable execution as part of that installation. Run the project's advisors
and distinguish unrelated pre-existing findings from this migration's findings.

No automatic rollback/delete script is provided: dropping a ledger after it has
work could remove recovery evidence. If installation fails, use its transaction
rollback; if later operation needs intervention, review the saved state first.

## Verification without connected writes

Both the disposable prototype and the exact installation draft are tested on
PostgreSQL 17.6 and 17.11 using separate native connections. The installation
cases exercise schema-drift rollback, default-disabled behavior, service-role
denial of switch changes, shared setup/renewal contention, lost replies, atomic
completion and disabling during verified local completion. Only the owner of the
hard-named disposable test database enables execution for those fictional tests;
the test ends disabled. This activation statement is not installation SQL.

The harness maps only fixed synthetic object-name prefixes so the same behavioral
cases can exercise real installation names. It executes installation SQL unchanged.
Local PGlite provides single-session preflight; native CI supplies contention
evidence. The application receives no new database dependency. Remaining live
administrator authorization, provider adapter, reconciliation procedure, calendar
behavior and credential-retention validation are still separate work.
