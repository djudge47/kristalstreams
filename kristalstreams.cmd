@echo off
setlocal EnableExtensions EnableDelayedExpansion
title KS Null Request Guard 1682044

set "POINTER=%USERPROFILE%\.kristalstreams-working-source.txt"
set "FINAL=%USERPROFILE%\Downloads\KS-NULL-REQUEST-GUARD-1682044.apk"
set "LOG=%TEMP%\ks-null-request-guard-1682044-build.txt"
set "JAVASAVE=%USERPROFILE%\.kristalstreams-java-home.txt"

echo.
echo ==========================================================
echo   KRISTAL STREAMS 1.6.8 - NULL REQUEST GUARD
echo   SAFE INCREMENTAL APK: KS-NULL-REQUEST-GUARD-1682044.apk
echo ==========================================================
echo.
echo Approved baseline: 1682042
echo Rejects blank, null, and undefined provider artwork values.
echo Prevents every automatic /null and /undefined image request.
echo Preserves the approved EPG, playback, Movies, Series, and layouts.
echo Uses the verified incremental Windows source without a clean rebuild.
echo Original known-good R2 and approved 1682042 source remain untouched.
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
    echo ERROR: Approved XtreamClient.kt was not found.
    pause
    exit /b 1
)
if not exist "!APPROVED!\app\src\main\java\com\kristalstreams\player\RemoteImageLoader.kt" (
    echo ERROR: Approved RemoteImageLoader.kt was not found.
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
set "WORK=C:\ksnullrequestguard-!STAMP!"

echo [1/7] Creating an incremental candidate from approved 1682042...
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

echo [2/7] Installing strict null-request protection...
set "PATCHPS=%TEMP%\ks-null-request-guard-1682044.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=[IO.File]::ReadAllText('%~f0'); $a=':::BEGIN '+'NULLGUARDPATCH'; $b=':::END '+'NULLGUARDPATCH'; $s=$raw.IndexOf($a); if($s -lt 0){throw 'Missing null-guard payload'}; $s+=$a.Length; $e=$raw.IndexOf($b,$s); if($e -lt 0){throw 'Missing null-guard payload end'}; $x=$raw.Substring($s,$e-$s)-replace '\s',''; [IO.File]::WriteAllBytes('%PATCHPS%',[Convert]::FromBase64String($x))"
if errorlevel 1 (
    echo ERROR: The null-request guard could not be extracted.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PATCHPS%" -ProjectRoot "!WORK!"
set "RC=!ERRORLEVEL!"
del /q "%PATCHPS%" >nul 2>&1
if not "!RC!"=="0" (
    echo ERROR: The null-request guard could not be applied safely.
    pause
    exit /b !RC!
)

echo [3/7] Verifying that only request safety and version files changed...
powershell -NoProfile -Command "$n='value.equals(' + [char]34 + 'null' + [char]34 + ', true)'; if(-not (Select-String -LiteralPath '!WORK!\app\src\main\java\com\kristalstreams\player\XtreamClient.kt' -SimpleMatch $n -Quiet)){exit 1}"
if errorlevel 1 (
    echo ERROR: Provider null-value protection verification failed.
    pause
    exit /b 1
)
powershell -NoProfile -Command "$n='normalized.endsWith(' + [char]34 + '/null' + [char]34 + ', true)'; if(-not (Select-String -LiteralPath '!WORK!\app\src\main\java\com\kristalstreams\player\RemoteImageLoader.kt' -SimpleMatch $n -Quiet)){exit 1}"
if errorlevel 1 (
    echo ERROR: Final /null request blockade verification failed.
    pause
    exit /b 1
)
findstr /c:"versionCode = 1682044" "!WORK!\app\build.gradle.kts" >nul
if errorlevel 1 (
    echo ERROR: New 1682044 application version verification failed.
    pause
    exit /b 1
)

for %%F in (
    "app\src\main\java\com\kristalstreams\player\GuideActivity.kt"
    "app\src\main\java\com\kristalstreams\player\PlayerActivity.kt"
    "app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt"
    "app\src\main\java\com\kristalstreams\player\MovieDetailsActivity.kt"
    "app\src\main\res\layout\activity_series_details.xml"
    "app\src\main\res\layout-land\activity_series_details.xml"
) do (
    fc /b "!APPROVED!\%%~F" "!WORK!\%%~F" >nul
    if errorlevel 1 (
        echo ERROR: Protected approved file unexpectedly changed:
        echo   %%~F
        pause
        exit /b 1
    )
)

echo [4/7] Preparing the existing Windows Android build tools...
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

echo [5/7] Building incrementally without clean...
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

echo [6/7] Copying the protected APK to Downloads...
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
    set "USBCOPY=!USBDRIVE!\KS-NULL-REQUEST-GUARD-1682044.apk"
    copy /Y "!BUILT!" "!USBCOPY!" >nul
)

echo [7/7] Recording the isolated test candidate...
> "!WORK!\.kristalstreams-test-version.txt" echo 1682044
for /f "delims=" %%H in ('powershell -NoProfile -Command "(Get-FileHash -Algorithm SHA256 -LiteralPath '%FINAL%').Hash"') do set "APK_HASH=%%H"

color 2F
cls
echo.
echo ==========================================================
echo   NULL-REQUEST-GUARD BUILD SUCCESSFUL
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
echo   Do not reopen KS-PREUPDATE-RESTORE-1682043.apk.
echo   Install only KS-NULL-REQUEST-GUARD-1682044.apk.
echo.
echo TEST THESE THREE SCREENS:
echo   1. Open Live TV and scroll through channel logos.
echo   2. Open Movies and scroll through posters.
echo   3. Open Series and scroll through posters and episodes.
echo.
echo Missing artwork must show the normal placeholder without requesting /null.
echo.
explorer /select,"%FINAL%"
pause
exit /b 0

:::BEGIN NULLGUARDPATCH
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV0KICAgIFtzdHJpbmddJFBy
b2plY3RSb290CikKCiRFcnJvckFjdGlvblByZWZlcmVuY2UgPSAnU3RvcCcKCmZ1bmN0aW9uIFJl
YWQtTm9ybWFsaXplZChbc3RyaW5nXSRQYXRoKSB7CiAgICByZXR1cm4gW0lPLkZpbGVdOjpSZWFk
QWxsVGV4dCgkUGF0aCkuUmVwbGFjZSgiYHJgbiIsICJgbiIpCn0KCmZ1bmN0aW9uIFJlcGxhY2Ut
RXhhY3RseU9uY2UoCiAgICBbc3RyaW5nXSRQYXRoLAogICAgW3N0cmluZ10kT2xkLAogICAgW3N0
cmluZ10kTmV3LAogICAgW3N0cmluZ10kTGFiZWwKKSB7CiAgICAkY29udGVudCA9IFJlYWQtTm9y
bWFsaXplZCAkUGF0aAogICAgJG9sZE5vcm1hbGl6ZWQgPSAkT2xkLlJlcGxhY2UoImByYG4iLCAi
YG4iKQogICAgJG5ld05vcm1hbGl6ZWQgPSAkTmV3LlJlcGxhY2UoImByYG4iLCAiYG4iKQogICAg
JGNvdW50ID0gKFtyZWdleF06Ok1hdGNoZXMoJGNvbnRlbnQsIFtyZWdleF06OkVzY2FwZSgkb2xk
Tm9ybWFsaXplZCkpKS5Db3VudAogICAgaWYgKCRjb3VudCAtbmUgMSkgewogICAgICAgIHRocm93
ICJFeHBlY3RlZCBleGFjdGx5IG9uZSAkTGFiZWwgaW4gJFBhdGg7IGZvdW5kICRjb3VudCIKICAg
IH0KICAgICR1cGRhdGVkID0gJGNvbnRlbnQuUmVwbGFjZSgkb2xkTm9ybWFsaXplZCwgJG5ld05v
cm1hbGl6ZWQpCiAgICBbSU8uRmlsZV06OldyaXRlQWxsVGV4dCgkUGF0aCwgJHVwZGF0ZWQsIFtU
ZXh0LlVURjhFbmNvZGluZ106Om5ldygkZmFsc2UpKQp9CgokcGxheWVyUm9vdCA9IEpvaW4tUGF0
aCAkUHJvamVjdFJvb3QgJ2FwcFxzcmNcbWFpblxqYXZhXGNvbVxrcmlzdGFsc3RyZWFtc1xwbGF5
ZXInCiR4dHJlYW1QYXRoID0gSm9pbi1QYXRoICRwbGF5ZXJSb290ICdYdHJlYW1DbGllbnQua3Qn
CiRpbWFnZUxvYWRlclBhdGggPSBKb2luLVBhdGggJHBsYXllclJvb3QgJ1JlbW90ZUltYWdlTG9h
ZGVyLmt0JwokZ3JhZGxlUGF0aCA9IEpvaW4tUGF0aCAkUHJvamVjdFJvb3QgJ2FwcFxidWlsZC5n
cmFkbGUua3RzJwoKZm9yZWFjaCAoJHJlcXVpcmVkIGluIEAoJHh0cmVhbVBhdGgsICRpbWFnZUxv
YWRlclBhdGgsICRncmFkbGVQYXRoKSkgewogICAgaWYgKC1ub3QgKFRlc3QtUGF0aCAtTGl0ZXJh
bFBhdGggJHJlcXVpcmVkKSkgewogICAgICAgIHRocm93ICJSZXF1aXJlZCBhcHByb3ZlZC1zb3Vy
Y2UgZmlsZSB3YXMgbm90IGZvdW5kOiAkcmVxdWlyZWQiCiAgICB9Cn0KCiRvbGRNZWRpYUd1YXJk
ID0gQCcKICAgIHByaXZhdGUgZnVuIG1lZGlhVXJsKHNlcnZlcjogU3RyaW5nLCByYXc6IFN0cmlu
Zyk6IFN0cmluZyB7CiAgICAgICAgdmFsIHZhbHVlID0gcmF3LnRyaW0oKQogICAgICAgIGlmICh2
YWx1ZS5pc0JsYW5rKCkpIHJldHVybiAiIgonQAokbmV3TWVkaWFHdWFyZCA9IEAnCiAgICBwcml2
YXRlIGZ1biBtZWRpYVVybChzZXJ2ZXI6IFN0cmluZywgcmF3OiBTdHJpbmcpOiBTdHJpbmcgewog
ICAgICAgIHZhbCB2YWx1ZSA9IHJhdy50cmltKCkKICAgICAgICBpZiAoCiAgICAgICAgICAgIHZh
bHVlLmlzQmxhbmsoKSB8fAogICAgICAgICAgICB2YWx1ZS5lcXVhbHMoIm51bGwiLCB0cnVlKSB8
fAogICAgICAgICAgICB2YWx1ZS5lcXVhbHMoInVuZGVmaW5lZCIsIHRydWUpCiAgICAgICAgKSBy
ZXR1cm4gIiIKJ0AKUmVwbGFjZS1FeGFjdGx5T25jZSAkeHRyZWFtUGF0aCAkb2xkTWVkaWFHdWFy
ZCAkbmV3TWVkaWFHdWFyZCAncHJvdmlkZXItbWVkaWEgbnVsbCBndWFyZCcKCiRvbGRMb2FkZXJH
dWFyZCA9IEAnCiAgICAgICAgdmFsIG5vcm1hbGl6ZWQgPSB1cmw/LnRyaW0oKS5vckVtcHR5KCkK
ICAgICAgICB2aWV3LnRhZyA9IG5vcm1hbGl6ZWQKICAgICAgICB2aWV3LnNldEltYWdlUmVzb3Vy
Y2UocGxhY2Vob2xkZXIpCiAgICAgICAgdmlldy5zY2FsZVR5cGUgPSBpZiAoY3JvcCkgSW1hZ2VW
aWV3LlNjYWxlVHlwZS5DRU5URVJfQ1JPUCBlbHNlIEltYWdlVmlldy5TY2FsZVR5cGUuQ0VOVEVS
X0lOU0lERQogICAgICAgIGlmIChub3JtYWxpemVkLmlzQmxhbmsoKSkgcmV0dXJuCidACiRuZXdM
b2FkZXJHdWFyZCA9IEAnCiAgICAgICAgdmFsIG5vcm1hbGl6ZWQgPSB1cmw/LnRyaW0oKS5vckVt
cHR5KCkKICAgICAgICB2aWV3LnRhZyA9IG5vcm1hbGl6ZWQKICAgICAgICB2aWV3LnNldEltYWdl
UmVzb3VyY2UocGxhY2Vob2xkZXIpCiAgICAgICAgdmlldy5zY2FsZVR5cGUgPSBpZiAoY3JvcCkg
SW1hZ2VWaWV3LlNjYWxlVHlwZS5DRU5URVJfQ1JPUCBlbHNlIEltYWdlVmlldy5TY2FsZVR5cGUu
Q0VOVEVSX0lOU0lERQogICAgICAgIGlmICgKICAgICAgICAgICAgbm9ybWFsaXplZC5pc0JsYW5r
KCkgfHwKICAgICAgICAgICAgbm9ybWFsaXplZC5lcXVhbHMoIm51bGwiLCB0cnVlKSB8fAogICAg
ICAgICAgICBub3JtYWxpemVkLmVxdWFscygidW5kZWZpbmVkIiwgdHJ1ZSkgfHwKICAgICAgICAg
ICAgbm9ybWFsaXplZC5lbmRzV2l0aCgiL251bGwiLCB0cnVlKSB8fAogICAgICAgICAgICBub3Jt
YWxpemVkLmVuZHNXaXRoKCIvdW5kZWZpbmVkIiwgdHJ1ZSkKICAgICAgICApIHJldHVybgonQApS
ZXBsYWNlLUV4YWN0bHlPbmNlICRpbWFnZUxvYWRlclBhdGggJG9sZExvYWRlckd1YXJkICRuZXdM
b2FkZXJHdWFyZCAnaW1hZ2UtbG9hZGVyIGZpbmFsIG51bGwgZ3VhcmQnCgpSZXBsYWNlLUV4YWN0
bHlPbmNlICRncmFkbGVQYXRoICd2ZXJzaW9uQ29kZSA9IDE2ODIwNDInICd2ZXJzaW9uQ29kZSA9
IDE2ODIwNDQnICcxNjgyMDQyIHZlcnNpb24gY29kZScKUmVwbGFjZS1FeGFjdGx5T25jZSAkZ3Jh
ZGxlUGF0aCAnMS42Ljgtc2VyaWVzLWxhbmRzY2FwZS1idXR0b24tdmVyaWZ5JyAnMS42LjgtbnVs
bC1yZXF1ZXN0LWd1YXJkJyAnYXBwcm92ZWQgdmVyc2lvbiBuYW1lJwoKJHh0cmVhbSA9IFJlYWQt
Tm9ybWFsaXplZCAkeHRyZWFtUGF0aAokbG9hZGVyID0gUmVhZC1Ob3JtYWxpemVkICRpbWFnZUxv
YWRlclBhdGgKJGdyYWRsZSA9IFJlYWQtTm9ybWFsaXplZCAkZ3JhZGxlUGF0aAoKaWYgKC1ub3Qg
JHh0cmVhbS5Db250YWlucygndmFsdWUuZXF1YWxzKCJudWxsIiwgdHJ1ZSknKSkgewogICAgdGhy
b3cgJ1h0cmVhbSBwcm92aWRlci1tZWRpYSBudWxsIGd1YXJkIHZlcmlmaWNhdGlvbiBmYWlsZWQu
Jwp9CmlmICgtbm90ICR4dHJlYW0uQ29udGFpbnMoJ3ZhbHVlLmVxdWFscygidW5kZWZpbmVkIiwg
dHJ1ZSknKSkgewogICAgdGhyb3cgJ1h0cmVhbSBwcm92aWRlci1tZWRpYSB1bmRlZmluZWQgZ3Vh
cmQgdmVyaWZpY2F0aW9uIGZhaWxlZC4nCn0KaWYgKC1ub3QgJGxvYWRlci5Db250YWlucygnbm9y
bWFsaXplZC5lbmRzV2l0aCgiL251bGwiLCB0cnVlKScpKSB7CiAgICB0aHJvdyAnSW1hZ2UtbG9h
ZGVyIC9udWxsIGRlZmVuc2UgdmVyaWZpY2F0aW9uIGZhaWxlZC4nCn0KaWYgKC1ub3QgJGxvYWRl
ci5Db250YWlucygnbm9ybWFsaXplZC5lbmRzV2l0aCgiL3VuZGVmaW5lZCIsIHRydWUpJykpIHsK
ICAgIHRocm93ICdJbWFnZS1sb2FkZXIgL3VuZGVmaW5lZCBkZWZlbnNlIHZlcmlmaWNhdGlvbiBm
YWlsZWQuJwp9CmlmICgtbm90ICRncmFkbGUuQ29udGFpbnMoJ3ZlcnNpb25Db2RlID0gMTY4MjA0
NCcpKSB7CiAgICB0aHJvdyAnQXBwbGljYXRpb24gdmVyc2lvbiB2ZXJpZmljYXRpb24gZmFpbGVk
LicKfQoKJGF1ZGl0UGF0aCA9IEpvaW4tUGF0aCAkUHJvamVjdFJvb3QgJ05VTEwtUkVRVUVTVC1H
VUFSRC0xNjgyMDQ0LnR4dCcKJGF1ZGl0ID0gQCcKS1JJU1RBTCBTVFJFQU1TIE5VTEwtUkVRVUVT
VCBHVUFSRCAxNjgyMDQ0CgpBcHByb3ZlZCBzb3VyY2U6IDE2ODIwNDIKRnVuY3Rpb25hbCBjaGFu
Z2VzOgotIFRyZWF0cyBibGFuaywgbnVsbCwgYW5kIHVuZGVmaW5lZCBwcm92aWRlciBhcnR3b3Jr
IHZhbHVlcyBhcyBtaXNzaW5nLgotIFByZXZlbnRzIHRoZSBpbWFnZSBsb2FkZXIgZnJvbSByZXF1
ZXN0aW5nIC9udWxsIG9yIC91bmRlZmluZWQuCi0gTGVhdmVzIGxvZ2luLCBwbGF5YmFjaywgRVBH
LCBNb3ZpZXMsIFNlcmllcywgYW5kIGFsbCBsYXlvdXRzIHVuY2hhbmdlZC4KJ0AKW0lPLkZpbGVd
OjpXcml0ZUFsbFRleHQoJGF1ZGl0UGF0aCwgJGF1ZGl0LCBbVGV4dC5VVEY4RW5jb2RpbmddOjpu
ZXcoJGZhbHNlKSkKCldyaXRlLUhvc3QgJ051bGwtcmVxdWVzdCBwcm90ZWN0aW9uIGFwcGxpZWQg
c3VjY2Vzc2Z1bGx5LicK
:::END NULLGUARDPATCH
