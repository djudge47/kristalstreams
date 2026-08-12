# Kristal Streams Android Player

This folder is the shared handoff point for the Kristal Streams Android player while the phone/cloud workflow is being established.

## Current Android development branch

`android-dev`

## Current source package

Upload the current Android project ZIP here with this exact repository path/name:

`android/KristalStreams-source.zip`

The GitHub Actions workflow at `.github/workflows/android-apk.yml` automatically extracts that ZIP and builds the debug APK in GitHub's cloud runner.

## Phone workflow

1. Work from the `android-dev` branch.
2. Upload/replace `android/KristalStreams-source.zip` when the Android source changes.
3. GitHub Actions builds the APK automatically.
4. Download the `KristalStreams-R4-APK` artifact from the completed workflow run.
5. Install and test the APK on Android.

## Windows workflow

When Windows is available, use the same `android-dev` branch as the source of truth. The project ZIP can be extracted and opened in Android Studio. Once the full source tree is migrated into the repository, both Windows and phone/cloud work will use the same checked-in source files directly.

Do not work from an older R2/R3 ZIP after R4 has been accepted as the current source.
