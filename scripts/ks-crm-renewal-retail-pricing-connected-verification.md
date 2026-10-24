# Connected renewal retail pricing verification

Installed October 22, 2026, 2:29 AM America/New_York (06:29 UTC), using only
active Kristal Stream project `wftfxerblhlsxiijtfbo`.

Migration `20261022062904`, `ks_crm_renewal_retail_pricing`, succeeded once.
The CLI-created draft filename was aligned with the recorded connected version;
the SQL bytes are unchanged. Installation source/migration SHA256:
`6132a6762c2e4cc53b534ec1de6f4d663a87115f677fdc5e811b9ec5921f5bb7`.

All 20 catalog options match the shared website/checkout prices. A mismatched
package and connection count returns NULL. Both new functions are private
security invokers with empty search paths; neither browser role can execute
them. Both completion-table triggers are enabled. All three purchase controls
remain off. No provider call, repeated renewal, credit spend or payment was
performed by this installation.

Before installing, the existing completed don.judge account was corrected from
zero monthly price to the catalog's $25 monthly equivalent ($150 for 6 months,
3 connections), conditional on the immutable completed renewal receipt and exact
saved identity/package/expiration. Its renewal date already matched the verified
expiration. Payment status remains unpaid, last payment is NULL, and no customer
payment is invented. The CRM labels this as No payment recorded.

All 19 customers' explicitly selected safe service/billing fields matched before
and after installation. Passwords, line URLs, tokens and raw metadata were never
included in these checks. Safe customer digest:
`b3eb667df66d40d9454fb1b7c6da2d8f57ddd214c5ec92a5e01c828f0f81caaf`.
The other 18 customers match the digest from before the one-account correction:
`407f8aec8a407105019664be14b194df9007e14c8d0536001af0178474490a13`.
Payment count remains 4. Changed-order operation/completion counts remain 1/1.
Security and performance advisor warning sets match the pre-install baseline.

At source commit `a124a0c91942cfb261d83bb9aa20f73f0913629a`, all five CI
workflows succeed. The native changed-order jobs each pass 54 checks on
PostgreSQL 17.6/17.11, including atomic price/date persistence failure and recovery
without a second fictional provider purchase. Four existing renewal contention
jobs also pass. The initial native failure was a test's SQL-NULL serialization
case; it was corrected before installation, and no live SQL change was used to
work around it.

Local checks: 6 retail-pricing cases cover all 20 catalog combinations and actual
chart rendering; 13 payment validation checks; 18 requested-order checks; 45
SQL/HTTP/React changed-order checks. ESLint and Vite build pass. TypeScript has
the same 47 pre-existing diagnostics and no new diagnostics. The private Preview
is READY at the verified functional source commit. No merge, public-site price
change, production promotion or deployment-protection change occurred.
