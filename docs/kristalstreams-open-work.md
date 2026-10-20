# Kristal Streams — unfinished work

Recovered October 19, 2026 (America/New_York). This list distinguishes prior
reports, repository checks, and things still requiring connected verification.
It is not a record of completed deployment or successful live payment testing.

| Item | Current evidence / status | Completion requirement |
| --- | --- | --- |
| Private Preview access | After reconnect, the correct user `djudge47-7683` and project `prj_cN2EaV7Bsg2IfTXSVCBdZuPhqdDA` are readable using the project's ID without a team selector. Its account ID matches `team_75RZhBzhVHfeQdAD6KsMxBMF`. Project environment reads/writes and private Preview redeployment work. Explicit team-slug lookups still return 403 and the team list is empty, so those alone did not establish an account mismatch. The protected-page helper separately fails with 403 at `read_protection_bypass`. | Use the verified project ID for project operations. Actual protected-browser and website-account verification remain open. Preserve deployment protection and do not keep resending phone challenges. |
| Website login return and failed-request handling | Draft PR #13 on `codex/fix-login-return-20261020`, source commit `9145826e9819e389f7428812b721af992c85b38a`. Build, focused lint, isolated routing and seven real-handler/double tests pass; no new TypeScript diagnostics. The matching private Preview was Ready. | Verify an actual authenticated Admin return when browser access is available. This patch does not repair Google/Vercel verification. |
| Roomba connection and package mapping | Last recorded check succeeded; twenty paid combinations loaded. Trial: 36 hours, one connection, zero credits. | Recheck current read-only state once Preview access works. Do not reopen old endpoint troubleshooting as if the later successful check never happened. |
| Checkout intent | Draft PR #12 remains open, stacked on #11; its foundation is recorded as installed. The project had `KS_CHECKOUT_INTENT_ENABLED` but no `VITE_KS_CHECKOUT_INTENT_ENABLED`. The original sensitive server flag's value was unreadable. Both flags were explicitly paired as `true` for Preview branch `codex/fix-login-return-20261020` only; the global setting was left unchanged. A private redeployment of the exact reviewed source was started with the new settings. | Verify the rebuilt client, website-account sign-in, Bronze / one connection / Checkout, and all three explicit service choices. Actual Stripe/webhook/SQL completion remains unverified. Do not charge a real card or create a provider line. |
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
  (`target: null`). Inspect its terminal status before claiming the rebuild ready.

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
