# Customer workspace navigation

Below 1024px the workspace shows five compact customer links per page. Search matches saved name, username, Panel ID, email, phone, package and device; filters preserve the existing billing semantics. Sort by name, renewal date or Panel ID. Search/filter/sort changes start at page one. Summaries and bulk tools are below the directory and do not mount on a phone until opened.

`/admin/crm/customer/:customerId` opens one existing full record under the same AdminLayout identity guard. Back to customers restores search, filter, sort and page through router history state (no customer search text in the URL). Browser reload preserves history state; opening a fresh URL starts with defaults. Dialogs and revealed passwords close when the customer route changes. A missing record shows an explicit unavailable message.

Desktop retains full panels, six per page. Both views read all customer pages in ascending UUID order, 200 at a time, before presenting complete search/results/totals. A failed or invalid later page discards partial data and shows an error. This is a client-side directory over all saved rows, not server-side search or a transactional snapshot across concurrent changes; very large datasets may need a future indexed server search endpoint.

Existing payment, CRM date, history, portal linking and provider controls are retained. No schema, credentials, renewal flags or APK changes are included.

`node scripts/test-ks-crm-directory.mjs` exercises the actual Supabase SDK against an offline SELECT-only transport with 1,205 fictional customers, later-page failures, repeated pages, the actual phone/list/detail/desktop components, pagination/search/sort/back state, correct edit identity, missing records and responsive cleanup. Existing financial and admin identity regression suites remain required. No live customer or provider calls are made by these fixtures.
