# Locked npm dependency security — October 23, 2026

The previously inconclusive external dependency scan now completed against the exact live source at `db056778486d771dcf009462b32974871ed58811`. `npm audit --json --ignore-scripts --package-lock-only --fetch-retries=0 --fetch-timeout=15000` reported 17 affected package entries: nine high, five moderate and three low; zero critical. Counts are package entries, not independent exploits or evidence of an incident.

## Compatible maintenance

A non-force, lockfile-only audit update stays within existing declared version ranges. Supabase is additionally pinned exactly to 2.118.0 in the manifest and lockfile. Existing application code, database migrations, customer records, provider operations and native APK files are unchanged.

| Dependency family | Previous locked version | Updated locked version |
| --- | --- | --- |
| Supabase client | 2.49.4 | 2.118.0 (exact manifest pin) |
| Auth client | 2.69.1 | 2.118.0 |
| React Router DOM | 6.30.3 | 6.30.6 |
| Remix router | 1.23.2 | 1.23.4 |
| Vite | 7.2.0 | 7.3.7 |
| PostCSS | 8.5.6 | 8.5.31 |
| Browserslist | 4.24.0 | 4.29.4 |
| js-cookie | 3.0.5 | 3.0.8 |
| source-map-js | 1.2.1 | 1.2.2 |

Compatible Babel, humanfs, brace-expansion, nanoid and js-yaml fixes are included. The updated Supabase tree no longer includes the old ws package. Dependencies were installed with `npm ci --ignore-scripts --no-audit --no-fund`; lifecycle scripts were not enabled. Both CI and the unchanged Vercel project use Node 24, satisfying the new Supabase Node 22+ requirement. No Node/project setting was changed.

A fresh audit of the updated lockfile reports zero high, zero critical, zero low, and five moderate affected package entries. `npm audit --audit-level=high` passes; it does not mean zero advisories. Application quality CI now repeats that bounded registry check and fails for high/critical findings or an unavailable audit response.

## Explicit remaining findings

- React Router and React Router DOM remain affected by [GHSA-wrjc-x8rr-h8h6](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6) and the SSR hydration advisory [GHSA-337j-9hxr-rhxg](https://github.com/remix-run/react-router/security/advisories/GHSA-337j-9hxr-rhxg). npm proposes React Router 7.18.4, a major upgrade. The app uses client-side BrowserRouter; no SSR hydration entry point was found. The existing login-destination allowlist rejects external/protocol-relative/backslash/control-character destinations. These observations reduce specific exposure; they do not remove or dismiss the package advisories.
- Tailwind CSS, postcss-nested and postcss-selector-parser account for the other three entries through [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf). npm proposes Tailwind 4.3.3, a major styling upgrade. The affected parser is a development/build dependency; no customer-supplied CSS compilation was found. A separately tested styling migration remains required to remove this advisory without breaking the approved layouts.

No force upgrade, override of unsupported major ranges, advisory suppression or change to financial/provider execution controls is included. The checks cover the repository npm lockfile, not separate Deno URL imports, installed Android dependencies, hosted-service internals or a complete penetration test.

## Verification

The fresh install, strict TypeScript targets, zero-warning lint, nine application-quality scenarios and Vite production build pass. Existing actual SDK/password/chat/support/directory tests pass unchanged, together with navigation/admin access, playback preferences/catalog, help, payments, payment summaries, support UI, customer setup/status, and portal identity/expiration fixtures in New York and Tokyo. The existing login destination regression remains required. GitHub's seven full workflows supply the SQL/native/provider simulation checks before release. No real password, support message, receipt, customer link, XUI action or credit spend is used for these tests.

Primary upgrade references: [Supabase 2.118.0 release](https://github.com/supabase/supabase-js/releases/tag/v2.118.0), [Auth path-validation advisory](https://github.com/supabase/auth-js/security/advisories/GHSA-8r88-6cj9-9fh5), [Supabase npm security guidance](https://supabase.com/docs/guides/security/npm-security), and the current [Supabase changelog](https://supabase.com/changelog). The changelog's client Node/TypeScript requirements were checked; no database, cipher, platform or Auth configuration change is part of this release.
