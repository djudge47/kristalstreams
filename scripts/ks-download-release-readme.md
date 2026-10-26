# Artwork recovery test — October 26, 2026

The owner reported very slow channel logos and movie/series posters after build 2026102601, on both Cube and phone. Missing-image symptoms remain unresolved. Static file equality is not evidence that runtime artwork delivery works.

The owner-built 2026102602 rollback restores every APK payload to the pre-black-tile 2026102001 release except the manifest versionCode (raised for an in-place update). APK v2 RSA/SHA256 signature and complete content digest verified; original signer retained. All artwork, code, libraries, resources and permissions match the previous APK, with only the manifest version integer different. Size 84,593,786 bytes, SHA256 `52d1094ef9a57f8dec4651eefc83c66d399a7a3ab8628713b74bb16abebbe436`.

Expose the exact supplied signed rollback at `/downloads/KristalStreams-Restore.apk?v=2026102602` for the owner's controlled device test. Preserve the main public download and page until runtime artwork recovery is confirmed. Native-download attachment headers and existing service-worker bypass apply. No claim is made that restoring launcher banners fixes remote artwork loading; device test remains required.

# Fire TV black home screen tile — October 26, 2026

The owner built and supplied `KristalStreams-2026102601-FIRE-TV-BLACK-20261026-094130-03380c73.apk` using the matching existing signing key. VersionCode is 2026102601; size is 84,606,074 bytes; SHA256 is `1f31d53f9e95646a2e40fc6fdf8a9f7d770826d1d605e13af6aa353de235f73d`.

Verified APK v2 RSA/SHA256 signature and the complete chunked content digest. The signer remains `459b8227b6f703202277cbb8aca96c33f968fbfc45b2000cf115d6d1cb6dfe57`. Compared with the working 2026102001 APK, only the five mipmap TV-banner density variants and the manifest version number changed. All five banners match the approved black landscape preview; all DEX code, native libraries and other artwork are byte-identical. The APK manifest banner resource resolves to these five files. Physical Fire TV appearance requires the owner to install and check the update.

The download page and exact-release packaging now select 2026102601. The attachment route and service worker download bypass are preserved, and website cache names advance to v7. Release packaging reconstructs the exact owner-supplied signed file relative to the unchanged build-9506 source asset. The historical notes below describe previous releases, not the current downloadable APK.

# Android release reconciliation and download-page guard

## Downloader button compatibility — October 26, 2026

Donald confirmed that build 2026102001 downloads by direct URL, installs and
works on his Fire TV Cube, while the page button still fails in Downloader.
The button now uses ordinary navigation to that same APK instead of HTML's
`download` attribute. The static file response explicitly sets attachment
disposition and the Android package MIME type before filesystem routing.
The service worker bypasses `/downloads/` entirely, so native installer handling
does not depend on an offline-cache response. Version-6 caches replace the old
website caches; no app data, browser login or saved users are cleared.

The actual APK is unchanged. The extended actual-component/worker tests verify
the plain link, attachment route, native-download bypass, ordinary asset fetches
and old-cache cleanup. A real-browser download test must check the click without
relying on HTML download support. Chromium emulation is not a substitute for
Donald testing Downloader on the Cube.

## Download restoration — October 26, 2026

The download page again offers **Download Android APK** at
`/downloads/KristalStreams.apk?v=2026102001`. The build emits the exact
owner-supplied 84,593,786-byte APK with SHA-256
`47e4658b604479d9fad04a1876e92de500d6f0808dc67300a20df3ac0699ccd7`.
The existing signed APK is not changed or re-signed. Device-install and Fire TV
compatibility claims are not inferred from file identity.

To retain a reproducible release without another full APK in repository history,
`scripts/releases/KristalStreams-2026102001.release.b64` losslessly represents
the supplied file relative to the preserved build-9506 binary. The Node-only
packager copies unchanged byte ranges, restores literal bytes and applies byte
differences; it never executes APK contents, calls a network service or changes
ZIP compression/signatures. Both source and final whole-file hashes are pinned.
Vite emits the verified APK over the old public asset during every build.
`test-ks-android-release.mjs --built` checks the actual distribution output;
corrupt inputs fail rather than silently publishing the older file. CI runs
that identity check after the normal production build and retains download-page
and website-shortcut regression tests.

This replaces the earlier temporary unavailable notice below. The source copy
under `public/downloads` remains the build input; the downloadable distribution
file is the verified newer release. No purchase, provider or activation setting
is part of this repair.

## Latest owner-supplied APK — October 23, 2026

Donald supplied `KristalStreams-2026102001-LOGOUT-20261020-230208-623af99c.apk` and explicitly identified it as the latest. This actual finished APK supersedes the earlier attempt to infer the latest release from 1901/1903 builder history. It is preserved as supplied and was not installed, patched, re-signed or published.

| Verified field | Latest owner-supplied file |
| --- | --- |
| Bytes | 84,593,786 |
| SHA-256 | 47e4658b604479d9fad04a1876e92de500d6f0808dc67300a20df3ac0699ccd7 |
| Package | com.gearzoneiptv.gearzoneiptviptvbox |
| versionCode | 2026102001 |
| versionName | 9.5.6-live-focus-fix |
| Declared min/target SDK | 17 / 28 |
| Signing certificate SHA-256 | 459b8227b6f703202277cbb8aca96c33f968fbfc45b2000cf115d6d1cb6dfe57 |
| Signature verification | v1/v2/v3 pass; no errors or warnings; no v4 sidecar supplied |

Google ApkVerifier 8.7.3 verified the actual file. Its package and certificate match the preserved repository APK, and its versionCode is greater. This establishes release identity and signature integrity; it does not certify installation, playback or logout behavior. A narrow allowlisted DEX string check found `Logout` and `android.intent.action.MAIN`; string presence alone proves no control flow. The supplied build is 2026102001, not the separate 2026102002 ONN-home updater described below. ONN-home logout, saved users, re-entry and first-play audio still require device verification. The older WORKING-BASE report is not required merely to identify this uploaded latest file.

## Earlier verified files — October 23, 2026

The website repository still contains build 9506. An older October 19 candidate was recovered and inspected without executing or rebuilding it. Donald has explicitly confirmed that this candidate is NOT the last good APK; signature validity does not establish release approval.

| Field | Repository APK | Older October 19 candidate — not the last good APK |
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

Both APKs were checked using Google's `com.android.tools.build:apksig:8.7.3` ApkVerifier with Java 17. The verifier JAR downloaded from Google's Maven repository has SHA-256 `c070ed1394629d74641aa0906f60b2ffa1ee77e6366a1f93437f59717b1aeb89`. The older candidate was not re-signed, patched, installed or executed; only manifest/signature/public-certificate metadata and whole-file hashes were inspected. Matching package/certificate and an increased versionCode are release-identity evidence, not a successful device update or a compatibility certification.

Reference: [Android apksigner verification](https://developer.android.com/tools/apksigner), [APK signing scheme v2](https://source.android.com/docs/security/features/apksigning/v2). With existing Android SDK tooling, `apksigner verify --verbose --print-certs <apk>` reproduces the APK signature/certificate check. No private signing key is needed for verification.

## Later release chain — user correction

Donald corrected the release identification: the recovered October 19 `2026101901` file is not the last good APK. The later `KristalStreams-Approved-Visuals-Restored.zip` was recovered and its README, AUDIT.txt and allowlisted patch metadata inspected. That package explicitly rejects the October 19 APK and requires the exact working source:

`KristalStreams-2026101901-LAUNCH-ICON-20261018-222243-73cd6be2 (1).apk`

Its intended output begins `KristalStreams-2026101903-WORKING-BASE-` and has versionCode `2026101903`. It preserves that source's player/audio payload and applies the approved artwork. Its own documentation says the exact October 18 source had not been received by the assistant and that a `.verification.json` beside the output records source/output hashes. These are builder-documentation claims, not new verification of the finished APK.

Earlier context also identifies an intermediate `2026101902-APPROVED-ARTWORK` build. A larger version number, a matching signer or an updater filename is insufficient to select the user's last-good installed release. The exact working October 18 input, WORKING-BASE output and its verification report remain unavailable as historical provenance. Donald has now supplied the later finished 2026102001 APK above, resolving identification of his latest file without requiring that older report. Do not substitute the rejected October 19 candidate or the separate `com.kristalstreams.player` restore APK. Installed-device identity and runtime checks remain outstanding.

## Current release limitation

An attempted connected GitHub blob upload of the older candidate could not transport that file: base64 encoding requires 109,897,208 bytes, exceeding the runtime's 67,108,864-byte IPC frame limit. The upload failed before a blob was created. Ordinary Git push also has no configured write authentication. No credential was retrieved or printed, and no privileged upload workflow was introduced to work around that boundary.

The canonical repository file was restored byte-for-byte to its pre-check state and digest-checked. The recovered candidate and its .idsig remain separately preserved. No replacement is committed or published, and production remains unchanged. The owner-supplied latest 2026102001 file is now identified and signature-verified. Its 84,593,786 bytes would also exceed the same base64 transport limit; no upload of that file was attempted. An authenticated large-file publishing path and deployed-byte verification remain outstanding; the failed transfer is no reason to select an older APK.

The download/setup page therefore explicitly pauses its native APK download and routes customers to the real support inbox and device guides. It does not advertise 9506, relabel the old file as the newer build, list unverified compatibility/requirements or instruct customers to replace a working installation. The old binary remains preserved in the repository and can still be requested directly by its static path; this change does not block or delete it, and is not a production mitigation until released.

## ONN logout remains separate

`KristalStreams-Log-Out-Onn-Home-Update.zip` was also recovered. Its README identifies updater version `2026102002`, requires the existing Windows Android SDK and matching signing key, and describes an Account-screen Log Out button that clears the active login, opens ONN Home and preserves saved users. The archive contains START.cmd and READ-ME.txt; it is an updater, not a finished signed APK.

Only that README and archive metadata were inspected. The encoded updater was not run or treated as a verified implementation. Its statement about binary/simulated tests is the package's own documentation, not a new verification in this review. It explicitly leaves ONN Home/Back/restart/re-login checks pending. The older `2026101901` candidate predates this updater and is not the last good release; no logout or first-play audio guarantee is inferred from it. A finished owner-supplied APK labeled LOGOUT, versionCode 2026102001, is now verified above. It is not the 2026102002 updater output. No full Android source project, matching private key or connected ONN/phone was accessed.

## Website shortcut behavior

Website/PWA installation remains separate from native streaming-app installation. An accepted browser prompt is now reported only as an installation request. Completion requires standalone context or the browser's appinstalled event. Duplicate prompts coalesce; dismissal, failure, completion during a pending prompt and late results after unmount have truthful states. The page does not claim website Sign Out logs out the Android TV app.

Run `node scripts/test-ks-download-page.mjs` and `npm run check`. Four actual-component offline groups cover the paused native download and real help routes, standalone/appinstalled states, duplicate/accepted prompts, dismissal/error handling, completion ordering and listener/unmount cleanup. Fetch and connected-client imports are blocked; all browser events are fictional. Application quality CI runs the suite with existing regressions. These tests do not install an app or certify a device.

## Global setup reminder release — October 23, 2026

The live global InstallPrompt also advertised build 9506 and directly linked to the old APK. It now points only to `/download-app`, preserves existing-install/saved-user guidance and delegates website-shortcut requests to that reviewed page. It no longer intercepts installation events or gives native download instructions. Dismissal remains usable with blocked browser storage; its timer is cleaned up and standalone mode remains quiet. The expanded fifth offline download regression group renders this actual reminder. Native APK bytes remain unchanged.
