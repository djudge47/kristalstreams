# Personal provider-credit account verification

On October 22, 2026 the owner clarified that don.judge is his personal account,
funded with his existing provider credits. No customer payment was recorded.
The CRM record now has payment_status=personal and monthly_price=0.00;
last_payment_at remains NULL. The UI shows Personal · provider credits and
No customer charge, and excludes personal accounts from unpaid balances and MRR.

The completed service is unchanged: 6 Months + 3 Connections, with renewal and
expiration both 2027-04-22T05:56:49Z. The original single provider purchase remains
complete: operation ff76f980-ec4f-445b-b2b7-c7e9da29f5f8, 15 credits, balance 53.
No additional purchase or provider call occurred during this correction.

Installed migration 20261022064931 (ks_crm_personal_credit_accounts) preserves
zero customer charge for personal accounts in verified completion/recovery.
Its SQL is byte-identical to scripts/ks-crm-personal-credit-accounts-schema.sql;
SHA256: 3e8f160ab2c895c2bd76d3a5329b70b58baa7e7ee8d8a1e0855253849720c353.
The CLI draft filename was aligned with the connected migration version.
The private function remains an invoker with empty search_path, inaccessible to
browser roles. All three purchase controls remain OFF.

After the classification correction, all 19 explicitly selected safe customer
service/billing fields match before and after migration installation. Digest:
735be012bf4ef039f0d1a632a0be49bd403fabd158ddc5cf5598f6e19094c724.
The other 18 customers retain digest
407f8aec8a407105019664be14b194df9007e14c8d0536001af0178474490a13.
These checks exclude passwords, tokens, line URLs and raw metadata. Payment
count remains 4, personal account payment history remains empty, and operation
and completion counts remain 1/1. Security advisor warnings are unchanged.

At functional source 46a91fff465dd40ad34a6089d8bc3ef19445bb23 all five CI
workflows pass and the private branch Preview is READY. Local validation passes
7 retail checks, 46 SQL/HTTP/React changed-order checks, 8 CRM-link checks and
24 guarded execution checks. ESLint and Vite build pass. TypeScript retains the
same 47 existing diagnostics, with none added. The earlier retail verification
note describes the state before the owner clarified personal account funding.
