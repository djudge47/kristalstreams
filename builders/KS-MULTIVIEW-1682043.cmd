@echo off
setlocal EnableExtensions
title Kristal Streams MultiView 1682043

echo.
echo ============================================================
echo  KRISTAL STREAMS - MULTIVIEW 1682043
echo  Existing Windows source + existing Gradle wrapper
echo ============================================================
echo.

set "PS1=%TEMP%\KS-MULTIVIEW-1682043.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/djudge47/kristalstreams/main/builders/KS-MULTIVIEW-1682043.ps1' -OutFile '%PS1%'"
if errorlevel 1 (
  echo ERROR: Could not download MultiView builder payload.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%"
if errorlevel 1 (
  echo.
  echo BUILD FAILED. Send me the last lines from this window.
  echo.
  pause
  exit /b 1
)

echo.
echo Build complete. APK is on your Desktop.
echo.
pause
exit /b 0
