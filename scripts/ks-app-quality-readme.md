# Application quality repair

The audited branch built successfully while its TypeScript check reported 45 diagnostics and the normal lint command crashed. Explicit TypeScript ESLint rule defaults repair the lint compatibility failure without disabling the rule, downgrading severity, loosening TypeScript strictness or changing dependency versions. The full lint pass then exposed 50 errors and six warnings, including the separately linted API/Edge sources.

The repair supplies real state/DTO/event/query types, imports the React hooks used by the performance helper, uses the existing ES2020-compatible own-property check, removes unused declarations and unused authentication subscriptions, and makes carousel effects use current transition state. An obsolete, unrouted nested dashboard now forwards to the maintained dashboard. Missing article/guide results are handled before reading their IDs or incrementing metrics. Existing help-data availability, demonstration playback, status claims and unfinished admin modules remain separate audit findings.

## Reproduce

- `npm run typecheck`: strict checks for every `src` TypeScript file, Vite configuration and the TypeScript API adapter. Imported JavaScript is resolved but not checked as typed JavaScript. Supabase Deno functions are not part of this TypeScript compiler target.
- `npm run lint -- --max-warnings 0`: the normal repository lint configuration with zero-warning acceptance. Existing file coverage and rule severities are retained; no new ignore or disable is introduced.
- `node scripts/test-ks-app-quality.mjs`: nine offline scenarios against the actual compiled query helpers, error screens, checkout adapter, Edge checkout/webhook rejection paths, observer hook and hero component. The real lint config must also reject intentionally invalid fixture text. Browser/Auth/Stripe/database/timer dependencies are local stubs, with no connected calls.
- `npm run check`: all three commands above plus the production Vite build.

`.github/workflows/ks-app-quality.yml` runs the combined check on every pull-request update and then runs the existing payment, support, CRM payment-summary and customer-portal regressions. Native database/provider-boundary workflows continue separately. Adding a workflow does not change GitHub branch-protection settings.

Local validation passed: all type targets, normal lint with zero warnings, all nine new scenarios and the production build. Existing regression suites passed: 13 payment checks, six support-client checks, two support UI scenarios, six CRM payment-summary scenarios, six portal UI scenarios, 12 customer setup checks and six customer status renders. Vite still reports the existing large vendor chunk and outdated Browserslist-data notices; these are separate performance/maintenance follow-ups.

This is source/Preview work. No database migration, customer-record update, payment, email, XUI operation, renewal-flag change or production promotion is part of this repair. Stripe Edge source edits are limited to type-safe error/parameter handling; no Edge function is deployed by the quality workflow. No SDK, dependency manifest versions or lockfile entries were upgraded. The earlier external vulnerability scan remains unverified.
