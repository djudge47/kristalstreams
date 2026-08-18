@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Kristal Streams Responsive Card Alignment

set "SOURCE=C:\KristalStreams168RC1R2\KristalStreams-1.6.8-RC1-R2-LEGACY-DEMO-FIX"
for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%T"
set "WORK=C:\ksepgalignment-!STAMP!"
set "FINAL=%USERPROFILE%\Downloads\KS-EPG-ALIGNMENT-1682004.apk"
set "LOG=%TEMP%\kristalstreams-epg-alignment-build.txt"
set "JAVASAVE=%USERPROFILE%\.kristalstreams-java-home.txt"

echo.
echo ==========================================================
echo   KRISTAL STREAMS 1.6.8 RC1 R2 - RESPONSIVE CARD ALIGNMENT
echo   FRESH APK: KS-EPG-ALIGNMENT-1682004.apk
echo ==========================================================
echo.
echo Baseline: known-good R2
echo Centers only half-hour cards as requested.
echo Longer cards use larger left-aligned text and normal padding.
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

echo [2/6] Installing responsive card alignment...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; function B([string]$n){$a=':::BEGIN '+$n;$b=':::END '+$n;$s=$raw.IndexOf($a);if($s -lt 0){throw 'Missing '+$a};$s+=$a.Length;$e=$raw.IndexOf($b,$s);if($e -lt 0){throw 'Missing '+$b};$x=$raw.Substring($s,$e-$s)-replace '\s','';[Convert]::FromBase64String($x)}; [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\Models.kt',(B 'MODELS')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\XtreamClient.kt',(B 'XTREAM')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt',(B 'GUIDE')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt',(B 'ADAPTER')); [IO.File]::WriteAllBytes('%WORK%\app\build.gradle.kts',(B 'GRADLE')); [IO.File]::WriteAllBytes('%WORK%\REFERENCE-EPG-AUDIT.txt',(B 'AUDIT'))"
if errorlevel 1 (
    echo ERROR: Could not install responsive card alignment.
    pause
    exit /b 1
)

echo [3/6] Verifying responsive card alignment...
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
findstr /c:"1.6.8-epg-alignment" "%WORK%\app\build.gradle.kts" >nul
if errorlevel 1 (
    echo ERROR: EPG alignment version verification failed.
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
echo [5/6] Building responsive card alignment...
echo Gradle progress will appear below.
echo.

cd /d "%WORK%"
set "BUILDPS=%TEMP%\ks_epg_alignment_gradle_build.ps1"
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
    set "USBCOPY=!USBDRIVE!\KS-EPG-ALIGNMENT-1682004.apk"
    copy /Y "%BUILT%" "!USBCOPY!" >nul
)

color 2F
cls
echo.
echo ==========================================================
echo.
echo       KRISTAL STREAMS RESPONSIVE CARD ALIGNMENT BUILD SUCCESSFUL
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
echo Install only KS-EPG-ALIGNMENT-1682004.apk shown above.
echo Half-hour titles are centered; longer cards start at the left.
echo Long-card text is larger while duration widths remain unchanged.
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
ZWw6IExpdmVTdHJlYW0/ID0gbnVsbAogICAgcHJpdmF0ZSB2YXIgbm93TWFya2VyOiBWaWV3PyA9
IG51bGwKICAgIHByaXZhdGUgdmFyIG5vd0xhYmVsOiBUZXh0Vmlldz8gPSBudWxsCgogICAgcHJp
dmF0ZSB2YWwgc2xvdE1zID0gMzAgKiA2MF8wMDBMCiAgICBwcml2YXRlIHZhbCB0aW1lbGluZVN0
YXJ0TXM6IExvbmcgYnkgbGF6eSB7CiAgICAgICAgdmFsIG5vdyA9IFN5c3RlbS5jdXJyZW50VGlt
ZU1pbGxpcygpCiAgICAgICAgLy8gQmVnaW4gYXQgdGhlIGN1cnJlbnQgaGFsZi1ob3VyLiBUaGUg
cHJldmlvdXMgaW1wbGVtZW50YXRpb24gYmVnYW4KICAgICAgICAvLyBvbmUgc2xvdCBlYXJsaWVy
IGFuZCB0aGVuIHNjcm9sbGVkIGV2ZXJ5IHJvdyBwYXN0IHRoZSBsZWZ0LWFsaWduZWQKICAgICAg
ICAvLyB0aXRsZSwgbGVhdmluZyBhIHZpc2libGUgcHJvZ3JhbSBib3ggd2l0aCBpdHMgdGV4dCBv
ZmYtc2NyZWVuLgogICAgICAgIChub3cgLyBzbG90TXMpICogc2xvdE1zCiAgICB9CiAgICBwcml2
YXRlIHZhbCB0aW1lbGluZUVuZE1zOiBMb25nIGJ5IGxhenkgeyB0aW1lbGluZVN0YXJ0TXMgKyA4
ICogNjAgKiA2MF8wMDBMIH0KICAgIHByaXZhdGUgdmFsIHBpeGVsc1Blck1pbnV0ZURwID0gNQoK
ICAgIHByaXZhdGUgdmFsIGNsb2NrVGlja2VyID0gb2JqZWN0IDogUnVubmFibGUgewogICAgICAg
IG92ZXJyaWRlIGZ1biBydW4oKSB7CiAgICAgICAgICAgIHVwZGF0ZUhlYWRlckNsb2NrKCkKICAg
ICAgICAgICAgdXBkYXRlTm93UG9zaXRpb24oanVtcCA9IGZhbHNlKQogICAgICAgICAgICB1aUhh
bmRsZXIucG9zdERlbGF5ZWQodGhpcywgMzBfMDAwTCkKICAgICAgICB9CiAgICB9CgogICAgb3Zl
cnJpZGUgZnVuIG9uQ3JlYXRlKHNhdmVkSW5zdGFuY2VTdGF0ZTogQnVuZGxlPykgewogICAgICAg
IHN1cGVyLm9uQ3JlYXRlKHNhdmVkSW5zdGFuY2VTdGF0ZSkKICAgICAgICBzZXRDb250ZW50Vmll
dyhSLmxheW91dC5hY3Rpdml0eV9ndWlkZSkKCiAgICAgICAgY3JlZGVudGlhbHMgPSBTZXNzaW9u
LmxvYWQodGhpcykgPzogcnVuIHsKICAgICAgICAgICAgc3RhcnRBY3Rpdml0eShJbnRlbnQodGhp
cywgTG9naW5BY3Rpdml0eTo6Y2xhc3MuamF2YSkpCiAgICAgICAgICAgIGZpbmlzaCgpCiAgICAg
ICAgICAgIHJldHVybgogICAgICAgIH0KICAgICAgICBjYXRlZ29yeUlkID0gaW50ZW50LmdldFN0
cmluZ0V4dHJhKCJjYXRlZ29yeUlkIikgPzogIiIKCiAgICAgICAgbGlzdCA9IGZpbmRWaWV3QnlJ
ZChSLmlkLmd1aWRlTGlzdCkKICAgICAgICBwcm9ncmVzcyA9IGZpbmRWaWV3QnlJZChSLmlkLmd1
aWRlUHJvZ3Jlc3MpCiAgICAgICAgZW1wdHkgPSBmaW5kVmlld0J5SWQoUi5pZC5ndWlkZUVtcHR5
KQogICAgICAgIHRpbWVTY3JvbGwgPSBmaW5kVmlld0J5SWQoUi5pZC50aW1lU2Nyb2xsKQogICAg
ICAgIHRpbWVCYXIgPSBmaW5kVmlld0J5SWQoUi5pZC50aW1lQmFyKQogICAgICAgIGRldGFpbFRp
dGxlID0gZmluZFZpZXdCeUlkKFIuaWQuZ3VpZGVEZXRhaWxUaXRsZSkKICAgICAgICBkZXRhaWxN
ZXRhID0gZmluZFZpZXdCeUlkKFIuaWQuZ3VpZGVEZXRhaWxNZXRhKQogICAgICAgIGRldGFpbERl
c2NyaXB0aW9uID0gZmluZFZpZXdCeUlkKFIuaWQuZ3VpZGVEZXRhaWxEZXNjcmlwdGlvbikKICAg
ICAgICBkZXRhaWxQcm9ncmVzcyA9IGZpbmRWaWV3QnlJZChSLmlkLmd1aWRlRGV0YWlsUHJvZ3Jl
c3MpCiAgICAgICAgZGV0YWlsUHJvZ3Jlc3NMYWJlbCA9IGZpbmRWaWV3QnlJZChSLmlkLmd1aWRl
UHJvZ3Jlc3NMYWJlbCkKICAgICAgICB3YXRjaEJ1dHRvbiA9IGZpbmRWaWV3QnlJZChSLmlkLmd1
aWRlV2F0Y2hCdXR0b24pCiAgICAgICAgZ3VpZGVOb3dCdXR0b24gPSBmaW5kVmlld0J5SWQoUi5p
ZC5ndWlkZU5vd0J1dHRvbikKICAgICAgICBndWlkZUNsb2NrID0gZmluZFZpZXdCeUlkKFIuaWQu
Z3VpZGVDbG9jaykKICAgICAgICBndWlkZURhdGUgPSBmaW5kVmlld0J5SWQoUi5pZC5ndWlkZURh
dGUpCiAgICAgICAgZ3VpZGVDaGFubmVsQ291bnQgPSBmaW5kVmlld0J5SWQoUi5pZC5ndWlkZUNo
YW5uZWxDb3VudCkKCiAgICAgICAgZmluZFZpZXdCeUlkPEJ1dHRvbj4oUi5pZC5ndWlkZUhvbWVC
dXR0b24pLnNldE9uQ2xpY2tMaXN0ZW5lciB7IGZpbmlzaCgpIH0KICAgICAgICBndWlkZU5vd0J1
dHRvbi5zZXRPbkNsaWNrTGlzdGVuZXIgeyBqdW1wVG9Ob3coKSB9CgogICAgICAgIHdhdGNoQnV0
dG9uLmlzRW5hYmxlZCA9IGZhbHNlCiAgICAgICAgd2F0Y2hCdXR0b24uYWxwaGEgPSAwLjU1Zgog
ICAgICAgIHdhdGNoQnV0dG9uLnNldE9uQ2xpY2tMaXN0ZW5lciB7IHNlbGVjdGVkQ2hhbm5lbD8u
bGV0IHsgb3BlbkNoYW5uZWwoaXQpIH0gfQoKICAgICAgICBkZXRhaWxQcm9ncmVzcy5wcm9ncmVz
cyA9IDAKICAgICAgICBkZXRhaWxQcm9ncmVzc0xhYmVsLnRleHQgPSAiU2VsZWN0IGEgcHJvZ3Jh
bSB0byBzZWUgbGl2ZSBwcm9ncmVzcyIKICAgICAgICB1cGRhdGVIZWFkZXJDbG9jaygpCiAgICAg
ICAgYnVpbGRUaW1lQmFyKCkKICAgICAgICBsb2FkQ2hhbm5lbHMoKQogICAgfQoKICAgIG92ZXJy
aWRlIGZ1biBvblJlc3VtZSgpIHsKICAgICAgICBzdXBlci5vblJlc3VtZSgpCiAgICAgICAgdWlI
YW5kbGVyLnJlbW92ZUNhbGxiYWNrcyhjbG9ja1RpY2tlcikKICAgICAgICB1aUhhbmRsZXIucG9z
dChjbG9ja1RpY2tlcikKICAgIH0KCiAgICBvdmVycmlkZSBmdW4gb25QYXVzZSgpIHsKICAgICAg
ICB1aUhhbmRsZXIucmVtb3ZlQ2FsbGJhY2tzKGNsb2NrVGlja2VyKQogICAgICAgIHN1cGVyLm9u
UGF1c2UoKQogICAgfQoKICAgIHByaXZhdGUgZnVuIGxvYWRDaGFubmVscygpIHsKICAgICAgICB2
YWwgdGhpc0dlbmVyYXRpb24gPSArK2dlbmVyYXRpb24KICAgICAgICBwcm9ncmVzcy52aXNpYmls
aXR5ID0gVmlldy5WSVNJQkxFCiAgICAgICAgZW1wdHkudmlzaWJpbGl0eSA9IFZpZXcuR09ORQog
ICAgICAgIGxpc3QudmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgICAgIGV4ZWN1dG9yLmV4ZWN1
dGUgewogICAgICAgICAgICB0cnkgewogICAgICAgICAgICAgICAgdmFsIGxvYWRlZCA9IFh0cmVh
bUNsaWVudC5saXZlU3RyZWFtcyhjcmVkZW50aWFscywgY2F0ZWdvcnlJZCkKICAgICAgICAgICAg
ICAgIGlmICh0aGlzR2VuZXJhdGlvbiAhPSBnZW5lcmF0aW9uKSByZXR1cm5AZXhlY3V0ZQoKICAg
ICAgICAgICAgICAgIHZhbCB4bWxDaGFubmVsSWRzID0gbG9hZGVkCiAgICAgICAgICAgICAgICAg
ICAgLm1hcCB7IGl0LmVwZ0NoYW5uZWxJZCB9CiAgICAgICAgICAgICAgICAgICAgLmZpbHRlciB7
IGl0LmlzTm90QmxhbmsoKSB9CiAgICAgICAgICAgICAgICAgICAgLnRvU2V0KCkKCiAgICAgICAg
ICAgICAgICB2YWwgeG1sR3VpZGUgPSBpZiAoeG1sQ2hhbm5lbElkcy5pc05vdEVtcHR5KCkpIHsK
ICAgICAgICAgICAgICAgICAgICBydW5DYXRjaGluZyB7CiAgICAgICAgICAgICAgICAgICAgICAg
IFh0cmVhbUNsaWVudC54bWxUdkd1aWRlKAogICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Jl
ZGVudGlhbHMsCiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4bWxDaGFubmVsSWRzLAogICAg
ICAgICAgICAgICAgICAgICAgICAgICAgdGltZWxpbmVTdGFydE1zLAogICAgICAgICAgICAgICAg
ICAgICAgICAgICAgdGltZWxpbmVFbmRNcwogICAgICAgICAgICAgICAgICAgICAgICApCiAgICAg
ICAgICAgICAgICAgICAgfS5nZXRPckRlZmF1bHQoZW1wdHlNYXAoKSkKICAgICAgICAgICAgICAg
IH0gZWxzZSB7CiAgICAgICAgICAgICAgICAgICAgZW1wdHlNYXAoKQogICAgICAgICAgICAgICAg
fQoKICAgICAgICAgICAgICAgIGlmICh0aGlzR2VuZXJhdGlvbiAhPSBnZW5lcmF0aW9uKSByZXR1
cm5AZXhlY3V0ZQogICAgICAgICAgICAgICAgY2hhbm5lbHMgPSBsb2FkZWQKCiAgICAgICAgICAg
ICAgICBndWlkZXMuY2xlYXIoKQogICAgICAgICAgICAgICAgcmVxdWVzdGVkLmNsZWFyKCkKICAg
ICAgICAgICAgICAgIGxvYWRlZC5mb3JFYWNoIHsgY2hhbm5lbCAtPgogICAgICAgICAgICAgICAg
ICAgIHZhbCBrZXkgPSBjaGFubmVsLmVwZ0NoYW5uZWxJZC50cmltKCkubG93ZXJjYXNlKExvY2Fs
ZS5VUykKICAgICAgICAgICAgICAgICAgICB2YWwgaXRlbXMgPSB4bWxHdWlkZVtrZXldLm9yRW1w
dHkoKQogICAgICAgICAgICAgICAgICAgIGlmIChoYXNVc2FibGVHdWlkZShpdGVtcykpIHsKICAg
ICAgICAgICAgICAgICAgICAgICAgZ3VpZGVzW2NoYW5uZWwuaWRdID0gaXRlbXMKICAgICAgICAg
ICAgICAgICAgICAgICAgcmVxdWVzdGVkLmFkZChjaGFubmVsLmlkKQogICAgICAgICAgICAgICAg
ICAgIH0KICAgICAgICAgICAgICAgIH0KCiAgICAgICAgICAgICAgICBydW5PblVpVGhyZWFkIHsK
ICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbm5lbHMuaXNFbXB0eSgpKSB7CiAgICAgICAgICAg
ICAgICAgICAgICAgIHByb2dyZXNzLnZpc2liaWxpdHkgPSBWaWV3LkdPTkUKICAgICAgICAgICAg
ICAgICAgICAgICAgZW1wdHkudGV4dCA9ICJObyBjaGFubmVscyBhcmUgYXZhaWxhYmxlIGZvciB0
aGlzIGd1aWRlLiIKICAgICAgICAgICAgICAgICAgICAgICAgZW1wdHkudmlzaWJpbGl0eSA9IFZp
ZXcuVklTSUJMRQogICAgICAgICAgICAgICAgICAgICAgICBndWlkZUNoYW5uZWxDb3VudC50ZXh0
ID0gIjAgQ0hBTk5FTFMiCiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybkBydW5PblVpVGhy
ZWFkCiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIGNyZWF0ZUFkYXB0
ZXIodGhpc0dlbmVyYXRpb24pCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0gY2F0Y2gg
KGU6IEV4Y2VwdGlvbikgewogICAgICAgICAgICAgICAgcnVuT25VaVRocmVhZCB7CiAgICAgICAg
ICAgICAgICAgICAgcHJvZ3Jlc3MudmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgICAgICAgICAg
ICAgICAgIGVtcHR5LnRleHQgPSBlLm1lc3NhZ2UgPzogIlVuYWJsZSB0byBsb2FkIFRWIGd1aWRl
IGNoYW5uZWxzLiIKICAgICAgICAgICAgICAgICAgICBlbXB0eS52aXNpYmlsaXR5ID0gVmlldy5W
SVNJQkxFCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9Cgog
ICAgcHJpdmF0ZSBmdW4gY3JlYXRlQWRhcHRlcih0aGlzR2VuZXJhdGlvbjogSW50KSB7CiAgICAg
ICAgdmFsIGNoYW5uZWxXaWR0aCA9IGlmIChyZXNvdXJjZXMuY29uZmlndXJhdGlvbi5vcmllbnRh
dGlvbiA9PSBDb25maWd1cmF0aW9uLk9SSUVOVEFUSU9OX0xBTkRTQ0FQRSkgMjI0IGVsc2UgMTM4
CiAgICAgICAgZ3VpZGVDaGFubmVsQ291bnQudGV4dCA9ICIke2NoYW5uZWxzLnNpemV9IENIQU5O
RUxTIgogICAgICAgIGFkYXB0ZXIgPSBFcGdHdWlkZUFkYXB0ZXIoCiAgICAgICAgICAgIHJvd0Nv
bnRleHQgPSB0aGlzLAogICAgICAgICAgICBjaGFubmVscyA9IGNoYW5uZWxzLAogICAgICAgICAg
ICBndWlkZVByb3ZpZGVyID0geyBndWlkZXNbaXQuaWRdIH0sCiAgICAgICAgICAgIHRpbWVsaW5l
U3RhcnRNcyA9IHRpbWVsaW5lU3RhcnRNcywKICAgICAgICAgICAgdGltZWxpbmVFbmRNcyA9IHRp
bWVsaW5lRW5kTXMsCiAgICAgICAgICAgIHBpeGVsc1Blck1pbnV0ZURwID0gcGl4ZWxzUGVyTWlu
dXRlRHAsCiAgICAgICAgICAgIGNoYW5uZWxXaWR0aERwID0gY2hhbm5lbFdpZHRoLAogICAgICAg
ICAgICBvblByb2dyYW1Gb2N1c2VkID0geyBjaGFubmVsLCBpdGVtLCBzdGFydCwgZW5kLCBjdXJy
ZW50IC0+IHNlbGVjdFByb2dyYW0oY2hhbm5lbCwgaXRlbSwgc3RhcnQsIGVuZCwgY3VycmVudCkg
fSwKICAgICAgICAgICAgb25Qcm9ncmFtQ2xpY2tlZCA9IHsgY2hhbm5lbCwgaXRlbSwgc3RhcnQs
IGVuZCwgY3VycmVudCAtPgogICAgICAgICAgICAgICAgc2VsZWN0UHJvZ3JhbShjaGFubmVsLCBp
dGVtLCBzdGFydCwgZW5kLCBjdXJyZW50KQogICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQpIG9w
ZW5DaGFubmVsKGNoYW5uZWwpCiAgICAgICAgICAgICAgICBlbHNlIFRvYXN0Lm1ha2VUZXh0KHRo
aXMsICIke2l0ZW0udGl0bGV9IHN0YXJ0cyAke2Zvcm1hdFRpbWUoc3RhcnQpfSIsIFRvYXN0LkxF
TkdUSF9TSE9SVCkuc2hvdygpCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIG9uSG9yaXpvbnRh
bENoYW5nZWQgPSB7IHggLT4gaWYgKHRpbWVTY3JvbGwuc2Nyb2xsWCAhPSB4KSB0aW1lU2Nyb2xs
LnNjcm9sbFRvKHgsIDApIH0KICAgICAgICApCiAgICAgICAgbGlzdC5hZGFwdGVyID0gYWRhcHRl
cgogICAgICAgIGxpc3QuaXRlbXNDYW5Gb2N1cyA9IHRydWUKICAgICAgICBsaXN0LnZpc2liaWxp
dHkgPSBWaWV3LlZJU0lCTEUKICAgICAgICBwcm9ncmVzcy52aXNpYmlsaXR5ID0gVmlldy5HT05F
CiAgICAgICAgbGlzdC5zZXRPblNjcm9sbExpc3RlbmVyKG9iamVjdCA6IGFuZHJvaWQud2lkZ2V0
LkFic0xpc3RWaWV3Lk9uU2Nyb2xsTGlzdGVuZXIgewogICAgICAgICAgICBvdmVycmlkZSBmdW4g
b25TY3JvbGxTdGF0ZUNoYW5nZWQodmlldzogYW5kcm9pZC53aWRnZXQuQWJzTGlzdFZpZXc/LCBz
Y3JvbGxTdGF0ZTogSW50KSA9IFVuaXQKICAgICAgICAgICAgb3ZlcnJpZGUgZnVuIG9uU2Nyb2xs
KHZpZXc6IGFuZHJvaWQud2lkZ2V0LkFic0xpc3RWaWV3PywgZmlyc3RWaXNpYmxlSXRlbTogSW50
LCB2aXNpYmxlSXRlbUNvdW50OiBJbnQsIHRvdGFsSXRlbUNvdW50OiBJbnQpIHsKICAgICAgICAg
ICAgICAgIGlmICh2aXNpYmxlSXRlbUNvdW50ID4gMCkgcmVxdWVzdEd1aWRlUmFuZ2UoZmlyc3RW
aXNpYmxlSXRlbSwgdmlzaWJsZUl0ZW1Db3VudCArIDYsIHRoaXNHZW5lcmF0aW9uKQogICAgICAg
ICAgICB9CiAgICAgICAgfSkKICAgICAgICB0aW1lU2Nyb2xsLnNldE9uU2Nyb2xsQ2hhbmdlTGlz
dGVuZXIgeyBfLCB4LCBfLCBfLCBfIC0+IGFkYXB0ZXI/LnNldEdsb2JhbFNjcm9sbFgoeCkgfQog
ICAgICAgIHJlcXVlc3RHdWlkZVJhbmdlKDAsIG1pbk9mKDE4LCBjaGFubmVscy5zaXplKSwgdGhp
c0dlbmVyYXRpb24pCiAgICAgICAgbGlzdC5wb3N0IHsKICAgICAgICAgICAganVtcFRvTm93KCkK
ICAgICAgICAgICAgbGlzdC5yZXF1ZXN0Rm9jdXMoKQogICAgICAgICAgICBsaXN0LnNldFNlbGVj
dGlvbigwKQogICAgICAgIH0KICAgIH0KCiAgICAvKioKICAgICAqIFhNTFRWIHJlbWFpbnMgdGhl
IHByZWZlcnJlZCBzb3VyY2UuIFNvbWUgY2hhbm5lbHMgaW4gdGhpcyBwcm92aWRlcidzCiAgICAg
KiA3LDAwMCsgY2hhbm5lbCBsaXN0IGRvIG5vdCBoYXZlIGEgdXNhYmxlIFhNTFRWIG1hdGNoLCBz
byBmZXRjaCB0aGUgZnVsbAogICAgICogcGVyLWNoYW5uZWwgdGFibGUgb25jZSBmb3Igb25seSB0
aGUgdmlzaWJsZSBtaXNzaW5nIHJvd3MuIEEgY29tcGxldGVkCiAgICAgKiByZXN1bHQgaXMgY2Fj
aGVkIGFuZCBpcyBuZXZlciBjbGVhcmVkIG9yIHJlcGxhY2VkIGR1cmluZyBzY3JvbGxpbmcuCiAg
ICAgKi8KICAgIHByaXZhdGUgZnVuIHJlcXVlc3RHdWlkZVJhbmdlKGZpcnN0OiBJbnQsIGNvdW50
OiBJbnQsIHRoaXNHZW5lcmF0aW9uOiBJbnQpIHsKICAgICAgICBpZiAodGhpc0dlbmVyYXRpb24g
IT0gZ2VuZXJhdGlvbikgcmV0dXJuCiAgICAgICAgdmFsIHN0YXJ0ID0gZmlyc3QuY29lcmNlQXRM
ZWFzdCgwKQogICAgICAgIHZhbCBlbmQgPSAoc3RhcnQgKyBjb3VudCkuY29lcmNlQXRNb3N0KGNo
YW5uZWxzLnNpemUpCiAgICAgICAgZm9yIChpIGluIHN0YXJ0IHVudGlsIGVuZCkgewogICAgICAg
ICAgICB2YWwgY2hhbm5lbCA9IGNoYW5uZWxzLmdldE9yTnVsbChpKSA/OiBjb250aW51ZQogICAg
ICAgICAgICBpZiAoIXJlcXVlc3RlZC5hZGQoY2hhbm5lbC5pZCkpIGNvbnRpbnVlCiAgICAgICAg
ICAgIGVwZ0V4ZWN1dG9yLmV4ZWN1dGUgewogICAgICAgICAgICAgICAgdmFsIGZldGNoZWQgPSBy
dW5DYXRjaGluZyB7CiAgICAgICAgICAgICAgICAgICAgWHRyZWFtQ2xpZW50Lmd1aWRlRXBnKGNy
ZWRlbnRpYWxzLCBjaGFubmVsLmlkLCA5NikKICAgICAgICAgICAgICAgIH0uZ2V0T3JEZWZhdWx0
KGVtcHR5TGlzdCgpKQogICAgICAgICAgICAgICAgaWYgKHRoaXNHZW5lcmF0aW9uICE9IGdlbmVy
YXRpb24pIHJldHVybkBleGVjdXRlCgogICAgICAgICAgICAgICAgZ3VpZGVzW2NoYW5uZWwuaWRd
ID0gaWYgKGhhc1VzYWJsZUd1aWRlKGZldGNoZWQpKSBmZXRjaGVkIGVsc2UgZW1wdHlMaXN0KCkK
ICAgICAgICAgICAgICAgIHJ1bk9uVWlUaHJlYWQgewogICAgICAgICAgICAgICAgICAgIGlmICh0
aGlzR2VuZXJhdGlvbiA9PSBnZW5lcmF0aW9uKSBhZGFwdGVyPy5ub3RpZnlEYXRhU2V0Q2hhbmdl
ZCgpCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9CgogICAg
cHJpdmF0ZSBmdW4gaGFzVXNhYmxlR3VpZGUoaXRlbXM6IExpc3Q8RXBnSXRlbT4pOiBCb29sZWFu
IHsKICAgICAgICByZXR1cm4gaXRlbXMuYW55IHsgaXRlbSAtPgogICAgICAgICAgICB2YWwgc3Rh
cnQgPSBpdGVtLnN0YXJ0VGltZXN0YW1wPy50aW1lcygxMDAwTCkKICAgICAgICAgICAgdmFsIGVu
ZCA9IGl0ZW0uZW5kVGltZXN0YW1wPy50aW1lcygxMDAwTCkKICAgICAgICAgICAgc3RhcnQgIT0g
bnVsbCAmJiBlbmQgIT0gbnVsbCAmJiBlbmQgPiB0aW1lbGluZVN0YXJ0TXMgJiYgc3RhcnQgPCB0
aW1lbGluZUVuZE1zCiAgICAgICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIGJ1aWxkVGltZUJh
cigpIHsKICAgICAgICB0aW1lQmFyLnJlbW92ZUFsbFZpZXdzKCkKICAgICAgICB2YWwgdG90YWxN
aW51dGVzID0gKCh0aW1lbGluZUVuZE1zIC0gdGltZWxpbmVTdGFydE1zKSAvIDYwXzAwMEwpLnRv
SW50KCkKICAgICAgICB2YWwgd2lkdGhQeCA9ICh0b3RhbE1pbnV0ZXMgKiBwaXhlbHNQZXJNaW51
dGVEcCkuZHAKICAgICAgICB0aW1lQmFyLmxheW91dFBhcmFtcyA9IHRpbWVCYXIubGF5b3V0UGFy
YW1zLmFwcGx5IHsgd2lkdGggPSB3aWR0aFB4IH0KCiAgICAgICAgdmFyIHQgPSB0aW1lbGluZVN0
YXJ0TXMKICAgICAgICB2YXIgc2xvdEluZGV4ID0gMAogICAgICAgIHdoaWxlICh0IDwgdGltZWxp
bmVFbmRNcykgewogICAgICAgICAgICB2YWwgbGVmdE1pbnV0ZXMgPSAoKHQgLSB0aW1lbGluZVN0
YXJ0TXMpIC8gNjBfMDAwTCkudG9JbnQoKQogICAgICAgICAgICB2YWwgbGFiZWwgPSBUZXh0Vmll
dyh0aGlzKS5hcHBseSB7CiAgICAgICAgICAgICAgICB0ZXh0ID0gZm9ybWF0VGltZSh0KQogICAg
ICAgICAgICAgICAgc2V0VGV4dENvbG9yKGdldENvbG9yKGlmIChzbG90SW5kZXggPT0gMCkgUi5j
b2xvci5rc19tdXRlZCBlbHNlIFIuY29sb3Iua3Nfd2hpdGUpKQogICAgICAgICAgICAgICAgdGV4
dFNpemUgPSAxMmYKICAgICAgICAgICAgICAgIHNldFR5cGVmYWNlKHR5cGVmYWNlLCBhbmRyb2lk
LmdyYXBoaWNzLlR5cGVmYWNlLkJPTEQpCiAgICAgICAgICAgICAgICBncmF2aXR5ID0gR3Jhdml0
eS5DRU5URVJfVkVSVElDQUwKICAgICAgICAgICAgICAgIHNldFBhZGRpbmcoMTAuZHAsIDAsIDAs
IDApCiAgICAgICAgICAgICAgICBzZXRCYWNrZ3JvdW5kQ29sb3IoQ29sb3IuVFJBTlNQQVJFTlQp
CiAgICAgICAgICAgIH0KICAgICAgICAgICAgdGltZUJhci5hZGRWaWV3KGxhYmVsLCBGcmFtZUxh
eW91dC5MYXlvdXRQYXJhbXMoKDMwICogcGl4ZWxzUGVyTWludXRlRHApLmRwLCA0NC5kcCkuYXBw
bHkgewogICAgICAgICAgICAgICAgbGVmdE1hcmdpbiA9IChsZWZ0TWludXRlcyAqIHBpeGVsc1Bl
ck1pbnV0ZURwKS5kcAogICAgICAgICAgICB9KQoKICAgICAgICAgICAgdmFsIGRpdmlkZXIgPSBW
aWV3KHRoaXMpLmFwcGx5IHsKICAgICAgICAgICAgICAgIHNldEJhY2tncm91bmRDb2xvcihnZXRD
b2xvcihSLmNvbG9yLmtzX2xpbmUpKQogICAgICAgICAgICAgICAgYWxwaGEgPSAwLjY1ZgogICAg
ICAgICAgICB9CiAgICAgICAgICAgIHRpbWVCYXIuYWRkVmlldyhkaXZpZGVyLCBGcmFtZUxheW91
dC5MYXlvdXRQYXJhbXMoMS5kcCwgNDQuZHApLmFwcGx5IHsKICAgICAgICAgICAgICAgIGxlZnRN
YXJnaW4gPSAobGVmdE1pbnV0ZXMgKiBwaXhlbHNQZXJNaW51dGVEcCkuZHAKICAgICAgICAgICAg
fSkKCiAgICAgICAgICAgIHQgKz0gc2xvdE1zCiAgICAgICAgICAgIHNsb3RJbmRleCsrCiAgICAg
ICAgfQoKICAgICAgICBub3dNYXJrZXIgPSBWaWV3KHRoaXMpLmFwcGx5IHsKICAgICAgICAgICAg
c2V0QmFja2dyb3VuZENvbG9yKGdldENvbG9yKFIuY29sb3Iua3NfcmVkKSkKICAgICAgICAgICAg
ZWxldmF0aW9uID0gOGYKICAgICAgICB9LmFsc28gewogICAgICAgICAgICB0aW1lQmFyLmFkZFZp
ZXcoaXQsIEZyYW1lTGF5b3V0LkxheW91dFBhcmFtcygzLmRwLCA0NC5kcCkpCiAgICAgICAgfQoK
ICAgICAgICBub3dMYWJlbCA9IFRleHRWaWV3KHRoaXMpLmFwcGx5IHsKICAgICAgICAgICAgdGV4
dCA9ICJOT1ciCiAgICAgICAgICAgIHNldFRleHRDb2xvcihnZXRDb2xvcihSLmNvbG9yLmtzX3do
aXRlKSkKICAgICAgICAgICAgc2V0QmFja2dyb3VuZFJlc291cmNlKFIuZHJhd2FibGUuYmdfZXBn
X25vd19iYWRnZSkKICAgICAgICAgICAgdGV4dFNpemUgPSA5ZgogICAgICAgICAgICBzZXRUeXBl
ZmFjZSh0eXBlZmFjZSwgYW5kcm9pZC5ncmFwaGljcy5UeXBlZmFjZS5CT0xEKQogICAgICAgICAg
ICBncmF2aXR5ID0gR3Jhdml0eS5DRU5URVIKICAgICAgICAgICAgc2V0UGFkZGluZyg1LmRwLCAw
LCA1LmRwLCAwKQogICAgICAgIH0uYWxzbyB7CiAgICAgICAgICAgIHRpbWVCYXIuYWRkVmlldyhp
dCwgRnJhbWVMYXlvdXQuTGF5b3V0UGFyYW1zKDQ4LmRwLCAyMi5kcCkpCiAgICAgICAgfQoKICAg
ICAgICB1cGRhdGVOb3dQb3NpdGlvbihqdW1wID0gZmFsc2UpCiAgICB9CgogICAgcHJpdmF0ZSBm
dW4gdXBkYXRlTm93UG9zaXRpb24oanVtcDogQm9vbGVhbikgewogICAgICAgIGlmICghOjp0aW1l
QmFyLmlzSW5pdGlhbGl6ZWQpIHJldHVybgogICAgICAgIHZhbCB3aWR0aFB4ID0gKCgodGltZWxp
bmVFbmRNcyAtIHRpbWVsaW5lU3RhcnRNcykgLyA2MF8wMDBMKSAqIHBpeGVsc1Blck1pbnV0ZURw
KS50b0ludCgpLmRwCiAgICAgICAgdmFsIG5vd1ggPSAoKCgoU3lzdGVtLmN1cnJlbnRUaW1lTWls
bGlzKCkgLSB0aW1lbGluZVN0YXJ0TXMpLmNvZXJjZUF0TGVhc3QoMEwpKSAvIDYwXzAwMC4wKSAq
IHBpeGVsc1Blck1pbnV0ZURwKS50b0ludCgpLmRwCiAgICAgICAgdmFsIHNhZmVYID0gbm93WC5j
b2VyY2VJbigwLCAod2lkdGhQeCAtIDMuZHApLmNvZXJjZUF0TGVhc3QoMCkpCgogICAgICAgIChu
b3dNYXJrZXI/LmxheW91dFBhcmFtcyBhcz8gRnJhbWVMYXlvdXQuTGF5b3V0UGFyYW1zKT8ubGV0
IHsgcGFyYW1zIC0+CiAgICAgICAgICAgIHBhcmFtcy5sZWZ0TWFyZ2luID0gc2FmZVgKICAgICAg
ICAgICAgbm93TWFya2VyPy5sYXlvdXRQYXJhbXMgPSBwYXJhbXMKICAgICAgICB9CiAgICAgICAg
KG5vd0xhYmVsPy5sYXlvdXRQYXJhbXMgYXM/IEZyYW1lTGF5b3V0LkxheW91dFBhcmFtcyk/Lmxl
dCB7IHBhcmFtcyAtPgogICAgICAgICAgICBwYXJhbXMubGVmdE1hcmdpbiA9IChzYWZlWCArIDUu
ZHApLmNvZXJjZUF0TW9zdCgod2lkdGhQeCAtIDQ4LmRwKS5jb2VyY2VBdExlYXN0KDApKQogICAg
ICAgICAgICBwYXJhbXMudG9wTWFyZ2luID0gMi5kcAogICAgICAgICAgICBub3dMYWJlbD8ubGF5
b3V0UGFyYW1zID0gcGFyYW1zCiAgICAgICAgfQogICAgICAgIG5vd01hcmtlcj8ucmVxdWVzdExh
eW91dCgpCiAgICAgICAgbm93TGFiZWw/LnJlcXVlc3RMYXlvdXQoKQoKICAgICAgICBpZiAoanVt
cCkgewogICAgICAgICAgICAvLyBUaGUgY3VycmVudCBzbG90IHN0YXJ0cyBvbiBzY3JlZW4sIHNv
IGtlZXAgaXRzIGxhYmVsIHZpc2libGUuCiAgICAgICAgICAgIC8vIEhvcml6b250YWwgc2Nyb2xs
aW5nIGlzIHN0aWxsIGF2YWlsYWJsZSBmb3IgdGhlIG5leHQgZWlnaHQgaG91cnMuCiAgICAgICAg
ICAgIHZhbCB0YXJnZXQgPSAwCiAgICAgICAgICAgIHRpbWVTY3JvbGwuc21vb3RoU2Nyb2xsVG8o
dGFyZ2V0LCAwKQogICAgICAgICAgICBhZGFwdGVyPy5zZXRHbG9iYWxTY3JvbGxYKHRhcmdldCkK
ICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4ganVtcFRvTm93KCkgewogICAgICAgIHVw
ZGF0ZUhlYWRlckNsb2NrKCkKICAgICAgICB1cGRhdGVOb3dQb3NpdGlvbihqdW1wID0gdHJ1ZSkK
ICAgIH0KCiAgICBwcml2YXRlIGZ1biB1cGRhdGVIZWFkZXJDbG9jaygpIHsKICAgICAgICB2YWwg
bm93ID0gRGF0ZSgpCiAgICAgICAgZ3VpZGVDbG9jay50ZXh0ID0gU2ltcGxlRGF0ZUZvcm1hdCgi
aDptbSBhIiwgTG9jYWxlLmdldERlZmF1bHQoKSkuZm9ybWF0KG5vdykKICAgICAgICBndWlkZURh
dGUudGV4dCA9IFNpbXBsZURhdGVGb3JtYXQoIkVFRSwgTU1NIGQiLCBMb2NhbGUuZ2V0RGVmYXVs
dCgpKS5mb3JtYXQobm93KS51cHBlcmNhc2UoTG9jYWxlLmdldERlZmF1bHQoKSkKICAgIH0KCiAg
ICBwcml2YXRlIGZ1biBzZWxlY3RQcm9ncmFtKGNoYW5uZWw6IExpdmVTdHJlYW0sIGl0ZW06IEVw
Z0l0ZW0sIHN0YXJ0OiBMb25nLCBlbmQ6IExvbmcsIGN1cnJlbnQ6IEJvb2xlYW4pIHsKICAgICAg
ICBzZWxlY3RlZENoYW5uZWwgPSBjaGFubmVsCiAgICAgICAgZGV0YWlsVGl0bGUudGV4dCA9IGl0
ZW0udGl0bGUuaWZCbGFuayB7ICJMaXZlIFByb2dyYW1taW5nIiB9CgogICAgICAgIHZhbCBub3cg
PSBTeXN0ZW0uY3VycmVudFRpbWVNaWxsaXMoKQogICAgICAgIHZhbCBwY3QgPSBpZiAoY3VycmVu
dCAmJiBlbmQgPiBzdGFydCkgewogICAgICAgICAgICAoKChub3cgLSBzdGFydCkuY29lcmNlSW4o
MEwsIGVuZCAtIHN0YXJ0KSAqIDEwMCkgLyAoZW5kIC0gc3RhcnQpKS50b0ludCgpCiAgICAgICAg
fSBlbHNlIDAKCiAgICAgICAgZGV0YWlsTWV0YS50ZXh0ID0gYnVpbGRTdHJpbmcgewogICAgICAg
ICAgICBhcHBlbmQoaWYgKGN1cnJlbnQpICJMSVZFIE5PVyIgZWxzZSBpZiAoc3RhcnQgPiBub3cp
ICJVUENPTUlORyIgZWxzZSAiUkVDRU5UIikKICAgICAgICAgICAgYXBwZW5kKCIgIOKAoiAgJHtj
aGFubmVsLm5hbWV9IikKICAgICAgICAgICAgYXBwZW5kKCIgIOKAoiAgJHtmb3JtYXRUaW1lKHN0
YXJ0KX3igJMke2Zvcm1hdFRpbWUoZW5kKX0iKQogICAgICAgIH0KICAgICAgICBkZXRhaWxEZXNj
cmlwdGlvbi50ZXh0ID0gaXRlbS5kZXNjcmlwdGlvbi5pZkJsYW5rIHsgIlByb2dyYW0gZGV0YWls
cyBzdXBwbGllZCBieSB5b3VyIFRWIHByb3ZpZGVyLiIgfQoKICAgICAgICBkZXRhaWxQcm9ncmVz
cy5wcm9ncmVzcyA9IHBjdAogICAgICAgIGRldGFpbFByb2dyZXNzTGFiZWwudGV4dCA9IHdoZW4g
ewogICAgICAgICAgICBjdXJyZW50IC0+ICIkcGN0JSBjb21wbGV0ZSAg4oCiICAke2Zvcm1hdFJl
bWFpbmluZyhlbmQgLSBub3cpfSByZW1haW5pbmciCiAgICAgICAgICAgIHN0YXJ0ID4gbm93IC0+
ICJTdGFydHMgJHtmb3JtYXRUaW1lKHN0YXJ0KX0iCiAgICAgICAgICAgIGVsc2UgLT4gIlByb2dy
YW0gZW5kZWQgJHtmb3JtYXRUaW1lKGVuZCl9IgogICAgICAgIH0KCiAgICAgICAgd2F0Y2hCdXR0
b24uaXNFbmFibGVkID0gdHJ1ZQogICAgICAgIHdhdGNoQnV0dG9uLmFscGhhID0gMWYKICAgICAg
ICB3YXRjaEJ1dHRvbi50ZXh0ID0gaWYgKGN1cnJlbnQpICJXQVRDSCBOT1ciIGVsc2UgIldBVENI
IENIQU5ORUwiCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gZm9ybWF0UmVtYWluaW5nKG1zOiBMb25n
KTogU3RyaW5nIHsKICAgICAgICB2YWwgc2FmZSA9IG1zLmNvZXJjZUF0TGVhc3QoMEwpCiAgICAg
ICAgdmFsIG1pbnV0ZXMgPSAoc2FmZSAvIDYwXzAwMEwpLnRvSW50KCkKICAgICAgICByZXR1cm4g
d2hlbiB7CiAgICAgICAgICAgIG1pbnV0ZXMgPj0gNjAgLT4gIiR7bWludXRlcyAvIDYwfWggJHtt
aW51dGVzICUgNjB9bSIKICAgICAgICAgICAgbWludXRlcyA+IDAgLT4gIiR7bWludXRlc31tIgog
ICAgICAgICAgICBlbHNlIC0+ICI8MW0iCiAgICAgICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVu
IG9wZW5DaGFubmVsKGNoYW5uZWw6IExpdmVTdHJlYW0pIHsKICAgICAgICBzdGFydEFjdGl2aXR5
KEludGVudCh0aGlzLCBQbGF5ZXJBY3Rpdml0eTo6Y2xhc3MuamF2YSkuYXBwbHkgewogICAgICAg
ICAgICBwdXRFeHRyYSgibmFtZSIsIGNoYW5uZWwubmFtZSkKICAgICAgICAgICAgcHV0RXh0cmEo
InVybCIsIFh0cmVhbUNsaWVudC5zdHJlYW1VcmwoY3JlZGVudGlhbHMsIGNoYW5uZWwpKQogICAg
ICAgICAgICBwdXRFeHRyYSgia2luZCIsICJsaXZlIikKICAgICAgICAgICAgcHV0RXh0cmEoInN0
cmVhbUlkIiwgY2hhbm5lbC5pZCkKICAgICAgICB9KQogICAgfQoKICAgIHByaXZhdGUgZnVuIGZv
cm1hdFRpbWUobXM6IExvbmcpOiBTdHJpbmcgPSB0cnkgewogICAgICAgIFNpbXBsZURhdGVGb3Jt
YXQoImg6bW0gYSIsIExvY2FsZS5nZXREZWZhdWx0KCkpLmZvcm1hdChEYXRlKG1zKSkKICAgIH0g
Y2F0Y2ggKF86IEV4Y2VwdGlvbikgeyAiIiB9CgogICAgcHJpdmF0ZSB2YWwgSW50LmRwOiBJbnQg
Z2V0KCkgPSAodGhpcyAqIHJlc291cmNlcy5kaXNwbGF5TWV0cmljcy5kZW5zaXR5KS50b0ludCgp
CgogICAgb3ZlcnJpZGUgZnVuIG9uRGVzdHJveSgpIHsKICAgICAgICBnZW5lcmF0aW9uKysKICAg
ICAgICB1aUhhbmRsZXIucmVtb3ZlQ2FsbGJhY2tzKGNsb2NrVGlja2VyKQogICAgICAgIGV4ZWN1
dG9yLnNodXRkb3duTm93KCkKICAgICAgICBlcGdFeGVjdXRvci5zaHV0ZG93bk5vdygpCiAgICAg
ICAgc3VwZXIub25EZXN0cm95KCkKICAgIH0KfQo=
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
ICAgICAgIHRleHRTaXplID0gMTBmCiAgICAgICAgICAgICAgICAgICAgbWF4TGluZXMgPSA1CiAg
ICAgICAgICAgICAgICAgICAgZ3Jhdml0eSA9IEdyYXZpdHkuQ0VOVEVSCiAgICAgICAgICAgICAg
ICAgICAgdGV4dEFsaWdubWVudCA9IFZpZXcuVEVYVF9BTElHTk1FTlRfQ0VOVEVSCiAgICAgICAg
ICAgICAgICAgICAgc2V0TGluZVNwYWNpbmcoMGYsIDAuOTRmKQogICAgICAgICAgICAgICAgICAg
IHNldFBhZGRpbmcoNC5kcCwgMy5kcCwgNC5kcCwgMy5kcCkKICAgICAgICAgICAgICAgICAgICBU
ZXh0Vmlld0NvbXBhdC5zZXRBdXRvU2l6ZVRleHRUeXBlVW5pZm9ybVdpdGhDb25maWd1cmF0aW9u
KAogICAgICAgICAgICAgICAgICAgICAgICB0aGlzLAogICAgICAgICAgICAgICAgICAgICAgICA3
LAogICAgICAgICAgICAgICAgICAgICAgICAxMCwKICAgICAgICAgICAgICAgICAgICAgICAgMSwK
ICAgICAgICAgICAgICAgICAgICAgICAgVHlwZWRWYWx1ZS5DT01QTEVYX1VOSVRfU1AKICAgICAg
ICAgICAgICAgICAgICApCiAgICAgICAgICAgICAgICB9IGVsc2UgewogICAgICAgICAgICAgICAg
ICAgIHNldFRleHRTaXplKFR5cGVkVmFsdWUuQ09NUExFWF9VTklUX1NQLCAxM2YpCiAgICAgICAg
ICAgICAgICAgICAgbWF4TGluZXMgPSA0CiAgICAgICAgICAgICAgICAgICAgZ3Jhdml0eSA9IEdy
YXZpdHkuQ0VOVEVSX1ZFUlRJQ0FMCiAgICAgICAgICAgICAgICAgICAgdGV4dEFsaWdubWVudCA9
IFZpZXcuVEVYVF9BTElHTk1FTlRfVklFV19TVEFSVAogICAgICAgICAgICAgICAgICAgIHNldExp
bmVTcGFjaW5nKDBmLCAxZikKICAgICAgICAgICAgICAgICAgICBzZXRQYWRkaW5nKDEyLmRwLCA0
LmRwLCAxMC5kcCwgNC5kcCkKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIHNldFR5
cGVmYWNlKHR5cGVmYWNlLCBpZiAoY3VycmVudCkgYW5kcm9pZC5ncmFwaGljcy5UeXBlZmFjZS5C
T0xEIGVsc2UgYW5kcm9pZC5ncmFwaGljcy5UeXBlZmFjZS5OT1JNQUwpCiAgICAgICAgICAgICAg
ICBzZXRCYWNrZ3JvdW5kUmVzb3VyY2UoCiAgICAgICAgICAgICAgICAgICAgd2hlbiB7CiAgICAg
ICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgJiYgIW5vSW5mb3JtYXRpb24gLT4gUi5kcmF3YWJs
ZS5iZ19lcGdfbm93CiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3QgfHwgbG9hZGluZyAtPiBS
LmRyYXdhYmxlLmJnX2VwZ19wYXN0CiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgLT4gUi5k
cmF3YWJsZS5iZ19lcGdfcHJvZ3JhbQogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAg
ICAgICkKICAgICAgICAgICAgICAgIGlzRm9jdXNhYmxlID0gIWxvYWRpbmcKICAgICAgICAgICAg
ICAgIGlzRm9jdXNhYmxlSW5Ub3VjaE1vZGUgPSBmYWxzZQogICAgICAgICAgICAgICAgaXNDbGlj
a2FibGUgPSAhbG9hZGluZwogICAgICAgICAgICAgICAgY29udGVudERlc2NyaXB0aW9uID0gIiR7
Y2hhbm5lbC5uYW1lfSwgJHRpdGxlLCAkdGltZSIKICAgICAgICAgICAgICAgIGlmICghbG9hZGlu
ZykgewogICAgICAgICAgICAgICAgICAgIHNldE9uRm9jdXNDaGFuZ2VMaXN0ZW5lciB7IHZpZXcs
IGhhc0ZvY3VzIC0+CiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuZWxldmF0aW9uID0gaWYg
KGhhc0ZvY3VzKSAxMGYgZWxzZSAwZgogICAgICAgICAgICAgICAgICAgICAgICB2aWV3LnNjYWxl
WCA9IGlmIChoYXNGb2N1cykgMS4wMTVmIGVsc2UgMWYKICAgICAgICAgICAgICAgICAgICAgICAg
dmlldy5zY2FsZVkgPSBpZiAoaGFzRm9jdXMpIDEuMDNmIGVsc2UgMWYKICAgICAgICAgICAgICAg
ICAgICAgICAgaWYgKGhhc0ZvY3VzKSBvblByb2dyYW1Gb2N1c2VkKGNoYW5uZWwsIGl0ZW0sIGV2
ZW50U3RhcnQsIGV2ZW50RW5kLCBjdXJyZW50KQogICAgICAgICAgICAgICAgICAgIH0KICAgICAg
ICAgICAgICAgICAgICBzZXRPbkNsaWNrTGlzdGVuZXIgewogICAgICAgICAgICAgICAgICAgICAg
ICBvblByb2dyYW1DbGlja2VkKGNoYW5uZWwsIGl0ZW0sIGV2ZW50U3RhcnQsIGV2ZW50RW5kLCBj
dXJyZW50KQogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIH0KICAgICAgICAg
ICAgfQoKICAgICAgICAgICAgbGFuZS5hZGRWaWV3KAogICAgICAgICAgICAgICAgYmxvY2ssCiAg
ICAgICAgICAgICAgICBMaW5lYXJMYXlvdXQuTGF5b3V0UGFyYW1zKChzcGFuICogcXVhbnR1bVdp
ZHRoUHggLSA0LmRwKS5jb2VyY2VBdExlYXN0KDEuZHApLCA3NC5kcCkuYXBwbHkgewogICAgICAg
ICAgICAgICAgICAgIG1hcmdpbkVuZCA9IDQuZHAKICAgICAgICAgICAgICAgIH0KICAgICAgICAg
ICAgKQogICAgICAgICAgICBxdWFudHVtSW5kZXggKz0gc3BhbgogICAgICAgIH0KCiAgICAgICAg
dmFsIG1hcmtlclggPSAoKChub3dNcyAtIHRpbWVsaW5lU3RhcnRNcykuY29lcmNlQXRMZWFzdCgw
TCkgLyA2MF8wMDAuMCkgKiBwaXhlbHNQZXJNaW51dGVEcCkudG9JbnQoKS5kcAogICAgICAgIGlm
IChtYXJrZXJYIGluIDAgdW50aWwgdGltZWxpbmVXaWR0aFB4KSB7CiAgICAgICAgICAgIGNhbnZh
cy5hZGRWaWV3KAogICAgICAgICAgICAgICAgVmlldyhyb3dDb250ZXh0KS5hcHBseSB7CiAgICAg
ICAgICAgICAgICAgICAgc2V0QmFja2dyb3VuZENvbG9yKHJvd0NvbnRleHQuZ2V0Q29sb3IoUi5j
b2xvci5rc19yZWQpKQogICAgICAgICAgICAgICAgICAgIGFscGhhID0gMC45NWYKICAgICAgICAg
ICAgICAgICAgICBlbGV2YXRpb24gPSAxMmYKICAgICAgICAgICAgICAgIH0sCiAgICAgICAgICAg
ICAgICBGcmFtZUxheW91dC5MYXlvdXRQYXJhbXMoMy5kcCwgTGluZWFyTGF5b3V0LkxheW91dFBh
cmFtcy5NQVRDSF9QQVJFTlQpLmFwcGx5IHsKICAgICAgICAgICAgICAgICAgICBsZWZ0TWFyZ2lu
ID0gbWFya2VyWAogICAgICAgICAgICAgICAgfQogICAgICAgICAgICApCiAgICAgICAgfQoKICAg
ICAgICBzY3JvbGwuYWRkVmlldyhjYW52YXMpCiAgICAgICAgcm9vdC5hZGRWaWV3KHNjcm9sbCwg
TGluZWFyTGF5b3V0LkxheW91dFBhcmFtcygwLCBMaW5lYXJMYXlvdXQuTGF5b3V0UGFyYW1zLk1B
VENIX1BBUkVOVCwgMWYpKQogICAgICAgIHNjcm9sbC5wb3N0IHsgc2Nyb2xsLnNjcm9sbFRvKGds
b2JhbFNjcm9sbFgsIDApIH0KICAgICAgICBzY3JvbGwuc2V0T25TY3JvbGxDaGFuZ2VMaXN0ZW5l
ciB7IF8sIHNjcm9sbFgsIF8sIF8sIF8gLT4KICAgICAgICAgICAgaWYgKCFzeW5jaW5nICYmIHNj
cm9sbFggIT0gZ2xvYmFsU2Nyb2xsWCkgewogICAgICAgICAgICAgICAgZ2xvYmFsU2Nyb2xsWCA9
IHNjcm9sbFgKICAgICAgICAgICAgICAgIHN5bmNWaXNpYmxlKHNjcm9sbCkKICAgICAgICAgICAg
ICAgIG9uSG9yaXpvbnRhbENoYW5nZWQoc2Nyb2xsWCkKICAgICAgICAgICAgfQogICAgICAgIH0K
ICAgICAgICByZXR1cm4gcm9vdAogICAgfQoKICAgIGZ1biBzZXRHbG9iYWxTY3JvbGxYKHg6IElu
dCkgewogICAgICAgIHZhbCBzYWZlID0geC5jb2VyY2VBdExlYXN0KDApCiAgICAgICAgaWYgKHNh
ZmUgPT0gZ2xvYmFsU2Nyb2xsWCkgcmV0dXJuCiAgICAgICAgZ2xvYmFsU2Nyb2xsWCA9IHNhZmUK
ICAgICAgICBzeW5jVmlzaWJsZShudWxsKQogICAgfQoKICAgIHByaXZhdGUgZnVuIHN5bmNWaXNp
YmxlKHNvdXJjZTogSG9yaXpvbnRhbFNjcm9sbFZpZXc/KSB7CiAgICAgICAgc3luY2luZyA9IHRy
dWUKICAgICAgICB0cnkgewogICAgICAgICAgICB2aXNpYmxlU2Nyb2xscy50b0xpc3QoKS5mb3JF
YWNoIHsgdmlldyAtPgogICAgICAgICAgICAgICAgaWYgKHZpZXcgIT09IHNvdXJjZSAmJiB2aWV3
LnNjcm9sbFggIT0gZ2xvYmFsU2Nyb2xsWCkgdmlldy5zY3JvbGxUbyhnbG9iYWxTY3JvbGxYLCAw
KQogICAgICAgICAgICB9CiAgICAgICAgfSBmaW5hbGx5IHsKICAgICAgICAgICAgc3luY2luZyA9
IGZhbHNlCiAgICAgICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIHJlc29sdmVFdmVudHMoc291
cmNlOiBMaXN0PEVwZ0l0ZW0+KTogTGlzdDxSZXNvbHZlZEV2ZW50PiB7CiAgICAgICAgcmV0dXJu
IHNvdXJjZS5tYXBJbmRleGVkTm90TnVsbCB7IGluZGV4LCBpdGVtIC0+CiAgICAgICAgICAgIHZh
bCAoc3RhcnQsIGVuZCkgPSByZXNvbHZlZFRpbWVzKGl0ZW0sIGluZGV4KQogICAgICAgICAgICBp
ZiAoZW5kIDw9IHRpbWVsaW5lU3RhcnRNcyB8fCBzdGFydCA+PSB0aW1lbGluZUVuZE1zIHx8IGVu
ZCA8PSBzdGFydCkgbnVsbAogICAgICAgICAgICBlbHNlIFJlc29sdmVkRXZlbnQoaXRlbSwgc3Rh
cnQsIGVuZCkKICAgICAgICB9LnNvcnRlZFdpdGgoY29tcGFyZUJ5PFJlc29sdmVkRXZlbnQ+IHsg
aXQuc3RhcnRNcyB9LnRoZW5CeURlc2NlbmRpbmcgeyBpdC5lbmRNcyB9KQogICAgfQoKICAgIC8q
KiBTZWxlY3QgZXhhY3RseSBvbmUgcHJvZ3JhbW1lIGZvciBvbmUgZml4ZWQgaGFsZi1ob3VyIGNl
bGwuICovCiAgICBwcml2YXRlIGZ1biBwcm9ncmFtRm9yU2xvdChldmVudHM6IExpc3Q8UmVzb2x2
ZWRFdmVudD4sIHNsb3RTdGFydDogTG9uZywgc2xvdEVuZDogTG9uZyk6IFJlc29sdmVkRXZlbnQ/
IHsKICAgICAgICB2YXIgYmVzdDogUmVzb2x2ZWRFdmVudD8gPSBudWxsCiAgICAgICAgdmFyIGJl
c3RPdmVybGFwID0gMEwKICAgICAgICBmb3IgKGV2ZW50IGluIGV2ZW50cykgewogICAgICAgICAg
ICBpZiAoZXZlbnQuc3RhcnRNcyA+PSBzbG90RW5kKSBicmVhawogICAgICAgICAgICB2YWwgb3Zl
cmxhcCA9IG1pbihldmVudC5lbmRNcywgc2xvdEVuZCkgLSBtYXgoZXZlbnQuc3RhcnRNcywgc2xv
dFN0YXJ0KQogICAgICAgICAgICBpZiAob3ZlcmxhcCA+IGJlc3RPdmVybGFwKSB7CiAgICAgICAg
ICAgICAgICBiZXN0ID0gZXZlbnQKICAgICAgICAgICAgICAgIGJlc3RPdmVybGFwID0gb3Zlcmxh
cAogICAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHJldHVybiBiZXN0CiAgICB9CgogICAg
cHJpdmF0ZSBmdW4gc2FtZVByb2dyYW1tZShmaXJzdDogUmVzb2x2ZWRFdmVudCwgc2Vjb25kOiBS
ZXNvbHZlZEV2ZW50Pyk6IEJvb2xlYW4gewogICAgICAgIHJldHVybiBzZWNvbmQgIT0gbnVsbCAm
JgogICAgICAgICAgICBmaXJzdC5zdGFydE1zID09IHNlY29uZC5zdGFydE1zICYmCiAgICAgICAg
ICAgIGZpcnN0LmVuZE1zID09IHNlY29uZC5lbmRNcyAmJgogICAgICAgICAgICBmaXJzdC5pdGVt
LnRpdGxlID09IHNlY29uZC5pdGVtLnRpdGxlCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gcmVzb2x2
ZWRUaW1lcyhpdGVtOiBFcGdJdGVtLCBpbmRleDogSW50KTogUGFpcjxMb25nLCBMb25nPiB7CiAg
ICAgICAgdmFsIGZsb29yTm93ID0gKG5vd01zIC8gc2xvdE1zKSAqIHNsb3RNcwogICAgICAgIHZh
bCBzdGFydCA9IGl0ZW0uc3RhcnRUaW1lc3RhbXA/LmxldCB7IGl0ICogMTAwMEwgfQogICAgICAg
ICAgICA/OiBwYXJzZUd1aWRlVGltZShpdGVtLnN0YXJ0KQogICAgICAgICAgICA/OiBpZiAoaXRl
bS5zdGFydC5lcXVhbHMoIk5vdyIsIHRydWUpKSBmbG9vck5vdyBlbHNlIGZsb29yTm93ICsgaW5k
ZXggKiBzbG90TXMKICAgICAgICB2YWwgZW5kID0gaXRlbS5lbmRUaW1lc3RhbXA/LmxldCB7IGl0
ICogMTAwMEwgfQogICAgICAgICAgICA/OiBwYXJzZUd1aWRlVGltZShpdGVtLmVuZCkKICAgICAg
ICAgICAgPzogKHN0YXJ0ICsgc2xvdE1zKQogICAgICAgIHJldHVybiBzdGFydCB0byBtYXgoZW5k
LCBzdGFydCArIDUgKiA2MF8wMDBMKQogICAgfQoKICAgIHByaXZhdGUgZnVuIHBhcnNlR3VpZGVU
aW1lKHJhdzogU3RyaW5nKTogTG9uZz8gewogICAgICAgIHZhbCB2YWx1ZSA9IHJhdy50cmltKCkK
ICAgICAgICBpZiAodmFsdWUuaXNCbGFuaygpIHx8IHZhbHVlLmVxdWFscygiTm93IiwgdHJ1ZSkg
fHwgdmFsdWUuZXF1YWxzKCJOZXh0IiwgdHJ1ZSkgfHwgdmFsdWUuZXF1YWxzKCJMYXRlciIsIHRy
dWUpKSByZXR1cm4gbnVsbAogICAgICAgIHZhbCBudW1lcmljID0gdmFsdWUudG9Mb25nT3JOdWxs
KCkKICAgICAgICBpZiAobnVtZXJpYyAhPSBudWxsKSByZXR1cm4gaWYgKG51bWVyaWMgPCAxMDBf
MDAwXzAwMF8wMDBMKSBudW1lcmljICogMTAwMEwgZWxzZSBudW1lcmljCiAgICAgICAgdmFsIHBh
dHRlcm5zID0gbGlzdE9mKCJ5eXl5LU1NLWRkIEhIOm1tOnNzIiwgInl5eXktTU0tZGQgSEg6bW0i
KQogICAgICAgIGZvciAocGF0dGVybiBpbiBwYXR0ZXJucykgewogICAgICAgICAgICB0cnkgewog
ICAgICAgICAgICAgICAgdmFsIHBhcnNlZCA9IFNpbXBsZURhdGVGb3JtYXQocGF0dGVybiwgTG9j
YWxlLlVTKS5wYXJzZSh2YWx1ZSkKICAgICAgICAgICAgICAgIGlmIChwYXJzZWQgIT0gbnVsbCkg
cmV0dXJuIHBhcnNlZC50aW1lCiAgICAgICAgICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikgeyB9
CiAgICAgICAgfQogICAgICAgIHJldHVybiBudWxsCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gZm9y
bWF0UmFuZ2Uoc3RhcnQ6IExvbmcsIGVuZDogTG9uZyk6IFN0cmluZyB7CiAgICAgICAgcmV0dXJu
IHRyeSB7CiAgICAgICAgICAgIHZhbCBmb3JtYXR0ZXIgPSBTaW1wbGVEYXRlRm9ybWF0KCJoOm1t
IGEiLCBMb2NhbGUuZ2V0RGVmYXVsdCgpKQogICAgICAgICAgICAiJHtmb3JtYXR0ZXIuZm9ybWF0
KERhdGUoc3RhcnQpKX0g4oCTICR7Zm9ybWF0dGVyLmZvcm1hdChEYXRlKGVuZCkpfSIKICAgICAg
ICB9IGNhdGNoIChfOiBFeGNlcHRpb24pIHsKICAgICAgICAgICAgIiIKICAgICAgICB9CiAgICB9
CgogICAgcHJpdmF0ZSB2YWwgSW50LmRwOiBJbnQgZ2V0KCkgPSAodGhpcyAqIHJvd0NvbnRleHQu
cmVzb3VyY2VzLmRpc3BsYXlNZXRyaWNzLmRlbnNpdHkpLnRvSW50KCkKfQo=
:::END ADAPTER
:::BEGIN GRADLE
cGx1Z2lucyB7CiAgICBpZCgiY29tLmFuZHJvaWQuYXBwbGljYXRpb24iKQogICAgaWQoIm9yZy5q
ZXRicmFpbnMua290bGluLmFuZHJvaWQiKQp9CgphbmRyb2lkIHsKICAgIG5hbWVzcGFjZSA9ICJj
b20ua3Jpc3RhbHN0cmVhbXMucGxheWVyIgogICAgY29tcGlsZVNkayA9IDM1CgogICAgZGVmYXVs
dENvbmZpZyB7CiAgICAgICAgYXBwbGljYXRpb25JZCA9ICJjb20ua3Jpc3RhbHN0cmVhbXMucGxh
eWVyIgogICAgICAgIG1pblNkayA9IDIzCiAgICAgICAgdGFyZ2V0U2RrID0gMzUKICAgICAgICB2
ZXJzaW9uQ29kZSA9IDE2ODIwMDQKICAgICAgICB2ZXJzaW9uTmFtZSA9ICIxLjYuOC1lcGctYWxp
Z25tZW50IgogICAgfQoKICAgIGJ1aWxkRmVhdHVyZXMgewogICAgICAgIHZpZXdCaW5kaW5nID0g
ZmFsc2UKICAgIH0KCiAgICBjb21waWxlT3B0aW9ucyB7CiAgICAgICAgc291cmNlQ29tcGF0aWJp
bGl0eSA9IEphdmFWZXJzaW9uLlZFUlNJT05fMTEKICAgICAgICB0YXJnZXRDb21wYXRpYmlsaXR5
ID0gSmF2YVZlcnNpb24uVkVSU0lPTl8xMQogICAgfQoKICAgIGtvdGxpbiB7CiAgICAgICAganZt
VG9vbGNoYWluKDExKQogICAgfQp9CgpkZXBlbmRlbmNpZXMgewogICAgaW1wbGVtZW50YXRpb24o
ImFuZHJvaWR4LmNvcmU6Y29yZS1rdHg6MS4xNS4wIikKICAgIGltcGxlbWVudGF0aW9uKCJhbmRy
b2lkeC5hcHBjb21wYXQ6YXBwY29tcGF0OjEuNy4wIikKICAgIGltcGxlbWVudGF0aW9uKCJjb20u
Z29vZ2xlLmFuZHJvaWQubWF0ZXJpYWw6bWF0ZXJpYWw6MS4xMi4wIikKICAgIGltcGxlbWVudGF0
aW9uKCJhbmRyb2lkeC5tZWRpYTM6bWVkaWEzLWV4b3BsYXllcjoxLjUuMSIpCiAgICBpbXBsZW1l
bnRhdGlvbigiYW5kcm9pZHgubWVkaWEzOm1lZGlhMy1leG9wbGF5ZXItaGxzOjEuNS4xIikKICAg
IGltcGxlbWVudGF0aW9uKCJhbmRyb2lkeC5tZWRpYTM6bWVkaWEzLXVpOjEuNS4xIikKfQo=
:::END GRADLE
:::BEGIN AUDIT
S1JJU1RBTCBTVFJFQU1TIDEuNi44IFJDMSBSMiDigJQgUkVTUE9OU0lWRSBDQVJEIEFMSUdOTUVO
VAoKQkFTRUxJTkUKLSBLbm93bi1nb29kIFIyIGFwcC4KLSBMb2dpbiwgcGxheWJhY2ssIE1vdmll
cywgU2VyaWVzIGFuZCBMaXZlIFRWIE5vdy9OZXh0IGFyZSB1bmNoYW5nZWQuCi0gVGhlIGVhcmxp
ZXIgdmFyaWFibGUtd2lkdGggRVBHIHJlbmRlcmVyIHdhcyByZW1vdmVkIHJhdGhlciB0aGFuIHBh
dGNoZWQuCgpSRUJVSUxUIEdVSURFCi0gVXNlcyB0aGUgc3VwcGxpZWQgd29ya2luZyBJUFRWIEFQ
SydzIGR1cmF0aW9uLXdpZHRoIGJlaGF2aW9yIG9uIHRvcCBvZiB0aGUKICByZWJ1aWx0IG5vbi1z
dGFja2luZyBncmlkLgotIEVhY2ggZml2ZS1taW51dGUgc2xpY2Ugc2VsZWN0cyBhdCBtb3N0IG9u
ZSBwcm92aWRlciBwcm9ncmFtbWUgYnkgZ3JlYXRlc3QKICB0aW1lIG92ZXJsYXAsIHRoZW4gY29u
c2VjdXRpdmUgc2xpY2VzIGZvciB0aGUgc2FtZSBzaG93IG1lcmdlIGludG8gb25lIGNhcmQuCi0g
QSBvbmUtaG91ciBzaG93IHNwYW5zIG9uZSBob3VyLCBhIDkwLW1pbnV0ZSBzaG93IHNwYW5zIDkw
IG1pbnV0ZXMsIGFuZCBsb25nZXIKICBzaG93cyBjb250aW51ZSBmcm9tIHRoZWlyIHN0YXJ0IHRo
cm91Z2ggZmluaXNoIHRpbWUuCi0gRHVwbGljYXRlIG9yIGNvbmZsaWN0aW5nIHByb3ZpZGVyIGVu
dHJpZXMgY2Fubm90IHN0YWNrIGJlY2F1c2UgZXZlcnkKICBmaXZlLW1pbnV0ZSBzbGljZSBzdGls
bCBoYXMgZXhhY3RseSBvbmUgc2VsZWN0ZWQgcHJvZ3JhbW1lLgotIEV2ZXJ5IGNhcmQga2VlcHMg
dGhlIHNhbWUgZm91ci1kcCBndXR0ZXIgaW4gcG9ydHJhaXQgYW5kIGxhbmRzY2FwZS4KLSBDYXJk
cyBvZiAzMCBtaW51dGVzIG9yIGxlc3MgdXNlIGEgY29tcGFjdCB0aXRsZS1vbmx5IGxheW91dCB3
aXRoIHJlZHVjZWQKICBwYWRkaW5nIGFuZCBmaXZlIGF2YWlsYWJsZSB0ZXh0IGxpbmVzLiBFeGFj
dCB0aW1lcyByZW1haW4gaW4gdGhlIGFsaWduZWQKICB0aW1lbGluZSBhbmQgZGV0YWlscyBwYW5l
bCwgcHJldmVudGluZyBuYXJyb3ctY2FyZCB0ZXh0IGZyb20gYmVpbmcgY3V0IG9mZi4KLSBIYWxm
LWhvdXIgY2FyZHMgY2VudGVyIHRoZWlyIGNvbXBhY3QgdGl0bGUgaG9yaXpvbnRhbGx5IGFuZCB2
ZXJ0aWNhbGx5LgotIExvbmdlciBjYXJkcyByZXR1cm4gdG8gbGVmdC1hbGlnbmVkIGNvbnRlbnQg
d2l0aCAxM3NwIHRleHQsIG5vcm1hbCBzaWRlCiAgcGFkZGluZywgYW5kIHRoZSB0aXRsZSBwbHVz
IHRpbWUgcmFuZ2Ugc28gd2lkZSBjYXJkcyBkbyBub3QgbG9vayBlbXB0eS4KLSBBdXRvbWF0aWMg
c2l6aW5nIGFwcGxpZXMgb25seSB0byBjb21wYWN0IGhhbGYtaG91ciBjYXJkcywgZG93biB0byA3
c3Agd2hlbgogIG5lZWRlZCwgd2l0aCBmaXZlIGxpbmVzIGFuZCByZWR1Y2VkIGZvbnQgcGFkZGlu
Zy4KLSBYTUxUViByZW1haW5zIHRoZSBwcmVmZXJyZWQgc2NoZWR1bGUgc291cmNlLiBWaXNpYmxl
IGNoYW5uZWxzIHdpdGhvdXQgdXNhYmxlCiAgWE1MVFYgdXNlIG9uZSBjYWNoZWQgZnVsbCBwZXIt
Y2hhbm5lbCBwcm92aWRlciByZXF1ZXN0LgotIFNjaGVkdWxlIHRpbWVzLCB0aW1lbGluZSBsYWJl
bHMgYW5kIE5PVyB1c2UgdGhlIEFuZHJvaWQgZGV2aWNlIGNsb2NrLgotIE1pc3Npbmcgc2NoZWR1
bGUgY2VsbHMgdmlzaWJseSBzYXkgTk8gR1VJREUgREFUQS4KClZFUlNJT04KLSB2ZXJzaW9uQ29k
ZSAxNjgyMDA0Ci0gdmVyc2lvbk5hbWUgMS42LjgtZXBnLWFsaWdubWVudAo=
:::END AUDIT
