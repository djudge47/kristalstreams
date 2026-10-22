# Disabled changed-order installation verification

Verified October 22, 2026 at approximately 04:50 UTC, only in the active Kristal
Stream Supabase project `wftfxerblhlsxiijtfbo`.

- Migration: `20261022045024_ks_crm_changed_order_renewal_disabled.sql`.
- Installed SQL SHA256:
  `789242e9b85ef05e26f36f63be477c75d92d2bb7e3031df490200251e9535208`.
- Source reviewed and tested before installation:
  `4d982b40fd4836afba18fc45003403307effd9fc`.
- The original CLI-created draft filename was renamed to the actual version
  recorded by the connected migration service; SQL content is unchanged.

The exact seven-column installation verifier returned all true: all three
execution controls off, service unable to enable the new control, six private
RLS tables, ten private invoker functions with empty search paths, the reviewed
five-protocol shared guard, all five exclusion triggers, and no new work.

The shared guard changed only to include the new namespace. Its predecessor
SHA256 was `55f892aca2d53b808135722a1be6e0cac8c4adbc8b5870b6663690d354ced088`;
its installed SHA256 is
`bcfe76ab1b25f2c41b302d6ef0f47f8209d7288f6ca20f4a1ef08804e965a884`.
Use the new five-protocol verifier for the current installation. Earlier
four-protocol verification documents describe their historical installation.

## Preservation evidence

Before and after installation, there were 19 CRM customers. A database-side
SHA256 of the ordered, explicitly selected customer identity, expiration,
connection allowance, package, billing/status and contact fields was identical:

`e4eb3d2ed6a8ce125d82f3716aadf069099ebfc8d7b33eefd78a4ef29267144c`

No password, credential, session, provider key or raw provider metadata was read
for that comparison. Existing test approval/operation counts remained 1/1, test
completions 0, live approval/operation/completion counts 0/0/0, and all existing
reseller slot counts 0. Every new work table is empty. The migration contains no
customer DML and does not alter the existing app/CRM/XUI integration code or the
existing purpose-separated consent and execution functions.

Security advisors reported no errors or newly added warnings. The six additional
`RLS Enabled No Policy` INFO entries are expected for intentionally private
server-only tables. The preexisting Auth leaked-password-protection warning is
unchanged and outside this installation's scope.

## Validation and release state

On the reviewed source commit, all five GitHub workflows succeeded:

- Native CRM renewal rehearsal: run `39724425187`, including both new PostgreSQL
  17.6/17.11 independent-session jobs and the four existing renewal jobs.
- CRM XUI status checks: run `39724425150`.
- Native signed review handoff checks: run `39724425146`.
- Native receipt-only database checks: run `39724425154`.
- Native paid worker recovery checks: run `39724425186`.

Local checks passed: 43 new isolated SQL/HTTP/React checks, 184 existing relevant
checks, changed-component ESLint and Vite build. The TypeScript check produced
exactly the same 47 baseline diagnostics and no new diagnostics.

Private Preview deployment `dpl_AsxBPyDw7rWz92ejKTVngDhd6iVv` was READY for that
source commit. No production promotion or protection change was made. The stable
branch Preview remains the CRM entry point.

The new server release flag, scoped customer and signing key were not provisioned.
All SQL execution controls remain off. No actual provider purchase, renewal,
password change, email, credit spend or new customer record occurred. A specific
live test still requires the owner's explicit authorization; API package-change
behavior, real calendar results and the existing streaming login remain
unverified until that controlled test. The read-only quote does not establish a
purchase, paid account, completed renewal or playback.
