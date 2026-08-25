@echo off
setlocal EnableExtensions EnableDelayedExpansion
title KS Windows Incremental Setup 1682042

set "POINTER=%USERPROFILE%\.kristalstreams-working-source.txt"
set "FOUND="

echo.
echo ==========================================================
echo   KRISTAL STREAMS - WINDOWS INCREMENTAL BUILD SETUP
echo   APPROVED BASELINE: 1682042
echo ==========================================================
echo.
echo Locating the verified 1682042 Windows working source...

for /d %%D in ("C:\ksserieslandscapebuttonverify-*") do (
    if exist "%%~fD\gradlew.bat" if exist "%%~fD\app\build.gradle.kts" if exist "%%~fD\app\build\outputs\apk\debug\app-debug.apk" (
        findstr /c:"versionCode = 1682042" "%%~fD\app\build.gradle.kts" >nul
        if not errorlevel 1 set "FOUND=%%~fD"
    )
)

if not defined FOUND (
    echo.
    echo ERROR: A completed 1682042 working source was not found.
    echo Run the 1682042 APK builder successfully, then run this setup again.
    echo No files were changed.
    echo.
    pause
    exit /b 1
)

> "%POINTER%" echo !FOUND!
> "!FOUND!\.kristalstreams-approved-version.txt" echo 1682042

if not exist "%POINTER%" (
    echo.
    echo ERROR: The incremental source pointer could not be created.
    pause
    exit /b 1
)

set "CHECK="
set /p CHECK=<"%POINTER%"
if /i not "!CHECK!"=="!FOUND!" (
    echo.
    echo ERROR: The incremental source pointer did not verify correctly.
    pause
    exit /b 1
)

echo.
echo ==========================================================
echo   INCREMENTAL WINDOWS WORKFLOW IS READY
echo ==========================================================
echo.
echo Approved source:
echo   !FOUND!
echo.
echo Future PowerShell .cmd builders will update this verified source,
echo preserve Gradle build outputs, and avoid full clean rebuilds.
echo.
echo Original known-good R2 source: UNTOUCHED
echo.
pause
exit /b 0
