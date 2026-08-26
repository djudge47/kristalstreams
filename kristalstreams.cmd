@echo off
setlocal EnableExtensions EnableDelayedExpansion
title KS Outbound Request Firewall 1682045

set "POINTER=%USERPROFILE%\.kristalstreams-working-source.txt"
set "FINAL=%USERPROFILE%\Downloads\KS-OUTBOUND-REQUEST-FIREWALL-1682045.apk"
set "LOG=%TEMP%\ks-outbound-request-firewall-1682045-build.txt"
set "JAVASAVE=%USERPROFILE%\.kristalstreams-java-home.txt"

echo.
echo ==========================================================
echo   KRISTAL STREAMS 1.6.8 - OUTBOUND REQUEST FIREWALL
echo   SAFE INCREMENTAL APK: KS-OUTBOUND-REQUEST-FIREWALL-1682045.apk
echo ==========================================================
echo.
echo Approved baseline: 1682042
echo Blocks malformed API, artwork, redirect, and playback URLs locally.
echo Prevents null, undefined, zero, JSON, and unsupported path requests.
echo Throttles provider API and artwork request bursts.
echo Suppresses duplicate artwork requests and caches failed URLs.
echo Stops requests temporarily after repeated failures, HTTP 403, or HTTP 429.
echo Removes unsafe saved Favorites and Continue Watching URLs.
echo Retries playback only for genuine network connection failures.
echo Preserves the approved EPG, playback, Movies, Series, audio, and layouts.
echo Uses the verified incremental Windows source without a clean rebuild.
echo Original known-good R2 and approved 1682042 source remain untouched.
echo.
echo IMPORTANT: Do not open builds 1682043 or 1682044.
echo.

if not exist "%POINTER%" (
    echo ERROR: The approved incremental-source pointer was not found:
    echo   %POINTER%
    echo.
    echo Run KS-WINDOWS-INCREMENTAL-SETUP-1682042.cmd first.
    pause
    exit /b 1
)

set "APPROVED="
set /p APPROVED=<"%POINTER%"
if not defined APPROVED (
    echo ERROR: The approved incremental-source pointer is empty.
    pause
    exit /b 1
)

if not exist "!APPROVED!\gradlew.bat" (
    echo ERROR: Gradle wrapper was not found in the approved source:
    echo   !APPROVED!
    pause
    exit /b 1
)
if not exist "!APPROVED!\app\src\main\java\com\kristalstreams\player\XtreamClient.kt" (
    echo ERROR: Approved network source was not found.
    pause
    exit /b 1
)
findstr /c:"versionCode = 1682042" "!APPROVED!\app\build.gradle.kts" >nul
if errorlevel 1 (
    echo ERROR: The incremental source is not the approved 1682042 baseline.
    echo No files were changed.
    pause
    exit /b 1
)

for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%T"
set "WORK=C:\ksoutboundrequestfirewall-!STAMP!"

echo [1/8] Creating an isolated incremental candidate from approved 1682042...
mkdir "!WORK!" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Could not create:
    echo   !WORK!
    pause
    exit /b 1
)

robocopy "!APPROVED!" "!WORK!" /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /NFL /NDL /NP >nul
set "RC=!ERRORLEVEL!"
if !RC! GEQ 8 (
    echo ERROR: The approved incremental source could not be copied.
    pause
    exit /b !RC!
)

echo [2/8] Installing the complete outbound request firewall...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=[IO.File]::ReadAllText('%~f0'); function B([string]$n){$a=':::BEGIN '+$n;$b=':::END '+$n;$s=$raw.IndexOf($a);if($s -lt 0){throw 'Missing '+$a};$s+=$a.Length;$e=$raw.IndexOf($b,$s);if($e -lt 0){throw 'Missing '+$b};$x=$raw.Substring($s,$e-$s)-replace '\s','';[Convert]::FromBase64String($x)}; $root='!WORK!\app\src\main\java\com\kristalstreams\player'; [IO.Directory]::CreateDirectory($root) ^| Out-Null; [IO.File]::WriteAllBytes((Join-Path $root 'OutboundUrlPolicy.kt'),(B 'POLICY')); [IO.File]::WriteAllBytes((Join-Path $root 'XtreamClient.kt'),(B 'XTREAM')); [IO.File]::WriteAllBytes((Join-Path $root 'RemoteImageLoader.kt'),(B 'IMAGELOADER')); [IO.File]::WriteAllBytes((Join-Path $root 'PlayerActivity.kt'),(B 'PLAYER')); [IO.File]::WriteAllBytes((Join-Path $root 'ContinueWatching.kt'),(B 'CONTINUE')); [IO.File]::WriteAllBytes((Join-Path $root 'Favorites.kt'),(B 'FAVORITES'))"
if errorlevel 1 (
    echo ERROR: The outbound request firewall files could not be installed.
    pause
    exit /b 1
)

echo [3/8] Assigning the new installable application version...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$p='!WORK!\app\build.gradle.kts'; $c=[IO.File]::ReadAllText($p); if(-not $c.Contains('versionCode = 1682042')){throw 'Expected approved 1682042 version was not found'}; if(-not $c.Contains('1.6.8-series-landscape-button-verify')){throw 'Expected approved version name was not found'}; $c=$c.Replace('versionCode = 1682042','versionCode = 1682045').Replace('1.6.8-series-landscape-button-verify','1.6.8-outbound-request-firewall'); [IO.File]::WriteAllText($p,$c,[Text.UTF8Encoding]::new($false))"
if errorlevel 1 (
    echo ERROR: The 1682045 application version could not be assigned safely.
    pause
    exit /b 1
)

echo [4/8] Proving that no request path bypasses the firewall...
set "VERIFYPS=%TEMP%\ks-outbound-request-firewall-1682045-verify.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=[IO.File]::ReadAllText('%~f0'); $a=':::BEGIN '+'VERIFYPS'; $b=':::END '+'VERIFYPS'; $s=$raw.IndexOf($a); if($s -lt 0){throw 'Missing verification payload'}; $s+=$a.Length; $e=$raw.IndexOf($b,$s); if($e -lt 0){throw 'Missing verification payload end'}; $x=$raw.Substring($s,$e-$s)-replace '\s',''; [IO.File]::WriteAllBytes('%VERIFYPS%',[Convert]::FromBase64String($x))"
if errorlevel 1 (
    echo ERROR: The safety verification could not be extracted.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%VERIFYPS%" -ProjectRoot "!WORK!" -ApprovedRoot "!APPROVED!"
set "RC=!ERRORLEVEL!"
del /q "%VERIFYPS%" >nul 2>&1
if not "!RC!"=="0" (
    echo ERROR: The outbound request firewall verification failed.
    echo No APK was created or installed.
    pause
    exit /b !RC!
)

echo [5/8] Preparing the existing Windows Android build tools...
set "ANDROID_SDK=%LOCALAPPDATA%\Android\Sdk"
if not exist "!ANDROID_SDK!\platforms" (
    echo ERROR: Android SDK not found:
    echo   !ANDROID_SDK!
    pause
    exit /b 1
)

set "SDK_FORWARD=!ANDROID_SDK:\=/!"
> "!WORK!\local.properties" echo sdk.dir=!SDK_FORWARD!

set "JAVA_HOME="
if exist "%JAVASAVE%" (
    set /p JAVA_HOME=<"%JAVASAVE%"
    if exist "!JAVA_HOME!\bin\java.exe" goto JAVA_READY
    set "JAVA_HOME="
)
if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
    goto JAVA_READY
)
if exist "%LOCALAPPDATA%\Programs\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=%LOCALAPPDATA%\Programs\Android Studio\jbr"
    goto JAVA_READY
)
for /d %%D in ("%ProgramFiles%\Android\Android Studio*") do (
    if not defined JAVA_HOME if exist "%%~fD\jbr\bin\java.exe" set "JAVA_HOME=%%~fD\jbr"
)
if defined JAVA_HOME if exist "!JAVA_HOME!\bin\java.exe" goto JAVA_READY

echo ERROR: Java could not be found automatically.
pause
exit /b 1

:JAVA_READY
> "%JAVASAVE%" echo !JAVA_HOME!
set "PATH=!JAVA_HOME!\bin;!PATH!"

echo [6/8] Building incrementally without clean...
echo Gradle progress will appear below.
echo.
cd /d "!WORK!"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "^& '.\gradlew.bat' assembleDebug --console=plain --stacktrace 2^>^&1 ^| Tee-Object -FilePath '%LOG%'; exit $LASTEXITCODE"
set "RC=!ERRORLEVEL!"
if not "!RC!"=="0" (
    color 4F
    echo.
    echo ==========================================================
    echo   INCREMENTAL BUILD FAILED
    echo ==========================================================
    echo.
    echo Approved 1682042 source and original R2 remain untouched.
    echo Build log:
    echo   %LOG%
    start "" notepad "%LOG%"
    pause
    exit /b !RC!
)

set "BUILT=!WORK!\app\build\outputs\apk\debug\app-debug.apk"
if not exist "!BUILT!" (
    echo ERROR: Gradle completed but the APK was not found.
    start "" notepad "%LOG%"
    pause
    exit /b 1
)

echo [7/8] Copying the protected APK to Downloads and USB...
copy /Y "!BUILT!" "%FINAL%" >nul
if errorlevel 1 (
    echo ERROR: Could not copy the APK to Downloads.
    pause
    exit /b 1
)

set "USBCOPY="
set "USBDRIVE="
for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "$d=Get-CimInstance Win32_LogicalDisk ^| Where-Object {$_.DriveType -eq 2 } ^| Select-Object -First 1 -ExpandProperty DeviceID; if($d){$d}"`) do set "USBDRIVE=%%D"
if defined USBDRIVE (
    set "USBCOPY=!USBDRIVE!\KS-OUTBOUND-REQUEST-FIREWALL-1682045.apk"
    copy /Y "!BUILT!" "!USBCOPY!" >nul
)

echo [8/8] Recording the isolated safety candidate...
> "!WORK!\.kristalstreams-test-version.txt" echo 1682045
> "!WORK!\OUTBOUND-REQUEST-FIREWALL-1682045.txt" echo All provider API, artwork, redirect, playback, retry, and saved-URL paths are guarded.
for /f "delims=" %%H in ('powershell -NoProfile -Command "(Get-FileHash -Algorithm SHA256 -LiteralPath '%FINAL%').Hash"') do set "APK_HASH=%%H"

color 2F
cls
echo.
echo ==========================================================
echo   OUTBOUND REQUEST FIREWALL BUILD SUCCESSFUL
echo ==========================================================
echo.
echo APK:
echo   %FINAL%
echo.
if defined USBCOPY (
    echo USB APK:
    echo   !USBCOPY!
    echo.
)
echo SHA256:
echo   !APK_HASH!
echo.
echo Approved 1682042 source: UNTOUCHED
echo Original known-good R2 source: UNTOUCHED
echo Test candidate:
echo   !WORK!
echo.
echo IMPORTANT:
echo   Do not open builds 1682043 or 1682044.
echo   Install only KS-OUTBOUND-REQUEST-FIREWALL-1682045.apk.
echo.
echo CONTROLLED TEST ORDER:
echo   1. Open the app on home Wi-Fi with the VPN off.
echo   2. Connect and wait on Home for 30 seconds.
echo   3. Open Live TV and scroll through approximately 20 channels.
echo   4. Open Movies and scroll through approximately 20 posters.
echo   5. Open Series and scroll through approximately 20 posters.
echo   6. Play one Live TV channel, one Movie, and one Series episode.
echo.
echo Stop immediately and report the screen message if any connection fails.
echo.
explorer /select,"%FINAL%"
pause
exit /b 0

:::BEGIN POLICY
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgamF2YS5uZXQuVVJJCmlt
cG9ydCBqYXZhLm5ldC5VUkxEZWNvZGVyCmltcG9ydCBqYXZhLnV0aWwuTG9jYWxlCmltcG9ydCBq
YXZhLnV0aWwuY29uY3VycmVudC5Db25jdXJyZW50SGFzaE1hcAoKLyoqCiAqIE9uZSBvdXRib3Vu
ZC1yZXF1ZXN0IHBvbGljeSBmb3IgcHJvdmlkZXIgQVBJcywgYXJ0d29yaywgYW5kIHBsYXliYWNr
LgogKiBJbnZhbGlkIHZhbHVlcyBhcmUgcmVqZWN0ZWQgbG9jYWxseSBhbmQgbmV2ZXIgcmVhY2gg
dGhlIG5ldHdvcmsgc3RhY2suCiAqLwpvYmplY3QgT3V0Ym91bmRVcmxQb2xpY3kgewogICAgcHJp
dmF0ZSBjb25zdCB2YWwgTUFYX1VSTF9MRU5HVEggPSA0XzA5NgogICAgcHJpdmF0ZSBjb25zdCB2
YWwgUFJPVklERVJfUkVRVUVTVF9TUEFDSU5HX01TID0gMTgwTAogICAgcHJpdmF0ZSBjb25zdCB2
YWwgUFJPVklERVJfRkFJTFVSRV9XSU5ET1dfTVMgPSA2MF8wMDBMCiAgICBwcml2YXRlIGNvbnN0
IHZhbCBQUk9WSURFUl9GQUlMVVJFX0NPT0xET1dOX01TID0gMTIwXzAwMEwKICAgIHByaXZhdGUg
Y29uc3QgdmFsIFBST1ZJREVSX1JFSkVDVElPTl9DT09MRE9XTl9NUyA9IDE1ICogNjBfMDAwTAoK
ICAgIHByaXZhdGUgdmFsIG1pc3NpbmdUb2tlbnMgPSBzZXRPZigKICAgICAgICAiIiwgIjAiLCAi
bnVsbCIsICJ1bmRlZmluZWQiLCAibm9uZSIsICJuaWwiLCAibmFuIiwgIm4vYSIsICJbXSIsICJ7
fSIsICIuIiwgIi4uIgogICAgKQogICAgcHJpdmF0ZSB2YWwgcHJvdmlkZXJLaW5kcyA9IHNldE9m
KCJsaXZlIiwgIm1vdmllIiwgInNlcmllcyIpCiAgICBwcml2YXRlIHZhbCBzYWZlRXh0ZW5zaW9u
UGF0dGVybiA9IFJlZ2V4KCJeW2EtejAtOV17MSw4fSQiKQogICAgcHJpdmF0ZSB2YWwgc2FmZVF1
ZXJ5VmFsdWVQYXR0ZXJuID0gUmVnZXgoIl5bQS1aYS16MC05Xy46LV17MSwxMjh9JCIpCiAgICBw
cml2YXRlIHZhbCBwcm92aWRlckdhdGUgPSBBbnkoKQogICAgcHJpdmF0ZSB2YWwgcHJvdmlkZXJD
b29sZG93blVudGlsID0gQ29uY3VycmVudEhhc2hNYXA8U3RyaW5nLCBMb25nPigpCiAgICBwcml2
YXRlIHZhbCBwcm92aWRlckZhaWx1cmVzID0gQ29uY3VycmVudEhhc2hNYXA8U3RyaW5nLCBGYWls
dXJlV2luZG93PigpCiAgICBwcml2YXRlIHZhciBuZXh0UHJvdmlkZXJSZXF1ZXN0QXQgPSAwTAoK
ICAgIHByaXZhdGUgZGF0YSBjbGFzcyBGYWlsdXJlV2luZG93KHZhbCBjb3VudDogSW50LCB2YWwg
c3RhcnRlZEF0OiBMb25nKQoKICAgIGluaXQgewogICAgICAgIGNoZWNrKG5vcm1hbGl6ZUh0dHBV
cmwoImh0dHA6Ly9leGFtcGxlLmNvbS9udWxsIiwgcmVxdWlyZVBhdGggPSB0cnVlKS5pc0JsYW5r
KCkpCiAgICAgICAgY2hlY2sobm9ybWFsaXplSHR0cFVybCgiaHR0cDovL2V4YW1wbGUuY29tL3Vu
ZGVmaW5lZCIsIHJlcXVpcmVQYXRoID0gdHJ1ZSkuaXNCbGFuaygpKQogICAgICAgIGNoZWNrKG5v
cm1hbGl6ZUh0dHBVcmwoImh0dHA6Ly9leGFtcGxlLmNvbS8wIiwgcmVxdWlyZVBhdGggPSB0cnVl
KS5pc0JsYW5rKCkpCiAgICAgICAgY2hlY2sobm9ybWFsaXplSHR0cFVybCgiaHR0cDovL2V4YW1w
bGUuY29tL1tdIiwgcmVxdWlyZVBhdGggPSB0cnVlKS5pc0JsYW5rKCkpCiAgICAgICAgY2hlY2so
bm9ybWFsaXplSHR0cFVybCgiaHR0cDovL2V4YW1wbGUuY29tL2xpdmUvdXNlci9wYXNzLzEyLnRz
IiwgcmVxdWlyZVBhdGggPSB0cnVlKS5pc05vdEJsYW5rKCkpCiAgICAgICAgY2hlY2soc2FmZUV4
dGVuc2lvbigibnVsbCIsICJ0cyIpID09ICJ0cyIpCiAgICAgICAgY2hlY2soc2FmZVF1ZXJ5VmFs
dWUoIm51bGwiKS5pc0JsYW5rKCkpCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gaXNNaXNzaW5nVG9r
ZW4ocmF3OiBTdHJpbmc/KTogQm9vbGVhbiB7CiAgICAgICAgdmFsIHZhbHVlID0gcmF3Py50cmlt
KCk/Lmxvd2VyY2FzZShMb2NhbGUuVVMpLm9yRW1wdHkoKQogICAgICAgIHJldHVybiB2YWx1ZSBp
biBtaXNzaW5nVG9rZW5zCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gY29udGFpbnNGb3JiaWRkZW5D
aGFyYWN0ZXJzKHZhbHVlOiBTdHJpbmcpOiBCb29sZWFuID0gdmFsdWUuYW55IHsgY2ggLT4KICAg
ICAgICBjaC5jb2RlIDwgMHgyMCB8fAogICAgICAgICAgICBjaC5jb2RlID09IDB4N2YgfHwKICAg
ICAgICAgICAgY2ggPT0gJzwnIHx8CiAgICAgICAgICAgIGNoID09ICc+JyB8fAogICAgICAgICAg
ICBjaCA9PSAnIicgfHwKICAgICAgICAgICAgY2ggPT0gJ3snIHx8CiAgICAgICAgICAgIGNoID09
ICd9JyB8fAogICAgICAgICAgICBjaCA9PSAnfCcgfHwKICAgICAgICAgICAgY2ggPT0gJ1xcJyB8
fAogICAgICAgICAgICBjaCA9PSAnXicgfHwKICAgICAgICAgICAgY2ggPT0gJ2AnCiAgICB9Cgog
ICAgcHJpdmF0ZSBmdW4gZGVjb2RlZFNlZ21lbnQocmF3OiBTdHJpbmcpOiBTdHJpbmcgPQogICAg
ICAgIHJ1bkNhdGNoaW5nIHsgVVJMRGVjb2Rlci5kZWNvZGUocmF3LCAiVVRGLTgiKSB9LmdldE9y
RGVmYXVsdChyYXcpCgogICAgcHJpdmF0ZSBmdW4gbm9ybWFsaXplSHR0cFVybChyYXc6IFN0cmlu
Zz8sIHJlcXVpcmVQYXRoOiBCb29sZWFuKTogU3RyaW5nIHsKICAgICAgICB2YWwgdmFsdWUgPSBy
YXc/LnRyaW0oKS5vckVtcHR5KCkKICAgICAgICBpZiAoCiAgICAgICAgICAgIGlzTWlzc2luZ1Rv
a2VuKHZhbHVlKSB8fAogICAgICAgICAgICB2YWx1ZS5sZW5ndGggPiBNQVhfVVJMX0xFTkdUSCB8
fAogICAgICAgICAgICBjb250YWluc0ZvcmJpZGRlbkNoYXJhY3RlcnModmFsdWUpCiAgICAgICAg
KSByZXR1cm4gIiIKCiAgICAgICAgdmFsIHVyaSA9IHJ1bkNhdGNoaW5nIHsgVVJJKHZhbHVlKSB9
LmdldE9yTnVsbCgpID86IHJldHVybiAiIgogICAgICAgIHZhbCBzY2hlbWUgPSB1cmkuc2NoZW1l
Py5sb3dlcmNhc2UoTG9jYWxlLlVTKQogICAgICAgIGlmIChzY2hlbWUgIT0gImh0dHAiICYmIHNj
aGVtZSAhPSAiaHR0cHMiKSByZXR1cm4gIiIKICAgICAgICBpZiAodXJpLmhvc3QuaXNOdWxsT3JC
bGFuaygpIHx8IHVyaS51c2VySW5mbyAhPSBudWxsIHx8IHVyaS5mcmFnbWVudCAhPSBudWxsKSBy
ZXR1cm4gIiIKCiAgICAgICAgdmFsIHJhd1BhdGggPSB1cmkucmF3UGF0aC5vckVtcHR5KCkKICAg
ICAgICBpZiAocmVxdWlyZVBhdGggJiYgKHJhd1BhdGguaXNCbGFuaygpIHx8IHJhd1BhdGggPT0g
Ii8iKSkgcmV0dXJuICIiCiAgICAgICAgdmFsIHVuc2FmZVNlZ21lbnQgPSByYXdQYXRoCiAgICAg
ICAgICAgIC5zcGxpdCgnLycpCiAgICAgICAgICAgIC5maWx0ZXIgeyBpdC5pc05vdEJsYW5rKCkg
fQogICAgICAgICAgICAuYW55IHsgaXNNaXNzaW5nVG9rZW4oZGVjb2RlZFNlZ21lbnQoaXQpKSB9
CiAgICAgICAgaWYgKHVuc2FmZVNlZ21lbnQpIHJldHVybiAiIgoKICAgICAgICByZXR1cm4gdXJp
LnRvQVNDSUlTdHJpbmcoKQogICAgfQoKICAgIGZ1biBub3JtYWxpemVTZXJ2ZXJCYXNlKHJhdzog
U3RyaW5nPyk6IFN0cmluZyB7CiAgICAgICAgdmFsIG5vcm1hbGl6ZWQgPSBub3JtYWxpemVIdHRw
VXJsKHJhdywgcmVxdWlyZVBhdGggPSBmYWxzZSkKICAgICAgICBpZiAobm9ybWFsaXplZC5pc0Js
YW5rKCkpIHJldHVybiAiIgogICAgICAgIHZhbCB1cmkgPSBydW5DYXRjaGluZyB7IFVSSShub3Jt
YWxpemVkKSB9LmdldE9yTnVsbCgpID86IHJldHVybiAiIgogICAgICAgIGlmICh1cmkucXVlcnkg
IT0gbnVsbCB8fCB1cmkuZnJhZ21lbnQgIT0gbnVsbCkgcmV0dXJuICIiCiAgICAgICAgcmV0dXJu
IG5vcm1hbGl6ZWQudHJpbUVuZCgnLycpCiAgICB9CgogICAgZnVuIHJlcXVpcmVTZXJ2ZXJCYXNl
KHJhdzogU3RyaW5nPyk6IFN0cmluZyA9CiAgICAgICAgbm9ybWFsaXplU2VydmVyQmFzZShyYXcp
LmlmQmxhbmsgeyB0aHJvdyBJbGxlZ2FsQXJndW1lbnRFeGNlcHRpb24oIlRoZSBwcm92aWRlciBz
ZXJ2ZXIgVVJMIGlzIGludmFsaWQuIikgfQoKICAgIGZ1biBzYWZlUXVlcnlWYWx1ZShyYXc6IFN0
cmluZz8pOiBTdHJpbmcgewogICAgICAgIHZhbCB2YWx1ZSA9IHJhdz8udHJpbSgpLm9yRW1wdHko
KQogICAgICAgIHJldHVybiB2YWx1ZS50YWtlSWYgewogICAgICAgICAgICAhaXNNaXNzaW5nVG9r
ZW4oaXQpICYmCiAgICAgICAgICAgICAgICAhY29udGFpbnNGb3JiaWRkZW5DaGFyYWN0ZXJzKGl0
KSAmJgogICAgICAgICAgICAgICAgc2FmZVF1ZXJ5VmFsdWVQYXR0ZXJuLm1hdGNoZXMoaXQpCiAg
ICAgICAgfS5vckVtcHR5KCkKICAgIH0KCiAgICBmdW4gc2FmZUV4dGVuc2lvbihyYXc6IFN0cmlu
Zz8sIGZhbGxiYWNrOiBTdHJpbmcpOiBTdHJpbmcgewogICAgICAgIHZhbCBzYWZlRmFsbGJhY2sg
PSBmYWxsYmFjay50cmltKCkudHJpbVN0YXJ0KCcuJykubG93ZXJjYXNlKExvY2FsZS5VUykKICAg
ICAgICAgICAgLnRha2VJZiB7IHNhZmVFeHRlbnNpb25QYXR0ZXJuLm1hdGNoZXMoaXQpIH0gPzog
InRzIgogICAgICAgIHZhbCBjYW5kaWRhdGUgPSByYXc/LnRyaW0oKT8udHJpbVN0YXJ0KCcuJyk/
Lmxvd2VyY2FzZShMb2NhbGUuVVMpLm9yRW1wdHkoKQogICAgICAgIHJldHVybiBjYW5kaWRhdGUu
dGFrZUlmIHsKICAgICAgICAgICAgIWlzTWlzc2luZ1Rva2VuKGl0KSAmJiBzYWZlRXh0ZW5zaW9u
UGF0dGVybi5tYXRjaGVzKGl0KQogICAgICAgIH0gPzogc2FmZUZhbGxiYWNrCiAgICB9CgogICAg
ZnVuIG5vcm1hbGl6ZUFydHdvcmtVcmwoc2VydmVyOiBTdHJpbmcsIHJhdzogU3RyaW5nPyk6IFN0
cmluZyB7CiAgICAgICAgdmFsIHZhbHVlID0gcmF3Py50cmltKCkub3JFbXB0eSgpCiAgICAgICAg
aWYgKGlzTWlzc2luZ1Rva2VuKHZhbHVlKSB8fCBjb250YWluc0ZvcmJpZGRlbkNoYXJhY3RlcnMo
dmFsdWUpKSByZXR1cm4gIiIKICAgICAgICB2YWwgYmFzZSA9IG5vcm1hbGl6ZVNlcnZlckJhc2Uo
c2VydmVyKQogICAgICAgIGlmIChiYXNlLmlzQmxhbmsoKSkgcmV0dXJuICIiCiAgICAgICAgdmFs
IGNhbmRpZGF0ZSA9IHdoZW4gewogICAgICAgICAgICB2YWx1ZS5zdGFydHNXaXRoKCJodHRwOi8v
IiwgdHJ1ZSkgfHwgdmFsdWUuc3RhcnRzV2l0aCgiaHR0cHM6Ly8iLCB0cnVlKSAtPiB2YWx1ZQog
ICAgICAgICAgICB2YWx1ZS5zdGFydHNXaXRoKCIvLyIpIC0+ICIke1VSSShiYXNlKS5zY2hlbWV9
OiR2YWx1ZSIKICAgICAgICAgICAgdmFsdWUuc3RhcnRzV2l0aCgiLyIpIC0+ICIkYmFzZSR2YWx1
ZSIKICAgICAgICAgICAgZWxzZSAtPiAiJGJhc2UvJHZhbHVlIgogICAgICAgIH0KICAgICAgICBy
ZXR1cm4gbm9ybWFsaXplSHR0cFVybChjYW5kaWRhdGUsIHJlcXVpcmVQYXRoID0gdHJ1ZSkKICAg
IH0KCiAgICBmdW4gbm9ybWFsaXplUmVtb3RlSHR0cFVybChyYXc6IFN0cmluZz8pOiBTdHJpbmcg
PQogICAgICAgIG5vcm1hbGl6ZUh0dHBVcmwocmF3LCByZXF1aXJlUGF0aCA9IHRydWUpCgogICAg
ZnVuIG5vcm1hbGl6ZVBsYXliYWNrVXJsKHJhdzogU3RyaW5nPyk6IFN0cmluZyA9CiAgICAgICAg
bm9ybWFsaXplSHR0cFVybChyYXcsIHJlcXVpcmVQYXRoID0gdHJ1ZSkKCiAgICBmdW4gcHJvdmlk
ZXJQbGF5YmFja1VybCgKICAgICAgICBzZXJ2ZXJCYXNlOiBTdHJpbmcsCiAgICAgICAga2luZDog
U3RyaW5nLAogICAgICAgIGVuY29kZWRVc2VybmFtZTogU3RyaW5nLAogICAgICAgIGVuY29kZWRQ
YXNzd29yZDogU3RyaW5nLAogICAgICAgIHN0cmVhbUlkOiBJbnQsCiAgICAgICAgcmF3RXh0ZW5z
aW9uOiBTdHJpbmc/LAogICAgICAgIGZhbGxiYWNrRXh0ZW5zaW9uOiBTdHJpbmcKICAgICk6IFN0
cmluZyB7CiAgICAgICAgdmFsIHNhZmVCYXNlID0gbm9ybWFsaXplU2VydmVyQmFzZShzZXJ2ZXJC
YXNlKQogICAgICAgIHZhbCBzYWZlS2luZCA9IGtpbmQudHJpbSgpLmxvd2VyY2FzZShMb2NhbGUu
VVMpCiAgICAgICAgaWYgKHNhZmVCYXNlLmlzQmxhbmsoKSB8fCBzYWZlS2luZCAhaW4gcHJvdmlk
ZXJLaW5kcyB8fCBzdHJlYW1JZCA8PSAwKSByZXR1cm4gIiIKICAgICAgICBpZiAoZW5jb2RlZFVz
ZXJuYW1lLmlzQmxhbmsoKSB8fCBlbmNvZGVkUGFzc3dvcmQuaXNCbGFuaygpKSByZXR1cm4gIiIK
ICAgICAgICB2YWwgZXh0ZW5zaW9uID0gc2FmZUV4dGVuc2lvbihyYXdFeHRlbnNpb24sIGZhbGxi
YWNrRXh0ZW5zaW9uKQogICAgICAgIHJldHVybiBub3JtYWxpemVQbGF5YmFja1VybCgKICAgICAg
ICAgICAgIiRzYWZlQmFzZS8kc2FmZUtpbmQvJGVuY29kZWRVc2VybmFtZS8kZW5jb2RlZFBhc3N3
b3JkLyRzdHJlYW1JZC4kZXh0ZW5zaW9uIgogICAgICAgICkKICAgIH0KCiAgICBmdW4gcmVxdWly
ZVByb3ZpZGVyQXBpVXJsKHJhdzogU3RyaW5nKTogU3RyaW5nIHsKICAgICAgICB2YWwgbm9ybWFs
aXplZCA9IG5vcm1hbGl6ZUh0dHBVcmwocmF3LCByZXF1aXJlUGF0aCA9IHRydWUpCiAgICAgICAg
aWYgKG5vcm1hbGl6ZWQuaXNCbGFuaygpKSB0aHJvdyBJbGxlZ2FsQXJndW1lbnRFeGNlcHRpb24o
IlVuc2FmZSBwcm92aWRlciByZXF1ZXN0IHdhcyBibG9ja2VkIGxvY2FsbHkuIikKICAgICAgICB2
YWwgcGF0aCA9IFVSSShub3JtYWxpemVkKS5wYXRoLmxvd2VyY2FzZShMb2NhbGUuVVMpCiAgICAg
ICAgaWYgKCFwYXRoLmVuZHNXaXRoKCIvcGxheWVyX2FwaS5waHAiKSAmJiAhcGF0aC5lbmRzV2l0
aCgiL3htbHR2LnBocCIpKSB7CiAgICAgICAgICAgIHRocm93IElsbGVnYWxBcmd1bWVudEV4Y2Vw
dGlvbigiVW5zdXBwb3J0ZWQgcHJvdmlkZXIgcmVxdWVzdCBwYXRoIHdhcyBibG9ja2VkIGxvY2Fs
bHkuIikKICAgICAgICB9CiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQKICAgIH0KCiAgICBmdW4g
YmVmb3JlUHJvdmlkZXJSZXF1ZXN0KHJhdzogU3RyaW5nKTogU3RyaW5nIHsKICAgICAgICB2YWwg
bm9ybWFsaXplZCA9IHJlcXVpcmVQcm92aWRlckFwaVVybChyYXcpCiAgICAgICAgdmFsIGhvc3Qg
PSBVUkkobm9ybWFsaXplZCkuaG9zdC5sb3dlcmNhc2UoTG9jYWxlLlVTKQogICAgICAgIHN5bmNo
cm9uaXplZChwcm92aWRlckdhdGUpIHsKICAgICAgICAgICAgdmFsIG5vdyA9IFN5c3RlbS5jdXJy
ZW50VGltZU1pbGxpcygpCiAgICAgICAgICAgIHZhbCBjb29sZG93biA9IHByb3ZpZGVyQ29vbGRv
d25VbnRpbFtob3N0XSA/OiAwTAogICAgICAgICAgICBpZiAoY29vbGRvd24gPiBub3cpIHsKICAg
ICAgICAgICAgICAgIHRocm93IElsbGVnYWxTdGF0ZUV4Y2VwdGlvbigiUHJvdmlkZXIgcmVxdWVz
dHMgYXJlIGNvb2xpbmcgZG93biBhZnRlciByZXBlYXRlZCBmYWlsdXJlcy4iKQogICAgICAgICAg
ICB9CiAgICAgICAgICAgIHZhbCB3YWl0TXMgPSBuZXh0UHJvdmlkZXJSZXF1ZXN0QXQgLSBub3cK
ICAgICAgICAgICAgaWYgKHdhaXRNcyA+IDBMKSB7CiAgICAgICAgICAgICAgICB0cnkgewogICAg
ICAgICAgICAgICAgICAgIFRocmVhZC5zbGVlcCh3YWl0TXMpCiAgICAgICAgICAgICAgICB9IGNh
dGNoIChfOiBJbnRlcnJ1cHRlZEV4Y2VwdGlvbikgewogICAgICAgICAgICAgICAgICAgIFRocmVh
ZC5jdXJyZW50VGhyZWFkKCkuaW50ZXJydXB0KCkKICAgICAgICAgICAgICAgICAgICB0aHJvdyBJ
bGxlZ2FsU3RhdGVFeGNlcHRpb24oIlByb3ZpZGVyIHJlcXVlc3Qgd2FzIGNhbmNlbGxlZC4iKQog
ICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgICAgIG5leHRQcm92aWRlclJl
cXVlc3RBdCA9IFN5c3RlbS5jdXJyZW50VGltZU1pbGxpcygpICsgUFJPVklERVJfUkVRVUVTVF9T
UEFDSU5HX01TCiAgICAgICAgfQogICAgICAgIHJldHVybiBub3JtYWxpemVkCiAgICB9CgogICAg
ZnVuIHJlY29yZFByb3ZpZGVyUmVzcG9uc2UocmF3OiBTdHJpbmcsIHJlc3BvbnNlQ29kZTogSW50
KSB7CiAgICAgICAgdmFsIG5vcm1hbGl6ZWQgPSBydW5DYXRjaGluZyB7IHJlcXVpcmVQcm92aWRl
ckFwaVVybChyYXcpIH0uZ2V0T3JOdWxsKCkgPzogcmV0dXJuCiAgICAgICAgdmFsIGhvc3QgPSBV
Ukkobm9ybWFsaXplZCkuaG9zdC5sb3dlcmNhc2UoTG9jYWxlLlVTKQogICAgICAgIHN5bmNocm9u
aXplZChwcm92aWRlckdhdGUpIHsKICAgICAgICAgICAgaWYgKHJlc3BvbnNlQ29kZSBpbiAyMDAu
LjI5OSkgcHJvdmlkZXJGYWlsdXJlcy5yZW1vdmUoaG9zdCkKICAgICAgICAgICAgaWYgKHJlc3Bv
bnNlQ29kZSA9PSA0MDMgfHwgcmVzcG9uc2VDb2RlID09IDQyOSkgewogICAgICAgICAgICAgICAg
cHJvdmlkZXJDb29sZG93blVudGlsW2hvc3RdID0gU3lzdGVtLmN1cnJlbnRUaW1lTWlsbGlzKCkg
KyBQUk9WSURFUl9SRUpFQ1RJT05fQ09PTERPV05fTVMKICAgICAgICAgICAgfQogICAgICAgIH0K
ICAgIH0KCiAgICBmdW4gcmVjb3JkUHJvdmlkZXJGYWlsdXJlKHJhdzogU3RyaW5nKSB7CiAgICAg
ICAgdmFsIG5vcm1hbGl6ZWQgPSBydW5DYXRjaGluZyB7IHJlcXVpcmVQcm92aWRlckFwaVVybChy
YXcpIH0uZ2V0T3JOdWxsKCkgPzogcmV0dXJuCiAgICAgICAgdmFsIGhvc3QgPSBVUkkobm9ybWFs
aXplZCkuaG9zdC5sb3dlcmNhc2UoTG9jYWxlLlVTKQogICAgICAgIHN5bmNocm9uaXplZChwcm92
aWRlckdhdGUpIHsKICAgICAgICAgICAgdmFsIG5vdyA9IFN5c3RlbS5jdXJyZW50VGltZU1pbGxp
cygpCiAgICAgICAgICAgIHZhbCBwcmV2aW91cyA9IHByb3ZpZGVyRmFpbHVyZXNbaG9zdF0KICAg
ICAgICAgICAgdmFsIGN1cnJlbnQgPSBpZiAocHJldmlvdXMgPT0gbnVsbCB8fCBub3cgLSBwcmV2
aW91cy5zdGFydGVkQXQgPiBQUk9WSURFUl9GQUlMVVJFX1dJTkRPV19NUykgewogICAgICAgICAg
ICAgICAgRmFpbHVyZVdpbmRvdygxLCBub3cpCiAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAg
ICAgICAgICBwcmV2aW91cy5jb3B5KGNvdW50ID0gcHJldmlvdXMuY291bnQgKyAxKQogICAgICAg
ICAgICB9CiAgICAgICAgICAgIGlmIChjdXJyZW50LmNvdW50ID49IDMpIHsKICAgICAgICAgICAg
ICAgIHByb3ZpZGVyRmFpbHVyZXMucmVtb3ZlKGhvc3QpCiAgICAgICAgICAgICAgICBwcm92aWRl
ckNvb2xkb3duVW50aWxbaG9zdF0gPSBub3cgKyBQUk9WSURFUl9GQUlMVVJFX0NPT0xET1dOX01T
CiAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgICBwcm92aWRlckZhaWx1cmVzW2hv
c3RdID0gY3VycmVudAogICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQp9Cg==
:::END POLICY
:::BEGIN XTREAM
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC51dGlsLkJh
c2U2NAppbXBvcnQgYW5kcm9pZC51dGlsLlhtbAoKaW1wb3J0IG9yZy5qc29uLkpTT05BcnJheQpp
bXBvcnQgb3JnLmpzb24uSlNPTk9iamVjdAppbXBvcnQgb3JnLnhtbHB1bGwudjEuWG1sUHVsbFBh
cnNlcgppbXBvcnQgamF2YS5pby5CdWZmZXJlZFJlYWRlcgppbXBvcnQgamF2YS5pby5JbnB1dFN0
cmVhbQppbXBvcnQgamF2YS5pby5JbnB1dFN0cmVhbVJlYWRlcgppbXBvcnQgamF2YS5uZXQuSHR0
cFVSTENvbm5lY3Rpb24KaW1wb3J0IGphdmEubmV0LlVSTAppbXBvcnQgamF2YS5uZXQuVVJMRW5j
b2RlcgppbXBvcnQgamF2YS50ZXh0LlNpbXBsZURhdGVGb3JtYXQKaW1wb3J0IGphdmEudXRpbC5M
b2NhbGUKaW1wb3J0IGphdmEudXRpbC5UaW1lWm9uZQoKb2JqZWN0IFh0cmVhbUNsaWVudCB7CiAg
ICBwcml2YXRlIGZ1biBiYXNlKHNlcnZlcjogU3RyaW5nKSA9IE91dGJvdW5kVXJsUG9saWN5LnJl
cXVpcmVTZXJ2ZXJCYXNlKHNlcnZlcikKICAgIHByaXZhdGUgZnVuIGVuYyh2OiBTdHJpbmcpID0g
VVJMRW5jb2Rlci5lbmNvZGUodiwgIlVURi04IikKCiAgICBwcml2YXRlIGZ1biBtZWRpYVVybChz
ZXJ2ZXI6IFN0cmluZywgcmF3OiBTdHJpbmcpOiBTdHJpbmcgewogICAgICAgIHJldHVybiBPdXRi
b3VuZFVybFBvbGljeS5ub3JtYWxpemVBcnR3b3JrVXJsKGJhc2Uoc2VydmVyKSwgcmF3KQogICAg
fQoKICAgIHByaXZhdGUgZnVuIGdldCh1cmw6IFN0cmluZyk6IFN0cmluZyB7CiAgICAgICAgdmFs
IHNhZmVVcmwgPSBPdXRib3VuZFVybFBvbGljeS5iZWZvcmVQcm92aWRlclJlcXVlc3QodXJsKQog
ICAgICAgIHZhbCBjb25uZWN0aW9uID0gdHJ5IHsKICAgICAgICAgICAgVVJMKHNhZmVVcmwpLm9w
ZW5Db25uZWN0aW9uKCkgYXMgSHR0cFVSTENvbm5lY3Rpb24KICAgICAgICB9IGNhdGNoIChlOiBF
eGNlcHRpb24pIHsKICAgICAgICAgICAgT3V0Ym91bmRVcmxQb2xpY3kucmVjb3JkUHJvdmlkZXJG
YWlsdXJlKHNhZmVVcmwpCiAgICAgICAgICAgIHRocm93IGUKICAgICAgICB9CiAgICAgICAgY29u
bmVjdGlvbi5jb25uZWN0VGltZW91dCA9IDEyXzAwMAogICAgICAgIGNvbm5lY3Rpb24ucmVhZFRp
bWVvdXQgPSAyMF8wMDAKICAgICAgICBjb25uZWN0aW9uLnJlcXVlc3RNZXRob2QgPSAiR0VUIgog
ICAgICAgIGNvbm5lY3Rpb24uc2V0UmVxdWVzdFByb3BlcnR5KCJVc2VyLUFnZW50IiwgIktyaXN0
YWxTdHJlYW1zLzEuNi44IEFuZHJvaWQiKQogICAgICAgIHJldHVybiB0cnkgewogICAgICAgICAg
ICB2YWwgY29kZSA9IGNvbm5lY3Rpb24ucmVzcG9uc2VDb2RlCiAgICAgICAgICAgIE91dGJvdW5k
VXJsUG9saWN5LnJlY29yZFByb3ZpZGVyUmVzcG9uc2Uoc2FmZVVybCwgY29kZSkKICAgICAgICAg
ICAgdmFsIHN0cmVhbSA9IGlmIChjb2RlIGluIDIwMC4uMjk5KSBjb25uZWN0aW9uLmlucHV0U3Ry
ZWFtIGVsc2UgY29ubmVjdGlvbi5lcnJvclN0cmVhbQogICAgICAgICAgICB2YWwgYm9keSA9IHN0
cmVhbT8ubGV0IHsgQnVmZmVyZWRSZWFkZXIoSW5wdXRTdHJlYW1SZWFkZXIoaXQpKS51c2UgeyBy
ZWFkZXIgLT4gcmVhZGVyLnJlYWRUZXh0KCkgfSB9Lm9yRW1wdHkoKQogICAgICAgICAgICBpZiAo
Y29kZSAhaW4gMjAwLi4yOTkpIHsKICAgICAgICAgICAgICAgIHRocm93IElsbGVnYWxTdGF0ZUV4
Y2VwdGlvbigiU2VydmVyIHJldHVybmVkIEhUVFAgJGNvZGUiKQogICAgICAgICAgICB9CiAgICAg
ICAgICAgIGJvZHkKICAgICAgICB9IGNhdGNoIChlOiBFeGNlcHRpb24pIHsKICAgICAgICAgICAg
T3V0Ym91bmRVcmxQb2xpY3kucmVjb3JkUHJvdmlkZXJGYWlsdXJlKHNhZmVVcmwpCiAgICAgICAg
ICAgIHRocm93IGUKICAgICAgICB9IGZpbmFsbHkgewogICAgICAgICAgICBjb25uZWN0aW9uLmRp
c2Nvbm5lY3QoKQogICAgICAgIH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biA8VD4gd2l0aElucHV0
U3RyZWFtKHVybDogU3RyaW5nLCBibG9jazogKElucHV0U3RyZWFtKSAtPiBUKTogVCB7CiAgICAg
ICAgdmFsIHNhZmVVcmwgPSBPdXRib3VuZFVybFBvbGljeS5iZWZvcmVQcm92aWRlclJlcXVlc3Qo
dXJsKQogICAgICAgIHZhbCBjb25uZWN0aW9uID0gdHJ5IHsKICAgICAgICAgICAgVVJMKHNhZmVV
cmwpLm9wZW5Db25uZWN0aW9uKCkgYXMgSHR0cFVSTENvbm5lY3Rpb24KICAgICAgICB9IGNhdGNo
IChlOiBFeGNlcHRpb24pIHsKICAgICAgICAgICAgT3V0Ym91bmRVcmxQb2xpY3kucmVjb3JkUHJv
dmlkZXJGYWlsdXJlKHNhZmVVcmwpCiAgICAgICAgICAgIHRocm93IGUKICAgICAgICB9CiAgICAg
ICAgY29ubmVjdGlvbi5jb25uZWN0VGltZW91dCA9IDEyXzAwMAogICAgICAgIGNvbm5lY3Rpb24u
cmVhZFRpbWVvdXQgPSAyNV8wMDAKICAgICAgICBjb25uZWN0aW9uLnJlcXVlc3RNZXRob2QgPSAi
R0VUIgogICAgICAgIGNvbm5lY3Rpb24uc2V0UmVxdWVzdFByb3BlcnR5KCJVc2VyLUFnZW50Iiwg
IktyaXN0YWxTdHJlYW1zLzEuNi44IEFuZHJvaWQiKQogICAgICAgIHJldHVybiB0cnkgewogICAg
ICAgICAgICB2YWwgY29kZSA9IGNvbm5lY3Rpb24ucmVzcG9uc2VDb2RlCiAgICAgICAgICAgIE91
dGJvdW5kVXJsUG9saWN5LnJlY29yZFByb3ZpZGVyUmVzcG9uc2Uoc2FmZVVybCwgY29kZSkKICAg
ICAgICAgICAgaWYgKGNvZGUgIWluIDIwMC4uMjk5KSB0aHJvdyBJbGxlZ2FsU3RhdGVFeGNlcHRp
b24oIlNlcnZlciByZXR1cm5lZCBIVFRQICRjb2RlIikKICAgICAgICAgICAgY29ubmVjdGlvbi5p
bnB1dFN0cmVhbS51c2UoYmxvY2spCiAgICAgICAgfSBjYXRjaCAoZTogRXhjZXB0aW9uKSB7CiAg
ICAgICAgICAgIE91dGJvdW5kVXJsUG9saWN5LnJlY29yZFByb3ZpZGVyRmFpbHVyZShzYWZlVXJs
KQogICAgICAgICAgICB0aHJvdyBlCiAgICAgICAgfSBmaW5hbGx5IHsKICAgICAgICAgICAgY29u
bmVjdGlvbi5kaXNjb25uZWN0KCkKICAgICAgICB9CiAgICB9CgogICAgZnVuIGF1dGhlbnRpY2F0
ZShjOiBYdHJlYW1DcmVkZW50aWFscyk6IFN0cmluZyB7CiAgICAgICAgaWYgKERlbW9DYXRhbG9n
LmlzRGVtbyhjKSkgcmV0dXJuICJERU1PIgogICAgICAgIHZhbCBqc29uID0gSlNPTk9iamVjdChn
ZXQoIiR7YmFzZShjLnNlcnZlcil9L3BsYXllcl9hcGkucGhwP3VzZXJuYW1lPSR7ZW5jKGMudXNl
cm5hbWUpfSZwYXNzd29yZD0ke2VuYyhjLnBhc3N3b3JkKX0iKSkKICAgICAgICB2YWwgdXNlciA9
IGpzb24ub3B0SlNPTk9iamVjdCgidXNlcl9pbmZvIikgPzogdGhyb3cgSWxsZWdhbFN0YXRlRXhj
ZXB0aW9uKCJObyB1c2VyX2luZm8gcmV0dXJuZWQgYnkgc2VydmVyIikKICAgICAgICB2YWwgYXV0
aCA9IHVzZXIub3B0SW50KCJhdXRoIiwgMCkKICAgICAgICBpZiAoYXV0aCAhPSAxKSB0aHJvdyBJ
bGxlZ2FsU3RhdGVFeGNlcHRpb24odXNlci5vcHRTdHJpbmcoIm1lc3NhZ2UiLCAiTG9naW4gd2Fz
IG5vdCBhdXRob3JpemVkIikpCiAgICAgICAgdmFsIHN0YXR1cyA9IHVzZXIub3B0U3RyaW5nKCJz
dGF0dXMiLCAiQWN0aXZlIikKICAgICAgICBpZiAoIXN0YXR1cy5lcXVhbHMoIkFjdGl2ZSIsIHRy
dWUpKSB0aHJvdyBJbGxlZ2FsU3RhdGVFeGNlcHRpb24oIkFjY291bnQgc3RhdHVzOiAkc3RhdHVz
IikKICAgICAgICByZXR1cm4gdXNlci5vcHRTdHJpbmcoImV4cF9kYXRlIiwgIiIpCiAgICB9Cgog
ICAgZnVuIGxpdmVDYXRlZ29yaWVzKGM6IFh0cmVhbUNyZWRlbnRpYWxzKTogTGlzdDxMaXZlQ2F0
ZWdvcnk+IHsKICAgICAgICBpZiAoRGVtb0NhdGFsb2cuaXNEZW1vKGMpKSByZXR1cm4gRGVtb0Nh
dGFsb2cuY2F0ZWdvcmllcwogICAgICAgIHZhbCBhcnIgPSBKU09OQXJyYXkoZ2V0KCIke2Jhc2Uo
Yy5zZXJ2ZXIpfS9wbGF5ZXJfYXBpLnBocD91c2VybmFtZT0ke2VuYyhjLnVzZXJuYW1lKX0mcGFz
c3dvcmQ9JHtlbmMoYy5wYXNzd29yZCl9JmFjdGlvbj1nZXRfbGl2ZV9jYXRlZ29yaWVzIikpCiAg
ICAgICAgcmV0dXJuIGJ1aWxkTGlzdCB7CiAgICAgICAgICAgIGFkZChMaXZlQ2F0ZWdvcnkoIiIs
ICJBbGwgQ2hhbm5lbHMiKSkKICAgICAgICAgICAgZm9yIChpIGluIDAgdW50aWwgYXJyLmxlbmd0
aCgpKSB7CiAgICAgICAgICAgICAgICB2YWwgbyA9IGFyci5nZXRKU09OT2JqZWN0KGkpCiAgICAg
ICAgICAgICAgICBhZGQoTGl2ZUNhdGVnb3J5KG8ub3B0U3RyaW5nKCJjYXRlZ29yeV9pZCIpLCBv
Lm9wdFN0cmluZygiY2F0ZWdvcnlfbmFtZSIsICJDYXRlZ29yeSIpKSkKICAgICAgICAgICAgfQog
ICAgICAgIH0KICAgIH0KCiAgICBmdW4gbGl2ZVN0cmVhbXMoYzogWHRyZWFtQ3JlZGVudGlhbHMs
IGNhdGVnb3J5SWQ6IFN0cmluZz8gPSBudWxsKTogTGlzdDxMaXZlU3RyZWFtPiB7CiAgICAgICAg
aWYgKERlbW9DYXRhbG9nLmlzRGVtbyhjKSkgcmV0dXJuIERlbW9DYXRhbG9nLmxpdmVTdHJlYW1z
KGNhdGVnb3J5SWQpCiAgICAgICAgdmFsIHNhZmVDYXRlZ29yeUlkID0gT3V0Ym91bmRVcmxQb2xp
Y3kuc2FmZVF1ZXJ5VmFsdWUoY2F0ZWdvcnlJZCkKICAgICAgICB2YWwgc3VmZml4ID0gaWYgKHNh
ZmVDYXRlZ29yeUlkLmlzQmxhbmsoKSkgIiIgZWxzZSAiJmNhdGVnb3J5X2lkPSR7ZW5jKHNhZmVD
YXRlZ29yeUlkKX0iCiAgICAgICAgdmFsIGFyciA9IEpTT05BcnJheShnZXQoIiR7YmFzZShjLnNl
cnZlcil9L3BsYXllcl9hcGkucGhwP3VzZXJuYW1lPSR7ZW5jKGMudXNlcm5hbWUpfSZwYXNzd29y
ZD0ke2VuYyhjLnBhc3N3b3JkKX0mYWN0aW9uPWdldF9saXZlX3N0cmVhbXMkc3VmZml4IikpCiAg
ICAgICAgcmV0dXJuIGJ1aWxkTGlzdCB7CiAgICAgICAgICAgIGZvciAoaSBpbiAwIHVudGlsIGFy
ci5sZW5ndGgoKSkgewogICAgICAgICAgICAgICAgdmFsIG8gPSBhcnIuZ2V0SlNPTk9iamVjdChp
KQogICAgICAgICAgICAgICAgYWRkKExpdmVTdHJlYW0oCiAgICAgICAgICAgICAgICAgICAgby5v
cHRJbnQoInN0cmVhbV9pZCIpLAogICAgICAgICAgICAgICAgICAgIG8ub3B0U3RyaW5nKCJuYW1l
IiwgIkNoYW5uZWwiKSwKICAgICAgICAgICAgICAgICAgICBvLm9wdFN0cmluZygiY2F0ZWdvcnlf
aWQiKSwKICAgICAgICAgICAgICAgICAgICBtZWRpYVVybChjLnNlcnZlciwgby5vcHRTdHJpbmco
InN0cmVhbV9pY29uIikpLAogICAgICAgICAgICAgICAgICAgIE91dGJvdW5kVXJsUG9saWN5LnNh
ZmVFeHRlbnNpb24oby5vcHRTdHJpbmcoImNvbnRhaW5lcl9leHRlbnNpb24iLCAidHMiKSwgInRz
IiksCiAgICAgICAgICAgICAgICAgICAgby5vcHRTdHJpbmcoImVwZ19jaGFubmVsX2lkIiwgIiIp
LnRyaW0oKQogICAgICAgICAgICAgICAgKSkKICAgICAgICAgICAgfQogICAgICAgIH0KICAgIH0K
CiAgICBmdW4gbW92aWVDYXRlZ29yaWVzKGM6IFh0cmVhbUNyZWRlbnRpYWxzKTogTGlzdDxNZWRp
YUNhdGVnb3J5PiB7CiAgICAgICAgaWYgKERlbW9DYXRhbG9nLmlzRGVtbyhjKSkgcmV0dXJuIERl
bW9DYXRhbG9nLm1vdmllQ2F0ZWdvcmllcwogICAgICAgIHZhbCBhcnIgPSBKU09OQXJyYXkoZ2V0
KCIke2Jhc2UoYy5zZXJ2ZXIpfS9wbGF5ZXJfYXBpLnBocD91c2VybmFtZT0ke2VuYyhjLnVzZXJu
YW1lKX0mcGFzc3dvcmQ9JHtlbmMoYy5wYXNzd29yZCl9JmFjdGlvbj1nZXRfdm9kX2NhdGVnb3Jp
ZXMiKSkKICAgICAgICByZXR1cm4gYnVpbGRMaXN0IHsKICAgICAgICAgICAgYWRkKE1lZGlhQ2F0
ZWdvcnkoIiIsICJBbGwgTW92aWVzIikpCiAgICAgICAgICAgIGZvciAoaSBpbiAwIHVudGlsIGFy
ci5sZW5ndGgoKSkgewogICAgICAgICAgICAgICAgdmFsIG8gPSBhcnIuZ2V0SlNPTk9iamVjdChp
KQogICAgICAgICAgICAgICAgYWRkKE1lZGlhQ2F0ZWdvcnkoby5vcHRTdHJpbmcoImNhdGVnb3J5
X2lkIiksIG8ub3B0U3RyaW5nKCJjYXRlZ29yeV9uYW1lIiwgIkNhdGVnb3J5IikpKQogICAgICAg
ICAgICB9CiAgICAgICAgfQogICAgfQoKICAgIGZ1biBzZXJpZXNDYXRlZ29yaWVzKGM6IFh0cmVh
bUNyZWRlbnRpYWxzKTogTGlzdDxNZWRpYUNhdGVnb3J5PiB7CiAgICAgICAgaWYgKERlbW9DYXRh
bG9nLmlzRGVtbyhjKSkgcmV0dXJuIERlbW9DYXRhbG9nLnNlcmllc0NhdGVnb3JpZXMKICAgICAg
ICB2YWwgYXJyID0gSlNPTkFycmF5KGdldCgiJHtiYXNlKGMuc2VydmVyKX0vcGxheWVyX2FwaS5w
aHA/dXNlcm5hbWU9JHtlbmMoYy51c2VybmFtZSl9JnBhc3N3b3JkPSR7ZW5jKGMucGFzc3dvcmQp
fSZhY3Rpb249Z2V0X3Nlcmllc19jYXRlZ29yaWVzIikpCiAgICAgICAgcmV0dXJuIGJ1aWxkTGlz
dCB7CiAgICAgICAgICAgIGFkZChNZWRpYUNhdGVnb3J5KCIiLCAiQWxsIFNlcmllcyIpKQogICAg
ICAgICAgICBmb3IgKGkgaW4gMCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsKICAgICAgICAgICAgICAg
IHZhbCBvID0gYXJyLmdldEpTT05PYmplY3QoaSkKICAgICAgICAgICAgICAgIGFkZChNZWRpYUNh
dGVnb3J5KG8ub3B0U3RyaW5nKCJjYXRlZ29yeV9pZCIpLCBvLm9wdFN0cmluZygiY2F0ZWdvcnlf
bmFtZSIsICJDYXRlZ29yeSIpKSkKICAgICAgICAgICAgfQogICAgICAgIH0KICAgIH0KCiAgICBm
dW4gbW92aWVzKGM6IFh0cmVhbUNyZWRlbnRpYWxzLCBjYXRlZ29yeUlkOiBTdHJpbmc/ID0gbnVs
bCk6IExpc3Q8TGlicmFyeUl0ZW0+IHsKICAgICAgICBpZiAoRGVtb0NhdGFsb2cuaXNEZW1vKGMp
KSByZXR1cm4gRGVtb0NhdGFsb2cubW92aWVzKGNhdGVnb3J5SWQpCiAgICAgICAgdmFsIHNhZmVD
YXRlZ29yeUlkID0gT3V0Ym91bmRVcmxQb2xpY3kuc2FmZVF1ZXJ5VmFsdWUoY2F0ZWdvcnlJZCkK
ICAgICAgICB2YWwgc3VmZml4ID0gaWYgKHNhZmVDYXRlZ29yeUlkLmlzQmxhbmsoKSkgIiIgZWxz
ZSAiJmNhdGVnb3J5X2lkPSR7ZW5jKHNhZmVDYXRlZ29yeUlkKX0iCiAgICAgICAgdmFsIGFyciA9
IEpTT05BcnJheShnZXQoIiR7YmFzZShjLnNlcnZlcil9L3BsYXllcl9hcGkucGhwP3VzZXJuYW1l
PSR7ZW5jKGMudXNlcm5hbWUpfSZwYXNzd29yZD0ke2VuYyhjLnBhc3N3b3JkKX0mYWN0aW9uPWdl
dF92b2Rfc3RyZWFtcyRzdWZmaXgiKSkKICAgICAgICByZXR1cm4gYnVpbGRMaXN0IHsKICAgICAg
ICAgICAgZm9yIChpIGluIDAgdW50aWwgYXJyLmxlbmd0aCgpKSB7CiAgICAgICAgICAgICAgICB2
YWwgbyA9IGFyci5nZXRKU09OT2JqZWN0KGkpCiAgICAgICAgICAgICAgICB2YWwgaWQgPSBvLm9w
dEludCgic3RyZWFtX2lkIikKICAgICAgICAgICAgICAgIHZhbCBleHQgPSBPdXRib3VuZFVybFBv
bGljeS5zYWZlRXh0ZW5zaW9uKG8ub3B0U3RyaW5nKCJjb250YWluZXJfZXh0ZW5zaW9uIiwgIm1w
NCIpLCAibXA0IikKICAgICAgICAgICAgICAgIHZhbCB1cmwgPSBPdXRib3VuZFVybFBvbGljeS5w
cm92aWRlclBsYXliYWNrVXJsKAogICAgICAgICAgICAgICAgICAgIGJhc2UoYy5zZXJ2ZXIpLCAi
bW92aWUiLCBlbmMoYy51c2VybmFtZSksIGVuYyhjLnBhc3N3b3JkKSwgaWQsIGV4dCwgIm1wNCIK
ICAgICAgICAgICAgICAgICkKICAgICAgICAgICAgICAgIHZhbCB5ZWFyID0gby5vcHRTdHJpbmco
InllYXIiKS5pZkJsYW5rIHsKICAgICAgICAgICAgICAgICAgICBvLm9wdFN0cmluZygicmVsZWFz
ZURhdGUiKS50cmltKCkudGFrZSg0KS50YWtlSWYgeyB2YWx1ZSAtPiB2YWx1ZS5hbGwgeyBjaCAt
PiBjaC5pc0RpZ2l0KCkgfSB9ID86ICIiCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAg
ICB2YWwgcmF0aW5nID0gby5vcHRTdHJpbmcoInJhdGluZ181YmFzZWQiKS5pZkJsYW5rIHsgby5v
cHRTdHJpbmcoInJhdGluZyIpIH0KICAgICAgICAgICAgICAgIGFkZChMaWJyYXJ5SXRlbSgKICAg
ICAgICAgICAgICAgICAgICBpZCA9IGlkLAogICAgICAgICAgICAgICAgICAgIG5hbWUgPSBvLm9w
dFN0cmluZygibmFtZSIsICJNb3ZpZSIpLAogICAgICAgICAgICAgICAgICAgIGtpbmQgPSAibW92
aWUiLAogICAgICAgICAgICAgICAgICAgIHBsYXlVcmwgPSB1cmwsCiAgICAgICAgICAgICAgICAg
ICAgaW1hZ2VVcmwgPSBtZWRpYVVybChjLnNlcnZlciwgby5vcHRTdHJpbmcoInN0cmVhbV9pY29u
IikpLAogICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5SWQgPSBvLm9wdFN0cmluZygiY2F0ZWdv
cnlfaWQiKSwKICAgICAgICAgICAgICAgICAgICB5ZWFyID0geWVhciwKICAgICAgICAgICAgICAg
ICAgICByYXRpbmcgPSBjbGVhblJhdGluZyhyYXRpbmcpCiAgICAgICAgICAgICAgICApKQogICAg
ICAgICAgICB9CiAgICAgICAgfQogICAgfQoKICAgIC8qKiBMb2FkcyB0aGUgcHJvdmlkZXIncyBm
dWxsIFZPRCBpbmZvcm1hdGlvbiB3aXRob3V0IGRlbGF5aW5nIHRoZSBtb3ZpZSBncmlkLiAqLwog
ICAgZnVuIG1vdmllRGV0YWlscyhjOiBYdHJlYW1DcmVkZW50aWFscywgbW92aWVJZDogSW50KTog
TW92aWVEZXRhaWxzIHsKICAgICAgICBpZiAoRGVtb0NhdGFsb2cuaXNEZW1vKGMpKSB7CiAgICAg
ICAgICAgIHZhbCBpdGVtID0gRGVtb0NhdGFsb2cubW92aWVzLmZpcnN0T3JOdWxsIHsgaXQuaWQg
PT0gbW92aWVJZCB9CiAgICAgICAgICAgICAgICA/OiB0aHJvdyBJbGxlZ2FsU3RhdGVFeGNlcHRp
b24oIk1vdmllIHdhcyBub3QgZm91bmQiKQogICAgICAgICAgICByZXR1cm4gTW92aWVEZXRhaWxz
KAogICAgICAgICAgICAgICAgaWQgPSBpdGVtLmlkLAogICAgICAgICAgICAgICAgbmFtZSA9IGl0
ZW0ubmFtZSwKICAgICAgICAgICAgICAgIHBsYXlVcmwgPSBpdGVtLnBsYXlVcmwub3JFbXB0eSgp
LAogICAgICAgICAgICAgICAgcG9zdGVyVXJsID0gaXRlbS5pbWFnZVVybCwKICAgICAgICAgICAg
ICAgIHllYXIgPSBpdGVtLnllYXIsCiAgICAgICAgICAgICAgICByYXRpbmcgPSBpdGVtLnJhdGlu
ZywKICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gIkZlYXR1cmUgcHJlc2VudGF0aW9uIiwKICAg
ICAgICAgICAgICAgIGdlbnJlID0gIktyaXN0YWwgU3RyZWFtcyBDaW5lbWEiLAogICAgICAgICAg
ICAgICAgZGVzY3JpcHRpb24gPSAiQSBmZWF0dXJlZCBtb3ZpZSBwcmVzZW50YXRpb24gYXZhaWxh
YmxlIGluIHRoZSBLcmlzdGFsIFN0cmVhbXMgZGVtbyBjYXRhbG9nLiIsCiAgICAgICAgICAgICAg
ICBjb3VudHJ5ID0gIlVuaXRlZCBTdGF0ZXMiLAogICAgICAgICAgICAgICAgY2F0ZWdvcnlJZCA9
IGl0ZW0uY2F0ZWdvcnlJZCwKICAgICAgICAgICAgICAgIHRyYWlsZXJVcmwgPSAiaHR0cHM6Ly93
d3cueW91dHViZS5jb20vcmVzdWx0cz9zZWFyY2hfcXVlcnk9JHtlbmMoaXRlbS5uYW1lICsgIiB0
cmFpbGVyIil9IiAKICAgICAgICAgICAgKQogICAgICAgIH0KCiAgICAgICAgaWYgKG1vdmllSWQg
PD0gMCkgdGhyb3cgSWxsZWdhbEFyZ3VtZW50RXhjZXB0aW9uKCJJbnZhbGlkIG1vdmllIGlkZW50
aWZpZXIgd2FzIGJsb2NrZWQgbG9jYWxseS4iKQogICAgICAgIHZhbCByb290ID0gSlNPTk9iamVj
dChnZXQoIiR7YmFzZShjLnNlcnZlcil9L3BsYXllcl9hcGkucGhwP3VzZXJuYW1lPSR7ZW5jKGMu
dXNlcm5hbWUpfSZwYXNzd29yZD0ke2VuYyhjLnBhc3N3b3JkKX0mYWN0aW9uPWdldF92b2RfaW5m
byZ2b2RfaWQ9JG1vdmllSWQiKSkKICAgICAgICB2YWwgaW5mbyA9IHJvb3Qub3B0SlNPTk9iamVj
dCgiaW5mbyIpID86IEpTT05PYmplY3QoKQogICAgICAgIHZhbCBtb3ZpZSA9IHJvb3Qub3B0SlNP
Tk9iamVjdCgibW92aWVfZGF0YSIpID86IEpTT05PYmplY3QoKQoKICAgICAgICBmdW4gcGljayh2
YXJhcmcga2V5czogU3RyaW5nKTogU3RyaW5nIHsKICAgICAgICAgICAga2V5cy5mb3JFYWNoIHsg
a2V5IC0+CiAgICAgICAgICAgICAgICBsaXN0T2YoaW5mbywgbW92aWUpLmZvckVhY2ggeyBzb3Vy
Y2UgLT4KICAgICAgICAgICAgICAgICAgICB2YWwgdmFsdWUgPSBzb3VyY2Uub3B0U3RyaW5nKGtl
eSwgIiIpLnRyaW0oKQogICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5pc05vdEJsYW5rKCkg
JiYgIXZhbHVlLmVxdWFscygibnVsbCIsIHRydWUpKSByZXR1cm4gdmFsdWUKICAgICAgICAgICAg
ICAgIH0KICAgICAgICAgICAgfQogICAgICAgICAgICByZXR1cm4gIiIKICAgICAgICB9CgogICAg
ICAgIGZ1biBmaXJzdEJhY2tkcm9wKCk6IFN0cmluZyB7CiAgICAgICAgICAgIHZhbCByYXcgPSBp
bmZvLm9wdCgiYmFja2Ryb3BfcGF0aCIpCiAgICAgICAgICAgIHZhbCBjYW5kaWRhdGUgPSB3aGVu
IChyYXcpIHsKICAgICAgICAgICAgICAgIGlzIEpTT05BcnJheSAtPiByYXcub3B0U3RyaW5nKDAs
ICIiKQogICAgICAgICAgICAgICAgaXMgU3RyaW5nIC0+IHsKICAgICAgICAgICAgICAgICAgICB2
YWwgdmFsdWUgPSByYXcudHJpbSgpCiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLnN0YXJ0
c1dpdGgoIlsiKSkgewogICAgICAgICAgICAgICAgICAgICAgICB0cnkgeyBKU09OQXJyYXkodmFs
dWUpLm9wdFN0cmluZygwLCAiIikgfSBjYXRjaCAoXzogRXhjZXB0aW9uKSB7IHZhbHVlIH0KICAg
ICAgICAgICAgICAgICAgICB9IGVsc2UgdmFsdWUKICAgICAgICAgICAgICAgIH0KICAgICAgICAg
ICAgICAgIGVsc2UgLT4gIiIKICAgICAgICAgICAgfS5pZkJsYW5rIHsgcGljaygiYmFja2Ryb3Ai
LCAiYmFja2Ryb3BfdXJsIikgfQogICAgICAgICAgICByZXR1cm4gbWVkaWFVcmwoYy5zZXJ2ZXIs
IGNhbmRpZGF0ZSkKICAgICAgICB9CgogICAgICAgIHZhbCBzdHJlYW1JZCA9IG1vdmllLm9wdElu
dCgic3RyZWFtX2lkIiwgbW92aWVJZCkudGFrZUlmIHsgaXQgPiAwIH0gPzogbW92aWVJZAogICAg
ICAgIHZhbCBleHRlbnNpb24gPSBPdXRib3VuZFVybFBvbGljeS5zYWZlRXh0ZW5zaW9uKHBpY2so
ImNvbnRhaW5lcl9leHRlbnNpb24iKSwgIm1wNCIpCiAgICAgICAgdmFsIGRpcmVjdCA9IE91dGJv
dW5kVXJsUG9saWN5Lm5vcm1hbGl6ZVBsYXliYWNrVXJsKHBpY2soImRpcmVjdF9zb3VyY2UiKSku
dGFrZUlmIHsgaXQuaXNOb3RCbGFuaygpIH0KICAgICAgICB2YWwgcGxheVVybCA9IGRpcmVjdCA/
OiBPdXRib3VuZFVybFBvbGljeS5wcm92aWRlclBsYXliYWNrVXJsKAogICAgICAgICAgICBiYXNl
KGMuc2VydmVyKSwgIm1vdmllIiwgZW5jKGMudXNlcm5hbWUpLCBlbmMoYy5wYXNzd29yZCksIHN0
cmVhbUlkLCBleHRlbnNpb24sICJtcDQiCiAgICAgICAgKQogICAgICAgIHZhbCByZWxlYXNlRGF0
ZSA9IHBpY2soInJlbGVhc2VkYXRlIiwgInJlbGVhc2VEYXRlIiwgInJlbGVhc2VfZGF0ZSIpCiAg
ICAgICAgdmFsIHJhd1llYXIgPSBwaWNrKCJ5ZWFyIikuaWZCbGFuayB7IHJlbGVhc2VEYXRlLnRh
a2UoNCkgfQogICAgICAgIHZhbCB5ZWFyID0gcmF3WWVhci50YWtlSWYgeyBpdC5sZW5ndGggPT0g
NCAmJiBpdC5hbGwoQ2hhcjo6aXNEaWdpdCkgfS5vckVtcHR5KCkKICAgICAgICB2YWwgcmF3RHVy
YXRpb24gPSBwaWNrKCJkdXJhdGlvbiIsICJlcGlzb2RlX3J1bl90aW1lIiwgInJ1bnRpbWUiKQog
ICAgICAgIHZhbCBkdXJhdGlvbiA9IHJhd0R1cmF0aW9uLnRvSW50T3JOdWxsKCk/LmxldCB7ICIk
aXQgbWluIiB9ID86IHJhd0R1cmF0aW9uCiAgICAgICAgdmFsIGRlc2NyaXB0aW9uID0gcGljaygi
ZGVzY3JpcHRpb24iLCAicGxvdCIpLnJlcGxhY2UoUmVnZXgoIlxccysiKSwgIiAiKS50cmltKCkK
ICAgICAgICB2YWwgdHJhaWxlclZhbHVlID0gcGljaygieW91dHViZV90cmFpbGVyIiwgInRyYWls
ZXIiLCAidHJhaWxlcl91cmwiKQogICAgICAgIHZhbCB0cmFpbGVyVXJsID0gd2hlbiB7CiAgICAg
ICAgICAgIHRyYWlsZXJWYWx1ZS5pc0JsYW5rKCkgLT4gIiIKICAgICAgICAgICAgdHJhaWxlclZh
bHVlLnN0YXJ0c1dpdGgoImh0dHA6Ly8iLCB0cnVlKSB8fCB0cmFpbGVyVmFsdWUuc3RhcnRzV2l0
aCgiaHR0cHM6Ly8iLCB0cnVlKSAtPiB0cmFpbGVyVmFsdWUKICAgICAgICAgICAgZWxzZSAtPiAi
aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj0ke2VuYyh0cmFpbGVyVmFsdWUpfSIKICAg
ICAgICB9CgogICAgICAgIHJldHVybiBNb3ZpZURldGFpbHMoCiAgICAgICAgICAgIGlkID0gc3Ry
ZWFtSWQsCiAgICAgICAgICAgIG5hbWUgPSBwaWNrKCJuYW1lIiwgIm9fbmFtZSIsICJ0aXRsZSIp
LmlmQmxhbmsgeyAiTW92aWUiIH0sCiAgICAgICAgICAgIHBsYXlVcmwgPSBwbGF5VXJsLAogICAg
ICAgICAgICBwb3N0ZXJVcmwgPSBtZWRpYVVybChjLnNlcnZlciwgcGljaygiY292ZXJfYmlnIiwg
Im1vdmllX2ltYWdlIiwgImNvdmVyIiwgInN0cmVhbV9pY29uIikpLAogICAgICAgICAgICBiYWNr
ZHJvcFVybCA9IGZpcnN0QmFja2Ryb3AoKSwKICAgICAgICAgICAgeWVhciA9IHllYXIsCiAgICAg
ICAgICAgIHJhdGluZyA9IGNsZWFuUmF0aW5nKHBpY2soInJhdGluZ181YmFzZWQiLCAicmF0aW5n
IikpLAogICAgICAgICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uLAogICAgICAgICAgICBjZXJ0aWZp
Y2F0aW9uID0gcGljaygibXBhYV9yYXRpbmciLCAiYWdlIiwgImNlcnRpZmljYXRpb24iKSwKICAg
ICAgICAgICAgZ2VucmUgPSBwaWNrKCJnZW5yZSIpLAogICAgICAgICAgICBkZXNjcmlwdGlvbiA9
IGRlc2NyaXB0aW9uLAogICAgICAgICAgICBjYXN0ID0gcGljaygiYWN0b3JzIiwgImNhc3QiKSwK
ICAgICAgICAgICAgZGlyZWN0b3IgPSBwaWNrKCJkaXJlY3RvciIpLAogICAgICAgICAgICBjb3Vu
dHJ5ID0gcGljaygiY291bnRyeSIpLAogICAgICAgICAgICByZWxlYXNlRGF0ZSA9IHJlbGVhc2VE
YXRlLAogICAgICAgICAgICB0YWdsaW5lID0gcGljaygidGFnbGluZSIpLAogICAgICAgICAgICBj
YXRlZ29yeUlkID0gcGljaygiY2F0ZWdvcnlfaWQiKSwKICAgICAgICAgICAgdHJhaWxlclVybCA9
IHRyYWlsZXJVcmwKICAgICAgICApCiAgICB9CgogICAgZnVuIHNlcmllcyhjOiBYdHJlYW1DcmVk
ZW50aWFscywgY2F0ZWdvcnlJZDogU3RyaW5nPyA9IG51bGwpOiBMaXN0PExpYnJhcnlJdGVtPiB7
CiAgICAgICAgaWYgKERlbW9DYXRhbG9nLmlzRGVtbyhjKSkgcmV0dXJuIERlbW9DYXRhbG9nLnNl
cmllcyhjYXRlZ29yeUlkKQogICAgICAgIHZhbCBzYWZlQ2F0ZWdvcnlJZCA9IE91dGJvdW5kVXJs
UG9saWN5LnNhZmVRdWVyeVZhbHVlKGNhdGVnb3J5SWQpCiAgICAgICAgdmFsIHN1ZmZpeCA9IGlm
IChzYWZlQ2F0ZWdvcnlJZC5pc0JsYW5rKCkpICIiIGVsc2UgIiZjYXRlZ29yeV9pZD0ke2VuYyhz
YWZlQ2F0ZWdvcnlJZCl9IgogICAgICAgIHZhbCBhcnIgPSBKU09OQXJyYXkoZ2V0KCIke2Jhc2Uo
Yy5zZXJ2ZXIpfS9wbGF5ZXJfYXBpLnBocD91c2VybmFtZT0ke2VuYyhjLnVzZXJuYW1lKX0mcGFz
c3dvcmQ9JHtlbmMoYy5wYXNzd29yZCl9JmFjdGlvbj1nZXRfc2VyaWVzJHN1ZmZpeCIpKQogICAg
ICAgIHJldHVybiBidWlsZExpc3QgewogICAgICAgICAgICBmb3IgKGkgaW4gMCB1bnRpbCBhcnIu
bGVuZ3RoKCkpIHsKICAgICAgICAgICAgICAgIHZhbCBvID0gYXJyLmdldEpTT05PYmplY3QoaSkK
ICAgICAgICAgICAgICAgIHZhbCB5ZWFyID0gby5vcHRTdHJpbmcoInllYXIiKS5pZkJsYW5rIHsK
ICAgICAgICAgICAgICAgICAgICBvLm9wdFN0cmluZygicmVsZWFzZURhdGUiKS50cmltKCkudGFr
ZSg0KS50YWtlSWYgeyB2YWx1ZSAtPiB2YWx1ZS5hbGwgeyBjaCAtPiBjaC5pc0RpZ2l0KCkgfSB9
ID86ICIiCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB2YWwgcmF0aW5nID0gby5v
cHRTdHJpbmcoInJhdGluZ181YmFzZWQiKS5pZkJsYW5rIHsgby5vcHRTdHJpbmcoInJhdGluZyIp
IH0KICAgICAgICAgICAgICAgIGFkZChMaWJyYXJ5SXRlbSgKICAgICAgICAgICAgICAgICAgICBp
ZCA9IG8ub3B0SW50KCJzZXJpZXNfaWQiKSwKICAgICAgICAgICAgICAgICAgICBuYW1lID0gby5v
cHRTdHJpbmcoIm5hbWUiLCAiU2VyaWVzIiksCiAgICAgICAgICAgICAgICAgICAga2luZCA9ICJz
ZXJpZXMiLAogICAgICAgICAgICAgICAgICAgIHBsYXlVcmwgPSBudWxsLAogICAgICAgICAgICAg
ICAgICAgIGltYWdlVXJsID0gbWVkaWFVcmwoYy5zZXJ2ZXIsIG8ub3B0U3RyaW5nKCJjb3ZlciIp
KSwKICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeUlkID0gby5vcHRTdHJpbmcoImNhdGVnb3J5
X2lkIiksCiAgICAgICAgICAgICAgICAgICAgeWVhciA9IHllYXIsCiAgICAgICAgICAgICAgICAg
ICAgcmF0aW5nID0gY2xlYW5SYXRpbmcocmF0aW5nKQogICAgICAgICAgICAgICAgKSkKICAgICAg
ICAgICAgfQogICAgICAgIH0KICAgIH0KCiAgICAvKiogTG9hZHMgY29tcGxldGUgc2VyaWVzIGlu
Zm9ybWF0aW9uIGFuZCBldmVyeSBlcGlzb2RlIGZyb20gb25lIHByb3ZpZGVyIHJlcXVlc3QuICov
CiAgICBmdW4gc2VyaWVzQ29udGVudChjOiBYdHJlYW1DcmVkZW50aWFscywgc2VyaWVzSWQ6IElu
dCk6IFNlcmllc0NvbnRlbnQgewogICAgICAgIGlmIChEZW1vQ2F0YWxvZy5pc0RlbW8oYykpIHsK
ICAgICAgICAgICAgdmFsIGl0ZW0gPSBEZW1vQ2F0YWxvZy5zZXJpZXMuZmlyc3RPck51bGwgeyBp
dC5pZCA9PSBzZXJpZXNJZCB9CiAgICAgICAgICAgICAgICA/OiB0aHJvdyBJbGxlZ2FsU3RhdGVF
eGNlcHRpb24oIlNlcmllcyB3YXMgbm90IGZvdW5kIikKICAgICAgICAgICAgcmV0dXJuIFNlcmll
c0NvbnRlbnQoCiAgICAgICAgICAgICAgICBkZXRhaWxzID0gU2VyaWVzRGV0YWlscygKICAgICAg
ICAgICAgICAgICAgICBpZCA9IGl0ZW0uaWQsCiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGl0
ZW0ubmFtZSwKICAgICAgICAgICAgICAgICAgICB5ZWFyID0gaXRlbS55ZWFyLAogICAgICAgICAg
ICAgICAgICAgIHJhdGluZyA9IGl0ZW0ucmF0aW5nLAogICAgICAgICAgICAgICAgICAgIGdlbnJl
ID0gIktyaXN0YWwgU3RyZWFtcyBPcmlnaW5hbCIsCiAgICAgICAgICAgICAgICAgICAgZGVzY3Jp
cHRpb24gPSAiQSBmZWF0dXJlZCBzZXJpZXMgYXZhaWxhYmxlIGluIHRoZSBLcmlzdGFsIFN0cmVh
bXMgZGVtbyBjYXRhbG9nLiIsCiAgICAgICAgICAgICAgICAgICAgc3RhdHVzID0gIlJldHVybmlu
ZyBTZXJpZXMiLAogICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5SWQgPSBpdGVtLmNhdGVnb3J5
SWQsCiAgICAgICAgICAgICAgICAgICAgdHJhaWxlclVybCA9ICJodHRwczovL3d3dy55b3V0dWJl
LmNvbS9yZXN1bHRzP3NlYXJjaF9xdWVyeT0ke2VuYyhpdGVtLm5hbWUgKyAiIHRyYWlsZXIiKX0i
IAogICAgICAgICAgICAgICAgKSwKICAgICAgICAgICAgICAgIGVwaXNvZGVzID0gRGVtb0NhdGFs
b2cuZXBpc29kZXMoc2VyaWVzSWQpCiAgICAgICAgICAgICkKICAgICAgICB9CgogICAgICAgIGlm
IChzZXJpZXNJZCA8PSAwKSB0aHJvdyBJbGxlZ2FsQXJndW1lbnRFeGNlcHRpb24oIkludmFsaWQg
c2VyaWVzIGlkZW50aWZpZXIgd2FzIGJsb2NrZWQgbG9jYWxseS4iKQogICAgICAgIHZhbCByb290
ID0gSlNPTk9iamVjdChnZXQoIiR7YmFzZShjLnNlcnZlcil9L3BsYXllcl9hcGkucGhwP3VzZXJu
YW1lPSR7ZW5jKGMudXNlcm5hbWUpfSZwYXNzd29yZD0ke2VuYyhjLnBhc3N3b3JkKX0mYWN0aW9u
PWdldF9zZXJpZXNfaW5mbyZzZXJpZXNfaWQ9JHNlcmllc0lkIikpCiAgICAgICAgdmFsIGluZm8g
PSByb290Lm9wdEpTT05PYmplY3QoImluZm8iKSA/OiBKU09OT2JqZWN0KCkKCiAgICAgICAgZnVu
IHBpY2sodmFyYXJnIGtleXM6IFN0cmluZyk6IFN0cmluZyB7CiAgICAgICAgICAgIGtleXMuZm9y
RWFjaCB7IGtleSAtPgogICAgICAgICAgICAgICAgdmFsIHZhbHVlID0gaW5mby5vcHRTdHJpbmco
a2V5LCAiIikudHJpbSgpCiAgICAgICAgICAgICAgICBpZiAodmFsdWUuaXNOb3RCbGFuaygpICYm
ICF2YWx1ZS5lcXVhbHMoIm51bGwiLCB0cnVlKSkgcmV0dXJuIHZhbHVlCiAgICAgICAgICAgIH0K
ICAgICAgICAgICAgcmV0dXJuICIiCiAgICAgICAgfQoKICAgICAgICBmdW4gZmlyc3RCYWNrZHJv
cCgpOiBTdHJpbmcgewogICAgICAgICAgICB2YWwgcmF3ID0gaW5mby5vcHQoImJhY2tkcm9wX3Bh
dGgiKQogICAgICAgICAgICB2YWwgY2FuZGlkYXRlID0gd2hlbiAocmF3KSB7CiAgICAgICAgICAg
ICAgICBpcyBKU09OQXJyYXkgLT4gcmF3Lm9wdFN0cmluZygwLCAiIikKICAgICAgICAgICAgICAg
IGlzIFN0cmluZyAtPiB7CiAgICAgICAgICAgICAgICAgICAgdmFsIHZhbHVlID0gcmF3LnRyaW0o
KQogICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKCJbIikpIHsKICAgICAg
ICAgICAgICAgICAgICAgICAgdHJ5IHsgSlNPTkFycmF5KHZhbHVlKS5vcHRTdHJpbmcoMCwgIiIp
IH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikgeyB2YWx1ZSB9CiAgICAgICAgICAgICAgICAgICAgfSBl
bHNlIHZhbHVlCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICBlbHNlIC0+ICIiCiAg
ICAgICAgICAgIH0uaWZCbGFuayB7IHBpY2soImJhY2tkcm9wIiwgImJhY2tkcm9wX3VybCIpIH0K
ICAgICAgICAgICAgcmV0dXJuIG1lZGlhVXJsKGMuc2VydmVyLCBjYW5kaWRhdGUpCiAgICAgICAg
fQoKICAgICAgICB2YWwgcmVsZWFzZURhdGUgPSBwaWNrKCJyZWxlYXNlRGF0ZSIsICJyZWxlYXNl
ZGF0ZSIsICJyZWxlYXNlX2RhdGUiLCAiZmlyc3RfYWlyX2RhdGUiKQogICAgICAgIHZhbCByYXdZ
ZWFyID0gcGljaygieWVhciIpLmlmQmxhbmsgeyByZWxlYXNlRGF0ZS50YWtlKDQpIH0KICAgICAg
ICB2YWwgeWVhciA9IHJhd1llYXIudGFrZUlmIHsgaXQubGVuZ3RoID09IDQgJiYgaXQuYWxsKENo
YXI6OmlzRGlnaXQpIH0ub3JFbXB0eSgpCiAgICAgICAgdmFsIHRyYWlsZXJWYWx1ZSA9IHBpY2so
InlvdXR1YmVfdHJhaWxlciIsICJ0cmFpbGVyIiwgInRyYWlsZXJfdXJsIikKICAgICAgICB2YWwg
dHJhaWxlclVybCA9IHdoZW4gewogICAgICAgICAgICB0cmFpbGVyVmFsdWUuaXNCbGFuaygpIC0+
ICIiCiAgICAgICAgICAgIHRyYWlsZXJWYWx1ZS5zdGFydHNXaXRoKCJodHRwOi8vIiwgdHJ1ZSkg
fHwgdHJhaWxlclZhbHVlLnN0YXJ0c1dpdGgoImh0dHBzOi8vIiwgdHJ1ZSkgLT4gdHJhaWxlclZh
bHVlCiAgICAgICAgICAgIGVsc2UgLT4gImh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9
JHtlbmModHJhaWxlclZhbHVlKX0iCiAgICAgICAgfQoKICAgICAgICB2YWwgZGV0YWlscyA9IFNl
cmllc0RldGFpbHMoCiAgICAgICAgICAgIGlkID0gc2VyaWVzSWQsCiAgICAgICAgICAgIG5hbWUg
PSBwaWNrKCJuYW1lIiwgInRpdGxlIikuaWZCbGFuayB7ICJTZXJpZXMiIH0sCiAgICAgICAgICAg
IHBvc3RlclVybCA9IG1lZGlhVXJsKGMuc2VydmVyLCBwaWNrKCJjb3ZlciIsICJjb3Zlcl9iaWci
LCAibW92aWVfaW1hZ2UiKSksCiAgICAgICAgICAgIGJhY2tkcm9wVXJsID0gZmlyc3RCYWNrZHJv
cCgpLAogICAgICAgICAgICB5ZWFyID0geWVhciwKICAgICAgICAgICAgcmF0aW5nID0gY2xlYW5S
YXRpbmcocGljaygicmF0aW5nXzViYXNlZCIsICJyYXRpbmciKSksCiAgICAgICAgICAgIGdlbnJl
ID0gcGljaygiZ2VucmUiKSwKICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBwaWNrKCJwbG90Iiwg
ImRlc2NyaXB0aW9uIikucmVwbGFjZShSZWdleCgiXFxzKyIpLCAiICIpLnRyaW0oKSwKICAgICAg
ICAgICAgY2FzdCA9IHBpY2soImNhc3QiLCAiYWN0b3JzIiksCiAgICAgICAgICAgIGRpcmVjdG9y
ID0gcGljaygiZGlyZWN0b3IiKSwKICAgICAgICAgICAgcmVsZWFzZURhdGUgPSByZWxlYXNlRGF0
ZSwKICAgICAgICAgICAgbGFzdEFpckRhdGUgPSBwaWNrKCJsYXN0X2Fpcl9kYXRlIiksCiAgICAg
ICAgICAgIHN0YXR1cyA9IHBpY2soInN0YXR1cyIpLAogICAgICAgICAgICBjYXRlZ29yeUlkID0g
cGljaygiY2F0ZWdvcnlfaWQiKSwKICAgICAgICAgICAgdHJhaWxlclVybCA9IHRyYWlsZXJVcmwK
ICAgICAgICApCgogICAgICAgIHZhbCBlcGlzb2Rlc09iamVjdCA9IHJvb3Qub3B0SlNPTk9iamVj
dCgiZXBpc29kZXMiKSA/OiBKU09OT2JqZWN0KCkKICAgICAgICB2YWwgcmVzdWx0ID0gbXV0YWJs
ZUxpc3RPZjxFcGlzb2RlSXRlbT4oKQogICAgICAgIHZhbCBzZWFzb25LZXlzID0gZXBpc29kZXNP
YmplY3Qua2V5cygpCiAgICAgICAgd2hpbGUgKHNlYXNvbktleXMuaGFzTmV4dCgpKSB7CiAgICAg
ICAgICAgIHZhbCBzZWFzb25LZXkgPSBzZWFzb25LZXlzLm5leHQoKQogICAgICAgICAgICB2YWwg
c2Vhc29uID0gc2Vhc29uS2V5LnRvSW50T3JOdWxsKCkgPzogMAogICAgICAgICAgICB2YWwgYXJy
YXkgPSBlcGlzb2Rlc09iamVjdC5vcHRKU09OQXJyYXkoc2Vhc29uS2V5KSA/OiBjb250aW51ZQog
ICAgICAgICAgICBmb3IgKGluZGV4IGluIDAgdW50aWwgYXJyYXkubGVuZ3RoKCkpIHsKICAgICAg
ICAgICAgICAgIHZhbCBlcGlzb2RlT2JqZWN0ID0gYXJyYXkub3B0SlNPTk9iamVjdChpbmRleCkg
PzogY29udGludWUKICAgICAgICAgICAgICAgIHZhbCBlcGlzb2RlSW5mbyA9IGVwaXNvZGVPYmpl
Y3Qub3B0SlNPTk9iamVjdCgiaW5mbyIpID86IEpTT05PYmplY3QoKQogICAgICAgICAgICAgICAg
dmFsIGlkID0gZXBpc29kZU9iamVjdC5vcHRJbnQoImlkIikKICAgICAgICAgICAgICAgIHZhbCBl
cGlzb2RlTnVtYmVyID0gZXBpc29kZU9iamVjdC5vcHRJbnQoImVwaXNvZGVfbnVtIiwgaW5kZXgg
KyAxKQogICAgICAgICAgICAgICAgdmFsIGV4dGVuc2lvbiA9IE91dGJvdW5kVXJsUG9saWN5LnNh
ZmVFeHRlbnNpb24oZXBpc29kZU9iamVjdC5vcHRTdHJpbmcoImNvbnRhaW5lcl9leHRlbnNpb24i
LCAibXA0IiksICJtcDQiKQogICAgICAgICAgICAgICAgdmFsIHRpdGxlID0gZXBpc29kZU9iamVj
dC5vcHRTdHJpbmcoInRpdGxlIiwgIkVwaXNvZGUgJGVwaXNvZGVOdW1iZXIiKS5pZkJsYW5rIHsg
IkVwaXNvZGUgJGVwaXNvZGVOdW1iZXIiIH0KICAgICAgICAgICAgICAgIHZhbCBwbGF5VXJsID0g
T3V0Ym91bmRVcmxQb2xpY3kucHJvdmlkZXJQbGF5YmFja1VybCgKICAgICAgICAgICAgICAgICAg
ICBiYXNlKGMuc2VydmVyKSwgInNlcmllcyIsIGVuYyhjLnVzZXJuYW1lKSwgZW5jKGMucGFzc3dv
cmQpLCBpZCwgZXh0ZW5zaW9uLCAibXA0IgogICAgICAgICAgICAgICAgKQogICAgICAgICAgICAg
ICAgdmFsIGR1cmF0aW9uUmF3ID0gZXBpc29kZUluZm8ub3B0U3RyaW5nKCJkdXJhdGlvbiIpLmlm
QmxhbmsgeyBlcGlzb2RlSW5mby5vcHRTdHJpbmcoInJ1bnRpbWUiKSB9CiAgICAgICAgICAgICAg
ICB2YWwgZHVyYXRpb24gPSBkdXJhdGlvblJhdy50b0ludE9yTnVsbCgpPy5sZXQgeyAiJGl0IG1p
biIgfSA/OiBkdXJhdGlvblJhdwogICAgICAgICAgICAgICAgdmFsIGltYWdlID0gZXBpc29kZUlu
Zm8ub3B0U3RyaW5nKCJtb3ZpZV9pbWFnZSIpLmlmQmxhbmsgewogICAgICAgICAgICAgICAgICAg
IGVwaXNvZGVJbmZvLm9wdFN0cmluZygiY292ZXJfYmlnIikuaWZCbGFuayB7IGVwaXNvZGVJbmZv
Lm9wdFN0cmluZygiY292ZXIiKSB9CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICBy
ZXN1bHQuYWRkKEVwaXNvZGVJdGVtKAogICAgICAgICAgICAgICAgICAgIGlkID0gaWQsCiAgICAg
ICAgICAgICAgICAgICAgdGl0bGUgPSB0aXRsZSwKICAgICAgICAgICAgICAgICAgICBzZWFzb24g
PSBzZWFzb24sCiAgICAgICAgICAgICAgICAgICAgZXBpc29kZSA9IGVwaXNvZGVOdW1iZXIsCiAg
ICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uID0gZXh0ZW5zaW9uLAogICAgICAgICAgICAgICAg
ICAgIHBsYXlVcmwgPSBwbGF5VXJsLAogICAgICAgICAgICAgICAgICAgIGltYWdlVXJsID0gbWVk
aWFVcmwoYy5zZXJ2ZXIsIGltYWdlKSwKICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbiA9
IGVwaXNvZGVJbmZvLm9wdFN0cmluZygicGxvdCIpLmlmQmxhbmsgeyBlcGlzb2RlSW5mby5vcHRT
dHJpbmcoImRlc2NyaXB0aW9uIikgfS5yZXBsYWNlKFJlZ2V4KCJcXHMrIiksICIgIikudHJpbSgp
LAogICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24sCiAgICAgICAgICAgICAg
ICAgICAgYWlyRGF0ZSA9IGVwaXNvZGVJbmZvLm9wdFN0cmluZygicmVsZWFzZWRhdGUiKS5pZkJs
YW5rIHsgZXBpc29kZUluZm8ub3B0U3RyaW5nKCJhaXJfZGF0ZSIpIH0sCiAgICAgICAgICAgICAg
ICAgICAgcmF0aW5nID0gY2xlYW5SYXRpbmcoZXBpc29kZUluZm8ub3B0U3RyaW5nKCJyYXRpbmdf
NWJhc2VkIikuaWZCbGFuayB7IGVwaXNvZGVJbmZvLm9wdFN0cmluZygicmF0aW5nIikgfSkKICAg
ICAgICAgICAgICAgICkpCiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICAgICAgcmV0dXJuIFNl
cmllc0NvbnRlbnQoZGV0YWlscywgcmVzdWx0LnNvcnRlZFdpdGgoY29tcGFyZUJ5PEVwaXNvZGVJ
dGVtPiB7IGl0LnNlYXNvbiB9LnRoZW5CeSB7IGl0LmVwaXNvZGUgfSkpCiAgICB9CgogICAgZnVu
IHNlcmllc0VwaXNvZGVzKGM6IFh0cmVhbUNyZWRlbnRpYWxzLCBzZXJpZXNJZDogSW50KTogTGlz
dDxFcGlzb2RlSXRlbT4gPQogICAgICAgIHNlcmllc0NvbnRlbnQoYywgc2VyaWVzSWQpLmVwaXNv
ZGVzCgoKICAgIC8qKgogICAgICogRnVsbCBndWlkZSBmcm9tIHRoZSBwcm92aWRlcidzIFhNTFRW
IGZlZWQuCiAgICAgKgogICAgICogVXNlcyB0aGUgZXBnX2NoYW5uZWxfaWQgcmV0dXJuZWQgd2l0
aCBsaXZlIHN0cmVhbXMuIFRoaXMgaXMgZGVsaWJlcmF0ZWx5CiAgICAgKiBpbmRlcGVuZGVudCBv
ZiBzaG9ydEVwZygpL2dldF9zaW1wbGVfZGF0YV90YWJsZSBzbyBtYWxmb3JtZWQgcGVyLWNoYW5u
ZWwKICAgICAqIHJlc3BvbnNlcyBjYW5ub3QgY29sbGFwc2UgYSBmdWxsIHNjaGVkdWxlIGludG8g
dGhlIGZpcnN0IGhvdXIuCiAgICAgKi8KICAgIGZ1biB4bWxUdkd1aWRlKAogICAgICAgIGM6IFh0
cmVhbUNyZWRlbnRpYWxzLAogICAgICAgIGNoYW5uZWxJZHM6IFNldDxTdHJpbmc+LAogICAgICAg
IHdpbmRvd1N0YXJ0TXM6IExvbmcsCiAgICAgICAgd2luZG93RW5kTXM6IExvbmcKICAgICk6IE1h
cDxTdHJpbmcsIExpc3Q8RXBnSXRlbT4+IHsKICAgICAgICBpZiAoRGVtb0NhdGFsb2cuaXNEZW1v
KGMpIHx8IGNoYW5uZWxJZHMuaXNFbXB0eSgpKSByZXR1cm4gZW1wdHlNYXAoKQoKICAgICAgICB2
YWwgd2FudGVkID0gY2hhbm5lbElkcy5tYXAgeyBpdC50cmltKCkubG93ZXJjYXNlKExvY2FsZS5V
UykgfS5maWx0ZXIgeyBpdC5pc05vdEJsYW5rKCkgfS50b0hhc2hTZXQoKQogICAgICAgIGlmICh3
YW50ZWQuaXNFbXB0eSgpKSByZXR1cm4gZW1wdHlNYXAoKQoKICAgICAgICB2YWwgbG93ZXJTZWNv
bmRzID0gKHdpbmRvd1N0YXJ0TXMgLyAxMDAwTCkgLSAyICogMzYwMEwKICAgICAgICB2YWwgdXBw
ZXJTZWNvbmRzID0gKHdpbmRvd0VuZE1zIC8gMTAwMEwpICsgMiAqIDM2MDBMCiAgICAgICAgdmFs
IHJlc3VsdCA9IEhhc2hNYXA8U3RyaW5nLCBNdXRhYmxlTGlzdDxFcGdJdGVtPj4oKQogICAgICAg
IC8vIFRoZSBwcm92aWRlciBsYWJlbHMgdGhlc2UgdmFsdWVzIGFzIFVUQyBldmVuIHRob3VnaCB0
aGUgMTQtZGlnaXQKICAgICAgICAvLyBYTUxUViBjbG9jayB2YWx1ZXMgYXJlIGFscmVhZHkgbG9j
YWwgd2FsbC1jbG9jayB0aW1lLiBLZWVwIHRoZSBFUEcsCiAgICAgICAgLy8gdGltZWxpbmUgbGFi
ZWxzIGFuZCBOT1cgbWFya2VyIG9uIHRoZSBBbmRyb2lkIGRldmljZSdzIG9uZSBjbG9jay4KICAg
ICAgICB2YWwgZ3VpZGVUaW1lWm9uZSA9IFRpbWVab25lLmdldERlZmF1bHQoKQoKICAgICAgICB2
YWwgdXJsID0gIiR7YmFzZShjLnNlcnZlcil9L3htbHR2LnBocD91c2VybmFtZT0ke2VuYyhjLnVz
ZXJuYW1lKX0mcGFzc3dvcmQ9JHtlbmMoYy5wYXNzd29yZCl9IgogICAgICAgIHdpdGhJbnB1dFN0
cmVhbSh1cmwpIHsgaW5wdXQgLT4KICAgICAgICAgICAgdmFsIHBhcnNlciA9IFhtbC5uZXdQdWxs
UGFyc2VyKCkKICAgICAgICAgICAgcGFyc2VyLnNldElucHV0KElucHV0U3RyZWFtUmVhZGVyKGlu
cHV0LCBDaGFyc2V0cy5VVEZfOCkpCgogICAgICAgICAgICB2YXIgZXZlbnQgPSBwYXJzZXIuZXZl
bnRUeXBlCiAgICAgICAgICAgIHdoaWxlIChldmVudCAhPSBYbWxQdWxsUGFyc2VyLkVORF9ET0NV
TUVOVCkgewogICAgICAgICAgICAgICAgaWYgKGV2ZW50ID09IFhtbFB1bGxQYXJzZXIuU1RBUlRf
VEFHICYmIHBhcnNlci5uYW1lLmVxdWFscygicHJvZ3JhbW1lIiwgdHJ1ZSkpIHsKICAgICAgICAg
ICAgICAgICAgICB2YWwgY2hhbm5lbCA9IHBhcnNlci5nZXRBdHRyaWJ1dGVWYWx1ZShudWxsLCAi
Y2hhbm5lbCIpPy50cmltKCkub3JFbXB0eSgpCiAgICAgICAgICAgICAgICAgICAgdmFsIGNoYW5u
ZWxLZXkgPSBjaGFubmVsLmxvd2VyY2FzZShMb2NhbGUuVVMpCiAgICAgICAgICAgICAgICAgICAg
dmFsIHN0YXJ0UmF3ID0gcGFyc2VyLmdldEF0dHJpYnV0ZVZhbHVlKG51bGwsICJzdGFydCIpPy50
cmltKCkub3JFbXB0eSgpCiAgICAgICAgICAgICAgICAgICAgdmFsIHN0b3BSYXcgPSBwYXJzZXIu
Z2V0QXR0cmlidXRlVmFsdWUobnVsbCwgInN0b3AiKT8udHJpbSgpLm9yRW1wdHkoKQogICAgICAg
ICAgICAgICAgICAgIHZhbCBzdGFydFNlY29uZHMgPSBwYXJzZVhtbFR2U2Vjb25kcyhzdGFydFJh
dywgZ3VpZGVUaW1lWm9uZSkKICAgICAgICAgICAgICAgICAgICB2YWwgc3RvcFNlY29uZHMgPSBw
YXJzZVhtbFR2U2Vjb25kcyhzdG9wUmF3LCBndWlkZVRpbWVab25lKQoKICAgICAgICAgICAgICAg
ICAgICB2YXIgdGl0bGUgPSAiIgogICAgICAgICAgICAgICAgICAgIHZhciBkZXNjcmlwdGlvbiA9
ICIiCgogICAgICAgICAgICAgICAgICAgIHZhciBkZXB0aCA9IHBhcnNlci5kZXB0aAogICAgICAg
ICAgICAgICAgICAgIHZhciBpbm5lciA9IHBhcnNlci5uZXh0KCkKICAgICAgICAgICAgICAgICAg
ICB3aGlsZSAoIShpbm5lciA9PSBYbWxQdWxsUGFyc2VyLkVORF9UQUcgJiYgcGFyc2VyLmRlcHRo
ID09IGRlcHRoICYmIHBhcnNlci5uYW1lLmVxdWFscygicHJvZ3JhbW1lIiwgdHJ1ZSkpKSB7CiAg
ICAgICAgICAgICAgICAgICAgICAgIGlmIChpbm5lciA9PSBYbWxQdWxsUGFyc2VyLlNUQVJUX1RB
RykgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAocGFyc2VyLm5hbWUubG93ZXJj
YXNlKExvY2FsZS5VUykpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAidGl0bGUi
IC0+IHRpdGxlID0gcGFyc2VyLm5leHRUZXh0KCkudHJpbSgpCiAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgImRlc2MiIC0+IGRlc2NyaXB0aW9uID0gcGFyc2VyLm5leHRUZXh0KCkudHJp
bSgpCiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAgICAgICAg
IH0KICAgICAgICAgICAgICAgICAgICAgICAgaW5uZXIgPSBwYXJzZXIubmV4dCgpCiAgICAgICAg
ICAgICAgICAgICAgfQoKICAgICAgICAgICAgICAgICAgICBpZiAoCiAgICAgICAgICAgICAgICAg
ICAgICAgIGNoYW5uZWxLZXkgaW4gd2FudGVkICYmCiAgICAgICAgICAgICAgICAgICAgICAgIHN0
YXJ0U2Vjb25kcyAhPSBudWxsICYmCiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3BTZWNvbmRz
ICE9IG51bGwgJiYKICAgICAgICAgICAgICAgICAgICAgICAgc3RvcFNlY29uZHMgPiBzdGFydFNl
Y29uZHMgJiYKICAgICAgICAgICAgICAgICAgICAgICAgc3RvcFNlY29uZHMgPj0gbG93ZXJTZWNv
bmRzICYmCiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0U2Vjb25kcyA8PSB1cHBlclNlY29u
ZHMKICAgICAgICAgICAgICAgICAgICApIHsKICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0
LmdldE9yUHV0KGNoYW5uZWxLZXkpIHsgbXV0YWJsZUxpc3RPZigpIH0uYWRkKAogICAgICAgICAg
ICAgICAgICAgICAgICAgICAgRXBnSXRlbSgKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICB0aXRsZSA9IHRpdGxlLmlmQmxhbmsgeyAiUHJvZ3JhbSIgfSwKICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICBkZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uLAogICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgIHN0YXJ0ID0gc3RhcnRSYXcsCiAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgZW5kID0gc3RvcFJhdywKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBz
dGFydFRpbWVzdGFtcCA9IHN0YXJ0U2Vjb25kcywKICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICBlbmRUaW1lc3RhbXAgPSBzdG9wU2Vjb25kcwogICAgICAgICAgICAgICAgICAgICAgICAg
ICAgKQogICAgICAgICAgICAgICAgICAgICAgICApCiAgICAgICAgICAgICAgICAgICAgfQogICAg
ICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgZXZlbnQgPSBwYXJzZXIubmV4dCgpCiAgICAg
ICAgICAgIH0KICAgICAgICB9CgogICAgICAgIHJldHVybiByZXN1bHQubWFwVmFsdWVzIHsgKF8s
IGl0ZW1zKSAtPgogICAgICAgICAgICBpdGVtcwogICAgICAgICAgICAgICAgLmRpc3RpbmN0Qnkg
eyAiJHtpdC5zdGFydFRpbWVzdGFtcH18JHtpdC5lbmRUaW1lc3RhbXB9fCR7aXQudGl0bGV9IiB9
CiAgICAgICAgICAgICAgICAuc29ydGVkQnkgeyBpdC5zdGFydFRpbWVzdGFtcCA/OiBMb25nLk1B
WF9WQUxVRSB9CiAgICAgICAgfQogICAgfQoKICAgIC8qKgogICAgICogS2VlcCBhbGwgZ3VpZGUg
Y2xvY2tzIGluIHRoZSBBbmRyb2lkIGRldmljZSdzIGxvY2FsIHRpbWUgem9uZS4KICAgICAqCiAg
ICAgKiBUaGlzIHByb3ZpZGVyIGFkdmVydGlzZXMgVVRDIHdoaWxlIHNlbmRpbmcgbG9jYWwgd2Fs
bC1jbG9jayB2YWx1ZXMsIHNvCiAgICAgKiB0cnVzdGluZyBzZXJ2ZXJfaW5mby50aW1lem9uZSBt
b3ZlcyBldmVyeSBwcm9ncmFtbWUgYnkgZm91ciBob3Vycy4gUmVhZAogICAgICogdGhlIGZpcnN0
IDE0IFhNTFRWIGRpZ2l0cyBpbiB0aGUgc2FtZSBkZXZpY2Ugem9uZSB1c2VkIGJ5IHRoZSBndWlk
ZSdzCiAgICAgKiB0aW1lIGxhYmVscyBhbmQgTk9XIG1hcmtlci4gU3RhbmRhcmRzLWJhc2VkIHBh
cnNpbmcgcmVtYWlucyBhIGZhbGxiYWNrLgogICAgICovCiAgICBwcml2YXRlIGZ1biBwYXJzZVht
bFR2U2Vjb25kcyhyYXc6IFN0cmluZywgZ3VpZGVUaW1lWm9uZTogVGltZVpvbmUpOiBMb25nPyB7
CiAgICAgICAgdmFsIHZhbHVlID0gcmF3LnRyaW0oKQogICAgICAgIGlmICh2YWx1ZS5pc0JsYW5r
KCkpIHJldHVybiBudWxsCgogICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPj0gMTQpIHsKICAgICAg
ICAgICAgdHJ5IHsKICAgICAgICAgICAgICAgIHZhbCBwYXJzZXIgPSBTaW1wbGVEYXRlRm9ybWF0
KCJ5eXl5TU1kZEhIbW1zcyIsIExvY2FsZS5VUykuYXBwbHkgewogICAgICAgICAgICAgICAgICAg
IGlzTGVuaWVudCA9IGZhbHNlCiAgICAgICAgICAgICAgICAgICAgdGltZVpvbmUgPSBndWlkZVRp
bWVab25lCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VyLnBh
cnNlKHZhbHVlLnN1YnN0cmluZygwLCAxNCkpPy50aW1lPy5kaXYoMTAwMEwpCiAgICAgICAgICAg
IH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikgewogICAgICAgICAgICAgICAgLy8gRmFsbCB0aHJvdWdo
IHRvIHN0YW5kYXJkcy1iYXNlZCBYTUxUViBwYXJzaW5nLgogICAgICAgICAgICB9CiAgICAgICAg
fQoKICAgICAgICB2YWwgcGF0dGVybnMgPSBsaXN0T2YoCiAgICAgICAgICAgICJ5eXl5TU1kZEhI
bW1zcyBaIiwKICAgICAgICAgICAgInl5eXlNTWRkSEhtbSBaIiwKICAgICAgICAgICAgInl5eXlN
TWRkSEhtbXNzIiwKICAgICAgICAgICAgInl5eXlNTWRkSEhtbSIKICAgICAgICApCgogICAgICAg
IGZvciAocGF0dGVybiBpbiBwYXR0ZXJucykgewogICAgICAgICAgICB0cnkgewogICAgICAgICAg
ICAgICAgdmFsIHBhcnNlciA9IFNpbXBsZURhdGVGb3JtYXQocGF0dGVybiwgTG9jYWxlLlVTKS5h
cHBseSB7IGlzTGVuaWVudCA9IGZhbHNlIH0KICAgICAgICAgICAgICAgIHZhbCBwYXJzZWQgPSBw
YXJzZXIucGFyc2UodmFsdWUpID86IGNvbnRpbnVlCiAgICAgICAgICAgICAgICByZXR1cm4gcGFy
c2VkLnRpbWUgLyAxMDAwTAogICAgICAgICAgICB9IGNhdGNoIChfOiBFeGNlcHRpb24pIHsKICAg
ICAgICAgICAgICAgIC8vIFRyeSBuZXh0IFhNTFRWIHRpbWVzdGFtcCBmb3JtLgogICAgICAgICAg
ICB9CiAgICAgICAgfQogICAgICAgIHJldHVybiBudWxsCiAgICB9CgogICAgZnVuIHNob3J0RXBn
KGM6IFh0cmVhbUNyZWRlbnRpYWxzLCBzdHJlYW1JZDogSW50LCBsaW1pdDogSW50ID0gMik6IExp
c3Q8RXBnSXRlbT4gewogICAgICAgIGlmIChEZW1vQ2F0YWxvZy5pc0RlbW8oYykpIHJldHVybiBE
ZW1vQ2F0YWxvZy5lcGcoc3RyZWFtSWQpCiAgICAgICAgaWYgKHN0cmVhbUlkIDw9IDApIHJldHVy
biBlbXB0eUxpc3QoKQogICAgICAgIHZhbCBzYWZlTGltaXQgPSBsaW1pdC5jb2VyY2VJbigxLCAx
OTIpCiAgICAgICAgdmFsIHJvb3QgPSBKU09OT2JqZWN0KGdldCgiJHtiYXNlKGMuc2VydmVyKX0v
cGxheWVyX2FwaS5waHA/dXNlcm5hbWU9JHtlbmMoYy51c2VybmFtZSl9JnBhc3N3b3JkPSR7ZW5j
KGMucGFzc3dvcmQpfSZhY3Rpb249Z2V0X3Nob3J0X2VwZyZzdHJlYW1faWQ9JHN0cmVhbUlkJmxp
bWl0PSRzYWZlTGltaXQiKSkKICAgICAgICB2YWwgYXJyID0gcm9vdC5vcHRKU09OQXJyYXkoImVw
Z19saXN0aW5ncyIpID86IHJldHVybiBlbXB0eUxpc3QoKQogICAgICAgIHJldHVybiBidWlsZExp
c3QgewogICAgICAgICAgICBmb3IgKGkgaW4gMCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsKICAgICAg
ICAgICAgICAgIHZhbCBvID0gYXJyLm9wdEpTT05PYmplY3QoaSkgPzogY29udGludWUKICAgICAg
ICAgICAgICAgIHZhbCB0aXRsZSA9IGRlY29kZUVwZ1RleHQoby5vcHRTdHJpbmcoInRpdGxlIiwg
IlByb2dyYW0iKSwgIlByb2dyYW0iKQogICAgICAgICAgICAgICAgdmFsIGRlc2NyaXB0aW9uID0g
ZGVjb2RlRXBnVGV4dChvLm9wdFN0cmluZygiZGVzY3JpcHRpb24iLCAiIiksICIiKQogICAgICAg
ICAgICAgICAgYWRkKEVwZ0l0ZW0oCiAgICAgICAgICAgICAgICAgICAgdGl0bGUgPSB0aXRsZSwK
ICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uLAogICAgICAgICAg
ICAgICAgICAgIHN0YXJ0ID0gby5vcHRTdHJpbmcoInN0YXJ0IiwgIiIpLAogICAgICAgICAgICAg
ICAgICAgIGVuZCA9IG8ub3B0U3RyaW5nKCJlbmQiLCAiIiksCiAgICAgICAgICAgICAgICAgICAg
c3RhcnRUaW1lc3RhbXAgPSBlcGdUaW1lc3RhbXBTZWNvbmRzKG8sICJzdGFydF90aW1lc3RhbXAi
LCAic3RhcnRfdHMiKSwKICAgICAgICAgICAgICAgICAgICBlbmRUaW1lc3RhbXAgPSBlcGdUaW1l
c3RhbXBTZWNvbmRzKG8sICJzdG9wX3RpbWVzdGFtcCIsICJlbmRfdGltZXN0YW1wIiwgImVuZF90
cyIpCiAgICAgICAgICAgICAgICApKQogICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQoKCiAg
ICAvKioKICAgICAqIEZ1bGwgVFYgR3VpZGUgcmVxdWVzdCBwYXRoLgogICAgICoKICAgICAqIFRo
aXMgaXMgaW50ZW50aW9uYWxseSBzZXBhcmF0ZSBmcm9tIHNob3J0RXBnKCksIHNvIHRoZSBrbm93
bi1nb29kCiAgICAgKiBMaXZlIFRWIE5vdy9OZXh0IGJlaGF2aW9yIGluIFIyIGlzIGxlZnQgdW5j
aGFuZ2VkLgogICAgICovCiAgICBmdW4gZ3VpZGVFcGcoYzogWHRyZWFtQ3JlZGVudGlhbHMsIHN0
cmVhbUlkOiBJbnQsIGxpbWl0OiBJbnQgPSA5Nik6IExpc3Q8RXBnSXRlbT4gewogICAgICAgIGlm
IChEZW1vQ2F0YWxvZy5pc0RlbW8oYykpIHJldHVybiBEZW1vQ2F0YWxvZy5lcGcoc3RyZWFtSWQp
CiAgICAgICAgaWYgKHN0cmVhbUlkIDw9IDApIHJldHVybiBlbXB0eUxpc3QoKQoKICAgICAgICB2
YWwgc2FmZUxpbWl0ID0gbGltaXQuY29lcmNlSW4oOCwgMTkyKQoKICAgICAgICB2YWwgcHJpbWFy
eSA9IHJ1bkNhdGNoaW5nIHsKICAgICAgICAgICAgZmV0Y2hHdWlkZUFjdGlvbihjLCBzdHJlYW1J
ZCwgImdldF9zaW1wbGVfZGF0YV90YWJsZSIsIG51bGwpCiAgICAgICAgfS5nZXRPckRlZmF1bHQo
ZW1wdHlMaXN0KCkpCgogICAgICAgIGlmIChoYXNGdWxsR3VpZGVEZXB0aChwcmltYXJ5KSkgewog
ICAgICAgICAgICByZXR1cm4gbm9ybWFsaXplR3VpZGVFcGcocHJpbWFyeSwgc2FmZUxpbWl0KQog
ICAgICAgIH0KCiAgICAgICAgdmFsIGFsdGVybmF0ZSA9IHJ1bkNhdGNoaW5nIHsKICAgICAgICAg
ICAgZmV0Y2hHdWlkZUFjdGlvbihjLCBzdHJlYW1JZCwgImdldF9zaW1wbGVfZGF0ZV90YWJsZSIs
IG51bGwpCiAgICAgICAgfS5nZXRPckRlZmF1bHQoZW1wdHlMaXN0KCkpCgogICAgICAgIHZhbCBm
dWxsQ29tYmluZWQgPSBtZXJnZUd1aWRlRXBnKHByaW1hcnksIGFsdGVybmF0ZSkKICAgICAgICBp
ZiAoaGFzRnVsbEd1aWRlRGVwdGgoZnVsbENvbWJpbmVkKSkgewogICAgICAgICAgICByZXR1cm4g
bm9ybWFsaXplR3VpZGVFcGcoZnVsbENvbWJpbmVkLCBzYWZlTGltaXQpCiAgICAgICAgfQoKICAg
ICAgICAvLyBMYXN0IHJlc29ydCBvbmx5LiBTb21lIHBhbmVscyBob25vciBhIGxhcmdlIHNob3J0
LUVQRyBsaW1pdCwgd2hpbGUKICAgICAgICAvLyBvdGhlcnMgY2FwIHRoaXMgZW5kcG9pbnQgYXQg
Tm93L05leHQuIE1lcmdlIHdoYXRldmVyIGl0IHJldHVybnMgd2l0aAogICAgICAgIC8vIHRoZSBm
dWxsLXRhYmxlIHJlc3VsdHMgaW5zdGVhZCBvZiBkaXNjYXJkaW5nIGVpdGhlciBzb3VyY2UuCiAg
ICAgICAgdmFsIHNob3J0RmFsbGJhY2sgPSBydW5DYXRjaGluZyB7CiAgICAgICAgICAgIGZldGNo
R3VpZGVBY3Rpb24oYywgc3RyZWFtSWQsICJnZXRfc2hvcnRfZXBnIiwgbWF4T2Yoc2FmZUxpbWl0
LCA5NikpCiAgICAgICAgfS5nZXRPckRlZmF1bHQoZW1wdHlMaXN0KCkpCgogICAgICAgIHJldHVy
biBub3JtYWxpemVHdWlkZUVwZygKICAgICAgICAgICAgbWVyZ2VHdWlkZUVwZyhmdWxsQ29tYmlu
ZWQsIHNob3J0RmFsbGJhY2spLAogICAgICAgICAgICBzYWZlTGltaXQKICAgICAgICApCiAgICB9
CgogICAgcHJpdmF0ZSBmdW4gZmV0Y2hHdWlkZUFjdGlvbigKICAgICAgICBjOiBYdHJlYW1DcmVk
ZW50aWFscywKICAgICAgICBzdHJlYW1JZDogSW50LAogICAgICAgIGFjdGlvbjogU3RyaW5nLAog
ICAgICAgIGxpbWl0OiBJbnQ/CiAgICApOiBMaXN0PEVwZ0l0ZW0+IHsKICAgICAgICBpZiAoc3Ry
ZWFtSWQgPD0gMCB8fCBhY3Rpb24gIWluIHNldE9mKCJnZXRfc2ltcGxlX2RhdGFfdGFibGUiLCAi
Z2V0X3NpbXBsZV9kYXRlX3RhYmxlIiwgImdldF9zaG9ydF9lcGciKSkgewogICAgICAgICAgICBy
ZXR1cm4gZW1wdHlMaXN0KCkKICAgICAgICB9CiAgICAgICAgdmFsIGxpbWl0UGFydCA9IGxpbWl0
Py5sZXQgeyAiJmxpbWl0PSRpdCIgfS5vckVtcHR5KCkKICAgICAgICB2YWwgYm9keSA9IGdldCgK
ICAgICAgICAgICAgIiR7YmFzZShjLnNlcnZlcil9L3BsYXllcl9hcGkucGhwP3VzZXJuYW1lPSR7
ZW5jKGMudXNlcm5hbWUpfSZwYXNzd29yZD0ke2VuYyhjLnBhc3N3b3JkKX0iICsKICAgICAgICAg
ICAgICAgICImYWN0aW9uPSRhY3Rpb24mc3RyZWFtX2lkPSRzdHJlYW1JZCRsaW1pdFBhcnQiCiAg
ICAgICAgKS50cmltKCkKCiAgICAgICAgaWYgKGJvZHkuaXNCbGFuaygpKSByZXR1cm4gZW1wdHlM
aXN0KCkKCiAgICAgICAgdmFsIGFyciA9IGV4dHJhY3RHdWlkZUFycmF5KGJvZHkpCiAgICAgICAg
aWYgKGFyci5sZW5ndGgoKSA9PSAwKSByZXR1cm4gZW1wdHlMaXN0KCkKCiAgICAgICAgcmV0dXJu
IGJ1aWxkTGlzdCB7CiAgICAgICAgICAgIGZvciAoaSBpbiAwIHVudGlsIGFyci5sZW5ndGgoKSkg
ewogICAgICAgICAgICAgICAgdmFsIG8gPSBhcnIub3B0SlNPTk9iamVjdChpKSA/OiBjb250aW51
ZQoKICAgICAgICAgICAgICAgIHZhbCB0aXRsZSA9IGRlY29kZUVwZ1RleHQoCiAgICAgICAgICAg
ICAgICAgICAgZmlyc3RHdWlkZVN0cmluZyhvLCAidGl0bGUiLCAibmFtZSIsICJwcm9ncmFtIiwg
InByb2dyYW1tZSIpCiAgICAgICAgICAgICAgICAgICAgICAgIC5pZkJsYW5rIHsgIlByb2dyYW0i
IH0sCiAgICAgICAgICAgICAgICAgICAgIlByb2dyYW0iCiAgICAgICAgICAgICAgICApCiAgICAg
ICAgICAgICAgICB2YWwgZGVzY3JpcHRpb24gPSBkZWNvZGVFcGdUZXh0KAogICAgICAgICAgICAg
ICAgICAgIGZpcnN0R3VpZGVTdHJpbmcobywgImRlc2NyaXB0aW9uIiwgImRlc2MiLCAicGxvdCIp
LAogICAgICAgICAgICAgICAgICAgICIiCiAgICAgICAgICAgICAgICApCgogICAgICAgICAgICAg
ICAgdmFsIHN0YXJ0VGV4dCA9IGZpcnN0R3VpZGVTdHJpbmcoCiAgICAgICAgICAgICAgICAgICAg
bywKICAgICAgICAgICAgICAgICAgICAic3RhcnQiLAogICAgICAgICAgICAgICAgICAgICJzdGFy
dF9kYXRlIiwKICAgICAgICAgICAgICAgICAgICAic3RhcnRfZGF0ZXRpbWUiLAogICAgICAgICAg
ICAgICAgICAgICJiZWdpbiIsCiAgICAgICAgICAgICAgICAgICAgImJlZ2luX3RpbWUiCiAgICAg
ICAgICAgICAgICApCiAgICAgICAgICAgICAgICB2YWwgZW5kVGV4dCA9IGZpcnN0R3VpZGVTdHJp
bmcoCiAgICAgICAgICAgICAgICAgICAgbywKICAgICAgICAgICAgICAgICAgICAiZW5kIiwKICAg
ICAgICAgICAgICAgICAgICAic3RvcCIsCiAgICAgICAgICAgICAgICAgICAgImVuZF9kYXRlIiwK
ICAgICAgICAgICAgICAgICAgICAiZW5kX2RhdGV0aW1lIiwKICAgICAgICAgICAgICAgICAgICAi
c3RvcF9kYXRlIiwKICAgICAgICAgICAgICAgICAgICAic3RvcF9kYXRldGltZSIKICAgICAgICAg
ICAgICAgICkKCiAgICAgICAgICAgICAgICB2YWwgc3RhcnRUcyA9IGd1aWRlVGltZXN0YW1wU2Vj
b25kcygKICAgICAgICAgICAgICAgICAgICBvLAogICAgICAgICAgICAgICAgICAgICJzdGFydF90
aW1lc3RhbXAiLAogICAgICAgICAgICAgICAgICAgICJzdGFydF90cyIsCiAgICAgICAgICAgICAg
ICAgICAgInN0YXJ0X3VuaXgiLAogICAgICAgICAgICAgICAgICAgICJzdGFydF9lcG9jaCIKICAg
ICAgICAgICAgICAgICkgPzogcGFyc2VHdWlkZURhdGVTZWNvbmRzKHN0YXJ0VGV4dCkKCiAgICAg
ICAgICAgICAgICB2YWwgZW5kVHMgPSBndWlkZVRpbWVzdGFtcFNlY29uZHMoCiAgICAgICAgICAg
ICAgICAgICAgbywKICAgICAgICAgICAgICAgICAgICAic3RvcF90aW1lc3RhbXAiLAogICAgICAg
ICAgICAgICAgICAgICJlbmRfdGltZXN0YW1wIiwKICAgICAgICAgICAgICAgICAgICAiZW5kX3Rz
IiwKICAgICAgICAgICAgICAgICAgICAic3RvcF90cyIsCiAgICAgICAgICAgICAgICAgICAgImVu
ZF91bml4IiwKICAgICAgICAgICAgICAgICAgICAic3RvcF91bml4IiwKICAgICAgICAgICAgICAg
ICAgICAiZW5kX2Vwb2NoIgogICAgICAgICAgICAgICAgKSA/OiBwYXJzZUd1aWRlRGF0ZVNlY29u
ZHMoZW5kVGV4dCkKCiAgICAgICAgICAgICAgICBhZGQoCiAgICAgICAgICAgICAgICAgICAgRXBn
SXRlbSgKICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGUgPSB0aXRsZSwKICAgICAgICAgICAg
ICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbiwKICAgICAgICAgICAgICAgICAg
ICAgICAgc3RhcnQgPSBzdGFydFRleHQsCiAgICAgICAgICAgICAgICAgICAgICAgIGVuZCA9IGVu
ZFRleHQsCiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VGltZXN0YW1wID0gc3RhcnRUcywK
ICAgICAgICAgICAgICAgICAgICAgICAgZW5kVGltZXN0YW1wID0gZW5kVHMKICAgICAgICAgICAg
ICAgICAgICApCiAgICAgICAgICAgICAgICApCiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9
CgogICAgcHJpdmF0ZSBmdW4gZXh0cmFjdEd1aWRlQXJyYXkoYm9keTogU3RyaW5nKTogSlNPTkFy
cmF5IHsKICAgICAgICBpZiAoYm9keS5zdGFydHNXaXRoKCJbIikpIHsKICAgICAgICAgICAgcmV0
dXJuIHJ1bkNhdGNoaW5nIHsgSlNPTkFycmF5KGJvZHkpIH0uZ2V0T3JEZWZhdWx0KEpTT05BcnJh
eSgpKQogICAgICAgIH0KCiAgICAgICAgdmFsIHJvb3QgPSBydW5DYXRjaGluZyB7IEpTT05PYmpl
Y3QoYm9keSkgfS5nZXRPck51bGwoKSA/OiByZXR1cm4gSlNPTkFycmF5KCkKCiAgICAgICAgcm9v
dC5vcHRKU09OQXJyYXkoImVwZ19saXN0aW5ncyIpPy5sZXQgeyByZXR1cm4gaXQgfQogICAgICAg
IHJvb3Qub3B0SlNPTkFycmF5KCJsaXN0aW5ncyIpPy5sZXQgeyByZXR1cm4gaXQgfQogICAgICAg
IHJvb3Qub3B0SlNPTkFycmF5KCJlcGciKT8ubGV0IHsgcmV0dXJuIGl0IH0KICAgICAgICByb290
Lm9wdEpTT05BcnJheSgiZGF0YSIpPy5sZXQgeyByZXR1cm4gaXQgfQoKICAgICAgICB2YWwgZGF0
YSA9IHJvb3Qub3B0SlNPTk9iamVjdCgiZGF0YSIpCiAgICAgICAgZGF0YT8ub3B0SlNPTkFycmF5
KCJlcGdfbGlzdGluZ3MiKT8ubGV0IHsgcmV0dXJuIGl0IH0KICAgICAgICBkYXRhPy5vcHRKU09O
QXJyYXkoImxpc3RpbmdzIik/LmxldCB7IHJldHVybiBpdCB9CiAgICAgICAgZGF0YT8ub3B0SlNP
TkFycmF5KCJlcGciKT8ubGV0IHsgcmV0dXJuIGl0IH0KCiAgICAgICAgdmFsIHJlc3VsdCA9IHJv
b3Qub3B0SlNPTk9iamVjdCgicmVzdWx0IikKICAgICAgICByZXN1bHQ/Lm9wdEpTT05BcnJheSgi
ZXBnX2xpc3RpbmdzIik/LmxldCB7IHJldHVybiBpdCB9CiAgICAgICAgcmVzdWx0Py5vcHRKU09O
QXJyYXkoImxpc3RpbmdzIik/LmxldCB7IHJldHVybiBpdCB9CgogICAgICAgIHJldHVybiBKU09O
QXJyYXkoKQogICAgfQoKICAgIHByaXZhdGUgZnVuIGZpcnN0R3VpZGVTdHJpbmcobzogSlNPTk9i
amVjdCwgdmFyYXJnIGtleXM6IFN0cmluZyk6IFN0cmluZyB7CiAgICAgICAgZm9yIChrZXkgaW4g
a2V5cykgewogICAgICAgICAgICB2YWwgdmFsdWUgPSBvLm9wdFN0cmluZyhrZXksICIiKS50cmlt
KCkKICAgICAgICAgICAgaWYgKHZhbHVlLmlzTm90QmxhbmsoKSAmJiAhdmFsdWUuZXF1YWxzKCJu
dWxsIiwgdHJ1ZSkpIHJldHVybiB2YWx1ZQogICAgICAgIH0KICAgICAgICByZXR1cm4gIiIKICAg
IH0KCiAgICBwcml2YXRlIGZ1biBndWlkZVRpbWVzdGFtcFNlY29uZHMobzogSlNPTk9iamVjdCwg
dmFyYXJnIGtleXM6IFN0cmluZyk6IExvbmc/IHsKICAgICAgICBmb3IgKGtleSBpbiBrZXlzKSB7
CiAgICAgICAgICAgIHZhbCByYXcgPSBvLm9wdChrZXkpCiAgICAgICAgICAgIHZhbCBzZWNvbmRz
ID0gd2hlbiAocmF3KSB7CiAgICAgICAgICAgICAgICBpcyBOdW1iZXIgLT4gbm9ybWFsaXplR3Vp
ZGVFcG9jaChyYXcudG9Mb25nKCkpCiAgICAgICAgICAgICAgICBpcyBTdHJpbmcgLT4gcGFyc2VH
dWlkZURhdGVTZWNvbmRzKHJhdykKICAgICAgICAgICAgICAgIGVsc2UgLT4gbnVsbAogICAgICAg
ICAgICB9CiAgICAgICAgICAgIGlmIChzZWNvbmRzICE9IG51bGwgJiYgc2Vjb25kcyA+IDBMKSBy
ZXR1cm4gc2Vjb25kcwogICAgICAgIH0KICAgICAgICByZXR1cm4gbnVsbAogICAgfQoKICAgIHBy
aXZhdGUgZnVuIG5vcm1hbGl6ZUd1aWRlRXBvY2godmFsdWU6IExvbmcpOiBMb25nPyB7CiAgICAg
ICAgaWYgKHZhbHVlIDw9IDBMKSByZXR1cm4gbnVsbAogICAgICAgIHJldHVybiBpZiAodmFsdWUg
PiAxMDBfMDAwXzAwMF8wMDBMKSB2YWx1ZSAvIDEwMDBMIGVsc2UgdmFsdWUKICAgIH0KCiAgICBw
cml2YXRlIGZ1biBwYXJzZUd1aWRlRGF0ZVNlY29uZHMocmF3OiBTdHJpbmcpOiBMb25nPyB7CiAg
ICAgICAgdmFsIHZhbHVlID0gcmF3LnRyaW0oKQogICAgICAgIGlmICh2YWx1ZS5pc0JsYW5rKCkg
fHwgdmFsdWUuZXF1YWxzKCJudWxsIiwgdHJ1ZSkpIHJldHVybiBudWxsCgogICAgICAgIHZhbHVl
LnRvTG9uZ09yTnVsbCgpPy5sZXQgeyByZXR1cm4gbm9ybWFsaXplR3VpZGVFcG9jaChpdCkgfQoK
ICAgICAgICB2YWwgcGF0dGVybnMgPSBsaXN0T2YoCiAgICAgICAgICAgICJ5eXl5LU1NLWRkIEhI
Om1tOnNzIiwKICAgICAgICAgICAgInl5eXktTU0tZGQgSEg6bW0iLAogICAgICAgICAgICAieXl5
eS1NTS1kZCBISDptbTpzcyBaIiwKICAgICAgICAgICAgInl5eXktTU0tZGQnVCdISDptbTpzc1hY
WCIsCiAgICAgICAgICAgICJ5eXl5LU1NLWRkJ1QnSEg6bW06c3MuU1NTWFhYIiwKICAgICAgICAg
ICAgInl5eXktTU0tZGQnVCdISDptbTpzc1giLAogICAgICAgICAgICAieXl5eU1NZGRISG1tc3Mg
WiIsCiAgICAgICAgICAgICJ5eXl5TU1kZEhIbW1zcyIKICAgICAgICApCgogICAgICAgIGZvciAo
cGF0dGVybiBpbiBwYXR0ZXJucykgewogICAgICAgICAgICB0cnkgewogICAgICAgICAgICAgICAg
dmFsIHBhcnNlciA9IFNpbXBsZURhdGVGb3JtYXQocGF0dGVybiwgTG9jYWxlLlVTKS5hcHBseSB7
CiAgICAgICAgICAgICAgICAgICAgaXNMZW5pZW50ID0gZmFsc2UKICAgICAgICAgICAgICAgIH0K
ICAgICAgICAgICAgICAgIHZhbCBwYXJzZWQgPSBwYXJzZXIucGFyc2UodmFsdWUpID86IGNvbnRp
bnVlCiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VkLnRpbWUgLyAxMDAwTAogICAgICAgICAg
ICB9IGNhdGNoIChfOiBFeGNlcHRpb24pIHsKICAgICAgICAgICAgICAgIC8vIFRyeSB0aGUgbmV4
dCBwcm92aWRlciBkYXRlIGZvcm1hdC4KICAgICAgICAgICAgfQogICAgICAgIH0KICAgICAgICBy
ZXR1cm4gbnVsbAogICAgfQoKICAgIHByaXZhdGUgZnVuIG1lcmdlR3VpZGVFcGcodmFyYXJnIGxp
c3RzOiBMaXN0PEVwZ0l0ZW0+KTogTGlzdDxFcGdJdGVtPiB7CiAgICAgICAgcmV0dXJuIGxpc3Rz
LmFzU2VxdWVuY2UoKQogICAgICAgICAgICAuZmxhdHRlbigpCiAgICAgICAgICAgIC5kaXN0aW5j
dEJ5IHsgaXRlbSAtPgogICAgICAgICAgICAgICAgIiR7aXRlbS5zdGFydFRpbWVzdGFtcCA/OiBp
dGVtLnN0YXJ0fXwke2l0ZW0uZW5kVGltZXN0YW1wID86IGl0ZW0uZW5kfXwke2l0ZW0udGl0bGV9
IgogICAgICAgICAgICB9CiAgICAgICAgICAgIC50b0xpc3QoKQogICAgfQoKICAgIHByaXZhdGUg
ZnVuIG5vcm1hbGl6ZUd1aWRlRXBnKGl0ZW1zOiBMaXN0PEVwZ0l0ZW0+LCBsaW1pdDogSW50KTog
TGlzdDxFcGdJdGVtPiB7CiAgICAgICAgaWYgKGl0ZW1zLmlzRW1wdHkoKSkgcmV0dXJuIGVtcHR5
TGlzdCgpCgogICAgICAgIHZhbCBkZWR1cGVkID0gbWVyZ2VHdWlkZUVwZyhpdGVtcykKICAgICAg
ICB2YWwgaGFzVGltZXN0YW1wcyA9IGRlZHVwZWQuYW55IHsgaXQuc3RhcnRUaW1lc3RhbXAgIT0g
bnVsbCB9CgogICAgICAgIHZhbCBzb3J0ZWQgPSBpZiAoaGFzVGltZXN0YW1wcykgewogICAgICAg
ICAgICBkZWR1cGVkLnNvcnRlZFdpdGgoCiAgICAgICAgICAgICAgICBjb21wYXJlQnk8RXBnSXRl
bT4geyBpdC5zdGFydFRpbWVzdGFtcCA/OiBMb25nLk1BWF9WQUxVRSB9CiAgICAgICAgICAgICAg
ICAgICAgLnRoZW5CeSB7IGl0LmVuZFRpbWVzdGFtcCA/OiBMb25nLk1BWF9WQUxVRSB9CiAgICAg
ICAgICAgICkKICAgICAgICB9IGVsc2UgewogICAgICAgICAgICBkZWR1cGVkCiAgICAgICAgfQoK
ICAgICAgICB2YWwgbm93ID0gU3lzdGVtLmN1cnJlbnRUaW1lTWlsbGlzKCkgLyAxMDAwTAoKICAg
ICAgICB2YWwgY3VycmVudEluZGV4ID0gc29ydGVkLmluZGV4T2ZGaXJzdCB7IGl0ZW0gLT4KICAg
ICAgICAgICAgdmFsIHN0YXJ0ID0gaXRlbS5zdGFydFRpbWVzdGFtcAogICAgICAgICAgICB2YWwg
ZW5kID0gaXRlbS5lbmRUaW1lc3RhbXAKICAgICAgICAgICAgc3RhcnQgIT0gbnVsbCAmJiBlbmQg
IT0gbnVsbCAmJiBub3cgPj0gc3RhcnQgJiYgbm93IDwgZW5kCiAgICAgICAgfQogICAgICAgIGlm
IChjdXJyZW50SW5kZXggPj0gMCkgewogICAgICAgICAgICByZXR1cm4gc29ydGVkLmRyb3AoY3Vy
cmVudEluZGV4KS50YWtlKGxpbWl0KQogICAgICAgIH0KCiAgICAgICAgdmFsIHVwY29taW5nSW5k
ZXggPSBzb3J0ZWQuaW5kZXhPZkZpcnN0IHsgaXRlbSAtPgogICAgICAgICAgICB2YWwgc3RhcnQg
PSBpdGVtLnN0YXJ0VGltZXN0YW1wCiAgICAgICAgICAgIHN0YXJ0ICE9IG51bGwgJiYgc3RhcnQg
Pj0gbm93CiAgICAgICAgfQogICAgICAgIGlmICh1cGNvbWluZ0luZGV4ID49IDApIHsKICAgICAg
ICAgICAgcmV0dXJuIHNvcnRlZC5kcm9wKHVwY29taW5nSW5kZXgpLnRha2UobGltaXQpCiAgICAg
ICAgfQoKICAgICAgICByZXR1cm4gc29ydGVkLnRha2VMYXN0KGxpbWl0KQogICAgfQoKICAgIHBy
aXZhdGUgZnVuIGhhc0Z1bGxHdWlkZURlcHRoKGl0ZW1zOiBMaXN0PEVwZ0l0ZW0+KTogQm9vbGVh
biB7CiAgICAgICAgaWYgKGl0ZW1zLmlzRW1wdHkoKSkgcmV0dXJuIGZhbHNlCgogICAgICAgIHZh
bCBub3cgPSBTeXN0ZW0uY3VycmVudFRpbWVNaWxsaXMoKSAvIDEwMDBMCiAgICAgICAgdmFsIHJl
bGV2YW50ID0gaXRlbXMuZmlsdGVyIHsgaXRlbSAtPgogICAgICAgICAgICB2YWwgc3RhcnQgPSBp
dGVtLnN0YXJ0VGltZXN0YW1wCiAgICAgICAgICAgIHZhbCBlbmQgPSBpdGVtLmVuZFRpbWVzdGFt
cAogICAgICAgICAgICBzdGFydCAhPSBudWxsICYmCiAgICAgICAgICAgICAgICBlbmQgIT0gbnVs
bCAmJgogICAgICAgICAgICAgICAgZW5kID49IG5vdyAtIDIgKiAzNjAwTCAmJgogICAgICAgICAg
ICAgICAgc3RhcnQgPD0gbm93ICsgMTIgKiAzNjAwTAogICAgICAgIH0KCiAgICAgICAgaWYgKHJl
bGV2YW50LmlzTm90RW1wdHkoKSkgewogICAgICAgICAgICB2YWwgZWFybGllc3QgPSByZWxldmFu
dC5taW5PZiB7IGl0LnN0YXJ0VGltZXN0YW1wID86IExvbmcuTUFYX1ZBTFVFIH0KICAgICAgICAg
ICAgdmFsIGxhdGVzdCA9IHJlbGV2YW50Lm1heE9mIHsgaXQuZW5kVGltZXN0YW1wID86IExvbmcu
TUlOX1ZBTFVFIH0KICAgICAgICAgICAgaWYgKGxhdGVzdCA+IGVhcmxpZXN0ICYmIGxhdGVzdCAt
IGVhcmxpZXN0ID49IDQgKiAzNjAwTCkgcmV0dXJuIHRydWUKICAgICAgICB9CgogICAgICAgIC8v
IElmIHRpbWVzdGFtcHMgYXJlIHVuYXZhaWxhYmxlIGJ1dCB0aGUgcHJvdmlkZXIgcmV0dXJuZWQg
YSBzdWJzdGFudGlhbAogICAgICAgIC8vIHNlcXVlbmNlIG9mIHByb2dyYW1zLCB0cmVhdCBpdCBh
cyBhIGZ1bGwgZ3VpZGUgcmF0aGVyIHRoYW4gZm9yY2luZwogICAgICAgIC8vIGFub3RoZXIgZW5k
cG9pbnQgcmVxdWVzdC4KICAgICAgICByZXR1cm4gaXRlbXMuc2l6ZSA+PSAxMgogICAgfQoKCgog
ICAgcHJpdmF0ZSBmdW4gZXBnVGltZXN0YW1wU2Vjb25kcyhvOiBKU09OT2JqZWN0LCB2YXJhcmcg
a2V5czogU3RyaW5nKTogTG9uZz8gewogICAgICAgIGZvciAoa2V5IGluIGtleXMpIHsKICAgICAg
ICAgICAgdmFsIHJhdyA9IG8ub3B0KGtleSkKICAgICAgICAgICAgdmFsIHZhbHVlID0gd2hlbiAo
cmF3KSB7CiAgICAgICAgICAgICAgICBpcyBOdW1iZXIgLT4gcmF3LnRvTG9uZygpCiAgICAgICAg
ICAgICAgICBpcyBTdHJpbmcgLT4gcmF3LnRyaW0oKS50b0xvbmdPck51bGwoKQogICAgICAgICAg
ICAgICAgZWxzZSAtPiBudWxsCiAgICAgICAgICAgIH0gPzogY29udGludWUKICAgICAgICAgICAg
aWYgKHZhbHVlIDw9IDBMKSBjb250aW51ZQogICAgICAgICAgICByZXR1cm4gaWYgKHZhbHVlID4g
MTAwXzAwMF8wMDBfMDAwTCkgdmFsdWUgLyAxMDAwTCBlbHNlIHZhbHVlCiAgICAgICAgfQogICAg
ICAgIHJldHVybiBudWxsCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gZGVjb2RlRXBnVGV4dChyYXc6
IFN0cmluZywgZmFsbGJhY2s6IFN0cmluZyk6IFN0cmluZyB7CiAgICAgICAgdmFsIHZhbHVlID0g
cmF3LnRyaW0oKQogICAgICAgIGlmICh2YWx1ZS5pc0JsYW5rKCkpIHJldHVybiBmYWxsYmFjawog
ICAgICAgIC8vIE1hbnkgWHRyZWFtIHBhbmVscyBCYXNlNjQtZW5jb2RlIHRpdGxlL2Rlc2NyaXB0
aW9uLiBPbmx5IGF0dGVtcHQgZGVjb2RlCiAgICAgICAgLy8gd2hlbiB0aGUgdmFsdWUgbG9va3Mg
bGlrZSBCYXNlNjQgYW5kIHRoZSBkZWNvZGVkIHJlc3VsdCBpcyByZWFkYWJsZSB0ZXh0LgogICAg
ICAgIGlmICh2YWx1ZS5sZW5ndGggPCA4IHx8IHZhbHVlLmxlbmd0aCAlIDQgIT0gMCB8fCAhdmFs
dWUubWF0Y2hlcyhSZWdleCgiXltBLVphLXowLTkrLz1dKyQiKSkpIHJldHVybiB2YWx1ZQogICAg
ICAgIHJldHVybiB0cnkgewogICAgICAgICAgICB2YWwgZGVjb2RlZCA9IFN0cmluZyhCYXNlNjQu
ZGVjb2RlKHZhbHVlLCBCYXNlNjQuREVGQVVMVCksIENoYXJzZXRzLlVURl84KS50cmltKCkKICAg
ICAgICAgICAgdmFsIHByaW50YWJsZSA9IGRlY29kZWQuaXNOb3RCbGFuaygpICYmIGRlY29kZWQu
Y291bnQgeyAhaXQuaXNJU09Db250cm9sKCkgfHwgaXQgPT0gJ1xuJyB8fCBpdCA9PSAnXHInIHx8
IGl0ID09ICdcdCcgfSA+PSBkZWNvZGVkLmxlbmd0aCAqIDkgLyAxMAogICAgICAgICAgICBpZiAo
cHJpbnRhYmxlICYmICFkZWNvZGVkLmNvbnRhaW5zKCdcdUZGRkQnKSkgZGVjb2RlZCBlbHNlIHZh
bHVlCiAgICAgICAgfSBjYXRjaCAoXzogRXhjZXB0aW9uKSB7CiAgICAgICAgICAgIHZhbHVlCiAg
ICAgICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIGNsZWFuUmF0aW5nKHJhdzogU3RyaW5nKTog
U3RyaW5nIHsKICAgICAgICB2YWwgdmFsdWUgPSByYXcudHJpbSgpCiAgICAgICAgaWYgKHZhbHVl
LmlzQmxhbmsoKSB8fCB2YWx1ZSA9PSAiMCIgfHwgdmFsdWUgPT0gIjAuMCIpIHJldHVybiAiIgog
ICAgICAgIHZhbCBudW1iZXIgPSB2YWx1ZS50b0RvdWJsZU9yTnVsbCgpID86IHJldHVybiB2YWx1
ZS50YWtlKDQpCiAgICAgICAgcmV0dXJuIGlmIChudW1iZXIgPiA1LjApIFN0cmluZy5mb3JtYXQo
TG9jYWxlLlVTLCAiJS4xZiIsIG51bWJlci5jb2VyY2VBdE1vc3QoMTAuMCkpCiAgICAgICAgZWxz
ZSBTdHJpbmcuZm9ybWF0KExvY2FsZS5VUywgIiUuMWYiLCBudW1iZXIpCiAgICB9CgogICAgZnVu
IHN0cmVhbVVybChjOiBYdHJlYW1DcmVkZW50aWFscywgc3RyZWFtOiBMaXZlU3RyZWFtKTogU3Ry
aW5nIHsKICAgICAgICBpZiAoRGVtb0NhdGFsb2cuaXNEZW1vKGMpKSByZXR1cm4gRGVtb0NhdGFs
b2cuc3RyZWFtVXJsKHN0cmVhbSkKICAgICAgICB2YWwgZXh0ID0gT3V0Ym91bmRVcmxQb2xpY3ku
c2FmZUV4dGVuc2lvbihzdHJlYW0uZXh0ZW5zaW9uLCAidHMiKQogICAgICAgIHJldHVybiBPdXRi
b3VuZFVybFBvbGljeS5wcm92aWRlclBsYXliYWNrVXJsKAogICAgICAgICAgICBiYXNlKGMuc2Vy
dmVyKSwgImxpdmUiLCBlbmMoYy51c2VybmFtZSksIGVuYyhjLnBhc3N3b3JkKSwgc3RyZWFtLmlk
LCBleHQsICJ0cyIKICAgICAgICApCiAgICB9Cn0K
:::END XTREAM
:::BEGIN IMAGELOADER
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5ncmFwaGlj
cy5CaXRtYXAKaW1wb3J0IGFuZHJvaWQuZ3JhcGhpY3MuQml0bWFwRmFjdG9yeQppbXBvcnQgYW5k
cm9pZC5vcy5IYW5kbGVyCmltcG9ydCBhbmRyb2lkLm9zLkxvb3BlcgppbXBvcnQgYW5kcm9pZC51
dGlsLkxydUNhY2hlCmltcG9ydCBhbmRyb2lkLndpZGdldC5JbWFnZVZpZXcKaW1wb3J0IGphdmEu
aW8uQnl0ZUFycmF5T3V0cHV0U3RyZWFtCmltcG9ydCBqYXZhLm5ldC5IdHRwVVJMQ29ubmVjdGlv
bgppbXBvcnQgamF2YS5uZXQuVVJMCmltcG9ydCBqYXZhLnV0aWwuQ29sbGVjdGlvbnMKaW1wb3J0
IGphdmEudXRpbC5Mb2NhbGUKaW1wb3J0IGphdmEudXRpbC5jb25jdXJyZW50LkNvbmN1cnJlbnRI
YXNoTWFwCmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5FeGVjdXRvcnMKCi8qKgogKiBQcm92
aWRlci1hcnR3b3JrIGxvYWRlciB3aXRoIHN0cmljdCBVUkwgdmFsaWRhdGlvbiwgZHVwbGljYXRl
IHN1cHByZXNzaW9uLAogKiBib3VuZGVkIHJlcXVlc3QgcmF0ZSwgcmVkaXJlY3QgdmFsaWRhdGlv
biwgYW5kIGZhaWx1cmUgY29vbGRvd25zLgogKi8Kb2JqZWN0IFJlbW90ZUltYWdlTG9hZGVyIHsK
ICAgIHByaXZhdGUgY29uc3QgdmFsIE1BWF9JTUFHRV9CWVRFUyA9IDggKiAxMDI0ICogMTAyNAog
ICAgcHJpdmF0ZSBjb25zdCB2YWwgUkVRVUVTVF9TUEFDSU5HX01TID0gMTQwTAogICAgcHJpdmF0
ZSBjb25zdCB2YWwgRkFJTEVEX1VSTF9DT09MRE9XTl9NUyA9IDUgKiA2MF8wMDBMCiAgICBwcml2
YXRlIGNvbnN0IHZhbCBSRUpFQ1RFRF9IT1NUX0NPT0xET1dOX01TID0gMTUgKiA2MF8wMDBMCiAg
ICBwcml2YXRlIGNvbnN0IHZhbCBNQVhfUkVESVJFQ1RTID0gMwoKICAgIHByaXZhdGUgdmFsIGV4
ZWN1dG9yID0gRXhlY3V0b3JzLm5ld0ZpeGVkVGhyZWFkUG9vbCgyKQogICAgcHJpdmF0ZSB2YWwg
bWFpbiA9IEhhbmRsZXIoTG9vcGVyLmdldE1haW5Mb29wZXIoKSkKICAgIHByaXZhdGUgdmFsIGlu
RmxpZ2h0ID0gQ29sbGVjdGlvbnMuc3luY2hyb25pemVkU2V0KG11dGFibGVTZXRPZjxTdHJpbmc+
KCkpCiAgICBwcml2YXRlIHZhbCBmYWlsZWRVbnRpbCA9IENvbmN1cnJlbnRIYXNoTWFwPFN0cmlu
ZywgTG9uZz4oKQogICAgcHJpdmF0ZSB2YWwgaG9zdENvb2xkb3duVW50aWwgPSBDb25jdXJyZW50
SGFzaE1hcDxTdHJpbmcsIExvbmc+KCkKICAgIHByaXZhdGUgdmFsIHJlcXVlc3RHYXRlID0gQW55
KCkKICAgIHByaXZhdGUgdmFyIG5leHRSZXF1ZXN0QXQgPSAwTAogICAgcHJpdmF0ZSB2YWwgY2Fj
aGUgPSBvYmplY3QgOiBMcnVDYWNoZTxTdHJpbmcsIEJpdG1hcD4oMjQgKiAxMDI0ICogMTAyNCkg
ewogICAgICAgIG92ZXJyaWRlIGZ1biBzaXplT2Yoa2V5OiBTdHJpbmcsIHZhbHVlOiBCaXRtYXAp
OiBJbnQgPSB2YWx1ZS5ieXRlQ291bnQKICAgIH0KCiAgICBmdW4gbG9hZCh1cmw6IFN0cmluZz8s
IHZpZXc6IEltYWdlVmlldywgcGxhY2Vob2xkZXI6IEludCwgY3JvcDogQm9vbGVhbiA9IGZhbHNl
KSB7CiAgICAgICAgdmFsIG5vcm1hbGl6ZWQgPSBPdXRib3VuZFVybFBvbGljeS5ub3JtYWxpemVS
ZW1vdGVIdHRwVXJsKHVybCkKICAgICAgICB2aWV3LnRhZyA9IG5vcm1hbGl6ZWQKICAgICAgICB2
aWV3LnNldEltYWdlUmVzb3VyY2UocGxhY2Vob2xkZXIpCiAgICAgICAgdmlldy5zY2FsZVR5cGUg
PSBpZiAoY3JvcCkgSW1hZ2VWaWV3LlNjYWxlVHlwZS5DRU5URVJfQ1JPUCBlbHNlIEltYWdlVmll
dy5TY2FsZVR5cGUuQ0VOVEVSX0lOU0lERQogICAgICAgIGlmIChub3JtYWxpemVkLmlzQmxhbmso
KSkgcmV0dXJuCgogICAgICAgIGNhY2hlLmdldChub3JtYWxpemVkKT8ubGV0IHsKICAgICAgICAg
ICAgdmlldy5zZXRJbWFnZUJpdG1hcChpdCkKICAgICAgICAgICAgdmlldy5zY2FsZVR5cGUgPSBp
ZiAoY3JvcCkgSW1hZ2VWaWV3LlNjYWxlVHlwZS5DRU5URVJfQ1JPUCBlbHNlIEltYWdlVmlldy5T
Y2FsZVR5cGUuQ0VOVEVSX0lOU0lERQogICAgICAgICAgICByZXR1cm4KICAgICAgICB9CgogICAg
ICAgIHZhbCBub3cgPSBTeXN0ZW0uY3VycmVudFRpbWVNaWxsaXMoKQogICAgICAgIGlmICgoZmFp
bGVkVW50aWxbbm9ybWFsaXplZF0gPzogMEwpID4gbm93KSByZXR1cm4KICAgICAgICB2YWwgaG9z
dCA9IHJ1bkNhdGNoaW5nIHsgVVJMKG5vcm1hbGl6ZWQpLmhvc3QubG93ZXJjYXNlKExvY2FsZS5V
UykgfS5nZXRPckRlZmF1bHQoIiIpCiAgICAgICAgaWYgKGhvc3QuaXNCbGFuaygpIHx8IChob3N0
Q29vbGRvd25VbnRpbFtob3N0XSA/OiAwTCkgPiBub3cpIHJldHVybgogICAgICAgIGlmICghaW5G
bGlnaHQuYWRkKG5vcm1hbGl6ZWQpKSByZXR1cm4KCiAgICAgICAgZXhlY3V0b3IuZXhlY3V0ZSB7
CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICB2YWwgYml0bWFwID0gZG93bmxvYWQo
bm9ybWFsaXplZCkKICAgICAgICAgICAgICAgIGlmIChiaXRtYXAgPT0gbnVsbCkgewogICAgICAg
ICAgICAgICAgICAgIGZhaWxlZFVudGlsW25vcm1hbGl6ZWRdID0gU3lzdGVtLmN1cnJlbnRUaW1l
TWlsbGlzKCkgKyBGQUlMRURfVVJMX0NPT0xET1dOX01TCiAgICAgICAgICAgICAgICAgICAgcmV0
dXJuQGV4ZWN1dGUKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGZhaWxlZFVudGls
LnJlbW92ZShub3JtYWxpemVkKQogICAgICAgICAgICAgICAgY2FjaGUucHV0KG5vcm1hbGl6ZWQs
IGJpdG1hcCkKICAgICAgICAgICAgICAgIG1haW4ucG9zdCB7CiAgICAgICAgICAgICAgICAgICAg
aWYgKHZpZXcudGFnID09IG5vcm1hbGl6ZWQpIHsKICAgICAgICAgICAgICAgICAgICAgICAgdmll
dy5zZXRJbWFnZUJpdG1hcChiaXRtYXApCiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc2Nh
bGVUeXBlID0gaWYgKGNyb3ApIEltYWdlVmlldy5TY2FsZVR5cGUuQ0VOVEVSX0NST1AgZWxzZSBJ
bWFnZVZpZXcuU2NhbGVUeXBlLkNFTlRFUl9JTlNJREUKICAgICAgICAgICAgICAgICAgICB9CiAg
ICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0gZmluYWxseSB7CiAgICAgICAgICAgICAgICBp
bkZsaWdodC5yZW1vdmUobm9ybWFsaXplZCkKICAgICAgICAgICAgfQogICAgICAgIH0KICAgIH0K
CiAgICBwcml2YXRlIGZ1biB3YWl0Rm9yUmVxdWVzdFNsb3QoKSB7CiAgICAgICAgc3luY2hyb25p
emVkKHJlcXVlc3RHYXRlKSB7CiAgICAgICAgICAgIHZhbCB3YWl0TXMgPSBuZXh0UmVxdWVzdEF0
IC0gU3lzdGVtLmN1cnJlbnRUaW1lTWlsbGlzKCkKICAgICAgICAgICAgaWYgKHdhaXRNcyA+IDBM
KSB7CiAgICAgICAgICAgICAgICB0cnkgewogICAgICAgICAgICAgICAgICAgIFRocmVhZC5zbGVl
cCh3YWl0TXMpCiAgICAgICAgICAgICAgICB9IGNhdGNoIChfOiBJbnRlcnJ1cHRlZEV4Y2VwdGlv
bikgewogICAgICAgICAgICAgICAgICAgIFRocmVhZC5jdXJyZW50VGhyZWFkKCkuaW50ZXJydXB0
KCkKICAgICAgICAgICAgICAgICAgICByZXR1cm4KICAgICAgICAgICAgICAgIH0KICAgICAgICAg
ICAgfQogICAgICAgICAgICBuZXh0UmVxdWVzdEF0ID0gU3lzdGVtLmN1cnJlbnRUaW1lTWlsbGlz
KCkgKyBSRVFVRVNUX1NQQUNJTkdfTVMKICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4g
ZG93bmxvYWQoaW5pdGlhbFVybDogU3RyaW5nKTogQml0bWFwPyB7CiAgICAgICAgdmFyIGN1cnJl
bnQgPSBpbml0aWFsVXJsCiAgICAgICAgcmVwZWF0KE1BWF9SRURJUkVDVFMgKyAxKSB7IHJlZGly
ZWN0Q291bnQgLT4KICAgICAgICAgICAgdmFsIHNhZmVVcmwgPSBPdXRib3VuZFVybFBvbGljeS5u
b3JtYWxpemVSZW1vdGVIdHRwVXJsKGN1cnJlbnQpCiAgICAgICAgICAgIGlmIChzYWZlVXJsLmlz
QmxhbmsoKSkgcmV0dXJuIG51bGwKICAgICAgICAgICAgdmFsIHBhcnNlZCA9IHJ1bkNhdGNoaW5n
IHsgVVJMKHNhZmVVcmwpIH0uZ2V0T3JOdWxsKCkgPzogcmV0dXJuIG51bGwKICAgICAgICAgICAg
dmFsIGhvc3QgPSBwYXJzZWQuaG9zdC5sb3dlcmNhc2UoTG9jYWxlLlVTKQogICAgICAgICAgICBp
ZiAoKGhvc3RDb29sZG93blVudGlsW2hvc3RdID86IDBMKSA+IFN5c3RlbS5jdXJyZW50VGltZU1p
bGxpcygpKSByZXR1cm4gbnVsbAoKICAgICAgICAgICAgd2FpdEZvclJlcXVlc3RTbG90KCkKICAg
ICAgICAgICAgdmFsIGNvbm5lY3Rpb24gPSB0cnkgewogICAgICAgICAgICAgICAgcGFyc2VkLm9w
ZW5Db25uZWN0aW9uKCkgYXMgSHR0cFVSTENvbm5lY3Rpb24KICAgICAgICAgICAgfSBjYXRjaCAo
XzogRXhjZXB0aW9uKSB7CiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbAogICAgICAgICAgICB9
CiAgICAgICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdFRpbWVvdXQgPSA3XzAwMAogICAgICAgICAg
ICBjb25uZWN0aW9uLnJlYWRUaW1lb3V0ID0gMTBfMDAwCiAgICAgICAgICAgIGNvbm5lY3Rpb24u
aW5zdGFuY2VGb2xsb3dSZWRpcmVjdHMgPSBmYWxzZQogICAgICAgICAgICBjb25uZWN0aW9uLnNl
dFJlcXVlc3RQcm9wZXJ0eSgiVXNlci1BZ2VudCIsICJLcmlzdGFsU3RyZWFtcy8xLjYuOCBBbmRy
b2lkIikKCiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICB2YWwgY29kZSA9IGNvbm5l
Y3Rpb24ucmVzcG9uc2VDb2RlCiAgICAgICAgICAgICAgICBpZiAoY29kZSA9PSA0MDMgfHwgY29k
ZSA9PSA0MjkpIHsKICAgICAgICAgICAgICAgICAgICBob3N0Q29vbGRvd25VbnRpbFtob3N0XSA9
IFN5c3RlbS5jdXJyZW50VGltZU1pbGxpcygpICsgUkVKRUNURURfSE9TVF9DT09MRE9XTl9NUwog
ICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsCiAgICAgICAgICAgICAgICB9CiAgICAgICAg
ICAgICAgICBpZiAoY29kZSBpbiAzMDAuLjM5OSkgewogICAgICAgICAgICAgICAgICAgIGlmIChy
ZWRpcmVjdENvdW50ID49IE1BWF9SRURJUkVDVFMpIHJldHVybiBudWxsCiAgICAgICAgICAgICAg
ICAgICAgdmFsIGxvY2F0aW9uID0gY29ubmVjdGlvbi5nZXRIZWFkZXJGaWVsZCgiTG9jYXRpb24i
KT8udHJpbSgpLm9yRW1wdHkoKQogICAgICAgICAgICAgICAgICAgIGlmIChsb2NhdGlvbi5pc0Js
YW5rKCkpIHJldHVybiBudWxsCiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IHJ1bkNhdGNo
aW5nIHsgVVJMKHBhcnNlZCwgbG9jYXRpb24pLnRvU3RyaW5nKCkgfS5nZXRPckRlZmF1bHQoIiIp
CiAgICAgICAgICAgICAgICAgICAgaWYgKE91dGJvdW5kVXJsUG9saWN5Lm5vcm1hbGl6ZVJlbW90
ZUh0dHBVcmwoY3VycmVudCkuaXNCbGFuaygpKSByZXR1cm4gbnVsbAogICAgICAgICAgICAgICAg
ICAgIHJldHVybkByZXBlYXQKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGlmIChj
b2RlICFpbiAyMDAuLjI5OSkgcmV0dXJuIG51bGwKCiAgICAgICAgICAgICAgICB2YWwgYnl0ZXMg
PSBjb25uZWN0aW9uLmlucHV0U3RyZWFtLnVzZSB7IGlucHV0IC0+CiAgICAgICAgICAgICAgICAg
ICAgdmFsIG91dCA9IEJ5dGVBcnJheU91dHB1dFN0cmVhbSgpCiAgICAgICAgICAgICAgICAgICAg
dmFsIGJ1ZmZlciA9IEJ5dGVBcnJheSgxNiAqIDEwMjQpCiAgICAgICAgICAgICAgICAgICAgdmFy
IHRvdGFsID0gMAogICAgICAgICAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7CiAgICAgICAgICAg
ICAgICAgICAgICAgIHZhbCByZWFkID0gaW5wdXQucmVhZChidWZmZXIpCiAgICAgICAgICAgICAg
ICAgICAgICAgIGlmIChyZWFkIDw9IDApIGJyZWFrCiAgICAgICAgICAgICAgICAgICAgICAgIHRv
dGFsICs9IHJlYWQKICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRvdGFsID4gTUFYX0lNQUdF
X0JZVEVTKSByZXR1cm4gbnVsbAogICAgICAgICAgICAgICAgICAgICAgICBvdXQud3JpdGUoYnVm
ZmVyLCAwLCByZWFkKQogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICBv
dXQudG9CeXRlQXJyYXkoKQogICAgICAgICAgICAgICAgfQoKICAgICAgICAgICAgICAgIHZhbCBi
b3VuZHMgPSBCaXRtYXBGYWN0b3J5Lk9wdGlvbnMoKS5hcHBseSB7IGluSnVzdERlY29kZUJvdW5k
cyA9IHRydWUgfQogICAgICAgICAgICAgICAgQml0bWFwRmFjdG9yeS5kZWNvZGVCeXRlQXJyYXko
Ynl0ZXMsIDAsIGJ5dGVzLnNpemUsIGJvdW5kcykKICAgICAgICAgICAgICAgIGlmIChib3VuZHMu
b3V0V2lkdGggPD0gMCB8fCBib3VuZHMub3V0SGVpZ2h0IDw9IDApIHJldHVybiBudWxsCgogICAg
ICAgICAgICAgICAgdmFyIHNhbXBsZSA9IDEKICAgICAgICAgICAgICAgIHdoaWxlIChib3VuZHMu
b3V0V2lkdGggLyBzYW1wbGUgPiAxMDAwIHx8IGJvdW5kcy5vdXRIZWlnaHQgLyBzYW1wbGUgPiAx
NDAwKSB7CiAgICAgICAgICAgICAgICAgICAgc2FtcGxlICo9IDIKICAgICAgICAgICAgICAgIH0K
ICAgICAgICAgICAgICAgIHZhbCBvcHRpb25zID0gQml0bWFwRmFjdG9yeS5PcHRpb25zKCkuYXBw
bHkgewogICAgICAgICAgICAgICAgICAgIGluU2FtcGxlU2l6ZSA9IHNhbXBsZQogICAgICAgICAg
ICAgICAgICAgIGluUHJlZmVycmVkQ29uZmlnID0gQml0bWFwLkNvbmZpZy5BUkdCXzg4ODgKICAg
ICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIHJldHVybiBCaXRtYXBGYWN0b3J5LmRlY29k
ZUJ5dGVBcnJheShieXRlcywgMCwgYnl0ZXMuc2l6ZSwgb3B0aW9ucykKICAgICAgICAgICAgfSBj
YXRjaCAoXzogRXhjZXB0aW9uKSB7CiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbAogICAgICAg
ICAgICB9IGZpbmFsbHkgewogICAgICAgICAgICAgICAgY29ubmVjdGlvbi5kaXNjb25uZWN0KCkK
ICAgICAgICAgICAgfQogICAgICAgIH0KICAgICAgICByZXR1cm4gbnVsbAogICAgfQp9Cg==
:::END IMAGELOADER
:::BEGIN PLAYER
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5vcy5CdW5k
bGUKaW1wb3J0IGFuZHJvaWQub3MuSGFuZGxlcgppbXBvcnQgYW5kcm9pZC5vcy5Mb29wZXIKaW1w
b3J0IGFuZHJvaWQudmlldy5WaWV3CmltcG9ydCBhbmRyb2lkLndpZGdldC5CdXR0b24KaW1wb3J0
IGFuZHJvaWQud2lkZ2V0LlByb2dyZXNzQmFyCmltcG9ydCBhbmRyb2lkLndpZGdldC5UZXh0Vmll
dwppbXBvcnQgYW5kcm9pZHguYXBwY29tcGF0LmFwcC5BcHBDb21wYXRBY3Rpdml0eQppbXBvcnQg
YW5kcm9pZHguYXBwY29tcGF0LmFwcC5BbGVydERpYWxvZwppbXBvcnQgYW5kcm9pZHgubWVkaWEz
LmNvbW1vbi5DCmltcG9ydCBhbmRyb2lkeC5tZWRpYTMuY29tbW9uLkZvcm1hdAppbXBvcnQgYW5k
cm9pZHgubWVkaWEzLmNvbW1vbi5NZWRpYUl0ZW0KaW1wb3J0IGFuZHJvaWR4Lm1lZGlhMy5jb21t
b24uUGxheWJhY2tFeGNlcHRpb24KaW1wb3J0IGFuZHJvaWR4Lm1lZGlhMy5jb21tb24uUGxheWVy
CmltcG9ydCBhbmRyb2lkeC5tZWRpYTMuY29tbW9uLlRyYWNrU2VsZWN0aW9uT3ZlcnJpZGUKaW1w
b3J0IGFuZHJvaWR4Lm1lZGlhMy5jb21tb24uVHJhY2tzCmltcG9ydCBhbmRyb2lkeC5tZWRpYTMu
ZXhvcGxheWVyLkV4b1BsYXllcgppbXBvcnQgYW5kcm9pZHgubWVkaWEzLmV4b3BsYXllci5EZWZh
dWx0UmVuZGVyZXJzRmFjdG9yeQppbXBvcnQgYW5kcm9pZHgubWVkaWEzLnVpLlBsYXllclZpZXcK
aW1wb3J0IGphdmEudXRpbC5jb25jdXJyZW50LkV4ZWN1dG9ycwoKY2xhc3MgUGxheWVyQWN0aXZp
dHkgOiBBcHBDb21wYXRBY3Rpdml0eSgpIHsKICAgIHByaXZhdGUgdmFyIHBsYXllcjogRXhvUGxh
eWVyPyA9IG51bGwKICAgIHByaXZhdGUgdmFsIGV4ZWN1dG9yID0gRXhlY3V0b3JzLm5ld1Npbmds
ZVRocmVhZEV4ZWN1dG9yKCkKICAgIHByaXZhdGUgdmFsIGhhbmRsZXIgPSBIYW5kbGVyKExvb3Bl
ci5nZXRNYWluTG9vcGVyKCkpCiAgICBwcml2YXRlIHZhciB1cmw6IFN0cmluZyA9ICIiCiAgICBw
cml2YXRlIHZhciBuYW1lOiBTdHJpbmcgPSAiS3Jpc3RhbCBTdHJlYW1zIgogICAgcHJpdmF0ZSB2
YXIga2luZDogU3RyaW5nID0gInZpZGVvIgogICAgcHJpdmF0ZSB2YXIgcmVzdW1lTXM6IExvbmcg
PSAwCiAgICBwcml2YXRlIHZhciByZXRyeUNvdW50ID0gMAogICAgcHJpdmF0ZSB2YXIgcmV0cnlS
dW5uYWJsZTogUnVubmFibGU/ID0gbnVsbAogICAgcHJpdmF0ZSB2YXIgY29udHJvbGxlclZpc2li
bGUgPSBmYWxzZQoKICAgIHByaXZhdGUgZGF0YSBjbGFzcyBUcmFja0Nob2ljZSh2YWwgZ3JvdXA6
IFRyYWNrcy5Hcm91cCwgdmFsIGluZGV4OiBJbnQsIHZhbCBsYWJlbDogU3RyaW5nKQoKICAgIHBy
aXZhdGUgdmFsIGxpc3RlbmVyID0gb2JqZWN0IDogUGxheWVyLkxpc3RlbmVyIHsKICAgICAgICBv
dmVycmlkZSBmdW4gb25QbGF5YmFja1N0YXRlQ2hhbmdlZChwbGF5YmFja1N0YXRlOiBJbnQpIHsK
ICAgICAgICAgICAgd2hlbiAocGxheWJhY2tTdGF0ZSkgewogICAgICAgICAgICAgICAgUGxheWVy
LlNUQVRFX0JVRkZFUklORyAtPiBzaG93TG9hZGluZygiQnVmZmVyaW5n4oCmIikKICAgICAgICAg
ICAgICAgIFBsYXllci5TVEFURV9SRUFEWSAtPiB7CiAgICAgICAgICAgICAgICAgICAgcmV0cnlD
b3VudCA9IDAKICAgICAgICAgICAgICAgICAgICBoaWRlU3RhdHVzKCkKICAgICAgICAgICAgICAg
IH0KICAgICAgICAgICAgICAgIFBsYXllci5TVEFURV9FTkRFRCAtPiBoaWRlU3RhdHVzKCkKICAg
ICAgICAgICAgICAgIFBsYXllci5TVEFURV9JRExFIC0+IFVuaXQKICAgICAgICAgICAgfQogICAg
ICAgIH0KCiAgICAgICAgb3ZlcnJpZGUgZnVuIG9uUGxheWVyRXJyb3IoZXJyb3I6IFBsYXliYWNr
RXhjZXB0aW9uKSB7CiAgICAgICAgICAgIGhhbmRsZVBsYXliYWNrRXJyb3IoZXJyb3IpCiAgICAg
ICAgfQoKICAgICAgICBvdmVycmlkZSBmdW4gb25UcmFja3NDaGFuZ2VkKHRyYWNrczogVHJhY2tz
KSB7CiAgICAgICAgICAgIHVwZGF0ZVRyYWNrQ29udHJvbHModHJhY2tzKQogICAgICAgIH0KICAg
IH0KCiAgICBvdmVycmlkZSBmdW4gb25DcmVhdGUoc2F2ZWRJbnN0YW5jZVN0YXRlOiBCdW5kbGU/
KSB7CiAgICAgICAgc3VwZXIub25DcmVhdGUoc2F2ZWRJbnN0YW5jZVN0YXRlKQogICAgICAgIHNl
dENvbnRlbnRWaWV3KFIubGF5b3V0LmFjdGl2aXR5X3BsYXllcikKICAgICAgICBuYW1lID0gaW50
ZW50LmdldFN0cmluZ0V4dHJhKCJuYW1lIikgPzogIktyaXN0YWwgU3RyZWFtcyIKICAgICAgICB1
cmwgPSBPdXRib3VuZFVybFBvbGljeS5ub3JtYWxpemVQbGF5YmFja1VybChpbnRlbnQuZ2V0U3Ry
aW5nRXh0cmEoInVybCIpKQogICAgICAgIGtpbmQgPSBpbnRlbnQuZ2V0U3RyaW5nRXh0cmEoImtp
bmQiKSA/OiAidmlkZW8iCiAgICAgICAgcmVzdW1lTXMgPSBpbnRlbnQuZ2V0TG9uZ0V4dHJhKCJy
ZXN1bWVNcyIsIDApCiAgICAgICAgZmluZFZpZXdCeUlkPFRleHRWaWV3PihSLmlkLmNoYW5uZWxO
YW1lKS50ZXh0ID0gbmFtZQogICAgICAgIGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQucmV0cnlC
dXR0b24pLnNldE9uQ2xpY2tMaXN0ZW5lciB7CiAgICAgICAgICAgIHJldHJ5Q291bnQgPSAwCiAg
ICAgICAgICAgIHN0YXJ0UGxheWJhY2soZm9yY2VSZXN0YXJ0ID0ga2luZCA9PSAibGl2ZSIpCiAg
ICAgICAgfQogICAgICAgIHZhbCBwbGF5ZXJWaWV3ID0gZmluZFZpZXdCeUlkPFBsYXllclZpZXc+
KFIuaWQucGxheWVyVmlldykKICAgICAgICBwbGF5ZXJWaWV3LnNldENvbnRyb2xsZXJWaXNpYmls
aXR5TGlzdGVuZXIoUGxheWVyVmlldy5Db250cm9sbGVyVmlzaWJpbGl0eUxpc3RlbmVyIHsgdmlz
aWJpbGl0eSAtPgogICAgICAgICAgICBjb250cm9sbGVyVmlzaWJsZSA9IHZpc2liaWxpdHkgPT0g
Vmlldy5WSVNJQkxFCiAgICAgICAgICAgIHZhbCB0cmFja3MgPSBwbGF5ZXI/LmN1cnJlbnRUcmFj
a3MKICAgICAgICAgICAgaWYgKHRyYWNrcyA9PSBudWxsKSBmaW5kVmlld0J5SWQ8Vmlldz4oUi5p
ZC5wbGF5ZXJUcmFja0NvbnRyb2xzKS52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAgICAgICAgICAg
IGVsc2UgdXBkYXRlVHJhY2tDb250cm9scyh0cmFja3MpCiAgICAgICAgfSkKICAgICAgICBmaW5k
Vmlld0J5SWQ8QnV0dG9uPihSLmlkLmF1ZGlvVHJhY2tCdXR0b24pLnNldE9uQ2xpY2tMaXN0ZW5l
ciB7IHNob3dBdWRpb1RyYWNrcygpIH0KICAgICAgICBmaW5kVmlld0J5SWQ8QnV0dG9uPihSLmlk
LnN1YnRpdGxlVHJhY2tCdXR0b24pLnNldE9uQ2xpY2tMaXN0ZW5lciB7IHNob3dTdWJ0aXRsZVRy
YWNrcygpIH0KICAgICAgICB2YWwgc3RyZWFtSWQgPSBpbnRlbnQuZ2V0SW50RXh0cmEoInN0cmVh
bUlkIiwgLTEpCiAgICAgICAgaWYgKGtpbmQgPT0gImxpdmUiICYmIHN0cmVhbUlkID4gMCkgbG9h
ZEVwZyhzdHJlYW1JZCkgZWxzZSBmaW5kVmlld0J5SWQ8VGV4dFZpZXc+KFIuaWQubm93TmV4dCku
dmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgfQoKICAgIHByaXZhdGUgZnVuIGxvYWRFcGcoc3Ry
ZWFtSWQ6IEludCkgewogICAgICAgIHZhbCBjID0gU2Vzc2lvbi5sb2FkKHRoaXMpID86IHJldHVy
bgogICAgICAgIGV4ZWN1dG9yLmV4ZWN1dGUgewogICAgICAgICAgICB0cnkgewogICAgICAgICAg
ICAgICAgdmFsIGVwZyA9IFh0cmVhbUNsaWVudC5zaG9ydEVwZyhjLCBzdHJlYW1JZCwgMikKICAg
ICAgICAgICAgICAgIHJ1bk9uVWlUaHJlYWQgewogICAgICAgICAgICAgICAgICAgIHZhbCBsYWJl
bCA9IGZpbmRWaWV3QnlJZDxUZXh0Vmlldz4oUi5pZC5ub3dOZXh0KQogICAgICAgICAgICAgICAg
ICAgIGlmIChlcGcuaXNFbXB0eSgpKSBsYWJlbC52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAgICAg
ICAgICAgICAgICAgICAgZWxzZSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHZhbCBub3cgPSBl
cGcuZ2V0T3JOdWxsKDApPy50aXRsZSA/OiAiTGl2ZSIKICAgICAgICAgICAgICAgICAgICAgICAg
dmFsIG5leHQgPSBlcGcuZ2V0T3JOdWxsKDEpPy50aXRsZQogICAgICAgICAgICAgICAgICAgICAg
ICBsYWJlbC50ZXh0ID0gaWYgKG5leHQuaXNOdWxsT3JCbGFuaygpKSAiTk9XICDigKIgICRub3ci
IGVsc2UgIk5PVyAg4oCiICAkbm93ICAgICBORVhUICDigKIgICRuZXh0IgogICAgICAgICAgICAg
ICAgICAgICAgICBsYWJlbC52aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFCiAgICAgICAgICAgICAg
ICAgICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9IGNhdGNoIChfOiBFeGNlcHRp
b24pIHsKICAgICAgICAgICAgICAgIHJ1bk9uVWlUaHJlYWQgeyBmaW5kVmlld0J5SWQ8VGV4dFZp
ZXc+KFIuaWQubm93TmV4dCkudmlzaWJpbGl0eSA9IFZpZXcuR09ORSB9CiAgICAgICAgICAgIH0K
ICAgICAgICB9CiAgICB9CgogICAgb3ZlcnJpZGUgZnVuIG9uU3RhcnQoKSB7CiAgICAgICAgc3Vw
ZXIub25TdGFydCgpCiAgICAgICAgc3RhcnRQbGF5YmFjayhmb3JjZVJlc3RhcnQgPSBmYWxzZSkK
ICAgIH0KCiAgICBwcml2YXRlIGZ1biBzdGFydFBsYXliYWNrKGZvcmNlUmVzdGFydDogQm9vbGVh
bikgewogICAgICAgIHJldHJ5UnVubmFibGU/LmxldCB7IGhhbmRsZXIucmVtb3ZlQ2FsbGJhY2tz
KGl0KSB9CiAgICAgICAgcmV0cnlSdW5uYWJsZSA9IG51bGwKICAgICAgICBpZiAodXJsLmlzQmxh
bmsoKSkgewogICAgICAgICAgICBzaG93RXJyb3IoIlRoaXMgc3RyZWFtIFVSTCB3YXMgbWlzc2lu
ZyBvciBibG9ja2VkIGJ5IHRoZSBzYWZldHkgY2hlY2suIikKICAgICAgICAgICAgcmV0dXJuCiAg
ICAgICAgfQogICAgICAgIGlmICghTmV0d29ya1N0YXRlLmlzT25saW5lKHRoaXMpKSB7CiAgICAg
ICAgICAgIHNob3dFcnJvcigiTm8gaW50ZXJuZXQgY29ubmVjdGlvbi4gQ2hlY2sgV2ktRmkgb3Ig
RXRoZXJuZXQsIHRoZW4gY2hvb3NlIFJldHJ5LiIpCiAgICAgICAgICAgIHJldHVybgogICAgICAg
IH0KCiAgICAgICAgdmFsIG9sZFBvc2l0aW9uID0gaWYgKCFmb3JjZVJlc3RhcnQgJiYga2luZCAh
PSAibGl2ZSIpIHBsYXllcj8uY3VycmVudFBvc2l0aW9uID86IHJlc3VtZU1zIGVsc2UgaWYgKGZv
cmNlUmVzdGFydCkgMEwgZWxzZSByZXN1bWVNcwogICAgICAgIHBsYXllcj8ucmVtb3ZlTGlzdGVu
ZXIobGlzdGVuZXIpCiAgICAgICAgcGxheWVyPy5yZWxlYXNlKCkKICAgICAgICBwbGF5ZXIgPSBu
dWxsCgogICAgICAgIC8vIE1lZGlhIHNvdXJjZSBjcmVhdGlvbiBjYW4gZmFpbCBzeW5jaHJvbm91
c2x5IHdoZW4gYSBzdHJlYW0gdHlwZSBpcyB1bnN1cHBvcnRlZC4KICAgICAgICAvLyBOZXZlciBs
ZXQgdGhhdCBjcmFzaCB0aGUgQWN0aXZpdHkgYW5kIGR1bXAgdGhlIHZpZXdlciBiYWNrIHRvIEhv
bWUuCiAgICAgICAgdHJ5IHsKICAgICAgICAgICAgdmFsIG5ld1BsYXllciA9IEV4b1BsYXllci5C
dWlsZGVyKHRoaXMsIERlZmF1bHRSZW5kZXJlcnNGYWN0b3J5KHRoaXMpLnNldEV4dGVuc2lvblJl
bmRlcmVyTW9kZShEZWZhdWx0UmVuZGVyZXJzRmFjdG9yeS5FWFRFTlNJT05fUkVOREVSRVJfTU9E
RV9QUkVGRVIpLnNldEVuYWJsZURlY29kZXJGYWxsYmFjayh0cnVlKSkuYnVpbGQoKQogICAgICAg
ICAgICBwbGF5ZXIgPSBuZXdQbGF5ZXIKICAgICAgICAgICAgZmluZFZpZXdCeUlkPFBsYXllclZp
ZXc+KFIuaWQucGxheWVyVmlldykucGxheWVyID0gbmV3UGxheWVyCiAgICAgICAgICAgIG5ld1Bs
YXllci5hZGRMaXN0ZW5lcihsaXN0ZW5lcikKICAgICAgICAgICAgbmV3UGxheWVyLnNldE1lZGlh
SXRlbShNZWRpYUl0ZW0uZnJvbVVyaSh1cmwpKQogICAgICAgICAgICBuZXdQbGF5ZXIucHJlcGFy
ZSgpCiAgICAgICAgICAgIGlmIChvbGRQb3NpdGlvbiA+IDAgJiYga2luZCAhPSAibGl2ZSIpIG5l
d1BsYXllci5zZWVrVG8ob2xkUG9zaXRpb24pCiAgICAgICAgICAgIG5ld1BsYXllci5wbGF5V2hl
blJlYWR5ID0gdHJ1ZQogICAgICAgICAgICBzaG93TG9hZGluZygiQ29ubmVjdGluZ+KApiIpCiAg
ICAgICAgfSBjYXRjaCAodDogVGhyb3dhYmxlKSB7CiAgICAgICAgICAgIHBsYXllcj8ucmVtb3Zl
TGlzdGVuZXIobGlzdGVuZXIpCiAgICAgICAgICAgIHBsYXllcj8ucmVsZWFzZSgpCiAgICAgICAg
ICAgIHBsYXllciA9IG51bGwKICAgICAgICAgICAgdmFsIGRldGFpbCA9IHQubWVzc2FnZT8udGFr
ZUlmIHsgaXQuaXNOb3RCbGFuaygpIH0KICAgICAgICAgICAgICAgID86ICJUaGUgcGxheWVyIGNv
dWxkIG5vdCBzdGFydCB0aGlzIHN0cmVhbS4iCiAgICAgICAgICAgIHNob3dFcnJvcigiUGxheWVy
IHN0YXJ0dXAgZmFpbGVkLlxuJGRldGFpbCIpCiAgICAgICAgfQogICAgfQoKICAgIHByaXZhdGUg
ZnVuIGhhbmRsZVBsYXliYWNrRXJyb3IoZXJyb3I6IFBsYXliYWNrRXhjZXB0aW9uKSB7CiAgICAg
ICAgaWYgKCFOZXR3b3JrU3RhdGUuaXNPbmxpbmUodGhpcykpIHsKICAgICAgICAgICAgc2hvd0Vy
cm9yKCJDb25uZWN0aW9uIGxvc3QuIFJlY29ubmVjdCB0byB0aGUgaW50ZXJuZXQsIHRoZW4gY2hv
b3NlIFJldHJ5LiIpCiAgICAgICAgICAgIHJldHVybgogICAgICAgIH0KCiAgICAgICAgdmFsIHJl
dHJ5YWJsZU5ldHdvcmtGYWlsdXJlID0gZXJyb3IuZXJyb3JDb2RlID09IFBsYXliYWNrRXhjZXB0
aW9uLkVSUk9SX0NPREVfSU9fTkVUV09SS19DT05ORUNUSU9OX0ZBSUxFRCB8fAogICAgICAgICAg
ICBlcnJvci5lcnJvckNvZGUgPT0gUGxheWJhY2tFeGNlcHRpb24uRVJST1JfQ09ERV9JT19ORVRX
T1JLX0NPTk5FQ1RJT05fVElNRU9VVAogICAgICAgIGlmIChyZXRyeWFibGVOZXR3b3JrRmFpbHVy
ZSAmJiBQbGF5ZXJQcmVmcy5hdXRvUmV0cnkodGhpcykgJiYgcmV0cnlDb3VudCA8IDIpIHsKICAg
ICAgICAgICAgcmV0cnlDb3VudCsrCiAgICAgICAgICAgIHZhbCBzZWNvbmRzID0gcmV0cnlDb3Vu
dCAqIDJMCiAgICAgICAgICAgIHNob3dMb2FkaW5nKCJTdHJlYW0gaW50ZXJydXB0ZWQg4oCiIHJl
Y29ubmVjdGluZyBpbiAke3NlY29uZHN9c+KApiIpCiAgICAgICAgICAgIHJldHJ5UnVubmFibGUg
PSBSdW5uYWJsZSB7IHN0YXJ0UGxheWJhY2soZm9yY2VSZXN0YXJ0ID0ga2luZCA9PSAibGl2ZSIp
IH0uYWxzbyB7CiAgICAgICAgICAgICAgICBoYW5kbGVyLnBvc3REZWxheWVkKGl0LCBzZWNvbmRz
ICogMTAwMEwpCiAgICAgICAgICAgIH0KICAgICAgICB9IGVsc2UgewogICAgICAgICAgICB2YWwg
ZGV0YWlsID0gd2hlbiAoZXJyb3IuZXJyb3JDb2RlKSB7CiAgICAgICAgICAgICAgICBQbGF5YmFj
a0V4Y2VwdGlvbi5FUlJPUl9DT0RFX0lPX05FVFdPUktfQ09OTkVDVElPTl9GQUlMRUQsCiAgICAg
ICAgICAgICAgICBQbGF5YmFja0V4Y2VwdGlvbi5FUlJPUl9DT0RFX0lPX05FVFdPUktfQ09OTkVD
VElPTl9USU1FT1VUIC0+ICJUaGUgc3RyZWFtIHNlcnZlciBjb3VsZCBub3QgYmUgcmVhY2hlZC4i
CiAgICAgICAgICAgICAgICBQbGF5YmFja0V4Y2VwdGlvbi5FUlJPUl9DT0RFX1BBUlNJTkdfQ09O
VEFJTkVSX1VOU1VQUE9SVEVELAogICAgICAgICAgICAgICAgUGxheWJhY2tFeGNlcHRpb24uRVJS
T1JfQ09ERV9ERUNPRElOR19GT1JNQVRfVU5TVVBQT1JURUQgLT4gIlRoaXMgc3RyZWFtIGZvcm1h
dCBpcyBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgZGV2aWNlLiIKICAgICAgICAgICAgICAgIGVsc2Ug
LT4gIlRoZSBzdHJlYW0gY291bGQgbm90IGJlIHBsYXllZCByaWdodCBub3cuIgogICAgICAgICAg
ICB9CiAgICAgICAgICAgIHNob3dFcnJvcigiJGRldGFpbFxuVHJ5IHRoZSBjaGFubmVsIGFnYWlu
IG9yIGNob29zZSBhbm90aGVyIHN0cmVhbS4iKQogICAgICAgIH0KICAgIH0KCiAgICBwcml2YXRl
IGZ1biBzaG93TG9hZGluZyhtZXNzYWdlOiBTdHJpbmcpIHsKICAgICAgICBmaW5kVmlld0J5SWQ8
Vmlldz4oUi5pZC5zdGF0dXNPdmVybGF5KS52aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFCiAgICAg
ICAgZmluZFZpZXdCeUlkPFByb2dyZXNzQmFyPihSLmlkLmxvYWRpbmdTcGlubmVyKS52aXNpYmls
aXR5ID0gVmlldy5WSVNJQkxFCiAgICAgICAgZmluZFZpZXdCeUlkPFRleHRWaWV3PihSLmlkLnN0
YXR1c1RleHQpLnRleHQgPSBtZXNzYWdlCiAgICAgICAgZmluZFZpZXdCeUlkPEJ1dHRvbj4oUi5p
ZC5yZXRyeUJ1dHRvbikudmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgfQoKICAgIHByaXZhdGUg
ZnVuIHNob3dFcnJvcihtZXNzYWdlOiBTdHJpbmcpIHsKICAgICAgICBmaW5kVmlld0J5SWQ8Vmll
dz4oUi5pZC5zdGF0dXNPdmVybGF5KS52aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFCiAgICAgICAg
ZmluZFZpZXdCeUlkPFByb2dyZXNzQmFyPihSLmlkLmxvYWRpbmdTcGlubmVyKS52aXNpYmlsaXR5
ID0gVmlldy5HT05FCiAgICAgICAgZmluZFZpZXdCeUlkPFRleHRWaWV3PihSLmlkLnN0YXR1c1Rl
eHQpLnRleHQgPSBtZXNzYWdlCiAgICAgICAgZmluZFZpZXdCeUlkPEJ1dHRvbj4oUi5pZC5yZXRy
eUJ1dHRvbikuYXBwbHkgewogICAgICAgICAgICB2aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFCiAg
ICAgICAgICAgIHJlcXVlc3RGb2N1cygpCiAgICAgICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVu
IGhpZGVTdGF0dXMoKSB7CiAgICAgICAgZmluZFZpZXdCeUlkPFZpZXc+KFIuaWQuc3RhdHVzT3Zl
cmxheSkudmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgfQoKICAgIHByaXZhdGUgZnVuIHN1cHBv
cnRlZFRyYWNrcyh0cmFja3M6IFRyYWNrcywgdHlwZTogSW50LCBwcmVmaXg6IFN0cmluZyk6IExp
c3Q8VHJhY2tDaG9pY2U+IHsKICAgICAgICB2YXIgbnVtYmVyID0gMAogICAgICAgIHJldHVybiBi
dWlsZExpc3QgewogICAgICAgICAgICB0cmFja3MuZ3JvdXBzLmZpbHRlciB7IGl0LnR5cGUgPT0g
dHlwZSB9LmZvckVhY2ggeyBncm91cCAtPgogICAgICAgICAgICAgICAgZm9yIChpbmRleCBpbiAw
IHVudGlsIGdyb3VwLmxlbmd0aCkgewogICAgICAgICAgICAgICAgICAgIGlmICghZ3JvdXAuaXNU
cmFja1N1cHBvcnRlZChpbmRleCkpIGNvbnRpbnVlCiAgICAgICAgICAgICAgICAgICAgbnVtYmVy
KysKICAgICAgICAgICAgICAgICAgICBhZGQoVHJhY2tDaG9pY2UoZ3JvdXAsIGluZGV4LCB0cmFj
a0xhYmVsKGdyb3VwLmdldFRyYWNrRm9ybWF0KGluZGV4KSwgIiRwcmVmaXggJG51bWJlciIpKSkK
ICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgfQogICAgICAgIH0KICAgIH0KCiAgICBwcml2
YXRlIGZ1biB0cmFja0xhYmVsKGZvcm1hdDogRm9ybWF0LCBmYWxsYmFjazogU3RyaW5nKTogU3Ry
aW5nIHsKICAgICAgICB2YWwgcGFydHMgPSBsaXN0T2YoZm9ybWF0LmxhYmVsLCBmb3JtYXQubGFu
Z3VhZ2U/LnVwcGVyY2FzZSgpLCBmb3JtYXQuY29kZWNzKQogICAgICAgICAgICAuZmlsdGVyTm90
TnVsbCgpLm1hcCB7IGl0LnRyaW0oKSB9LmZpbHRlciB7IGl0LmlzTm90QmxhbmsoKSB9LmRpc3Rp
bmN0KCkKICAgICAgICByZXR1cm4gcGFydHMuam9pblRvU3RyaW5nKCIg4oCiICIpLmlmQmxhbmsg
eyBmYWxsYmFjayB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gdXBkYXRlVHJhY2tDb250cm9scyh0
cmFja3M6IFRyYWNrcykgewogICAgICAgIHZhbCBhdWRpbyA9IHN1cHBvcnRlZFRyYWNrcyh0cmFj
a3MsIEMuVFJBQ0tfVFlQRV9BVURJTywgIkF1ZGlvIikKICAgICAgICB2YWwgc3VidGl0bGVzID0g
c3VwcG9ydGVkVHJhY2tzKHRyYWNrcywgQy5UUkFDS19UWVBFX1RFWFQsICJTdWJ0aXRsZXMiKQog
ICAgICAgIHZhbCBwYW5lbCA9IGZpbmRWaWV3QnlJZDxWaWV3PihSLmlkLnBsYXllclRyYWNrQ29u
dHJvbHMpCiAgICAgICAgcGFuZWwudmlzaWJpbGl0eSA9IGlmIChjb250cm9sbGVyVmlzaWJsZSAm
JiAoYXVkaW8uaXNOb3RFbXB0eSgpIHx8IHN1YnRpdGxlcy5pc05vdEVtcHR5KCkpKSBWaWV3LlZJ
U0lCTEUgZWxzZSBWaWV3LkdPTkUKCiAgICAgICAgZmluZFZpZXdCeUlkPEJ1dHRvbj4oUi5pZC5h
dWRpb1RyYWNrQnV0dG9uKS5hcHBseSB7CiAgICAgICAgICAgIHZpc2liaWxpdHkgPSBpZiAoYXVk
aW8uaXNFbXB0eSgpKSBWaWV3LkdPTkUgZWxzZSBWaWV3LlZJU0lCTEUKICAgICAgICAgICAgdGV4
dCA9ICJBVURJTyAg4oCiICAke2F1ZGlvLmZpcnN0T3JOdWxsIHsgaXQuZ3JvdXAuaXNUcmFja1Nl
bGVjdGVkKGl0LmluZGV4KSB9Py5sYWJlbCA/OiAiQVVUTyJ9IgogICAgICAgIH0KICAgICAgICBm
aW5kVmlld0J5SWQ8QnV0dG9uPihSLmlkLnN1YnRpdGxlVHJhY2tCdXR0b24pLmFwcGx5IHsKICAg
ICAgICAgICAgdmlzaWJpbGl0eSA9IGlmIChzdWJ0aXRsZXMuaXNFbXB0eSgpKSBWaWV3LkdPTkUg
ZWxzZSBWaWV3LlZJU0lCTEUKICAgICAgICAgICAgdGV4dCA9ICJTVUJUSVRMRVMgIOKAoiAgJHtz
dWJ0aXRsZXMuZmlyc3RPck51bGwgeyBpdC5ncm91cC5pc1RyYWNrU2VsZWN0ZWQoaXQuaW5kZXgp
IH0/LmxhYmVsID86ICJPRkYifSIKICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gc2hv
d0F1ZGlvVHJhY2tzKCkgewogICAgICAgIHZhbCBhY3RpdmVQbGF5ZXIgPSBwbGF5ZXIgPzogcmV0
dXJuCiAgICAgICAgdmFsIGNob2ljZXMgPSBzdXBwb3J0ZWRUcmFja3MoYWN0aXZlUGxheWVyLmN1
cnJlbnRUcmFja3MsIEMuVFJBQ0tfVFlQRV9BVURJTywgIkF1ZGlvIikKICAgICAgICBpZiAoY2hv
aWNlcy5pc0VtcHR5KCkpIHJldHVybgogICAgICAgIHZhbCBsYWJlbHMgPSBhcnJheU9mKCJBdXRv
IikgKyBjaG9pY2VzLm1hcCB7IGl0LmxhYmVsIH0KICAgICAgICBBbGVydERpYWxvZy5CdWlsZGVy
KHRoaXMpCiAgICAgICAgICAgIC5zZXRUaXRsZSgiQXVkaW8gdHJhY2siKQogICAgICAgICAgICAu
c2V0U2luZ2xlQ2hvaWNlSXRlbXMobGFiZWxzLCAwKSB7IGRpYWxvZywgd2hpY2ggLT4KICAgICAg
ICAgICAgICAgIHZhbCBidWlsZGVyID0gYWN0aXZlUGxheWVyLnRyYWNrU2VsZWN0aW9uUGFyYW1l
dGVycy5idWlsZFVwb24oKQogICAgICAgICAgICAgICAgICAgIC5zZXRUcmFja1R5cGVEaXNhYmxl
ZChDLlRSQUNLX1RZUEVfQVVESU8sIGZhbHNlKQogICAgICAgICAgICAgICAgICAgIC5jbGVhck92
ZXJyaWRlc09mVHlwZShDLlRSQUNLX1RZUEVfQVVESU8pCiAgICAgICAgICAgICAgICBpZiAod2hp
Y2ggPiAwKSB7CiAgICAgICAgICAgICAgICAgICAgdmFsIGNob2ljZSA9IGNob2ljZXNbd2hpY2gg
LSAxXQogICAgICAgICAgICAgICAgICAgIGJ1aWxkZXIuc2V0T3ZlcnJpZGVGb3JUeXBlKFRyYWNr
U2VsZWN0aW9uT3ZlcnJpZGUoY2hvaWNlLmdyb3VwLm1lZGlhVHJhY2tHcm91cCwgbGlzdE9mKGNo
b2ljZS5pbmRleCkpKQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgYWN0aXZlUGxh
eWVyLnRyYWNrU2VsZWN0aW9uUGFyYW1ldGVycyA9IGJ1aWxkZXIuYnVpbGQoKQogICAgICAgICAg
ICAgICAgYWN0aXZlUGxheWVyLnZvbHVtZSA9IDFmCiAgICAgICAgICAgICAgICBkaWFsb2cuZGlz
bWlzcygpCiAgICAgICAgICAgICAgICB1cGRhdGVUcmFja0NvbnRyb2xzKGFjdGl2ZVBsYXllci5j
dXJyZW50VHJhY2tzKQogICAgICAgICAgICB9CiAgICAgICAgICAgIC5zZXROZWdhdGl2ZUJ1dHRv
bigiQ2FuY2VsIiwgbnVsbCkKICAgICAgICAgICAgLnNob3coKQogICAgfQoKICAgIHByaXZhdGUg
ZnVuIHNob3dTdWJ0aXRsZVRyYWNrcygpIHsKICAgICAgICB2YWwgYWN0aXZlUGxheWVyID0gcGxh
eWVyID86IHJldHVybgogICAgICAgIHZhbCBjaG9pY2VzID0gc3VwcG9ydGVkVHJhY2tzKGFjdGl2
ZVBsYXllci5jdXJyZW50VHJhY2tzLCBDLlRSQUNLX1RZUEVfVEVYVCwgIlN1YnRpdGxlcyIpCiAg
ICAgICAgaWYgKGNob2ljZXMuaXNFbXB0eSgpKSByZXR1cm4KICAgICAgICB2YWwgbGFiZWxzID0g
YXJyYXlPZigiT2ZmIikgKyBjaG9pY2VzLm1hcCB7IGl0LmxhYmVsIH0KICAgICAgICBBbGVydERp
YWxvZy5CdWlsZGVyKHRoaXMpCiAgICAgICAgICAgIC5zZXRUaXRsZSgiU3VidGl0bGVzIikKICAg
ICAgICAgICAgLnNldFNpbmdsZUNob2ljZUl0ZW1zKGxhYmVscywgMCkgeyBkaWFsb2csIHdoaWNo
IC0+CiAgICAgICAgICAgICAgICB2YWwgYnVpbGRlciA9IGFjdGl2ZVBsYXllci50cmFja1NlbGVj
dGlvblBhcmFtZXRlcnMuYnVpbGRVcG9uKCkKICAgICAgICAgICAgICAgICAgICAuY2xlYXJPdmVy
cmlkZXNPZlR5cGUoQy5UUkFDS19UWVBFX1RFWFQpCiAgICAgICAgICAgICAgICAgICAgLnNldFRy
YWNrVHlwZURpc2FibGVkKEMuVFJBQ0tfVFlQRV9URVhULCB3aGljaCA9PSAwKQogICAgICAgICAg
ICAgICAgaWYgKHdoaWNoID4gMCkgewogICAgICAgICAgICAgICAgICAgIHZhbCBjaG9pY2UgPSBj
aG9pY2VzW3doaWNoIC0gMV0KICAgICAgICAgICAgICAgICAgICBidWlsZGVyLnNldE92ZXJyaWRl
Rm9yVHlwZShUcmFja1NlbGVjdGlvbk92ZXJyaWRlKGNob2ljZS5ncm91cC5tZWRpYVRyYWNrR3Jv
dXAsIGxpc3RPZihjaG9pY2UuaW5kZXgpKSkKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAg
ICAgIGFjdGl2ZVBsYXllci50cmFja1NlbGVjdGlvblBhcmFtZXRlcnMgPSBidWlsZGVyLmJ1aWxk
KCkKICAgICAgICAgICAgICAgIGRpYWxvZy5kaXNtaXNzKCkKICAgICAgICAgICAgICAgIHVwZGF0
ZVRyYWNrQ29udHJvbHMoYWN0aXZlUGxheWVyLmN1cnJlbnRUcmFja3MpCiAgICAgICAgICAgIH0K
ICAgICAgICAgICAgLnNldE5lZ2F0aXZlQnV0dG9uKCJDYW5jZWwiLCBudWxsKQogICAgICAgICAg
ICAuc2hvdygpCiAgICB9CgogICAgb3ZlcnJpZGUgZnVuIG9uU3RvcCgpIHsKICAgICAgICByZXRy
eVJ1bm5hYmxlPy5sZXQgeyBoYW5kbGVyLnJlbW92ZUNhbGxiYWNrcyhpdCkgfQogICAgICAgIHJl
dHJ5UnVubmFibGUgPSBudWxsCiAgICAgICAgdmFsIHAgPSBwbGF5ZXIKICAgICAgICBpZiAocCAh
PSBudWxsICYmIGtpbmQgIT0gImxpdmUiICYmIHVybC5pc05vdEJsYW5rKCkgJiYgUGxheWVyUHJl
ZnMuc2F2ZVByb2dyZXNzKHRoaXMpKSB7CiAgICAgICAgICAgIHZhbCBwb3NpdGlvbiA9IHAuY3Vy
cmVudFBvc2l0aW9uLmNvZXJjZUF0TGVhc3QoMCkKICAgICAgICAgICAgdmFsIGR1cmF0aW9uID0g
cC5kdXJhdGlvbi5jb2VyY2VBdExlYXN0KDApCiAgICAgICAgICAgIC8vIEF2b2lkIGNsdXR0ZXJp
bmcgQ29udGludWUgV2F0Y2hpbmcgd2hlbiB0aGUgdmlld2VyIG9ubHkgb3BlbmVkIGFuIGl0ZW0g
YnJpZWZseS4KICAgICAgICAgICAgaWYgKHBvc2l0aW9uID49IDE1XzAwMEwgJiYgKGR1cmF0aW9u
IDw9IDBMIHx8IHBvc2l0aW9uIDwgZHVyYXRpb24gLSAxMF8wMDBMKSkgewogICAgICAgICAgICAg
ICAgQ29udGludWVXYXRjaGluZy5zYXZlKHRoaXMsIENvbnRpbnVlSXRlbShuYW1lLCB1cmwsIHBv
c2l0aW9uLCBkdXJhdGlvbiwga2luZCwgU3lzdGVtLmN1cnJlbnRUaW1lTWlsbGlzKCkpKQogICAg
ICAgICAgICB9CiAgICAgICAgfQogICAgICAgIGZpbmRWaWV3QnlJZDxQbGF5ZXJWaWV3PihSLmlk
LnBsYXllclZpZXcpLnBsYXllciA9IG51bGwKICAgICAgICBwPy5yZW1vdmVMaXN0ZW5lcihsaXN0
ZW5lcikKICAgICAgICBwPy5yZWxlYXNlKCkKICAgICAgICBwbGF5ZXIgPSBudWxsCiAgICAgICAg
c3VwZXIub25TdG9wKCkKICAgIH0KCiAgICBvdmVycmlkZSBmdW4gb25EZXN0cm95KCkgewogICAg
ICAgIHJldHJ5UnVubmFibGU/LmxldCB7IGhhbmRsZXIucmVtb3ZlQ2FsbGJhY2tzKGl0KSB9CiAg
ICAgICAgZXhlY3V0b3Iuc2h1dGRvd25Ob3coKQogICAgICAgIHN1cGVyLm9uRGVzdHJveSgpCiAg
ICB9Cn0K
:::END PLAYER
:::BEGIN CONTINUE
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkNvbnRleHQKaW1wb3J0IG9yZy5qc29uLkpTT05BcnJheQppbXBvcnQgb3JnLmpzb24uSlNPTk9i
amVjdAoKb2JqZWN0IENvbnRpbnVlV2F0Y2hpbmcgewogICAgcHJpdmF0ZSBjb25zdCB2YWwgUFJF
RlMgPSAiY29udGludWVfd2F0Y2hpbmciCiAgICBwcml2YXRlIGNvbnN0IHZhbCBLRVkgPSAiaXRl
bXMiCgogICAgZnVuIHNhdmUoY29udGV4dDogQ29udGV4dCwgaXRlbTogQ29udGludWVJdGVtKSB7
CiAgICAgICAgdmFsIHNhZmVVcmwgPSBPdXRib3VuZFVybFBvbGljeS5ub3JtYWxpemVQbGF5YmFj
a1VybChpdGVtLnVybCkKICAgICAgICBpZiAoc2FmZVVybC5pc0JsYW5rKCkpIHJldHVybgogICAg
ICAgIHZhbCBzYWZlSXRlbSA9IGl0ZW0uY29weSh1cmwgPSBzYWZlVXJsKQogICAgICAgIHZhbCBj
dXJyZW50ID0gYWxsKGNvbnRleHQpLmZpbHRlck5vdCB7IGl0LnVybCA9PSBzYWZlSXRlbS51cmwg
fS50b011dGFibGVMaXN0KCkKICAgICAgICBpZiAoc2FmZUl0ZW0uZHVyYXRpb25NcyA+IDAgJiYg
c2FmZUl0ZW0ucG9zaXRpb25NcyA+PSBzYWZlSXRlbS5kdXJhdGlvbk1zICogMC45NSkgewogICAg
ICAgICAgICB3cml0ZShjb250ZXh0LCBjdXJyZW50KQogICAgICAgICAgICByZXR1cm4KICAgICAg
ICB9CiAgICAgICAgY3VycmVudC5hZGQoMCwgc2FmZUl0ZW0pCiAgICAgICAgd3JpdGUoY29udGV4
dCwgY3VycmVudC50YWtlKDIwKSkKICAgIH0KCiAgICBmdW4gYWxsKGNvbnRleHQ6IENvbnRleHQp
OiBMaXN0PENvbnRpbnVlSXRlbT4gewogICAgICAgIHZhbCByYXcgPSBjb250ZXh0LmdldFNoYXJl
ZFByZWZlcmVuY2VzKFBSRUZTLCBDb250ZXh0Lk1PREVfUFJJVkFURSkuZ2V0U3RyaW5nKEtFWSwg
IltdIikgPzogIltdIgogICAgICAgIHJldHVybiB0cnkgewogICAgICAgICAgICB2YWwgYXJyID0g
SlNPTkFycmF5KHJhdykKICAgICAgICAgICAgdmFsIHBhcnNlZCA9IGJ1aWxkTGlzdCB7CiAgICAg
ICAgICAgICAgICBmb3IgKGkgaW4gMCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsKICAgICAgICAgICAg
ICAgICAgICB2YWwgbyA9IGFyci5nZXRKU09OT2JqZWN0KGkpCiAgICAgICAgICAgICAgICAgICAg
YWRkKENvbnRpbnVlSXRlbShvLm9wdFN0cmluZygibmFtZSIpLCBvLm9wdFN0cmluZygidXJsIiks
IG8ub3B0TG9uZygicG9zaXRpb25NcyIpLCBvLm9wdExvbmcoImR1cmF0aW9uTXMiKSwgby5vcHRT
dHJpbmcoImtpbmQiLCAidmlkZW8iKSwgby5vcHRMb25nKCJ1cGRhdGVkQXQiKSkpCiAgICAgICAg
ICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAgdmFsIGNsZWFuZWQgPSBwYXJzZWQu
ZmlsdGVyIHsKICAgICAgICAgICAgICAgIE91dGJvdW5kVXJsUG9saWN5Lm5vcm1hbGl6ZVBsYXli
YWNrVXJsKGl0LnVybCkuaXNOb3RCbGFuaygpCiAgICAgICAgICAgIH0uc29ydGVkQnlEZXNjZW5k
aW5nIHsgaXQudXBkYXRlZEF0IH0KICAgICAgICAgICAgaWYgKGNsZWFuZWQuc2l6ZSAhPSBwYXJz
ZWQuc2l6ZSkgd3JpdGUoY29udGV4dCwgY2xlYW5lZCkKICAgICAgICAgICAgY2xlYW5lZAogICAg
ICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikgeyBlbXB0eUxpc3QoKSB9CiAgICB9CgogICAgZnVu
IGZpbmQoY29udGV4dDogQ29udGV4dCwgdXJsOiBTdHJpbmcsIGtpbmQ6IFN0cmluZz8gPSBudWxs
KTogQ29udGludWVJdGVtPyA9CiAgICAgICAgYWxsKGNvbnRleHQpLmZpcnN0T3JOdWxsIHsgaXQu
dXJsID09IHVybCAmJiAoa2luZCA9PSBudWxsIHx8IGl0LmtpbmQgPT0ga2luZCkgfQoKICAgIGZ1
biByZW1vdmUoY29udGV4dDogQ29udGV4dCwgdXJsOiBTdHJpbmcpIHsKICAgICAgICB3cml0ZShj
b250ZXh0LCBhbGwoY29udGV4dCkuZmlsdGVyTm90IHsgaXQudXJsID09IHVybCB9KQogICAgfQoK
ICAgIGZ1biBjbGVhcihjb250ZXh0OiBDb250ZXh0KSA9IGNvbnRleHQuZ2V0U2hhcmVkUHJlZmVy
ZW5jZXMoUFJFRlMsIENvbnRleHQuTU9ERV9QUklWQVRFKS5lZGl0KCkucmVtb3ZlKEtFWSkuYXBw
bHkoKQoKICAgIHByaXZhdGUgZnVuIHdyaXRlKGNvbnRleHQ6IENvbnRleHQsIGl0ZW1zOiBMaXN0
PENvbnRpbnVlSXRlbT4pIHsKICAgICAgICB2YWwgYXJyID0gSlNPTkFycmF5KCkKICAgICAgICBp
dGVtcy5mb3JFYWNoIHsgaSAtPiBhcnIucHV0KEpTT05PYmplY3QoKS5hcHBseSB7CiAgICAgICAg
ICAgIHB1dCgibmFtZSIsIGkubmFtZSk7IHB1dCgidXJsIiwgaS51cmwpOyBwdXQoInBvc2l0aW9u
TXMiLCBpLnBvc2l0aW9uTXMpOyBwdXQoImR1cmF0aW9uTXMiLCBpLmR1cmF0aW9uTXMpOyBwdXQo
ImtpbmQiLCBpLmtpbmQpOyBwdXQoInVwZGF0ZWRBdCIsIGkudXBkYXRlZEF0KQogICAgICAgIH0p
IH0KICAgICAgICBjb250ZXh0LmdldFNoYXJlZFByZWZlcmVuY2VzKFBSRUZTLCBDb250ZXh0Lk1P
REVfUFJJVkFURSkuZWRpdCgpLnB1dFN0cmluZyhLRVksIGFyci50b1N0cmluZygpKS5hcHBseSgp
CiAgICB9Cn0K
:::END CONTINUE
:::BEGIN FAVORITES
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkNvbnRleHQKaW1wb3J0IG9yZy5qc29uLkpTT05BcnJheQppbXBvcnQgb3JnLmpzb24uSlNPTk9i
amVjdAoKZGF0YSBjbGFzcyBGYXZvcml0ZUl0ZW0odmFsIG5hbWU6IFN0cmluZywgdmFsIHVybDog
U3RyaW5nKQoKb2JqZWN0IEZhdm9yaXRlcyB7CiAgICBwcml2YXRlIGNvbnN0IHZhbCBQUkVGID0g
ImtzX2Zhdm9yaXRlcyIKICAgIHByaXZhdGUgY29uc3QgdmFsIEtFWSA9ICJpdGVtcyIKCiAgICBm
dW4gYWxsKGNvbnRleHQ6IENvbnRleHQpOiBNdXRhYmxlTGlzdDxGYXZvcml0ZUl0ZW0+IHsKICAg
ICAgICB2YWwgcmF3ID0gY29udGV4dC5nZXRTaGFyZWRQcmVmZXJlbmNlcyhQUkVGLCBDb250ZXh0
Lk1PREVfUFJJVkFURSkuZ2V0U3RyaW5nKEtFWSwgIltdIikgPzogIltdIgogICAgICAgIHJldHVy
biB0cnkgewogICAgICAgICAgICB2YWwgYXJyID0gSlNPTkFycmF5KHJhdykKICAgICAgICAgICAg
dmFsIHBhcnNlZCA9IG11dGFibGVMaXN0T2Y8RmF2b3JpdGVJdGVtPigpCiAgICAgICAgICAgIGZv
ciAoaSBpbiAwIHVudGlsIGFyci5sZW5ndGgoKSkgewogICAgICAgICAgICAgICAgdmFsIG8gPSBh
cnIuZ2V0SlNPTk9iamVjdChpKQogICAgICAgICAgICAgICAgcGFyc2VkLmFkZChGYXZvcml0ZUl0
ZW0oby5vcHRTdHJpbmcoIm5hbWUiKSwgby5vcHRTdHJpbmcoInVybCIpKSkKICAgICAgICAgICAg
fQogICAgICAgICAgICB2YWwgY2xlYW5lZCA9IHBhcnNlZC5tYXBOb3ROdWxsIHsgaXRlbSAtPgog
ICAgICAgICAgICAgICAgT3V0Ym91bmRVcmxQb2xpY3kubm9ybWFsaXplUGxheWJhY2tVcmwoaXRl
bS51cmwpCiAgICAgICAgICAgICAgICAgICAgLnRha2VJZiB7IGl0LmlzTm90QmxhbmsoKSB9CiAg
ICAgICAgICAgICAgICAgICAgPy5sZXQgeyBpdGVtLmNvcHkodXJsID0gaXQpIH0KICAgICAgICAg
ICAgfS50b011dGFibGVMaXN0KCkKICAgICAgICAgICAgaWYgKGNsZWFuZWQuc2l6ZSAhPSBwYXJz
ZWQuc2l6ZSkgd3JpdGUoY29udGV4dCwgY2xlYW5lZCkKICAgICAgICAgICAgY2xlYW5lZAogICAg
ICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikgewogICAgICAgICAgICBtdXRhYmxlTGlzdE9mKCkK
ICAgICAgICB9CiAgICB9CgogICAgZnVuIHRvZ2dsZShjb250ZXh0OiBDb250ZXh0LCBpdGVtOiBG
YXZvcml0ZUl0ZW0pOiBCb29sZWFuIHsKICAgICAgICB2YWwgc2FmZVVybCA9IE91dGJvdW5kVXJs
UG9saWN5Lm5vcm1hbGl6ZVBsYXliYWNrVXJsKGl0ZW0udXJsKQogICAgICAgIGlmIChzYWZlVXJs
LmlzQmxhbmsoKSkgcmV0dXJuIGZhbHNlCiAgICAgICAgdmFsIHNhZmVJdGVtID0gaXRlbS5jb3B5
KHVybCA9IHNhZmVVcmwpCiAgICAgICAgdmFsIGxpc3QgPSBhbGwoY29udGV4dCk7IHZhbCBpZHgg
PSBsaXN0LmluZGV4T2ZGaXJzdCB7IGl0LnVybCA9PSBzYWZlSXRlbS51cmwgfQogICAgICAgIHZh
bCBhZGRlZCA9IGlkeCA8IDAKICAgICAgICBpZiAoYWRkZWQpIGxpc3QuYWRkKHNhZmVJdGVtKSBl
bHNlIGxpc3QucmVtb3ZlQXQoaWR4KQogICAgICAgIHdyaXRlKGNvbnRleHQsIGxpc3QpCiAgICAg
ICAgcmV0dXJuIGFkZGVkCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gd3JpdGUoY29udGV4dDogQ29u
dGV4dCwgaXRlbXM6IExpc3Q8RmF2b3JpdGVJdGVtPikgewogICAgICAgIHZhbCBhcnIgPSBKU09O
QXJyYXkoKQogICAgICAgIGl0ZW1zLmZvckVhY2ggeyBhcnIucHV0KEpTT05PYmplY3QoKS5wdXQo
Im5hbWUiLCBpdC5uYW1lKS5wdXQoInVybCIsIGl0LnVybCkpIH0KICAgICAgICBjb250ZXh0Lmdl
dFNoYXJlZFByZWZlcmVuY2VzKFBSRUYsIENvbnRleHQuTU9ERV9QUklWQVRFKS5lZGl0KCkucHV0
U3RyaW5nKEtFWSwgYXJyLnRvU3RyaW5nKCkpLmFwcGx5KCkKICAgIH0KfQo=
:::END FAVORITES
:::BEGIN VERIFYPS
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV0KICAgIFtzdHJpbmddJFBy
b2plY3RSb290LAogICAgW1BhcmFtZXRlcihNYW5kYXRvcnkgPSAkdHJ1ZSldCiAgICBbc3RyaW5n
XSRBcHByb3ZlZFJvb3QKKQoKJEVycm9yQWN0aW9uUHJlZmVyZW5jZSA9ICdTdG9wJwoKZnVuY3Rp
b24gQXNzZXJ0LUNvbnRhaW5zKFtzdHJpbmddJFBhdGgsIFtzdHJpbmddJE5lZWRsZSwgW3N0cmlu
Z10kTGFiZWwpIHsKICAgICRjb250ZW50ID0gW0lPLkZpbGVdOjpSZWFkQWxsVGV4dCgkUGF0aCkK
ICAgIGlmICgtbm90ICRjb250ZW50LkNvbnRhaW5zKCROZWVkbGUpKSB7CiAgICAgICAgdGhyb3cg
IiRMYWJlbCB2ZXJpZmljYXRpb24gZmFpbGVkIGluICRQYXRoIgogICAgfQp9CgokcGxheWVyUm9v
dCA9IEpvaW4tUGF0aCAkUHJvamVjdFJvb3QgJ2FwcFxzcmNcbWFpblxqYXZhXGNvbVxrcmlzdGFs
c3RyZWFtc1xwbGF5ZXInCiRhcHByb3ZlZE1haW4gPSBKb2luLVBhdGggJEFwcHJvdmVkUm9vdCAn
YXBwXHNyY1xtYWluJwokY2FuZGlkYXRlTWFpbiA9IEpvaW4tUGF0aCAkUHJvamVjdFJvb3QgJ2Fw
cFxzcmNcbWFpbicKJHBvbGljeSA9IEpvaW4tUGF0aCAkcGxheWVyUm9vdCAnT3V0Ym91bmRVcmxQ
b2xpY3kua3QnCiR4dHJlYW0gPSBKb2luLVBhdGggJHBsYXllclJvb3QgJ1h0cmVhbUNsaWVudC5r
dCcKJGltYWdlcyA9IEpvaW4tUGF0aCAkcGxheWVyUm9vdCAnUmVtb3RlSW1hZ2VMb2FkZXIua3Qn
CiRwbGF5ZXIgPSBKb2luLVBhdGggJHBsYXllclJvb3QgJ1BsYXllckFjdGl2aXR5Lmt0JwokY29u
dGludWUgPSBKb2luLVBhdGggJHBsYXllclJvb3QgJ0NvbnRpbnVlV2F0Y2hpbmcua3QnCiRmYXZv
cml0ZXMgPSBKb2luLVBhdGggJHBsYXllclJvb3QgJ0Zhdm9yaXRlcy5rdCcKJGdyYWRsZSA9IEpv
aW4tUGF0aCAkUHJvamVjdFJvb3QgJ2FwcFxidWlsZC5ncmFkbGUua3RzJwoKZm9yZWFjaCAoJHJl
cXVpcmVkIGluIEAoJHBvbGljeSwgJHh0cmVhbSwgJGltYWdlcywgJHBsYXllciwgJGNvbnRpbnVl
LCAkZmF2b3JpdGVzLCAkZ3JhZGxlKSkgewogICAgaWYgKC1ub3QgKFRlc3QtUGF0aCAtTGl0ZXJh
bFBhdGggJHJlcXVpcmVkKSkgewogICAgICAgIHRocm93ICJSZXF1aXJlZCBzYWZldHkgZmlsZSB3
YXMgbm90IGZvdW5kOiAkcmVxdWlyZWQiCiAgICB9Cn0KCkFzc2VydC1Db250YWlucyAkcG9saWN5
ICdmdW4gcmVxdWlyZVByb3ZpZGVyQXBpVXJsJyAnUHJvdmlkZXIgQVBJIGFsbG93bGlzdCcKQXNz
ZXJ0LUNvbnRhaW5zICRwb2xpY3kgJ2Z1biBub3JtYWxpemVBcnR3b3JrVXJsJyAnQXJ0d29yayBV
UkwgcG9saWN5JwpBc3NlcnQtQ29udGFpbnMgJHBvbGljeSAnZnVuIG5vcm1hbGl6ZVBsYXliYWNr
VXJsJyAnUGxheWJhY2sgVVJMIHBvbGljeScKQXNzZXJ0LUNvbnRhaW5zICRwb2xpY3kgJ2Z1biBw
cm92aWRlclBsYXliYWNrVXJsJyAnUHJvdmlkZXIgbWVkaWEgVVJMIHBvbGljeScKQXNzZXJ0LUNv
bnRhaW5zICRwb2xpY3kgJ1BST1ZJREVSX1JFUVVFU1RfU1BBQ0lOR19NUycgJ1Byb3ZpZGVyIHJl
cXVlc3QgdGhyb3R0bGUnCkFzc2VydC1Db250YWlucyAkcG9saWN5ICdQUk9WSURFUl9SRUpFQ1RJ
T05fQ09PTERPV05fTVMnICdQcm92aWRlciByZWplY3Rpb24gY29vbGRvd24nCkFzc2VydC1Db250
YWlucyAkcG9saWN5ICdodHRwOi8vZXhhbXBsZS5jb20vbnVsbCcgJ0ZhaWwtY2xvc2VkIHJ1bnRp
bWUgc2VsZi1jaGVjaycKCkFzc2VydC1Db250YWlucyAkeHRyZWFtICdPdXRib3VuZFVybFBvbGlj
eS5iZWZvcmVQcm92aWRlclJlcXVlc3QodXJsKScgJ1Byb3ZpZGVyIHJlcXVlc3QgZ2F0ZScKQXNz
ZXJ0LUNvbnRhaW5zICR4dHJlYW0gJ091dGJvdW5kVXJsUG9saWN5LnByb3ZpZGVyUGxheWJhY2tV
cmwoJyAnUHJvdmlkZXIgcGxheWJhY2sgY29uc3RydWN0aW9uJwpBc3NlcnQtQ29udGFpbnMgJHh0
cmVhbSAnT3V0Ym91bmRVcmxQb2xpY3kuc2FmZUV4dGVuc2lvbignICdQcm92aWRlciBleHRlbnNp
b24gZmlsdGVyJwpBc3NlcnQtQ29udGFpbnMgJHh0cmVhbSAnT3V0Ym91bmRVcmxQb2xpY3kuc2Fm
ZVF1ZXJ5VmFsdWUoY2F0ZWdvcnlJZCknICdQcm92aWRlciBjYXRlZ29yeSBmaWx0ZXInCkFzc2Vy
dC1Db250YWlucyAkaW1hZ2VzICdPdXRib3VuZFVybFBvbGljeS5ub3JtYWxpemVSZW1vdGVIdHRw
VXJsKHVybCknICdBcnR3b3JrIHJlcXVlc3QgZ2F0ZScKQXNzZXJ0LUNvbnRhaW5zICRpbWFnZXMg
J2luc3RhbmNlRm9sbG93UmVkaXJlY3RzID0gZmFsc2UnICdSZWRpcmVjdCByZXZhbGlkYXRpb24n
CkFzc2VydC1Db250YWlucyAkaW1hZ2VzICdpbkZsaWdodC5hZGQobm9ybWFsaXplZCknICdEdXBs
aWNhdGUgYXJ0d29yayBzdXBwcmVzc2lvbicKQXNzZXJ0LUNvbnRhaW5zICRpbWFnZXMgJ0ZBSUxF
RF9VUkxfQ09PTERPV05fTVMnICdGYWlsZWQgYXJ0d29yayBjb29sZG93bicKQXNzZXJ0LUNvbnRh
aW5zICRwbGF5ZXIgJ3VybCA9IE91dGJvdW5kVXJsUG9saWN5Lm5vcm1hbGl6ZVBsYXliYWNrVXJs
JyAnUGxheWVyIHJlcXVlc3QgZ2F0ZScKQXNzZXJ0LUNvbnRhaW5zICRwbGF5ZXIgJ3JldHJ5YWJs
ZU5ldHdvcmtGYWlsdXJlJyAnTmV0d29yay1vbmx5IHBsYXllciByZXRyeScKQXNzZXJ0LUNvbnRh
aW5zICRwbGF5ZXIgJ0VYVEVOU0lPTl9SRU5ERVJFUl9NT0RFX1BSRUZFUicgJ0FwcHJvdmVkIHNv
ZnR3YXJlIGF1ZGlvIHJlbmRlcmVyJwpBc3NlcnQtQ29udGFpbnMgJGNvbnRpbnVlICdPdXRib3Vu
ZFVybFBvbGljeS5ub3JtYWxpemVQbGF5YmFja1VybCcgJ0NvbnRpbnVlIFdhdGNoaW5nIGNsZWFu
dXAnCkFzc2VydC1Db250YWlucyAkZmF2b3JpdGVzICdPdXRib3VuZFVybFBvbGljeS5ub3JtYWxp
emVQbGF5YmFja1VybCcgJ0Zhdm9yaXRlcyBjbGVhbnVwJwpBc3NlcnQtQ29udGFpbnMgJGdyYWRs
ZSAndmVyc2lvbkNvZGUgPSAxNjgyMDQ1JyAnMTY4MjA0NSBhcHBsaWNhdGlvbiB2ZXJzaW9uJwpB
c3NlcnQtQ29udGFpbnMgJGdyYWRsZSAnMS42Ljgtb3V0Ym91bmQtcmVxdWVzdC1maXJld2FsbCcg
JzE2ODIwNDUgYXBwbGljYXRpb24gbmFtZScKCiRzb3VyY2VGaWxlcyA9IEdldC1DaGlsZEl0ZW0g
LUxpdGVyYWxQYXRoICRwbGF5ZXJSb290IC1GaWx0ZXIgJyoua3QnIC1GaWxlCiRvcGVuTWF0Y2hl
cyA9ICRzb3VyY2VGaWxlcyB8IFNlbGVjdC1TdHJpbmcgLVBhdHRlcm4gJ1wub3BlbkNvbm5lY3Rp
b25cKCcKZm9yZWFjaCAoJG1hdGNoIGluICRvcGVuTWF0Y2hlcykgewogICAgaWYgKChTcGxpdC1Q
YXRoICRtYXRjaC5QYXRoIC1MZWFmKSAtbm90aW4gQCgnWHRyZWFtQ2xpZW50Lmt0JywgJ1JlbW90
ZUltYWdlTG9hZGVyLmt0JykpIHsKICAgICAgICB0aHJvdyAiRGlyZWN0IG5ldHdvcmsgY29ubmVj
dGlvbiBieXBhc3MgZm91bmQgaW4gJCgkbWF0Y2guUGF0aCk6JCgkbWF0Y2guTGluZU51bWJlciki
CiAgICB9Cn0KCiRtZWRpYU1hdGNoZXMgPSAkc291cmNlRmlsZXMgfCBTZWxlY3QtU3RyaW5nIC1T
aW1wbGVNYXRjaCAnTWVkaWFJdGVtLmZyb21VcmkoJwpmb3JlYWNoICgkbWF0Y2ggaW4gJG1lZGlh
TWF0Y2hlcykgewogICAgaWYgKChTcGxpdC1QYXRoICRtYXRjaC5QYXRoIC1MZWFmKSAtbmUgJ1Bs
YXllckFjdGl2aXR5Lmt0JykgewogICAgICAgIHRocm93ICJEaXJlY3QgcGxheWVyIFVSTCBieXBh
c3MgZm91bmQgaW4gJCgkbWF0Y2guUGF0aCk6JCgkbWF0Y2guTGluZU51bWJlcikiCiAgICB9Cn0K
CiRyYXdQcm92aWRlclBhdGhzID0gJHNvdXJjZUZpbGVzIHwgU2VsZWN0LVN0cmluZyAtUGF0dGVy
biAnIlwkXHtiYXNlXChjXC5zZXJ2ZXJcKVx9LyhsaXZlfG1vdmllfHNlcmllcykvJwppZiAoJHJh
d1Byb3ZpZGVyUGF0aHMpIHsKICAgICRmaXJzdCA9ICRyYXdQcm92aWRlclBhdGhzIHwgU2VsZWN0
LU9iamVjdCAtRmlyc3QgMQogICAgdGhyb3cgIlJhdyBwcm92aWRlciBwbGF5YmFjayBwYXRoIGJ5
cGFzcyBmb3VuZCBpbiAkKCRmaXJzdC5QYXRoKTokKCRmaXJzdC5MaW5lTnVtYmVyKSIKfQoKJGFs
bG93ZWRDaGFuZ2VzID0gW0NvbGxlY3Rpb25zLkdlbmVyaWMuSGFzaFNldFtzdHJpbmddXTo6bmV3
KFtTdHJpbmdDb21wYXJlcl06Ok9yZGluYWxJZ25vcmVDYXNlKQpAKAogICAgJ2phdmFcY29tXGty
aXN0YWxzdHJlYW1zXHBsYXllclxYdHJlYW1DbGllbnQua3QnLAogICAgJ2phdmFcY29tXGtyaXN0
YWxzdHJlYW1zXHBsYXllclxSZW1vdGVJbWFnZUxvYWRlci5rdCcsCiAgICAnamF2YVxjb21ca3Jp
c3RhbHN0cmVhbXNccGxheWVyXFBsYXllckFjdGl2aXR5Lmt0JywKICAgICdqYXZhXGNvbVxrcmlz
dGFsc3RyZWFtc1xwbGF5ZXJcQ29udGludWVXYXRjaGluZy5rdCcsCiAgICAnamF2YVxjb21ca3Jp
c3RhbHN0cmVhbXNccGxheWVyXEZhdm9yaXRlcy5rdCcsCiAgICAnamF2YVxjb21ca3Jpc3RhbHN0
cmVhbXNccGxheWVyXE91dGJvdW5kVXJsUG9saWN5Lmt0JwopIHwgRm9yRWFjaC1PYmplY3QgeyBb
dm9pZF0kYWxsb3dlZENoYW5nZXMuQWRkKCRfKSB9Cgpmb3JlYWNoICgkYXBwcm92ZWRGaWxlIGlu
IEdldC1DaGlsZEl0ZW0gLUxpdGVyYWxQYXRoICRhcHByb3ZlZE1haW4gLUZpbGUgLVJlY3Vyc2Up
IHsKICAgICRyZWxhdGl2ZSA9ICRhcHByb3ZlZEZpbGUuRnVsbE5hbWUuU3Vic3RyaW5nKCRhcHBy
b3ZlZE1haW4uTGVuZ3RoKS5UcmltU3RhcnQoJ1wnKQogICAgaWYgKCRhbGxvd2VkQ2hhbmdlcy5D
b250YWlucygkcmVsYXRpdmUpKSB7IGNvbnRpbnVlIH0KICAgICRjYW5kaWRhdGVGaWxlID0gSm9p
bi1QYXRoICRjYW5kaWRhdGVNYWluICRyZWxhdGl2ZQogICAgaWYgKC1ub3QgKFRlc3QtUGF0aCAt
TGl0ZXJhbFBhdGggJGNhbmRpZGF0ZUZpbGUpKSB7CiAgICAgICAgdGhyb3cgIlByb3RlY3RlZCBh
cHByb3ZlZCBzb3VyY2UgZmlsZSBpcyBtaXNzaW5nOiAkcmVsYXRpdmUiCiAgICB9CiAgICAkYXBw
cm92ZWRIYXNoID0gKEdldC1GaWxlSGFzaCAtQWxnb3JpdGhtIFNIQTI1NiAtTGl0ZXJhbFBhdGgg
JGFwcHJvdmVkRmlsZS5GdWxsTmFtZSkuSGFzaAogICAgJGNhbmRpZGF0ZUhhc2ggPSAoR2V0LUZp
bGVIYXNoIC1BbGdvcml0aG0gU0hBMjU2IC1MaXRlcmFsUGF0aCAkY2FuZGlkYXRlRmlsZSkuSGFz
aAogICAgaWYgKCRhcHByb3ZlZEhhc2ggLW5lICRjYW5kaWRhdGVIYXNoKSB7CiAgICAgICAgdGhy
b3cgIlByb3RlY3RlZCBhcHByb3ZlZCBzb3VyY2UgZmlsZSB1bmV4cGVjdGVkbHkgY2hhbmdlZDog
JHJlbGF0aXZlIgogICAgfQp9Cgpmb3JlYWNoICgkY2FuZGlkYXRlRmlsZSBpbiBHZXQtQ2hpbGRJ
dGVtIC1MaXRlcmFsUGF0aCAkY2FuZGlkYXRlTWFpbiAtRmlsZSAtUmVjdXJzZSkgewogICAgJHJl
bGF0aXZlID0gJGNhbmRpZGF0ZUZpbGUuRnVsbE5hbWUuU3Vic3RyaW5nKCRjYW5kaWRhdGVNYWlu
Lkxlbmd0aCkuVHJpbVN0YXJ0KCdcJykKICAgICRhcHByb3ZlZEZpbGUgPSBKb2luLVBhdGggJGFw
cHJvdmVkTWFpbiAkcmVsYXRpdmUKICAgIGlmICgtbm90IChUZXN0LVBhdGggLUxpdGVyYWxQYXRo
ICRhcHByb3ZlZEZpbGUpIC1hbmQgLW5vdCAkYWxsb3dlZENoYW5nZXMuQ29udGFpbnMoJHJlbGF0
aXZlKSkgewogICAgICAgIHRocm93ICJVbmV4cGVjdGVkIHNvdXJjZSBmaWxlIHdhcyBhZGRlZDog
JHJlbGF0aXZlIgogICAgfQp9CgpXcml0ZS1Ib3N0ICdBbGwgb3V0Ym91bmQgcmVxdWVzdHMgYXJl
IGdhdGVkIGFuZCBldmVyeSBwcm90ZWN0ZWQgc291cmNlL2xheW91dCBmaWxlIGlzIHVuY2hhbmdl
ZC4nCg==
:::END VERIFYPS
