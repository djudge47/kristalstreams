# Merged customer receipt history — October 25, 2026

- The existing customer service panel now reads manual receipts and verified completed website renewals together, with recorded amount/term, website recorded date, renewal completion and historical expiry. The current service summary stays separate. No financial rows, balances, billing or entitlements are changed.
- A private additive v2 snapshot preserves the old UUID-only function. Mixed source IDs, full timestamp precision and 20-row older/newer pages prevent missing receipts and an endlessly extending phone page. Exact matching manual Stripe references suppress duplicate display.
- Source is staged in PR #33. See `docs/customer-merged-payment-history.md`. Administrator financial/metric projection, refund/chargeback reconciliation, provider execution/authorization, additional timing policies, credentials, administrative controls and coordinated release remain open. All four execution controls stay off.

# Customer renewal history projection — October 25, 2026

- Verified live renewals now have a separate `renewal_complete` owner status. The dashboard, payment recheck and support context show the recorded completion and term without claiming current playback, delivering credentials or changing financial records.
- A bounded private SELECT-only RPC checks the immutable completion, provider proof, final operation, receipt, queue and current confirmed owner/service link in one database snapshot. Later service terms do not invalidate old renewal history; missing proof stays review and failed reads stay unavailable.
- Completed payment rechecks skip routing, review preparation and pending email. All existing Preview setup/expiry semantics remain separate. No new endpoint or function-budget slot is added.
- Migration `20261025130107` is installed in active Kristal Stream only; its read-only body and private grants match tested source. All customer service/billing and website-access digests, two receipts and empty completion/send ledgers are unchanged. All six implementation workflows passed at `32cdaab`, including 74 native cases per PostgreSQL version, 35 SQL/adapter cases and eight actual mobile/desktop renewal-status browser journeys. See `docs/paid-renewal-owner-status.md` and its installation report.
- Source is staged in PR #33. Provider execution/authorization, additional timing policies, financial reconciliation/payment-history projection, credential delivery, administrative UI and coordinated release remain open. All live controls remain off.

# Installed private paid-renewal completion — October 25, 2026

- A frozen pre-send expectation, matching provider/independent line proof and exact credit debit now precede local CRM completion. Only the owner-reviewed 6-month/4 → 6-month/3 reset policy is accepted, with explicit policy/lost-time confirmation. Unsupported cases remain for review.
- The local completion transaction changes only the selected service's expiry/allowance/package and its queue/ledger, preserving billing, profiles and credentials. Deferred checks and immutable proof guard against partial completion or ownership drift; lost replies and gate/consent expiry recover locally without resending XUI.
- Migration `20261025091959` is installed with tested function bodies, private invoker roles, deferred completion check and conditional release verified. All four controls remain off; new tables are empty. Customer billing/access and completed manual-operation digests are unchanged. Six workflows passed at `9042282`, including 70 native cases per PostgreSQL version and 31 actual SQL/adapter cases. See `docs/paid-renewal-completion.md` and its installation report. Source remains staged in PR #33.
- Provider transport/authorization, additional timing policies, customer-facing live completion and financial/account projection, credentials, administrative UI and coordinated release remain open. No real provider action, email or credit spend is enabled.

# Installed disabled paid-renewal send guard — October 25, 2026

- A separate consent and durable send-claim guard now protects the existing paid-renewal identity. Lost replies and retries cannot reacquire a claim; uncertainty retains physical reseller and line-version reservations without automatic release.
- The migration extends the existing five-protocol reseller exclusion to this sixth protocol with exact-source preflight, existing-work rejection and unchanged legacy triggers/grants. A new private control defaults off; no HTTP execution or consent issuance route is added.
- Migration `20261025084505` is installed disabled, with tested function bodies, six shared triggers, private grants and deferred commit guard verified. Customer billing/access and completed manual-operation digests are unchanged. All four controls are off and all six reseller slots/new send tables are empty. All six workflows passed at `b40f031`, including 63 native cases per PostgreSQL version and 24 actual SQL/handler cases. Source remains staged in PR #33. See `docs/paid-renewal-send-guard.md` and its installation report.
- A claim always denies dispatch authority. Reviewed provider timing policy, executable transport bridge, completion/reconciliation/release, credential delivery, administrative UI and coordinated release remain open. No real payment, provider operation, email or credit spend is enabled.

# Installed paid-renewal quote approval prerequisite — October 25, 2026

- The administrator verification endpoint now returns an exact package/credit quote and can save one immutable quote approval for the existing paid-renewal operation. Fresh independent provider reads and current SQL ownership checks reject changed facts before saving.
- Matching retry and lost-save recovery keep the same approval ID; conflicting, expired or changed-service cases cannot widen or replace it. Approval always denies dispatch authority and cannot spend credits.
- Private migration `20261025082051` is installed with matching function bodies, private invoker permissions, RLS and immutable guard. Customer billing/service and website access digests are unchanged; receipts remain two and live requests/queues/reviews/approvals remain empty. All six workflows passed at `258ed615`, including 53 native cases on each PostgreSQL version. Source remains staged in PR #33. See `docs/paid-renewal-quote-approval.md` and its installation report.
- Execution consent, provider timing policy, dispatch/credit reservations, completion/reconciliation, credential delivery, administrative UI and coordinated release remain open. All live controls remain off.

# Installed paid-renewal review prerequisite — October 25, 2026

- The receipt path now gives an explicitly selected live renewal one immutable review identity, with same-operation retry after lost acknowledgements. Current Auth/link/service drift blocks the review without retargeting or repeating the old completed manual purchase.
- A confirmed-administrator endpoint rechecks current facts before and after documented XUI GET reads. It exposes no write method, payment credentials or provider target. Its result is a short-lived review only and always denies dispatch authority.
- Migration `20261025042823` is installed with tested function bodies, private invoker permissions, RLS and immutability guard verified. Customer service/billing and website access digests, receipts and queues are unchanged. The review table is empty and all three renewal controls remain off. Six workflows passed at `4a6a888`, including 48 native cases on each PostgreSQL version. Source remains staged in PR #33. See `docs/paid-renewal-verification.md` and its installation report.
- Durable execution/credit consent, execution-time claims and revalidation, completion/recovery, credential delivery and coordinated release remain open. No flag, real payment, provider write or credit spend is enabled.

# Installed explicit renewal-service prerequisite — October 25, 2026

- Live renewal checkout now lets the verified owner choose one linked service in a paged mobile-friendly control. The private v2 request freezes that exact CRM customer and provider identity before payment; retries cannot retarget it. Ownership/line changes at paid routing force review instead of selecting another account.
- Existing Preview/live v1 requests and immutable routes are preserved; uncertain legacy renewal attempts are retained for review rather than silently replaced. The read shares the current account API and exposes no payment history or credentials.
- Migration `20261025040332` is installed in the active Kristal Stream project. All three changed/new function bodies match tested source, while six Preview/live v1 binding bodies remain unchanged. Customer billing/access digests, one Preview request/intent, two receipts and zero live requests/queued orders/routes/alerts are preserved; all renewal controls remain off.
- All five workflows passed at `392d3a5`, including 44 native cases on each PostgreSQL version. Actual SQL/handler, endpoint, compiled-client and eight mobile/desktop interaction journeys passed. Website changes remain staged in PR #33, with no Production release or flag change. See `docs/checkout-service-selection.md` and its connected installation report.
- Live completion/recovery, credential delivery, execution-time validation and coordinated release remain open. No rollout flag or provider action is enabled.

# Installed checkout-purpose prerequisite — October 24, 2026

- Authenticated live-capable checkout now saves the selected purpose and canonical owner/plan/term/allowance before returning payment. Its separate private ledger preserves the installed Preview v1 protocol and existing attempts.
- Verified live bound sessions retain receipt-only fulfillment after admission is paused, including before their first receipt/queue exists. Actual fulfillment tests connect saved new-service and approved-renewal choices to the immutable review route without granting provider access.
- The additive live ledger is installed as migration `20261025033932` in the active Kristal Stream project. Its function-body hashes, private grants and RLS match the tested source. Existing Preview function hashes, one request/intent, customer billing/access digests and receipt/queue/routing/alert counts stayed unchanged; no live request was created.
- Local Preview/Production SQL, compiled browser-adapter and retry tests passed. Native PostgreSQL 17.6/17.11 each passed 40 cases at `1af8633`. Website code remains staged in PR #33; no Production deployment or flag enablement occurred. See `docs/live-checkout-intent.md` and `docs/verification/live-checkout-intent-install-20261024.json`.
- Explicit multiple-service selection, execution-time revalidation, live completion/recovery/credential delivery and coordinated release remain open. No live flag or provider execution is enabled.

# Installed purchase-routing foundation — October 24, 2026

- The receipt-only path now saves an immutable review destination from the verified receipt, saved authenticated purchase intent and approved CRM ownership link. Missing/ambiguous/stale evidence goes to manual review; no name/email matching grants ownership.
- Migration `20261025031536` is installed in the active Kristal Stream project. Its three function bodies match the tested source, RLS/private privileges and immutability guard are verified, and no route was seeded. Existing customer billing/access digests and receipt/queue/notification counts stayed unchanged. All renewal execution controls remain off.
- All four automated workflows passed at `6523e7e`, including 34 checks on each native PostgreSQL version (17.6 and 17.11). Local checks also cover actual fulfillment and receipt/routing/notification SQL recovery. The repository migration filename now matches the server-recorded version; SQL bytes are unchanged. See `docs/paid-order-routing.md` and `docs/verification/paid-order-routing-install-20261024.json`.
- Website integration remains in draft PR #33; Production was not redeployed or promoted. Live receipt-only admission remains off. Installed database prerequisites are not a completed live customer workflow.
- Live authenticated checkout-intent capture, an explicit selector for multiple services, current ownership revalidation at execution, live completion/credential delivery and coordinated rollout remain open. This draft does not enable payment-to-XUI automation.

# Installed paid-workflow checkpoint — October 24, 2026

- Installed the private pending-notification and payment-activation rollback foundation as migration `20261025024637` in the active Kristal Stream project only.
- Deployed `ks-order-notification` version 3, retaining JWT checks and the exact legacy handler. No message was sent.
- Verified unchanged customer service/billing and website access, two receipts and notification records, no live queued orders or new pending alerts, and all renewal controls off.
- A saved completed 6-month/3-connection purchase at 15 credits already exists. Preserve it and its customer data; do not repeat that test.
- Live receipt-only admission remains disabled. Its flag is absent. Completing the foundation does not complete customer payment-to-XUI automation.
- Next: bind new purchases and existing-service renewals to their verified owner and intended fulfillment; complete live owner/completion/recovery and credential delivery before coordinated release or any separately scoped credit operation.

The older recovery inventory below is historical; later release and completion notes take precedence.

---

# Kristal Streams — unfinished work

Recovered October 19, 2026 (America/New_York). This list distinguishes prior
reports, repository checks, and things still requiring connected verification.
It is not a record of completed deployment or successful live payment testing.

| Item | Current evidence / status | Completion requirement |
| --- | --- | --- |
| Private Preview access | After reconnect, the correct user `djudge47-7683` and project `prj_cN2EaV7Bsg2IfTXSVCBdZuPhqdDA` are readable using the project's ID without a team selector. Its account ID matches `team_75RZhBzhVHfeQdAD6KsMxBMF`. Project environment reads/writes and private Preview redeployment work. Explicit team-slug lookups still return 403 and the team list is empty, so those alone did not establish an account mismatch. The protected-page helper separately fails with 403 at `read_protection_bypass`. | Use the verified project ID for project operations. The user can access the protected Preview in their own browser and completed website sign-in. Remote protected-browser verification remains open. Preserve deployment protection and do not keep resending phone challenges. |
| Website login return and failed-request handling | Draft PR #13 on `codex/fix-login-return-20261020`, source commit `9145826e9819e389f7428812b721af992c85b38a`. Build, focused lint, isolated routing and seven real-handler/double tests pass; no new TypeScript diagnostics. The matching private Preview was Ready; the user subsequently completed an actual website-account sign-in. | Actual Preview sign-out → protected `/admin/roomba` → website Sign In → automatic return to Roomba connection passed. This patch does not repair Google/Vercel verification. |
| Admin navigation / Sign Out visibility | Draft #14 now gives Admin a labeled top Sign Out action, bounds the sidebar/main area to the viewport and keeps the menu footer reachable. Collapsed navigation gets accessible labels/tooltips; mobile also retains Sign Out in the drawer. Four isolated Chromium viewport checks, the production build, focused lint and existing login checks pass; the same 45 TypeScript baseline diagnostics remain. | Complete for the updated private Preview: Donald confirmed the top-right Sign Out was available and reported that clicking it worked after being asked to check the homepage return, October 20 at 2:07 AM America/New_York. Authentication behavior itself is unchanged; this is not production promotion or separate phone/device verification. |
| Roomba connection and package mapping | A fresh private Preview check succeeded through Fixie at October 19, 2026, 11:59:48 PM America/New_York. The screenshot shows 68 available reseller credits and the expected reseller account. Twenty paid combinations loaded in the earlier check. Trial: 36 hours, one connection, zero credits. | The current read-only connection check is complete; execution/setup verification remains separate. Do not reopen old endpoint troubleshooting as if the later successful check never happened. |
| Checkout intent | Draft PR #12 remains open, stacked on #11; its foundation is recorded as installed. The project had `KS_CHECKOUT_INTENT_ENABLED` but no `VITE_KS_CHECKOUT_INTENT_ENABLED`. The original sensitive server flag's value was unreadable. Both flags were explicitly paired as `true` for Preview branch `codex/fix-login-return-20261020` only; the global setting was left unchanged. Private Preview `dpl_79C8PUBx9EabWenFrWMTwUirgkFm` is Ready. The user signed in, saw all three purchase-purpose choices, selected Help with my account, and reached Stripe Sandbox for Bronze / one connection / $20. Read-only SQL confirmed one test request and one atomically captured matching owner/purpose intent. Browser Back and retry reused the same session fingerprint and kept one request, zero payment receipts and zero provider attempts. | Checkout initiation and same-session retry are verified. Paid-webhook completion and duplicate-event handling remain unverified. The Stripe connector exposes only a live context, so an independent Sandbox session read was unavailable. Do not charge a real card or create a provider line. |
| Controlled trial draft and saved-attempt guard | Fresh package loading and browser draft review passed: Trial package 1, 36 hours, one connection, zero credits, 107 channel groups. Checking trial details returned the existing-attempt guard. Saved status and read-only SQL agree: exactly one succeeded historical trial, `ks_preview_test`, line 3290515, recorded October 17; saved expiry October 18, 2026 at 1:53:37 PM America/New_York. The new draft did not create a line. | The durable guard and historical status retrieval are verified. The existing expiry is historical saved data, not a fresh provider-status check. Do not reset the durable slot or create another trial as a workaround. CRM linkage is now verified by the browser and read-only SQL: the historical trial appears as expired, with no charge, no payment due and one allowed connection. Current provider state and playback remain separate checks. |
| Production payment-only entitlement correction | A separate disabled draft on `codex/live-receipt-rollout-20261020` now coordinates the opt-in recorder, owner status, pending support-alert protocol and a proposed rollback guard. See `scripts/ks-live-receipt-rollout-readme.md`. The running production legacy recorder has not been replaced. | The CLI-generated combined pending-alert/rollback-guard migration passed 18 disposable native checks on each of PostgreSQL 17.6 and 17.11 in Actions run 39371053392. Read-only checks of its three connected tables, four function bodies/private permissions and queue trigger passed; no connected DDL was executed. Keep the rollout flag off. Review/install the new migration as part of a coordinated release, finish live completion/ownership/renewal/recovery and completed-queue notification handling, then perform connected release verification before any separately approved promotion. Do not mark the production issue fixed from local tests. |
| Automatic setup and trial upgrade / renewal | Signed handoff work remains an isolated rehearsal. Draft PR #14 now passes 48 native signed-handoff cases and 17 worker recovery/status cases on each of PostgreSQL 17.6 and 17.11. The native-tested worker also fixes equivalent-expiry formatting recovery. General activation remains disabled; trial conversion/renewal behavior remains separately unverified. | Finish reviewed ownership/execution/completion handling and provider-documented conversion rules. Preserve existing logins. Obtain explicit approval for any specific real-credit operation. |
| Existing Stripe event duplicate verification | Prior request: replay the existing successful $20 Bronze test event once and verify no second order or setup email. No completed replay is recorded; the user previously declined Dashboard resend. | Use an available authorized supported replay path, without a new payment or client line. Keep this open until duplicate-order and duplicate-notification evidence exists. Do not infer that the earlier Dashboard refusal has been reversed. |
| Vercel deployment-storage meter | Donald read the current Usage page on October 20 at 2:16 AM America/New_York and reported 3.51 GB, down from the earlier 8.39 GB display. Recent Previews are Ready. | Current-meter follow-up is complete, based on the user-reported dashboard amount. No additional deployment deletion was needed or performed. |
| Android first-play audio | Resolved for Donald’s Celero3 5G+ and Bluetooth earbud in repeated user tests, reported October 20 at 3:00 AM America/New_York. Turning Android **Disable absolute volume ON**, then disconnecting/reconnecting the earbud, allowed movie and series audio to start without physical volume buttons. Logging out and back in repeatedly also passed. OpenSL ES remains OFF after its unsuccessful test. | Keep these working settings. This is a device-setting resolution with user-reported verification, not a patched APK or proof for all devices. The exact inspected APK remains `2026101901`, `9.5.6-live-focus-fix`, package `com.gearzoneiptv.gearzoneiptviptvbox`. Later Onn navigation, playback and user-selection resume checks passed as recorded below; separate credential-clearing logout remains unverified. |
| Android Movies/login and user selection on Onn | Donald reports the app is already installed on the Onn. Movies opens its list, and both a movie and a Series episode play with picture and sound. The photographed home screen has approved KS artwork and a two-person icon at the far upper-right. Selecting it opens Add Users; the screen stays there without selecting an account and returns to Add Users after the requested Onn Home/reopen test. | The exercised navigation, playback and account-selection resume checks passed in user tests. This was switching users, not a verified credential-clearing Log Out command. No separate Log Out control or exact installed APK filename/version was verified. No force-stop/reboot test, account deletion or data clear was performed. |
| macOS DMG design deliverable | Requested shell/header/inner artwork matching the approved APK, including Live TV, Movies and Series. No verified final DMG delivery was recovered. | Resolve the actual source DMG and approved artwork, preserve inner workings, build/inspect the macOS package and deliver the DMG. Do not label an APK or ZIP as the requested DMG. |

## Working rules

- Make source edits directly; do not ask Donald to manually edit source files.
- Keep one clear next action for any unavoidable user handoff.
- A code patch, simulated test, successful payment, and verified streaming setup
  are separate states. Record the actual evidence before closing an item.
- No new live line, credit spend, live charge, production promotion, widened
  visibility, or customer email is authorized by this recovery/fix pass.
- This branch is based on PR #12 head `0ea797fbc810245a2daa82d8a93e4b1ee176f02d`.
  Earlier screenshot commit `17164fd` is not the current PR head.

## Connected recovery checkpoint

- Verified user ID: `FVqixZaDGgvQDmWUHYf9QD13`; its default team matches the
  intended project's account ID. The observed failures are operation-specific.
- The protected-page helper fails reading deployment aliases. Do not report that
  all project/deployment access is unavailable, or that reconnect definitively
  restored every permission.
- Paired flag IDs: client `joGTFZmBY63iIn52`, server `A4t0U7vB6zqA4XgP`.
  Both are non-secret boolean configuration scoped to Preview and the PR #13
  branch. Production was not changed. General provider activation was not enabled.
- Redeployment `dpl_79C8PUBx9EabWenFrWMTwUirgkFm` uses reviewed source commit
  `9145826e9819e389f7428812b721af992c85b38a`, project ID above and Preview
  (`target: null`); terminal status was verified Ready. The user tested the immutable URL
  `https://kristalstreams-15gscpjef-djudge47-7683s-projects.vercel.app`.

## Actual Preview login and reseller verification

- The user opened Admin while signed in and supplied a screenshot of the
  Kristal Streams Command Center.
- The user then signed out, confirmed the homepage, opened `/admin/roomba`,
  reached Sign In, and signed in with the website account. The next screenshot
  showed Roomba connection, verifying the requested protected-page return.
- Selecting Check connection returned Connected to Roomba, verified through
  Fixie, with 68 available credits at October 19, 2026, 11:59:48 PM
  America/New_York. This was a read-only account check, not line creation.
- Finding Sign Out required scrolling to the page bottom on the long Admin
  dashboard. Keep navigation usability follow-up visible; do not confuse it
  with a failed sign-out or sign-in return.

## CRM verification — October 20, 2026 (America/New_York)

- The historical `ks_preview_test` record exists exactly once in the scoped
  read-only query; the new draft username has no CRM record.
- Browser search showed the correct line ID, Trial · 36 hours, expired,
  no charge, no payment due, October 18 expiry and zero of one connections.
- The stored account_status remains historical `active`; the CRM correctly
  derives the displayed expiration from the saved expiry. This is not a fresh
  provider/account playback check. No customer record was changed.

## Current trial draft and historical saved status

- Loading packages and preparing the new `ks_draft_check_20261020` review
  showed package 1, Trial, 36 hours, one connection, zero credits and 107 groups.
  Proposed credentials stayed in page memory; no creation action was taken.
- Check trial details returned the existing-attempt conflict. Check saved trial
  status displayed the earlier `ks_preview_test` trial, line 3290515.
- Read-only SQL confirmed exactly one saved attempt in the trial table, state
  `succeeded`, last updated October 17, 2026 at 05:53:37 UTC, with saved expiry
  October 18, 2026 at 17:53:37 UTC (1:53:37 PM America/New_York).
- This corrects any implication that no provider trial has ever existed: an
  earlier recorded trial exists. This recovery pass created no new line.
- The review endpoint rejects an occupied durable slot before any creation.
  An expired recorded trial does not authorize clearing that slot or retrying
  creation. Saved status is not a fresh read of the provider line.

## Actual Preview checkout evidence — October 19, 2026 (America/New_York)

- Signed-in checkout: Bronze, one connection, thirty days, USD 20.00,
  `kind=requires_review`, `livemode=false`, `source=authenticated_checkout`.
- SQL confirmed matching owner and purpose, `new_service_attested=false`, and
  the intent timestamp equal to the request's bound timestamp.
- After browser Back and resubmission of the same choice, SQL confirmed the same
  session fingerprint and exactly one request. Payment receipts and provider
  provisioning attempts both remained zero. No payment was submitted.
- The Stripe Link screen explicitly states that no code is sent in Sandbox.
  This screen is not evidence of a failed real phone-code delivery.
- This verifies initiation/retry only; it does not close the existing successful
  event replay, duplicate-notification or streaming setup checks.

## Checks for this login patch

```sh
node scripts/test-ks-login-destination.mjs
node scripts/test-ks-login-flow.mjs
npm run build
```

The routing checks reject external/malformed destinations. The isolated handler
checks execute the actual Login handlers against Auth/router doubles: successful
Admin/Free Trial returns, returned credential errors, rejected requests, missing
sessions/configuration, and reset-request failure. They are not evidence of a
live Supabase login, a deployed Vercel session, or Android playback.

The full TypeScript check has 45 existing diagnostics on the PR #12 baseline;
the login patch must add none. Do not call the repository type-clean.

## Native receipt database checkpoint — October 20, 2026

- Draft PR #14 now contains a bounded native PostgreSQL workflow and twelve
  independent-session tests. Actions run 39370096443 succeeded on PostgreSQL
  17.11 for source `5ed9d589801334a1ffa80d1e39ebe8244e5257bd`.
- Verified actual lock waits, duplicate/rollback/timeout recovery, immutable alert
  preparation and delivery acknowledgement, legacy activation rollback, private
  grants and unchanged customer profiles. Provider attempts/dispatches/claims
  and spent units remained zero in the fictional database.
- GitHub artifact digest, server version, success count and SQL-source hashes
  were independently checked. The retained report is
  `docs/verification/receipt-native-20261020.json`.
- This closes the bounded receipt/alert native contention check, not complete
  worker/completion contention, actual provider operation, connected Supabase
  migration compatibility or a live release. The rollout flag is still absent;
  no database migration, provider call, charge or email was made.

## Receipt migration compatibility checkpoint — October 20, 2026

- The CLI generated `20261020044005_add_live_receipt_pending_alerts_and_rollback_guard.sql`; it installs both new sections atomically, uses bounded lock/statement timeouts, locks receipt before queue, and rejects reviewed dependency or permission drift. It never recreates the installed foundation.
- At 04:43:37 UTC, read-only connected checks passed for three tables, four function bodies/configuration/private permissions and the enabled queue guard. The connected server is PostgreSQL 17.6; new objects remain absent. Historical CRLF in the old recorder matches source after line-ending normalization. Captured constraints/columns and advisor findings are retained in `docs/verification/receipt-migration-connected-20261020.json`.
- The exact migration passed all 18 tests on each of PostgreSQL 17.6 and 17.11 in Actions run 39371053392, source `8d0d4ae34335c1a5bdba659ccc2ceab8d5f91e8d`. New cases cover column/function/permission drift, atomic lock-timeout failure, an in-flight payment writer finishing during installation, and reapplication rejection. The prior twelve receipt/alert contention cases also passed.
- Artifact digests, source commit, actual server versions, success counts and SQL hashes were checked and retained in `docs/verification/receipt-migration-native-170006-20261020.json` and `receipt-migration-native-170011-20261020.json`.
- This completes the bounded connected catalog/dependency check and migration preparation, not connected DDL execution, full Supabase lifecycle equivalence, broader worker/completion contention or production release. No connected migration, charge, email, provider write or credit spend occurred. The live rollout remains disabled.

## Existing worker recovery checkpoint — October 20, 2026

- Native recovery reproduced `saved_provider_result_changed` after a lost provider-result acknowledgement because PostgreSQL's `+00:00` and the provider's `Z` represented the same expiry instant. The source worker now compares instants; changed/invalid expiry and different line identity remain rejected. No second provider creation is used for recovery.
- Two new regressions plus existing guarded-worker, reviewed-completion adapter and bounded control checks passed: 24 + 9 + 19 = 52 local checks. Focused JavaScript lint passed; the Vite build passed in 9.68 seconds.
- Actions run 39374779188 passed fifteen native cases on each of PostgreSQL 17.6 and 17.11 for source `770c9291774a4cf2fe4a5dcc057844e77823fa53`, tree `46c4b6046da1c218faf1cd7587e32473db30d7b2`. Actual worker/store methods run against native SQL with fictional Auth, payment and provider transports. SQL-only cross-owner races observe real locks and preserve the installed exclusion guard.
- Lost begin/verified/completion replies, uncertain creation, failure after CRM writes, concurrent executors, begin/completion commit/rollback races, uncommitted cross-protocol contention and browser denials were checked. Completed cases keep one CRM/fulfillment/encrypted owner binding, unchanged profiles and no receipt activation; ambiguous cases stay stopped.
- ZIP digests, tested source, actual server versions, all fifteen results, execution-source hashes and eight foundation SQL hashes were independently verified. Retained reports: `docs/verification/paid-recovery-native-170006-20261020.json` and `paid-recovery-native-170011-20261020.json`. See `scripts/ks-paid-recovery-native-readme.md`. The receipt/migration suite also passed eighteen cases on each version at this source in run 39374779204.
- This closes the bounded existing-worker recovery checks and source expiry defect, not full live lifecycle integration or deployment. Reviewed handoff integration, complete time/ownership coverage, completion-aware receipts/notifications/customer status, renewal/reconciliation and connected release verification remain open. No connected data, production setting, real provider line, charge, email or credit balance changed.

## Completed Preview order checkpoint — October 20, 2026

- Completed Preview queues now require independently matched fulfillment, receipt, credentials-ready attempt, CRM and owner-login bindings. The owner API keeps confirmed/expired orders visible, selects no credentials and classifies expiry separately from payment. Live completed queues remain review-only until a live proof/lifecycle contract exists.
- Shared fulfillment skips pending/setup email invocation on a verified completed/expired recheck. An existing completed receipt-only replay acknowledges money and returns review without a pending email or false live readiness. Frozen/ambiguous delivery history is unchanged; this does not cancel an in-flight notification or create a completion email.
- Dashboard cards show per-order state, and payment/support screens now preserve the selected order's real mode, setup state and verified expiry. Completed support entries no longer claim no streaming activation occurred; live entries no longer show false Sandbox/no-charge labels. No actual ticket was submitted.
- All 121 focused local checks passed. The final Vite build passed in 11.28 seconds; focused JS and targeted React lint pass. TypeScript retains the identical 45 baseline diagnostics. See `docs/verification/completed-status-local-20261020.json`.
- Native run 39376156622 passed seventeen cases on each of PostgreSQL 17.6 and 17.11, source `f756b1a4cb78f49c67df909db56ffaa5bfb4efad`, tree `07758988d64df713d560f22abc902e32c4312eb6`. The new cases run actual lost-reply worker completion, native proof joins, owner/browser/support/payment mapping and expiry-boundary handling without another provider creation or changed profiles.
- Both artifact digests, source/version, seventeen successes and execution/foundation hashes were independently verified; retained reports are `docs/verification/completed-status-native-170006-20261020.json` and `completed-status-native-170011-20261020.json`. The eighteen-case receipt/migration suite passed on both versions at this source in run 39376156645.
- Connected FK names and existing service SELECT/RLS permissions were checked read-only and retained in `docs/verification/completion-relationships-20261020.json`. No schema, grant, policy or Auth setting changed.
- This closes bounded completed Preview status and payment-recheck handling, not full live fulfillment, deployed provider/payment/email verification, playback, renewal/reconciliation, signed handoff integration or production rollout. The earlier Stripe event replay and other postponed items remain open.

## Native signed handoff work — October 20, 2026

- Added an isolated PostgreSQL 17.6/17.11 workflow for the actual signed rehearsal and unchanged disposable atomic-transfer prototype. It targets only the named loopback fixture database; it is not a connected migration or a real execution adapter.
- Extracted shared fictional signed fixtures/scenarios so native and PGlite exercise the same actual approval/envelope/rehearsal behavior. All forty existing local PGlite checks still pass, including lost replies, deferred failure and completion replay. With the 24 worker, 9 completion-adapter and 19 bounded-control regressions, all 92 local checks pass; see `docs/verification/signed-handoff-local-20261020.json`. Focused test-module lint, YAML parsing and whitespace checks pass. No application runtime or prototype SQL changed. The existing native worker (17) and receipt/migration (18) cases also pass on both versions at this source.
- Native run 39377445650 passed all 48 cases on each of PostgreSQL 17.6 and 17.11, source `d9cd67baaffa4aff06eced08e7d18d141972be46`, tree `fa0e1b7033aea385d29babefd20341aa1513cb76`. Cases include observed row-lock commit/rollback races, independent signed callers, actual deferred expiry, advisory-lock retention, wrong-database refusal, browser denial, isolation restriction and unchanged website entitlements. ZIP digests, tested source/version, all results, thirteen integration hashes and eight foundation hashes were independently checked and retained in `docs/verification/signed-handoff-native-170006-20261020.json` and `signed-handoff-native-170011-20261020.json`.
- This work does not enable general activation or finish the connected server authorization, full UTC/lock-order lifecycle, renewal/trial conversion, reconciliation, live completion/notification policy or release verification. The original paid/trial saved scopes remain intact.

## Admin navigation checkpoint — October 20, 2026

- The long desktop dashboard let the unconstrained sidebar stretch, placing its old Sign Out action below the initial screen. Admin now has a labeled Sign Out action in its sticky top bar on every screen size. The navigation list scrolls within the screen, with Back to Site visible at the bottom. The phone drawer retains its own Sign Out action. Collapsed links and menu controls now have accessible labels.
- Actual AdminLayout and the generated production CSS passed isolated Chromium checks at 320×568, 390×844, 1024×600 and 1366×768. Main content was scrolled 2800px; top Sign Out stayed visible, menu/footer controls remained within the viewport, no horizontal page overflow appeared, and each fictional sign-out called the unchanged handler once before reaching the fixture homepage. Small-phone and collapsed-desktop screenshots were reviewed. See `docs/verification/admin-navigation-20261020.json`.
- Build passed in 10.97 seconds, focused TSX lint and existing login routing/seven handler checks passed. App TypeScript output is byte-identical to the 45-diagnostic baseline. No dependencies or lockfiles changed. The browser fixture intercepted Auth and blocked external requests; it is not a real account sign-out or deployed private Preview check.
- No payment, provider, database, execution flag or production setting changed. The earlier phone/Vercel challenge problem and device playback work are distinct from this navigation fix.

## User-confirmed Preview sign-out — October 20, 2026

- Vercel reported private Preview `dpl_7794w6mDW8Ymrbrgcn2EtQpj6nK4` Ready for navigation-fix source `3ea83e9e2f4fe7c28c4ccbf5e1711217e2a82a27` (Preview target, not Production). Donald opened `https://kristalstreams-hzpjnlncv-djudge47-7683s-projects.vercel.app/admin/roomba`.
- Donald confirmed the expected top-right control, was asked to click Sign Out and check the homepage return, then replied “worked” at 2:07 AM America/New_York. This is user-reported real-browser confirmation, separate from the four isolated Chromium layouts. The Admin Sign Out visibility/browser check is complete for this Preview.
- Source/runtime is unchanged by this evidence update. It does not close phone/Vercel challenge delivery, Android logout/playback, payment replay or any live activation/release item.

## Android audio investigation checkpoint — October 20, 2026

- Recovered and inspected the saved `KristalStreams-2026101901-LAUNCH-ICON-20261019-115436-08d84cff.apk` (82,422,906 bytes; SHA-256 `d75db8f9c899400b9bd5ea60add3db1f0d5c57b4485734e5794a6107051e02ad`) and the corresponding launcher-fix package. Inspection stayed offline; no app service was contacted and no signing key was requested or changed.
- Donald selected Bluetooth earbud as the affected output. Static DEX inspection found the built-in movie (`NSTIJKPlayerVOD.w1`) and episode (`NSTIJKPlayerEpisodes.E1`) paths already request `STREAM_MUSIC` and use that stream for the media player. This does not prove the selected on-device player, successful focus/route acquisition, or a cause for first-play silence.
- Initial inspection did not establish a source defect. Subsequent on-device tests below resolved the reported symptom with Android Bluetooth volume settings; no APK patch, install, uninstall, data clear or provider operation occurred.

## User-confirmed Bluetooth audio resolution — October 20, 2026

- Device: Donald reported a Celero3 5G+ with a Bluetooth earbud. One physical Volume Down press restored the initially silent Kristal Streams movie. YouTube started sound normally on the same earbud; starting Kristal Streams after pausing YouTube still gave no sound. These observations narrowed the affected behavior but did not prove an APK defect.
- Existing app settings: Hardware Decoder, buffer limit 20, OpenGL OFF. OpenSL ES was enabled and saved for one fresh-start test; it did not fix the problem, and Donald restored it OFF and saved.
- Android **Disable absolute volume** was initially OFF. Donald turned it ON and disconnected/reconnected the earbud, then was asked to close/reopen Kristal Streams and play without touching the volume buttons.
- At 3:00:35 AM America/New_York, Donald reported that both movies and series now worked and that he tested several times by logging out and back in. Close this symptom for this phone/earbud combination with Disable absolute volume ON and OpenSL ES OFF. Reopen if it recurs or another output/device is affected.
- This is user-reported device verification and a working Bluetooth volume-setting change. No device logs, independently automated playback test or modified APK establish a universal root cause/fix. Other Android account/Onn issues and the macOS deliverable remain separate. Android’s documented setting: https://source.android.com/docs/core/connect/bluetooth/services .

## Corrected APK selection checkpoint — October 20, 2026

- The earlier inspected launcher-only `2026101901` APK must not be described as the latest or as proven to be the app currently installed on either device. Donald’s Windows screenshot showed later `2026101902-APPROVED-ARTWORK` outputs; he correctly noted additional work followed those builds.
- Donald supplied `KristalStreams-Approved-Visuals-Restored (1).zip` (SHA-256 `8aeb485fa4b46d1de6f9b1a1dc29260df35ad44a603ef00d2dec9e8c8b0305d7`). Its README, audit, patch manifest, launcher and complete PowerShell builder were inspected directly. The package builds `KristalStreams-2026101903-WORKING-BASE-<timestamp>-<suffix>.apk` with a matching `.verification.json`.
- That builder requires the working source family ending `20261018-222243-73cd6be2 (1).apk`, source versionCode `2026101901`, package `com.gearzoneiptv.gearzoneiptviptvbox`, and the existing matching signing key. It retains the source player code, native audio libraries and packaged defaults, applies 22 approved internal images plus five launcher images, and changes only the manifest versionCode to `2026101903`. Runtime preservation is enforced by the builder’s source/output payload and signature checks; no output report has yet been inspected here.
- The first observed run failed before the builder started because START.cmd was launched inside WinRAR’s temporary extraction folder and its PowerShell companion was absent. Donald subsequently confirmed extraction and was asked to run START.cmd from the extracted folder. Later he stated that the app was already installed on the Onn. No exact new SUCCESS filename, verification report or installed version was supplied, so do not manufacture them or attribute device tests to an unverified build.

## User-confirmed Onn playback and account-selection checks — October 20, 2026

- Donald stated that he had already installed the app on the Onn. In guided checks, Movies opened normally, a selected movie had picture and sound, and a Series episode also had picture and sound. The former Movies-to-login symptom did not occur in this exercised flow.
- Donald found no Log Out button. His photo showed the KS home screen, approved Live TV/Movies/Series artwork, and a two-person control immediately to the right of the settings gear. He selected that control and reported Add Users.
- Asked to leave that screen without choosing anything, Donald reported that it stayed there. Asked to return to the Onn home screen and reopen Kristal Streams, he again reported Add Users. The automatic return into the saved account did not occur in this account-selection/resume test.
- These are user-reported on-device results. Do not label the two-person control a verified explicit logout, claim credentials were cleared, or infer a cold process/reboot test from a Home/reopen test. No saved account was removed. Installed filename/version remains unverified; the screenshot confirms the visible artwork only.
