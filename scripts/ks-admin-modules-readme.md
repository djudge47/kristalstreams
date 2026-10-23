# Admin module availability and customer navigation

The legacy Customers, Slider and generic CRM screens used absent backing relations and could turn an error into an apparently empty list. Slider also offered save/delete controls without checking the returned error. Analytics had static metric placeholders, and the demo/program managers were unfinished.

On October 23, 2026 a SELECT-only metadata query against the active Kristal Stream project confirmed that stripe_customers, slides, crm_contacts, crm_companies, crm_deals and crm_activities remain absent. No customer rows or sensitive columns were read and no schema or record was changed.

## Result

- Customers now redirects to the existing `/admin/crm` Customer Workspace. No Stripe customer list, identity merge, new record or payment state is inferred or created.
- Sidebar and admin-only dashboard shortcuts promote maintained destinations. `/admin/modules` explicitly lists eight unavailable modules with practical explanations and navigation to the Customer Workspace.
- Legacy analytics, slider, demo-reel, programs, contacts, companies, deals and activities routes remain inside the existing admin layout. They render a shared, route-specific unavailable page without reads, editing controls, fake empty lists, metric totals or success messages. No requested path/query/fragment is displayed.
- The obsolete editor/page source files remain preserved; their lazy imports are removed from App, making those workflows unreachable through the app. The maintained CRM, support, setup, provider integration and existing admin Auth behavior are unchanged.
- A static module catalog keeps the availability list, legacy explanations and navigation grouping consistent. The sidebar keeps the unavailable section selected for its legacy destinations, retains accessible collapsed labels and closes on mobile selection.

This repairs misleading access to unfinished modules. It does not implement website analytics, content management, a separate contact/company directory, sales pipeline or general activity workspace. Those need independently reviewed product scope, data sources and access rules.

## Verification

Run:

```
node scripts/test-ks-admin-modules.mjs
node scripts/test-ks-navigation.mjs
npm run check
```

Four offline groups compile/render the actual availability pages, catalog, shortcuts and sidebar. They verify all eight exact legacy destinations (including case/trailing-slash handling), actual App route ancestry and redirect targets, exclusion of obsolete lazy imports, safe links, no data/editor claims and no connected access. The actual admin layout uses fictional Auth responses for authorized/other/signed-out/error/unmounted cases; these are not real sign-ins or a new database permission proof. Dashboard shortcuts retain the existing admin-only rendering condition. Existing route and CRM/portal suites remain in CI.

The Application quality workflow runs these checks after a fresh install, alongside existing regressions. No real email, payment, provider request, credit spend, execution switch, Auth configuration, migration, Edge deployment or production promotion is part of this repair.

An existing portal fixture assumed that a browser-local November 12 UTC evening timestamp would always display November 12. In a positive-offset zone it correctly displays November 13. That test now compares the full expected browser-local label while preserving every linked/unlinked/foreign-owner visibility assertion. The app's date formatter and all customer data remain unchanged. The six portal groups pass in both America/New_York and Asia/Tokyo; CI now exercises both zones.

## Administrator entry points on phones — October 23, 2026

The public header previously linked only to the customer dashboard/account pages, leaving the separate administrator workspace difficult to find on phones. The confirmed, non-anonymous administrator now receives prominent Admin Dashboard (`/admin`) and Customer Workspace (`/admin/crm`) entries first in the mobile menu and in the desktop account menu. The existing guarded administrator layout and customer records are unchanged. Selections close the relevant menu; mobile entries retain 48px minimum touch height. An added actual-Header fixture group checks administrator/ordinary/unconfirmed/anonymous/signed-out identities, an account switch, both menu placements, protected route destinations and menu dismissal without connected access.
