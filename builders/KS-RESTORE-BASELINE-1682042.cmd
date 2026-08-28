@echo off
setlocal EnableExtensions
title Kristal Streams Restore Baseline 1682042

set "ROOT=C:\ksserieslandscapebuttonverify-20260825-065729"
set "BAK=%ROOT%\_multiview_backup_20260828-143340"
set "JAVA=%ROOT%\app\src\main\java\com\kristalstreams\player"
set "RES=%ROOT%\app\src\main\res"
set "APP=%ROOT%\app"
set "OUT=%USERPROFILE%\Desktop\KristalStreams-BASELINE-1682042-RESTORED.apk"

echo.
echo ============================================================
echo  KRISTAL STREAMS - RESTORE KNOWN GOOD BASELINE 1682042
echo  No MultiView changes - existing Gradle wrapper only
echo ============================================================
echo.

if not exist "%ROOT%\gradlew.bat" goto :missing
if not exist "%BAK%\ChannelsActivity.kt" goto :missing
if not exist "%BAK%\activity_channels.xml" goto :missing
if not exist "%BAK%\activity_channels-land.xml" goto :missing
if not exist "%BAK%\AndroidManifest.xml" goto :missing
if not exist "%BAK%\build.gradle.kts" goto :missing

echo Restoring clean pre-MultiView files...
copy /Y "%BAK%\ChannelsActivity.kt" "%JAVA%\ChannelsActivity.kt" >nul || goto :copyfail
copy /Y "%BAK%\activity_channels.xml" "%RES%\layout\activity_channels.xml" >nul || goto :copyfail
copy /Y "%BAK%\activity_channels-land.xml" "%RES%\layout-land\activity_channels.xml" >nul || goto :copyfail
copy /Y "%BAK%\AndroidManifest.xml" "%APP%\src\main\AndroidManifest.xml" >nul || goto :copyfail
copy /Y "%BAK%\build.gradle.kts" "%APP%\build.gradle.kts" >nul || goto :copyfail
if exist "%JAVA%\MultiViewActivity.kt" del /F /Q "%JAVA%\MultiViewActivity.kt"

echo Baseline restored.
echo Building untouched baseline with EXISTING Gradle wrapper...
cd /d "%ROOT%"
call gradlew.bat --no-daemon assembleDebug
if errorlevel 1 goto :buildfail

if not exist "%APP%\build\outputs\apk\debug\app-debug.apk" goto :noapk
copy /Y "%APP%\build\outputs\apk\debug\app-debug.apk" "%OUT%" >nul || goto :copyfail

echo.
echo ============================================================
echo  BUILD SUCCESSFUL - BASELINE RESTORED
echo  APK: %OUT%
echo ============================================================
echo.
start "" explorer.exe /select,"%OUT%"
pause
exit /b 0

:missing
echo ERROR: Required baseline file or Gradle wrapper is missing.
goto :fail

:copyfail
echo ERROR: Could not restore/copy a required file.
goto :fail

:buildfail
echo ERROR: The restored baseline did not build. Send the last lines from this window.
goto :fail

:noapk
echo ERROR: Gradle finished but app-debug.apk was not found.
goto :fail

:fail
echo.
echo RESTORE/BUILD FAILED.
pause
exit /b 1
