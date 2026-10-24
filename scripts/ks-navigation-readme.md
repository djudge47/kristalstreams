# Missing-page and Accessibility navigation

`/accessibility` now provides practical browser/keyboard guidance, the owner-specified support inbox and a support-ticket link. It explicitly says a complete accessibility evaluation has not been completed; this page is not a compliance certification or a compatibility guarantee. The footer uses a router link, wraps its legal links on narrow screens and identifies support@kristalstream.com as the support inbox.

Unknown public, customer and admin paths render a useful Page not found screen with fixed Homepage, Help Guides and Support links. Customer/admin wildcards remain inside their existing layouts; the admin authorization boundary is unchanged. The page does not echo URLs, query values or fragments, navigate to a caller-controlled destination, submit anything or access connected services. Exact and dynamic routes retain priority.

Run `node scripts/test-ks-navigation.mjs` and `npm run check`. Four offline groups extract the actual nested JSX route tree and use the installed router matcher to verify layout boundaries, known/dynamic routes and legacy redirects. They compile/render the actual recovery and Accessibility pages and footer, verify safe links and support disclosures, and reject database/API imports or fetch. Only the footer's unrelated newsletter child is replaced with an inert fixture. Application quality CI runs the suite after a fresh install.

Existing help/playback link contracts explicitly exclude catch-alls, so an accidental missing route cannot pass simply by matching a 404. These component and route checks are not a complete assistive-technology or mobile-device evaluation.

This is SPA navigation recovery. The existing host serves index.html for frontend paths, so this change does not establish a server-side HTTP 404 status. API handlers, host rewrites, account authorization, customer records, XUI operations and production promotion are unchanged.
