# Android release reconciliation and download-page guard

## Verified files — October 23, 2026

The website repository still contains the older canonical APK. The exact previously approved upload was recovered and inspected without executing or rebuilding it.

| Field | Repository APK | Approved October 19 APK |
| --- | --- | --- |
| File | public/downloads/KristalStreams.apk | KristalStreams-2026101901-LAUNCH-ICON-20261019-115436-08d84cff.apk |
| Bytes | 82,381,946 | 82,422,906 |
| SHA-256 | 6efaa7c1ffbea0334ac8df8fd3b4071b1f09b93e4a5c823ec077a1ba7de1ba19 | d75db8f9c899400b9bd5ea60add3db1f0d5c57b4485734e5794a6107051e02ad |
| Package | com.gearzoneiptv.gearzoneiptviptvbox | Same |
| versionCode | 9506 | 2026101901 |
| versionName | 9.5.6-live-focus-fix | Same |
| Declared min/target SDK | 17 / 28 | Same |
| Verified signing certificate SHA-256 | 459b8227b6f703202277cbb8aca96c33f968fbfc45b2000cf115d6d1cb6dfe57 | Same |
| Signature verification | v1/v2/v3 pass, no errors or warnings | v1/v2/v3/v4 pass with the supplied .idsig, no errors or warnings |

Both APKs were checked using Google's `com.android.tools.build:apksig:8.7.3` ApkVerifier with Java 17. The verifier JAR downloaded from Google's Maven repository has SHA-256 `c070ed1394629d74641aa0906f60b2ffa1ee77e6366a1f93437f59717b1aeb89`. The approved file was not re-signed, patched, installed or executed; only manifest/signature/public-certificate metadata and whole-file hashes were inspected. Matching package/certificate and an increased versionCode are release-identity evidence, not a successful device update or a compatibility certification.

Reference: [Android apksigner verification](https://developer.android.com/tools/apksigner), [APK signing scheme v2](https://source.android.com/docs/security/features/apksigning/v2). With existing Android SDK tooling, `apksigner verify --verbose --print-certs <apk>` reproduces the APK signature/certificate check. No private signing key is needed for verification.

## Current release limitation

The connected GitHub blob upload cannot transport this APK: base64 encoding requires 109,897,208 bytes, exceeding the runtime's 67,108,864-byte IPC frame limit. The upload failed before a blob was created. Ordinary Git push also has no configured write authentication. No credential was requested, extracted or printed, and no privileged upload workflow was introduced to work around that boundary.

The canonical repository file was restored byte-for-byte to its pre-check state and digest-checked. The approved upload and its .idsig remain separately preserved. The replacement is **not committed or published**, and production remains unchanged. Reconciliation is incomplete until the exact verified bytes can be transferred through an authenticated large-file path and the deployed download is independently checked.

The download/setup page therefore explicitly pauses its native APK download and routes customers to the real support inbox and device guides. It does not advertise 9506, relabel the old file as the newer build, list unverified compatibility/requirements or instruct customers to replace a working installation. The old binary remains preserved in the repository and can still be requested directly by its static path; this change does not block or delete it, and is not a production mitigation until released.

## ONN logout remains separate

`KristalStreams-Log-Out-Onn-Home-Update.zip` was also recovered. Its README identifies updater version `2026102002`, requires the existing Windows Android SDK and matching signing key, and describes an Account-screen Log Out button that clears the active login, opens ONN Home and preserves saved users. The archive contains START.cmd and READ-ME.txt; it is an updater, not a finished signed APK.

Only that README and archive metadata were inspected. The encoded updater was not run or treated as a verified implementation. Its statement about binary/simulated tests is the package's own documentation, not a new verification in this review. It explicitly leaves ONN Home/Back/restart/re-login checks pending. The approved `2026101901` APK predates this updater; no logout or first-play audio guarantee is inferred from it. No full Android source project, matching private key, finished post-logout APK or connected ONN/phone was accessed.

## Website shortcut behavior

Website/PWA installation remains separate from native streaming-app installation. An accepted browser prompt is now reported only as an installation request. Completion requires standalone context or the browser's appinstalled event. Duplicate prompts coalesce; dismissal, failure, completion during a pending prompt and late results after unmount have truthful states. The page does not claim website Sign Out logs out the Android TV app.

Run `node scripts/test-ks-download-page.mjs` and `npm run check`. Four actual-component offline groups cover the paused native download and real help routes, standalone/appinstalled states, duplicate/accepted prompts, dismissal/error handling, completion ordering and listener/unmount cleanup. Fetch and connected-client imports are blocked; all browser events are fictional. Application quality CI runs the suite with existing regressions. These tests do not install an app or certify a device.
