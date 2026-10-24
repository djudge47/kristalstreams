# Preview activity capability diagnostic

The owner authorized investigating `live_connections` through the existing server connection on October 24. Public XUI 1.7 documentation lists this read action, but the retained Roomba XUI ONE 1.5.5 guide does not establish support. This is an explicit compatibility diagnostic, not a verified provider activity contract or a live dashboard implementation.

The existing `/api/ks-roomba-account?view=activity-support` route is GET-only, Preview-only and restricted by the existing confirmed administrator verification. The existing account reader must first verify a positive reseller ID. Credentials stay in the deployed server environment. No new function, database write, schema, grant, provider mutation, execution flag, credential change, production rollout or credit operation is introduced.

After account verification, exactly one `live_connections` GET uses the existing fixed HTTPS endpoint, verified Fixie transport, `start=0`, `limit=1`, manual redirects and request timeout. A bounded streaming parser validates at most 1 MiB / 100000 tokens / 32 levels / one row. It assembles no customer values, passwords, IPs, session identifiers or raw response. The public projection contains only a fixed diagnostic outcome/message and observation time. A successful table shape does not establish ownership, complete pagination, field meaning, unique-customer counts, offline state or channel mapping. Online now remains unavailable.

Authorization runs before every cached result. Per-instance cache/coalescing and a one-minute retry gate bound repeated requests; these are not a global distributed rate limit. The phone UI never dispatches on load or when cooldown ends. It uses fixed local messages and shares its synchronous in-flight gate with the existing account button. The diagnostic requires the owner's website admin session; Vercel authorization does not substitute for this application login.

Tests: `node scripts/test-ks-roomba-activity-probe.mjs`, existing preview/admin/line/customer-status suites, `npm run check`, fixed stylesheet/parser checks and the production-code offline Chromium phone fixture. The new fixture adds GET-only fictional diagnostics, leaving the six separately constrained fictional writes unchanged. Local tests do not establish live provider support.

Source lead: https://xuiofficial.com/docs/api-reference/reseller-api (XUI 1.7); shared envelope/paging documentation: https://xuiofficial.com/docs/api-reference/admin-api . These sources are not represented as Roomba 1.5.5 confirmation.
