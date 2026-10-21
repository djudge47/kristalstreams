# Visible Android logout update

The legacy app binds a logout button and confirmation dialog in
`AccountInfoActivity`, but its containing action row is hidden in all eight
account layouts. This update reveals that row and labels the button `Log Out`.
The single-person icon on Home opens this screen.

The existing confirmation handler calls `f.e.a.h.i.d.P(Context)`. Replace that
method within its original 442-byte allocation: clear both active-login
preference stores, preserve the EPG shift, turn off remember-login, and open
the system Home screen using `ACTION_MAIN`, `CATEGORY_HOME` and `NEW_TASK`.
Call `Activity.finishAffinity()` to finish the app's activity stack. Never set
`CLEAR_TASK` on the launcher intent. Reject a non-Activity context before any
preference changes; the existing account confirmation passes its Activity.
Failed preference commits
show the existing error toast and do not navigate. Saved-user SQLite rows,
player preferences and all other methods are untouched. Cancel uses the
existing unchanged dialog handler.

## Build

```sh
python3 android/logout-update/make_patch.py public/downloads/KristalStreams.apk android/logout-update/patch.json
python3 android/logout-update/package_update.py /tmp/KristalStreams-Log-Out-Onn-Home-Update.zip
```

The repository APK is an analysis fixture, not the distributed application.
`START.cmd` embeds all required patch data and PowerShell. It runs against the
user's current version 2026101902, 2026101903 or 2026102001 APK on Windows. It
requires that computer's existing Android SDK and matching signing key. No
APK, credentials or signing key are included in the package.

The builder rejects unreviewed DEX/layout hashes and verifies package,
certificate, output checksums, alignment and every APK payload. Only the DEX,
manifest versionCode and eight layouts are replaced (layouts are already
identical when upgrading 2026102001). It signs version 2026102002,
keeps the input untouched and writes an APK plus verification JSON to Downloads.
No device reset, uninstall, provider request or connected database change is
performed. A different current source must be reviewed rather than replaced
with an older APK.

## Validation

```sh
PYTHONPATH=/tmp/ks-logout-python python3 -m unittest discover -s android/logout-update/tests -v
pwsh -NoProfile -File android/logout-update/tests/verify-builder.ps1 -SourceApk public/downloads/KristalStreams.apk -OutputDirectory /tmp/ks-logout-verified
```

Tests execute emitted Dalvik instructions against Android boundary doubles,
cover both login modes, commit failures, null/non-Activity contexts, Home intent
selection and task finishing, check DEX checksums
and byte boundaries, independently parse all layouts with Androguard 4.1.3,
and round-trip the self-contained launcher. PowerShell checks its real DEX
patch against the Python hash and verifies manifest integer changes, input
rejection, both accepted DEX variants and every payload after a real .NET ZIP update.

The old DEX has no method reference for the public `Intent.addCategory` API.
Use its existing reflection method references to invoke that API with a local
char-array constant for `android.intent.category.HOME`. This keeps every other
method ID, string, code byte and offset unchanged. `previous_logout.json`
records the exact reviewed first-update DEX and method bytes for migration.

The unsigned test APK is temporary and must not be distributed. Final signing
requires the user's matching private key. Actual Onn testing is pending:
confirm logout reaches Onn Home; check Back and a cold restart cannot restore the old session;
select a saved user and sign in again; check Cancel leaves the session active.
These tests do not claim the Android app was executed on a device here.
