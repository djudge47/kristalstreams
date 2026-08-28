@echo off
setlocal EnableExtensions
title Kristal Streams MultiView Home 1682046

echo.
echo ============================================================
echo  KRISTAL STREAMS - MULTIVIEW HOME 1682046
echo  Existing Windows source + existing Gradle wrapper
echo ============================================================
echo.

set "PS1=%TEMP%\KS-MULTIVIEW-HOME-1682046.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/djudge47/kristalstreams/main/builders/KS-MULTIVIEW-HOME-1682046.ps1' -OutFile '%PS1%'"
if errorlevel 1 (
  echo ERROR: Could not download builder payload.
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
echo BUILD SUCCESSFUL - APK copied to Desktop and opened in Explorer.
echo.
pause
exit /b 0
