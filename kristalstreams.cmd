@echo off
setlocal EnableExtensions EnableDelayedExpansion
title KS Series Layout Fix 1682022

for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%T"
set "WORK=C:\ksserieslayoutfix-!STAMP!"
set "FINAL=%USERPROFILE%\Downloads\KS-SERIES-LAYOUT-FIX-1682022.apk"
set "LOG=%TEMP%\ks-series-layout-fix-1682022-build.txt"
set "JAVASAVE=%USERPROFILE%\.kristalstreams-java-home.txt"

echo.
echo ==========================================================
echo   KRISTAL STREAMS 1.6.8 RC1 R2 - SERIES LAYOUT FIX
echo   FRESH APK: KS-SERIES-LAYOUT-FIX-1682022.apk
echo ==========================================================
echo.
echo Centers Continue, Next, and season text.
echo Enlarges the Continue and Next control panel.
echo Enlarges episode cards so titles and descriptions fit.
echo Preserves the complete working Series build and protected R2 source.
echo Source recovery: enabled.
echo.

set "SOURCE="
for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "$roots=@(); $preferred='C:\KristalStreams168-R2-WORKING'; if(Test-Path $preferred){$roots+=Get-Item $preferred}; $roots+=@(Get-ChildItem C:\ -Directory -Filter 'ksseriescomplete-*' -ErrorAction SilentlyContinue); $roots ^| Where-Object {(Test-Path (Join-Path $_.FullName 'gradlew.bat')) -and (Test-Path (Join-Path $_.FullName 'app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt'))} ^| Sort-Object LastWriteTime -Descending ^| Select-Object -First 1 -ExpandProperty FullName"`) do set "SOURCE=%%D"

if not defined SOURCE (
    echo Completed 1682021 Series source was not found.
    echo Restoring it automatically now...
    set "BOOTSTRAP=%TEMP%\KS-SERIES-COMPLETE-1682021-AUTO.cmd"
    del /q "!BOOTSTRAP!" >nul 2>&1
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/djudge47/kristalstreams/6bf5da406eb1266a5d1956ce4ca31b9f5980d407/kristalstreams.cmd' -OutFile '!BOOTSTRAP!'"
    if errorlevel 1 (
        echo ERROR: Could not restore the completed 1682021 Series builder.
        pause
        exit /b 1
    )
    call "!BOOTSTRAP!"
    del /q "!BOOTSTRAP!" >nul 2>&1
    set "SOURCE="
    for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "Get-ChildItem C:\ -Directory -Filter 'ksseriescomplete-*' -ErrorAction SilentlyContinue ^| Where-Object {(Test-Path (Join-Path $_.FullName 'gradlew.bat')) -and (Test-Path (Join-Path $_.FullName 'app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt'))} ^| Sort-Object LastWriteTime -Descending ^| Select-Object -First 1 -ExpandProperty FullName"`) do set "SOURCE=%%D"
)
if not defined SOURCE (
    echo ERROR: Automatic 1682021 source recovery did not complete.
    echo The protected R2 source may be missing from C:\KristalStreams168RC1R2.
    pause
    exit /b 1
)
if not exist "!SOURCE!\gradlew.bat" (
    echo ERROR: Gradle wrapper was not found in:
    echo   !SOURCE!
    pause
    exit /b 1
)

echo Using completed Series source:
echo   !SOURCE!
echo.
echo [1/6] Creating a fresh working copy...
mkdir "%WORK%" >nul 2>&1
robocopy "!SOURCE!" "%WORK%" /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /NFL /NDL /NP >nul
set "RC=%ERRORLEVEL%"
if %RC% GEQ 8 (
    echo ERROR: Could not create the fresh working copy.
    pause
    exit /b %RC%
)

echo [2/6] Applying Series text alignment and box-sizing corrections...
set "PATCHPS=%TEMP%\ks-series-layout-fix-1682022.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; $a=':::BEGIN '+'LAYOUTPATCH'; $b=':::END '+'LAYOUTPATCH'; $s=$raw.IndexOf($a); if($s -lt 0){throw 'Missing layout patch'}; $s+=$a.Length; $e=$raw.IndexOf($b,$s); if($e -lt 0){throw 'Missing layout patch end'}; $x=$raw.Substring($s,$e-$s)-replace '\s',''; [IO.File]::WriteAllBytes('%PATCHPS%',[Convert]::FromBase64String($x))"
if errorlevel 1 (
    echo ERROR: Could not extract the Series layout correction.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%PATCHPS%" -ProjectRoot "%WORK%"
set "RC=%ERRORLEVEL%"
del /q "%PATCHPS%" >nul 2>&1
if not "%RC%"=="0" (
    echo ERROR: The Series layout correction could not be applied safely.
    echo No source files in the completed build were changed.
    pause
    exit /b %RC%
)

echo [3/6] Verifying corrected layout...
findstr /c:"android:layout_height=\"96dp\"" "%WORK%\app\src\main\res\layout\activity_series_details.xml" >nul
if errorlevel 1 goto VERIFY_FAILED
findstr /c:"android:gravity=\"center\"" "%WORK%\app\src\main\res\layout\activity_series_details.xml" >nul
if errorlevel 1 goto VERIFY_FAILED
findstr /c:"android:layout_height=\"142dp\"" "%WORK%\app\src\main\res\layout\row_episode_modern.xml" >nul
if errorlevel 1 goto VERIFY_FAILED
findstr /c:"gravity = android.view.Gravity.CENTER" "%WORK%\app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt" >nul
if errorlevel 1 goto VERIFY_FAILED
goto VERIFIED

:VERIFY_FAILED
echo ERROR: Corrected layout verification failed.
pause
exit /b 1

:VERIFIED
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
echo [5/6] Building corrected Series APK...
echo Gradle progress will appear below.
echo.
cd /d "%WORK%"
call gradlew.bat clean assembleDebug --rerun-tasks --console=plain --stacktrace > "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
type "%LOG%"
if not "%RC%"=="0" (
    color 4F
    echo.
    echo ==========================================================
    echo   BUILD FAILED
    echo ==========================================================
    echo Completed Series source remains untouched.
    echo Build log:
    echo   %LOG%
    start "" notepad "%LOG%"
    pause
    exit /b %RC%
)

set "BUILT=%WORK%\app\build\outputs\apk\debug\app-debug.apk"
if not exist "%BUILT%" (
    echo ERROR: Gradle finished but APK was not found.
    pause
    exit /b 1
)

echo [6/6] Copying finished APK...
copy /Y "%BUILT%" "%FINAL%" >nul
if errorlevel 1 (
    echo ERROR: Could not copy APK to Downloads.
    pause
    exit /b 1
)

set "USBCOPY="
set "USBDRIVE="
for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "$d=Get-CimInstance Win32_LogicalDisk ^| Where-Object {$_.DriveType -eq 2} ^| Select-Object -First 1 -ExpandProperty DeviceID; if($d){$d}"`) do set "USBDRIVE=%%D"
if defined USBDRIVE (
    set "USBCOPY=!USBDRIVE!\KS-SERIES-LAYOUT-FIX-1682022.apk"
    copy /Y "%BUILT%" "!USBCOPY!" >nul
)

color 2F
cls
echo.
echo ==========================================================
echo   KS SERIES LAYOUT FIX BUILD SUCCESSFUL
echo ==========================================================
echo.
echo APK:
echo   %FINAL%
if defined USBCOPY (
    echo.
    echo USB APK:
    echo   !USBCOPY!
)
echo.
echo Continue, Next, and season text are centered.
echo Continue and Next boxes are taller.
echo Episode cards are taller and allow two-line titles.
echo Completed Series source and protected R2 source: UNTOUCHED
echo.
echo Install only KS-SERIES-LAYOUT-FIX-1682022.apk shown above.
explorer /select,"%FINAL%"
pause
exit /b 0

:::BEGIN LAYOUTPATCH
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV1bc3RyaW5nXSRQcm9qZWN0
Um9vdAopCgokRXJyb3JBY3Rpb25QcmVmZXJlbmNlID0gJ1N0b3AnCgpmdW5jdGlvbiBSZXBsYWNl
LVJlcXVpcmVkIHsKICAgIHBhcmFtKFtzdHJpbmddJFBhdGgsIFtzdHJpbmddJE9sZCwgW3N0cmlu
Z10kTmV3LCBbc3RyaW5nXSRMYWJlbCkKICAgICRjb250ZW50ID0gW0lPLkZpbGVdOjpSZWFkQWxs
VGV4dCgkUGF0aCkKICAgIGlmICgtbm90ICRjb250ZW50LkNvbnRhaW5zKCRPbGQpKSB7IHRocm93
ICJDb3VsZCBub3QgZmluZCBleHBlY3RlZCAkTGFiZWwgaW4gJFBhdGgiIH0KICAgIFtJTy5GaWxl
XTo6V3JpdGVBbGxUZXh0KCRQYXRoLCAkY29udGVudC5SZXBsYWNlKCRPbGQsICROZXcpLCBbVGV4
dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNlKSkKfQoKJHBvcnRyYWl0ID0gSm9pbi1QYXRoICRQ
cm9qZWN0Um9vdCAnYXBwXHNyY1xtYWluXHJlc1xsYXlvdXRcYWN0aXZpdHlfc2VyaWVzX2RldGFp
bHMueG1sJwokbGFuZHNjYXBlID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWlu
XHJlc1xsYXlvdXQtbGFuZFxhY3Rpdml0eV9zZXJpZXNfZGV0YWlscy54bWwnCiRlcGlzb2RlUm93
ID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWluXHJlc1xsYXlvdXRccm93X2Vw
aXNvZGVfbW9kZXJuLnhtbCcKJGFjdGl2aXR5ID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBw
XHNyY1xtYWluXGphdmFcY29tXGtyaXN0YWxzdHJlYW1zXHBsYXllclxTZXJpZXNEZXRhaWxzQWN0
aXZpdHkua3QnCgpmb3JlYWNoICgkbGF5b3V0IGluIEAoJHBvcnRyYWl0LCAkbGFuZHNjYXBlKSkg
ewogICAgUmVwbGFjZS1SZXF1aXJlZCAkbGF5b3V0ICdhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc0Nv
bnRpbnVlUGFuZWwiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6
bGF5b3V0X2hlaWdodD0iNzZkcCInICdhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc0NvbnRpbnVlUGFu
ZWwiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hl
aWdodD0iOTZkcCInICdDb250aW51ZSBwYW5lbCBoZWlnaHQnCiAgICBSZXBsYWNlLVJlcXVpcmVk
ICRsYXlvdXQgJ2FuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzQ29udGludWVMYWJlbCIgYW5kcm9pZDps
YXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2Nv
bnRlbnQiIGFuZHJvaWQ6dGV4dENvbG9yPScgJ2FuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzQ29udGlu
dWVMYWJlbCIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlv
dXRfaGVpZ2h0PSIyOGRwIiBhbmRyb2lkOmdyYXZpdHk9ImNlbnRlcl92ZXJ0aWNhbCIgYW5kcm9p
ZDppbmNsdWRlRm9udFBhZGRpbmc9ImZhbHNlIiBhbmRyb2lkOnRleHRDb2xvcj0nICdDb250aW51
ZSBsYWJlbCBhbGlnbm1lbnQnCiAgICBSZXBsYWNlLVJlcXVpcmVkICRsYXlvdXQgJ2FuZHJvaWQ6
bGF5b3V0X2hlaWdodD0iNDZkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9wPSI1ZHAiIGFuZHJv
aWQ6b3JpZW50YXRpb249Imhvcml6b250YWwiJyAnYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI1NmRw
IiBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjRkcCIgYW5kcm9pZDpvcmllbnRhdGlvbj0iaG9y
aXpvbnRhbCIgYW5kcm9pZDpncmF2aXR5PSJjZW50ZXJfdmVydGljYWwiJyAnQ29udGludWUgYnV0
dG9uIHJvdyBzaXppbmcnCiAgICAkeG1sID0gW0lPLkZpbGVdOjpSZWFkQWxsVGV4dCgkbGF5b3V0
KQogICAgJHhtbCA9ICR4bWwuUmVwbGFjZSgnYW5kcm9pZDp0ZXh0U2l6ZT0iMTBzcCIgYW5kcm9p
ZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIicsICdhbmRyb2lkOnRleHRTaXplPSIx
MHNwIiBhbmRyb2lkOmdyYXZpdHk9ImNlbnRlciIgYW5kcm9pZDpwYWRkaW5nPSIwZHAiIGFuZHJv
aWQ6bWluSGVpZ2h0PSIwZHAiIGFuZHJvaWQ6aW5jbHVkZUZvbnRQYWRkaW5nPSJmYWxzZSIgYW5k
cm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIicpCiAgICBbSU8uRmlsZV06Oldy
aXRlQWxsVGV4dCgkbGF5b3V0LCAkeG1sLCBbVGV4dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNl
KSkKfQoKUmVwbGFjZS1SZXF1aXJlZCAkYWN0aXZpdHkgInRleHRTaXplID0gMTFmYG4gICAgICAg
ICAgICAgICAgYmFja2dyb3VuZCA9IGdldERyYXdhYmxlKFIuZHJhd2FibGUuYmdfcm93KSIgInRl
eHRTaXplID0gMTFmYG4gICAgICAgICAgICAgICAgZ3Jhdml0eSA9IGFuZHJvaWQudmlldy5HcmF2
aXR5LkNFTlRFUmBuICAgICAgICAgICAgICAgIGluY2x1ZGVGb250UGFkZGluZyA9IGZhbHNlYG4g
ICAgICAgICAgICAgICAgbWluSGVpZ2h0ID0gMGBuICAgICAgICAgICAgICAgIHNldFBhZGRpbmco
MTIuZHAsIDAsIDEyLmRwLCAwKWBuICAgICAgICAgICAgICAgIGJhY2tncm91bmQgPSBnZXREcmF3
YWJsZShSLmRyYXdhYmxlLmJnX3JvdykiICdTZWFzb24gYnV0dG9uIGNlbnRlcmluZycKUmVwbGFj
ZS1SZXF1aXJlZCAkYWN0aXZpdHkgJ2xheW91dFBhcmFtcyA9IExpbmVhckxheW91dC5MYXlvdXRQ
YXJhbXMoMTMyLmRwLCA0Ni5kcCkuYXBwbHknICdsYXlvdXRQYXJhbXMgPSBMaW5lYXJMYXlvdXQu
TGF5b3V0UGFyYW1zKDEzMi5kcCwgNTAuZHApLmFwcGx5JyAnU2Vhc29uIGJ1dHRvbiBoZWlnaHQn
CgpSZXBsYWNlLVJlcXVpcmVkICRlcGlzb2RlUm93ICdhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0
Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjExOGRwIiBhbmRyb2lkOm9yaWVudGF0
aW9uPSJob3Jpem9udGFsIicgJ2FuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFu
ZHJvaWQ6bGF5b3V0X2hlaWdodD0iMTQyZHAiIGFuZHJvaWQ6b3JpZW50YXRpb249Imhvcml6b250
YWwiJyAnRXBpc29kZSBjYXJkIGhlaWdodCcKUmVwbGFjZS1SZXF1aXJlZCAkZXBpc29kZVJvdyAn
PEZyYW1lTGF5b3V0IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSIxNDJkcCIgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSI5NmRwIj4nICc8RnJhbWVMYXlvdXQgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjE0OGRw
IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjExNmRwIj4nICdFcGlzb2RlIGFydHdvcmsgaGVpZ2h0
JwpSZXBsYWNlLVJlcXVpcmVkICRlcGlzb2RlUm93ICdhbmRyb2lkOm1heExpbmVzPSIxIiBhbmRy
b2lkOmVsbGlwc2l6ZT0iZW5kIiBhbmRyb2lkOnRleHQ9IkVwaXNvZGUgdGl0bGUiJyAnYW5kcm9p
ZDptYXhMaW5lcz0iMiIgYW5kcm9pZDplbGxpcHNpemU9ImVuZCIgYW5kcm9pZDpncmF2aXR5PSJj
ZW50ZXJfdmVydGljYWwiIGFuZHJvaWQ6aW5jbHVkZUZvbnRQYWRkaW5nPSJmYWxzZSIgYW5kcm9p
ZDp0ZXh0PSJFcGlzb2RlIHRpdGxlIicgJ0VwaXNvZGUgdGl0bGUgc2l6aW5nJwpSZXBsYWNlLVJl
cXVpcmVkICRlcGlzb2RlUm93ICdhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX211dGVkXzIi
IGFuZHJvaWQ6dGV4dFNpemU9IjEwc3AiJyAnYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19t
dXRlZF8yIiBhbmRyb2lkOnRleHRTaXplPSIxMXNwIiBhbmRyb2lkOmxpbmVTcGFjaW5nRXh0cmE9
IjFkcCInICdFcGlzb2RlIGRlc2NyaXB0aW9uIHNpemluZycKCldyaXRlLUhvc3QgJ1NlcmllcyBE
ZXRhaWxzIGxheW91dCBtZWFzdXJlbWVudHMgdXBkYXRlZCBzdWNjZXNzZnVsbHkuJwo=
:::END LAYOUTPATCH
