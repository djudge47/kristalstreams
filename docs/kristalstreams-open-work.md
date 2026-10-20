# Kristal Streams — unfinished work

Recovered October 19, 2026 (America/New_York). This list distinguishes prior
reports, repository checks, and things still requiring connected verification.
It is not a record of completed deployment or successful live payment testing.

| Item | Current evidence / status | Completion requirement |
| --- | --- | --- |
| Private Preview access | After reconnect, the correct user `djudge47-7683` and project `prj_cN2EaV7Bsg2IfTXSVCBdZuPhqdDA` are readable using the project's ID without a team selector. Its account ID matches `team_75RZhBzhVHfeQdAD6KsMxBMF`. Project environment reads/writes and private Preview redeployment work. Explicit team-slug lookups still return 403 and the team list is empty, so those alone did not establish an account mismatch. The protected-page helper separately fails with 403 at `read_protection_bypass`. | Use the verified project ID for project operations. The user can access the protected Preview in their own browser and completed website sign-in. Remote protected-browser verification remains open. Preserve deployment protection and do not keep resending phone challenges. |
| Website login return and failed-request handling | Draft PR #13 on `codex/fix-login-return-20261020`, source commit `9145826e9819e389f7428812b721af992c85b38a`. Build, focused lint, isolated routing and seven real-handler/double tests pass; no new TypeScript diagnostics. The matching private Preview was Ready; the user subsequently completed an actual website-account sign-in. | Actual Preview sign-out → protected `/admin/roomba` → website Sign In → automatic return to Roomba connection passed. This patch does not repair Google/Vercel verification. |
| Roomba connection and package mapping | A fresh private Preview check succeeded through Fixie at October 19, 2026, 11:59:48 PM America/New_York. The screenshot shows 68 available reseller credits and the expected reseller account. Twenty paid combinations loaded in the earlier check. Trial: 36 hours, one connection, zero credits. | The current read-only connection check is complete; execution/setup verification remains separate. Do not reopen old endpoint troubleshooting as if the later successful check never happened. |
| Checkout intent | Draft PR #12 remains open, stacked on #11; its foundation is recorded as installed. The project had `KS_CHECKOUT_INTENT_ENABLED` but no `VITE_KS_CHECKOUT_INTENT_ENABLED`. The original sensitive server flag's value was unreadable. Both flags were explicitly paired as `true` for Preview branch `codex/fix-login-return-20261020` only; the global setting was left unchanged. Private Preview `dpl_79C8PUBx9EabWenFrWMTwUirgkFm` is Ready. The user signed in, saw all three purchase-purpose choices, selected Help with my account, and reached Stripe Sandbox for Bronze / one connection / $20. Read-only SQL confirmed one test request and one atomically captured matching owner/purpose intent. Browser Back and retry reused the same session fingerprint and kept one request, zero payment receipts and zero provider attempts. | Checkout initiation and same-session retry are verified. Paid-webhook completion and duplicate-event handling remain unverified. The Stripe connector exposes only a live context, so an independent Sandbox session read was unavailable. Do not charge a real card or create a provider line. |
| Controlled trial draft and saved-attempt guard | Fresh package loading and browser draft review passed: Trial package 1, 36 hours, one connection, zero credits, 107 channel groups. Checking trial details returned the existing-attempt guard. Saved status and read-only SQL agree: exactly one succeeded historical trial, `ks_preview_test`, line 3290515, recorded October 17; saved expiry October 18, 2026 at 1:53:37 PM America/New_York. The new draft did not create a line. | The durable guard and historical status retrieval are verified. The existing expiry is historical saved data, not a fresh provider-status check. Do not reset the durable slot or create another trial as a workaround. CRM linkage is now verified by the browser and read-only SQL: the historical trial appears as expired, with no charge, no payment due and one allowed connection. Current provider state and playback remain separate checks. |
| Production payment-only entitlement correction | A separate disabled draft on `codex/live-receipt-rollout-20261020` now coordinates the opt-in recorder, owner status, pending support-alert protocol and a proposed rollback guard. See `scripts/ks-live-receipt-rollout-readme.md`. The running production legacy recorder has not been replaced. | Twelve disposable PostgreSQL 17.11 contention checks passed in Actions run 39370096443, including real lock waits and rollback of old activation. Keep the rollout flag off. Review/install new pending-alert and rollback-guard migrations, verify connected DDL compatibility, finish live completion/ownership/renewal/recovery and completed-queue notification handling, then perform connected release verification before any separately approved promotion. Do not mark the production issue fixed from local tests. |
| Automatic setup and trial upgrade / renewal | Signed handoff work in PR #11 is an isolated rehearsal. General activation remains disabled; trial conversion/renewal behavior remains separately unverified. | Finish reviewed ownership/execution/completion handling and provider-documented conversion rules. Preserve existing logins. Obtain explicit approval for any specific real-credit operation. |
| Existing Stripe event duplicate verification | Prior request: replay the existing successful $20 Bronze test event once and verify no second order or setup email. No completed replay is recorded; the user previously declined Dashboard resend. | Use an available authorized supported replay path, without a new payment or client line. Keep this open until duplicate-order and duplicate-notification evidence exists. Do not infer that the earlier Dashboard refusal has been reversed. |
| Vercel deployment-storage meter | Old Preview deletions were completed; the last displayed usage remained 8.39 GB. Production and the selected recent Previews were retained. | Read current usage and deployments in the correct team. Do not delete more deployments merely because an old screenshot's meter did not update. |
| Android first-play audio | User reported both Movies and Series working, then associated intermittent trouble with earpiece routing on the first movie/episode. Lasting resolution is unverified. | Reproduce on the actual affected device and current APK, identify the audio-route/focus trigger, and retest first playback. Website-only changes are not proof of a native-player fix. |
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
