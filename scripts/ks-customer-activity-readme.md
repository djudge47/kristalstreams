# Customer device/activity presentation — October 24, 2026

Devices previously treated open `streaming_sessions` rows as active native players and offered End session. That button only updated `ended_at` in the website table; it did not disconnect a provider/player. History treated the same table as authoritative viewing history and told a customer with no rows that they had not watched anything. A source-wide search found no session writer or documented provider activity bridge in this application.

## Resulting behavior

Devices & connections now explains that live device activity and remote disconnection are unavailable. A confirmed, non-anonymous website account can see its **saved connection allowance** through the existing owner-bound private CRM service endpoint. Each linked service shows its own package, limit and saved expiration. The allowance is not presented as online users, current streams or a registered-device count. Receipts and payment pagination are omitted in this view; Dashboard and Subscription keep their existing full service/payment view.

The new verified-account hook checks Auth using getUser. It clears the previous identity before rechecking Auth events, defers SDK calls until the callback returns, ignores delayed/stale results and unmount completions, and unsubscribes on cleanup. Signed-out, unconfirmed and failed checks have explicit states. The service component is keyed to that verified identity and additionally refuses to render a snapshot whose accountId differs from its prop, protecting its full/default view too.

Missing ownership links and unavailable/failed service reads remain distinct. Failure never becomes a zero allowance or inactive service. An unavailable rollout has a visible explanation in the connections view; the existing full view's hidden behavior stays unchanged. Names/package text wrap on phones. Device-help and setup-guide links lead to existing routes.

Streaming History explains that viewing activity is not connected and points to a player's own history if available. It offers real Subscription/payment-record and support destinations. It does not infer that the customer has never watched content, query unverified session records, or create invented activity. Existing database rows remain stored and untouched.

## Verification

`node scripts/test-ks-customer-activity.mjs` has six actual-source fixture groups: verified-owner transitions; delayed prior-owner/sign-out/anonymous/unconfirmed/malformed identities; Auth failure/retry/unmount; actual page disclosures and destinations; separate saved allowances with receipts omitted and wrong-owner snapshot rejection; and empty/error/unavailable service behavior with no raw session read/write. Transport and identities are fictional.

The existing full portal/receipt/identity fixtures pass unchanged. The real Chromium production-code fixture now also checks Devices and History at 320px: verified allowance, no table-only disconnect or displayed receipt, missing-link/error distinction, safe refresh recovery, real payment-record navigation and no horizontal overflow. Existing admin pagination, exact customer/Edit identity, browser Back, search-state restoration and ordinary-user denial remain in the same browser test. External network is blocked; activity/Auth/service reads are GET-only. The separate Account and Support regressions in the same harness allow one strictly validated fictional name-only PATCH with owner/revision filters and one owner/ticket-bound fictional reply POST and one owner-bound fictional new-ticket POST.

Application quality CI includes the new six groups and extended browser fixture, alongside strict TypeScript, zero-warning lint, build and existing payment, portal, support, native and SQL checks. The subsequent Support repair reviews a minimal utility-only stylesheet change and updates the fixed hash baseline; all shared CSS rules and the customer/admin workspace design are retained. None of these fixtures accesses an actual account or provider.

## Scope and remaining work

This repairs misleading claims and exposes an existing verified allowance. It does **not** implement live activity, cross-device viewing history, device registration or provider disconnection. Those features still require a documented provider contract, a reliable writer/source, customer ownership binding and independently reviewed actions. No undocumented endpoint or browser session-table change is substituted for those controls.

No database migration, saved customer/session/payment change, email, Auth setting, native APK, XUI operation, credit spend or execution flag is involved. The existing service endpoint and backend authorization/projections are unchanged, including its allowlisted bounded payment projection. Source reads of provider credentials, real tokens, metadata, passwords and real customer rows are unnecessary for this repair and were not performed.
