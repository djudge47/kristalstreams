# Public help content

The Knowledge Base previously offered fallback sample articles whose detail pages depended on absent support tables and metric functions. Device lists and guide details did not share a reliable source. Two historical topic URLs had no route.

`src/lib/help-content.ts` now maintains five articles, four topics and four device guides as versioned source content. Lists, details and the seven established support pages share those documents. Search includes title, description and section text, with the topic/query in the URL. Unknown slugs and empty searches offer recovery links. Existing article slugs and support pages remain valid; `/support/technical` and `/support/device-setup` redirect to their maintained pages.

Help pages need no database or metrics client. They show no invented dates, view counts, vote totals, difficulty or duration. The obsolete unused help API and sample data are removed; other API helpers are preserved. This is a curated catalog, not a CMS or analytics system. Device compatibility, a current approved APK and actual playback are separate verification tasks. The guides distinguish website access from streaming setup and preserve working installations.

Run:

```
node scripts/test-ks-help-content.mjs
npm run check
```

Four offline regression groups render actual React components and verify all listed documents, category/search/input behavior, unknown-slug recovery, seven established pages and actual App-route coverage for rendered links. Database/API imports and fetch are blocked. The quality suite also covers query-cache behavior and article/guide not-found states. Application quality CI runs both suites plus existing payment, support and portal checks after a fresh install.

No schema, customer record, receipt, provider operation, credential, execution control or mail delivery is changed by this repair. Production promotion remains separate from Preview publication.

## Service-status evidence

The System Status, Status History, Maintenance Schedule and Known Issues pages now state that verified information is unavailable and direct customers to support. They no longer simulate loading, advance a checked timestamp on a timer, mark services operational, publish a made-up uptime percentage, claim an incident-free period, schedule unverified weekly work or promise automated incident email. Five service areas are explicitly unverified. This corrects the presentation; it does not install monitoring or establish that a service is down.

The matching 99.9% cards in Demo Reel and Testimonials become links to service information; Reselling no longer promises that unsupported guarantee. Other marketing metrics and capabilities have not been established by this status repair.

The public-help suite now has five groups, including actual rendering of all four status pages, unknown-state labels, support navigation and absence of the former claims. Its existing route-contract check also covers status-page links. The same no-database/no-network boundary applies. Run the commands above; CI runs the expanded suite automatically.
