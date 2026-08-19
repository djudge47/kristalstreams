@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Kristal Streams Transparent Dashboard Brand Banner

set "SOURCE=C:\KristalStreams168RC1R2\KristalStreams-1.6.8-RC1-R2-LEGACY-DEMO-FIX"
for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%T"
set "WORK=C:\kstransparentheader-!STAMP!"
set "FINAL=%USERPROFILE%\Downloads\KS-TRANSPARENT-HEADER-1682010.apk"
set "LOG=%TEMP%\kristalstreams-transparent-header-build.txt"
set "JAVASAVE=%USERPROFILE%\.kristalstreams-java-home.txt"

echo.
echo ==========================================================
echo   KRISTAL STREAMS 1.6.8 RC1 R2 - TRANSPARENT HEADER BANNER
echo   FRESH APK: KS-TRANSPARENT-HEADER-1682010.apk
echo ==========================================================
echo.
echo Baseline: known-good R2
echo Lightens every regular Live TV channel-logo panel.
echo Makes the wide dashboard KS navigation banner transparent.
echo The working TV Guide and details panel are unchanged.
echo Original R2 remains untouched.
echo.

if not exist "%SOURCE%\gradlew.bat" (
    echo ERROR: Known-good R2 source was not found:
    echo   %SOURCE%
    echo.
    pause
    exit /b 1
)

echo [1/6] Creating a brand-new working copy...
mkdir "%WORK%" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Could not create:
    echo   %WORK%
    pause
    exit /b 1
)

robocopy "%SOURCE%" "%WORK%" /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /NFL /NDL /NP >nul
set "RC=%ERRORLEVEL%"
if %RC% GEQ 8 (
    echo ERROR: Could not copy the known-good R2 source.
    pause
    exit /b %RC%
)

echo [2/6] Installing transparent dashboard header...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; function B([string]$n){$a=':::BEGIN '+$n;$b=':::END '+$n;$s=$raw.IndexOf($a);if($s -lt 0){throw 'Missing '+$a};$s+=$a.Length;$e=$raw.IndexOf($b,$s);if($e -lt 0){throw 'Missing '+$b};$x=$raw.Substring($s,$e-$s)-replace '\s','';[Convert]::FromBase64String($x)}; [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\Models.kt',(B 'MODELS')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\XtreamClient.kt',(B 'XTREAM')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt',(B 'GUIDE')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt',(B 'ADAPTER')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt',(B 'UICONTEXT')); [IO.File]::WriteAllBytes('%WORK%\app\build.gradle.kts',(B 'GRADLE')); [IO.File]::WriteAllBytes('%WORK%\REFERENCE-EPG-AUDIT.txt',(B 'AUDIT')); [IO.File]::WriteAllBytes('%WORK%\apply-ui-contrast.ps1',(B 'UIPATCH'))"
if errorlevel 1 (
    echo ERROR: Could not install transparent header files.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%WORK%\apply-ui-contrast.ps1" -ProjectRoot "%WORK%"
if errorlevel 1 (
    echo ERROR: Could not register the Live TV logo controller.
    pause
    exit /b 1
)
del /q "%WORK%\apply-ui-contrast.ps1" >nul 2>&1

echo [3/6] Verifying transparent dashboard header...
findstr /c:"epgChannelId" "%WORK%\app\src\main\java\com\kristalstreams\player\Models.kt" >nul
if errorlevel 1 (
    echo ERROR: Channel EPG ID verification failed.
    pause
    exit /b 1
)
findstr /c:"fun xmlTvGuide(" "%WORK%\app\src\main\java\com\kristalstreams\player\XtreamClient.kt" >nul
if errorlevel 1 (
    echo ERROR: XMLTV parser verification failed.
    pause
    exit /b 1
)
findstr /c:"TimeZone.getDefault()" "%WORK%\app\src\main\java\com\kristalstreams\player\XtreamClient.kt" >nul
if errorlevel 1 (
    echo ERROR: Device time-zone verification failed.
    pause
    exit /b 1
)
findstr /c:"XtreamClient.xmlTvGuide(" "%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Guide XMLTV wiring verification failed.
    pause
    exit /b 1
)
findstr /c:"XtreamClient.guideEpg(" "%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Stable per-channel fallback verification failed.
    pause
    exit /b 1
)
findstr /c:"NO GUIDE DATA" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Visible program-label verification failed.
    pause
    exit /b 1
)
findstr /c:"textAlignment = View.TEXT_ALIGNMENT_CENTER" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Centered half-hour label verification failed.
    pause
    exit /b 1
)
findstr /c:"textAlignment = View.TEXT_ALIGNMENT_VIEW_START" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Left-aligned long-card verification failed.
    pause
    exit /b 1
)
findstr /c:"Complete fixed-grid EPG renderer" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Fixed-grid renderer verification failed.
    pause
    exit /b 1
)
findstr /c:"fun programForSlot" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: One-program-per-cell verification failed.
    pause
    exit /b 1
)
findstr /c:"fun sameProgramme" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Duration-card merging verification failed.
    pause
    exit /b 1
)
findstr /c:"val compactCard = span <= 6" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Compact half-hour card verification failed.
    pause
    exit /b 1
)
findstr /c:"TextViewCompat.setAutoSizeTextTypeUniformWithConfiguration" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Automatic title sizing verification failed.
    pause
    exit /b 1
)
findstr /c:"maxLines = 6" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Six-line compact title verification failed.
    pause
    exit /b 1
)
findstr /c:"setPadding(2.dp, 1.dp, 2.dp, 1.dp)" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Compact title padding verification failed.
    pause
    exit /b 1
)
findstr /c:"fun selectFirstCurrentProgram()" "%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Automatic current-program selection verification failed.
    pause
    exit /b 1
)
findstr /c:"fun refreshSelectedProgram()" "%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Live detail refresh verification failed.
    pause
    exit /b 1
)
findstr /c:"WATCH LIVE" "%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Program action verification failed.
    pause
    exit /b 1
)
findstr /c:"class UiContrastProvider" "%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Live TV logo controller verification failed.
    pause
    exit /b 1
)
findstr /c:"styleChannelLogo" "%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Light channel-logo background verification failed.
    pause
    exit /b 1
)
findstr /c:"makeHeaderArtworkTransparent" "%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Transparent navigation artwork verification failed.
    pause
    exit /b 1
)
findstr /c:"fun isDashboardScreen(" "%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Dashboard banner targeting verification failed.
    pause
    exit /b 1
)
findstr /c:"clearTopLeftContainers" "%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Header container transparency verification failed.
    pause
    exit /b 1
)
findstr /c:"UiContrastProvider" "%WORK%\app\src\main\AndroidManifest.xml" >nul
if errorlevel 1 (
    echo ERROR: Live TV logo manifest registration failed.
    pause
    exit /b 1
)
findstr /c:"1.6.8-live-header-transparent" "%WORK%\app\build.gradle.kts" >nul
if errorlevel 1 (
    echo ERROR: Transparent header version verification failed.
    pause
    exit /b 1
)

echo [4/6] Preparing Windows Android build tools...
set "ANDROID_SDK=%LOCALAPPDATA%\Android\Sdk"
if not exist "%ANDROID_SDK%\platforms" (
    echo ERROR: Android SDK not found:
    echo   %ANDROID_SDK%
    pause
    exit /b 1
)
set "SDK_FORWARD=%ANDROID_SDK:\=/%"
> "%WORK%\local.properties" echo sdk.dir=%SDK_FORWARD%

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
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" goto JAVA_READY

echo ERROR: Java could not be found automatically.
pause
exit /b 1

:JAVA_READY
> "%JAVASAVE%" echo %JAVA_HOME%
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo.
echo [5/6] Building transparent dashboard header...
echo Gradle progress will appear below.
echo.

cd /d "%WORK%"
set "BUILDPS=%TEMP%\ks_transparent_header_gradle_build.ps1"
> "%BUILDPS%" echo $ErrorActionPreference = 'Continue'
>>"%BUILDPS%" echo ^& '.\gradlew.bat' clean assembleDebug --rerun-tasks --console=plain --stacktrace 2^>^&1 ^| Tee-Object -FilePath '%LOG%'
>>"%BUILDPS%" echo $rc = $LASTEXITCODE
>>"%BUILDPS%" echo if ($null -eq $rc) { $rc = 1 }
>>"%BUILDPS%" echo exit $rc

powershell -NoProfile -ExecutionPolicy Bypass -File "%BUILDPS%"
set "RC=%ERRORLEVEL%"
del /q "%BUILDPS%" >nul 2>&1

if not "%RC%"=="0" (
    color 4F
    echo.
    echo ==========================================================
    echo   BUILD FAILED
    echo ==========================================================
    echo.
    echo Original R2 is untouched.
    echo Build log:
    echo   %LOG%
    echo.
    start "" notepad "%LOG%"
    pause
    exit /b %RC%
)

set "BUILT=%WORK%\app\build\outputs\apk\debug\app-debug.apk"
if not exist "%BUILT%" (
    echo ERROR: Gradle finished but APK was not found.
    start "" notepad "%LOG%"
    pause
    exit /b 1
)

echo.
echo [6/6] Copying finished APK...
copy /Y "%BUILT%" "%FINAL%" >nul
if errorlevel 1 (
    echo ERROR: Could not copy APK to Downloads.
    pause
    exit /b 1
)

set "USBCOPY="
set "USBDRIVE="
for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "$d=Get-CimInstance Win32_LogicalDisk ^| Where-Object {$_.DriveType -eq 2 } ^| Select-Object -First 1 -ExpandProperty DeviceID; if($d){$d}"`) do set "USBDRIVE=%%D"

if defined USBDRIVE (
    set "USBCOPY=!USBDRIVE!\KS-TRANSPARENT-HEADER-1682010.apk"
    copy /Y "%BUILT%" "!USBCOPY!" >nul
)

color 2F
cls
echo.
echo ==========================================================
echo.
echo       KRISTAL STREAMS TRANSPARENT HEADER BUILD SUCCESSFUL
echo.
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
echo Original known-good R2: UNTOUCHED
echo.
echo Install only KS-TRANSPARENT-HEADER-1682010.apk shown above.
echo All regular Live TV channel logos now use a light background.
echo The wide dashboard KS navigation banner now has a transparent background.
echo The approved TV Guide grid, timing, and details remain unchanged.
echo.
explorer /select,"%FINAL%"
pause
exit /b 0

:::BEGIN MODELS
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgpkYXRhIGNsYXNzIFh0cmVhbUNyZWRl
bnRpYWxzKHZhbCBzZXJ2ZXI6IFN0cmluZywgdmFsIHVzZXJuYW1lOiBTdHJpbmcsIHZhbCBwYXNz
d29yZDogU3RyaW5nKQpkYXRhIGNsYXNzIExpdmVDYXRlZ29yeSh2YWwgaWQ6IFN0cmluZywgdmFs
IG5hbWU6IFN0cmluZykKZGF0YSBjbGFzcyBNZWRpYUNhdGVnb3J5KHZhbCBpZDogU3RyaW5nLCB2
YWwgbmFtZTogU3RyaW5nKQpkYXRhIGNsYXNzIExpdmVTdHJlYW0odmFsIGlkOiBJbnQsIHZhbCBu
YW1lOiBTdHJpbmcsIHZhbCBjYXRlZ29yeUlkOiBTdHJpbmcsIHZhbCBpY29uOiBTdHJpbmcsIHZh
bCBleHRlbnNpb246IFN0cmluZywgdmFsIGVwZ0NoYW5uZWxJZDogU3RyaW5nID0gIiIpCmRhdGEg
Y2xhc3MgTGlicmFyeUl0ZW0oCiAgICB2YWwgaWQ6IEludCwKICAgIHZhbCBuYW1lOiBTdHJpbmcs
CiAgICB2YWwga2luZDogU3RyaW5nLAogICAgdmFsIHBsYXlVcmw6IFN0cmluZz8gPSBudWxsLAog
ICAgdmFsIGltYWdlVXJsOiBTdHJpbmcgPSAiIiwKICAgIHZhbCBjYXRlZ29yeUlkOiBTdHJpbmcg
PSAiIiwKICAgIHZhbCB5ZWFyOiBTdHJpbmcgPSAiIiwKICAgIHZhbCByYXRpbmc6IFN0cmluZyA9
ICIiCikKZGF0YSBjbGFzcyBFcGlzb2RlSXRlbSh2YWwgaWQ6IEludCwgdmFsIHRpdGxlOiBTdHJp
bmcsIHZhbCBzZWFzb246IEludCwgdmFsIGVwaXNvZGU6IEludCwgdmFsIGV4dGVuc2lvbjogU3Ry
aW5nLCB2YWwgcGxheVVybDogU3RyaW5nKQpkYXRhIGNsYXNzIEVwZ0l0ZW0oCiAgICB2YWwgdGl0
bGU6IFN0cmluZywKICAgIHZhbCBkZXNjcmlwdGlvbjogU3RyaW5nLAogICAgdmFsIHN0YXJ0OiBT
dHJpbmcsCiAgICB2YWwgZW5kOiBTdHJpbmcsCiAgICB2YWwgc3RhcnRUaW1lc3RhbXA6IExvbmc/
ID0gbnVsbCwKICAgIHZhbCBlbmRUaW1lc3RhbXA6IExvbmc/ID0gbnVsbAopCmRhdGEgY2xhc3Mg
Q29udGludWVJdGVtKHZhbCBuYW1lOiBTdHJpbmcsIHZhbCB1cmw6IFN0cmluZywgdmFsIHBvc2l0
aW9uTXM6IExvbmcsIHZhbCBkdXJhdGlvbk1zOiBMb25nLCB2YWwga2luZDogU3RyaW5nLCB2YWwg
dXBkYXRlZEF0OiBMb25nKQo=
:::END MODELS
:::BEGIN XTREAM
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC51dGlsLkJh
c2U2NAppbXBvcnQgYW5kcm9pZC51dGlsLlhtbAoKaW1wb3J0IG9yZy5qc29uLkpTT05BcnJheQpp
bXBvcnQgb3JnLmpzb24uSlNPTk9iamVjdAppbXBvcnQgb3JnLnhtbHB1bGwudjEuWG1sUHVsbFBh
cnNlcgppbXBvcnQgamF2YS5pby5CdWZmZXJlZFJlYWRlcgppbXBvcnQgamF2YS5pby5JbnB1dFN0
cmVhbQppbXBvcnQgamF2YS5pby5JbnB1dFN0cmVhbVJlYWRlcgppbXBvcnQgamF2YS5uZXQuSHR0
cFVSTENvbm5lY3Rpb24KaW1wb3J0IGphdmEubmV0LlVSTAppbXBvcnQgamF2YS5uZXQuVVJMRW5j
b2RlcgppbXBvcnQgamF2YS50ZXh0LlNpbXBsZURhdGVGb3JtYXQKaW1wb3J0IGphdmEudXRpbC5M
b2NhbGUKaW1wb3J0IGphdmEudXRpbC5UaW1lWm9uZQoKb2JqZWN0IFh0cmVhbUNsaWVudCB7CiAg
ICBwcml2YXRlIGZ1biBiYXNlKHNlcnZlcjogU3RyaW5nKSA9IHNlcnZlci50cmltKCkudHJpbUVu
ZCgnLycpCiAgICBwcml2YXRlIGZ1biBlbmModjogU3RyaW5nKSA9IFVSTEVuY29kZXIuZW5jb2Rl
KHYsICJVVEYtOCIpCgogICAgcHJpdmF0ZSBmdW4gbWVkaWFVcmwoc2VydmVyOiBTdHJpbmcsIHJh
dzogU3RyaW5nKTogU3RyaW5nIHsKICAgICAgICB2YWwgdmFsdWUgPSByYXcudHJpbSgpCiAgICAg
ICAgaWYgKHZhbHVlLmlzQmxhbmsoKSkgcmV0dXJuICIiCiAgICAgICAgaWYgKHZhbHVlLnN0YXJ0
c1dpdGgoImh0dHA6Ly8iLCB0cnVlKSB8fCB2YWx1ZS5zdGFydHNXaXRoKCJodHRwczovLyIsIHRy
dWUpKSByZXR1cm4gdmFsdWUKICAgICAgICB2YWwgc2NoZW1lID0gaWYgKGJhc2Uoc2VydmVyKS5z
dGFydHNXaXRoKCJodHRwczovLyIsIHRydWUpKSAiaHR0cHM6IiBlbHNlICJodHRwOiIKICAgICAg
ICBpZiAodmFsdWUuc3RhcnRzV2l0aCgiLy8iKSkgcmV0dXJuICIkc2NoZW1lJHZhbHVlIgogICAg
ICAgIHJldHVybiBpZiAodmFsdWUuc3RhcnRzV2l0aCgiLyIpKSAiJHtiYXNlKHNlcnZlcil9JHZh
bHVlIiBlbHNlICIke2Jhc2Uoc2VydmVyKX0vJHZhbHVlIgogICAgfQoKICAgIHByaXZhdGUgZnVu
IGdldCh1cmw6IFN0cmluZyk6IFN0cmluZyB7CiAgICAgICAgdmFsIGNvbm5lY3Rpb24gPSBVUkwo
dXJsKS5vcGVuQ29ubmVjdGlvbigpIGFzIEh0dHBVUkxDb25uZWN0aW9uCiAgICAgICAgY29ubmVj
dGlvbi5jb25uZWN0VGltZW91dCA9IDEyXzAwMAogICAgICAgIGNvbm5lY3Rpb24ucmVhZFRpbWVv
dXQgPSAyMF8wMDAKICAgICAgICBjb25uZWN0aW9uLnJlcXVlc3RNZXRob2QgPSAiR0VUIgogICAg
ICAgIGNvbm5lY3Rpb24uc2V0UmVxdWVzdFByb3BlcnR5KCJVc2VyLUFnZW50IiwgIktyaXN0YWxT
dHJlYW1zLzEuNi44IEFuZHJvaWQiKQogICAgICAgIHJldHVybiB0cnkgewogICAgICAgICAgICB2
YWwgY29kZSA9IGNvbm5lY3Rpb24ucmVzcG9uc2VDb2RlCiAgICAgICAgICAgIHZhbCBzdHJlYW0g
PSBpZiAoY29kZSBpbiAyMDAuLjI5OSkgY29ubmVjdGlvbi5pbnB1dFN0cmVhbSBlbHNlIGNvbm5l
Y3Rpb24uZXJyb3JTdHJlYW0KICAgICAgICAgICAgdmFsIGJvZHkgPSBzdHJlYW0/LmxldCB7IEJ1
ZmZlcmVkUmVhZGVyKElucHV0U3RyZWFtUmVhZGVyKGl0KSkudXNlIHsgcmVhZGVyIC0+IHJlYWRl
ci5yZWFkVGV4dCgpIH0gfS5vckVtcHR5KCkKICAgICAgICAgICAgaWYgKGNvZGUgIWluIDIwMC4u
Mjk5KSB7CiAgICAgICAgICAgICAgICB0aHJvdyBJbGxlZ2FsU3RhdGVFeGNlcHRpb24oIlNlcnZl
ciByZXR1cm5lZCBIVFRQICRjb2RlIikKICAgICAgICAgICAgfQogICAgICAgICAgICBib2R5CiAg
ICAgICAgfSBmaW5hbGx5IHsKICAgICAgICAgICAgY29ubmVjdGlvbi5kaXNjb25uZWN0KCkKICAg
ICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gPFQ+IHdpdGhJbnB1dFN0cmVhbSh1cmw6IFN0
cmluZywgYmxvY2s6IChJbnB1dFN0cmVhbSkgLT4gVCk6IFQgewogICAgICAgIHZhbCBjb25uZWN0
aW9uID0gVVJMKHVybCkub3BlbkNvbm5lY3Rpb24oKSBhcyBIdHRwVVJMQ29ubmVjdGlvbgogICAg
ICAgIGNvbm5lY3Rpb24uY29ubmVjdFRpbWVvdXQgPSAxMl8wMDAKICAgICAgICBjb25uZWN0aW9u
LnJlYWRUaW1lb3V0ID0gMjVfMDAwCiAgICAgICAgY29ubmVjdGlvbi5yZXF1ZXN0TWV0aG9kID0g
IkdFVCIKICAgICAgICBjb25uZWN0aW9uLnNldFJlcXVlc3RQcm9wZXJ0eSgiVXNlci1BZ2VudCIs
ICJLcmlzdGFsU3RyZWFtcy8xLjYuOCBBbmRyb2lkIikKICAgICAgICByZXR1cm4gdHJ5IHsKICAg
ICAgICAgICAgdmFsIGNvZGUgPSBjb25uZWN0aW9uLnJlc3BvbnNlQ29kZQogICAgICAgICAgICBp
ZiAoY29kZSAhaW4gMjAwLi4yOTkpIHRocm93IElsbGVnYWxTdGF0ZUV4Y2VwdGlvbigiU2VydmVy
IHJldHVybmVkIEhUVFAgJGNvZGUiKQogICAgICAgICAgICBjb25uZWN0aW9uLmlucHV0U3RyZWFt
LnVzZShibG9jaykKICAgICAgICB9IGZpbmFsbHkgewogICAgICAgICAgICBjb25uZWN0aW9uLmRp
c2Nvbm5lY3QoKQogICAgICAgIH0KICAgIH0KCiAgICBmdW4gYXV0aGVudGljYXRlKGM6IFh0cmVh
bUNyZWRlbnRpYWxzKTogU3RyaW5nIHsKICAgICAgICBpZiAoRGVtb0NhdGFsb2cuaXNEZW1vKGMp
KSByZXR1cm4gIkRFTU8iCiAgICAgICAgdmFsIGpzb24gPSBKU09OT2JqZWN0KGdldCgiJHtiYXNl
KGMuc2VydmVyKX0vcGxheWVyX2FwaS5waHA/dXNlcm5hbWU9JHtlbmMoYy51c2VybmFtZSl9JnBh
c3N3b3JkPSR7ZW5jKGMucGFzc3dvcmQpfSIpKQogICAgICAgIHZhbCB1c2VyID0ganNvbi5vcHRK
U09OT2JqZWN0KCJ1c2VyX2luZm8iKSA/OiB0aHJvdyBJbGxlZ2FsU3RhdGVFeGNlcHRpb24oIk5v
IHVzZXJfaW5mbyByZXR1cm5lZCBieSBzZXJ2ZXIiKQogICAgICAgIHZhbCBhdXRoID0gdXNlci5v
cHRJbnQoImF1dGgiLCAwKQogICAgICAgIGlmIChhdXRoICE9IDEpIHRocm93IElsbGVnYWxTdGF0
ZUV4Y2VwdGlvbih1c2VyLm9wdFN0cmluZygibWVzc2FnZSIsICJMb2dpbiB3YXMgbm90IGF1dGhv
cml6ZWQiKSkKICAgICAgICB2YWwgc3RhdHVzID0gdXNlci5vcHRTdHJpbmcoInN0YXR1cyIsICJB
Y3RpdmUiKQogICAgICAgIGlmICghc3RhdHVzLmVxdWFscygiQWN0aXZlIiwgdHJ1ZSkpIHRocm93
IElsbGVnYWxTdGF0ZUV4Y2VwdGlvbigiQWNjb3VudCBzdGF0dXM6ICRzdGF0dXMiKQogICAgICAg
IHJldHVybiB1c2VyLm9wdFN0cmluZygiZXhwX2RhdGUiLCAiIikKICAgIH0KCiAgICBmdW4gbGl2
ZUNhdGVnb3JpZXMoYzogWHRyZWFtQ3JlZGVudGlhbHMpOiBMaXN0PExpdmVDYXRlZ29yeT4gewog
ICAgICAgIGlmIChEZW1vQ2F0YWxvZy5pc0RlbW8oYykpIHJldHVybiBEZW1vQ2F0YWxvZy5jYXRl
Z29yaWVzCiAgICAgICAgdmFsIGFyciA9IEpTT05BcnJheShnZXQoIiR7YmFzZShjLnNlcnZlcil9
L3BsYXllcl9hcGkucGhwP3VzZXJuYW1lPSR7ZW5jKGMudXNlcm5hbWUpfSZwYXNzd29yZD0ke2Vu
YyhjLnBhc3N3b3JkKX0mYWN0aW9uPWdldF9saXZlX2NhdGVnb3JpZXMiKSkKICAgICAgICByZXR1
cm4gYnVpbGRMaXN0IHsKICAgICAgICAgICAgYWRkKExpdmVDYXRlZ29yeSgiIiwgIkFsbCBDaGFu
bmVscyIpKQogICAgICAgICAgICBmb3IgKGkgaW4gMCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsKICAg
ICAgICAgICAgICAgIHZhbCBvID0gYXJyLmdldEpTT05PYmplY3QoaSkKICAgICAgICAgICAgICAg
IGFkZChMaXZlQ2F0ZWdvcnkoby5vcHRTdHJpbmcoImNhdGVnb3J5X2lkIiksIG8ub3B0U3RyaW5n
KCJjYXRlZ29yeV9uYW1lIiwgIkNhdGVnb3J5IikpKQogICAgICAgICAgICB9CiAgICAgICAgfQog
ICAgfQoKICAgIGZ1biBsaXZlU3RyZWFtcyhjOiBYdHJlYW1DcmVkZW50aWFscywgY2F0ZWdvcnlJ
ZDogU3RyaW5nPyA9IG51bGwpOiBMaXN0PExpdmVTdHJlYW0+IHsKICAgICAgICBpZiAoRGVtb0Nh
dGFsb2cuaXNEZW1vKGMpKSByZXR1cm4gRGVtb0NhdGFsb2cubGl2ZVN0cmVhbXMoY2F0ZWdvcnlJ
ZCkKICAgICAgICB2YWwgc3VmZml4ID0gaWYgKGNhdGVnb3J5SWQuaXNOdWxsT3JCbGFuaygpKSAi
IiBlbHNlICImY2F0ZWdvcnlfaWQ9JHtlbmMoY2F0ZWdvcnlJZCl9IgogICAgICAgIHZhbCBhcnIg
PSBKU09OQXJyYXkoZ2V0KCIke2Jhc2UoYy5zZXJ2ZXIpfS9wbGF5ZXJfYXBpLnBocD91c2VybmFt
ZT0ke2VuYyhjLnVzZXJuYW1lKX0mcGFzc3dvcmQ9JHtlbmMoYy5wYXNzd29yZCl9JmFjdGlvbj1n
ZXRfbGl2ZV9zdHJlYW1zJHN1ZmZpeCIpKQogICAgICAgIHJldHVybiBidWlsZExpc3QgewogICAg
ICAgICAgICBmb3IgKGkgaW4gMCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsKICAgICAgICAgICAgICAg
IHZhbCBvID0gYXJyLmdldEpTT05PYmplY3QoaSkKICAgICAgICAgICAgICAgIGFkZChMaXZlU3Ry
ZWFtKAogICAgICAgICAgICAgICAgICAgIG8ub3B0SW50KCJzdHJlYW1faWQiKSwKICAgICAgICAg
ICAgICAgICAgICBvLm9wdFN0cmluZygibmFtZSIsICJDaGFubmVsIiksCiAgICAgICAgICAgICAg
ICAgICAgby5vcHRTdHJpbmcoImNhdGVnb3J5X2lkIiksCiAgICAgICAgICAgICAgICAgICAgbWVk
aWFVcmwoYy5zZXJ2ZXIsIG8ub3B0U3RyaW5nKCJzdHJlYW1faWNvbiIpKSwKICAgICAgICAgICAg
ICAgICAgICBvLm9wdFN0cmluZygiY29udGFpbmVyX2V4dGVuc2lvbiIsICJ0cyIpLmlmQmxhbmsg
eyAidHMiIH0sCiAgICAgICAgICAgICAgICAgICAgby5vcHRTdHJpbmcoImVwZ19jaGFubmVsX2lk
IiwgIiIpLnRyaW0oKQogICAgICAgICAgICAgICAgKSkKICAgICAgICAgICAgfQogICAgICAgIH0K
ICAgIH0KCiAgICBmdW4gbW92aWVDYXRlZ29yaWVzKGM6IFh0cmVhbUNyZWRlbnRpYWxzKTogTGlz
dDxNZWRpYUNhdGVnb3J5PiB7CiAgICAgICAgaWYgKERlbW9DYXRhbG9nLmlzRGVtbyhjKSkgcmV0
dXJuIERlbW9DYXRhbG9nLm1vdmllQ2F0ZWdvcmllcwogICAgICAgIHZhbCBhcnIgPSBKU09OQXJy
YXkoZ2V0KCIke2Jhc2UoYy5zZXJ2ZXIpfS9wbGF5ZXJfYXBpLnBocD91c2VybmFtZT0ke2VuYyhj
LnVzZXJuYW1lKX0mcGFzc3dvcmQ9JHtlbmMoYy5wYXNzd29yZCl9JmFjdGlvbj1nZXRfdm9kX2Nh
dGVnb3JpZXMiKSkKICAgICAgICByZXR1cm4gYnVpbGRMaXN0IHsKICAgICAgICAgICAgYWRkKE1l
ZGlhQ2F0ZWdvcnkoIiIsICJBbGwgTW92aWVzIikpCiAgICAgICAgICAgIGZvciAoaSBpbiAwIHVu
dGlsIGFyci5sZW5ndGgoKSkgewogICAgICAgICAgICAgICAgdmFsIG8gPSBhcnIuZ2V0SlNPTk9i
amVjdChpKQogICAgICAgICAgICAgICAgYWRkKE1lZGlhQ2F0ZWdvcnkoby5vcHRTdHJpbmcoImNh
dGVnb3J5X2lkIiksIG8ub3B0U3RyaW5nKCJjYXRlZ29yeV9uYW1lIiwgIkNhdGVnb3J5IikpKQog
ICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQoKICAgIGZ1biBzZXJpZXNDYXRlZ29yaWVzKGM6
IFh0cmVhbUNyZWRlbnRpYWxzKTogTGlzdDxNZWRpYUNhdGVnb3J5PiB7CiAgICAgICAgaWYgKERl
bW9DYXRhbG9nLmlzRGVtbyhjKSkgcmV0dXJuIERlbW9DYXRhbG9nLnNlcmllc0NhdGVnb3JpZXMK
ICAgICAgICB2YWwgYXJyID0gSlNPTkFycmF5KGdldCgiJHtiYXNlKGMuc2VydmVyKX0vcGxheWVy
X2FwaS5waHA/dXNlcm5hbWU9JHtlbmMoYy51c2VybmFtZSl9JnBhc3N3b3JkPSR7ZW5jKGMucGFz
c3dvcmQpfSZhY3Rpb249Z2V0X3Nlcmllc19jYXRlZ29yaWVzIikpCiAgICAgICAgcmV0dXJuIGJ1
aWxkTGlzdCB7CiAgICAgICAgICAgIGFkZChNZWRpYUNhdGVnb3J5KCIiLCAiQWxsIFNlcmllcyIp
KQogICAgICAgICAgICBmb3IgKGkgaW4gMCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsKICAgICAgICAg
ICAgICAgIHZhbCBvID0gYXJyLmdldEpTT05PYmplY3QoaSkKICAgICAgICAgICAgICAgIGFkZChN
ZWRpYUNhdGVnb3J5KG8ub3B0U3RyaW5nKCJjYXRlZ29yeV9pZCIpLCBvLm9wdFN0cmluZygiY2F0
ZWdvcnlfbmFtZSIsICJDYXRlZ29yeSIpKSkKICAgICAgICAgICAgfQogICAgICAgIH0KICAgIH0K
CiAgICBmdW4gbW92aWVzKGM6IFh0cmVhbUNyZWRlbnRpYWxzLCBjYXRlZ29yeUlkOiBTdHJpbmc/
ID0gbnVsbCk6IExpc3Q8TGlicmFyeUl0ZW0+IHsKICAgICAgICBpZiAoRGVtb0NhdGFsb2cuaXNE
ZW1vKGMpKSByZXR1cm4gRGVtb0NhdGFsb2cubW92aWVzKGNhdGVnb3J5SWQpCiAgICAgICAgdmFs
IHN1ZmZpeCA9IGlmIChjYXRlZ29yeUlkLmlzTnVsbE9yQmxhbmsoKSkgIiIgZWxzZSAiJmNhdGVn
b3J5X2lkPSR7ZW5jKGNhdGVnb3J5SWQpfSIKICAgICAgICB2YWwgYXJyID0gSlNPTkFycmF5KGdl
dCgiJHtiYXNlKGMuc2VydmVyKX0vcGxheWVyX2FwaS5waHA/dXNlcm5hbWU9JHtlbmMoYy51c2Vy
bmFtZSl9JnBhc3N3b3JkPSR7ZW5jKGMucGFzc3dvcmQpfSZhY3Rpb249Z2V0X3ZvZF9zdHJlYW1z
JHN1ZmZpeCIpKQogICAgICAgIHJldHVybiBidWlsZExpc3QgewogICAgICAgICAgICBmb3IgKGkg
aW4gMCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsKICAgICAgICAgICAgICAgIHZhbCBvID0gYXJyLmdl
dEpTT05PYmplY3QoaSkKICAgICAgICAgICAgICAgIHZhbCBpZCA9IG8ub3B0SW50KCJzdHJlYW1f
aWQiKQogICAgICAgICAgICAgICAgdmFsIGV4dCA9IG8ub3B0U3RyaW5nKCJjb250YWluZXJfZXh0
ZW5zaW9uIiwgIm1wNCIpLmlmQmxhbmsgeyAibXA0IiB9CiAgICAgICAgICAgICAgICB2YWwgdXJs
ID0gIiR7YmFzZShjLnNlcnZlcil9L21vdmllLyR7ZW5jKGMudXNlcm5hbWUpfS8ke2VuYyhjLnBh
c3N3b3JkKX0vJGlkLiRleHQiCiAgICAgICAgICAgICAgICB2YWwgeWVhciA9IG8ub3B0U3RyaW5n
KCJ5ZWFyIikuaWZCbGFuayB7CiAgICAgICAgICAgICAgICAgICAgby5vcHRTdHJpbmcoInJlbGVh
c2VEYXRlIikudHJpbSgpLnRha2UoNCkudGFrZUlmIHsgdmFsdWUgLT4gdmFsdWUuYWxsIHsgY2gg
LT4gY2guaXNEaWdpdCgpIH0gfSA/OiAiIgogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAg
ICAgdmFsIHJhdGluZyA9IG8ub3B0U3RyaW5nKCJyYXRpbmdfNWJhc2VkIikuaWZCbGFuayB7IG8u
b3B0U3RyaW5nKCJyYXRpbmciKSB9CiAgICAgICAgICAgICAgICBhZGQoTGlicmFyeUl0ZW0oCiAg
ICAgICAgICAgICAgICAgICAgaWQgPSBpZCwKICAgICAgICAgICAgICAgICAgICBuYW1lID0gby5v
cHRTdHJpbmcoIm5hbWUiLCAiTW92aWUiKSwKICAgICAgICAgICAgICAgICAgICBraW5kID0gIm1v
dmllIiwKICAgICAgICAgICAgICAgICAgICBwbGF5VXJsID0gdXJsLAogICAgICAgICAgICAgICAg
ICAgIGltYWdlVXJsID0gbWVkaWFVcmwoYy5zZXJ2ZXIsIG8ub3B0U3RyaW5nKCJzdHJlYW1faWNv
biIpKSwKICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeUlkID0gby5vcHRTdHJpbmcoImNhdGVn
b3J5X2lkIiksCiAgICAgICAgICAgICAgICAgICAgeWVhciA9IHllYXIsCiAgICAgICAgICAgICAg
ICAgICAgcmF0aW5nID0gY2xlYW5SYXRpbmcocmF0aW5nKQogICAgICAgICAgICAgICAgKSkKICAg
ICAgICAgICAgfQogICAgICAgIH0KICAgIH0KCiAgICBmdW4gc2VyaWVzKGM6IFh0cmVhbUNyZWRl
bnRpYWxzLCBjYXRlZ29yeUlkOiBTdHJpbmc/ID0gbnVsbCk6IExpc3Q8TGlicmFyeUl0ZW0+IHsK
ICAgICAgICBpZiAoRGVtb0NhdGFsb2cuaXNEZW1vKGMpKSByZXR1cm4gRGVtb0NhdGFsb2cuc2Vy
aWVzKGNhdGVnb3J5SWQpCiAgICAgICAgdmFsIHN1ZmZpeCA9IGlmIChjYXRlZ29yeUlkLmlzTnVs
bE9yQmxhbmsoKSkgIiIgZWxzZSAiJmNhdGVnb3J5X2lkPSR7ZW5jKGNhdGVnb3J5SWQpfSIKICAg
ICAgICB2YWwgYXJyID0gSlNPTkFycmF5KGdldCgiJHtiYXNlKGMuc2VydmVyKX0vcGxheWVyX2Fw
aS5waHA/dXNlcm5hbWU9JHtlbmMoYy51c2VybmFtZSl9JnBhc3N3b3JkPSR7ZW5jKGMucGFzc3dv
cmQpfSZhY3Rpb249Z2V0X3NlcmllcyRzdWZmaXgiKSkKICAgICAgICByZXR1cm4gYnVpbGRMaXN0
IHsKICAgICAgICAgICAgZm9yIChpIGluIDAgdW50aWwgYXJyLmxlbmd0aCgpKSB7CiAgICAgICAg
ICAgICAgICB2YWwgbyA9IGFyci5nZXRKU09OT2JqZWN0KGkpCiAgICAgICAgICAgICAgICB2YWwg
eWVhciA9IG8ub3B0U3RyaW5nKCJ5ZWFyIikuaWZCbGFuayB7CiAgICAgICAgICAgICAgICAgICAg
by5vcHRTdHJpbmcoInJlbGVhc2VEYXRlIikudHJpbSgpLnRha2UoNCkudGFrZUlmIHsgdmFsdWUg
LT4gdmFsdWUuYWxsIHsgY2ggLT4gY2guaXNEaWdpdCgpIH0gfSA/OiAiIgogICAgICAgICAgICAg
ICAgfQogICAgICAgICAgICAgICAgdmFsIHJhdGluZyA9IG8ub3B0U3RyaW5nKCJyYXRpbmdfNWJh
c2VkIikuaWZCbGFuayB7IG8ub3B0U3RyaW5nKCJyYXRpbmciKSB9CiAgICAgICAgICAgICAgICBh
ZGQoTGlicmFyeUl0ZW0oCiAgICAgICAgICAgICAgICAgICAgaWQgPSBvLm9wdEludCgic2VyaWVz
X2lkIiksCiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IG8ub3B0U3RyaW5nKCJuYW1lIiwgIlNl
cmllcyIpLAogICAgICAgICAgICAgICAgICAgIGtpbmQgPSAic2VyaWVzIiwKICAgICAgICAgICAg
ICAgICAgICBwbGF5VXJsID0gbnVsbCwKICAgICAgICAgICAgICAgICAgICBpbWFnZVVybCA9IG1l
ZGlhVXJsKGMuc2VydmVyLCBvLm9wdFN0cmluZygiY292ZXIiKSksCiAgICAgICAgICAgICAgICAg
ICAgY2F0ZWdvcnlJZCA9IG8ub3B0U3RyaW5nKCJjYXRlZ29yeV9pZCIpLAogICAgICAgICAgICAg
ICAgICAgIHllYXIgPSB5ZWFyLAogICAgICAgICAgICAgICAgICAgIHJhdGluZyA9IGNsZWFuUmF0
aW5nKHJhdGluZykKICAgICAgICAgICAgICAgICkpCiAgICAgICAgICAgIH0KICAgICAgICB9CiAg
ICB9CgogICAgZnVuIHNlcmllc0VwaXNvZGVzKGM6IFh0cmVhbUNyZWRlbnRpYWxzLCBzZXJpZXNJ
ZDogSW50KTogTGlzdDxFcGlzb2RlSXRlbT4gewogICAgICAgIGlmIChEZW1vQ2F0YWxvZy5pc0Rl
bW8oYykpIHJldHVybiBEZW1vQ2F0YWxvZy5lcGlzb2RlcyhzZXJpZXNJZCkKICAgICAgICB2YWwg
cm9vdCA9IEpTT05PYmplY3QoZ2V0KCIke2Jhc2UoYy5zZXJ2ZXIpfS9wbGF5ZXJfYXBpLnBocD91
c2VybmFtZT0ke2VuYyhjLnVzZXJuYW1lKX0mcGFzc3dvcmQ9JHtlbmMoYy5wYXNzd29yZCl9JmFj
dGlvbj1nZXRfc2VyaWVzX2luZm8mc2VyaWVzX2lkPSRzZXJpZXNJZCIpKQogICAgICAgIHZhbCBl
cGlzb2RlcyA9IHJvb3Qub3B0SlNPTk9iamVjdCgiZXBpc29kZXMiKSA/OiByZXR1cm4gZW1wdHlM
aXN0KCkKICAgICAgICB2YWwgcmVzdWx0ID0gbXV0YWJsZUxpc3RPZjxFcGlzb2RlSXRlbT4oKQog
ICAgICAgIHZhbCBzZWFzb25LZXlzID0gZXBpc29kZXMua2V5cygpCiAgICAgICAgd2hpbGUgKHNl
YXNvbktleXMuaGFzTmV4dCgpKSB7CiAgICAgICAgICAgIHZhbCBzZWFzb25LZXkgPSBzZWFzb25L
ZXlzLm5leHQoKQogICAgICAgICAgICB2YWwgc2Vhc29uID0gc2Vhc29uS2V5LnRvSW50T3JOdWxs
KCkgPzogMAogICAgICAgICAgICB2YWwgYXJyID0gZXBpc29kZXMub3B0SlNPTkFycmF5KHNlYXNv
bktleSkgPzogY29udGludWUKICAgICAgICAgICAgZm9yIChpIGluIDAgdW50aWwgYXJyLmxlbmd0
aCgpKSB7CiAgICAgICAgICAgICAgICB2YWwgbyA9IGFyci5vcHRKU09OT2JqZWN0KGkpID86IGNv
bnRpbnVlCiAgICAgICAgICAgICAgICB2YWwgaWQgPSBvLm9wdEludCgiaWQiKQogICAgICAgICAg
ICAgICAgdmFsIGVwTnVtID0gby5vcHRJbnQoImVwaXNvZGVfbnVtIiwgaSArIDEpCiAgICAgICAg
ICAgICAgICB2YWwgZXh0ID0gby5vcHRTdHJpbmcoImNvbnRhaW5lcl9leHRlbnNpb24iLCAibXA0
IikuaWZCbGFuayB7ICJtcDQiIH0KICAgICAgICAgICAgICAgIHZhbCB0aXRsZSA9IG8ub3B0U3Ry
aW5nKCJ0aXRsZSIsICJFcGlzb2RlICRlcE51bSIpCiAgICAgICAgICAgICAgICB2YWwgdXJsID0g
IiR7YmFzZShjLnNlcnZlcil9L3Nlcmllcy8ke2VuYyhjLnVzZXJuYW1lKX0vJHtlbmMoYy5wYXNz
d29yZCl9LyRpZC4kZXh0IgogICAgICAgICAgICAgICAgcmVzdWx0LmFkZChFcGlzb2RlSXRlbShp
ZCwgdGl0bGUsIHNlYXNvbiwgZXBOdW0sIGV4dCwgdXJsKSkKICAgICAgICAgICAgfQogICAgICAg
IH0KICAgICAgICByZXR1cm4gcmVzdWx0LnNvcnRlZFdpdGgoY29tcGFyZUJ5PEVwaXNvZGVJdGVt
PiB7IGl0LnNlYXNvbiB9LnRoZW5CeSB7IGl0LmVwaXNvZGUgfSkKICAgIH0KCgogICAgLyoqCiAg
ICAgKiBGdWxsIGd1aWRlIGZyb20gdGhlIHByb3ZpZGVyJ3MgWE1MVFYgZmVlZC4KICAgICAqCiAg
ICAgKiBVc2VzIHRoZSBlcGdfY2hhbm5lbF9pZCByZXR1cm5lZCB3aXRoIGxpdmUgc3RyZWFtcy4g
VGhpcyBpcyBkZWxpYmVyYXRlbHkKICAgICAqIGluZGVwZW5kZW50IG9mIHNob3J0RXBnKCkvZ2V0
X3NpbXBsZV9kYXRhX3RhYmxlIHNvIG1hbGZvcm1lZCBwZXItY2hhbm5lbAogICAgICogcmVzcG9u
c2VzIGNhbm5vdCBjb2xsYXBzZSBhIGZ1bGwgc2NoZWR1bGUgaW50byB0aGUgZmlyc3QgaG91ci4K
ICAgICAqLwogICAgZnVuIHhtbFR2R3VpZGUoCiAgICAgICAgYzogWHRyZWFtQ3JlZGVudGlhbHMs
CiAgICAgICAgY2hhbm5lbElkczogU2V0PFN0cmluZz4sCiAgICAgICAgd2luZG93U3RhcnRNczog
TG9uZywKICAgICAgICB3aW5kb3dFbmRNczogTG9uZwogICAgKTogTWFwPFN0cmluZywgTGlzdDxF
cGdJdGVtPj4gewogICAgICAgIGlmIChEZW1vQ2F0YWxvZy5pc0RlbW8oYykgfHwgY2hhbm5lbElk
cy5pc0VtcHR5KCkpIHJldHVybiBlbXB0eU1hcCgpCgogICAgICAgIHZhbCB3YW50ZWQgPSBjaGFu
bmVsSWRzLm1hcCB7IGl0LnRyaW0oKS5sb3dlcmNhc2UoTG9jYWxlLlVTKSB9LmZpbHRlciB7IGl0
LmlzTm90QmxhbmsoKSB9LnRvSGFzaFNldCgpCiAgICAgICAgaWYgKHdhbnRlZC5pc0VtcHR5KCkp
IHJldHVybiBlbXB0eU1hcCgpCgogICAgICAgIHZhbCBsb3dlclNlY29uZHMgPSAod2luZG93U3Rh
cnRNcyAvIDEwMDBMKSAtIDIgKiAzNjAwTAogICAgICAgIHZhbCB1cHBlclNlY29uZHMgPSAod2lu
ZG93RW5kTXMgLyAxMDAwTCkgKyAyICogMzYwMEwKICAgICAgICB2YWwgcmVzdWx0ID0gSGFzaE1h
cDxTdHJpbmcsIE11dGFibGVMaXN0PEVwZ0l0ZW0+PigpCiAgICAgICAgLy8gVGhlIHByb3ZpZGVy
IGxhYmVscyB0aGVzZSB2YWx1ZXMgYXMgVVRDIGV2ZW4gdGhvdWdoIHRoZSAxNC1kaWdpdAogICAg
ICAgIC8vIFhNTFRWIGNsb2NrIHZhbHVlcyBhcmUgYWxyZWFkeSBsb2NhbCB3YWxsLWNsb2NrIHRp
bWUuIEtlZXAgdGhlIEVQRywKICAgICAgICAvLyB0aW1lbGluZSBsYWJlbHMgYW5kIE5PVyBtYXJr
ZXIgb24gdGhlIEFuZHJvaWQgZGV2aWNlJ3Mgb25lIGNsb2NrLgogICAgICAgIHZhbCBndWlkZVRp
bWVab25lID0gVGltZVpvbmUuZ2V0RGVmYXVsdCgpCgogICAgICAgIHZhbCB1cmwgPSAiJHtiYXNl
KGMuc2VydmVyKX0veG1sdHYucGhwP3VzZXJuYW1lPSR7ZW5jKGMudXNlcm5hbWUpfSZwYXNzd29y
ZD0ke2VuYyhjLnBhc3N3b3JkKX0iCiAgICAgICAgd2l0aElucHV0U3RyZWFtKHVybCkgeyBpbnB1
dCAtPgogICAgICAgICAgICB2YWwgcGFyc2VyID0gWG1sLm5ld1B1bGxQYXJzZXIoKQogICAgICAg
ICAgICBwYXJzZXIuc2V0SW5wdXQoSW5wdXRTdHJlYW1SZWFkZXIoaW5wdXQsIENoYXJzZXRzLlVU
Rl84KSkKCiAgICAgICAgICAgIHZhciBldmVudCA9IHBhcnNlci5ldmVudFR5cGUKICAgICAgICAg
ICAgd2hpbGUgKGV2ZW50ICE9IFhtbFB1bGxQYXJzZXIuRU5EX0RPQ1VNRU5UKSB7CiAgICAgICAg
ICAgICAgICBpZiAoZXZlbnQgPT0gWG1sUHVsbFBhcnNlci5TVEFSVF9UQUcgJiYgcGFyc2VyLm5h
bWUuZXF1YWxzKCJwcm9ncmFtbWUiLCB0cnVlKSkgewogICAgICAgICAgICAgICAgICAgIHZhbCBj
aGFubmVsID0gcGFyc2VyLmdldEF0dHJpYnV0ZVZhbHVlKG51bGwsICJjaGFubmVsIik/LnRyaW0o
KS5vckVtcHR5KCkKICAgICAgICAgICAgICAgICAgICB2YWwgY2hhbm5lbEtleSA9IGNoYW5uZWwu
bG93ZXJjYXNlKExvY2FsZS5VUykKICAgICAgICAgICAgICAgICAgICB2YWwgc3RhcnRSYXcgPSBw
YXJzZXIuZ2V0QXR0cmlidXRlVmFsdWUobnVsbCwgInN0YXJ0Iik/LnRyaW0oKS5vckVtcHR5KCkK
ICAgICAgICAgICAgICAgICAgICB2YWwgc3RvcFJhdyA9IHBhcnNlci5nZXRBdHRyaWJ1dGVWYWx1
ZShudWxsLCAic3RvcCIpPy50cmltKCkub3JFbXB0eSgpCiAgICAgICAgICAgICAgICAgICAgdmFs
IHN0YXJ0U2Vjb25kcyA9IHBhcnNlWG1sVHZTZWNvbmRzKHN0YXJ0UmF3LCBndWlkZVRpbWVab25l
KQogICAgICAgICAgICAgICAgICAgIHZhbCBzdG9wU2Vjb25kcyA9IHBhcnNlWG1sVHZTZWNvbmRz
KHN0b3BSYXcsIGd1aWRlVGltZVpvbmUpCgogICAgICAgICAgICAgICAgICAgIHZhciB0aXRsZSA9
ICIiCiAgICAgICAgICAgICAgICAgICAgdmFyIGRlc2NyaXB0aW9uID0gIiIKCiAgICAgICAgICAg
ICAgICAgICAgdmFyIGRlcHRoID0gcGFyc2VyLmRlcHRoCiAgICAgICAgICAgICAgICAgICAgdmFy
IGlubmVyID0gcGFyc2VyLm5leHQoKQogICAgICAgICAgICAgICAgICAgIHdoaWxlICghKGlubmVy
ID09IFhtbFB1bGxQYXJzZXIuRU5EX1RBRyAmJiBwYXJzZXIuZGVwdGggPT0gZGVwdGggJiYgcGFy
c2VyLm5hbWUuZXF1YWxzKCJwcm9ncmFtbWUiLCB0cnVlKSkpIHsKICAgICAgICAgICAgICAgICAg
ICAgICAgaWYgKGlubmVyID09IFhtbFB1bGxQYXJzZXIuU1RBUlRfVEFHKSB7CiAgICAgICAgICAg
ICAgICAgICAgICAgICAgICB3aGVuIChwYXJzZXIubmFtZS5sb3dlcmNhc2UoTG9jYWxlLlVTKSkg
ewogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICJ0aXRsZSIgLT4gdGl0bGUgPSBwYXJz
ZXIubmV4dFRleHQoKS50cmltKCkKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAiZGVz
YyIgLT4gZGVzY3JpcHRpb24gPSBwYXJzZXIubmV4dFRleHQoKS50cmltKCkKICAgICAgICAgICAg
ICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAg
ICAgICAgICAgICBpbm5lciA9IHBhcnNlci5uZXh0KCkKICAgICAgICAgICAgICAgICAgICB9Cgog
ICAgICAgICAgICAgICAgICAgIGlmICgKICAgICAgICAgICAgICAgICAgICAgICAgY2hhbm5lbEtl
eSBpbiB3YW50ZWQgJiYKICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRTZWNvbmRzICE9IG51
bGwgJiYKICAgICAgICAgICAgICAgICAgICAgICAgc3RvcFNlY29uZHMgIT0gbnVsbCAmJgogICAg
ICAgICAgICAgICAgICAgICAgICBzdG9wU2Vjb25kcyA+IHN0YXJ0U2Vjb25kcyAmJgogICAgICAg
ICAgICAgICAgICAgICAgICBzdG9wU2Vjb25kcyA+PSBsb3dlclNlY29uZHMgJiYKICAgICAgICAg
ICAgICAgICAgICAgICAgc3RhcnRTZWNvbmRzIDw9IHVwcGVyU2Vjb25kcwogICAgICAgICAgICAg
ICAgICAgICkgewogICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuZ2V0T3JQdXQoY2hhbm5l
bEtleSkgeyBtdXRhYmxlTGlzdE9mKCkgfS5hZGQoCiAgICAgICAgICAgICAgICAgICAgICAgICAg
ICBFcGdJdGVtKAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlID0gdGl0bGUu
aWZCbGFuayB7ICJQcm9ncmFtIiB9LAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRl
c2NyaXB0aW9uID0gZGVzY3JpcHRpb24sCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
c3RhcnQgPSBzdGFydFJhdywKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQgPSBz
dG9wUmF3LAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VGltZXN0YW1wID0g
c3RhcnRTZWNvbmRzLAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFRpbWVzdGFt
cCA9IHN0b3BTZWNvbmRzCiAgICAgICAgICAgICAgICAgICAgICAgICAgICApCiAgICAgICAgICAg
ICAgICAgICAgICAgICkKICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9CiAg
ICAgICAgICAgICAgICBldmVudCA9IHBhcnNlci5uZXh0KCkKICAgICAgICAgICAgfQogICAgICAg
IH0KCiAgICAgICAgcmV0dXJuIHJlc3VsdC5tYXBWYWx1ZXMgeyAoXywgaXRlbXMpIC0+CiAgICAg
ICAgICAgIGl0ZW1zCiAgICAgICAgICAgICAgICAuZGlzdGluY3RCeSB7ICIke2l0LnN0YXJ0VGlt
ZXN0YW1wfXwke2l0LmVuZFRpbWVzdGFtcH18JHtpdC50aXRsZX0iIH0KICAgICAgICAgICAgICAg
IC5zb3J0ZWRCeSB7IGl0LnN0YXJ0VGltZXN0YW1wID86IExvbmcuTUFYX1ZBTFVFIH0KICAgICAg
ICB9CiAgICB9CgogICAgLyoqCiAgICAgKiBLZWVwIGFsbCBndWlkZSBjbG9ja3MgaW4gdGhlIEFu
ZHJvaWQgZGV2aWNlJ3MgbG9jYWwgdGltZSB6b25lLgogICAgICoKICAgICAqIFRoaXMgcHJvdmlk
ZXIgYWR2ZXJ0aXNlcyBVVEMgd2hpbGUgc2VuZGluZyBsb2NhbCB3YWxsLWNsb2NrIHZhbHVlcywg
c28KICAgICAqIHRydXN0aW5nIHNlcnZlcl9pbmZvLnRpbWV6b25lIG1vdmVzIGV2ZXJ5IHByb2dy
YW1tZSBieSBmb3VyIGhvdXJzLiBSZWFkCiAgICAgKiB0aGUgZmlyc3QgMTQgWE1MVFYgZGlnaXRz
IGluIHRoZSBzYW1lIGRldmljZSB6b25lIHVzZWQgYnkgdGhlIGd1aWRlJ3MKICAgICAqIHRpbWUg
bGFiZWxzIGFuZCBOT1cgbWFya2VyLiBTdGFuZGFyZHMtYmFzZWQgcGFyc2luZyByZW1haW5zIGEg
ZmFsbGJhY2suCiAgICAgKi8KICAgIHByaXZhdGUgZnVuIHBhcnNlWG1sVHZTZWNvbmRzKHJhdzog
U3RyaW5nLCBndWlkZVRpbWVab25lOiBUaW1lWm9uZSk6IExvbmc/IHsKICAgICAgICB2YWwgdmFs
dWUgPSByYXcudHJpbSgpCiAgICAgICAgaWYgKHZhbHVlLmlzQmxhbmsoKSkgcmV0dXJuIG51bGwK
CiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA+PSAxNCkgewogICAgICAgICAgICB0cnkgewogICAg
ICAgICAgICAgICAgdmFsIHBhcnNlciA9IFNpbXBsZURhdGVGb3JtYXQoInl5eXlNTWRkSEhtbXNz
IiwgTG9jYWxlLlVTKS5hcHBseSB7CiAgICAgICAgICAgICAgICAgICAgaXNMZW5pZW50ID0gZmFs
c2UKICAgICAgICAgICAgICAgICAgICB0aW1lWm9uZSA9IGd1aWRlVGltZVpvbmUKICAgICAgICAg
ICAgICAgIH0KICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZXIucGFyc2UodmFsdWUuc3Vic3Ry
aW5nKDAsIDE0KSk/LnRpbWU/LmRpdigxMDAwTCkKICAgICAgICAgICAgfSBjYXRjaCAoXzogRXhj
ZXB0aW9uKSB7CiAgICAgICAgICAgICAgICAvLyBGYWxsIHRocm91Z2ggdG8gc3RhbmRhcmRzLWJh
c2VkIFhNTFRWIHBhcnNpbmcuCiAgICAgICAgICAgIH0KICAgICAgICB9CgogICAgICAgIHZhbCBw
YXR0ZXJucyA9IGxpc3RPZigKICAgICAgICAgICAgInl5eXlNTWRkSEhtbXNzIFoiLAogICAgICAg
ICAgICAieXl5eU1NZGRISG1tIFoiLAogICAgICAgICAgICAieXl5eU1NZGRISG1tc3MiLAogICAg
ICAgICAgICAieXl5eU1NZGRISG1tIgogICAgICAgICkKCiAgICAgICAgZm9yIChwYXR0ZXJuIGlu
IHBhdHRlcm5zKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICB2YWwgcGFyc2Vy
ID0gU2ltcGxlRGF0ZUZvcm1hdChwYXR0ZXJuLCBMb2NhbGUuVVMpLmFwcGx5IHsgaXNMZW5pZW50
ID0gZmFsc2UgfQogICAgICAgICAgICAgICAgdmFsIHBhcnNlZCA9IHBhcnNlci5wYXJzZSh2YWx1
ZSkgPzogY29udGludWUKICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZWQudGltZSAvIDEwMDBM
CiAgICAgICAgICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikgewogICAgICAgICAgICAgICAgLy8g
VHJ5IG5leHQgWE1MVFYgdGltZXN0YW1wIGZvcm0uCiAgICAgICAgICAgIH0KICAgICAgICB9CiAg
ICAgICAgcmV0dXJuIG51bGwKICAgIH0KCiAgICBmdW4gc2hvcnRFcGcoYzogWHRyZWFtQ3JlZGVu
dGlhbHMsIHN0cmVhbUlkOiBJbnQsIGxpbWl0OiBJbnQgPSAyKTogTGlzdDxFcGdJdGVtPiB7CiAg
ICAgICAgaWYgKERlbW9DYXRhbG9nLmlzRGVtbyhjKSkgcmV0dXJuIERlbW9DYXRhbG9nLmVwZyhz
dHJlYW1JZCkKICAgICAgICB2YWwgcm9vdCA9IEpTT05PYmplY3QoZ2V0KCIke2Jhc2UoYy5zZXJ2
ZXIpfS9wbGF5ZXJfYXBpLnBocD91c2VybmFtZT0ke2VuYyhjLnVzZXJuYW1lKX0mcGFzc3dvcmQ9
JHtlbmMoYy5wYXNzd29yZCl9JmFjdGlvbj1nZXRfc2hvcnRfZXBnJnN0cmVhbV9pZD0kc3RyZWFt
SWQmbGltaXQ9JGxpbWl0IikpCiAgICAgICAgdmFsIGFyciA9IHJvb3Qub3B0SlNPTkFycmF5KCJl
cGdfbGlzdGluZ3MiKSA/OiByZXR1cm4gZW1wdHlMaXN0KCkKICAgICAgICByZXR1cm4gYnVpbGRM
aXN0IHsKICAgICAgICAgICAgZm9yIChpIGluIDAgdW50aWwgYXJyLmxlbmd0aCgpKSB7CiAgICAg
ICAgICAgICAgICB2YWwgbyA9IGFyci5vcHRKU09OT2JqZWN0KGkpID86IGNvbnRpbnVlCiAgICAg
ICAgICAgICAgICB2YWwgdGl0bGUgPSBkZWNvZGVFcGdUZXh0KG8ub3B0U3RyaW5nKCJ0aXRsZSIs
ICJQcm9ncmFtIiksICJQcm9ncmFtIikKICAgICAgICAgICAgICAgIHZhbCBkZXNjcmlwdGlvbiA9
IGRlY29kZUVwZ1RleHQoby5vcHRTdHJpbmcoImRlc2NyaXB0aW9uIiwgIiIpLCAiIikKICAgICAg
ICAgICAgICAgIGFkZChFcGdJdGVtKAogICAgICAgICAgICAgICAgICAgIHRpdGxlID0gdGl0bGUs
CiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbiwKICAgICAgICAg
ICAgICAgICAgICBzdGFydCA9IG8ub3B0U3RyaW5nKCJzdGFydCIsICIiKSwKICAgICAgICAgICAg
ICAgICAgICBlbmQgPSBvLm9wdFN0cmluZygiZW5kIiwgIiIpLAogICAgICAgICAgICAgICAgICAg
IHN0YXJ0VGltZXN0YW1wID0gZXBnVGltZXN0YW1wU2Vjb25kcyhvLCAic3RhcnRfdGltZXN0YW1w
IiwgInN0YXJ0X3RzIiksCiAgICAgICAgICAgICAgICAgICAgZW5kVGltZXN0YW1wID0gZXBnVGlt
ZXN0YW1wU2Vjb25kcyhvLCAic3RvcF90aW1lc3RhbXAiLCAiZW5kX3RpbWVzdGFtcCIsICJlbmRf
dHMiKQogICAgICAgICAgICAgICAgKSkKICAgICAgICAgICAgfQogICAgICAgIH0KICAgIH0KCgog
ICAgLyoqCiAgICAgKiBGdWxsIFRWIEd1aWRlIHJlcXVlc3QgcGF0aC4KICAgICAqCiAgICAgKiBU
aGlzIGlzIGludGVudGlvbmFsbHkgc2VwYXJhdGUgZnJvbSBzaG9ydEVwZygpLCBzbyB0aGUga25v
d24tZ29vZAogICAgICogTGl2ZSBUViBOb3cvTmV4dCBiZWhhdmlvciBpbiBSMiBpcyBsZWZ0IHVu
Y2hhbmdlZC4KICAgICAqLwogICAgZnVuIGd1aWRlRXBnKGM6IFh0cmVhbUNyZWRlbnRpYWxzLCBz
dHJlYW1JZDogSW50LCBsaW1pdDogSW50ID0gOTYpOiBMaXN0PEVwZ0l0ZW0+IHsKICAgICAgICBp
ZiAoRGVtb0NhdGFsb2cuaXNEZW1vKGMpKSByZXR1cm4gRGVtb0NhdGFsb2cuZXBnKHN0cmVhbUlk
KQoKICAgICAgICB2YWwgc2FmZUxpbWl0ID0gbGltaXQuY29lcmNlSW4oOCwgMTkyKQoKICAgICAg
ICB2YWwgcHJpbWFyeSA9IHJ1bkNhdGNoaW5nIHsKICAgICAgICAgICAgZmV0Y2hHdWlkZUFjdGlv
bihjLCBzdHJlYW1JZCwgImdldF9zaW1wbGVfZGF0YV90YWJsZSIsIG51bGwpCiAgICAgICAgfS5n
ZXRPckRlZmF1bHQoZW1wdHlMaXN0KCkpCgogICAgICAgIGlmIChoYXNGdWxsR3VpZGVEZXB0aChw
cmltYXJ5KSkgewogICAgICAgICAgICByZXR1cm4gbm9ybWFsaXplR3VpZGVFcGcocHJpbWFyeSwg
c2FmZUxpbWl0KQogICAgICAgIH0KCiAgICAgICAgdmFsIGFsdGVybmF0ZSA9IHJ1bkNhdGNoaW5n
IHsKICAgICAgICAgICAgZmV0Y2hHdWlkZUFjdGlvbihjLCBzdHJlYW1JZCwgImdldF9zaW1wbGVf
ZGF0ZV90YWJsZSIsIG51bGwpCiAgICAgICAgfS5nZXRPckRlZmF1bHQoZW1wdHlMaXN0KCkpCgog
ICAgICAgIHZhbCBmdWxsQ29tYmluZWQgPSBtZXJnZUd1aWRlRXBnKHByaW1hcnksIGFsdGVybmF0
ZSkKICAgICAgICBpZiAoaGFzRnVsbEd1aWRlRGVwdGgoZnVsbENvbWJpbmVkKSkgewogICAgICAg
ICAgICByZXR1cm4gbm9ybWFsaXplR3VpZGVFcGcoZnVsbENvbWJpbmVkLCBzYWZlTGltaXQpCiAg
ICAgICAgfQoKICAgICAgICAvLyBMYXN0IHJlc29ydCBvbmx5LiBTb21lIHBhbmVscyBob25vciBh
IGxhcmdlIHNob3J0LUVQRyBsaW1pdCwgd2hpbGUKICAgICAgICAvLyBvdGhlcnMgY2FwIHRoaXMg
ZW5kcG9pbnQgYXQgTm93L05leHQuIE1lcmdlIHdoYXRldmVyIGl0IHJldHVybnMgd2l0aAogICAg
ICAgIC8vIHRoZSBmdWxsLXRhYmxlIHJlc3VsdHMgaW5zdGVhZCBvZiBkaXNjYXJkaW5nIGVpdGhl
ciBzb3VyY2UuCiAgICAgICAgdmFsIHNob3J0RmFsbGJhY2sgPSBydW5DYXRjaGluZyB7CiAgICAg
ICAgICAgIGZldGNoR3VpZGVBY3Rpb24oYywgc3RyZWFtSWQsICJnZXRfc2hvcnRfZXBnIiwgbWF4
T2Yoc2FmZUxpbWl0LCA5NikpCiAgICAgICAgfS5nZXRPckRlZmF1bHQoZW1wdHlMaXN0KCkpCgog
ICAgICAgIHJldHVybiBub3JtYWxpemVHdWlkZUVwZygKICAgICAgICAgICAgbWVyZ2VHdWlkZUVw
ZyhmdWxsQ29tYmluZWQsIHNob3J0RmFsbGJhY2spLAogICAgICAgICAgICBzYWZlTGltaXQKICAg
ICAgICApCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gZmV0Y2hHdWlkZUFjdGlvbigKICAgICAgICBj
OiBYdHJlYW1DcmVkZW50aWFscywKICAgICAgICBzdHJlYW1JZDogSW50LAogICAgICAgIGFjdGlv
bjogU3RyaW5nLAogICAgICAgIGxpbWl0OiBJbnQ/CiAgICApOiBMaXN0PEVwZ0l0ZW0+IHsKICAg
ICAgICB2YWwgbGltaXRQYXJ0ID0gbGltaXQ/LmxldCB7ICImbGltaXQ9JGl0IiB9Lm9yRW1wdHko
KQogICAgICAgIHZhbCBib2R5ID0gZ2V0KAogICAgICAgICAgICAiJHtiYXNlKGMuc2VydmVyKX0v
cGxheWVyX2FwaS5waHA/dXNlcm5hbWU9JHtlbmMoYy51c2VybmFtZSl9JnBhc3N3b3JkPSR7ZW5j
KGMucGFzc3dvcmQpfSIgKwogICAgICAgICAgICAgICAgIiZhY3Rpb249JGFjdGlvbiZzdHJlYW1f
aWQ9JHN0cmVhbUlkJGxpbWl0UGFydCIKICAgICAgICApLnRyaW0oKQoKICAgICAgICBpZiAoYm9k
eS5pc0JsYW5rKCkpIHJldHVybiBlbXB0eUxpc3QoKQoKICAgICAgICB2YWwgYXJyID0gZXh0cmFj
dEd1aWRlQXJyYXkoYm9keSkKICAgICAgICBpZiAoYXJyLmxlbmd0aCgpID09IDApIHJldHVybiBl
bXB0eUxpc3QoKQoKICAgICAgICByZXR1cm4gYnVpbGRMaXN0IHsKICAgICAgICAgICAgZm9yIChp
IGluIDAgdW50aWwgYXJyLmxlbmd0aCgpKSB7CiAgICAgICAgICAgICAgICB2YWwgbyA9IGFyci5v
cHRKU09OT2JqZWN0KGkpID86IGNvbnRpbnVlCgogICAgICAgICAgICAgICAgdmFsIHRpdGxlID0g
ZGVjb2RlRXBnVGV4dCgKICAgICAgICAgICAgICAgICAgICBmaXJzdEd1aWRlU3RyaW5nKG8sICJ0
aXRsZSIsICJuYW1lIiwgInByb2dyYW0iLCAicHJvZ3JhbW1lIikKICAgICAgICAgICAgICAgICAg
ICAgICAgLmlmQmxhbmsgeyAiUHJvZ3JhbSIgfSwKICAgICAgICAgICAgICAgICAgICAiUHJvZ3Jh
bSIKICAgICAgICAgICAgICAgICkKICAgICAgICAgICAgICAgIHZhbCBkZXNjcmlwdGlvbiA9IGRl
Y29kZUVwZ1RleHQoCiAgICAgICAgICAgICAgICAgICAgZmlyc3RHdWlkZVN0cmluZyhvLCAiZGVz
Y3JpcHRpb24iLCAiZGVzYyIsICJwbG90IiksCiAgICAgICAgICAgICAgICAgICAgIiIKICAgICAg
ICAgICAgICAgICkKCiAgICAgICAgICAgICAgICB2YWwgc3RhcnRUZXh0ID0gZmlyc3RHdWlkZVN0
cmluZygKICAgICAgICAgICAgICAgICAgICBvLAogICAgICAgICAgICAgICAgICAgICJzdGFydCIs
CiAgICAgICAgICAgICAgICAgICAgInN0YXJ0X2RhdGUiLAogICAgICAgICAgICAgICAgICAgICJz
dGFydF9kYXRldGltZSIsCiAgICAgICAgICAgICAgICAgICAgImJlZ2luIiwKICAgICAgICAgICAg
ICAgICAgICAiYmVnaW5fdGltZSIKICAgICAgICAgICAgICAgICkKICAgICAgICAgICAgICAgIHZh
bCBlbmRUZXh0ID0gZmlyc3RHdWlkZVN0cmluZygKICAgICAgICAgICAgICAgICAgICBvLAogICAg
ICAgICAgICAgICAgICAgICJlbmQiLAogICAgICAgICAgICAgICAgICAgICJzdG9wIiwKICAgICAg
ICAgICAgICAgICAgICAiZW5kX2RhdGUiLAogICAgICAgICAgICAgICAgICAgICJlbmRfZGF0ZXRp
bWUiLAogICAgICAgICAgICAgICAgICAgICJzdG9wX2RhdGUiLAogICAgICAgICAgICAgICAgICAg
ICJzdG9wX2RhdGV0aW1lIgogICAgICAgICAgICAgICAgKQoKICAgICAgICAgICAgICAgIHZhbCBz
dGFydFRzID0gZ3VpZGVUaW1lc3RhbXBTZWNvbmRzKAogICAgICAgICAgICAgICAgICAgIG8sCiAg
ICAgICAgICAgICAgICAgICAgInN0YXJ0X3RpbWVzdGFtcCIsCiAgICAgICAgICAgICAgICAgICAg
InN0YXJ0X3RzIiwKICAgICAgICAgICAgICAgICAgICAic3RhcnRfdW5peCIsCiAgICAgICAgICAg
ICAgICAgICAgInN0YXJ0X2Vwb2NoIgogICAgICAgICAgICAgICAgKSA/OiBwYXJzZUd1aWRlRGF0
ZVNlY29uZHMoc3RhcnRUZXh0KQoKICAgICAgICAgICAgICAgIHZhbCBlbmRUcyA9IGd1aWRlVGlt
ZXN0YW1wU2Vjb25kcygKICAgICAgICAgICAgICAgICAgICBvLAogICAgICAgICAgICAgICAgICAg
ICJzdG9wX3RpbWVzdGFtcCIsCiAgICAgICAgICAgICAgICAgICAgImVuZF90aW1lc3RhbXAiLAog
ICAgICAgICAgICAgICAgICAgICJlbmRfdHMiLAogICAgICAgICAgICAgICAgICAgICJzdG9wX3Rz
IiwKICAgICAgICAgICAgICAgICAgICAiZW5kX3VuaXgiLAogICAgICAgICAgICAgICAgICAgICJz
dG9wX3VuaXgiLAogICAgICAgICAgICAgICAgICAgICJlbmRfZXBvY2giCiAgICAgICAgICAgICAg
ICApID86IHBhcnNlR3VpZGVEYXRlU2Vjb25kcyhlbmRUZXh0KQoKICAgICAgICAgICAgICAgIGFk
ZCgKICAgICAgICAgICAgICAgICAgICBFcGdJdGVtKAogICAgICAgICAgICAgICAgICAgICAgICB0
aXRsZSA9IHRpdGxlLAogICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbiA9IGRlc2Ny
aXB0aW9uLAogICAgICAgICAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0VGV4dCwKICAgICAg
ICAgICAgICAgICAgICAgICAgZW5kID0gZW5kVGV4dCwKICAgICAgICAgICAgICAgICAgICAgICAg
c3RhcnRUaW1lc3RhbXAgPSBzdGFydFRzLAogICAgICAgICAgICAgICAgICAgICAgICBlbmRUaW1l
c3RhbXAgPSBlbmRUcwogICAgICAgICAgICAgICAgICAgICkKICAgICAgICAgICAgICAgICkKICAg
ICAgICAgICAgfQogICAgICAgIH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biBleHRyYWN0R3VpZGVB
cnJheShib2R5OiBTdHJpbmcpOiBKU09OQXJyYXkgewogICAgICAgIGlmIChib2R5LnN0YXJ0c1dp
dGgoIlsiKSkgewogICAgICAgICAgICByZXR1cm4gcnVuQ2F0Y2hpbmcgeyBKU09OQXJyYXkoYm9k
eSkgfS5nZXRPckRlZmF1bHQoSlNPTkFycmF5KCkpCiAgICAgICAgfQoKICAgICAgICB2YWwgcm9v
dCA9IHJ1bkNhdGNoaW5nIHsgSlNPTk9iamVjdChib2R5KSB9LmdldE9yTnVsbCgpID86IHJldHVy
biBKU09OQXJyYXkoKQoKICAgICAgICByb290Lm9wdEpTT05BcnJheSgiZXBnX2xpc3RpbmdzIik/
LmxldCB7IHJldHVybiBpdCB9CiAgICAgICAgcm9vdC5vcHRKU09OQXJyYXkoImxpc3RpbmdzIik/
LmxldCB7IHJldHVybiBpdCB9CiAgICAgICAgcm9vdC5vcHRKU09OQXJyYXkoImVwZyIpPy5sZXQg
eyByZXR1cm4gaXQgfQogICAgICAgIHJvb3Qub3B0SlNPTkFycmF5KCJkYXRhIik/LmxldCB7IHJl
dHVybiBpdCB9CgogICAgICAgIHZhbCBkYXRhID0gcm9vdC5vcHRKU09OT2JqZWN0KCJkYXRhIikK
ICAgICAgICBkYXRhPy5vcHRKU09OQXJyYXkoImVwZ19saXN0aW5ncyIpPy5sZXQgeyByZXR1cm4g
aXQgfQogICAgICAgIGRhdGE/Lm9wdEpTT05BcnJheSgibGlzdGluZ3MiKT8ubGV0IHsgcmV0dXJu
IGl0IH0KICAgICAgICBkYXRhPy5vcHRKU09OQXJyYXkoImVwZyIpPy5sZXQgeyByZXR1cm4gaXQg
fQoKICAgICAgICB2YWwgcmVzdWx0ID0gcm9vdC5vcHRKU09OT2JqZWN0KCJyZXN1bHQiKQogICAg
ICAgIHJlc3VsdD8ub3B0SlNPTkFycmF5KCJlcGdfbGlzdGluZ3MiKT8ubGV0IHsgcmV0dXJuIGl0
IH0KICAgICAgICByZXN1bHQ/Lm9wdEpTT05BcnJheSgibGlzdGluZ3MiKT8ubGV0IHsgcmV0dXJu
IGl0IH0KCiAgICAgICAgcmV0dXJuIEpTT05BcnJheSgpCiAgICB9CgogICAgcHJpdmF0ZSBmdW4g
Zmlyc3RHdWlkZVN0cmluZyhvOiBKU09OT2JqZWN0LCB2YXJhcmcga2V5czogU3RyaW5nKTogU3Ry
aW5nIHsKICAgICAgICBmb3IgKGtleSBpbiBrZXlzKSB7CiAgICAgICAgICAgIHZhbCB2YWx1ZSA9
IG8ub3B0U3RyaW5nKGtleSwgIiIpLnRyaW0oKQogICAgICAgICAgICBpZiAodmFsdWUuaXNOb3RC
bGFuaygpICYmICF2YWx1ZS5lcXVhbHMoIm51bGwiLCB0cnVlKSkgcmV0dXJuIHZhbHVlCiAgICAg
ICAgfQogICAgICAgIHJldHVybiAiIgogICAgfQoKICAgIHByaXZhdGUgZnVuIGd1aWRlVGltZXN0
YW1wU2Vjb25kcyhvOiBKU09OT2JqZWN0LCB2YXJhcmcga2V5czogU3RyaW5nKTogTG9uZz8gewog
ICAgICAgIGZvciAoa2V5IGluIGtleXMpIHsKICAgICAgICAgICAgdmFsIHJhdyA9IG8ub3B0KGtl
eSkKICAgICAgICAgICAgdmFsIHNlY29uZHMgPSB3aGVuIChyYXcpIHsKICAgICAgICAgICAgICAg
IGlzIE51bWJlciAtPiBub3JtYWxpemVHdWlkZUVwb2NoKHJhdy50b0xvbmcoKSkKICAgICAgICAg
ICAgICAgIGlzIFN0cmluZyAtPiBwYXJzZUd1aWRlRGF0ZVNlY29uZHMocmF3KQogICAgICAgICAg
ICAgICAgZWxzZSAtPiBudWxsCiAgICAgICAgICAgIH0KICAgICAgICAgICAgaWYgKHNlY29uZHMg
IT0gbnVsbCAmJiBzZWNvbmRzID4gMEwpIHJldHVybiBzZWNvbmRzCiAgICAgICAgfQogICAgICAg
IHJldHVybiBudWxsCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gbm9ybWFsaXplR3VpZGVFcG9jaCh2
YWx1ZTogTG9uZyk6IExvbmc/IHsKICAgICAgICBpZiAodmFsdWUgPD0gMEwpIHJldHVybiBudWxs
CiAgICAgICAgcmV0dXJuIGlmICh2YWx1ZSA+IDEwMF8wMDBfMDAwXzAwMEwpIHZhbHVlIC8gMTAw
MEwgZWxzZSB2YWx1ZQogICAgfQoKICAgIHByaXZhdGUgZnVuIHBhcnNlR3VpZGVEYXRlU2Vjb25k
cyhyYXc6IFN0cmluZyk6IExvbmc/IHsKICAgICAgICB2YWwgdmFsdWUgPSByYXcudHJpbSgpCiAg
ICAgICAgaWYgKHZhbHVlLmlzQmxhbmsoKSB8fCB2YWx1ZS5lcXVhbHMoIm51bGwiLCB0cnVlKSkg
cmV0dXJuIG51bGwKCiAgICAgICAgdmFsdWUudG9Mb25nT3JOdWxsKCk/LmxldCB7IHJldHVybiBu
b3JtYWxpemVHdWlkZUVwb2NoKGl0KSB9CgogICAgICAgIHZhbCBwYXR0ZXJucyA9IGxpc3RPZigK
ICAgICAgICAgICAgInl5eXktTU0tZGQgSEg6bW06c3MiLAogICAgICAgICAgICAieXl5eS1NTS1k
ZCBISDptbSIsCiAgICAgICAgICAgICJ5eXl5LU1NLWRkIEhIOm1tOnNzIFoiLAogICAgICAgICAg
ICAieXl5eS1NTS1kZCdUJ0hIOm1tOnNzWFhYIiwKICAgICAgICAgICAgInl5eXktTU0tZGQnVCdI
SDptbTpzcy5TU1NYWFgiLAogICAgICAgICAgICAieXl5eS1NTS1kZCdUJ0hIOm1tOnNzWCIsCiAg
ICAgICAgICAgICJ5eXl5TU1kZEhIbW1zcyBaIiwKICAgICAgICAgICAgInl5eXlNTWRkSEhtbXNz
IgogICAgICAgICkKCiAgICAgICAgZm9yIChwYXR0ZXJuIGluIHBhdHRlcm5zKSB7CiAgICAgICAg
ICAgIHRyeSB7CiAgICAgICAgICAgICAgICB2YWwgcGFyc2VyID0gU2ltcGxlRGF0ZUZvcm1hdChw
YXR0ZXJuLCBMb2NhbGUuVVMpLmFwcGx5IHsKICAgICAgICAgICAgICAgICAgICBpc0xlbmllbnQg
PSBmYWxzZQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgdmFsIHBhcnNlZCA9IHBh
cnNlci5wYXJzZSh2YWx1ZSkgPzogY29udGludWUKICAgICAgICAgICAgICAgIHJldHVybiBwYXJz
ZWQudGltZSAvIDEwMDBMCiAgICAgICAgICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikgewogICAg
ICAgICAgICAgICAgLy8gVHJ5IHRoZSBuZXh0IHByb3ZpZGVyIGRhdGUgZm9ybWF0LgogICAgICAg
ICAgICB9CiAgICAgICAgfQogICAgICAgIHJldHVybiBudWxsCiAgICB9CgogICAgcHJpdmF0ZSBm
dW4gbWVyZ2VHdWlkZUVwZyh2YXJhcmcgbGlzdHM6IExpc3Q8RXBnSXRlbT4pOiBMaXN0PEVwZ0l0
ZW0+IHsKICAgICAgICByZXR1cm4gbGlzdHMuYXNTZXF1ZW5jZSgpCiAgICAgICAgICAgIC5mbGF0
dGVuKCkKICAgICAgICAgICAgLmRpc3RpbmN0QnkgeyBpdGVtIC0+CiAgICAgICAgICAgICAgICAi
JHtpdGVtLnN0YXJ0VGltZXN0YW1wID86IGl0ZW0uc3RhcnR9fCR7aXRlbS5lbmRUaW1lc3RhbXAg
PzogaXRlbS5lbmR9fCR7aXRlbS50aXRsZX0iCiAgICAgICAgICAgIH0KICAgICAgICAgICAgLnRv
TGlzdCgpCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gbm9ybWFsaXplR3VpZGVFcGcoaXRlbXM6IExp
c3Q8RXBnSXRlbT4sIGxpbWl0OiBJbnQpOiBMaXN0PEVwZ0l0ZW0+IHsKICAgICAgICBpZiAoaXRl
bXMuaXNFbXB0eSgpKSByZXR1cm4gZW1wdHlMaXN0KCkKCiAgICAgICAgdmFsIGRlZHVwZWQgPSBt
ZXJnZUd1aWRlRXBnKGl0ZW1zKQogICAgICAgIHZhbCBoYXNUaW1lc3RhbXBzID0gZGVkdXBlZC5h
bnkgeyBpdC5zdGFydFRpbWVzdGFtcCAhPSBudWxsIH0KCiAgICAgICAgdmFsIHNvcnRlZCA9IGlm
IChoYXNUaW1lc3RhbXBzKSB7CiAgICAgICAgICAgIGRlZHVwZWQuc29ydGVkV2l0aCgKICAgICAg
ICAgICAgICAgIGNvbXBhcmVCeTxFcGdJdGVtPiB7IGl0LnN0YXJ0VGltZXN0YW1wID86IExvbmcu
TUFYX1ZBTFVFIH0KICAgICAgICAgICAgICAgICAgICAudGhlbkJ5IHsgaXQuZW5kVGltZXN0YW1w
ID86IExvbmcuTUFYX1ZBTFVFIH0KICAgICAgICAgICAgKQogICAgICAgIH0gZWxzZSB7CiAgICAg
ICAgICAgIGRlZHVwZWQKICAgICAgICB9CgogICAgICAgIHZhbCBub3cgPSBTeXN0ZW0uY3VycmVu
dFRpbWVNaWxsaXMoKSAvIDEwMDBMCgogICAgICAgIHZhbCBjdXJyZW50SW5kZXggPSBzb3J0ZWQu
aW5kZXhPZkZpcnN0IHsgaXRlbSAtPgogICAgICAgICAgICB2YWwgc3RhcnQgPSBpdGVtLnN0YXJ0
VGltZXN0YW1wCiAgICAgICAgICAgIHZhbCBlbmQgPSBpdGVtLmVuZFRpbWVzdGFtcAogICAgICAg
ICAgICBzdGFydCAhPSBudWxsICYmIGVuZCAhPSBudWxsICYmIG5vdyA+PSBzdGFydCAmJiBub3cg
PCBlbmQKICAgICAgICB9CiAgICAgICAgaWYgKGN1cnJlbnRJbmRleCA+PSAwKSB7CiAgICAgICAg
ICAgIHJldHVybiBzb3J0ZWQuZHJvcChjdXJyZW50SW5kZXgpLnRha2UobGltaXQpCiAgICAgICAg
fQoKICAgICAgICB2YWwgdXBjb21pbmdJbmRleCA9IHNvcnRlZC5pbmRleE9mRmlyc3QgeyBpdGVt
IC0+CiAgICAgICAgICAgIHZhbCBzdGFydCA9IGl0ZW0uc3RhcnRUaW1lc3RhbXAKICAgICAgICAg
ICAgc3RhcnQgIT0gbnVsbCAmJiBzdGFydCA+PSBub3cKICAgICAgICB9CiAgICAgICAgaWYgKHVw
Y29taW5nSW5kZXggPj0gMCkgewogICAgICAgICAgICByZXR1cm4gc29ydGVkLmRyb3AodXBjb21p
bmdJbmRleCkudGFrZShsaW1pdCkKICAgICAgICB9CgogICAgICAgIHJldHVybiBzb3J0ZWQudGFr
ZUxhc3QobGltaXQpCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gaGFzRnVsbEd1aWRlRGVwdGgoaXRl
bXM6IExpc3Q8RXBnSXRlbT4pOiBCb29sZWFuIHsKICAgICAgICBpZiAoaXRlbXMuaXNFbXB0eSgp
KSByZXR1cm4gZmFsc2UKCiAgICAgICAgdmFsIG5vdyA9IFN5c3RlbS5jdXJyZW50VGltZU1pbGxp
cygpIC8gMTAwMEwKICAgICAgICB2YWwgcmVsZXZhbnQgPSBpdGVtcy5maWx0ZXIgeyBpdGVtIC0+
CiAgICAgICAgICAgIHZhbCBzdGFydCA9IGl0ZW0uc3RhcnRUaW1lc3RhbXAKICAgICAgICAgICAg
dmFsIGVuZCA9IGl0ZW0uZW5kVGltZXN0YW1wCiAgICAgICAgICAgIHN0YXJ0ICE9IG51bGwgJiYK
ICAgICAgICAgICAgICAgIGVuZCAhPSBudWxsICYmCiAgICAgICAgICAgICAgICBlbmQgPj0gbm93
IC0gMiAqIDM2MDBMICYmCiAgICAgICAgICAgICAgICBzdGFydCA8PSBub3cgKyAxMiAqIDM2MDBM
CiAgICAgICAgfQoKICAgICAgICBpZiAocmVsZXZhbnQuaXNOb3RFbXB0eSgpKSB7CiAgICAgICAg
ICAgIHZhbCBlYXJsaWVzdCA9IHJlbGV2YW50Lm1pbk9mIHsgaXQuc3RhcnRUaW1lc3RhbXAgPzog
TG9uZy5NQVhfVkFMVUUgfQogICAgICAgICAgICB2YWwgbGF0ZXN0ID0gcmVsZXZhbnQubWF4T2Yg
eyBpdC5lbmRUaW1lc3RhbXAgPzogTG9uZy5NSU5fVkFMVUUgfQogICAgICAgICAgICBpZiAobGF0
ZXN0ID4gZWFybGllc3QgJiYgbGF0ZXN0IC0gZWFybGllc3QgPj0gNCAqIDM2MDBMKSByZXR1cm4g
dHJ1ZQogICAgICAgIH0KCiAgICAgICAgLy8gSWYgdGltZXN0YW1wcyBhcmUgdW5hdmFpbGFibGUg
YnV0IHRoZSBwcm92aWRlciByZXR1cm5lZCBhIHN1YnN0YW50aWFsCiAgICAgICAgLy8gc2VxdWVu
Y2Ugb2YgcHJvZ3JhbXMsIHRyZWF0IGl0IGFzIGEgZnVsbCBndWlkZSByYXRoZXIgdGhhbiBmb3Jj
aW5nCiAgICAgICAgLy8gYW5vdGhlciBlbmRwb2ludCByZXF1ZXN0LgogICAgICAgIHJldHVybiBp
dGVtcy5zaXplID49IDEyCiAgICB9CgoKCiAgICBwcml2YXRlIGZ1biBlcGdUaW1lc3RhbXBTZWNv
bmRzKG86IEpTT05PYmplY3QsIHZhcmFyZyBrZXlzOiBTdHJpbmcpOiBMb25nPyB7CiAgICAgICAg
Zm9yIChrZXkgaW4ga2V5cykgewogICAgICAgICAgICB2YWwgcmF3ID0gby5vcHQoa2V5KQogICAg
ICAgICAgICB2YWwgdmFsdWUgPSB3aGVuIChyYXcpIHsKICAgICAgICAgICAgICAgIGlzIE51bWJl
ciAtPiByYXcudG9Mb25nKCkKICAgICAgICAgICAgICAgIGlzIFN0cmluZyAtPiByYXcudHJpbSgp
LnRvTG9uZ09yTnVsbCgpCiAgICAgICAgICAgICAgICBlbHNlIC0+IG51bGwKICAgICAgICAgICAg
fSA/OiBjb250aW51ZQogICAgICAgICAgICBpZiAodmFsdWUgPD0gMEwpIGNvbnRpbnVlCiAgICAg
ICAgICAgIHJldHVybiBpZiAodmFsdWUgPiAxMDBfMDAwXzAwMF8wMDBMKSB2YWx1ZSAvIDEwMDBM
IGVsc2UgdmFsdWUKICAgICAgICB9CiAgICAgICAgcmV0dXJuIG51bGwKICAgIH0KCiAgICBwcml2
YXRlIGZ1biBkZWNvZGVFcGdUZXh0KHJhdzogU3RyaW5nLCBmYWxsYmFjazogU3RyaW5nKTogU3Ry
aW5nIHsKICAgICAgICB2YWwgdmFsdWUgPSByYXcudHJpbSgpCiAgICAgICAgaWYgKHZhbHVlLmlz
QmxhbmsoKSkgcmV0dXJuIGZhbGxiYWNrCiAgICAgICAgLy8gTWFueSBYdHJlYW0gcGFuZWxzIEJh
c2U2NC1lbmNvZGUgdGl0bGUvZGVzY3JpcHRpb24uIE9ubHkgYXR0ZW1wdCBkZWNvZGUKICAgICAg
ICAvLyB3aGVuIHRoZSB2YWx1ZSBsb29rcyBsaWtlIEJhc2U2NCBhbmQgdGhlIGRlY29kZWQgcmVz
dWx0IGlzIHJlYWRhYmxlIHRleHQuCiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA8IDggfHwgdmFs
dWUubGVuZ3RoICUgNCAhPSAwIHx8ICF2YWx1ZS5tYXRjaGVzKFJlZ2V4KCJeW0EtWmEtejAtOSsv
PV0rJCIpKSkgcmV0dXJuIHZhbHVlCiAgICAgICAgcmV0dXJuIHRyeSB7CiAgICAgICAgICAgIHZh
bCBkZWNvZGVkID0gU3RyaW5nKEJhc2U2NC5kZWNvZGUodmFsdWUsIEJhc2U2NC5ERUZBVUxUKSwg
Q2hhcnNldHMuVVRGXzgpLnRyaW0oKQogICAgICAgICAgICB2YWwgcHJpbnRhYmxlID0gZGVjb2Rl
ZC5pc05vdEJsYW5rKCkgJiYgZGVjb2RlZC5jb3VudCB7ICFpdC5pc0lTT0NvbnRyb2woKSB8fCBp
dCA9PSAnXG4nIHx8IGl0ID09ICdccicgfHwgaXQgPT0gJ1x0JyB9ID49IGRlY29kZWQubGVuZ3Ro
ICogOSAvIDEwCiAgICAgICAgICAgIGlmIChwcmludGFibGUgJiYgIWRlY29kZWQuY29udGFpbnMo
J1x1RkZGRCcpKSBkZWNvZGVkIGVsc2UgdmFsdWUKICAgICAgICB9IGNhdGNoIChfOiBFeGNlcHRp
b24pIHsKICAgICAgICAgICAgdmFsdWUKICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4g
Y2xlYW5SYXRpbmcocmF3OiBTdHJpbmcpOiBTdHJpbmcgewogICAgICAgIHZhbCB2YWx1ZSA9IHJh
dy50cmltKCkKICAgICAgICBpZiAodmFsdWUuaXNCbGFuaygpIHx8IHZhbHVlID09ICIwIiB8fCB2
YWx1ZSA9PSAiMC4wIikgcmV0dXJuICIiCiAgICAgICAgdmFsIG51bWJlciA9IHZhbHVlLnRvRG91
YmxlT3JOdWxsKCkgPzogcmV0dXJuIHZhbHVlLnRha2UoNCkKICAgICAgICByZXR1cm4gaWYgKG51
bWJlciA+IDUuMCkgU3RyaW5nLmZvcm1hdChMb2NhbGUuVVMsICIlLjFmIiwgbnVtYmVyLmNvZXJj
ZUF0TW9zdCgxMC4wKSkKICAgICAgICBlbHNlIFN0cmluZy5mb3JtYXQoTG9jYWxlLlVTLCAiJS4x
ZiIsIG51bWJlcikKICAgIH0KCiAgICBmdW4gc3RyZWFtVXJsKGM6IFh0cmVhbUNyZWRlbnRpYWxz
LCBzdHJlYW06IExpdmVTdHJlYW0pOiBTdHJpbmcgewogICAgICAgIGlmIChEZW1vQ2F0YWxvZy5p
c0RlbW8oYykpIHJldHVybiBEZW1vQ2F0YWxvZy5zdHJlYW1Vcmwoc3RyZWFtKQogICAgICAgIHZh
bCBleHQgPSBpZiAoc3RyZWFtLmV4dGVuc2lvbi5pc0JsYW5rKCkpICJ0cyIgZWxzZSBzdHJlYW0u
ZXh0ZW5zaW9uCiAgICAgICAgcmV0dXJuICIke2Jhc2UoYy5zZXJ2ZXIpfS9saXZlLyR7ZW5jKGMu
dXNlcm5hbWUpfS8ke2VuYyhjLnBhc3N3b3JkKX0vJHtzdHJlYW0uaWR9LiRleHQiCiAgICB9Cn0K
:::END XTREAM
:::BEGIN GUIDE
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkludGVudAppbXBvcnQgYW5kcm9pZC5jb250ZW50LnJlcy5Db25maWd1cmF0aW9uCmltcG9ydCBh
bmRyb2lkLmdyYXBoaWNzLkNvbG9yCmltcG9ydCBhbmRyb2lkLm9zLkJ1bmRsZQppbXBvcnQgYW5k
cm9pZC5vcy5IYW5kbGVyCmltcG9ydCBhbmRyb2lkLm9zLkxvb3BlcgppbXBvcnQgYW5kcm9pZC52
aWV3LkdyYXZpdHkKaW1wb3J0IGFuZHJvaWQudmlldy5WaWV3CmltcG9ydCBhbmRyb2lkLndpZGdl
dC5CdXR0b24KaW1wb3J0IGFuZHJvaWQud2lkZ2V0LkZyYW1lTGF5b3V0CmltcG9ydCBhbmRyb2lk
LndpZGdldC5Ib3Jpem9udGFsU2Nyb2xsVmlldwppbXBvcnQgYW5kcm9pZC53aWRnZXQuTGlzdFZp
ZXcKaW1wb3J0IGFuZHJvaWQud2lkZ2V0LlByb2dyZXNzQmFyCmltcG9ydCBhbmRyb2lkLndpZGdl
dC5UZXh0VmlldwppbXBvcnQgYW5kcm9pZC53aWRnZXQuVG9hc3QKaW1wb3J0IGFuZHJvaWR4LmFw
cGNvbXBhdC5hcHAuQXBwQ29tcGF0QWN0aXZpdHkKaW1wb3J0IGphdmEudGV4dC5TaW1wbGVEYXRl
Rm9ybWF0CmltcG9ydCBqYXZhLnV0aWwuRGF0ZQppbXBvcnQgamF2YS51dGlsLkxvY2FsZQppbXBv
cnQgamF2YS51dGlsLmNvbmN1cnJlbnQuQ29uY3VycmVudEhhc2hNYXAKaW1wb3J0IGphdmEudXRp
bC5jb25jdXJyZW50LkV4ZWN1dG9ycwoKY2xhc3MgR3VpZGVBY3Rpdml0eSA6IEFwcENvbXBhdEFj
dGl2aXR5KCkgewogICAgcHJpdmF0ZSBsYXRlaW5pdCB2YXIgY3JlZGVudGlhbHM6IFh0cmVhbUNy
ZWRlbnRpYWxzCiAgICBwcml2YXRlIGxhdGVpbml0IHZhciBsaXN0OiBMaXN0VmlldwogICAgcHJp
dmF0ZSBsYXRlaW5pdCB2YXIgcHJvZ3Jlc3M6IFByb2dyZXNzQmFyCiAgICBwcml2YXRlIGxhdGVp
bml0IHZhciBlbXB0eTogVGV4dFZpZXcKICAgIHByaXZhdGUgbGF0ZWluaXQgdmFyIHRpbWVTY3Jv
bGw6IEhvcml6b250YWxTY3JvbGxWaWV3CiAgICBwcml2YXRlIGxhdGVpbml0IHZhciB0aW1lQmFy
OiBGcmFtZUxheW91dAogICAgcHJpdmF0ZSBsYXRlaW5pdCB2YXIgZGV0YWlsVGl0bGU6IFRleHRW
aWV3CiAgICBwcml2YXRlIGxhdGVpbml0IHZhciBkZXRhaWxNZXRhOiBUZXh0VmlldwogICAgcHJp
dmF0ZSBsYXRlaW5pdCB2YXIgZGV0YWlsRGVzY3JpcHRpb246IFRleHRWaWV3CiAgICBwcml2YXRl
IGxhdGVpbml0IHZhciBkZXRhaWxQcm9ncmVzczogUHJvZ3Jlc3NCYXIKICAgIHByaXZhdGUgbGF0
ZWluaXQgdmFyIGRldGFpbFByb2dyZXNzTGFiZWw6IFRleHRWaWV3CiAgICBwcml2YXRlIGxhdGVp
bml0IHZhciB3YXRjaEJ1dHRvbjogQnV0dG9uCiAgICBwcml2YXRlIGxhdGVpbml0IHZhciBndWlk
ZU5vd0J1dHRvbjogQnV0dG9uCiAgICBwcml2YXRlIGxhdGVpbml0IHZhciBndWlkZUNsb2NrOiBU
ZXh0VmlldwogICAgcHJpdmF0ZSBsYXRlaW5pdCB2YXIgZ3VpZGVEYXRlOiBUZXh0VmlldwogICAg
cHJpdmF0ZSBsYXRlaW5pdCB2YXIgZ3VpZGVDaGFubmVsQ291bnQ6IFRleHRWaWV3CgogICAgcHJp
dmF0ZSB2YWwgZXhlY3V0b3IgPSBFeGVjdXRvcnMubmV3U2luZ2xlVGhyZWFkRXhlY3V0b3IoKQog
ICAgcHJpdmF0ZSB2YWwgZXBnRXhlY3V0b3IgPSBFeGVjdXRvcnMubmV3Rml4ZWRUaHJlYWRQb29s
KDYpCiAgICBwcml2YXRlIHZhbCBndWlkZXMgPSBDb25jdXJyZW50SGFzaE1hcDxJbnQsIExpc3Q8
RXBnSXRlbT4+KCkKICAgIHByaXZhdGUgdmFsIHJlcXVlc3RlZCA9IENvbmN1cnJlbnRIYXNoTWFw
Lm5ld0tleVNldDxJbnQ+KCkKICAgIHByaXZhdGUgdmFsIHVpSGFuZGxlciA9IEhhbmRsZXIoTG9v
cGVyLmdldE1haW5Mb29wZXIoKSkKCiAgICBwcml2YXRlIHZhciBjaGFubmVsczogTGlzdDxMaXZl
U3RyZWFtPiA9IGVtcHR5TGlzdCgpCiAgICBwcml2YXRlIHZhciBhZGFwdGVyOiBFcGdHdWlkZUFk
YXB0ZXI/ID0gbnVsbAogICAgcHJpdmF0ZSB2YXIgY2F0ZWdvcnlJZDogU3RyaW5nID0gIiIKICAg
IHByaXZhdGUgdmFyIGdlbmVyYXRpb24gPSAwCiAgICBwcml2YXRlIHZhciBzZWxlY3RlZENoYW5u
ZWw6IExpdmVTdHJlYW0/ID0gbnVsbAogICAgcHJpdmF0ZSB2YXIgc2VsZWN0ZWRJdGVtOiBFcGdJ
dGVtPyA9IG51bGwKICAgIHByaXZhdGUgdmFyIHNlbGVjdGVkU3RhcnRNczogTG9uZyA9IDBMCiAg
ICBwcml2YXRlIHZhciBzZWxlY3RlZEVuZE1zOiBMb25nID0gMEwKICAgIHByaXZhdGUgdmFyIG5v
d01hcmtlcjogVmlldz8gPSBudWxsCiAgICBwcml2YXRlIHZhciBub3dMYWJlbDogVGV4dFZpZXc/
ID0gbnVsbAoKICAgIHByaXZhdGUgdmFsIHNsb3RNcyA9IDMwICogNjBfMDAwTAogICAgcHJpdmF0
ZSB2YWwgdGltZWxpbmVTdGFydE1zOiBMb25nIGJ5IGxhenkgewogICAgICAgIHZhbCBub3cgPSBT
eXN0ZW0uY3VycmVudFRpbWVNaWxsaXMoKQogICAgICAgIC8vIEJlZ2luIGF0IHRoZSBjdXJyZW50
IGhhbGYtaG91ci4gVGhlIHByZXZpb3VzIGltcGxlbWVudGF0aW9uIGJlZ2FuCiAgICAgICAgLy8g
b25lIHNsb3QgZWFybGllciBhbmQgdGhlbiBzY3JvbGxlZCBldmVyeSByb3cgcGFzdCB0aGUgbGVm
dC1hbGlnbmVkCiAgICAgICAgLy8gdGl0bGUsIGxlYXZpbmcgYSB2aXNpYmxlIHByb2dyYW0gYm94
IHdpdGggaXRzIHRleHQgb2ZmLXNjcmVlbi4KICAgICAgICAobm93IC8gc2xvdE1zKSAqIHNsb3RN
cwogICAgfQogICAgcHJpdmF0ZSB2YWwgdGltZWxpbmVFbmRNczogTG9uZyBieSBsYXp5IHsgdGlt
ZWxpbmVTdGFydE1zICsgOCAqIDYwICogNjBfMDAwTCB9CiAgICBwcml2YXRlIHZhbCBwaXhlbHNQ
ZXJNaW51dGVEcCA9IDUKCiAgICBwcml2YXRlIHZhbCBjbG9ja1RpY2tlciA9IG9iamVjdCA6IFJ1
bm5hYmxlIHsKICAgICAgICBvdmVycmlkZSBmdW4gcnVuKCkgewogICAgICAgICAgICB1cGRhdGVI
ZWFkZXJDbG9jaygpCiAgICAgICAgICAgIHJlZnJlc2hTZWxlY3RlZFByb2dyYW0oKQogICAgICAg
ICAgICB1cGRhdGVOb3dQb3NpdGlvbihqdW1wID0gZmFsc2UpCiAgICAgICAgICAgIHVpSGFuZGxl
ci5wb3N0RGVsYXllZCh0aGlzLCAzMF8wMDBMKQogICAgICAgIH0KICAgIH0KCiAgICBvdmVycmlk
ZSBmdW4gb25DcmVhdGUoc2F2ZWRJbnN0YW5jZVN0YXRlOiBCdW5kbGU/KSB7CiAgICAgICAgc3Vw
ZXIub25DcmVhdGUoc2F2ZWRJbnN0YW5jZVN0YXRlKQogICAgICAgIHNldENvbnRlbnRWaWV3KFIu
bGF5b3V0LmFjdGl2aXR5X2d1aWRlKQoKICAgICAgICBjcmVkZW50aWFscyA9IFNlc3Npb24ubG9h
ZCh0aGlzKSA/OiBydW4gewogICAgICAgICAgICBzdGFydEFjdGl2aXR5KEludGVudCh0aGlzLCBM
b2dpbkFjdGl2aXR5OjpjbGFzcy5qYXZhKSkKICAgICAgICAgICAgZmluaXNoKCkKICAgICAgICAg
ICAgcmV0dXJuCiAgICAgICAgfQogICAgICAgIGNhdGVnb3J5SWQgPSBpbnRlbnQuZ2V0U3RyaW5n
RXh0cmEoImNhdGVnb3J5SWQiKSA/OiAiIgoKICAgICAgICBsaXN0ID0gZmluZFZpZXdCeUlkKFIu
aWQuZ3VpZGVMaXN0KQogICAgICAgIHByb2dyZXNzID0gZmluZFZpZXdCeUlkKFIuaWQuZ3VpZGVQ
cm9ncmVzcykKICAgICAgICBlbXB0eSA9IGZpbmRWaWV3QnlJZChSLmlkLmd1aWRlRW1wdHkpCiAg
ICAgICAgdGltZVNjcm9sbCA9IGZpbmRWaWV3QnlJZChSLmlkLnRpbWVTY3JvbGwpCiAgICAgICAg
dGltZUJhciA9IGZpbmRWaWV3QnlJZChSLmlkLnRpbWVCYXIpCiAgICAgICAgZGV0YWlsVGl0bGUg
PSBmaW5kVmlld0J5SWQoUi5pZC5ndWlkZURldGFpbFRpdGxlKQogICAgICAgIGRldGFpbE1ldGEg
PSBmaW5kVmlld0J5SWQoUi5pZC5ndWlkZURldGFpbE1ldGEpCiAgICAgICAgZGV0YWlsRGVzY3Jp
cHRpb24gPSBmaW5kVmlld0J5SWQoUi5pZC5ndWlkZURldGFpbERlc2NyaXB0aW9uKQogICAgICAg
IGRldGFpbFByb2dyZXNzID0gZmluZFZpZXdCeUlkKFIuaWQuZ3VpZGVEZXRhaWxQcm9ncmVzcykK
ICAgICAgICBkZXRhaWxQcm9ncmVzc0xhYmVsID0gZmluZFZpZXdCeUlkKFIuaWQuZ3VpZGVQcm9n
cmVzc0xhYmVsKQogICAgICAgIHdhdGNoQnV0dG9uID0gZmluZFZpZXdCeUlkKFIuaWQuZ3VpZGVX
YXRjaEJ1dHRvbikKICAgICAgICBndWlkZU5vd0J1dHRvbiA9IGZpbmRWaWV3QnlJZChSLmlkLmd1
aWRlTm93QnV0dG9uKQogICAgICAgIGd1aWRlQ2xvY2sgPSBmaW5kVmlld0J5SWQoUi5pZC5ndWlk
ZUNsb2NrKQogICAgICAgIGd1aWRlRGF0ZSA9IGZpbmRWaWV3QnlJZChSLmlkLmd1aWRlRGF0ZSkK
ICAgICAgICBndWlkZUNoYW5uZWxDb3VudCA9IGZpbmRWaWV3QnlJZChSLmlkLmd1aWRlQ2hhbm5l
bENvdW50KQoKICAgICAgICBmaW5kVmlld0J5SWQ8QnV0dG9uPihSLmlkLmd1aWRlSG9tZUJ1dHRv
bikuc2V0T25DbGlja0xpc3RlbmVyIHsgZmluaXNoKCkgfQogICAgICAgIGd1aWRlTm93QnV0dG9u
LnNldE9uQ2xpY2tMaXN0ZW5lciB7IGp1bXBUb05vdygpIH0KCiAgICAgICAgd2F0Y2hCdXR0b24u
aXNFbmFibGVkID0gZmFsc2UKICAgICAgICB3YXRjaEJ1dHRvbi5hbHBoYSA9IDAuNTVmCiAgICAg
ICAgd2F0Y2hCdXR0b24uc2V0T25DbGlja0xpc3RlbmVyIHsgc2VsZWN0ZWRDaGFubmVsPy5sZXQg
eyBvcGVuQ2hhbm5lbChpdCkgfSB9CgogICAgICAgIGRldGFpbFRpdGxlLmFwcGx5IHsKICAgICAg
ICAgICAgdGV4dCA9ICJUViBHdWlkZSIKICAgICAgICAgICAgdGV4dFNpemUgPSAyMGYKICAgICAg
ICAgICAgbWF4TGluZXMgPSAyCiAgICAgICAgICAgIHNldFR5cGVmYWNlKHR5cGVmYWNlLCBhbmRy
b2lkLmdyYXBoaWNzLlR5cGVmYWNlLkJPTEQpCiAgICAgICAgICAgIHNldFRleHRDb2xvcihnZXRD
b2xvcihSLmNvbG9yLmtzX3doaXRlKSkKICAgICAgICB9CiAgICAgICAgZGV0YWlsTWV0YS5hcHBs
eSB7CiAgICAgICAgICAgIHRleHQgPSAiU0VMRUNUIEEgUFJPR1JBTSIKICAgICAgICAgICAgdGV4
dFNpemUgPSAxMmYKICAgICAgICAgICAgbWF4TGluZXMgPSAyCiAgICAgICAgICAgIHNldFR5cGVm
YWNlKHR5cGVmYWNlLCBhbmRyb2lkLmdyYXBoaWNzLlR5cGVmYWNlLkJPTEQpCiAgICAgICAgICAg
IHNldFRleHRDb2xvcihnZXRDb2xvcihSLmNvbG9yLmtzX3JlZCkpCiAgICAgICAgfQogICAgICAg
IGRldGFpbERlc2NyaXB0aW9uLmFwcGx5IHsKICAgICAgICAgICAgdGV4dCA9ICJDaG9vc2UgYSBw
cm9ncmFtIGNhcmQgdG8gc2VlIGl0cyBjaGFubmVsLCBhaXJ0aW1lLCBkZXNjcmlwdGlvbiwgYW5k
IGxpdmUgcHJvZ3Jlc3MuIgogICAgICAgICAgICB0ZXh0U2l6ZSA9IDE0ZgogICAgICAgICAgICBt
YXhMaW5lcyA9IDMKICAgICAgICAgICAgc2V0TGluZVNwYWNpbmcoMi5kcC50b0Zsb2F0KCksIDFm
KQogICAgICAgICAgICBzZXRUZXh0Q29sb3IoZ2V0Q29sb3IoUi5jb2xvci5rc19tdXRlZCkpCiAg
ICAgICAgfQogICAgICAgIGRldGFpbFByb2dyZXNzTGFiZWwuYXBwbHkgewogICAgICAgICAgICB0
ZXh0U2l6ZSA9IDEyZgogICAgICAgICAgICBzZXRUZXh0Q29sb3IoZ2V0Q29sb3IoUi5jb2xvci5r
c19tdXRlZCkpCiAgICAgICAgfQogICAgICAgIGRldGFpbFByb2dyZXNzLnByb2dyZXNzID0gMAog
ICAgICAgIGRldGFpbFByb2dyZXNzTGFiZWwudGV4dCA9ICJQcm9ncmFtIGRldGFpbHMgd2lsbCBh
cHBlYXIgaGVyZSIKICAgICAgICB1cGRhdGVIZWFkZXJDbG9jaygpCiAgICAgICAgYnVpbGRUaW1l
QmFyKCkKICAgICAgICBsb2FkQ2hhbm5lbHMoKQogICAgfQoKICAgIG92ZXJyaWRlIGZ1biBvblJl
c3VtZSgpIHsKICAgICAgICBzdXBlci5vblJlc3VtZSgpCiAgICAgICAgdWlIYW5kbGVyLnJlbW92
ZUNhbGxiYWNrcyhjbG9ja1RpY2tlcikKICAgICAgICB1aUhhbmRsZXIucG9zdChjbG9ja1RpY2tl
cikKICAgIH0KCiAgICBvdmVycmlkZSBmdW4gb25QYXVzZSgpIHsKICAgICAgICB1aUhhbmRsZXIu
cmVtb3ZlQ2FsbGJhY2tzKGNsb2NrVGlja2VyKQogICAgICAgIHN1cGVyLm9uUGF1c2UoKQogICAg
fQoKICAgIHByaXZhdGUgZnVuIGxvYWRDaGFubmVscygpIHsKICAgICAgICB2YWwgdGhpc0dlbmVy
YXRpb24gPSArK2dlbmVyYXRpb24KICAgICAgICBwcm9ncmVzcy52aXNpYmlsaXR5ID0gVmlldy5W
SVNJQkxFCiAgICAgICAgZW1wdHkudmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgICAgIGxpc3Qu
dmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgICAgIGV4ZWN1dG9yLmV4ZWN1dGUgewogICAgICAg
ICAgICB0cnkgewogICAgICAgICAgICAgICAgdmFsIGxvYWRlZCA9IFh0cmVhbUNsaWVudC5saXZl
U3RyZWFtcyhjcmVkZW50aWFscywgY2F0ZWdvcnlJZCkKICAgICAgICAgICAgICAgIGlmICh0aGlz
R2VuZXJhdGlvbiAhPSBnZW5lcmF0aW9uKSByZXR1cm5AZXhlY3V0ZQoKICAgICAgICAgICAgICAg
IHZhbCB4bWxDaGFubmVsSWRzID0gbG9hZGVkCiAgICAgICAgICAgICAgICAgICAgLm1hcCB7IGl0
LmVwZ0NoYW5uZWxJZCB9CiAgICAgICAgICAgICAgICAgICAgLmZpbHRlciB7IGl0LmlzTm90Qmxh
bmsoKSB9CiAgICAgICAgICAgICAgICAgICAgLnRvU2V0KCkKCiAgICAgICAgICAgICAgICB2YWwg
eG1sR3VpZGUgPSBpZiAoeG1sQ2hhbm5lbElkcy5pc05vdEVtcHR5KCkpIHsKICAgICAgICAgICAg
ICAgICAgICBydW5DYXRjaGluZyB7CiAgICAgICAgICAgICAgICAgICAgICAgIFh0cmVhbUNsaWVu
dC54bWxUdkd1aWRlKAogICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlZGVudGlhbHMsCiAg
ICAgICAgICAgICAgICAgICAgICAgICAgICB4bWxDaGFubmVsSWRzLAogICAgICAgICAgICAgICAg
ICAgICAgICAgICAgdGltZWxpbmVTdGFydE1zLAogICAgICAgICAgICAgICAgICAgICAgICAgICAg
dGltZWxpbmVFbmRNcwogICAgICAgICAgICAgICAgICAgICAgICApCiAgICAgICAgICAgICAgICAg
ICAgfS5nZXRPckRlZmF1bHQoZW1wdHlNYXAoKSkKICAgICAgICAgICAgICAgIH0gZWxzZSB7CiAg
ICAgICAgICAgICAgICAgICAgZW1wdHlNYXAoKQogICAgICAgICAgICAgICAgfQoKICAgICAgICAg
ICAgICAgIGlmICh0aGlzR2VuZXJhdGlvbiAhPSBnZW5lcmF0aW9uKSByZXR1cm5AZXhlY3V0ZQog
ICAgICAgICAgICAgICAgY2hhbm5lbHMgPSBsb2FkZWQKCiAgICAgICAgICAgICAgICBndWlkZXMu
Y2xlYXIoKQogICAgICAgICAgICAgICAgcmVxdWVzdGVkLmNsZWFyKCkKICAgICAgICAgICAgICAg
IGxvYWRlZC5mb3JFYWNoIHsgY2hhbm5lbCAtPgogICAgICAgICAgICAgICAgICAgIHZhbCBrZXkg
PSBjaGFubmVsLmVwZ0NoYW5uZWxJZC50cmltKCkubG93ZXJjYXNlKExvY2FsZS5VUykKICAgICAg
ICAgICAgICAgICAgICB2YWwgaXRlbXMgPSB4bWxHdWlkZVtrZXldLm9yRW1wdHkoKQogICAgICAg
ICAgICAgICAgICAgIGlmIChoYXNVc2FibGVHdWlkZShpdGVtcykpIHsKICAgICAgICAgICAgICAg
ICAgICAgICAgZ3VpZGVzW2NoYW5uZWwuaWRdID0gaXRlbXMKICAgICAgICAgICAgICAgICAgICAg
ICAgcmVxdWVzdGVkLmFkZChjaGFubmVsLmlkKQogICAgICAgICAgICAgICAgICAgIH0KICAgICAg
ICAgICAgICAgIH0KCiAgICAgICAgICAgICAgICBydW5PblVpVGhyZWFkIHsKICAgICAgICAgICAg
ICAgICAgICBpZiAoY2hhbm5lbHMuaXNFbXB0eSgpKSB7CiAgICAgICAgICAgICAgICAgICAgICAg
IHByb2dyZXNzLnZpc2liaWxpdHkgPSBWaWV3LkdPTkUKICAgICAgICAgICAgICAgICAgICAgICAg
ZW1wdHkudGV4dCA9ICJObyBjaGFubmVscyBhcmUgYXZhaWxhYmxlIGZvciB0aGlzIGd1aWRlLiIK
ICAgICAgICAgICAgICAgICAgICAgICAgZW1wdHkudmlzaWJpbGl0eSA9IFZpZXcuVklTSUJMRQog
ICAgICAgICAgICAgICAgICAgICAgICBndWlkZUNoYW5uZWxDb3VudC50ZXh0ID0gIjAgQ0hBTk5F
TFMiCiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybkBydW5PblVpVGhyZWFkCiAgICAgICAg
ICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIGNyZWF0ZUFkYXB0ZXIodGhpc0dlbmVy
YXRpb24pCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0gY2F0Y2ggKGU6IEV4Y2VwdGlv
bikgewogICAgICAgICAgICAgICAgcnVuT25VaVRocmVhZCB7CiAgICAgICAgICAgICAgICAgICAg
cHJvZ3Jlc3MudmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgICAgICAgICAgICAgICAgIGVtcHR5
LnRleHQgPSBlLm1lc3NhZ2UgPzogIlVuYWJsZSB0byBsb2FkIFRWIGd1aWRlIGNoYW5uZWxzLiIK
ICAgICAgICAgICAgICAgICAgICBlbXB0eS52aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFCiAgICAg
ICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBm
dW4gY3JlYXRlQWRhcHRlcih0aGlzR2VuZXJhdGlvbjogSW50KSB7CiAgICAgICAgdmFsIGNoYW5u
ZWxXaWR0aCA9IGlmIChyZXNvdXJjZXMuY29uZmlndXJhdGlvbi5vcmllbnRhdGlvbiA9PSBDb25m
aWd1cmF0aW9uLk9SSUVOVEFUSU9OX0xBTkRTQ0FQRSkgMjI0IGVsc2UgMTM4CiAgICAgICAgZ3Vp
ZGVDaGFubmVsQ291bnQudGV4dCA9ICIke2NoYW5uZWxzLnNpemV9IENIQU5ORUxTIgogICAgICAg
IGFkYXB0ZXIgPSBFcGdHdWlkZUFkYXB0ZXIoCiAgICAgICAgICAgIHJvd0NvbnRleHQgPSB0aGlz
LAogICAgICAgICAgICBjaGFubmVscyA9IGNoYW5uZWxzLAogICAgICAgICAgICBndWlkZVByb3Zp
ZGVyID0geyBndWlkZXNbaXQuaWRdIH0sCiAgICAgICAgICAgIHRpbWVsaW5lU3RhcnRNcyA9IHRp
bWVsaW5lU3RhcnRNcywKICAgICAgICAgICAgdGltZWxpbmVFbmRNcyA9IHRpbWVsaW5lRW5kTXMs
CiAgICAgICAgICAgIHBpeGVsc1Blck1pbnV0ZURwID0gcGl4ZWxzUGVyTWludXRlRHAsCiAgICAg
ICAgICAgIGNoYW5uZWxXaWR0aERwID0gY2hhbm5lbFdpZHRoLAogICAgICAgICAgICBvblByb2dy
YW1Gb2N1c2VkID0geyBjaGFubmVsLCBpdGVtLCBzdGFydCwgZW5kLCBjdXJyZW50IC0+IHNlbGVj
dFByb2dyYW0oY2hhbm5lbCwgaXRlbSwgc3RhcnQsIGVuZCwgY3VycmVudCkgfSwKICAgICAgICAg
ICAgb25Qcm9ncmFtQ2xpY2tlZCA9IHsgY2hhbm5lbCwgaXRlbSwgc3RhcnQsIGVuZCwgY3VycmVu
dCAtPgogICAgICAgICAgICAgICAgc2VsZWN0UHJvZ3JhbShjaGFubmVsLCBpdGVtLCBzdGFydCwg
ZW5kLCBjdXJyZW50KQogICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQpIG9wZW5DaGFubmVsKGNo
YW5uZWwpCiAgICAgICAgICAgICAgICBlbHNlIFRvYXN0Lm1ha2VUZXh0KHRoaXMsICIke2l0ZW0u
dGl0bGV9IHN0YXJ0cyAke2Zvcm1hdFRpbWUoc3RhcnQpfSIsIFRvYXN0LkxFTkdUSF9TSE9SVCku
c2hvdygpCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIG9uSG9yaXpvbnRhbENoYW5nZWQgPSB7
IHggLT4gaWYgKHRpbWVTY3JvbGwuc2Nyb2xsWCAhPSB4KSB0aW1lU2Nyb2xsLnNjcm9sbFRvKHgs
IDApIH0KICAgICAgICApCiAgICAgICAgbGlzdC5hZGFwdGVyID0gYWRhcHRlcgogICAgICAgIGxp
c3QuaXRlbXNDYW5Gb2N1cyA9IHRydWUKICAgICAgICBsaXN0LnZpc2liaWxpdHkgPSBWaWV3LlZJ
U0lCTEUKICAgICAgICBwcm9ncmVzcy52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAgICAgICAgbGlz
dC5zZXRPblNjcm9sbExpc3RlbmVyKG9iamVjdCA6IGFuZHJvaWQud2lkZ2V0LkFic0xpc3RWaWV3
Lk9uU2Nyb2xsTGlzdGVuZXIgewogICAgICAgICAgICBvdmVycmlkZSBmdW4gb25TY3JvbGxTdGF0
ZUNoYW5nZWQodmlldzogYW5kcm9pZC53aWRnZXQuQWJzTGlzdFZpZXc/LCBzY3JvbGxTdGF0ZTog
SW50KSA9IFVuaXQKICAgICAgICAgICAgb3ZlcnJpZGUgZnVuIG9uU2Nyb2xsKHZpZXc6IGFuZHJv
aWQud2lkZ2V0LkFic0xpc3RWaWV3PywgZmlyc3RWaXNpYmxlSXRlbTogSW50LCB2aXNpYmxlSXRl
bUNvdW50OiBJbnQsIHRvdGFsSXRlbUNvdW50OiBJbnQpIHsKICAgICAgICAgICAgICAgIGlmICh2
aXNpYmxlSXRlbUNvdW50ID4gMCkgcmVxdWVzdEd1aWRlUmFuZ2UoZmlyc3RWaXNpYmxlSXRlbSwg
dmlzaWJsZUl0ZW1Db3VudCArIDYsIHRoaXNHZW5lcmF0aW9uKQogICAgICAgICAgICB9CiAgICAg
ICAgfSkKICAgICAgICB0aW1lU2Nyb2xsLnNldE9uU2Nyb2xsQ2hhbmdlTGlzdGVuZXIgeyBfLCB4
LCBfLCBfLCBfIC0+IGFkYXB0ZXI/LnNldEdsb2JhbFNjcm9sbFgoeCkgfQogICAgICAgIHJlcXVl
c3RHdWlkZVJhbmdlKDAsIG1pbk9mKDE4LCBjaGFubmVscy5zaXplKSwgdGhpc0dlbmVyYXRpb24p
CiAgICAgICAgbGlzdC5wb3N0IHsKICAgICAgICAgICAganVtcFRvTm93KCkKICAgICAgICAgICAg
c2VsZWN0Rmlyc3RDdXJyZW50UHJvZ3JhbSgpCiAgICAgICAgICAgIGxpc3QucmVxdWVzdEZvY3Vz
KCkKICAgICAgICAgICAgbGlzdC5zZXRTZWxlY3Rpb24oMCkKICAgICAgICB9CiAgICB9CgogICAg
LyoqCiAgICAgKiBYTUxUViByZW1haW5zIHRoZSBwcmVmZXJyZWQgc291cmNlLiBTb21lIGNoYW5u
ZWxzIGluIHRoaXMgcHJvdmlkZXIncwogICAgICogNywwMDArIGNoYW5uZWwgbGlzdCBkbyBub3Qg
aGF2ZSBhIHVzYWJsZSBYTUxUViBtYXRjaCwgc28gZmV0Y2ggdGhlIGZ1bGwKICAgICAqIHBlci1j
aGFubmVsIHRhYmxlIG9uY2UgZm9yIG9ubHkgdGhlIHZpc2libGUgbWlzc2luZyByb3dzLiBBIGNv
bXBsZXRlZAogICAgICogcmVzdWx0IGlzIGNhY2hlZCBhbmQgaXMgbmV2ZXIgY2xlYXJlZCBvciBy
ZXBsYWNlZCBkdXJpbmcgc2Nyb2xsaW5nLgogICAgICovCiAgICBwcml2YXRlIGZ1biByZXF1ZXN0
R3VpZGVSYW5nZShmaXJzdDogSW50LCBjb3VudDogSW50LCB0aGlzR2VuZXJhdGlvbjogSW50KSB7
CiAgICAgICAgaWYgKHRoaXNHZW5lcmF0aW9uICE9IGdlbmVyYXRpb24pIHJldHVybgogICAgICAg
IHZhbCBzdGFydCA9IGZpcnN0LmNvZXJjZUF0TGVhc3QoMCkKICAgICAgICB2YWwgZW5kID0gKHN0
YXJ0ICsgY291bnQpLmNvZXJjZUF0TW9zdChjaGFubmVscy5zaXplKQogICAgICAgIGZvciAoaSBp
biBzdGFydCB1bnRpbCBlbmQpIHsKICAgICAgICAgICAgdmFsIGNoYW5uZWwgPSBjaGFubmVscy5n
ZXRPck51bGwoaSkgPzogY29udGludWUKICAgICAgICAgICAgaWYgKCFyZXF1ZXN0ZWQuYWRkKGNo
YW5uZWwuaWQpKSBjb250aW51ZQogICAgICAgICAgICBlcGdFeGVjdXRvci5leGVjdXRlIHsKICAg
ICAgICAgICAgICAgIHZhbCBmZXRjaGVkID0gcnVuQ2F0Y2hpbmcgewogICAgICAgICAgICAgICAg
ICAgIFh0cmVhbUNsaWVudC5ndWlkZUVwZyhjcmVkZW50aWFscywgY2hhbm5lbC5pZCwgOTYpCiAg
ICAgICAgICAgICAgICB9LmdldE9yRGVmYXVsdChlbXB0eUxpc3QoKSkKICAgICAgICAgICAgICAg
IGlmICh0aGlzR2VuZXJhdGlvbiAhPSBnZW5lcmF0aW9uKSByZXR1cm5AZXhlY3V0ZQoKICAgICAg
ICAgICAgICAgIGd1aWRlc1tjaGFubmVsLmlkXSA9IGlmIChoYXNVc2FibGVHdWlkZShmZXRjaGVk
KSkgZmV0Y2hlZCBlbHNlIGVtcHR5TGlzdCgpCiAgICAgICAgICAgICAgICBydW5PblVpVGhyZWFk
IHsKICAgICAgICAgICAgICAgICAgICBpZiAodGhpc0dlbmVyYXRpb24gPT0gZ2VuZXJhdGlvbikg
ewogICAgICAgICAgICAgICAgICAgICAgICBhZGFwdGVyPy5ub3RpZnlEYXRhU2V0Q2hhbmdlZCgp
CiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdEZpcnN0Q3VycmVudFByb2dyYW0oKQogICAg
ICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgfQogICAgICAg
IH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biBoYXNVc2FibGVHdWlkZShpdGVtczogTGlzdDxFcGdJ
dGVtPik6IEJvb2xlYW4gewogICAgICAgIHJldHVybiBpdGVtcy5hbnkgeyBpdGVtIC0+CiAgICAg
ICAgICAgIHZhbCBzdGFydCA9IGl0ZW0uc3RhcnRUaW1lc3RhbXA/LnRpbWVzKDEwMDBMKQogICAg
ICAgICAgICB2YWwgZW5kID0gaXRlbS5lbmRUaW1lc3RhbXA/LnRpbWVzKDEwMDBMKQogICAgICAg
ICAgICBzdGFydCAhPSBudWxsICYmIGVuZCAhPSBudWxsICYmIGVuZCA+IHRpbWVsaW5lU3RhcnRN
cyAmJiBzdGFydCA8IHRpbWVsaW5lRW5kTXMKICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBm
dW4gYnVpbGRUaW1lQmFyKCkgewogICAgICAgIHRpbWVCYXIucmVtb3ZlQWxsVmlld3MoKQogICAg
ICAgIHZhbCB0b3RhbE1pbnV0ZXMgPSAoKHRpbWVsaW5lRW5kTXMgLSB0aW1lbGluZVN0YXJ0TXMp
IC8gNjBfMDAwTCkudG9JbnQoKQogICAgICAgIHZhbCB3aWR0aFB4ID0gKHRvdGFsTWludXRlcyAq
IHBpeGVsc1Blck1pbnV0ZURwKS5kcAogICAgICAgIHRpbWVCYXIubGF5b3V0UGFyYW1zID0gdGlt
ZUJhci5sYXlvdXRQYXJhbXMuYXBwbHkgeyB3aWR0aCA9IHdpZHRoUHggfQoKICAgICAgICB2YXIg
dCA9IHRpbWVsaW5lU3RhcnRNcwogICAgICAgIHZhciBzbG90SW5kZXggPSAwCiAgICAgICAgd2hp
bGUgKHQgPCB0aW1lbGluZUVuZE1zKSB7CiAgICAgICAgICAgIHZhbCBsZWZ0TWludXRlcyA9ICgo
dCAtIHRpbWVsaW5lU3RhcnRNcykgLyA2MF8wMDBMKS50b0ludCgpCiAgICAgICAgICAgIHZhbCBs
YWJlbCA9IFRleHRWaWV3KHRoaXMpLmFwcGx5IHsKICAgICAgICAgICAgICAgIHRleHQgPSBmb3Jt
YXRUaW1lKHQpCiAgICAgICAgICAgICAgICBzZXRUZXh0Q29sb3IoZ2V0Q29sb3IoaWYgKHNsb3RJ
bmRleCA9PSAwKSBSLmNvbG9yLmtzX211dGVkIGVsc2UgUi5jb2xvci5rc193aGl0ZSkpCiAgICAg
ICAgICAgICAgICB0ZXh0U2l6ZSA9IDEyZgogICAgICAgICAgICAgICAgc2V0VHlwZWZhY2UodHlw
ZWZhY2UsIGFuZHJvaWQuZ3JhcGhpY3MuVHlwZWZhY2UuQk9MRCkKICAgICAgICAgICAgICAgIGdy
YXZpdHkgPSBHcmF2aXR5LkNFTlRFUl9WRVJUSUNBTAogICAgICAgICAgICAgICAgc2V0UGFkZGlu
ZygxMC5kcCwgMCwgMCwgMCkKICAgICAgICAgICAgICAgIHNldEJhY2tncm91bmRDb2xvcihDb2xv
ci5UUkFOU1BBUkVOVCkKICAgICAgICAgICAgfQogICAgICAgICAgICB0aW1lQmFyLmFkZFZpZXco
bGFiZWwsIEZyYW1lTGF5b3V0LkxheW91dFBhcmFtcygoMzAgKiBwaXhlbHNQZXJNaW51dGVEcCku
ZHAsIDQ0LmRwKS5hcHBseSB7CiAgICAgICAgICAgICAgICBsZWZ0TWFyZ2luID0gKGxlZnRNaW51
dGVzICogcGl4ZWxzUGVyTWludXRlRHApLmRwCiAgICAgICAgICAgIH0pCgogICAgICAgICAgICB2
YWwgZGl2aWRlciA9IFZpZXcodGhpcykuYXBwbHkgewogICAgICAgICAgICAgICAgc2V0QmFja2dy
b3VuZENvbG9yKGdldENvbG9yKFIuY29sb3Iua3NfbGluZSkpCiAgICAgICAgICAgICAgICBhbHBo
YSA9IDAuNjVmCiAgICAgICAgICAgIH0KICAgICAgICAgICAgdGltZUJhci5hZGRWaWV3KGRpdmlk
ZXIsIEZyYW1lTGF5b3V0LkxheW91dFBhcmFtcygxLmRwLCA0NC5kcCkuYXBwbHkgewogICAgICAg
ICAgICAgICAgbGVmdE1hcmdpbiA9IChsZWZ0TWludXRlcyAqIHBpeGVsc1Blck1pbnV0ZURwKS5k
cAogICAgICAgICAgICB9KQoKICAgICAgICAgICAgdCArPSBzbG90TXMKICAgICAgICAgICAgc2xv
dEluZGV4KysKICAgICAgICB9CgogICAgICAgIG5vd01hcmtlciA9IFZpZXcodGhpcykuYXBwbHkg
ewogICAgICAgICAgICBzZXRCYWNrZ3JvdW5kQ29sb3IoZ2V0Q29sb3IoUi5jb2xvci5rc19yZWQp
KQogICAgICAgICAgICBlbGV2YXRpb24gPSA4ZgogICAgICAgIH0uYWxzbyB7CiAgICAgICAgICAg
IHRpbWVCYXIuYWRkVmlldyhpdCwgRnJhbWVMYXlvdXQuTGF5b3V0UGFyYW1zKDMuZHAsIDQ0LmRw
KSkKICAgICAgICB9CgogICAgICAgIG5vd0xhYmVsID0gVGV4dFZpZXcodGhpcykuYXBwbHkgewog
ICAgICAgICAgICB0ZXh0ID0gIk5PVyIKICAgICAgICAgICAgc2V0VGV4dENvbG9yKGdldENvbG9y
KFIuY29sb3Iua3Nfd2hpdGUpKQogICAgICAgICAgICBzZXRCYWNrZ3JvdW5kUmVzb3VyY2UoUi5k
cmF3YWJsZS5iZ19lcGdfbm93X2JhZGdlKQogICAgICAgICAgICB0ZXh0U2l6ZSA9IDlmCiAgICAg
ICAgICAgIHNldFR5cGVmYWNlKHR5cGVmYWNlLCBhbmRyb2lkLmdyYXBoaWNzLlR5cGVmYWNlLkJP
TEQpCiAgICAgICAgICAgIGdyYXZpdHkgPSBHcmF2aXR5LkNFTlRFUgogICAgICAgICAgICBzZXRQ
YWRkaW5nKDUuZHAsIDAsIDUuZHAsIDApCiAgICAgICAgfS5hbHNvIHsKICAgICAgICAgICAgdGlt
ZUJhci5hZGRWaWV3KGl0LCBGcmFtZUxheW91dC5MYXlvdXRQYXJhbXMoNDguZHAsIDIyLmRwKSkK
ICAgICAgICB9CgogICAgICAgIHVwZGF0ZU5vd1Bvc2l0aW9uKGp1bXAgPSBmYWxzZSkKICAgIH0K
CiAgICBwcml2YXRlIGZ1biB1cGRhdGVOb3dQb3NpdGlvbihqdW1wOiBCb29sZWFuKSB7CiAgICAg
ICAgaWYgKCE6OnRpbWVCYXIuaXNJbml0aWFsaXplZCkgcmV0dXJuCiAgICAgICAgdmFsIHdpZHRo
UHggPSAoKCh0aW1lbGluZUVuZE1zIC0gdGltZWxpbmVTdGFydE1zKSAvIDYwXzAwMEwpICogcGl4
ZWxzUGVyTWludXRlRHApLnRvSW50KCkuZHAKICAgICAgICB2YWwgbm93WCA9ICgoKChTeXN0ZW0u
Y3VycmVudFRpbWVNaWxsaXMoKSAtIHRpbWVsaW5lU3RhcnRNcykuY29lcmNlQXRMZWFzdCgwTCkp
IC8gNjBfMDAwLjApICogcGl4ZWxzUGVyTWludXRlRHApLnRvSW50KCkuZHAKICAgICAgICB2YWwg
c2FmZVggPSBub3dYLmNvZXJjZUluKDAsICh3aWR0aFB4IC0gMy5kcCkuY29lcmNlQXRMZWFzdCgw
KSkKCiAgICAgICAgKG5vd01hcmtlcj8ubGF5b3V0UGFyYW1zIGFzPyBGcmFtZUxheW91dC5MYXlv
dXRQYXJhbXMpPy5sZXQgeyBwYXJhbXMgLT4KICAgICAgICAgICAgcGFyYW1zLmxlZnRNYXJnaW4g
PSBzYWZlWAogICAgICAgICAgICBub3dNYXJrZXI/LmxheW91dFBhcmFtcyA9IHBhcmFtcwogICAg
ICAgIH0KICAgICAgICAobm93TGFiZWw/LmxheW91dFBhcmFtcyBhcz8gRnJhbWVMYXlvdXQuTGF5
b3V0UGFyYW1zKT8ubGV0IHsgcGFyYW1zIC0+CiAgICAgICAgICAgIHBhcmFtcy5sZWZ0TWFyZ2lu
ID0gKHNhZmVYICsgNS5kcCkuY29lcmNlQXRNb3N0KCh3aWR0aFB4IC0gNDguZHApLmNvZXJjZUF0
TGVhc3QoMCkpCiAgICAgICAgICAgIHBhcmFtcy50b3BNYXJnaW4gPSAyLmRwCiAgICAgICAgICAg
IG5vd0xhYmVsPy5sYXlvdXRQYXJhbXMgPSBwYXJhbXMKICAgICAgICB9CiAgICAgICAgbm93TWFy
a2VyPy5yZXF1ZXN0TGF5b3V0KCkKICAgICAgICBub3dMYWJlbD8ucmVxdWVzdExheW91dCgpCgog
ICAgICAgIGlmIChqdW1wKSB7CiAgICAgICAgICAgIC8vIFRoZSBjdXJyZW50IHNsb3Qgc3RhcnRz
IG9uIHNjcmVlbiwgc28ga2VlcCBpdHMgbGFiZWwgdmlzaWJsZS4KICAgICAgICAgICAgLy8gSG9y
aXpvbnRhbCBzY3JvbGxpbmcgaXMgc3RpbGwgYXZhaWxhYmxlIGZvciB0aGUgbmV4dCBlaWdodCBo
b3Vycy4KICAgICAgICAgICAgdmFsIHRhcmdldCA9IDAKICAgICAgICAgICAgdGltZVNjcm9sbC5z
bW9vdGhTY3JvbGxUbyh0YXJnZXQsIDApCiAgICAgICAgICAgIGFkYXB0ZXI/LnNldEdsb2JhbFNj
cm9sbFgodGFyZ2V0KQogICAgICAgIH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biBqdW1wVG9Ob3co
KSB7CiAgICAgICAgdXBkYXRlSGVhZGVyQ2xvY2soKQogICAgICAgIHVwZGF0ZU5vd1Bvc2l0aW9u
KGp1bXAgPSB0cnVlKQogICAgfQoKICAgIHByaXZhdGUgZnVuIHVwZGF0ZUhlYWRlckNsb2NrKCkg
ewogICAgICAgIHZhbCBub3cgPSBEYXRlKCkKICAgICAgICBndWlkZUNsb2NrLnRleHQgPSBTaW1w
bGVEYXRlRm9ybWF0KCJoOm1tIGEiLCBMb2NhbGUuZ2V0RGVmYXVsdCgpKS5mb3JtYXQobm93KQog
ICAgICAgIGd1aWRlRGF0ZS50ZXh0ID0gU2ltcGxlRGF0ZUZvcm1hdCgiRUVFLCBNTU0gZCIsIExv
Y2FsZS5nZXREZWZhdWx0KCkpLmZvcm1hdChub3cpLnVwcGVyY2FzZShMb2NhbGUuZ2V0RGVmYXVs
dCgpKQogICAgfQoKICAgIHByaXZhdGUgZnVuIHNlbGVjdFByb2dyYW0oY2hhbm5lbDogTGl2ZVN0
cmVhbSwgaXRlbTogRXBnSXRlbSwgc3RhcnQ6IExvbmcsIGVuZDogTG9uZywgY3VycmVudDogQm9v
bGVhbikgewogICAgICAgIHNlbGVjdGVkQ2hhbm5lbCA9IGNoYW5uZWwKICAgICAgICBzZWxlY3Rl
ZEl0ZW0gPSBpdGVtCiAgICAgICAgc2VsZWN0ZWRTdGFydE1zID0gc3RhcnQKICAgICAgICBzZWxl
Y3RlZEVuZE1zID0gZW5kCiAgICAgICAgcmVmcmVzaFNlbGVjdGVkUHJvZ3JhbSgpCiAgICB9Cgog
ICAgcHJpdmF0ZSBmdW4gc2VsZWN0Rmlyc3RDdXJyZW50UHJvZ3JhbSgpIHsKICAgICAgICBpZiAo
c2VsZWN0ZWRDaGFubmVsICE9IG51bGwpIHJldHVybgogICAgICAgIHZhbCBub3cgPSBTeXN0ZW0u
Y3VycmVudFRpbWVNaWxsaXMoKQogICAgICAgIGZvciAoY2hhbm5lbCBpbiBjaGFubmVscykgewog
ICAgICAgICAgICBmb3IgKGl0ZW0gaW4gZ3VpZGVzW2NoYW5uZWwuaWRdLm9yRW1wdHkoKSkgewog
ICAgICAgICAgICAgICAgdmFsIHN0YXJ0ID0gaXRlbS5zdGFydFRpbWVzdGFtcD8udGltZXMoMTAw
MEwpID86IGNvbnRpbnVlCiAgICAgICAgICAgICAgICB2YWwgZW5kID0gaXRlbS5lbmRUaW1lc3Rh
bXA/LnRpbWVzKDEwMDBMKSA/OiBjb250aW51ZQogICAgICAgICAgICAgICAgaWYgKGVuZCA+IHN0
YXJ0ICYmIG5vdyBpbiBzdGFydCB1bnRpbCBlbmQpIHsKICAgICAgICAgICAgICAgICAgICBzZWxl
Y3RQcm9ncmFtKGNoYW5uZWwsIGl0ZW0sIHN0YXJ0LCBlbmQsIHRydWUpCiAgICAgICAgICAgICAg
ICAgICAgcmV0dXJuCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICB9CiAg
ICB9CgogICAgcHJpdmF0ZSBmdW4gcmVmcmVzaFNlbGVjdGVkUHJvZ3JhbSgpIHsKICAgICAgICB2
YWwgY2hhbm5lbCA9IHNlbGVjdGVkQ2hhbm5lbCA/OiByZXR1cm4KICAgICAgICB2YWwgaXRlbSA9
IHNlbGVjdGVkSXRlbSA/OiByZXR1cm4KICAgICAgICB2YWwgc3RhcnQgPSBzZWxlY3RlZFN0YXJ0
TXMKICAgICAgICB2YWwgZW5kID0gc2VsZWN0ZWRFbmRNcwogICAgICAgIHZhbCBub3cgPSBTeXN0
ZW0uY3VycmVudFRpbWVNaWxsaXMoKQogICAgICAgIHZhbCBjdXJyZW50ID0gZW5kID4gc3RhcnQg
JiYgbm93IGluIHN0YXJ0IHVudGlsIGVuZAogICAgICAgIHZhbCB1cGNvbWluZyA9IHN0YXJ0ID4g
bm93CiAgICAgICAgdmFsIHRpdGxlID0gaXRlbS50aXRsZS5pZkJsYW5rIHsgIkxpdmUgUHJvZ3Jh
bW1pbmciIH0KCiAgICAgICAgZGV0YWlsVGl0bGUudGV4dCA9IHRpdGxlCgogICAgICAgIHZhbCBw
Y3QgPSBpZiAoY3VycmVudCAmJiBlbmQgPiBzdGFydCkgewogICAgICAgICAgICAoKChub3cgLSBz
dGFydCkuY29lcmNlSW4oMEwsIGVuZCAtIHN0YXJ0KSAqIDEwMCkgLyAoZW5kIC0gc3RhcnQpKS50
b0ludCgpCiAgICAgICAgfSBlbHNlIDAKCiAgICAgICAgZGV0YWlsTWV0YS50ZXh0ID0gYnVpbGRT
dHJpbmcgewogICAgICAgICAgICBhcHBlbmQoaWYgKGN1cnJlbnQpICJMSVZFIE5PVyIgZWxzZSBp
ZiAodXBjb21pbmcpICJVUENPTUlORyIgZWxzZSAiUkVDRU5UIikKICAgICAgICAgICAgYXBwZW5k
KCIgIOKAoiAgJHtjaGFubmVsLm5hbWV9IikKICAgICAgICAgICAgYXBwZW5kKCIgIOKAoiAgJHtm
b3JtYXRUaW1lKHN0YXJ0KX3igJMke2Zvcm1hdFRpbWUoZW5kKX0iKQogICAgICAgICAgICBhcHBl
bmQoIiAg4oCiICAke2Zvcm1hdER1cmF0aW9uKGVuZCAtIHN0YXJ0KX0iKQogICAgICAgIH0KICAg
ICAgICBkZXRhaWxNZXRhLnNldFRleHRDb2xvcihnZXRDb2xvcihpZiAoY3VycmVudCkgUi5jb2xv
ci5rc19yZWQgZWxzZSBSLmNvbG9yLmtzX211dGVkKSkKICAgICAgICBkZXRhaWxEZXNjcmlwdGlv
bi50ZXh0ID0gaXRlbS5kZXNjcmlwdGlvbi5pZkJsYW5rIHsKICAgICAgICAgICAgIk5vIHByb2dy
YW0gZGVzY3JpcHRpb24gaXMgYXZhaWxhYmxlIGZyb20geW91ciBUViBwcm92aWRlci4iCiAgICAg
ICAgfQoKICAgICAgICBkZXRhaWxQcm9ncmVzcy5wcm9ncmVzcyA9IHBjdAogICAgICAgIGRldGFp
bFByb2dyZXNzTGFiZWwudGV4dCA9IHdoZW4gewogICAgICAgICAgICBjdXJyZW50IC0+ICIke2Zv
cm1hdFJlbWFpbmluZyhlbmQgLSBub3cpfSByZW1haW5pbmcgIOKAoiAgJHBjdCUgY29tcGxldGUi
CiAgICAgICAgICAgIHVwY29taW5nIC0+ICJTdGFydHMgaW4gJHtmb3JtYXRSZW1haW5pbmcoc3Rh
cnQgLSBub3cpfSAg4oCiICAke2Zvcm1hdFRpbWUoc3RhcnQpfSIKICAgICAgICAgICAgZWxzZSAt
PiAiUHJvZ3JhbSBlbmRlZCAke2Zvcm1hdFRpbWUoZW5kKX0iCiAgICAgICAgfQoKICAgICAgICB3
YXRjaEJ1dHRvbi5pc0VuYWJsZWQgPSB0cnVlCiAgICAgICAgd2F0Y2hCdXR0b24uYWxwaGEgPSAx
ZgogICAgICAgIHdhdGNoQnV0dG9uLnRleHQgPSBpZiAoY3VycmVudCkgIldBVENIIExJVkUiIGVs
c2UgIkdPIFRPIENIQU5ORUwiCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gZm9ybWF0RHVyYXRpb24o
bXM6IExvbmcpOiBTdHJpbmcgewogICAgICAgIHZhbCBtaW51dGVzID0gKG1zLmNvZXJjZUF0TGVh
c3QoMEwpIC8gNjBfMDAwTCkudG9JbnQoKQogICAgICAgIHJldHVybiB3aGVuIHsKICAgICAgICAg
ICAgbWludXRlcyA+PSA2MCAmJiBtaW51dGVzICUgNjAgPT0gMCAtPiAiJHttaW51dGVzIC8gNjB9
IEhSIgogICAgICAgICAgICBtaW51dGVzID49IDYwIC0+ICIke21pbnV0ZXMgLyA2MH0gSFIgJHtt
aW51dGVzICUgNjB9IE1JTiIKICAgICAgICAgICAgZWxzZSAtPiAiJHttaW51dGVzLmNvZXJjZUF0
TGVhc3QoMSl9IE1JTiIKICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gZm9ybWF0UmVt
YWluaW5nKG1zOiBMb25nKTogU3RyaW5nIHsKICAgICAgICB2YWwgc2FmZSA9IG1zLmNvZXJjZUF0
TGVhc3QoMEwpCiAgICAgICAgdmFsIG1pbnV0ZXMgPSAoc2FmZSAvIDYwXzAwMEwpLnRvSW50KCkK
ICAgICAgICByZXR1cm4gd2hlbiB7CiAgICAgICAgICAgIG1pbnV0ZXMgPj0gNjAgLT4gIiR7bWlu
dXRlcyAvIDYwfWggJHttaW51dGVzICUgNjB9bSIKICAgICAgICAgICAgbWludXRlcyA+IDAgLT4g
IiR7bWludXRlc31tIgogICAgICAgICAgICBlbHNlIC0+ICI8MW0iCiAgICAgICAgfQogICAgfQoK
ICAgIHByaXZhdGUgZnVuIG9wZW5DaGFubmVsKGNoYW5uZWw6IExpdmVTdHJlYW0pIHsKICAgICAg
ICBzdGFydEFjdGl2aXR5KEludGVudCh0aGlzLCBQbGF5ZXJBY3Rpdml0eTo6Y2xhc3MuamF2YSku
YXBwbHkgewogICAgICAgICAgICBwdXRFeHRyYSgibmFtZSIsIGNoYW5uZWwubmFtZSkKICAgICAg
ICAgICAgcHV0RXh0cmEoInVybCIsIFh0cmVhbUNsaWVudC5zdHJlYW1VcmwoY3JlZGVudGlhbHMs
IGNoYW5uZWwpKQogICAgICAgICAgICBwdXRFeHRyYSgia2luZCIsICJsaXZlIikKICAgICAgICAg
ICAgcHV0RXh0cmEoInN0cmVhbUlkIiwgY2hhbm5lbC5pZCkKICAgICAgICB9KQogICAgfQoKICAg
IHByaXZhdGUgZnVuIGZvcm1hdFRpbWUobXM6IExvbmcpOiBTdHJpbmcgPSB0cnkgewogICAgICAg
IFNpbXBsZURhdGVGb3JtYXQoImg6bW0gYSIsIExvY2FsZS5nZXREZWZhdWx0KCkpLmZvcm1hdChE
YXRlKG1zKSkKICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikgeyAiIiB9CgogICAgcHJpdmF0ZSB2
YWwgSW50LmRwOiBJbnQgZ2V0KCkgPSAodGhpcyAqIHJlc291cmNlcy5kaXNwbGF5TWV0cmljcy5k
ZW5zaXR5KS50b0ludCgpCgogICAgb3ZlcnJpZGUgZnVuIG9uRGVzdHJveSgpIHsKICAgICAgICBn
ZW5lcmF0aW9uKysKICAgICAgICB1aUhhbmRsZXIucmVtb3ZlQ2FsbGJhY2tzKGNsb2NrVGlja2Vy
KQogICAgICAgIGV4ZWN1dG9yLnNodXRkb3duTm93KCkKICAgICAgICBlcGdFeGVjdXRvci5zaHV0
ZG93bk5vdygpCiAgICAgICAgc3VwZXIub25EZXN0cm95KCkKICAgIH0KfQo=
:::END GUIDE
:::BEGIN ADAPTER
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkNvbnRleHQKaW1wb3J0IGFuZHJvaWQuZ3JhcGhpY3MuQ29sb3IKaW1wb3J0IGFuZHJvaWQudGV4
dC5UZXh0VXRpbHMKaW1wb3J0IGFuZHJvaWQudXRpbC5UeXBlZFZhbHVlCmltcG9ydCBhbmRyb2lk
LnZpZXcuR3Jhdml0eQppbXBvcnQgYW5kcm9pZC52aWV3LlZpZXcKaW1wb3J0IGFuZHJvaWQudmll
dy5WaWV3R3JvdXAKaW1wb3J0IGFuZHJvaWQud2lkZ2V0LkFycmF5QWRhcHRlcgppbXBvcnQgYW5k
cm9pZC53aWRnZXQuRnJhbWVMYXlvdXQKaW1wb3J0IGFuZHJvaWQud2lkZ2V0Lkhvcml6b250YWxT
Y3JvbGxWaWV3CmltcG9ydCBhbmRyb2lkLndpZGdldC5MaW5lYXJMYXlvdXQKaW1wb3J0IGFuZHJv
aWQud2lkZ2V0LlRleHRWaWV3CmltcG9ydCBhbmRyb2lkeC5jb3JlLndpZGdldC5UZXh0Vmlld0Nv
bXBhdAppbXBvcnQgamF2YS50ZXh0LlNpbXBsZURhdGVGb3JtYXQKaW1wb3J0IGphdmEudXRpbC5D
b2xsZWN0aW9ucwppbXBvcnQgamF2YS51dGlsLkRhdGUKaW1wb3J0IGphdmEudXRpbC5Mb2NhbGUK
aW1wb3J0IGphdmEudXRpbC5XZWFrSGFzaE1hcAppbXBvcnQga290bGluLm1hdGgubWF4CmltcG9y
dCBrb3RsaW4ubWF0aC5taW4KCi8qKgogKiBDb21wbGV0ZSBmaXhlZC1ncmlkIEVQRyByZW5kZXJl
ci4KICoKICogVGhlIHByZXZpb3VzIHZhcmlhYmxlLXdpZHRoIEZyYW1lTGF5b3V0IHJlbmRlcmVy
IGhhcyBiZWVuIHJlbW92ZWQuIEV2ZXJ5CiAqIGNoYW5uZWwgb3ducyBleGFjdGx5IG9uZSBob3Jp
em9udGFsIGxhbmUgYnVpbHQgb24gYSBmaXZlLW1pbnV0ZSBncmlkIGFsaWduZWQKICogd2l0aCB0
aGUgdGltZSBoZWFkZXIuIENvbnNlY3V0aXZlIHNsaWNlcyBiZWxvbmdpbmcgdG8gdGhlIHNhbWUg
cHJvZ3JhbW1lIGFyZQogKiBtZXJnZWQgaW50byBvbmUgZHVyYXRpb24td2lkdGggY2FyZCwgd2hp
bGUgZXZlcnkgc2xpY2Ugc3RpbGwgc2VsZWN0cyBhdCBtb3N0CiAqIG9uZSBwcm92aWRlciBwcm9n
cmFtbWUuIFN0YWNraW5nIGFuZCBvdmVybGFwIHJlbWFpbiBzdHJ1Y3R1cmFsbHkgaW1wb3NzaWJs
ZS4KICovCmNsYXNzIEVwZ0d1aWRlQWRhcHRlcigKICAgIHByaXZhdGUgdmFsIHJvd0NvbnRleHQ6
IENvbnRleHQsCiAgICBwcml2YXRlIHZhbCBjaGFubmVsczogTGlzdDxMaXZlU3RyZWFtPiwKICAg
IHByaXZhdGUgdmFsIGd1aWRlUHJvdmlkZXI6IChMaXZlU3RyZWFtKSAtPiBMaXN0PEVwZ0l0ZW0+
PywKICAgIHByaXZhdGUgdmFsIHRpbWVsaW5lU3RhcnRNczogTG9uZywKICAgIHByaXZhdGUgdmFs
IHRpbWVsaW5lRW5kTXM6IExvbmcsCiAgICBwcml2YXRlIHZhbCBwaXhlbHNQZXJNaW51dGVEcDog
SW50LAogICAgcHJpdmF0ZSB2YWwgY2hhbm5lbFdpZHRoRHA6IEludCwKICAgIHByaXZhdGUgdmFs
IG9uUHJvZ3JhbUZvY3VzZWQ6IChMaXZlU3RyZWFtLCBFcGdJdGVtLCBMb25nLCBMb25nLCBCb29s
ZWFuKSAtPiBVbml0LAogICAgcHJpdmF0ZSB2YWwgb25Qcm9ncmFtQ2xpY2tlZDogKExpdmVTdHJl
YW0sIEVwZ0l0ZW0sIExvbmcsIExvbmcsIEJvb2xlYW4pIC0+IFVuaXQsCiAgICBwcml2YXRlIHZh
bCBvbkhvcml6b250YWxDaGFuZ2VkOiAoSW50KSAtPiBVbml0CikgOiBBcnJheUFkYXB0ZXI8TGl2
ZVN0cmVhbT4ocm93Q29udGV4dCwgYW5kcm9pZC5SLmxheW91dC5zaW1wbGVfbGlzdF9pdGVtXzEs
IGNoYW5uZWxzKSB7CgogICAgcHJpdmF0ZSBkYXRhIGNsYXNzIFJlc29sdmVkRXZlbnQoCiAgICAg
ICAgdmFsIGl0ZW06IEVwZ0l0ZW0sCiAgICAgICAgdmFsIHN0YXJ0TXM6IExvbmcsCiAgICAgICAg
dmFsIGVuZE1zOiBMb25nCiAgICApCgogICAgcHJpdmF0ZSB2YWwgdmlzaWJsZVNjcm9sbHMgPSBD
b2xsZWN0aW9ucy5uZXdTZXRGcm9tTWFwKFdlYWtIYXNoTWFwPEhvcml6b250YWxTY3JvbGxWaWV3
LCBCb29sZWFuPigpKQogICAgcHJpdmF0ZSB2YXIgc3luY2luZyA9IGZhbHNlCiAgICBwcml2YXRl
IHZhciBnbG9iYWxTY3JvbGxYID0gMAogICAgcHJpdmF0ZSB2YWwgbm93TXM6IExvbmcgZ2V0KCkg
PSBTeXN0ZW0uY3VycmVudFRpbWVNaWxsaXMoKQogICAgcHJpdmF0ZSB2YWwgcm93SGVpZ2h0UHgg
PSA4Ni5kcAogICAgcHJpdmF0ZSB2YWwgc2xvdE1zID0gMzAgKiA2MF8wMDBMCiAgICBwcml2YXRl
IHZhbCBxdWFudHVtTXMgPSA1ICogNjBfMDAwTAogICAgcHJpdmF0ZSB2YWwgcXVhbnR1bVdpZHRo
UHggPSAoNSAqIHBpeGVsc1Blck1pbnV0ZURwKS5kcAogICAgcHJpdmF0ZSB2YWwgcXVhbnR1bUNv
dW50ID0gKCgodGltZWxpbmVFbmRNcyAtIHRpbWVsaW5lU3RhcnRNcykgKyBxdWFudHVtTXMgLSAx
TCkgLyBxdWFudHVtTXMpLnRvSW50KCkKICAgIHByaXZhdGUgdmFsIHRpbWVsaW5lV2lkdGhQeCA9
IHF1YW50dW1Db3VudCAqIHF1YW50dW1XaWR0aFB4CgogICAgb3ZlcnJpZGUgZnVuIGdldENvdW50
KCk6IEludCA9IGNoYW5uZWxzLnNpemUKCiAgICBvdmVycmlkZSBmdW4gZ2V0Vmlldyhwb3NpdGlv
bjogSW50LCBjb252ZXJ0VmlldzogVmlldz8sIHBhcmVudDogVmlld0dyb3VwKTogVmlldyB7CiAg
ICAgICAgdmFsIGNoYW5uZWwgPSBjaGFubmVsc1twb3NpdGlvbl0KICAgICAgICB2YWwgcm9vdCA9
IExpbmVhckxheW91dChyb3dDb250ZXh0KS5hcHBseSB7CiAgICAgICAgICAgIG9yaWVudGF0aW9u
ID0gTGluZWFyTGF5b3V0LkhPUklaT05UQUwKICAgICAgICAgICAgZ3Jhdml0eSA9IEdyYXZpdHku
Q0VOVEVSX1ZFUlRJQ0FMCiAgICAgICAgICAgIGxheW91dFBhcmFtcyA9IFZpZXdHcm91cC5MYXlv
dXRQYXJhbXMoVmlld0dyb3VwLkxheW91dFBhcmFtcy5NQVRDSF9QQVJFTlQsIHJvd0hlaWdodFB4
KQogICAgICAgICAgICBzZXRQYWRkaW5nKDAsIDMuZHAsIDAsIDMuZHApCiAgICAgICAgICAgIGRl
c2NlbmRhbnRGb2N1c2FiaWxpdHkgPSBWaWV3R3JvdXAuRk9DVVNfQUZURVJfREVTQ0VOREFOVFMK
ICAgICAgICB9CgogICAgICAgIHZhbCBjaGFubmVsQ2VsbCA9IFRleHRWaWV3KHJvd0NvbnRleHQp
LmFwcGx5IHsKICAgICAgICAgICAgdGV4dCA9IFN0cmluZy5mb3JtYXQoTG9jYWxlLmdldERlZmF1
bHQoKSwgIiUwM2QgICAlcyIsIHBvc2l0aW9uICsgMSwgY2hhbm5lbC5uYW1lKQogICAgICAgICAg
ICBzZXRUZXh0Q29sb3IoQ29sb3IuV0hJVEUpCiAgICAgICAgICAgIHRleHRTaXplID0gMTNmCiAg
ICAgICAgICAgIHNldFR5cGVmYWNlKHR5cGVmYWNlLCBhbmRyb2lkLmdyYXBoaWNzLlR5cGVmYWNl
LkJPTEQpCiAgICAgICAgICAgIGdyYXZpdHkgPSBHcmF2aXR5LkNFTlRFUl9WRVJUSUNBTAogICAg
ICAgICAgICBtYXhMaW5lcyA9IDIKICAgICAgICAgICAgZWxsaXBzaXplID0gVGV4dFV0aWxzLlRy
dW5jYXRlQXQuRU5ECiAgICAgICAgICAgIHNldFBhZGRpbmcoMTMuZHAsIDYuZHAsIDEwLmRwLCA2
LmRwKQogICAgICAgICAgICBzZXRCYWNrZ3JvdW5kUmVzb3VyY2UoUi5kcmF3YWJsZS5iZ19lcGdf
Y2hhbm5lbCkKICAgICAgICAgICAgaXNGb2N1c2FibGUgPSBmYWxzZQogICAgICAgICAgICBpc0Ns
aWNrYWJsZSA9IGZhbHNlCiAgICAgICAgfQogICAgICAgIHJvb3QuYWRkVmlldygKICAgICAgICAg
ICAgY2hhbm5lbENlbGwsCiAgICAgICAgICAgIExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMoY2hh
bm5lbFdpZHRoRHAuZHAsIExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMuTUFUQ0hfUEFSRU5UKS5h
cHBseSB7CiAgICAgICAgICAgICAgICBtYXJnaW5FbmQgPSA2LmRwCiAgICAgICAgICAgIH0KICAg
ICAgICApCgogICAgICAgIHZhbCBzY3JvbGwgPSBIb3Jpem9udGFsU2Nyb2xsVmlldyhyb3dDb250
ZXh0KS5hcHBseSB7CiAgICAgICAgICAgIGlzSG9yaXpvbnRhbFNjcm9sbEJhckVuYWJsZWQgPSBm
YWxzZQogICAgICAgICAgICBpc0ZpbGxWaWV3cG9ydCA9IGZhbHNlCiAgICAgICAgICAgIG92ZXJT
Y3JvbGxNb2RlID0gVmlldy5PVkVSX1NDUk9MTF9ORVZFUgogICAgICAgICAgICBpc0ZvY3VzYWJs
ZSA9IGZhbHNlCiAgICAgICAgICAgIGRlc2NlbmRhbnRGb2N1c2FiaWxpdHkgPSBWaWV3R3JvdXAu
Rk9DVVNfQUZURVJfREVTQ0VOREFOVFMKICAgICAgICB9CiAgICAgICAgdmlzaWJsZVNjcm9sbHMu
YWRkKHNjcm9sbCkKCiAgICAgICAgdmFsIGNhbnZhcyA9IEZyYW1lTGF5b3V0KHJvd0NvbnRleHQp
LmFwcGx5IHsKICAgICAgICAgICAgbGF5b3V0UGFyYW1zID0gVmlld0dyb3VwLkxheW91dFBhcmFt
cyh0aW1lbGluZVdpZHRoUHgsIExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMuTUFUQ0hfUEFSRU5U
KQogICAgICAgICAgICBzZXRCYWNrZ3JvdW5kQ29sb3Iocm93Q29udGV4dC5nZXRDb2xvcihSLmNv
bG9yLmtzX2d1aWRlX2NhbnZhcykpCiAgICAgICAgfQoKICAgICAgICB2YWwgbGFuZSA9IExpbmVh
ckxheW91dChyb3dDb250ZXh0KS5hcHBseSB7CiAgICAgICAgICAgIG9yaWVudGF0aW9uID0gTGlu
ZWFyTGF5b3V0LkhPUklaT05UQUwKICAgICAgICAgICAgZ3Jhdml0eSA9IEdyYXZpdHkuQ0VOVEVS
X1ZFUlRJQ0FMCiAgICAgICAgfQogICAgICAgIGNhbnZhcy5hZGRWaWV3KAogICAgICAgICAgICBs
YW5lLAogICAgICAgICAgICBGcmFtZUxheW91dC5MYXlvdXRQYXJhbXModGltZWxpbmVXaWR0aFB4
LCA3NC5kcCkuYXBwbHkgeyB0b3BNYXJnaW4gPSAzLmRwIH0KICAgICAgICApCgogICAgICAgIHZh
bCBndWlkZSA9IGd1aWRlUHJvdmlkZXIoY2hhbm5lbCkKICAgICAgICB2YWwgZXZlbnRzID0gZ3Vp
ZGU/LmxldCB7IHJlc29sdmVFdmVudHMoaXQpIH0ub3JFbXB0eSgpCgogICAgICAgIHZhbCBzZWxl
Y3RlZCA9IExpc3QocXVhbnR1bUNvdW50KSB7IHF1YW50dW1JbmRleCAtPgogICAgICAgICAgICBp
ZiAoZ3VpZGUgPT0gbnVsbCkgbnVsbAogICAgICAgICAgICBlbHNlIHsKICAgICAgICAgICAgICAg
IHZhbCBxdWFudHVtU3RhcnQgPSB0aW1lbGluZVN0YXJ0TXMgKyBxdWFudHVtSW5kZXggKiBxdWFu
dHVtTXMKICAgICAgICAgICAgICAgIHZhbCBxdWFudHVtRW5kID0gbWluKHF1YW50dW1TdGFydCAr
IHF1YW50dW1NcywgdGltZWxpbmVFbmRNcykKICAgICAgICAgICAgICAgIHByb2dyYW1Gb3JTbG90
KGV2ZW50cywgcXVhbnR1bVN0YXJ0LCBxdWFudHVtRW5kKQogICAgICAgICAgICB9CiAgICAgICAg
fQoKICAgICAgICB2YXIgcXVhbnR1bUluZGV4ID0gMAogICAgICAgIHdoaWxlIChxdWFudHVtSW5k
ZXggPCBxdWFudHVtQ291bnQpIHsKICAgICAgICAgICAgdmFsIGV2ZW50ID0gc2VsZWN0ZWRbcXVh
bnR1bUluZGV4XQogICAgICAgICAgICB2YWwgbG9hZGluZyA9IGd1aWRlID09IG51bGwKICAgICAg
ICAgICAgdmFyIHNwYW4gPSAxCiAgICAgICAgICAgIGlmIChldmVudCAhPSBudWxsKSB7CiAgICAg
ICAgICAgICAgICB3aGlsZSAoCiAgICAgICAgICAgICAgICAgICAgcXVhbnR1bUluZGV4ICsgc3Bh
biA8IHF1YW50dW1Db3VudCAmJgogICAgICAgICAgICAgICAgICAgIHNhbWVQcm9ncmFtbWUoZXZl
bnQsIHNlbGVjdGVkW3F1YW50dW1JbmRleCArIHNwYW5dKQogICAgICAgICAgICAgICAgKSB7CiAg
ICAgICAgICAgICAgICAgICAgc3BhbisrCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0g
ZWxzZSB7CiAgICAgICAgICAgICAgICAvLyBLZWVwIGxvYWRpbmcgYW5kIG1pc3NpbmctZGF0YSBw
bGFjZWhvbGRlcnMgcmVhZGFibGUgaW4KICAgICAgICAgICAgICAgIC8vIHJlZ3VsYXIgaGFsZi1o
b3VyIGJsb2NrcyBpbnN0ZWFkIG9mIG9uZSBlaWdodC1ob3VyIGNhcmQuCiAgICAgICAgICAgICAg
ICB3aGlsZSAoCiAgICAgICAgICAgICAgICAgICAgc3BhbiA8IDYgJiYKICAgICAgICAgICAgICAg
ICAgICBxdWFudHVtSW5kZXggKyBzcGFuIDwgcXVhbnR1bUNvdW50ICYmCiAgICAgICAgICAgICAg
ICAgICAgc2VsZWN0ZWRbcXVhbnR1bUluZGV4ICsgc3Bhbl0gPT0gbnVsbAogICAgICAgICAgICAg
ICAgKSB7CiAgICAgICAgICAgICAgICAgICAgc3BhbisrCiAgICAgICAgICAgICAgICB9CiAgICAg
ICAgICAgIH0KCiAgICAgICAgICAgIHZhbCB2aXNpYmxlU3RhcnQgPSB0aW1lbGluZVN0YXJ0TXMg
KyBxdWFudHVtSW5kZXggKiBxdWFudHVtTXMKICAgICAgICAgICAgdmFsIHZpc2libGVFbmQgPSBt
aW4odmlzaWJsZVN0YXJ0ICsgc3BhbiAqIHF1YW50dW1NcywgdGltZWxpbmVFbmRNcykKICAgICAg
ICAgICAgdmFsIGl0ZW0gPSBldmVudD8uaXRlbSA/OiBFcGdJdGVtKAogICAgICAgICAgICAgICAg
dGl0bGUgPSBpZiAobG9hZGluZykgIkxvYWRpbmcgR3VpZGUiIGVsc2UgIk5vIEluZm9ybWF0aW9u
IiwKICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gIiIsCiAgICAgICAgICAgICAgICBzdGFy
dCA9ICIiLAogICAgICAgICAgICAgICAgZW5kID0gIiIsCiAgICAgICAgICAgICAgICBzdGFydFRp
bWVzdGFtcCA9IHZpc2libGVTdGFydCAvIDEwMDBMLAogICAgICAgICAgICAgICAgZW5kVGltZXN0
YW1wID0gdmlzaWJsZUVuZCAvIDEwMDBMCiAgICAgICAgICAgICkKICAgICAgICAgICAgdmFsIGV2
ZW50U3RhcnQgPSBldmVudD8uc3RhcnRNcyA/OiB2aXNpYmxlU3RhcnQKICAgICAgICAgICAgdmFs
IGV2ZW50RW5kID0gZXZlbnQ/LmVuZE1zID86IHZpc2libGVFbmQKICAgICAgICAgICAgdmFsIGN1
cnJlbnQgPSBub3dNcyBpbiBldmVudFN0YXJ0IHVudGlsIGV2ZW50RW5kICYmICFsb2FkaW5nCiAg
ICAgICAgICAgIHZhbCBwYXN0ID0gZXZlbnRFbmQgPD0gbm93TXMKICAgICAgICAgICAgdmFsIG5v
SW5mb3JtYXRpb24gPSBldmVudCA9PSBudWxsICYmICFsb2FkaW5nCiAgICAgICAgICAgIHZhbCBj
b21wYWN0Q2FyZCA9IHNwYW4gPD0gNgogICAgICAgICAgICB2YWwgdGl0bGUgPSB3aGVuIHsKICAg
ICAgICAgICAgICAgIGxvYWRpbmcgLT4gIkxPQURJTkcgR1VJREXigKYiCiAgICAgICAgICAgICAg
ICBub0luZm9ybWF0aW9uIC0+ICJOTyBHVUlERSBEQVRBIgogICAgICAgICAgICAgICAgY3VycmVu
dCAmJiAhY29tcGFjdENhcmQgLT4gIkxJVkUgIOKAoiAgJHtpdGVtLnRpdGxlLmlmQmxhbmsgeyAi
TElWRSBQUk9HUkFNTUlORyIgfX0iCiAgICAgICAgICAgICAgICBlbHNlIC0+IGl0ZW0udGl0bGUu
aWZCbGFuayB7ICJMSVZFIFBST0dSQU1NSU5HIiB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAg
dmFsIHRpbWUgPSBmb3JtYXRSYW5nZShldmVudFN0YXJ0LCBldmVudEVuZCkKCiAgICAgICAgICAg
IHZhbCBibG9jayA9IFRleHRWaWV3KHJvd0NvbnRleHQpLmFwcGx5IHsKICAgICAgICAgICAgICAg
IC8vIEhhbGYtaG91ciBjYXJkcyBoYXZlIGxpbWl0ZWQgd2lkdGguIFRoZWlyIGV4YWN0IHRpbWUg
aXMKICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgc2hvd24gYnkgdGhlIGFsaWduZWQgaGVhZGVy
IGFuZCBkZXRhaWxzIHBhbmVsLCBzbwogICAgICAgICAgICAgICAgLy8gcmVzZXJ2ZSB0aGUgZnVs
bCBjYXJkIGZvciB0aGUgcHJvZ3JhbW1lIHRpdGxlLgogICAgICAgICAgICAgICAgdGV4dCA9IGlm
IChjb21wYWN0Q2FyZCkgdGl0bGUgZWxzZSAiJHRpdGxlXG4kdGltZSIKICAgICAgICAgICAgICAg
IHNldFRleHRDb2xvcihDb2xvci5XSElURSkKICAgICAgICAgICAgICAgIGVsbGlwc2l6ZSA9IFRl
eHRVdGlscy5UcnVuY2F0ZUF0LkVORAogICAgICAgICAgICAgICAgaW5jbHVkZUZvbnRQYWRkaW5n
ID0gZmFsc2UKICAgICAgICAgICAgICAgIGlmIChjb21wYWN0Q2FyZCkgewogICAgICAgICAgICAg
ICAgICAgIHRleHRTaXplID0gMTBmCiAgICAgICAgICAgICAgICAgICAgbWF4TGluZXMgPSA2CiAg
ICAgICAgICAgICAgICAgICAgZ3Jhdml0eSA9IEdyYXZpdHkuQ0VOVEVSCiAgICAgICAgICAgICAg
ICAgICAgdGV4dEFsaWdubWVudCA9IFZpZXcuVEVYVF9BTElHTk1FTlRfQ0VOVEVSCiAgICAgICAg
ICAgICAgICAgICAgZWxsaXBzaXplID0gbnVsbAogICAgICAgICAgICAgICAgICAgIHNldEhvcml6
b250YWxseVNjcm9sbGluZyhmYWxzZSkKICAgICAgICAgICAgICAgICAgICBzZXRMaW5lU3BhY2lu
ZygwZiwgMC45MGYpCiAgICAgICAgICAgICAgICAgICAgc2V0UGFkZGluZygyLmRwLCAxLmRwLCAy
LmRwLCAxLmRwKQogICAgICAgICAgICAgICAgICAgIFRleHRWaWV3Q29tcGF0LnNldEF1dG9TaXpl
VGV4dFR5cGVVbmlmb3JtV2l0aENvbmZpZ3VyYXRpb24oCiAgICAgICAgICAgICAgICAgICAgICAg
IHRoaXMsCiAgICAgICAgICAgICAgICAgICAgICAgIDYsCiAgICAgICAgICAgICAgICAgICAgICAg
IDEwLAogICAgICAgICAgICAgICAgICAgICAgICAxLAogICAgICAgICAgICAgICAgICAgICAgICBU
eXBlZFZhbHVlLkNPTVBMRVhfVU5JVF9TUAogICAgICAgICAgICAgICAgICAgICkKICAgICAgICAg
ICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgICAgICAgc2V0VGV4dFNpemUoVHlwZWRWYWx1
ZS5DT01QTEVYX1VOSVRfU1AsIDEzZikKICAgICAgICAgICAgICAgICAgICBtYXhMaW5lcyA9IDQK
ICAgICAgICAgICAgICAgICAgICBncmF2aXR5ID0gR3Jhdml0eS5DRU5URVJfVkVSVElDQUwKICAg
ICAgICAgICAgICAgICAgICB0ZXh0QWxpZ25tZW50ID0gVmlldy5URVhUX0FMSUdOTUVOVF9WSUVX
X1NUQVJUCiAgICAgICAgICAgICAgICAgICAgc2V0TGluZVNwYWNpbmcoMGYsIDFmKQogICAgICAg
ICAgICAgICAgICAgIHNldFBhZGRpbmcoMTIuZHAsIDQuZHAsIDEwLmRwLCA0LmRwKQogICAgICAg
ICAgICAgICAgfQogICAgICAgICAgICAgICAgc2V0VHlwZWZhY2UodHlwZWZhY2UsIGlmIChjdXJy
ZW50KSBhbmRyb2lkLmdyYXBoaWNzLlR5cGVmYWNlLkJPTEQgZWxzZSBhbmRyb2lkLmdyYXBoaWNz
LlR5cGVmYWNlLk5PUk1BTCkKICAgICAgICAgICAgICAgIHNldEJhY2tncm91bmRSZXNvdXJjZSgK
ICAgICAgICAgICAgICAgICAgICB3aGVuIHsKICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVu
dCAmJiAhbm9JbmZvcm1hdGlvbiAtPiBSLmRyYXdhYmxlLmJnX2VwZ19ub3cKICAgICAgICAgICAg
ICAgICAgICAgICAgcGFzdCB8fCBsb2FkaW5nIC0+IFIuZHJhd2FibGUuYmdfZXBnX3Bhc3QKICAg
ICAgICAgICAgICAgICAgICAgICAgZWxzZSAtPiBSLmRyYXdhYmxlLmJnX2VwZ19wcm9ncmFtCiAg
ICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgKQogICAgICAgICAgICAgICAgaXNG
b2N1c2FibGUgPSAhbG9hZGluZwogICAgICAgICAgICAgICAgaXNGb2N1c2FibGVJblRvdWNoTW9k
ZSA9IGZhbHNlCiAgICAgICAgICAgICAgICBpc0NsaWNrYWJsZSA9ICFsb2FkaW5nCiAgICAgICAg
ICAgICAgICBjb250ZW50RGVzY3JpcHRpb24gPSAiJHtjaGFubmVsLm5hbWV9LCAkdGl0bGUsICR0
aW1lIgogICAgICAgICAgICAgICAgaWYgKCFsb2FkaW5nKSB7CiAgICAgICAgICAgICAgICAgICAg
c2V0T25Gb2N1c0NoYW5nZUxpc3RlbmVyIHsgdmlldywgaGFzRm9jdXMgLT4KICAgICAgICAgICAg
ICAgICAgICAgICAgdmlldy5lbGV2YXRpb24gPSBpZiAoaGFzRm9jdXMpIDEwZiBlbHNlIDBmCiAg
ICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc2NhbGVYID0gaWYgKGhhc0ZvY3VzKSAxLjAxNWYg
ZWxzZSAxZgogICAgICAgICAgICAgICAgICAgICAgICB2aWV3LnNjYWxlWSA9IGlmIChoYXNGb2N1
cykgMS4wM2YgZWxzZSAxZgogICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzRm9jdXMpIG9u
UHJvZ3JhbUZvY3VzZWQoY2hhbm5lbCwgaXRlbSwgZXZlbnRTdGFydCwgZXZlbnRFbmQsIGN1cnJl
bnQpCiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIHNldE9uQ2xpY2tM
aXN0ZW5lciB7CiAgICAgICAgICAgICAgICAgICAgICAgIG9uUHJvZ3JhbUNsaWNrZWQoY2hhbm5l
bCwgaXRlbSwgZXZlbnRTdGFydCwgZXZlbnRFbmQsIGN1cnJlbnQpCiAgICAgICAgICAgICAgICAg
ICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CgogICAgICAgICAgICBsYW5lLmFk
ZFZpZXcoCiAgICAgICAgICAgICAgICBibG9jaywKICAgICAgICAgICAgICAgIExpbmVhckxheW91
dC5MYXlvdXRQYXJhbXMoKHNwYW4gKiBxdWFudHVtV2lkdGhQeCAtIDQuZHApLmNvZXJjZUF0TGVh
c3QoMS5kcCksIDc0LmRwKS5hcHBseSB7CiAgICAgICAgICAgICAgICAgICAgbWFyZ2luRW5kID0g
NC5kcAogICAgICAgICAgICAgICAgfQogICAgICAgICAgICApCiAgICAgICAgICAgIHF1YW50dW1J
bmRleCArPSBzcGFuCiAgICAgICAgfQoKICAgICAgICB2YWwgbWFya2VyWCA9ICgoKG5vd01zIC0g
dGltZWxpbmVTdGFydE1zKS5jb2VyY2VBdExlYXN0KDBMKSAvIDYwXzAwMC4wKSAqIHBpeGVsc1Bl
ck1pbnV0ZURwKS50b0ludCgpLmRwCiAgICAgICAgaWYgKG1hcmtlclggaW4gMCB1bnRpbCB0aW1l
bGluZVdpZHRoUHgpIHsKICAgICAgICAgICAgY2FudmFzLmFkZFZpZXcoCiAgICAgICAgICAgICAg
ICBWaWV3KHJvd0NvbnRleHQpLmFwcGx5IHsKICAgICAgICAgICAgICAgICAgICBzZXRCYWNrZ3Jv
dW5kQ29sb3Iocm93Q29udGV4dC5nZXRDb2xvcihSLmNvbG9yLmtzX3JlZCkpCiAgICAgICAgICAg
ICAgICAgICAgYWxwaGEgPSAwLjk1ZgogICAgICAgICAgICAgICAgICAgIGVsZXZhdGlvbiA9IDEy
ZgogICAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICAgIEZyYW1lTGF5b3V0LkxheW91dFBh
cmFtcygzLmRwLCBMaW5lYXJMYXlvdXQuTGF5b3V0UGFyYW1zLk1BVENIX1BBUkVOVCkuYXBwbHkg
ewogICAgICAgICAgICAgICAgICAgIGxlZnRNYXJnaW4gPSBtYXJrZXJYCiAgICAgICAgICAgICAg
ICB9CiAgICAgICAgICAgICkKICAgICAgICB9CgogICAgICAgIHNjcm9sbC5hZGRWaWV3KGNhbnZh
cykKICAgICAgICByb290LmFkZFZpZXcoc2Nyb2xsLCBMaW5lYXJMYXlvdXQuTGF5b3V0UGFyYW1z
KDAsIExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMuTUFUQ0hfUEFSRU5ULCAxZikpCiAgICAgICAg
c2Nyb2xsLnBvc3QgeyBzY3JvbGwuc2Nyb2xsVG8oZ2xvYmFsU2Nyb2xsWCwgMCkgfQogICAgICAg
IHNjcm9sbC5zZXRPblNjcm9sbENoYW5nZUxpc3RlbmVyIHsgXywgc2Nyb2xsWCwgXywgXywgXyAt
PgogICAgICAgICAgICBpZiAoIXN5bmNpbmcgJiYgc2Nyb2xsWCAhPSBnbG9iYWxTY3JvbGxYKSB7
CiAgICAgICAgICAgICAgICBnbG9iYWxTY3JvbGxYID0gc2Nyb2xsWAogICAgICAgICAgICAgICAg
c3luY1Zpc2libGUoc2Nyb2xsKQogICAgICAgICAgICAgICAgb25Ib3Jpem9udGFsQ2hhbmdlZChz
Y3JvbGxYKQogICAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHJldHVybiByb290CiAgICB9
CgogICAgZnVuIHNldEdsb2JhbFNjcm9sbFgoeDogSW50KSB7CiAgICAgICAgdmFsIHNhZmUgPSB4
LmNvZXJjZUF0TGVhc3QoMCkKICAgICAgICBpZiAoc2FmZSA9PSBnbG9iYWxTY3JvbGxYKSByZXR1
cm4KICAgICAgICBnbG9iYWxTY3JvbGxYID0gc2FmZQogICAgICAgIHN5bmNWaXNpYmxlKG51bGwp
CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gc3luY1Zpc2libGUoc291cmNlOiBIb3Jpem9udGFsU2Ny
b2xsVmlldz8pIHsKICAgICAgICBzeW5jaW5nID0gdHJ1ZQogICAgICAgIHRyeSB7CiAgICAgICAg
ICAgIHZpc2libGVTY3JvbGxzLnRvTGlzdCgpLmZvckVhY2ggeyB2aWV3IC0+CiAgICAgICAgICAg
ICAgICBpZiAodmlldyAhPT0gc291cmNlICYmIHZpZXcuc2Nyb2xsWCAhPSBnbG9iYWxTY3JvbGxY
KSB2aWV3LnNjcm9sbFRvKGdsb2JhbFNjcm9sbFgsIDApCiAgICAgICAgICAgIH0KICAgICAgICB9
IGZpbmFsbHkgewogICAgICAgICAgICBzeW5jaW5nID0gZmFsc2UKICAgICAgICB9CiAgICB9Cgog
ICAgcHJpdmF0ZSBmdW4gcmVzb2x2ZUV2ZW50cyhzb3VyY2U6IExpc3Q8RXBnSXRlbT4pOiBMaXN0
PFJlc29sdmVkRXZlbnQ+IHsKICAgICAgICByZXR1cm4gc291cmNlLm1hcEluZGV4ZWROb3ROdWxs
IHsgaW5kZXgsIGl0ZW0gLT4KICAgICAgICAgICAgdmFsIChzdGFydCwgZW5kKSA9IHJlc29sdmVk
VGltZXMoaXRlbSwgaW5kZXgpCiAgICAgICAgICAgIGlmIChlbmQgPD0gdGltZWxpbmVTdGFydE1z
IHx8IHN0YXJ0ID49IHRpbWVsaW5lRW5kTXMgfHwgZW5kIDw9IHN0YXJ0KSBudWxsCiAgICAgICAg
ICAgIGVsc2UgUmVzb2x2ZWRFdmVudChpdGVtLCBzdGFydCwgZW5kKQogICAgICAgIH0uc29ydGVk
V2l0aChjb21wYXJlQnk8UmVzb2x2ZWRFdmVudD4geyBpdC5zdGFydE1zIH0udGhlbkJ5RGVzY2Vu
ZGluZyB7IGl0LmVuZE1zIH0pCiAgICB9CgogICAgLyoqIFNlbGVjdCBleGFjdGx5IG9uZSBwcm9n
cmFtbWUgZm9yIG9uZSBmaXhlZCBoYWxmLWhvdXIgY2VsbC4gKi8KICAgIHByaXZhdGUgZnVuIHBy
b2dyYW1Gb3JTbG90KGV2ZW50czogTGlzdDxSZXNvbHZlZEV2ZW50Piwgc2xvdFN0YXJ0OiBMb25n
LCBzbG90RW5kOiBMb25nKTogUmVzb2x2ZWRFdmVudD8gewogICAgICAgIHZhciBiZXN0OiBSZXNv
bHZlZEV2ZW50PyA9IG51bGwKICAgICAgICB2YXIgYmVzdE92ZXJsYXAgPSAwTAogICAgICAgIGZv
ciAoZXZlbnQgaW4gZXZlbnRzKSB7CiAgICAgICAgICAgIGlmIChldmVudC5zdGFydE1zID49IHNs
b3RFbmQpIGJyZWFrCiAgICAgICAgICAgIHZhbCBvdmVybGFwID0gbWluKGV2ZW50LmVuZE1zLCBz
bG90RW5kKSAtIG1heChldmVudC5zdGFydE1zLCBzbG90U3RhcnQpCiAgICAgICAgICAgIGlmIChv
dmVybGFwID4gYmVzdE92ZXJsYXApIHsKICAgICAgICAgICAgICAgIGJlc3QgPSBldmVudAogICAg
ICAgICAgICAgICAgYmVzdE92ZXJsYXAgPSBvdmVybGFwCiAgICAgICAgICAgIH0KICAgICAgICB9
CiAgICAgICAgcmV0dXJuIGJlc3QKICAgIH0KCiAgICBwcml2YXRlIGZ1biBzYW1lUHJvZ3JhbW1l
KGZpcnN0OiBSZXNvbHZlZEV2ZW50LCBzZWNvbmQ6IFJlc29sdmVkRXZlbnQ/KTogQm9vbGVhbiB7
CiAgICAgICAgcmV0dXJuIHNlY29uZCAhPSBudWxsICYmCiAgICAgICAgICAgIGZpcnN0LnN0YXJ0
TXMgPT0gc2Vjb25kLnN0YXJ0TXMgJiYKICAgICAgICAgICAgZmlyc3QuZW5kTXMgPT0gc2Vjb25k
LmVuZE1zICYmCiAgICAgICAgICAgIGZpcnN0Lml0ZW0udGl0bGUgPT0gc2Vjb25kLml0ZW0udGl0
bGUKICAgIH0KCiAgICBwcml2YXRlIGZ1biByZXNvbHZlZFRpbWVzKGl0ZW06IEVwZ0l0ZW0sIGlu
ZGV4OiBJbnQpOiBQYWlyPExvbmcsIExvbmc+IHsKICAgICAgICB2YWwgZmxvb3JOb3cgPSAobm93
TXMgLyBzbG90TXMpICogc2xvdE1zCiAgICAgICAgdmFsIHN0YXJ0ID0gaXRlbS5zdGFydFRpbWVz
dGFtcD8ubGV0IHsgaXQgKiAxMDAwTCB9CiAgICAgICAgICAgID86IHBhcnNlR3VpZGVUaW1lKGl0
ZW0uc3RhcnQpCiAgICAgICAgICAgID86IGlmIChpdGVtLnN0YXJ0LmVxdWFscygiTm93IiwgdHJ1
ZSkpIGZsb29yTm93IGVsc2UgZmxvb3JOb3cgKyBpbmRleCAqIHNsb3RNcwogICAgICAgIHZhbCBl
bmQgPSBpdGVtLmVuZFRpbWVzdGFtcD8ubGV0IHsgaXQgKiAxMDAwTCB9CiAgICAgICAgICAgID86
IHBhcnNlR3VpZGVUaW1lKGl0ZW0uZW5kKQogICAgICAgICAgICA/OiAoc3RhcnQgKyBzbG90TXMp
CiAgICAgICAgcmV0dXJuIHN0YXJ0IHRvIG1heChlbmQsIHN0YXJ0ICsgNSAqIDYwXzAwMEwpCiAg
ICB9CgogICAgcHJpdmF0ZSBmdW4gcGFyc2VHdWlkZVRpbWUocmF3OiBTdHJpbmcpOiBMb25nPyB7
CiAgICAgICAgdmFsIHZhbHVlID0gcmF3LnRyaW0oKQogICAgICAgIGlmICh2YWx1ZS5pc0JsYW5r
KCkgfHwgdmFsdWUuZXF1YWxzKCJOb3ciLCB0cnVlKSB8fCB2YWx1ZS5lcXVhbHMoIk5leHQiLCB0
cnVlKSB8fCB2YWx1ZS5lcXVhbHMoIkxhdGVyIiwgdHJ1ZSkpIHJldHVybiBudWxsCiAgICAgICAg
dmFsIG51bWVyaWMgPSB2YWx1ZS50b0xvbmdPck51bGwoKQogICAgICAgIGlmIChudW1lcmljICE9
IG51bGwpIHJldHVybiBpZiAobnVtZXJpYyA8IDEwMF8wMDBfMDAwXzAwMEwpIG51bWVyaWMgKiAx
MDAwTCBlbHNlIG51bWVyaWMKICAgICAgICB2YWwgcGF0dGVybnMgPSBsaXN0T2YoInl5eXktTU0t
ZGQgSEg6bW06c3MiLCAieXl5eS1NTS1kZCBISDptbSIpCiAgICAgICAgZm9yIChwYXR0ZXJuIGlu
IHBhdHRlcm5zKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICB2YWwgcGFyc2Vk
ID0gU2ltcGxlRGF0ZUZvcm1hdChwYXR0ZXJuLCBMb2NhbGUuVVMpLnBhcnNlKHZhbHVlKQogICAg
ICAgICAgICAgICAgaWYgKHBhcnNlZCAhPSBudWxsKSByZXR1cm4gcGFyc2VkLnRpbWUKICAgICAg
ICAgICAgfSBjYXRjaCAoXzogRXhjZXB0aW9uKSB7IH0KICAgICAgICB9CiAgICAgICAgcmV0dXJu
IG51bGwKICAgIH0KCiAgICBwcml2YXRlIGZ1biBmb3JtYXRSYW5nZShzdGFydDogTG9uZywgZW5k
OiBMb25nKTogU3RyaW5nIHsKICAgICAgICByZXR1cm4gdHJ5IHsKICAgICAgICAgICAgdmFsIGZv
cm1hdHRlciA9IFNpbXBsZURhdGVGb3JtYXQoImg6bW0gYSIsIExvY2FsZS5nZXREZWZhdWx0KCkp
CiAgICAgICAgICAgICIke2Zvcm1hdHRlci5mb3JtYXQoRGF0ZShzdGFydCkpfSDigJMgJHtmb3Jt
YXR0ZXIuZm9ybWF0KERhdGUoZW5kKSl9IgogICAgICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikg
ewogICAgICAgICAgICAiIgogICAgICAgIH0KICAgIH0KCiAgICBwcml2YXRlIHZhbCBJbnQuZHA6
IEludCBnZXQoKSA9ICh0aGlzICogcm93Q29udGV4dC5yZXNvdXJjZXMuZGlzcGxheU1ldHJpY3Mu
ZGVuc2l0eSkudG9JbnQoKQp9Cg==
:::END ADAPTER
:::BEGIN GRADLE
cGx1Z2lucyB7CiAgICBpZCgiY29tLmFuZHJvaWQuYXBwbGljYXRpb24iKQogICAgaWQoIm9yZy5q
ZXRicmFpbnMua290bGluLmFuZHJvaWQiKQp9CgphbmRyb2lkIHsKICAgIG5hbWVzcGFjZSA9ICJj
b20ua3Jpc3RhbHN0cmVhbXMucGxheWVyIgogICAgY29tcGlsZVNkayA9IDM1CgogICAgZGVmYXVs
dENvbmZpZyB7CiAgICAgICAgYXBwbGljYXRpb25JZCA9ICJjb20ua3Jpc3RhbHN0cmVhbXMucGxh
eWVyIgogICAgICAgIG1pblNkayA9IDIzCiAgICAgICAgdGFyZ2V0U2RrID0gMzUKICAgICAgICB2
ZXJzaW9uQ29kZSA9IDE2ODIwMTAKICAgICAgICB2ZXJzaW9uTmFtZSA9ICIxLjYuOC1saXZlLWhl
YWRlci10cmFuc3BhcmVudCIKICAgIH0KCiAgICBidWlsZEZlYXR1cmVzIHsKICAgICAgICB2aWV3
QmluZGluZyA9IGZhbHNlCiAgICB9CgogICAgY29tcGlsZU9wdGlvbnMgewogICAgICAgIHNvdXJj
ZUNvbXBhdGliaWxpdHkgPSBKYXZhVmVyc2lvbi5WRVJTSU9OXzExCiAgICAgICAgdGFyZ2V0Q29t
cGF0aWJpbGl0eSA9IEphdmFWZXJzaW9uLlZFUlNJT05fMTEKICAgIH0KCiAgICBrb3RsaW4gewog
ICAgICAgIGp2bVRvb2xjaGFpbigxMSkKICAgIH0KfQoKZGVwZW5kZW5jaWVzIHsKICAgIGltcGxl
bWVudGF0aW9uKCJhbmRyb2lkeC5jb3JlOmNvcmUta3R4OjEuMTUuMCIpCiAgICBpbXBsZW1lbnRh
dGlvbigiYW5kcm9pZHguYXBwY29tcGF0OmFwcGNvbXBhdDoxLjcuMCIpCiAgICBpbXBsZW1lbnRh
dGlvbigiY29tLmdvb2dsZS5hbmRyb2lkLm1hdGVyaWFsOm1hdGVyaWFsOjEuMTIuMCIpCiAgICBp
bXBsZW1lbnRhdGlvbigiYW5kcm9pZHgubWVkaWEzOm1lZGlhMy1leG9wbGF5ZXI6MS41LjEiKQog
ICAgaW1wbGVtZW50YXRpb24oImFuZHJvaWR4Lm1lZGlhMzptZWRpYTMtZXhvcGxheWVyLWhsczox
LjUuMSIpCiAgICBpbXBsZW1lbnRhdGlvbigiYW5kcm9pZHgubWVkaWEzOm1lZGlhMy11aToxLjUu
MSIpCn0K
:::END GRADLE
:::BEGIN AUDIT
S1JJU1RBTCBTVFJFQU1TIDEuNi44IFJDMSBSMiDigJQgVFJBTlNQQVJFTlQgTElWRSBUViBIRUFE
RVIgQVJUCgpCQVNFTElORQotIEtub3duLWdvb2QgUjIgYXBwLgotIExvZ2luLCBwbGF5YmFjaywg
TW92aWVzLCBTZXJpZXMgYW5kIExpdmUgVFYgTm93L05leHQgYXJlIHVuY2hhbmdlZC4KLSBUaGUg
ZWFybGllciB2YXJpYWJsZS13aWR0aCBFUEcgcmVuZGVyZXIgd2FzIHJlbW92ZWQgcmF0aGVyIHRo
YW4gcGF0Y2hlZC4KClJFQlVJTFQgR1VJREUKLSBVc2VzIHRoZSBzdXBwbGllZCB3b3JraW5nIElQ
VFYgQVBLJ3MgZHVyYXRpb24td2lkdGggYmVoYXZpb3Igb24gdG9wIG9mIHRoZQogIHJlYnVpbHQg
bm9uLXN0YWNraW5nIGdyaWQuCi0gRWFjaCBmaXZlLW1pbnV0ZSBzbGljZSBzZWxlY3RzIGF0IG1v
c3Qgb25lIHByb3ZpZGVyIHByb2dyYW1tZSBieSBncmVhdGVzdAogIHRpbWUgb3ZlcmxhcCwgdGhl
biBjb25zZWN1dGl2ZSBzbGljZXMgZm9yIHRoZSBzYW1lIHNob3cgbWVyZ2UgaW50byBvbmUgY2Fy
ZC4KLSBBIG9uZS1ob3VyIHNob3cgc3BhbnMgb25lIGhvdXIsIGEgOTAtbWludXRlIHNob3cgc3Bh
bnMgOTAgbWludXRlcywgYW5kIGxvbmdlcgogIHNob3dzIGNvbnRpbnVlIGZyb20gdGhlaXIgc3Rh
cnQgdGhyb3VnaCBmaW5pc2ggdGltZS4KLSBEdXBsaWNhdGUgb3IgY29uZmxpY3RpbmcgcHJvdmlk
ZXIgZW50cmllcyBjYW5ub3Qgc3RhY2sgYmVjYXVzZSBldmVyeQogIGZpdmUtbWludXRlIHNsaWNl
IHN0aWxsIGhhcyBleGFjdGx5IG9uZSBzZWxlY3RlZCBwcm9ncmFtbWUuCi0gRXZlcnkgY2FyZCBr
ZWVwcyB0aGUgc2FtZSBmb3VyLWRwIGd1dHRlciBpbiBwb3J0cmFpdCBhbmQgbGFuZHNjYXBlLgot
IENhcmRzIG9mIDMwIG1pbnV0ZXMgb3IgbGVzcyB1c2UgYSBjb21wYWN0IHRpdGxlLW9ubHkgbGF5
b3V0IHdpdGggbWluaW1hbAogIHBhZGRpbmcgYW5kIHNpeCBhdmFpbGFibGUgdGV4dCBsaW5lcy4g
RXhhY3QgdGltZXMgcmVtYWluIGluIHRoZSBhbGlnbmVkCiAgdGltZWxpbmUgYW5kIGRldGFpbHMg
cGFuZWwsIHByZXZlbnRpbmcgbmFycm93LWNhcmQgdGV4dCBmcm9tIGJlaW5nIGN1dCBvZmYuCi0g
SGFsZi1ob3VyIGNhcmRzIGNlbnRlciB0aGVpciBjb21wYWN0IHRpdGxlIGhvcml6b250YWxseSBh
bmQgdmVydGljYWxseS4KLSBMb25nZXIgY2FyZHMgcmV0dXJuIHRvIGxlZnQtYWxpZ25lZCBjb250
ZW50IHdpdGggMTNzcCB0ZXh0LCBub3JtYWwgc2lkZQogIHBhZGRpbmcsIGFuZCB0aGUgdGl0bGUg
cGx1cyB0aW1lIHJhbmdlIHNvIHdpZGUgY2FyZHMgZG8gbm90IGxvb2sgZW1wdHkuCi0gQXV0b21h
dGljIHNpemluZyBhcHBsaWVzIG9ubHkgdG8gY29tcGFjdCBoYWxmLWhvdXIgY2FyZHMsIGRvd24g
dG8gNnNwIHdoZW4KICBuZWVkZWQsIHdpdGggc2l4IGxpbmVzLCB0aWdodGVyIGxpbmUgc3BhY2lu
ZywgYW5kIHJlZHVjZWQgZm9udCBwYWRkaW5nLgotIENvbXBhY3QgY2FyZHMgd3JhcCBpbnN0ZWFk
IG9mIGFkZGluZyBhbiBlbGxpcHNpcywgbWF4aW1pemluZyB0aGUgdmlzaWJsZQogIHByb2dyYW1t
ZSB0aXRsZSB3aXRob3V0IGNoYW5naW5nIHRoZSBjYXJkJ3MgdHJ1ZSBkdXJhdGlvbiB3aWR0aC4K
LSBUaGUgcHJvZ3JhbS1kZXRhaWxzIHBhbmVsIG5vdyBzZWxlY3RzIHRoZSBmaXJzdCBjdXJyZW50
bHkgYWlyaW5nIHByb2dyYW1tZQogIGF1dG9tYXRpY2FsbHkgaW5zdGVhZCBvZiByZW1haW5pbmcg
ZW1wdHkgdW50aWwgYSBjYXJkIHJlY2VpdmVzIGZvY3VzLgotIFRoZSBzZWxlY3RlZCBwcm9ncmFt
IHNob3dzIGEgbGFyZ2VyIHRpdGxlLCBzdGF0dXMsIGNoYW5uZWwsIGNvbXBsZXRlIGFpcnRpbWUs
CiAgZHVyYXRpb24sIHByb3ZpZGVyIGRlc2NyaXB0aW9uLCByZW1haW5pbmcgdGltZSwgcHJvZ3Jl
c3MsIGFuZCBhIGNsZWFyIGFjdGlvbi4KLSBMaXZlIHByb2dyZXNzIGFuZCBzdGF0dXMgcmVmcmVz
aCBldmVyeSAzMCBzZWNvbmRzIHdpdGhvdXQgcmVidWlsZGluZyB0aGUgRVBHLgotIFRoZSBmaXhl
ZCBncmlkLCBjYXJkIHdpZHRocywgY29tcGFjdCB0aXRsZSBydWxlcywgYWxpZ25tZW50LCBhbmQg
Z3VpZGUgZGF0YQogIGxvYWRpbmcgYmVoYXZpb3IgYXJlIHVuY2hhbmdlZCBmcm9tIHRoZSBhcHBy
b3ZlZCBzdGFibGUgYmFzZWxpbmUuCi0gVGhlIHJlZ3VsYXIgTGl2ZSBUViBjaGFubmVsIGxpc3Qg
aXMgZGV0ZWN0ZWQgYnkgaXRzIExJVkUgVFYgYW5kIENIQU5ORUwKICBDQVRFR09SSUVTIGhlYWRp
bmdzOyBvdGhlciBtZWRpYSBzY3JlZW5zIGFyZSBub3QgcmVzdHlsZWQuCi0gRXZlcnkgc3F1YXJl
IGNoYW5uZWwtbG9nbyBwYW5lbCBvbiB0aGF0IHNjcmVlbiByZWNlaXZlcyB0aGUgc2FtZSBsaWdo
dAogIG5ldXRyYWwgcm91bmRlZCBiYWNrZ3JvdW5kIGFuZCBib3JkZXIsIGZpeGluZyBibGFjayBC
RVQsIENvbWVkeSBDZW50cmFsLAogIEJyYXZvLCBhbmQgc2ltaWxhciBhcnR3b3JrIGFjcm9zcyB0
aGUgY29tcGxldGUgbGlzdC4KLSBQcm92aWRlciBhcnR3b3JrIHdpdGggYSBiYWtlZC1pbiBuZWFy
LWJsYWNrIGJhY2tkcm9wIGlzIGxpZ2h0ZW5lZCBvbmx5IHdoZW4KICBpdCBsYWNrcyBicmlnaHQg
Zm9yZWdyb3VuZCBhcnR3b3JrLiBBbHJlYWR5LXZpc2libGUgbG9nb3MgcmVtYWluIHVuY2hhbmdl
ZC4KLSBUaGUgd2lkZSBLUyBLcmlzdGFsIFN0cmVhbXMgYmFubmVyIGluIHRoZSBkYXNoYm9hcmQn
cyB0b3AgbmF2aWdhdGlvbiBiYXIgaXMKICBkZXRlY3RlZCBieSB0aGUgQ29ubmVjdGVkIGFzIGFu
ZCBTVFJFQU1JTkcgaGVhZGluZ3MuIEl0cyBibGFjayB2aWV3IG9yIGltYWdlCiAgYmFja2Ryb3Ag
aXMgcmVtb3ZlZCB3aGlsZSB0aGUgcmVkIGFuZCB3aGl0ZSBicmFuZCBhcnR3b3JrIGlzIHByZXNl
cnZlZC4KLSBUaGUgc21hbGxlciBMaXZlIFRWIGhlYWRlciBhcnR3b3JrIHJlY2VpdmVzIHRoZSBz
YW1lIHRyYW5zcGFyZW50IHRyZWF0bWVudC4KLSBUaGUgYXBwcm92ZWQgRVBHIGFkYXB0ZXIgaXMg
cmVzdG9yZWQgdW5jaGFuZ2VkLiBHdWlkZSByb3dzLCBwcm9ncmFtbWUgd2lkdGhzLAogIHNjaGVk
dWxlIGJlaGF2aW9yLCBhbmQgdGhlIGltcHJvdmVkIGRldGFpbHMgcGFuZWwgcmVtYWluIHVuY2hh
bmdlZC4KLSBYTUxUViByZW1haW5zIHRoZSBwcmVmZXJyZWQgc2NoZWR1bGUgc291cmNlLiBWaXNp
YmxlIGNoYW5uZWxzIHdpdGhvdXQgdXNhYmxlCiAgWE1MVFYgdXNlIG9uZSBjYWNoZWQgZnVsbCBw
ZXItY2hhbm5lbCBwcm92aWRlciByZXF1ZXN0LgotIFNjaGVkdWxlIHRpbWVzLCB0aW1lbGluZSBs
YWJlbHMgYW5kIE5PVyB1c2UgdGhlIEFuZHJvaWQgZGV2aWNlIGNsb2NrLgotIE1pc3Npbmcgc2No
ZWR1bGUgY2VsbHMgdmlzaWJseSBzYXkgTk8gR1VJREUgREFUQS4KClZFUlNJT04KLSB2ZXJzaW9u
Q29kZSAxNjgyMDEwCi0gdmVyc2lvbk5hbWUgMS42LjgtbGl2ZS1oZWFkZXItdHJhbnNwYXJlbnQK
:::END AUDIT

:::BEGIN UICONTEXT
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5hcHAuQWN0
aXZpdHkKaW1wb3J0IGFuZHJvaWQuYXBwLkFwcGxpY2F0aW9uCmltcG9ydCBhbmRyb2lkLmNvbnRl
bnQuQ29udGVudFByb3ZpZGVyCmltcG9ydCBhbmRyb2lkLmNvbnRlbnQuQ29udGVudFZhbHVlcwpp
bXBvcnQgYW5kcm9pZC5jb250ZW50LkNvbnRleHQKaW1wb3J0IGFuZHJvaWQuZGF0YWJhc2UuQ3Vy
c29yCmltcG9ydCBhbmRyb2lkLmdyYXBoaWNzLkJpdG1hcAppbXBvcnQgYW5kcm9pZC5ncmFwaGlj
cy5DYW52YXMKaW1wb3J0IGFuZHJvaWQuZ3JhcGhpY3MuQ29sb3IKaW1wb3J0IGFuZHJvaWQuZ3Jh
cGhpY3MuUmVjdAppbXBvcnQgYW5kcm9pZC5ncmFwaGljcy5kcmF3YWJsZS5Db2xvckRyYXdhYmxl
CmltcG9ydCBhbmRyb2lkLmdyYXBoaWNzLmRyYXdhYmxlLkRyYXdhYmxlCmltcG9ydCBhbmRyb2lk
LmdyYXBoaWNzLmRyYXdhYmxlLkdyYWRpZW50RHJhd2FibGUKaW1wb3J0IGFuZHJvaWQubmV0LlVy
aQppbXBvcnQgYW5kcm9pZC5vcy5CdW5kbGUKaW1wb3J0IGFuZHJvaWQub3MuSGFuZGxlcgppbXBv
cnQgYW5kcm9pZC5vcy5Mb29wZXIKaW1wb3J0IGFuZHJvaWQudmlldy5WaWV3CmltcG9ydCBhbmRy
b2lkLnZpZXcuVmlld0dyb3VwCmltcG9ydCBhbmRyb2lkLndpZGdldC5JbWFnZVZpZXcKaW1wb3J0
IGFuZHJvaWQud2lkZ2V0LlRleHRWaWV3CmltcG9ydCBqYXZhLnV0aWwuTG9jYWxlCmltcG9ydCBq
YXZhLnV0aWwuV2Vha0hhc2hNYXAKaW1wb3J0IGtvdGxpbi5tYXRoLmFicwppbXBvcnQga290bGlu
Lm1hdGgubWF4CgovKioKICogQXBwbGllcyB0aGUgTGl2ZSBUViBsb2dvIHRyZWF0bWVudCBhbmQg
dHJhbnNwYXJlbnQgZGFzaGJvYXJkIGJyYW5kIGJhbm5lcgogKiB3aXRob3V0IGNoYW5naW5nIHRo
ZSBFUEcgcmVuZGVyZXIuIEl0IGlzIGluaXRpYWxpemVkIGJ5IGEgcHJpdmF0ZSBtYW5pZmVzdAog
KiBwcm92aWRlciBhbmQgb25seSBhY3RpdmF0ZXMgb24gdGhlIHR3byBzcGVjaWZpY2FsbHkgaWRl
bnRpZmllZCBzY3JlZW5zLgogKi8KY2xhc3MgVWlDb250cmFzdFByb3ZpZGVyIDogQ29udGVudFBy
b3ZpZGVyKCkgewogICAgcHJpdmF0ZSB2YWwgY29udHJvbGxlciA9IExpdmVUdkxvZ29Db250cmFz
dENvbnRyb2xsZXIoKQoKICAgIG92ZXJyaWRlIGZ1biBvbkNyZWF0ZSgpOiBCb29sZWFuIHsKICAg
ICAgICB2YWwgYXBwID0gY29udGV4dD8uYXBwbGljYXRpb25Db250ZXh0IGFzPyBBcHBsaWNhdGlv
biA/OiByZXR1cm4gZmFsc2UKICAgICAgICBhcHAucmVnaXN0ZXJBY3Rpdml0eUxpZmVjeWNsZUNh
bGxiYWNrcyhvYmplY3QgOiBBcHBsaWNhdGlvbi5BY3Rpdml0eUxpZmVjeWNsZUNhbGxiYWNrcyB7
CiAgICAgICAgICAgIG92ZXJyaWRlIGZ1biBvbkFjdGl2aXR5UmVzdW1lZChhY3Rpdml0eTogQWN0
aXZpdHkpID0gY29udHJvbGxlci5zdGFydChhY3Rpdml0eSkKICAgICAgICAgICAgb3ZlcnJpZGUg
ZnVuIG9uQWN0aXZpdHlQYXVzZWQoYWN0aXZpdHk6IEFjdGl2aXR5KSA9IGNvbnRyb2xsZXIuc3Rv
cChhY3Rpdml0eSkKICAgICAgICAgICAgb3ZlcnJpZGUgZnVuIG9uQWN0aXZpdHlEZXN0cm95ZWQo
YWN0aXZpdHk6IEFjdGl2aXR5KSA9IGNvbnRyb2xsZXIuc3RvcChhY3Rpdml0eSkKICAgICAgICAg
ICAgb3ZlcnJpZGUgZnVuIG9uQWN0aXZpdHlDcmVhdGVkKGFjdGl2aXR5OiBBY3Rpdml0eSwgc3Rh
dGU6IEJ1bmRsZT8pID0gVW5pdAogICAgICAgICAgICBvdmVycmlkZSBmdW4gb25BY3Rpdml0eVN0
YXJ0ZWQoYWN0aXZpdHk6IEFjdGl2aXR5KSA9IFVuaXQKICAgICAgICAgICAgb3ZlcnJpZGUgZnVu
IG9uQWN0aXZpdHlTdG9wcGVkKGFjdGl2aXR5OiBBY3Rpdml0eSkgPSBVbml0CiAgICAgICAgICAg
IG92ZXJyaWRlIGZ1biBvbkFjdGl2aXR5U2F2ZUluc3RhbmNlU3RhdGUoYWN0aXZpdHk6IEFjdGl2
aXR5LCBzdGF0ZTogQnVuZGxlKSA9IFVuaXQKICAgICAgICB9KQogICAgICAgIHJldHVybiB0cnVl
CiAgICB9CgogICAgb3ZlcnJpZGUgZnVuIHF1ZXJ5KHVyaTogVXJpLCBwcm9qZWN0aW9uOiBBcnJh
eTxvdXQgU3RyaW5nPj8sIHNlbGVjdGlvbjogU3RyaW5nPywgc2VsZWN0aW9uQXJnczogQXJyYXk8
b3V0IFN0cmluZz4/LCBzb3J0T3JkZXI6IFN0cmluZz8pOiBDdXJzb3I/ID0gbnVsbAogICAgb3Zl
cnJpZGUgZnVuIGdldFR5cGUodXJpOiBVcmkpOiBTdHJpbmc/ID0gbnVsbAogICAgb3ZlcnJpZGUg
ZnVuIGluc2VydCh1cmk6IFVyaSwgdmFsdWVzOiBDb250ZW50VmFsdWVzPyk6IFVyaT8gPSBudWxs
CiAgICBvdmVycmlkZSBmdW4gZGVsZXRlKHVyaTogVXJpLCBzZWxlY3Rpb246IFN0cmluZz8sIHNl
bGVjdGlvbkFyZ3M6IEFycmF5PG91dCBTdHJpbmc+Pyk6IEludCA9IDAKICAgIG92ZXJyaWRlIGZ1
biB1cGRhdGUodXJpOiBVcmksIHZhbHVlczogQ29udGVudFZhbHVlcz8sIHNlbGVjdGlvbjogU3Ry
aW5nPywgc2VsZWN0aW9uQXJnczogQXJyYXk8b3V0IFN0cmluZz4/KTogSW50ID0gMAp9Cgpwcml2
YXRlIGNsYXNzIExpdmVUdkxvZ29Db250cmFzdENvbnRyb2xsZXIgewogICAgcHJpdmF0ZSB2YWwg
aGFuZGxlciA9IEhhbmRsZXIoTG9vcGVyLmdldE1haW5Mb29wZXIoKSkKICAgIHByaXZhdGUgdmFs
IHRhc2tzID0gV2Vha0hhc2hNYXA8QWN0aXZpdHksIFJ1bm5hYmxlPigpCiAgICBwcml2YXRlIHZh
bCBwcm9jZXNzZWRIZWFkZXJzID0gV2Vha0hhc2hNYXA8SW1hZ2VWaWV3LCBEcmF3YWJsZT4oKQog
ICAgcHJpdmF0ZSB2YWwgcHJvY2Vzc2VkTG9nb3MgPSBXZWFrSGFzaE1hcDxJbWFnZVZpZXcsIERy
YXdhYmxlPigpCgogICAgZnVuIHN0YXJ0KGFjdGl2aXR5OiBBY3Rpdml0eSkgewogICAgICAgIHN0
b3AoYWN0aXZpdHkpCiAgICAgICAgdmFsIHJvb3QgPSBhY3Rpdml0eS53aW5kb3c/LmRlY29yVmll
dyA/OiByZXR1cm4KICAgICAgICB2YWwgdGFzayA9IG9iamVjdCA6IFJ1bm5hYmxlIHsKICAgICAg
ICAgICAgb3ZlcnJpZGUgZnVuIHJ1bigpIHsKICAgICAgICAgICAgICAgIGlmICghYWN0aXZpdHku
aXNGaW5pc2hpbmcgJiYgIWFjdGl2aXR5LmlzRGVzdHJveWVkKSB7CiAgICAgICAgICAgICAgICAg
ICAgYXBwbHlVaUNvbnRyYXN0KHJvb3QsIGFjdGl2aXR5KQogICAgICAgICAgICAgICAgICAgIGhh
bmRsZXIucG9zdERlbGF5ZWQodGhpcywgODAwTCkKICAgICAgICAgICAgICAgIH0KICAgICAgICAg
ICAgfQogICAgICAgIH0KICAgICAgICB0YXNrc1thY3Rpdml0eV0gPSB0YXNrCiAgICAgICAgaGFu
ZGxlci5wb3N0KHRhc2spCiAgICB9CgogICAgZnVuIHN0b3AoYWN0aXZpdHk6IEFjdGl2aXR5KSB7
CiAgICAgICAgdGFza3MucmVtb3ZlKGFjdGl2aXR5KT8ubGV0KGhhbmRsZXI6OnJlbW92ZUNhbGxi
YWNrcykKICAgIH0KCiAgICBwcml2YXRlIGZ1biBhcHBseVVpQ29udHJhc3Qocm9vdDogVmlldywg
Y29udGV4dDogQ29udGV4dCkgewogICAgICAgIHZhbCBsaXZlVHZTY3JlZW4gPSBpc0xpdmVUdlNj
cmVlbihyb290KQogICAgICAgIHZhbCBkYXNoYm9hcmRTY3JlZW4gPSBpc0Rhc2hib2FyZFNjcmVl
bihyb290KQogICAgICAgIGlmICghbGl2ZVR2U2NyZWVuICYmICFkYXNoYm9hcmRTY3JlZW4pIHJl
dHVybgogICAgICAgIHZhbCBkZW5zaXR5ID0gY29udGV4dC5yZXNvdXJjZXMuZGlzcGxheU1ldHJp
Y3MuZGVuc2l0eQogICAgICAgIGNsZWFyVG9wTGVmdENvbnRhaW5lcnMocm9vdCwgZGVuc2l0eSkK
ICAgICAgICB2aXNpdChyb290KSB7IHZpZXcgLT4KICAgICAgICAgICAgaWYgKHZpZXcgIWlzIElt
YWdlVmlldyB8fCB2aWV3LndpZHRoIDw9IDAgfHwgdmlldy5oZWlnaHQgPD0gMCkgcmV0dXJuQHZp
c2l0CiAgICAgICAgICAgIHZhbCBsb2NhdGlvbiA9IEludEFycmF5KDIpCiAgICAgICAgICAgIHZp
ZXcuZ2V0TG9jYXRpb25PblNjcmVlbihsb2NhdGlvbikKICAgICAgICAgICAgdmFsIHhEcCA9IGxv
Y2F0aW9uWzBdIC8gZGVuc2l0eQogICAgICAgICAgICB2YWwgeURwID0gbG9jYXRpb25bMV0gLyBk
ZW5zaXR5CiAgICAgICAgICAgIHZhbCB3aWR0aERwID0gdmlldy53aWR0aCAvIGRlbnNpdHkKICAg
ICAgICAgICAgdmFsIGhlaWdodERwID0gdmlldy5oZWlnaHQgLyBkZW5zaXR5CiAgICAgICAgICAg
IHZhbCBzcXVhcmVFbm91Z2ggPSB3aWR0aERwIC8gaGVpZ2h0RHAgaW4gMC42MmYuLjEuNjJmCgog
ICAgICAgICAgICB3aGVuIHsKICAgICAgICAgICAgICAgIGRhc2hib2FyZFNjcmVlbiAmJiB4RHAg
PCAyMzBmICYmIHlEcCA8IDEzMGYgJiYKICAgICAgICAgICAgICAgICAgICB3aWR0aERwIGluIDk1
Zi4uMjg1ZiAmJiBoZWlnaHREcCBpbiAyOGYuLjEyMGYgLT4gewogICAgICAgICAgICAgICAgICAg
IG1ha2VIZWFkZXJBcnR3b3JrVHJhbnNwYXJlbnQodmlldywgZGVuc2l0eSkKICAgICAgICAgICAg
ICAgIH0KICAgICAgICAgICAgICAgIGxpdmVUdlNjcmVlbiAmJiB4RHAgPCAxNTBmICYmIHlEcCA8
IDEyNWYgJiYKICAgICAgICAgICAgICAgICAgICB3aWR0aERwIGluIDM0Zi4uMTI1ZiAmJiBoZWln
aHREcCBpbiAzNGYuLjEyNWYgLT4gewogICAgICAgICAgICAgICAgICAgIG1ha2VIZWFkZXJBcnR3
b3JrVHJhbnNwYXJlbnQodmlldywgZGVuc2l0eSkKICAgICAgICAgICAgICAgIH0KICAgICAgICAg
ICAgICAgIGxpdmVUdlNjcmVlbiAmJiB5RHAgPiAxNDVmICYmIHdpZHRoRHAgaW4gMzRmLi4xMDVm
ICYmCiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0RHAgaW4gMzRmLi4xMDVmICYmIHNxdWFyZUVu
b3VnaCAtPiB7CiAgICAgICAgICAgICAgICAgICAgc3R5bGVDaGFubmVsTG9nbyh2aWV3LCBkZW5z
aXR5KQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQoKICAg
IHByaXZhdGUgZnVuIGlzTGl2ZVR2U2NyZWVuKHJvb3Q6IFZpZXcpOiBCb29sZWFuIHsKICAgICAg
ICB2YXIgbGl2ZVR2ID0gZmFsc2UKICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IGZhbHNlCiAgICAg
ICAgdmlzaXQocm9vdCkgeyB2aWV3IC0+CiAgICAgICAgICAgIGlmICh2aWV3IGlzIFRleHRWaWV3
KSB7CiAgICAgICAgICAgICAgICB2YWwgdmFsdWUgPSB2aWV3LnRleHQ/LnRvU3RyaW5nKCk/LnRy
aW0oKT8udXBwZXJjYXNlKExvY2FsZS5VUykub3JFbXB0eSgpCiAgICAgICAgICAgICAgICBpZiAo
dmFsdWUgPT0gIkxJVkUgVFYiIHx8IHZhbHVlLmNvbnRhaW5zKCJQUk9WSURFUiBDSEFOTkVMUyIp
KSBsaXZlVHYgPSB0cnVlCiAgICAgICAgICAgICAgICBpZiAodmFsdWUuY29udGFpbnMoIkNIQU5O
RUwgQ0FURUdPUklFUyIpKSBjYXRlZ29yaWVzID0gdHJ1ZQogICAgICAgICAgICB9CiAgICAgICAg
fQogICAgICAgIHJldHVybiBsaXZlVHYgJiYgY2F0ZWdvcmllcwogICAgfQoKICAgIHByaXZhdGUg
ZnVuIGlzRGFzaGJvYXJkU2NyZWVuKHJvb3Q6IFZpZXcpOiBCb29sZWFuIHsKICAgICAgICB2YXIg
Y29ubmVjdGVkID0gZmFsc2UKICAgICAgICB2YXIgc3RyZWFtaW5nID0gZmFsc2UKICAgICAgICB2
aXNpdChyb290KSB7IHZpZXcgLT4KICAgICAgICAgICAgaWYgKHZpZXcgaXMgVGV4dFZpZXcpIHsK
ICAgICAgICAgICAgICAgIHZhbCB2YWx1ZSA9IHZpZXcudGV4dD8udG9TdHJpbmcoKT8udHJpbSgp
Py51cHBlcmNhc2UoTG9jYWxlLlVTKS5vckVtcHR5KCkKICAgICAgICAgICAgICAgIGlmICh2YWx1
ZS5zdGFydHNXaXRoKCJDT05ORUNURUQgQVMiKSkgY29ubmVjdGVkID0gdHJ1ZQogICAgICAgICAg
ICAgICAgaWYgKHZhbHVlID09ICJTVFJFQU1JTkciKSBzdHJlYW1pbmcgPSB0cnVlCiAgICAgICAg
ICAgIH0KICAgICAgICB9CiAgICAgICAgcmV0dXJuIGNvbm5lY3RlZCAmJiBzdHJlYW1pbmcKICAg
IH0KCiAgICBwcml2YXRlIGZ1biBzdHlsZUNoYW5uZWxMb2dvKGltYWdlOiBJbWFnZVZpZXcsIGRl
bnNpdHk6IEZsb2F0KSB7CiAgICAgICAgdmFsIHRpbGUgPSBmaW5kU3F1YXJlVGlsZShpbWFnZSwg
ZGVuc2l0eSkKICAgICAgICB0aWxlLmJhY2tncm91bmQgPSBHcmFkaWVudERyYXdhYmxlKCkuYXBw
bHkgewogICAgICAgICAgICBzaGFwZSA9IEdyYWRpZW50RHJhd2FibGUuUkVDVEFOR0xFCiAgICAg
ICAgICAgIGNvcm5lclJhZGl1cyA9IDEwZiAqIGRlbnNpdHkKICAgICAgICAgICAgc2V0Q29sb3Io
Q29sb3IucmdiKDI0NiwgMjQ2LCAyNDYpKQogICAgICAgICAgICBzZXRTdHJva2UobWF4KDEsIGRl
bnNpdHkudG9JbnQoKSksIENvbG9yLnJnYigxNTAsIDE1MCwgMTUwKSkKICAgICAgICB9CiAgICAg
ICAgaW1hZ2Uuc2NhbGVUeXBlID0gSW1hZ2VWaWV3LlNjYWxlVHlwZS5DRU5URVJfSU5TSURFCiAg
ICAgICAgdmFsIGluc2V0ID0gbWF4KDQsICg2ZiAqIGRlbnNpdHkpLnRvSW50KCkpCiAgICAgICAg
aW1hZ2Uuc2V0UGFkZGluZyhpbnNldCwgaW5zZXQsIGluc2V0LCBpbnNldCkKICAgICAgICBpbXBy
b3ZlRGFya0VtYmVkZGVkQmFja2dyb3VuZChpbWFnZSkKICAgIH0KCiAgICBwcml2YXRlIGZ1biBm
aW5kU3F1YXJlVGlsZShpbWFnZTogSW1hZ2VWaWV3LCBkZW5zaXR5OiBGbG9hdCk6IFZpZXcgewog
ICAgICAgIHZhciBiZXN0OiBWaWV3ID0gaW1hZ2UKICAgICAgICB2YXIgY2FuZGlkYXRlID0gaW1h
Z2UucGFyZW50IGFzPyBWaWV3CiAgICAgICAgcmVwZWF0KDMpIHsKICAgICAgICAgICAgY2FuZGlk
YXRlID86IHJldHVybkByZXBlYXQKICAgICAgICAgICAgdmFsIHdpZHRoRHAgPSBjYW5kaWRhdGUh
IS53aWR0aCAvIGRlbnNpdHkKICAgICAgICAgICAgdmFsIGhlaWdodERwID0gY2FuZGlkYXRlISEu
aGVpZ2h0IC8gZGVuc2l0eQogICAgICAgICAgICB2YWwgcmF0aW8gPSBpZiAoaGVpZ2h0RHAgPiAw
Zikgd2lkdGhEcCAvIGhlaWdodERwIGVsc2UgOTlmCiAgICAgICAgICAgIGlmICh3aWR0aERwIGlu
IDM0Zi4uMTE1ZiAmJiBoZWlnaHREcCBpbiAzNGYuLjExNWYgJiYgcmF0aW8gaW4gMC42MmYuLjEu
NjJmKSB7CiAgICAgICAgICAgICAgICBiZXN0ID0gY2FuZGlkYXRlISEKICAgICAgICAgICAgICAg
IGNhbmRpZGF0ZSA9IGNhbmRpZGF0ZSEhLnBhcmVudCBhcz8gVmlldwogICAgICAgICAgICB9IGVs
c2UgewogICAgICAgICAgICAgICAgY2FuZGlkYXRlID0gbnVsbAogICAgICAgICAgICB9CiAgICAg
ICAgfQogICAgICAgIHJldHVybiBiZXN0CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gbWFrZUhlYWRl
ckFydHdvcmtUcmFuc3BhcmVudChpbWFnZTogSW1hZ2VWaWV3LCBkZW5zaXR5OiBGbG9hdCkgewog
ICAgICAgIHZhbCBhcnR3b3JrID0gaW1hZ2UuZHJhd2FibGUgPzogaW1hZ2UuYmFja2dyb3VuZCA/
OiByZXR1cm4KICAgICAgICBpbWFnZS5iYWNrZ3JvdW5kID0gQ29sb3JEcmF3YWJsZShDb2xvci5U
UkFOU1BBUkVOVCkKICAgICAgICB2YXIgcGFyZW50ID0gaW1hZ2UucGFyZW50IGFzPyBWaWV3CiAg
ICAgICAgcmVwZWF0KDQpIHsKICAgICAgICAgICAgcGFyZW50ID86IHJldHVybkByZXBlYXQKICAg
ICAgICAgICAgdmFsIHdpZHRoRHAgPSBwYXJlbnQhIS53aWR0aCAvIGRlbnNpdHkKICAgICAgICAg
ICAgdmFsIGhlaWdodERwID0gcGFyZW50ISEuaGVpZ2h0IC8gZGVuc2l0eQogICAgICAgICAgICB2
YWwgbG9jYXRpb24gPSBJbnRBcnJheSgyKQogICAgICAgICAgICBwYXJlbnQhIS5nZXRMb2NhdGlv
bk9uU2NyZWVuKGxvY2F0aW9uKQogICAgICAgICAgICB2YWwgeERwID0gbG9jYXRpb25bMF0gLyBk
ZW5zaXR5CiAgICAgICAgICAgIHZhbCB5RHAgPSBsb2NhdGlvblsxXSAvIGRlbnNpdHkKICAgICAg
ICAgICAgaWYgKHhEcCA8IDE1NWYgJiYgeURwIDwgMTM1ZiAmJiB3aWR0aERwIGluIDM0Zi4uMTgw
ZiAmJiBoZWlnaHREcCBpbiAzNGYuLjE0MGYpIHsKICAgICAgICAgICAgICAgIHBhcmVudCEhLmJh
Y2tncm91bmQgPSBDb2xvckRyYXdhYmxlKENvbG9yLlRSQU5TUEFSRU5UKQogICAgICAgICAgICAg
ICAgcGFyZW50ID0gcGFyZW50ISEucGFyZW50IGFzPyBWaWV3CiAgICAgICAgICAgIH0gZWxzZSB7
CiAgICAgICAgICAgICAgICBwYXJlbnQgPSBudWxsCiAgICAgICAgICAgIH0KICAgICAgICB9Cgog
ICAgICAgIGlmIChwcm9jZXNzZWRIZWFkZXJzW2ltYWdlXSA9PT0gYXJ0d29yaykgcmV0dXJuCiAg
ICAgICAgdmFsIHNvdXJjZSA9IGRyYXdhYmxlVG9CaXRtYXAoYXJ0d29yaywgaW1hZ2UpID86IHJl
dHVybgogICAgICAgIHZhbCBvdXRwdXQgPSBzb3VyY2UuY29weShCaXRtYXAuQ29uZmlnLkFSR0Jf
ODg4OCwgdHJ1ZSkKICAgICAgICBmb3IgKHkgaW4gMCB1bnRpbCBvdXRwdXQuaGVpZ2h0KSB7CiAg
ICAgICAgICAgIGZvciAoeCBpbiAwIHVudGlsIG91dHB1dC53aWR0aCkgewogICAgICAgICAgICAg
ICAgdmFsIHBpeGVsID0gb3V0cHV0LmdldFBpeGVsKHgsIHkpCiAgICAgICAgICAgICAgICB2YWwg
cmVkID0gQ29sb3IucmVkKHBpeGVsKQogICAgICAgICAgICAgICAgdmFsIGdyZWVuID0gQ29sb3Iu
Z3JlZW4ocGl4ZWwpCiAgICAgICAgICAgICAgICB2YWwgYmx1ZSA9IENvbG9yLmJsdWUocGl4ZWwp
CiAgICAgICAgICAgICAgICBpZiAoQ29sb3IuYWxwaGEocGl4ZWwpID4gMCAmJiByZWQgPCA5MiAm
JiBncmVlbiA8IDkyICYmIGJsdWUgPCA5MiAmJgogICAgICAgICAgICAgICAgICAgIGFicyhyZWQg
LSBncmVlbikgPCAzMCAmJiBhYnMoZ3JlZW4gLSBibHVlKSA8IDMwCiAgICAgICAgICAgICAgICAp
IHsKICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc2V0UGl4ZWwoeCwgeSwgQ29sb3IuVFJBTlNQ
QVJFTlQpCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICAgICAg
aW1hZ2Uuc2V0SW1hZ2VCaXRtYXAob3V0cHV0KQogICAgICAgIGltYWdlLmRyYXdhYmxlPy5sZXQg
eyBwcm9jZXNzZWRIZWFkZXJzW2ltYWdlXSA9IGl0IH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biBj
bGVhclRvcExlZnRDb250YWluZXJzKHJvb3Q6IFZpZXcsIGRlbnNpdHk6IEZsb2F0KSB7CiAgICAg
ICAgdmlzaXQocm9vdCkgeyB2aWV3IC0+CiAgICAgICAgICAgIGlmICh2aWV3IGlzIFRleHRWaWV3
IHx8IHZpZXcgaXMgSW1hZ2VWaWV3IHx8IHZpZXcud2lkdGggPD0gMCB8fCB2aWV3LmhlaWdodCA8
PSAwKSByZXR1cm5AdmlzaXQKICAgICAgICAgICAgdmFsIGxvY2F0aW9uID0gSW50QXJyYXkoMikK
ICAgICAgICAgICAgdmlldy5nZXRMb2NhdGlvbk9uU2NyZWVuKGxvY2F0aW9uKQogICAgICAgICAg
ICB2YWwgeERwID0gbG9jYXRpb25bMF0gLyBkZW5zaXR5CiAgICAgICAgICAgIHZhbCB5RHAgPSBs
b2NhdGlvblsxXSAvIGRlbnNpdHkKICAgICAgICAgICAgdmFsIHdpZHRoRHAgPSB2aWV3LndpZHRo
IC8gZGVuc2l0eQogICAgICAgICAgICB2YWwgaGVpZ2h0RHAgPSB2aWV3LmhlaWdodCAvIGRlbnNp
dHkKICAgICAgICAgICAgaWYgKHhEcCA8IDIzMGYgJiYgeURwIDwgMTM1ZiAmJiB3aWR0aERwIGlu
IDM0Zi4uMjg1ZiAmJiBoZWlnaHREcCBpbiAyOGYuLjE0MGYpIHsKICAgICAgICAgICAgICAgIHZp
ZXcuYmFja2dyb3VuZCA9IENvbG9yRHJhd2FibGUoQ29sb3IuVFJBTlNQQVJFTlQpCiAgICAgICAg
ICAgIH0KICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gaW1wcm92ZURhcmtFbWJlZGRl
ZEJhY2tncm91bmQoaW1hZ2U6IEltYWdlVmlldykgewogICAgICAgIHZhbCBkcmF3YWJsZSA9IGlt
YWdlLmRyYXdhYmxlID86IHJldHVybgogICAgICAgIGlmIChwcm9jZXNzZWRMb2dvc1tpbWFnZV0g
PT09IGRyYXdhYmxlKSByZXR1cm4KICAgICAgICB2YWwgc291cmNlID0gZHJhd2FibGVUb0JpdG1h
cChkcmF3YWJsZSwgaW1hZ2UpID86IHJldHVybgogICAgICAgIHZhbCBjb3JuZXJzID0gbGlzdE9m
KAogICAgICAgICAgICBzb3VyY2UuZ2V0UGl4ZWwoMCwgMCksCiAgICAgICAgICAgIHNvdXJjZS5n
ZXRQaXhlbChzb3VyY2Uud2lkdGggLSAxLCAwKSwKICAgICAgICAgICAgc291cmNlLmdldFBpeGVs
KDAsIHNvdXJjZS5oZWlnaHQgLSAxKSwKICAgICAgICAgICAgc291cmNlLmdldFBpeGVsKHNvdXJj
ZS53aWR0aCAtIDEsIHNvdXJjZS5oZWlnaHQgLSAxKQogICAgICAgICkKICAgICAgICB2YWwgZGFy
a09wYXF1ZUNvcm5lcnMgPSBjb3JuZXJzLmNvdW50IHsgQ29sb3IuYWxwaGEoaXQpID49IDE4MCAm
JiBsdW1pbmFuY2UoaXQpIDwgNjUgfQogICAgICAgIGlmIChkYXJrT3BhcXVlQ29ybmVycyA8IDMp
IHsKICAgICAgICAgICAgcHJvY2Vzc2VkTG9nb3NbaW1hZ2VdID0gZHJhd2FibGUKICAgICAgICAg
ICAgcmV0dXJuCiAgICAgICAgfQoKICAgICAgICB2YXIgdmlzaWJsZSA9IDAKICAgICAgICB2YXIg
YnJpZ2h0ID0gMAogICAgICAgIHZhbCBzdGVwWCA9IG1heCgxLCBzb3VyY2Uud2lkdGggLyAyMCkK
ICAgICAgICB2YWwgc3RlcFkgPSBtYXgoMSwgc291cmNlLmhlaWdodCAvIDIwKQogICAgICAgIHZh
ciB5ID0gMAogICAgICAgIHdoaWxlICh5IDwgc291cmNlLmhlaWdodCkgewogICAgICAgICAgICB2
YXIgeCA9IDAKICAgICAgICAgICAgd2hpbGUgKHggPCBzb3VyY2Uud2lkdGgpIHsKICAgICAgICAg
ICAgICAgIHZhbCBwaXhlbCA9IHNvdXJjZS5nZXRQaXhlbCh4LCB5KQogICAgICAgICAgICAgICAg
aWYgKENvbG9yLmFscGhhKHBpeGVsKSA+PSAxMDApIHsKICAgICAgICAgICAgICAgICAgICB2aXNp
YmxlKysKICAgICAgICAgICAgICAgICAgICBpZiAobHVtaW5hbmNlKHBpeGVsKSA+IDE3NSkgYnJp
Z2h0KysKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIHggKz0gc3RlcFgKICAgICAg
ICAgICAgfQogICAgICAgICAgICB5ICs9IHN0ZXBZCiAgICAgICAgfQogICAgICAgIGlmICh2aXNp
YmxlID4gMCAmJiBicmlnaHQgKiAxMDAgPj0gdmlzaWJsZSAqIDQpIHsKICAgICAgICAgICAgcHJv
Y2Vzc2VkTG9nb3NbaW1hZ2VdID0gZHJhd2FibGUKICAgICAgICAgICAgcmV0dXJuCiAgICAgICAg
fQoKICAgICAgICB2YWwgb3V0cHV0ID0gc291cmNlLmNvcHkoQml0bWFwLkNvbmZpZy5BUkdCXzg4
ODgsIHRydWUpCiAgICAgICAgZm9yIChweSBpbiAwIHVudGlsIG91dHB1dC5oZWlnaHQpIHsKICAg
ICAgICAgICAgZm9yIChweCBpbiAwIHVudGlsIG91dHB1dC53aWR0aCkgewogICAgICAgICAgICAg
ICAgdmFsIHBpeGVsID0gb3V0cHV0LmdldFBpeGVsKHB4LCBweSkKICAgICAgICAgICAgICAgIHZh
bCByZWQgPSBDb2xvci5yZWQocGl4ZWwpCiAgICAgICAgICAgICAgICB2YWwgZ3JlZW4gPSBDb2xv
ci5ncmVlbihwaXhlbCkKICAgICAgICAgICAgICAgIHZhbCBibHVlID0gQ29sb3IuYmx1ZShwaXhl
bCkKICAgICAgICAgICAgICAgIGlmIChDb2xvci5hbHBoYShwaXhlbCkgPiAwICYmIHJlZCA8IDU4
ICYmIGdyZWVuIDwgNTggJiYgYmx1ZSA8IDU4ICYmCiAgICAgICAgICAgICAgICAgICAgYWJzKHJl
ZCAtIGdyZWVuKSA8IDE2ICYmIGFicyhncmVlbiAtIGJsdWUpIDwgMTYKICAgICAgICAgICAgICAg
ICkgewogICAgICAgICAgICAgICAgICAgIG91dHB1dC5zZXRQaXhlbChweCwgcHksIENvbG9yLmFy
Z2IoQ29sb3IuYWxwaGEocGl4ZWwpLCAyNDYsIDI0NiwgMjQ2KSkKICAgICAgICAgICAgICAgIH0K
ICAgICAgICAgICAgfQogICAgICAgIH0KICAgICAgICBpbWFnZS5zZXRJbWFnZUJpdG1hcChvdXRw
dXQpCiAgICAgICAgaW1hZ2UuZHJhd2FibGU/LmxldCB7IHByb2Nlc3NlZExvZ29zW2ltYWdlXSA9
IGl0IH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biBkcmF3YWJsZVRvQml0bWFwKGRyYXdhYmxlOiBE
cmF3YWJsZSwgaW1hZ2U6IEltYWdlVmlldyk6IEJpdG1hcD8gewogICAgICAgIHZhbCB3aWR0aCA9
IGltYWdlLndpZHRoLmNvZXJjZUluKDEsIDI1NikKICAgICAgICB2YWwgaGVpZ2h0ID0gaW1hZ2Uu
aGVpZ2h0LmNvZXJjZUluKDEsIDI1NikKICAgICAgICByZXR1cm4gcnVuQ2F0Y2hpbmcgewogICAg
ICAgICAgICBCaXRtYXAuY3JlYXRlQml0bWFwKHdpZHRoLCBoZWlnaHQsIEJpdG1hcC5Db25maWcu
QVJHQl84ODg4KS5hbHNvIHsgYml0bWFwIC0+CiAgICAgICAgICAgICAgICB2YWwgY2FudmFzID0g
Q2FudmFzKGJpdG1hcCkKICAgICAgICAgICAgICAgIHZhbCBvbGRCb3VuZHMgPSBSZWN0KGRyYXdh
YmxlLmJvdW5kcykKICAgICAgICAgICAgICAgIGRyYXdhYmxlLnNldEJvdW5kcygwLCAwLCB3aWR0
aCwgaGVpZ2h0KQogICAgICAgICAgICAgICAgZHJhd2FibGUuZHJhdyhjYW52YXMpCiAgICAgICAg
ICAgICAgICBkcmF3YWJsZS5zZXRCb3VuZHMob2xkQm91bmRzKQogICAgICAgICAgICB9CiAgICAg
ICAgfS5nZXRPck51bGwoKQogICAgfQoKICAgIHByaXZhdGUgZnVuIGx1bWluYW5jZShjb2xvcjog
SW50KTogSW50IHsKICAgICAgICByZXR1cm4gKENvbG9yLnJlZChjb2xvcikgKiAyOTkgKyBDb2xv
ci5ncmVlbihjb2xvcikgKiA1ODcgKyBDb2xvci5ibHVlKGNvbG9yKSAqIDExNCkgLyAxMDAwCiAg
ICB9CgogICAgcHJpdmF0ZSBmdW4gdmlzaXQocm9vdDogVmlldywgYWN0aW9uOiAoVmlldykgLT4g
VW5pdCkgewogICAgICAgIGFjdGlvbihyb290KQogICAgICAgIGlmIChyb290IGlzIFZpZXdHcm91
cCkgewogICAgICAgICAgICBmb3IgKGluZGV4IGluIDAgdW50aWwgcm9vdC5jaGlsZENvdW50KSB2
aXNpdChyb290LmdldENoaWxkQXQoaW5kZXgpLCBhY3Rpb24pCiAgICAgICAgfQogICAgfQp9Cg==
:::END UICONTEXT

:::BEGIN UIPATCH
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV0KICAgIFtzdHJpbmddJFBy
b2plY3RSb290CikKCiRtYW5pZmVzdCA9IEpvaW4tUGF0aCAkUHJvamVjdFJvb3QgJ2FwcFxzcmNc
bWFpblxBbmRyb2lkTWFuaWZlc3QueG1sJwppZiAoLW5vdCAoVGVzdC1QYXRoIC1MaXRlcmFsUGF0
aCAkbWFuaWZlc3QpKSB7CiAgICB0aHJvdyAiQW5kcm9pZCBtYW5pZmVzdCBub3QgZm91bmQ6ICRt
YW5pZmVzdCIKfQoKJGNvbnRlbnQgPSBbSU8uRmlsZV06OlJlYWRBbGxUZXh0KCRtYW5pZmVzdCkK
aWYgKCRjb250ZW50IC1ub3RtYXRjaCAnVWlDb250cmFzdFByb3ZpZGVyJykgewogICAgJHByb3Zp
ZGVyID0gJyAgICAgICAgPHByb3ZpZGVyIGFuZHJvaWQ6bmFtZT0iLlVpQ29udHJhc3RQcm92aWRl
ciIgYW5kcm9pZDphdXRob3JpdGllcz0iJHthcHBsaWNhdGlvbklkfS51aV9jb250cmFzdCIgYW5k
cm9pZDpleHBvcnRlZD0iZmFsc2UiIGFuZHJvaWQ6aW5pdE9yZGVyPSIxMDAiIC8+JwogICAgaWYg
KCRjb250ZW50IC1ub3RtYXRjaCAnPC9hcHBsaWNhdGlvbj4nKSB7CiAgICAgICAgdGhyb3cgJ0Fu
ZHJvaWQgbWFuaWZlc3QgYXBwbGljYXRpb24gZWxlbWVudCB3YXMgbm90IGZvdW5kLicKICAgIH0K
ICAgICRjb250ZW50ID0gJGNvbnRlbnQuUmVwbGFjZSgnPC9hcHBsaWNhdGlvbj4nLCAiJHByb3Zp
ZGVyYHJgbiAgICA8L2FwcGxpY2F0aW9uPiIpCiAgICBbSU8uRmlsZV06OldyaXRlQWxsVGV4dCgk
bWFuaWZlc3QsICRjb250ZW50LCBbVGV4dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNlKSkKfQo=
:::END UIPATCH
