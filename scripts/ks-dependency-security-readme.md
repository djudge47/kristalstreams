# Dependency security and framework compatibility — October 23, 2026

The navigation framework now uses exact React Router/DOM 7.18.4, removing the two remaining router package alerts. The existing BrowserRouter, nested routes, identity guards, destination allowlist and Link/useNavigate calls are retained. The eight server-render fixture imports use v7's public StaticRouter export; their assertions remain intact. React 18 and Node 24 satisfy v7's documented requirements.

## Styling advisory correction

The preceding compatible patch already installed **postcss-selector-parser 6.1.5**, the maintainer's supported security backport for the Tailwind 3 line. Its installed changelog and code contain the flat-selector linear-time fix. The [signed 6.1.5 release](https://github.com/postcss/postcss-selector-parser/releases/tag/6.1.5) identifies source commit `d90b6e38a0c79d07b02bf0d602bc242fe94be6b9`. The [maintainer's advisory](https://github.com/postcss/postcss-selector-parser/security/advisories/GHSA-rj75-hqrm-r3gf) explicitly lists **6.1.5 and 7.1.6 as patched**.

The npm registry audit still classifies versions `<7.1.6` as affected, including this patched 6.1.5. A fresh audit with a separate cache and online preference reports **three moderate package entries**: parser, postcss-nested and Tailwind; zero high/critical/low. These three entries share the same advisory and reflect that stale registry version range. They are not hidden, suppressed or edited out of the audit output. The registry's suggested forced Tailwind 4 upgrade is unnecessary to obtain this specific security backport.

Tailwind 3.4.17 and all CSS/source/configuration are preserved. Tailwind 4 raises browser requirements and changes default utilities. No new browser requirement, major parser override, force update or layout migration is needed for the verified backport. This corrects the preceding notes' inference that the remaining styling alert necessarily required a major Tailwind migration.

The full stylesheet still has SHA-256 `7f73d8d2515f0de155e1b9bcb98a04e9b8a58eec5dd226acec08ac9e80ac63c8`, byte-for-byte identical to approved live commit `fc861489dbf90c306567a52ac743889be477cae8`. This establishes unchanged generated styles, not certification of every browser/device.

## Verification and CI

- `npm run check`: strict TypeScript targets, zero-warning lint, nine source-quality scenarios and Vite production build.
- `node scripts/test-ks-framework-upgrade.mjs`: installed router versions, reviewed parser integrity, real installed parser handling a 400 KB / 200,000-node flat selector in a bounded subprocess, escaped/nested selector preservation and full stylesheet hash.
- `node scripts/test-ks-framework-browser.mjs`: builds the real production code with fictional service settings, serves it only on loopback and blocks external requests. Chromium verifies five-row phone paging, exact selected/Edit identity, browser Back, Back-link search restoration, 320px touch sizing/no horizontal overflow, six full desktop panels, expandable navigation and ordinary-user rejection. Auth and service reads are fictional GETs; the Account and Support regressions additionally permit one strictly validated fictional, owner/revision-bound full_name PATCH and one owner/ticket-bound reply POST and one owner-bound new-ticket POST; no real password, record, payment, mail, provider or credit action occurs.
- Existing navigation, admin identity, help, checkout, completion, received-payment, private portal, password, chat, support and playback fixtures retain their assertions. Application quality runs the new framework checks and isolated browser test before the existing Production/Preview disposable SQL and regression suites. All seven exact-commit workflows remain required for release.

The browser fixture takes `KS_PLAYWRIGHT_MODULE` pointing to an isolated playwright-core index.mjs and either `KS_CHROMIUM_MODULE` or `KS_BROWSER_EXECUTABLE`. CI installs exact playwright-core 1.62.1 and @sparticuz/chromium 143.0.4 outside the application dependency tree with lifecycle scripts disabled. Local extraction used ordinary Brotli/tar extraction without ownership restoration because this workspace rejects archive chown; no privilege escalation occurred. Browser web-security checks stay enabled. Optional `KS_BROWSER_SCREENSHOT_DIR` creates only fictional-data QA images for internal inspection.

The subsequent October 24 Support repair intentionally replaces the stylesheet baseline with 3647de7a03bfbd0816c3aee353f9b9c638199b83dabd6eff1bbb3d888c96f3a2 after comparing actual CSS rules: one focus utility added, three unused old-ticket utilities removed and every shared rule unchanged. The existing phone/desktop browser checks pass. See ks-customer-tickets-readme.md. Future intentional styling changes must likewise replace the fixed reviewed stylesheet hash after verification. The existing bounded `npm audit --audit-level=high --ignore-scripts --package-lock-only` gate still fails for high/critical findings or a failed registry read. It does not claim zero advisories. No dependency exception file or alert filter is added.

## Earlier compatible maintenance

| Snapshot | High | Moderate | Low | Critical |
| --- | --- | --- | --- | --- |
| Original live `db056778486d771dcf009462b32974871ed58811` | 9 | 5 | 3 | 0 |
| Compatible patch `fc861489dbf90c306567a52ac743889be477cae8` | 0 | 5 | 0 | 0 |
| Reviewed router follow-up | 0 | 3 | 0 | 0 |

The compatible patch pins Supabase 2.118.0 and includes Vite 7.3.7, PostCSS 8.5.31, Browserslist 4.29.4, js-cookie 3.0.8, source-map-js 1.2.2 and compatible Babel/humanfs/brace-expansion/nanoid/js-yaml fixes. The old ws dependency left the Supabase tree. The current patch retains those fixes. Application code, database schema/customer records, project/Auth settings, credentials, financial/provider execution controls and native APK bytes are unchanged by this follow-up.

Scope is the repository npm lockfile and reviewed application navigation/styles. Separate Deno URL imports, installed Android dependencies, hosted-service internals, real customer sign-in and a complete penetration test are outside these results.

Primary references: [React Router DOM compatibility exports](https://api.reactrouter.com/v7/modules/react-router-dom.html), [router advisory](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6), [styling backport release](https://github.com/postcss/postcss-selector-parser/releases/tag/6.1.5), [patched-version advisory](https://github.com/postcss/postcss-selector-parser/security/advisories/GHSA-rj75-hqrm-r3gf), [Tailwind upgrade/browser requirements](https://tailwindcss.com/docs/upgrade-guide), [Supabase 2.118.0 release](https://github.com/supabase/supabase-js/releases/tag/v2.118.0), and [Supabase npm security guidance](https://supabase.com/docs/guides/security/npm-security).
