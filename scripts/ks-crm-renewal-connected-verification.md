# Disabled renewal foundation: connected verification

Installed on October 21, 2026 after Donald approved the reviewed disabled
installation. Target: **Kristal Stream**, project **wftfxerblhlsxiijtfbo** only.
No other project was accessed for this installation.

## Applied migration

- Server-assigned version: `20261021221434`.
- Name: `ks_crm_renewal_disabled_foundation`.
- Reviewed source commit: `6f8f156079ea2a21dfa1ebdfb17c051ba0553bf5`.
- Applied SQL SHA-256: `dd4dc26a9b4b326b045013fe8b9b3f7830e02919ac4f959fccc357ea93b62810`.
- Recorded SQL: `supabase/migrations/20261021221434_ks_crm_renewal_disabled_foundation.sql`.

The migration was applied once through the Supabase migration tool, which
returned success. Migration history confirmed the version and name above.
The repository copy is byte-identical to the reviewed installation SQL; its
historical draft header is preserved to retain the exact applied bytes.

## Prerequisites and connected results

Immediately before installation, SELECT-only catalog checks found all seven
reviewed column types, both enabled shared exclusion triggers, no target renewal
tables and no cross-protocol reservation conflict. The existing shared guard hash
matched `d7d5bfdcda6a8ee331784c1ed07e65d4be41db8ad1f8a81dda6c625e82ac8c77`.
The migration rechecked those prerequisites while holding bounded table locks.

The exact SELECT-only post-install verifier returned:

| Check | Result |
| --- | --- |
| execution_disabled | true |
| service_cannot_enable_execution | true |
| private_rls_tables | true |
| private_invoker_functions | true |
| shared_exclusion_attached | true |
| no_new_work | true |

An additional catalog read confirmed the installed shared guard body SHA-256:
`2634368d7e339f5bfc2d81040dc816e74d38d57087c2072bf58508c43aebf032`.

No provider call, renewal, credit spend, customer update, payment, receipt change,
approval submission or application/configuration change was performed. The only
seed row is the disabled control row. All five work/audit tables were empty.
The existing setup protocols now share their reseller exclusion with the new
renewal reservation table. Live execution and the approval button remain off.

## Advisor comparison

Security and performance advisors were read before and after installation.
There were no new warning- or error-level findings.

The six added security INFO notices are expected: the private tables have RLS
enabled with no browser policies, and browser table/function privileges are
revoked. They intentionally allow no browser rows. The three added performance
INFO notices identify the new, unused foreign-key indexes; the empty foundation
has not processed work. Keep those indexes.

Pre-existing findings were unchanged: one disabled leaked-password-protection
warning, four RLS initialization-plan warnings, six unindexed foreign-key INFO
findings, nineteen no-policy INFO findings and nineteen unused-index INFO
findings. These were not modified as part of the installation.

Advisor references:

- [RLS enabled with no policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- [Unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)
- [Leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [RLS initialization plans](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)
- [Unindexed foreign keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)

## Validation and remaining work

Before installation, the exact reviewed SQL passed 40 native installation checks
on each of PostgreSQL 17.6 and 17.11, including contention, drift rollback,
default-disabled execution and switch privilege denial. The existing prototype
passed 32 checks on each version. Receipt-only, paid worker recovery and signed
review handoff workflows also passed. Connected verification above confirms the
actual installation state; no connected behavioral test or test customer was
created.

Administrator authorization, a live application/provider adapter, explicit
approval binding, reconciliation, provider calendar behavior and credential
retention still require separate implementation and review. This installation
does not prove working live renewal access. Do not enable execution or replay the
migration as a reset. Preserve saved operation evidence if future work needs
reconciliation.
