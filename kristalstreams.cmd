@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Kristal Streams Adaptive Logo Contrast

set "SOURCE=C:\KristalStreams168RC1R2\KristalStreams-1.6.8-RC1-R2-LEGACY-DEMO-FIX"
for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%T"
set "WORK=C:\ksepglogocontrast-!STAMP!"
set "FINAL=%USERPROFILE%\Downloads\KS-EPG-LOGO-CONTRAST-1682008.apk"
set "LOG=%TEMP%\kristalstreams-epg-logo-contrast-build.txt"
set "JAVASAVE=%USERPROFILE%\.kristalstreams-java-home.txt"

echo.
echo ==========================================================
echo   KRISTAL STREAMS 1.6.8 RC1 R2 - ADAPTIVE LOGO CONTRAST
echo   FRESH APK: KS-EPG-LOGO-CONTRAST-1682008.apk
echo ==========================================================
echo.
echo Baseline: known-good R2
echo Gives dark and light provider logos an adaptive contrast background.
echo The working program cards, timing, and details panel are unchanged.
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

echo [2/6] Installing adaptive logo contrast...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; function B([string]$n){$a=':::BEGIN '+$n;$b=':::END '+$n;$s=$raw.IndexOf($a);if($s -lt 0){throw 'Missing '+$a};$s+=$a.Length;$e=$raw.IndexOf($b,$s);if($e -lt 0){throw 'Missing '+$b};$x=$raw.Substring($s,$e-$s)-replace '\s','';[Convert]::FromBase64String($x)}; [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\Models.kt',(B 'MODELS')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\XtreamClient.kt',(B 'XTREAM')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt',(B 'GUIDE')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt',(B 'ADAPTER')); [IO.File]::WriteAllBytes('%WORK%\app\build.gradle.kts',(B 'GRADLE')); [IO.File]::WriteAllBytes('%WORK%\REFERENCE-EPG-AUDIT.txt',(B 'AUDIT'))"
if errorlevel 1 (
    echo ERROR: Could not install adaptive logo contrast.
    pause
    exit /b 1
)

echo [3/6] Verifying adaptive logo contrast...
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
findstr /c:"val channelLogo = ImageView" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Channel logo view verification failed.
    pause
    exit /b 1
)
findstr /c:"fun loadChannelLogo(" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Channel logo loader verification failed.
    pause
    exit /b 1
)
findstr /c:"logoCache" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Channel logo cache verification failed.
    pause
    exit /b 1
)
findstr /c:"fun logoContrastBackground(" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Adaptive logo contrast verification failed.
    pause
    exit /b 1
)
findstr /c:"fun channelBadge(" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Channel badge fallback verification failed.
    pause
    exit /b 1
)
findstr /c:"1.6.8-epg-logo-contrast" "%WORK%\app\build.gradle.kts" >nul
if errorlevel 1 (
    echo ERROR: EPG logo-contrast version verification failed.
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
echo [5/6] Building adaptive logo contrast...
echo Gradle progress will appear below.
echo.

cd /d "%WORK%"
set "BUILDPS=%TEMP%\ks_epg_logo_contrast_gradle_build.ps1"
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
    set "USBCOPY=!USBDRIVE!\KS-EPG-LOGO-CONTRAST-1682008.apk"
    copy /Y "%BUILT%" "!USBCOPY!" >nul
)

color 2F
cls
echo.
echo ==========================================================
echo.
echo       KRISTAL STREAMS ADAPTIVE LOGO CONTRAST BUILD SUCCESSFUL
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
echo Install only KS-EPG-LOGO-CONTRAST-1682008.apk shown above.
echo Dark logos use white tiles; light logos use dark tiles.
echo Missing logo images show a readable channel badge such as BET.
echo The approved EPG grid, program cards, timing, and details remain unchanged.
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
LkNvbnRleHQKaW1wb3J0IGFuZHJvaWQuZ3JhcGhpY3MuQml0bWFwCmltcG9ydCBhbmRyb2lkLmdy
YXBoaWNzLkJpdG1hcEZhY3RvcnkKaW1wb3J0IGFuZHJvaWQuZ3JhcGhpY3MuQ29sb3IKaW1wb3J0
IGFuZHJvaWQudGV4dC5UZXh0VXRpbHMKaW1wb3J0IGFuZHJvaWQudXRpbC5McnVDYWNoZQppbXBv
cnQgYW5kcm9pZC51dGlsLlR5cGVkVmFsdWUKaW1wb3J0IGFuZHJvaWQudmlldy5HcmF2aXR5Cmlt
cG9ydCBhbmRyb2lkLnZpZXcuVmlldwppbXBvcnQgYW5kcm9pZC52aWV3LlZpZXdHcm91cAppbXBv
cnQgYW5kcm9pZC53aWRnZXQuQXJyYXlBZGFwdGVyCmltcG9ydCBhbmRyb2lkLndpZGdldC5GcmFt
ZUxheW91dAppbXBvcnQgYW5kcm9pZC53aWRnZXQuSG9yaXpvbnRhbFNjcm9sbFZpZXcKaW1wb3J0
IGFuZHJvaWQud2lkZ2V0LkltYWdlVmlldwppbXBvcnQgYW5kcm9pZC53aWRnZXQuTGluZWFyTGF5
b3V0CmltcG9ydCBhbmRyb2lkLndpZGdldC5UZXh0VmlldwppbXBvcnQgYW5kcm9pZHguY29yZS53
aWRnZXQuVGV4dFZpZXdDb21wYXQKaW1wb3J0IGphdmEudGV4dC5TaW1wbGVEYXRlRm9ybWF0Cmlt
cG9ydCBqYXZhLnV0aWwuQ29sbGVjdGlvbnMKaW1wb3J0IGphdmEudXRpbC5EYXRlCmltcG9ydCBq
YXZhLnV0aWwuTG9jYWxlCmltcG9ydCBqYXZhLnV0aWwuV2Vha0hhc2hNYXAKaW1wb3J0IGphdmEu
bmV0LlVSTAppbXBvcnQgamF2YS51dGlsLmNvbmN1cnJlbnQuRXhlY3V0b3JzCmltcG9ydCBrb3Rs
aW4ubWF0aC5tYXgKaW1wb3J0IGtvdGxpbi5tYXRoLm1pbgoKLyoqCiAqIENvbXBsZXRlIGZpeGVk
LWdyaWQgRVBHIHJlbmRlcmVyLgogKgogKiBUaGUgcHJldmlvdXMgdmFyaWFibGUtd2lkdGggRnJh
bWVMYXlvdXQgcmVuZGVyZXIgaGFzIGJlZW4gcmVtb3ZlZC4gRXZlcnkKICogY2hhbm5lbCBvd25z
IGV4YWN0bHkgb25lIGhvcml6b250YWwgbGFuZSBidWlsdCBvbiBhIGZpdmUtbWludXRlIGdyaWQg
YWxpZ25lZAogKiB3aXRoIHRoZSB0aW1lIGhlYWRlci4gQ29uc2VjdXRpdmUgc2xpY2VzIGJlbG9u
Z2luZyB0byB0aGUgc2FtZSBwcm9ncmFtbWUgYXJlCiAqIG1lcmdlZCBpbnRvIG9uZSBkdXJhdGlv
bi13aWR0aCBjYXJkLCB3aGlsZSBldmVyeSBzbGljZSBzdGlsbCBzZWxlY3RzIGF0IG1vc3QKICog
b25lIHByb3ZpZGVyIHByb2dyYW1tZS4gU3RhY2tpbmcgYW5kIG92ZXJsYXAgcmVtYWluIHN0cnVj
dHVyYWxseSBpbXBvc3NpYmxlLgogKi8KY2xhc3MgRXBnR3VpZGVBZGFwdGVyKAogICAgcHJpdmF0
ZSB2YWwgcm93Q29udGV4dDogQ29udGV4dCwKICAgIHByaXZhdGUgdmFsIGNoYW5uZWxzOiBMaXN0
PExpdmVTdHJlYW0+LAogICAgcHJpdmF0ZSB2YWwgZ3VpZGVQcm92aWRlcjogKExpdmVTdHJlYW0p
IC0+IExpc3Q8RXBnSXRlbT4/LAogICAgcHJpdmF0ZSB2YWwgdGltZWxpbmVTdGFydE1zOiBMb25n
LAogICAgcHJpdmF0ZSB2YWwgdGltZWxpbmVFbmRNczogTG9uZywKICAgIHByaXZhdGUgdmFsIHBp
eGVsc1Blck1pbnV0ZURwOiBJbnQsCiAgICBwcml2YXRlIHZhbCBjaGFubmVsV2lkdGhEcDogSW50
LAogICAgcHJpdmF0ZSB2YWwgb25Qcm9ncmFtRm9jdXNlZDogKExpdmVTdHJlYW0sIEVwZ0l0ZW0s
IExvbmcsIExvbmcsIEJvb2xlYW4pIC0+IFVuaXQsCiAgICBwcml2YXRlIHZhbCBvblByb2dyYW1D
bGlja2VkOiAoTGl2ZVN0cmVhbSwgRXBnSXRlbSwgTG9uZywgTG9uZywgQm9vbGVhbikgLT4gVW5p
dCwKICAgIHByaXZhdGUgdmFsIG9uSG9yaXpvbnRhbENoYW5nZWQ6IChJbnQpIC0+IFVuaXQKKSA6
IEFycmF5QWRhcHRlcjxMaXZlU3RyZWFtPihyb3dDb250ZXh0LCBhbmRyb2lkLlIubGF5b3V0LnNp
bXBsZV9saXN0X2l0ZW1fMSwgY2hhbm5lbHMpIHsKCiAgICBjb21wYW5pb24gb2JqZWN0IHsKICAg
ICAgICBwcml2YXRlIHZhbCBsb2dvRXhlY3V0b3IgPSBFeGVjdXRvcnMubmV3Rml4ZWRUaHJlYWRQ
b29sKDQpCiAgICAgICAgcHJpdmF0ZSB2YWwgbG9nb0NhY2hlID0gb2JqZWN0IDogTHJ1Q2FjaGU8
U3RyaW5nLCBCaXRtYXA+KDgwKSB7fQogICAgfQoKICAgIHByaXZhdGUgZGF0YSBjbGFzcyBSZXNv
bHZlZEV2ZW50KAogICAgICAgIHZhbCBpdGVtOiBFcGdJdGVtLAogICAgICAgIHZhbCBzdGFydE1z
OiBMb25nLAogICAgICAgIHZhbCBlbmRNczogTG9uZwogICAgKQoKICAgIHByaXZhdGUgdmFsIHZp
c2libGVTY3JvbGxzID0gQ29sbGVjdGlvbnMubmV3U2V0RnJvbU1hcChXZWFrSGFzaE1hcDxIb3Jp
em9udGFsU2Nyb2xsVmlldywgQm9vbGVhbj4oKSkKICAgIHByaXZhdGUgdmFyIHN5bmNpbmcgPSBm
YWxzZQogICAgcHJpdmF0ZSB2YXIgZ2xvYmFsU2Nyb2xsWCA9IDAKICAgIHByaXZhdGUgdmFsIG5v
d01zOiBMb25nIGdldCgpID0gU3lzdGVtLmN1cnJlbnRUaW1lTWlsbGlzKCkKICAgIHByaXZhdGUg
dmFsIHJvd0hlaWdodFB4ID0gODYuZHAKICAgIHByaXZhdGUgdmFsIHNsb3RNcyA9IDMwICogNjBf
MDAwTAogICAgcHJpdmF0ZSB2YWwgcXVhbnR1bU1zID0gNSAqIDYwXzAwMEwKICAgIHByaXZhdGUg
dmFsIHF1YW50dW1XaWR0aFB4ID0gKDUgKiBwaXhlbHNQZXJNaW51dGVEcCkuZHAKICAgIHByaXZh
dGUgdmFsIHF1YW50dW1Db3VudCA9ICgoKHRpbWVsaW5lRW5kTXMgLSB0aW1lbGluZVN0YXJ0TXMp
ICsgcXVhbnR1bU1zIC0gMUwpIC8gcXVhbnR1bU1zKS50b0ludCgpCiAgICBwcml2YXRlIHZhbCB0
aW1lbGluZVdpZHRoUHggPSBxdWFudHVtQ291bnQgKiBxdWFudHVtV2lkdGhQeAoKICAgIG92ZXJy
aWRlIGZ1biBnZXRDb3VudCgpOiBJbnQgPSBjaGFubmVscy5zaXplCgogICAgb3ZlcnJpZGUgZnVu
IGdldFZpZXcocG9zaXRpb246IEludCwgY29udmVydFZpZXc6IFZpZXc/LCBwYXJlbnQ6IFZpZXdH
cm91cCk6IFZpZXcgewogICAgICAgIHZhbCBjaGFubmVsID0gY2hhbm5lbHNbcG9zaXRpb25dCiAg
ICAgICAgdmFsIHJvb3QgPSBMaW5lYXJMYXlvdXQocm93Q29udGV4dCkuYXBwbHkgewogICAgICAg
ICAgICBvcmllbnRhdGlvbiA9IExpbmVhckxheW91dC5IT1JJWk9OVEFMCiAgICAgICAgICAgIGdy
YXZpdHkgPSBHcmF2aXR5LkNFTlRFUl9WRVJUSUNBTAogICAgICAgICAgICBsYXlvdXRQYXJhbXMg
PSBWaWV3R3JvdXAuTGF5b3V0UGFyYW1zKFZpZXdHcm91cC5MYXlvdXRQYXJhbXMuTUFUQ0hfUEFS
RU5ULCByb3dIZWlnaHRQeCkKICAgICAgICAgICAgc2V0UGFkZGluZygwLCAzLmRwLCAwLCAzLmRw
KQogICAgICAgICAgICBkZXNjZW5kYW50Rm9jdXNhYmlsaXR5ID0gVmlld0dyb3VwLkZPQ1VTX0FG
VEVSX0RFU0NFTkRBTlRTCiAgICAgICAgfQoKICAgICAgICB2YWwgY2hhbm5lbENlbGwgPSBMaW5l
YXJMYXlvdXQocm93Q29udGV4dCkuYXBwbHkgewogICAgICAgICAgICBvcmllbnRhdGlvbiA9IExp
bmVhckxheW91dC5IT1JJWk9OVEFMCiAgICAgICAgICAgIGdyYXZpdHkgPSBHcmF2aXR5LkNFTlRF
Ul9WRVJUSUNBTAogICAgICAgICAgICBzZXRQYWRkaW5nKDYuZHAsIDUuZHAsIDcuZHAsIDUuZHAp
CiAgICAgICAgICAgIHNldEJhY2tncm91bmRSZXNvdXJjZShSLmRyYXdhYmxlLmJnX2VwZ19jaGFu
bmVsKQogICAgICAgICAgICBpc0ZvY3VzYWJsZSA9IGZhbHNlCiAgICAgICAgICAgIGlzQ2xpY2th
YmxlID0gZmFsc2UKICAgICAgICB9CgogICAgICAgIHZhbCBsb2dvVGlsZSA9IEZyYW1lTGF5b3V0
KHJvd0NvbnRleHQpLmFwcGx5IHsKICAgICAgICAgICAgc2V0QmFja2dyb3VuZENvbG9yKENvbG9y
LldISVRFKQogICAgICAgICAgICBjb250ZW50RGVzY3JpcHRpb24gPSAiJHtjaGFubmVsLm5hbWV9
IGxvZ28iCiAgICAgICAgfQogICAgICAgIHZhbCBsb2dvRmFsbGJhY2sgPSBUZXh0Vmlldyhyb3dD
b250ZXh0KS5hcHBseSB7CiAgICAgICAgICAgIHRleHQgPSBjaGFubmVsQmFkZ2UoY2hhbm5lbC5u
YW1lKQogICAgICAgICAgICBzZXRUZXh0Q29sb3IoQ29sb3IuQkxBQ0spCiAgICAgICAgICAgIHRl
eHRTaXplID0gMTBmCiAgICAgICAgICAgIHNldFR5cGVmYWNlKHR5cGVmYWNlLCBhbmRyb2lkLmdy
YXBoaWNzLlR5cGVmYWNlLkJPTEQpCiAgICAgICAgICAgIGdyYXZpdHkgPSBHcmF2aXR5LkNFTlRF
UgogICAgICAgICAgICBtYXhMaW5lcyA9IDEKICAgICAgICAgICAgaW5jbHVkZUZvbnRQYWRkaW5n
ID0gZmFsc2UKICAgICAgICB9CiAgICAgICAgbG9nb1RpbGUuYWRkVmlldygKICAgICAgICAgICAg
bG9nb0ZhbGxiYWNrLAogICAgICAgICAgICBGcmFtZUxheW91dC5MYXlvdXRQYXJhbXMoCiAgICAg
ICAgICAgICAgICBGcmFtZUxheW91dC5MYXlvdXRQYXJhbXMuTUFUQ0hfUEFSRU5ULAogICAgICAg
ICAgICAgICAgRnJhbWVMYXlvdXQuTGF5b3V0UGFyYW1zLk1BVENIX1BBUkVOVAogICAgICAgICAg
ICApCiAgICAgICAgKQoKICAgICAgICB2YWwgY2hhbm5lbExvZ28gPSBJbWFnZVZpZXcocm93Q29u
dGV4dCkuYXBwbHkgewogICAgICAgICAgICBzY2FsZVR5cGUgPSBJbWFnZVZpZXcuU2NhbGVUeXBl
LkNFTlRFUl9JTlNJREUKICAgICAgICAgICAgc2V0QmFja2dyb3VuZENvbG9yKENvbG9yLlRSQU5T
UEFSRU5UKQogICAgICAgICAgICBzZXRQYWRkaW5nKDQuZHAsIDQuZHAsIDQuZHAsIDQuZHApCiAg
ICAgICAgICAgIGNvbnRlbnREZXNjcmlwdGlvbiA9ICIke2NoYW5uZWwubmFtZX0gbG9nbyIKICAg
ICAgICB9CiAgICAgICAgbG9nb1RpbGUuYWRkVmlldygKICAgICAgICAgICAgY2hhbm5lbExvZ28s
CiAgICAgICAgICAgIEZyYW1lTGF5b3V0LkxheW91dFBhcmFtcygKICAgICAgICAgICAgICAgIEZy
YW1lTGF5b3V0LkxheW91dFBhcmFtcy5NQVRDSF9QQVJFTlQsCiAgICAgICAgICAgICAgICBGcmFt
ZUxheW91dC5MYXlvdXRQYXJhbXMuTUFUQ0hfUEFSRU5UCiAgICAgICAgICAgICkKICAgICAgICAp
CiAgICAgICAgY2hhbm5lbENlbGwuYWRkVmlldygKICAgICAgICAgICAgbG9nb1RpbGUsCiAgICAg
ICAgICAgIExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMoNDguZHAsIDQ4LmRwKS5hcHBseSB7IG1h
cmdpbkVuZCA9IDcuZHAgfQogICAgICAgICkKCiAgICAgICAgdmFsIGNoYW5uZWxMYWJlbCA9IFRl
eHRWaWV3KHJvd0NvbnRleHQpLmFwcGx5IHsKICAgICAgICAgICAgdGV4dCA9IFN0cmluZy5mb3Jt
YXQoTG9jYWxlLmdldERlZmF1bHQoKSwgIiUwM2RcbiVzIiwgcG9zaXRpb24gKyAxLCBjaGFubmVs
Lm5hbWUpCiAgICAgICAgICAgIHNldFRleHRDb2xvcihDb2xvci5XSElURSkKICAgICAgICAgICAg
dGV4dFNpemUgPSAxM2YKICAgICAgICAgICAgc2V0VHlwZWZhY2UodHlwZWZhY2UsIGFuZHJvaWQu
Z3JhcGhpY3MuVHlwZWZhY2UuQk9MRCkKICAgICAgICAgICAgZ3Jhdml0eSA9IEdyYXZpdHkuQ0VO
VEVSX1ZFUlRJQ0FMCiAgICAgICAgICAgIHRleHRBbGlnbm1lbnQgPSBWaWV3LlRFWFRfQUxJR05N
RU5UX1ZJRVdfU1RBUlQKICAgICAgICAgICAgbWF4TGluZXMgPSAzCiAgICAgICAgICAgIGVsbGlw
c2l6ZSA9IFRleHRVdGlscy5UcnVuY2F0ZUF0LkVORAogICAgICAgICAgICBpbmNsdWRlRm9udFBh
ZGRpbmcgPSBmYWxzZQogICAgICAgICAgICBzZXRMaW5lU3BhY2luZygwZiwgMC45NGYpCiAgICAg
ICAgICAgIFRleHRWaWV3Q29tcGF0LnNldEF1dG9TaXplVGV4dFR5cGVVbmlmb3JtV2l0aENvbmZp
Z3VyYXRpb24oCiAgICAgICAgICAgICAgICB0aGlzLAogICAgICAgICAgICAgICAgOSwKICAgICAg
ICAgICAgICAgIDEzLAogICAgICAgICAgICAgICAgMSwKICAgICAgICAgICAgICAgIFR5cGVkVmFs
dWUuQ09NUExFWF9VTklUX1NQCiAgICAgICAgICAgICkKICAgICAgICAgICAgaXNGb2N1c2FibGUg
PSBmYWxzZQogICAgICAgICAgICBpc0NsaWNrYWJsZSA9IGZhbHNlCiAgICAgICAgfQogICAgICAg
IGNoYW5uZWxDZWxsLmFkZFZpZXcoCiAgICAgICAgICAgIGNoYW5uZWxMYWJlbCwKICAgICAgICAg
ICAgTGluZWFyTGF5b3V0LkxheW91dFBhcmFtcygwLCBMaW5lYXJMYXlvdXQuTGF5b3V0UGFyYW1z
Lk1BVENIX1BBUkVOVCwgMWYpCiAgICAgICAgKQogICAgICAgIGxvYWRDaGFubmVsTG9nbyhjaGFu
bmVsLmljb24sIGNoYW5uZWxMb2dvLCBsb2dvVGlsZSwgbG9nb0ZhbGxiYWNrKQogICAgICAgIHJv
b3QuYWRkVmlldygKICAgICAgICAgICAgY2hhbm5lbENlbGwsCiAgICAgICAgICAgIExpbmVhckxh
eW91dC5MYXlvdXRQYXJhbXMoY2hhbm5lbFdpZHRoRHAuZHAsIExpbmVhckxheW91dC5MYXlvdXRQ
YXJhbXMuTUFUQ0hfUEFSRU5UKS5hcHBseSB7CiAgICAgICAgICAgICAgICBtYXJnaW5FbmQgPSA2
LmRwCiAgICAgICAgICAgIH0KICAgICAgICApCgogICAgICAgIHZhbCBzY3JvbGwgPSBIb3Jpem9u
dGFsU2Nyb2xsVmlldyhyb3dDb250ZXh0KS5hcHBseSB7CiAgICAgICAgICAgIGlzSG9yaXpvbnRh
bFNjcm9sbEJhckVuYWJsZWQgPSBmYWxzZQogICAgICAgICAgICBpc0ZpbGxWaWV3cG9ydCA9IGZh
bHNlCiAgICAgICAgICAgIG92ZXJTY3JvbGxNb2RlID0gVmlldy5PVkVSX1NDUk9MTF9ORVZFUgog
ICAgICAgICAgICBpc0ZvY3VzYWJsZSA9IGZhbHNlCiAgICAgICAgICAgIGRlc2NlbmRhbnRGb2N1
c2FiaWxpdHkgPSBWaWV3R3JvdXAuRk9DVVNfQUZURVJfREVTQ0VOREFOVFMKICAgICAgICB9CiAg
ICAgICAgdmlzaWJsZVNjcm9sbHMuYWRkKHNjcm9sbCkKCiAgICAgICAgdmFsIGNhbnZhcyA9IEZy
YW1lTGF5b3V0KHJvd0NvbnRleHQpLmFwcGx5IHsKICAgICAgICAgICAgbGF5b3V0UGFyYW1zID0g
Vmlld0dyb3VwLkxheW91dFBhcmFtcyh0aW1lbGluZVdpZHRoUHgsIExpbmVhckxheW91dC5MYXlv
dXRQYXJhbXMuTUFUQ0hfUEFSRU5UKQogICAgICAgICAgICBzZXRCYWNrZ3JvdW5kQ29sb3Iocm93
Q29udGV4dC5nZXRDb2xvcihSLmNvbG9yLmtzX2d1aWRlX2NhbnZhcykpCiAgICAgICAgfQoKICAg
ICAgICB2YWwgbGFuZSA9IExpbmVhckxheW91dChyb3dDb250ZXh0KS5hcHBseSB7CiAgICAgICAg
ICAgIG9yaWVudGF0aW9uID0gTGluZWFyTGF5b3V0LkhPUklaT05UQUwKICAgICAgICAgICAgZ3Jh
dml0eSA9IEdyYXZpdHkuQ0VOVEVSX1ZFUlRJQ0FMCiAgICAgICAgfQogICAgICAgIGNhbnZhcy5h
ZGRWaWV3KAogICAgICAgICAgICBsYW5lLAogICAgICAgICAgICBGcmFtZUxheW91dC5MYXlvdXRQ
YXJhbXModGltZWxpbmVXaWR0aFB4LCA3NC5kcCkuYXBwbHkgeyB0b3BNYXJnaW4gPSAzLmRwIH0K
ICAgICAgICApCgogICAgICAgIHZhbCBndWlkZSA9IGd1aWRlUHJvdmlkZXIoY2hhbm5lbCkKICAg
ICAgICB2YWwgZXZlbnRzID0gZ3VpZGU/LmxldCB7IHJlc29sdmVFdmVudHMoaXQpIH0ub3JFbXB0
eSgpCgogICAgICAgIHZhbCBzZWxlY3RlZCA9IExpc3QocXVhbnR1bUNvdW50KSB7IHF1YW50dW1J
bmRleCAtPgogICAgICAgICAgICBpZiAoZ3VpZGUgPT0gbnVsbCkgbnVsbAogICAgICAgICAgICBl
bHNlIHsKICAgICAgICAgICAgICAgIHZhbCBxdWFudHVtU3RhcnQgPSB0aW1lbGluZVN0YXJ0TXMg
KyBxdWFudHVtSW5kZXggKiBxdWFudHVtTXMKICAgICAgICAgICAgICAgIHZhbCBxdWFudHVtRW5k
ID0gbWluKHF1YW50dW1TdGFydCArIHF1YW50dW1NcywgdGltZWxpbmVFbmRNcykKICAgICAgICAg
ICAgICAgIHByb2dyYW1Gb3JTbG90KGV2ZW50cywgcXVhbnR1bVN0YXJ0LCBxdWFudHVtRW5kKQog
ICAgICAgICAgICB9CiAgICAgICAgfQoKICAgICAgICB2YXIgcXVhbnR1bUluZGV4ID0gMAogICAg
ICAgIHdoaWxlIChxdWFudHVtSW5kZXggPCBxdWFudHVtQ291bnQpIHsKICAgICAgICAgICAgdmFs
IGV2ZW50ID0gc2VsZWN0ZWRbcXVhbnR1bUluZGV4XQogICAgICAgICAgICB2YWwgbG9hZGluZyA9
IGd1aWRlID09IG51bGwKICAgICAgICAgICAgdmFyIHNwYW4gPSAxCiAgICAgICAgICAgIGlmIChl
dmVudCAhPSBudWxsKSB7CiAgICAgICAgICAgICAgICB3aGlsZSAoCiAgICAgICAgICAgICAgICAg
ICAgcXVhbnR1bUluZGV4ICsgc3BhbiA8IHF1YW50dW1Db3VudCAmJgogICAgICAgICAgICAgICAg
ICAgIHNhbWVQcm9ncmFtbWUoZXZlbnQsIHNlbGVjdGVkW3F1YW50dW1JbmRleCArIHNwYW5dKQog
ICAgICAgICAgICAgICAgKSB7CiAgICAgICAgICAgICAgICAgICAgc3BhbisrCiAgICAgICAgICAg
ICAgICB9CiAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgICAvLyBLZWVwIGxvYWRp
bmcgYW5kIG1pc3NpbmctZGF0YSBwbGFjZWhvbGRlcnMgcmVhZGFibGUgaW4KICAgICAgICAgICAg
ICAgIC8vIHJlZ3VsYXIgaGFsZi1ob3VyIGJsb2NrcyBpbnN0ZWFkIG9mIG9uZSBlaWdodC1ob3Vy
IGNhcmQuCiAgICAgICAgICAgICAgICB3aGlsZSAoCiAgICAgICAgICAgICAgICAgICAgc3BhbiA8
IDYgJiYKICAgICAgICAgICAgICAgICAgICBxdWFudHVtSW5kZXggKyBzcGFuIDwgcXVhbnR1bUNv
dW50ICYmCiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRbcXVhbnR1bUluZGV4ICsgc3Bhbl0g
PT0gbnVsbAogICAgICAgICAgICAgICAgKSB7CiAgICAgICAgICAgICAgICAgICAgc3BhbisrCiAg
ICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KCiAgICAgICAgICAgIHZhbCB2aXNpYmxlU3Rh
cnQgPSB0aW1lbGluZVN0YXJ0TXMgKyBxdWFudHVtSW5kZXggKiBxdWFudHVtTXMKICAgICAgICAg
ICAgdmFsIHZpc2libGVFbmQgPSBtaW4odmlzaWJsZVN0YXJ0ICsgc3BhbiAqIHF1YW50dW1Ncywg
dGltZWxpbmVFbmRNcykKICAgICAgICAgICAgdmFsIGl0ZW0gPSBldmVudD8uaXRlbSA/OiBFcGdJ
dGVtKAogICAgICAgICAgICAgICAgdGl0bGUgPSBpZiAobG9hZGluZykgIkxvYWRpbmcgR3VpZGUi
IGVsc2UgIk5vIEluZm9ybWF0aW9uIiwKICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gIiIs
CiAgICAgICAgICAgICAgICBzdGFydCA9ICIiLAogICAgICAgICAgICAgICAgZW5kID0gIiIsCiAg
ICAgICAgICAgICAgICBzdGFydFRpbWVzdGFtcCA9IHZpc2libGVTdGFydCAvIDEwMDBMLAogICAg
ICAgICAgICAgICAgZW5kVGltZXN0YW1wID0gdmlzaWJsZUVuZCAvIDEwMDBMCiAgICAgICAgICAg
ICkKICAgICAgICAgICAgdmFsIGV2ZW50U3RhcnQgPSBldmVudD8uc3RhcnRNcyA/OiB2aXNpYmxl
U3RhcnQKICAgICAgICAgICAgdmFsIGV2ZW50RW5kID0gZXZlbnQ/LmVuZE1zID86IHZpc2libGVF
bmQKICAgICAgICAgICAgdmFsIGN1cnJlbnQgPSBub3dNcyBpbiBldmVudFN0YXJ0IHVudGlsIGV2
ZW50RW5kICYmICFsb2FkaW5nCiAgICAgICAgICAgIHZhbCBwYXN0ID0gZXZlbnRFbmQgPD0gbm93
TXMKICAgICAgICAgICAgdmFsIG5vSW5mb3JtYXRpb24gPSBldmVudCA9PSBudWxsICYmICFsb2Fk
aW5nCiAgICAgICAgICAgIHZhbCBjb21wYWN0Q2FyZCA9IHNwYW4gPD0gNgogICAgICAgICAgICB2
YWwgdGl0bGUgPSB3aGVuIHsKICAgICAgICAgICAgICAgIGxvYWRpbmcgLT4gIkxPQURJTkcgR1VJ
REXigKYiCiAgICAgICAgICAgICAgICBub0luZm9ybWF0aW9uIC0+ICJOTyBHVUlERSBEQVRBIgog
ICAgICAgICAgICAgICAgY3VycmVudCAmJiAhY29tcGFjdENhcmQgLT4gIkxJVkUgIOKAoiAgJHtp
dGVtLnRpdGxlLmlmQmxhbmsgeyAiTElWRSBQUk9HUkFNTUlORyIgfX0iCiAgICAgICAgICAgICAg
ICBlbHNlIC0+IGl0ZW0udGl0bGUuaWZCbGFuayB7ICJMSVZFIFBST0dSQU1NSU5HIiB9CiAgICAg
ICAgICAgIH0KICAgICAgICAgICAgdmFsIHRpbWUgPSBmb3JtYXRSYW5nZShldmVudFN0YXJ0LCBl
dmVudEVuZCkKCiAgICAgICAgICAgIHZhbCBibG9jayA9IFRleHRWaWV3KHJvd0NvbnRleHQpLmFw
cGx5IHsKICAgICAgICAgICAgICAgIC8vIEhhbGYtaG91ciBjYXJkcyBoYXZlIGxpbWl0ZWQgd2lk
dGguIFRoZWlyIGV4YWN0IHRpbWUgaXMKICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgc2hvd24g
YnkgdGhlIGFsaWduZWQgaGVhZGVyIGFuZCBkZXRhaWxzIHBhbmVsLCBzbwogICAgICAgICAgICAg
ICAgLy8gcmVzZXJ2ZSB0aGUgZnVsbCBjYXJkIGZvciB0aGUgcHJvZ3JhbW1lIHRpdGxlLgogICAg
ICAgICAgICAgICAgdGV4dCA9IGlmIChjb21wYWN0Q2FyZCkgdGl0bGUgZWxzZSAiJHRpdGxlXG4k
dGltZSIKICAgICAgICAgICAgICAgIHNldFRleHRDb2xvcihDb2xvci5XSElURSkKICAgICAgICAg
ICAgICAgIGVsbGlwc2l6ZSA9IFRleHRVdGlscy5UcnVuY2F0ZUF0LkVORAogICAgICAgICAgICAg
ICAgaW5jbHVkZUZvbnRQYWRkaW5nID0gZmFsc2UKICAgICAgICAgICAgICAgIGlmIChjb21wYWN0
Q2FyZCkgewogICAgICAgICAgICAgICAgICAgIHRleHRTaXplID0gMTBmCiAgICAgICAgICAgICAg
ICAgICAgbWF4TGluZXMgPSA2CiAgICAgICAgICAgICAgICAgICAgZ3Jhdml0eSA9IEdyYXZpdHku
Q0VOVEVSCiAgICAgICAgICAgICAgICAgICAgdGV4dEFsaWdubWVudCA9IFZpZXcuVEVYVF9BTElH
Tk1FTlRfQ0VOVEVSCiAgICAgICAgICAgICAgICAgICAgZWxsaXBzaXplID0gbnVsbAogICAgICAg
ICAgICAgICAgICAgIHNldEhvcml6b250YWxseVNjcm9sbGluZyhmYWxzZSkKICAgICAgICAgICAg
ICAgICAgICBzZXRMaW5lU3BhY2luZygwZiwgMC45MGYpCiAgICAgICAgICAgICAgICAgICAgc2V0
UGFkZGluZygyLmRwLCAxLmRwLCAyLmRwLCAxLmRwKQogICAgICAgICAgICAgICAgICAgIFRleHRW
aWV3Q29tcGF0LnNldEF1dG9TaXplVGV4dFR5cGVVbmlmb3JtV2l0aENvbmZpZ3VyYXRpb24oCiAg
ICAgICAgICAgICAgICAgICAgICAgIHRoaXMsCiAgICAgICAgICAgICAgICAgICAgICAgIDYsCiAg
ICAgICAgICAgICAgICAgICAgICAgIDEwLAogICAgICAgICAgICAgICAgICAgICAgICAxLAogICAg
ICAgICAgICAgICAgICAgICAgICBUeXBlZFZhbHVlLkNPTVBMRVhfVU5JVF9TUAogICAgICAgICAg
ICAgICAgICAgICkKICAgICAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgICAgICAg
c2V0VGV4dFNpemUoVHlwZWRWYWx1ZS5DT01QTEVYX1VOSVRfU1AsIDEzZikKICAgICAgICAgICAg
ICAgICAgICBtYXhMaW5lcyA9IDQKICAgICAgICAgICAgICAgICAgICBncmF2aXR5ID0gR3Jhdml0
eS5DRU5URVJfVkVSVElDQUwKICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ25tZW50ID0gVmll
dy5URVhUX0FMSUdOTUVOVF9WSUVXX1NUQVJUCiAgICAgICAgICAgICAgICAgICAgc2V0TGluZVNw
YWNpbmcoMGYsIDFmKQogICAgICAgICAgICAgICAgICAgIHNldFBhZGRpbmcoMTIuZHAsIDQuZHAs
IDEwLmRwLCA0LmRwKQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgc2V0VHlwZWZh
Y2UodHlwZWZhY2UsIGlmIChjdXJyZW50KSBhbmRyb2lkLmdyYXBoaWNzLlR5cGVmYWNlLkJPTEQg
ZWxzZSBhbmRyb2lkLmdyYXBoaWNzLlR5cGVmYWNlLk5PUk1BTCkKICAgICAgICAgICAgICAgIHNl
dEJhY2tncm91bmRSZXNvdXJjZSgKICAgICAgICAgICAgICAgICAgICB3aGVuIHsKICAgICAgICAg
ICAgICAgICAgICAgICAgY3VycmVudCAmJiAhbm9JbmZvcm1hdGlvbiAtPiBSLmRyYXdhYmxlLmJn
X2VwZ19ub3cKICAgICAgICAgICAgICAgICAgICAgICAgcGFzdCB8fCBsb2FkaW5nIC0+IFIuZHJh
d2FibGUuYmdfZXBnX3Bhc3QKICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSAtPiBSLmRyYXdh
YmxlLmJnX2VwZ19wcm9ncmFtCiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAg
KQogICAgICAgICAgICAgICAgaXNGb2N1c2FibGUgPSAhbG9hZGluZwogICAgICAgICAgICAgICAg
aXNGb2N1c2FibGVJblRvdWNoTW9kZSA9IGZhbHNlCiAgICAgICAgICAgICAgICBpc0NsaWNrYWJs
ZSA9ICFsb2FkaW5nCiAgICAgICAgICAgICAgICBjb250ZW50RGVzY3JpcHRpb24gPSAiJHtjaGFu
bmVsLm5hbWV9LCAkdGl0bGUsICR0aW1lIgogICAgICAgICAgICAgICAgaWYgKCFsb2FkaW5nKSB7
CiAgICAgICAgICAgICAgICAgICAgc2V0T25Gb2N1c0NoYW5nZUxpc3RlbmVyIHsgdmlldywgaGFz
Rm9jdXMgLT4KICAgICAgICAgICAgICAgICAgICAgICAgdmlldy5lbGV2YXRpb24gPSBpZiAoaGFz
Rm9jdXMpIDEwZiBlbHNlIDBmCiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc2NhbGVYID0g
aWYgKGhhc0ZvY3VzKSAxLjAxNWYgZWxzZSAxZgogICAgICAgICAgICAgICAgICAgICAgICB2aWV3
LnNjYWxlWSA9IGlmIChoYXNGb2N1cykgMS4wM2YgZWxzZSAxZgogICAgICAgICAgICAgICAgICAg
ICAgICBpZiAoaGFzRm9jdXMpIG9uUHJvZ3JhbUZvY3VzZWQoY2hhbm5lbCwgaXRlbSwgZXZlbnRT
dGFydCwgZXZlbnRFbmQsIGN1cnJlbnQpCiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAg
ICAgICAgICAgIHNldE9uQ2xpY2tMaXN0ZW5lciB7CiAgICAgICAgICAgICAgICAgICAgICAgIG9u
UHJvZ3JhbUNsaWNrZWQoY2hhbm5lbCwgaXRlbSwgZXZlbnRTdGFydCwgZXZlbnRFbmQsIGN1cnJl
bnQpCiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9
CgogICAgICAgICAgICBsYW5lLmFkZFZpZXcoCiAgICAgICAgICAgICAgICBibG9jaywKICAgICAg
ICAgICAgICAgIExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMoKHNwYW4gKiBxdWFudHVtV2lkdGhQ
eCAtIDQuZHApLmNvZXJjZUF0TGVhc3QoMS5kcCksIDc0LmRwKS5hcHBseSB7CiAgICAgICAgICAg
ICAgICAgICAgbWFyZ2luRW5kID0gNC5kcAogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAp
CiAgICAgICAgICAgIHF1YW50dW1JbmRleCArPSBzcGFuCiAgICAgICAgfQoKICAgICAgICB2YWwg
bWFya2VyWCA9ICgoKG5vd01zIC0gdGltZWxpbmVTdGFydE1zKS5jb2VyY2VBdExlYXN0KDBMKSAv
IDYwXzAwMC4wKSAqIHBpeGVsc1Blck1pbnV0ZURwKS50b0ludCgpLmRwCiAgICAgICAgaWYgKG1h
cmtlclggaW4gMCB1bnRpbCB0aW1lbGluZVdpZHRoUHgpIHsKICAgICAgICAgICAgY2FudmFzLmFk
ZFZpZXcoCiAgICAgICAgICAgICAgICBWaWV3KHJvd0NvbnRleHQpLmFwcGx5IHsKICAgICAgICAg
ICAgICAgICAgICBzZXRCYWNrZ3JvdW5kQ29sb3Iocm93Q29udGV4dC5nZXRDb2xvcihSLmNvbG9y
LmtzX3JlZCkpCiAgICAgICAgICAgICAgICAgICAgYWxwaGEgPSAwLjk1ZgogICAgICAgICAgICAg
ICAgICAgIGVsZXZhdGlvbiA9IDEyZgogICAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICAg
IEZyYW1lTGF5b3V0LkxheW91dFBhcmFtcygzLmRwLCBMaW5lYXJMYXlvdXQuTGF5b3V0UGFyYW1z
Lk1BVENIX1BBUkVOVCkuYXBwbHkgewogICAgICAgICAgICAgICAgICAgIGxlZnRNYXJnaW4gPSBt
YXJrZXJYCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICkKICAgICAgICB9CgogICAgICAg
IHNjcm9sbC5hZGRWaWV3KGNhbnZhcykKICAgICAgICByb290LmFkZFZpZXcoc2Nyb2xsLCBMaW5l
YXJMYXlvdXQuTGF5b3V0UGFyYW1zKDAsIExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMuTUFUQ0hf
UEFSRU5ULCAxZikpCiAgICAgICAgc2Nyb2xsLnBvc3QgeyBzY3JvbGwuc2Nyb2xsVG8oZ2xvYmFs
U2Nyb2xsWCwgMCkgfQogICAgICAgIHNjcm9sbC5zZXRPblNjcm9sbENoYW5nZUxpc3RlbmVyIHsg
Xywgc2Nyb2xsWCwgXywgXywgXyAtPgogICAgICAgICAgICBpZiAoIXN5bmNpbmcgJiYgc2Nyb2xs
WCAhPSBnbG9iYWxTY3JvbGxYKSB7CiAgICAgICAgICAgICAgICBnbG9iYWxTY3JvbGxYID0gc2Ny
b2xsWAogICAgICAgICAgICAgICAgc3luY1Zpc2libGUoc2Nyb2xsKQogICAgICAgICAgICAgICAg
b25Ib3Jpem9udGFsQ2hhbmdlZChzY3JvbGxYKQogICAgICAgICAgICB9CiAgICAgICAgfQogICAg
ICAgIHJldHVybiByb290CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gbG9hZENoYW5uZWxMb2dvKHVy
bDogU3RyaW5nLCB0YXJnZXQ6IEltYWdlVmlldywgdGlsZTogVmlldywgZmFsbGJhY2s6IFRleHRW
aWV3KSB7CiAgICAgICAgdmFsIGNsZWFuVXJsID0gdXJsLnRyaW0oKQogICAgICAgIGlmIChjbGVh
blVybC5pc0JsYW5rKCkpIHsKICAgICAgICAgICAgdGFyZ2V0LnZpc2liaWxpdHkgPSBWaWV3LklO
VklTSUJMRQogICAgICAgICAgICBmYWxsYmFjay52aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFCiAg
ICAgICAgICAgIHJldHVybgogICAgICAgIH0KCiAgICAgICAgdGFyZ2V0LnRhZyA9IGNsZWFuVXJs
CiAgICAgICAgdmFsIGNhY2hlZCA9IHN5bmNocm9uaXplZChsb2dvQ2FjaGUpIHsgbG9nb0NhY2hl
LmdldChjbGVhblVybCkgfQogICAgICAgIGlmIChjYWNoZWQgIT0gbnVsbCkgewogICAgICAgICAg
ICBzaG93Q2hhbm5lbExvZ28oY2FjaGVkLCB0YXJnZXQsIHRpbGUsIGZhbGxiYWNrKQogICAgICAg
ICAgICByZXR1cm4KICAgICAgICB9CgogICAgICAgIHRhcmdldC52aXNpYmlsaXR5ID0gVmlldy5J
TlZJU0lCTEUKICAgICAgICBmYWxsYmFjay52aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFCiAgICAg
ICAgdGFyZ2V0LmFscGhhID0gMC40ZgogICAgICAgIGxvZ29FeGVjdXRvci5leGVjdXRlIHsKICAg
ICAgICAgICAgdmFsIGJpdG1hcCA9IHJ1bkNhdGNoaW5nIHsKICAgICAgICAgICAgICAgIHZhbCBj
b25uZWN0aW9uID0gVVJMKGNsZWFuVXJsKS5vcGVuQ29ubmVjdGlvbigpLmFwcGx5IHsKICAgICAg
ICAgICAgICAgICAgICBjb25uZWN0VGltZW91dCA9IDZfMDAwCiAgICAgICAgICAgICAgICAgICAg
cmVhZFRpbWVvdXQgPSA2XzAwMAogICAgICAgICAgICAgICAgICAgIHNldFJlcXVlc3RQcm9wZXJ0
eSgiVXNlci1BZ2VudCIsICJLcmlzdGFsU3RyZWFtcy8xLjYuOCIpCiAgICAgICAgICAgICAgICB9
CiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmdldElucHV0U3RyZWFtKCkudXNlIHsgQml0bWFw
RmFjdG9yeS5kZWNvZGVTdHJlYW0oaXQpIH0KICAgICAgICAgICAgfS5nZXRPck51bGwoKQoKICAg
ICAgICAgICAgaWYgKGJpdG1hcCAhPSBudWxsKSB7CiAgICAgICAgICAgICAgICBzeW5jaHJvbml6
ZWQobG9nb0NhY2hlKSB7IGxvZ29DYWNoZS5wdXQoY2xlYW5VcmwsIGJpdG1hcCkgfQogICAgICAg
ICAgICB9CiAgICAgICAgICAgIHRhcmdldC5wb3N0IHsKICAgICAgICAgICAgICAgIGlmICh0YXJn
ZXQudGFnID09IGNsZWFuVXJsKSB7CiAgICAgICAgICAgICAgICAgICAgaWYgKGJpdG1hcCAhPSBu
dWxsKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHNob3dDaGFubmVsTG9nbyhiaXRtYXAsIHRh
cmdldCwgdGlsZSwgZmFsbGJhY2spCiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsKICAgICAg
ICAgICAgICAgICAgICAgICAgdGFyZ2V0LnZpc2liaWxpdHkgPSBWaWV3LklOVklTSUJMRQogICAg
ICAgICAgICAgICAgICAgICAgICBmYWxsYmFjay52aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFCiAg
ICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAg
ICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIHNob3dDaGFubmVsTG9nbyhiaXRtYXA6IEJpdG1h
cCwgdGFyZ2V0OiBJbWFnZVZpZXcsIHRpbGU6IFZpZXcsIGZhbGxiYWNrOiBUZXh0Vmlldykgewog
ICAgICAgIHRpbGUuc2V0QmFja2dyb3VuZENvbG9yKGxvZ29Db250cmFzdEJhY2tncm91bmQoYml0
bWFwKSkKICAgICAgICB0YXJnZXQuc2V0SW1hZ2VCaXRtYXAoYml0bWFwKQogICAgICAgIHRhcmdl
dC5hbHBoYSA9IDFmCiAgICAgICAgdGFyZ2V0LnZpc2liaWxpdHkgPSBWaWV3LlZJU0lCTEUKICAg
ICAgICBmYWxsYmFjay52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAgICB9CgogICAgcHJpdmF0ZSBm
dW4gbG9nb0NvbnRyYXN0QmFja2dyb3VuZChiaXRtYXA6IEJpdG1hcCk6IEludCB7CiAgICAgICAg
dmFsIHN0ZXBYID0gbWF4KDEsIGJpdG1hcC53aWR0aCAvIDE4KQogICAgICAgIHZhbCBzdGVwWSA9
IG1heCgxLCBiaXRtYXAuaGVpZ2h0IC8gMTgpCiAgICAgICAgdmFyIGx1bWluYW5jZSA9IDBMCiAg
ICAgICAgdmFyIHZpc2libGVQaXhlbHMgPSAwTAogICAgICAgIHZhciB5ID0gMAogICAgICAgIHdo
aWxlICh5IDwgYml0bWFwLmhlaWdodCkgewogICAgICAgICAgICB2YXIgeCA9IDAKICAgICAgICAg
ICAgd2hpbGUgKHggPCBiaXRtYXAud2lkdGgpIHsKICAgICAgICAgICAgICAgIHZhbCBwaXhlbCA9
IGJpdG1hcC5nZXRQaXhlbCh4LCB5KQogICAgICAgICAgICAgICAgaWYgKENvbG9yLmFscGhhKHBp
eGVsKSA+PSA2NCkgewogICAgICAgICAgICAgICAgICAgIGx1bWluYW5jZSArPSAoCiAgICAgICAg
ICAgICAgICAgICAgICAgIENvbG9yLnJlZChwaXhlbCkgKiAyOTlMICsKICAgICAgICAgICAgICAg
ICAgICAgICAgICAgIENvbG9yLmdyZWVuKHBpeGVsKSAqIDU4N0wgKwogICAgICAgICAgICAgICAg
ICAgICAgICAgICAgQ29sb3IuYmx1ZShwaXhlbCkgKiAxMTRMCiAgICAgICAgICAgICAgICAgICAg
ICAgICkgLyAxMDAwTAogICAgICAgICAgICAgICAgICAgIHZpc2libGVQaXhlbHMrKwogICAgICAg
ICAgICAgICAgfQogICAgICAgICAgICAgICAgeCArPSBzdGVwWAogICAgICAgICAgICB9CiAgICAg
ICAgICAgIHkgKz0gc3RlcFkKICAgICAgICB9CiAgICAgICAgdmFsIGF2ZXJhZ2UgPSBpZiAodmlz
aWJsZVBpeGVscyA+IDBMKSBsdW1pbmFuY2UgLyB2aXNpYmxlUGl4ZWxzIGVsc2UgMEwKICAgICAg
ICByZXR1cm4gaWYgKGF2ZXJhZ2UgPCAxNDVMKSBDb2xvci5XSElURSBlbHNlIENvbG9yLnJnYigz
MiwgMzIsIDMyKQogICAgfQoKICAgIHByaXZhdGUgZnVuIGNoYW5uZWxCYWRnZShuYW1lOiBTdHJp
bmcpOiBTdHJpbmcgewogICAgICAgIHZhbCBpZ25vcmVkID0gc2V0T2YoIlVTQSIsICJVUyIsICJV
SyIsICJDQSIsICJDQU4iLCAiSEQiLCAiRkhEIiwgIlVIRCIsICJFQVNUIiwgIldFU1QiKQogICAg
ICAgIHZhbCB3b3JkcyA9IG5hbWUKICAgICAgICAgICAgLnVwcGVyY2FzZShMb2NhbGUuVVMpCiAg
ICAgICAgICAgIC5yZXBsYWNlKCIqIiwgIiIpCiAgICAgICAgICAgIC5zcGxpdChSZWdleCgiXFxz
KyIpKQogICAgICAgICAgICAubWFwIHsgaXQudHJpbSgpIH0KICAgICAgICAgICAgLmZpbHRlciB7
IHdvcmQgLT4gd29yZC5pc05vdEJsYW5rKCkgJiYgd29yZCAhaW4gaWdub3JlZCAmJiAhd29yZC5h
bGwgeyBjaCAtPiBjaC5pc0RpZ2l0KCkgfSB9CiAgICAgICAgcmV0dXJuIHdvcmRzLmZpcnN0T3JO
dWxsKCk/LnRha2UoNSkgPzogIlRWIgogICAgfQoKICAgIGZ1biBzZXRHbG9iYWxTY3JvbGxYKHg6
IEludCkgewogICAgICAgIHZhbCBzYWZlID0geC5jb2VyY2VBdExlYXN0KDApCiAgICAgICAgaWYg
KHNhZmUgPT0gZ2xvYmFsU2Nyb2xsWCkgcmV0dXJuCiAgICAgICAgZ2xvYmFsU2Nyb2xsWCA9IHNh
ZmUKICAgICAgICBzeW5jVmlzaWJsZShudWxsKQogICAgfQoKICAgIHByaXZhdGUgZnVuIHN5bmNW
aXNpYmxlKHNvdXJjZTogSG9yaXpvbnRhbFNjcm9sbFZpZXc/KSB7CiAgICAgICAgc3luY2luZyA9
IHRydWUKICAgICAgICB0cnkgewogICAgICAgICAgICB2aXNpYmxlU2Nyb2xscy50b0xpc3QoKS5m
b3JFYWNoIHsgdmlldyAtPgogICAgICAgICAgICAgICAgaWYgKHZpZXcgIT09IHNvdXJjZSAmJiB2
aWV3LnNjcm9sbFggIT0gZ2xvYmFsU2Nyb2xsWCkgdmlldy5zY3JvbGxUbyhnbG9iYWxTY3JvbGxY
LCAwKQogICAgICAgICAgICB9CiAgICAgICAgfSBmaW5hbGx5IHsKICAgICAgICAgICAgc3luY2lu
ZyA9IGZhbHNlCiAgICAgICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIHJlc29sdmVFdmVudHMo
c291cmNlOiBMaXN0PEVwZ0l0ZW0+KTogTGlzdDxSZXNvbHZlZEV2ZW50PiB7CiAgICAgICAgcmV0
dXJuIHNvdXJjZS5tYXBJbmRleGVkTm90TnVsbCB7IGluZGV4LCBpdGVtIC0+CiAgICAgICAgICAg
IHZhbCAoc3RhcnQsIGVuZCkgPSByZXNvbHZlZFRpbWVzKGl0ZW0sIGluZGV4KQogICAgICAgICAg
ICBpZiAoZW5kIDw9IHRpbWVsaW5lU3RhcnRNcyB8fCBzdGFydCA+PSB0aW1lbGluZUVuZE1zIHx8
IGVuZCA8PSBzdGFydCkgbnVsbAogICAgICAgICAgICBlbHNlIFJlc29sdmVkRXZlbnQoaXRlbSwg
c3RhcnQsIGVuZCkKICAgICAgICB9LnNvcnRlZFdpdGgoY29tcGFyZUJ5PFJlc29sdmVkRXZlbnQ+
IHsgaXQuc3RhcnRNcyB9LnRoZW5CeURlc2NlbmRpbmcgeyBpdC5lbmRNcyB9KQogICAgfQoKICAg
IC8qKiBTZWxlY3QgZXhhY3RseSBvbmUgcHJvZ3JhbW1lIGZvciBvbmUgZml4ZWQgaGFsZi1ob3Vy
IGNlbGwuICovCiAgICBwcml2YXRlIGZ1biBwcm9ncmFtRm9yU2xvdChldmVudHM6IExpc3Q8UmVz
b2x2ZWRFdmVudD4sIHNsb3RTdGFydDogTG9uZywgc2xvdEVuZDogTG9uZyk6IFJlc29sdmVkRXZl
bnQ/IHsKICAgICAgICB2YXIgYmVzdDogUmVzb2x2ZWRFdmVudD8gPSBudWxsCiAgICAgICAgdmFy
IGJlc3RPdmVybGFwID0gMEwKICAgICAgICBmb3IgKGV2ZW50IGluIGV2ZW50cykgewogICAgICAg
ICAgICBpZiAoZXZlbnQuc3RhcnRNcyA+PSBzbG90RW5kKSBicmVhawogICAgICAgICAgICB2YWwg
b3ZlcmxhcCA9IG1pbihldmVudC5lbmRNcywgc2xvdEVuZCkgLSBtYXgoZXZlbnQuc3RhcnRNcywg
c2xvdFN0YXJ0KQogICAgICAgICAgICBpZiAob3ZlcmxhcCA+IGJlc3RPdmVybGFwKSB7CiAgICAg
ICAgICAgICAgICBiZXN0ID0gZXZlbnQKICAgICAgICAgICAgICAgIGJlc3RPdmVybGFwID0gb3Zl
cmxhcAogICAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHJldHVybiBiZXN0CiAgICB9Cgog
ICAgcHJpdmF0ZSBmdW4gc2FtZVByb2dyYW1tZShmaXJzdDogUmVzb2x2ZWRFdmVudCwgc2Vjb25k
OiBSZXNvbHZlZEV2ZW50Pyk6IEJvb2xlYW4gewogICAgICAgIHJldHVybiBzZWNvbmQgIT0gbnVs
bCAmJgogICAgICAgICAgICBmaXJzdC5zdGFydE1zID09IHNlY29uZC5zdGFydE1zICYmCiAgICAg
ICAgICAgIGZpcnN0LmVuZE1zID09IHNlY29uZC5lbmRNcyAmJgogICAgICAgICAgICBmaXJzdC5p
dGVtLnRpdGxlID09IHNlY29uZC5pdGVtLnRpdGxlCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gcmVz
b2x2ZWRUaW1lcyhpdGVtOiBFcGdJdGVtLCBpbmRleDogSW50KTogUGFpcjxMb25nLCBMb25nPiB7
CiAgICAgICAgdmFsIGZsb29yTm93ID0gKG5vd01zIC8gc2xvdE1zKSAqIHNsb3RNcwogICAgICAg
IHZhbCBzdGFydCA9IGl0ZW0uc3RhcnRUaW1lc3RhbXA/LmxldCB7IGl0ICogMTAwMEwgfQogICAg
ICAgICAgICA/OiBwYXJzZUd1aWRlVGltZShpdGVtLnN0YXJ0KQogICAgICAgICAgICA/OiBpZiAo
aXRlbS5zdGFydC5lcXVhbHMoIk5vdyIsIHRydWUpKSBmbG9vck5vdyBlbHNlIGZsb29yTm93ICsg
aW5kZXggKiBzbG90TXMKICAgICAgICB2YWwgZW5kID0gaXRlbS5lbmRUaW1lc3RhbXA/LmxldCB7
IGl0ICogMTAwMEwgfQogICAgICAgICAgICA/OiBwYXJzZUd1aWRlVGltZShpdGVtLmVuZCkKICAg
ICAgICAgICAgPzogKHN0YXJ0ICsgc2xvdE1zKQogICAgICAgIHJldHVybiBzdGFydCB0byBtYXgo
ZW5kLCBzdGFydCArIDUgKiA2MF8wMDBMKQogICAgfQoKICAgIHByaXZhdGUgZnVuIHBhcnNlR3Vp
ZGVUaW1lKHJhdzogU3RyaW5nKTogTG9uZz8gewogICAgICAgIHZhbCB2YWx1ZSA9IHJhdy50cmlt
KCkKICAgICAgICBpZiAodmFsdWUuaXNCbGFuaygpIHx8IHZhbHVlLmVxdWFscygiTm93IiwgdHJ1
ZSkgfHwgdmFsdWUuZXF1YWxzKCJOZXh0IiwgdHJ1ZSkgfHwgdmFsdWUuZXF1YWxzKCJMYXRlciIs
IHRydWUpKSByZXR1cm4gbnVsbAogICAgICAgIHZhbCBudW1lcmljID0gdmFsdWUudG9Mb25nT3JO
dWxsKCkKICAgICAgICBpZiAobnVtZXJpYyAhPSBudWxsKSByZXR1cm4gaWYgKG51bWVyaWMgPCAx
MDBfMDAwXzAwMF8wMDBMKSBudW1lcmljICogMTAwMEwgZWxzZSBudW1lcmljCiAgICAgICAgdmFs
IHBhdHRlcm5zID0gbGlzdE9mKCJ5eXl5LU1NLWRkIEhIOm1tOnNzIiwgInl5eXktTU0tZGQgSEg6
bW0iKQogICAgICAgIGZvciAocGF0dGVybiBpbiBwYXR0ZXJucykgewogICAgICAgICAgICB0cnkg
ewogICAgICAgICAgICAgICAgdmFsIHBhcnNlZCA9IFNpbXBsZURhdGVGb3JtYXQocGF0dGVybiwg
TG9jYWxlLlVTKS5wYXJzZSh2YWx1ZSkKICAgICAgICAgICAgICAgIGlmIChwYXJzZWQgIT0gbnVs
bCkgcmV0dXJuIHBhcnNlZC50aW1lCiAgICAgICAgICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikg
eyB9CiAgICAgICAgfQogICAgICAgIHJldHVybiBudWxsCiAgICB9CgogICAgcHJpdmF0ZSBmdW4g
Zm9ybWF0UmFuZ2Uoc3RhcnQ6IExvbmcsIGVuZDogTG9uZyk6IFN0cmluZyB7CiAgICAgICAgcmV0
dXJuIHRyeSB7CiAgICAgICAgICAgIHZhbCBmb3JtYXR0ZXIgPSBTaW1wbGVEYXRlRm9ybWF0KCJo
Om1tIGEiLCBMb2NhbGUuZ2V0RGVmYXVsdCgpKQogICAgICAgICAgICAiJHtmb3JtYXR0ZXIuZm9y
bWF0KERhdGUoc3RhcnQpKX0g4oCTICR7Zm9ybWF0dGVyLmZvcm1hdChEYXRlKGVuZCkpfSIKICAg
ICAgICB9IGNhdGNoIChfOiBFeGNlcHRpb24pIHsKICAgICAgICAgICAgIiIKICAgICAgICB9CiAg
ICB9CgogICAgcHJpdmF0ZSB2YWwgSW50LmRwOiBJbnQgZ2V0KCkgPSAodGhpcyAqIHJvd0NvbnRl
eHQucmVzb3VyY2VzLmRpc3BsYXlNZXRyaWNzLmRlbnNpdHkpLnRvSW50KCkKfQo=
:::END ADAPTER
:::BEGIN GRADLE
cGx1Z2lucyB7CiAgICBpZCgiY29tLmFuZHJvaWQuYXBwbGljYXRpb24iKQogICAgaWQoIm9yZy5q
ZXRicmFpbnMua290bGluLmFuZHJvaWQiKQp9CgphbmRyb2lkIHsKICAgIG5hbWVzcGFjZSA9ICJj
b20ua3Jpc3RhbHN0cmVhbXMucGxheWVyIgogICAgY29tcGlsZVNkayA9IDM1CgogICAgZGVmYXVs
dENvbmZpZyB7CiAgICAgICAgYXBwbGljYXRpb25JZCA9ICJjb20ua3Jpc3RhbHN0cmVhbXMucGxh
eWVyIgogICAgICAgIG1pblNkayA9IDIzCiAgICAgICAgdGFyZ2V0U2RrID0gMzUKICAgICAgICB2
ZXJzaW9uQ29kZSA9IDE2ODIwMDgKICAgICAgICB2ZXJzaW9uTmFtZSA9ICIxLjYuOC1lcGctbG9n
by1jb250cmFzdCIKICAgIH0KCiAgICBidWlsZEZlYXR1cmVzIHsKICAgICAgICB2aWV3QmluZGlu
ZyA9IGZhbHNlCiAgICB9CgogICAgY29tcGlsZU9wdGlvbnMgewogICAgICAgIHNvdXJjZUNvbXBh
dGliaWxpdHkgPSBKYXZhVmVyc2lvbi5WRVJTSU9OXzExCiAgICAgICAgdGFyZ2V0Q29tcGF0aWJp
bGl0eSA9IEphdmFWZXJzaW9uLlZFUlNJT05fMTEKICAgIH0KCiAgICBrb3RsaW4gewogICAgICAg
IGp2bVRvb2xjaGFpbigxMSkKICAgIH0KfQoKZGVwZW5kZW5jaWVzIHsKICAgIGltcGxlbWVudGF0
aW9uKCJhbmRyb2lkeC5jb3JlOmNvcmUta3R4OjEuMTUuMCIpCiAgICBpbXBsZW1lbnRhdGlvbigi
YW5kcm9pZHguYXBwY29tcGF0OmFwcGNvbXBhdDoxLjcuMCIpCiAgICBpbXBsZW1lbnRhdGlvbigi
Y29tLmdvb2dsZS5hbmRyb2lkLm1hdGVyaWFsOm1hdGVyaWFsOjEuMTIuMCIpCiAgICBpbXBsZW1l
bnRhdGlvbigiYW5kcm9pZHgubWVkaWEzOm1lZGlhMy1leG9wbGF5ZXI6MS41LjEiKQogICAgaW1w
bGVtZW50YXRpb24oImFuZHJvaWR4Lm1lZGlhMzptZWRpYTMtZXhvcGxheWVyLWhsczoxLjUuMSIp
CiAgICBpbXBsZW1lbnRhdGlvbigiYW5kcm9pZHgubWVkaWEzOm1lZGlhMy11aToxLjUuMSIpCn0K
:::END GRADLE
:::BEGIN AUDIT
S1JJU1RBTCBTVFJFQU1TIDEuNi44IFJDMSBSMiDigJQgQURBUFRJVkUgTE9HTyBDT05UUkFTVAoK
QkFTRUxJTkUKLSBLbm93bi1nb29kIFIyIGFwcC4KLSBMb2dpbiwgcGxheWJhY2ssIE1vdmllcywg
U2VyaWVzIGFuZCBMaXZlIFRWIE5vdy9OZXh0IGFyZSB1bmNoYW5nZWQuCi0gVGhlIGVhcmxpZXIg
dmFyaWFibGUtd2lkdGggRVBHIHJlbmRlcmVyIHdhcyByZW1vdmVkIHJhdGhlciB0aGFuIHBhdGNo
ZWQuCgpSRUJVSUxUIEdVSURFCi0gVXNlcyB0aGUgc3VwcGxpZWQgd29ya2luZyBJUFRWIEFQSydz
IGR1cmF0aW9uLXdpZHRoIGJlaGF2aW9yIG9uIHRvcCBvZiB0aGUKICByZWJ1aWx0IG5vbi1zdGFj
a2luZyBncmlkLgotIEVhY2ggZml2ZS1taW51dGUgc2xpY2Ugc2VsZWN0cyBhdCBtb3N0IG9uZSBw
cm92aWRlciBwcm9ncmFtbWUgYnkgZ3JlYXRlc3QKICB0aW1lIG92ZXJsYXAsIHRoZW4gY29uc2Vj
dXRpdmUgc2xpY2VzIGZvciB0aGUgc2FtZSBzaG93IG1lcmdlIGludG8gb25lIGNhcmQuCi0gQSBv
bmUtaG91ciBzaG93IHNwYW5zIG9uZSBob3VyLCBhIDkwLW1pbnV0ZSBzaG93IHNwYW5zIDkwIG1p
bnV0ZXMsIGFuZCBsb25nZXIKICBzaG93cyBjb250aW51ZSBmcm9tIHRoZWlyIHN0YXJ0IHRocm91
Z2ggZmluaXNoIHRpbWUuCi0gRHVwbGljYXRlIG9yIGNvbmZsaWN0aW5nIHByb3ZpZGVyIGVudHJp
ZXMgY2Fubm90IHN0YWNrIGJlY2F1c2UgZXZlcnkKICBmaXZlLW1pbnV0ZSBzbGljZSBzdGlsbCBo
YXMgZXhhY3RseSBvbmUgc2VsZWN0ZWQgcHJvZ3JhbW1lLgotIEV2ZXJ5IGNhcmQga2VlcHMgdGhl
IHNhbWUgZm91ci1kcCBndXR0ZXIgaW4gcG9ydHJhaXQgYW5kIGxhbmRzY2FwZS4KLSBDYXJkcyBv
ZiAzMCBtaW51dGVzIG9yIGxlc3MgdXNlIGEgY29tcGFjdCB0aXRsZS1vbmx5IGxheW91dCB3aXRo
IG1pbmltYWwKICBwYWRkaW5nIGFuZCBzaXggYXZhaWxhYmxlIHRleHQgbGluZXMuIEV4YWN0IHRp
bWVzIHJlbWFpbiBpbiB0aGUgYWxpZ25lZAogIHRpbWVsaW5lIGFuZCBkZXRhaWxzIHBhbmVsLCBw
cmV2ZW50aW5nIG5hcnJvdy1jYXJkIHRleHQgZnJvbSBiZWluZyBjdXQgb2ZmLgotIEhhbGYtaG91
ciBjYXJkcyBjZW50ZXIgdGhlaXIgY29tcGFjdCB0aXRsZSBob3Jpem9udGFsbHkgYW5kIHZlcnRp
Y2FsbHkuCi0gTG9uZ2VyIGNhcmRzIHJldHVybiB0byBsZWZ0LWFsaWduZWQgY29udGVudCB3aXRo
IDEzc3AgdGV4dCwgbm9ybWFsIHNpZGUKICBwYWRkaW5nLCBhbmQgdGhlIHRpdGxlIHBsdXMgdGlt
ZSByYW5nZSBzbyB3aWRlIGNhcmRzIGRvIG5vdCBsb29rIGVtcHR5LgotIEF1dG9tYXRpYyBzaXpp
bmcgYXBwbGllcyBvbmx5IHRvIGNvbXBhY3QgaGFsZi1ob3VyIGNhcmRzLCBkb3duIHRvIDZzcCB3
aGVuCiAgbmVlZGVkLCB3aXRoIHNpeCBsaW5lcywgdGlnaHRlciBsaW5lIHNwYWNpbmcsIGFuZCBy
ZWR1Y2VkIGZvbnQgcGFkZGluZy4KLSBDb21wYWN0IGNhcmRzIHdyYXAgaW5zdGVhZCBvZiBhZGRp
bmcgYW4gZWxsaXBzaXMsIG1heGltaXppbmcgdGhlIHZpc2libGUKICBwcm9ncmFtbWUgdGl0bGUg
d2l0aG91dCBjaGFuZ2luZyB0aGUgY2FyZCdzIHRydWUgZHVyYXRpb24gd2lkdGguCi0gVGhlIHBy
b2dyYW0tZGV0YWlscyBwYW5lbCBub3cgc2VsZWN0cyB0aGUgZmlyc3QgY3VycmVudGx5IGFpcmlu
ZyBwcm9ncmFtbWUKICBhdXRvbWF0aWNhbGx5IGluc3RlYWQgb2YgcmVtYWluaW5nIGVtcHR5IHVu
dGlsIGEgY2FyZCByZWNlaXZlcyBmb2N1cy4KLSBUaGUgc2VsZWN0ZWQgcHJvZ3JhbSBzaG93cyBh
IGxhcmdlciB0aXRsZSwgc3RhdHVzLCBjaGFubmVsLCBjb21wbGV0ZSBhaXJ0aW1lLAogIGR1cmF0
aW9uLCBwcm92aWRlciBkZXNjcmlwdGlvbiwgcmVtYWluaW5nIHRpbWUsIHByb2dyZXNzLCBhbmQg
YSBjbGVhciBhY3Rpb24uCi0gTGl2ZSBwcm9ncmVzcyBhbmQgc3RhdHVzIHJlZnJlc2ggZXZlcnkg
MzAgc2Vjb25kcyB3aXRob3V0IHJlYnVpbGRpbmcgdGhlIEVQRy4KLSBUaGUgZml4ZWQgZ3JpZCwg
Y2FyZCB3aWR0aHMsIGNvbXBhY3QgdGl0bGUgcnVsZXMsIGFsaWdubWVudCwgYW5kIGd1aWRlIGRh
dGEKICBsb2FkaW5nIGJlaGF2aW9yIGFyZSB1bmNoYW5nZWQgZnJvbSB0aGUgYXBwcm92ZWQgc3Rh
YmxlIGJhc2VsaW5lLgotIExlZnQtc2lkZSBjaGFubmVsIGJveGVzIG5vdyBkaXNwbGF5IGVhY2gg
cHJvdmlkZXIgY2hhbm5lbCBsb2dvIGJlc2lkZSBpdHMKICBjaGFubmVsIG51bWJlciBhbmQgbmFt
ZSBpbnN0ZWFkIG9mIHJlbmRlcmluZyB0ZXh0IGFsb25lLgotIExvZ29zIGxvYWQgb2ZmIHRoZSBt
YWluIHRocmVhZCBhbmQgYXJlIGNhY2hlZCBmb3Igc21vb3RoIGd1aWRlIHNjcm9sbGluZy4KLSBF
YWNoIGxvYWRlZCBsb2dvIGlzIHNhbXBsZWQgZm9yIGJyaWdodG5lc3MuIERhcmsgYXJ0d29yayBy
ZWNlaXZlcyBhIHdoaXRlCiAgYmFja2dyb3VuZCB3aGlsZSBsaWdodCBhcnR3b3JrIHJlY2VpdmVz
IGEgY2hhcmNvYWwgYmFja2dyb3VuZCwga2VlcGluZyBib3RoCiAgdmlzaWJsZSBldmVuIHdoZW4g
dGhlIHByb3ZpZGVyIG1peGVzIGJsYWNrIGFuZCB3aGl0ZSB0cmFuc3BhcmVudCBsb2dvcy4KLSBU
aGUgbG9nbyB0aWxlIGlzIGVubGFyZ2VkIHRvIDQ4ZHAuIE1pc3Npbmcgb3IgdW5yZWFjaGFibGUg
YXJ0d29yayBkaXNwbGF5cyBhCiAgcmVhZGFibGUgY2hhbm5lbCBiYWRnZSBzdWNoIGFzIEJFVCBp
bnN0ZWFkIG9mIGEgYmxhbmsgb3IgYnJva2VuIGltYWdlLgotIEd1aWRlIHJvd3MsIHByb2dyYW1t
ZSBkdXJhdGlvbnMsIHNlbGVjdGlvbiBiZWhhdmlvciwgYW5kIHRoZSBkZXRhaWxzIHBhbmVsCiAg
cmVtYWluIHVuY2hhbmdlZC4KLSBYTUxUViByZW1haW5zIHRoZSBwcmVmZXJyZWQgc2NoZWR1bGUg
c291cmNlLiBWaXNpYmxlIGNoYW5uZWxzIHdpdGhvdXQgdXNhYmxlCiAgWE1MVFYgdXNlIG9uZSBj
YWNoZWQgZnVsbCBwZXItY2hhbm5lbCBwcm92aWRlciByZXF1ZXN0LgotIFNjaGVkdWxlIHRpbWVz
LCB0aW1lbGluZSBsYWJlbHMgYW5kIE5PVyB1c2UgdGhlIEFuZHJvaWQgZGV2aWNlIGNsb2NrLgot
IE1pc3Npbmcgc2NoZWR1bGUgY2VsbHMgdmlzaWJseSBzYXkgTk8gR1VJREUgREFUQS4KClZFUlNJ
T04KLSB2ZXJzaW9uQ29kZSAxNjgyMDA4Ci0gdmVyc2lvbk5hbWUgMS42LjgtZXBnLWxvZ28tY29u
dHJhc3QK
:::END AUDIT
