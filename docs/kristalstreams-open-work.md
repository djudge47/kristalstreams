# Kristal Streams — unfinished work

Recovered October 19, 2026 (America/New_York). This list distinguishes prior
reports, repository checks, and things still requiring connected verification.
It is not a record of completed deployment or successful live payment testing.

| Item | Current evidence / status | Completion requirement |
| --- | --- | --- |
| Private Preview access | Blocked. The Vercel connector returned 403 for `djudge47-7683s-projects`; its team list returned no teams. The cloud browser reached Google verification, but no completed Vercel session was observed. | Restore the existing Vercel connection's access to the correct team. Preserve private deployment protection. Do not keep resending phone challenges. |
| Website login return and failed-request handling | Patch on `codex/fix-login-return-20261020`. Previously Admin discarded the requested route and Login returned only to Dashboard or Free Trial. Rejected sign-in/reset promises could leave loading active. | Review isolated handler/routing checks and build; deploy the reviewed branch to the correct private Preview and verify an actual authenticated return. This patch does not repair Google/Vercel verification. |
| Roomba connection and package mapping | Last recorded check succeeded; twenty paid combinations loaded. Trial: 36 hours, one connection, zero credits. | Recheck current read-only state once Preview access works. Do not reopen old endpoint troubleshooting as if the later successful check never happened. |
| Checkout intent | Draft PR #12 remains open, stacked on #11. Its database foundation is recorded as installed. Actual client/server flag values in the intended Preview are unverified in this recovery. | Verify the deployed source and flag pairing, website account sign-in, Bronze / one connection / Checkout, and all three explicit service choices. Then perform only separately authorized sandbox Stripe/webhook testing. Do not charge a real card. |
| Production payment-only entitlement correction | Explicitly unfinished in PR #12 and the checked-in rollout notes. | Payment alone must not imply verified streaming setup. Prepare and test the coordinated recorder/customer-status/notification change before any production promotion. |
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
