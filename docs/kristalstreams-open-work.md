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
| Android first-play audio | Donald confirmed the affected earpiece is a Bluetooth earbud. The exact installed `2026101901` APK and launcher-fix package were recovered; its version name is `9.5.6-live-focus-fix`, package `com.gearzoneiptv.gearzoneiptviptvbox`. The built-in IJK movie/episode startup paths request media-stream audio; static inspection has not established the cause or a fix. | Check whether a single Volume Down press restores silent first playback, distinguishing a zero-volume setting from a Bluetooth output problem. Then reproduce and retest the actual affected device/current APK. No replacement or audio patch has been made. Keep this separate from older `com.kristalstreams.player` builders and the separately reported Onn app version. |
| Android Movies/login and logout persistence | Earlier Movies navigation returned to login and logout automatically restored the account; later an added account had picture and sound. No explicit final regression result for both symptoms was recovered. | Verify account selection, Movies/Series navigation, restart and explicit logout on the current APK/Onn device. Keep separate from Vercel and website account authentication. |
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

- Recovered the exact `KristalStreams-2026101901-LAUNCH-ICON-20261019-115436-08d84cff.apk` (82,422,906 bytes; SHA-256 `d75db8f9c899400b9bd5ea60add3db1f0d5c57b4485734e5794a6107051e02ad`) and the corresponding launcher-fix package. Inspection stayed offline; no app service was contacted and no signing key was requested or changed.
- Donald selected Bluetooth earbud as the affected output. Static DEX inspection found the built-in movie (`NSTIJKPlayerVOD.w1`) and episode (`NSTIJKPlayerEpisodes.E1`) paths already request `STREAM_MUSIC` and use that stream for the media player. This does not prove the selected on-device player, successful focus/route acquisition, or a cause for first-play silence.
- No APK patch, install, uninstall, data clear, provider operation or confirmed Bluetooth fix occurred. The next simple device observation is whether Volume Down alone restores sound while the first movie is silent. Existing account and playback settings should stay intact while diagnosing.
