# Website password-reset request reliability

The Login modal used render-state loading checks that could admit duplicate submissions before React rerendered. Its request could wait indefinitely, outlive the modal or update a later draft. Raw Auth errors reached the page, and a successful API response was described as an email delivered/sent without delivery evidence. The modal had no dedicated mobile route or accessible email label.

Login now links to the public `/forgot-password` page. An unavailable/expired recovery link points directly there too. This change removes only Login's old recovery state, request handler and modal; password sign-in, return-destination validation, register navigation and Auth configuration remain unchanged. The first six existing login-handler scenarios retain their original assertions. Their seventh obsolete modal-retry scenario now verifies the real recovery link and no Auth request from Login. CI now runs that previously separate seven-scenario script.

The recovery page has a labeled bounded email input, initial/new-draft focus, 48px controls, vertical navigation and no modal/focus trap. It clears its email draft at dispatch, disables the fieldset while pending, and removes the form after a result. A public help destination and Back to sign in remain usable; leaving the page explicitly does not cancel an already submitted request. Merely visiting either recovery page sends no email or private-data request.

A module-cached controller serializes this browser runtime's reset requests across SPA remounts. A synchronous gate covers both same-address and different-address duplicate submissions. It trims/bounds/validates the captured email before the SDK call and constructs only the current origin's `/reset-password` destination, accepting no caller-selected redirect. Missing configuration or malformed origins cannot dispatch. The subscribable snapshot contains only status, a fixed message and new-draft availability, with no email, credential or Auth response metadata. There is no extra local/session-storage record, account lookup, sign-in, password update or database access in this request workflow.

The existing main Supabase SDK handles its normal PKCE verifier and recovery request. Its storage key, persistence, project and redirect allowlist are unchanged. The installed SDK's optional `appendPkceFlowIdToRedirects` feature remains off, preserving exact redirect compatibility; no new callback query parameter or Auth setting is introduced. These runtime guards cover this form, not other tabs, full reloads, SDK callers or cross-flow PKCE coordination. Backend rate limits remain authoritative.

A twenty-second deadline ends local waiting and reports uncertainty. It does not cancel or roll back SDK/server execution. A late result cannot replace that uncertainty. Fixed messages distinguish known rejection/rate limits from uncertain network/server/contract outcomes and never reveal raw Auth details. A successful SDK response says **if the address is eligible**, check its inbox/spam; it explicitly does not confirm delivery or account existence.

Every dispatched request starts a sixty-second local pause. Another request requires both transport settlement and that pause, followed by an explicit Start another reset request action opening a blank draft. No timeout, cooldown, page reopening or result handler resends automatically. A still-unsettled SDK operation cannot be bypassed by waiting out the timer. The guard is in-memory UX coordination, not durable idempotency or server abuse prevention. Main password sign-in hardening and real email-delivery checks remain separate work.

## Verification

```
node scripts/test-ks-password-reset-request.mjs
node scripts/test-ks-login-flow.mjs
node scripts/test-ks-password-recovery.mjs
npm run check
node scripts/test-ks-framework-upgrade.mjs
```

Five new actual-controller/installed-SDK groups exercise invalid input/configuration/origins, exact captured-email/current-origin PKCE transport, no sign-in or data write, synchronous duplicate blocking, neutral acceptance, pause plus explicit new draft, bounded waits, still-pending transport, late results, definite/rate/network/server outcomes and unsubscribe/disposal. A bounded wait lets the real SDK's asynchronous WebCrypto finish before asserting transport; it does not weaken the request assertions or use real network. The adapter permits only POST to a fictional `/auth/v1/recover` origin and checks the exact SDK body and unchanged redirect. PKCE verifier storage is fictional memory; no real session/credential is read.

Production-code Chromium extends the existing 320px fixture with Login → dedicated recovery page, focus and 48px targets, cleared/disabled pending input, navigation away/back retaining the one request, held transport, neutral acceptance, one-minute clock advancement and an explicit empty/newly focused draft without resending. A signed-out unavailable reset link reaches the new page without private/account/email requests. Horizontal overflow and page errors remain disallowed. Existing password-recovery, admin, portal, support and account journeys keep their assertions. Exactly one separately constrained fictional recovery POST joins the preceding five independently validated writes; external network stays blocked. No real reset mail is sent.

The full stylesheet remains the reviewed `c4d0cdb8af063ddae829b2f656eee490d594122774f6c94a5971b60136eab241` baseline. Dependencies, database/schema/grants, Auth settings, actual credentials, customer records, financial/provider execution flags, CRM/XUI integration and native APK are unchanged. Production evidence is recorded in the completion audit and PR after all seven exact-commit workflows pass.

Primary guidance: current Supabase changelog, [resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), and the installed SDK implementation of reset requests, PKCE verifier generation and optional redirect flow IDs. The upcoming legacy TLS-cipher retirement remains a separate compatibility follow-up.
