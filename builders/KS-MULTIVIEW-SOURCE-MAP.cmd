@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Kristal Streams MultiView Source Map

set "SRC=C:\ksserieslandscapebuttonverify-20260825-065729"
set "REPORT=%USERPROFILE%\Desktop\KS-MultiView-Source-Map.txt"

echo ============================================================
echo  KRISTAL STREAMS - MULTIVIEW SOURCE MAP
echo  READ-ONLY CHECK - NO SOURCE FILES WILL BE CHANGED
echo ============================================================
echo.

if not exist "%SRC%" (
  echo ERROR: Source folder not found:
  echo %SRC%
  pause
  exit /b 1
)

(
  echo KRISTAL STREAMS MULTIVIEW SOURCE MAP
  echo Source: %SRC%
  echo Date: %DATE% %TIME%
  echo.
  echo ===== GRADLE WRAPPER =====
  if exist "%SRC%\gradlew.bat" echo FOUND: %SRC%\gradlew.bat
  if exist "%SRC%\gradle\wrapper\gradle-wrapper.jar" echo FOUND: %SRC%\gradle\wrapper\gradle-wrapper.jar
  if exist "%SRC%\gradle\wrapper\gradle-wrapper.properties" echo FOUND: %SRC%\gradle\wrapper\gradle-wrapper.properties
  echo.
  echo ===== MANIFEST FILES =====
  for /r "%SRC%" %%F in (AndroidManifest.xml) do echo %%F
  echo.
  echo ===== BUILD FILES / VERSION INFO =====
  for /r "%SRC%" %%F in (build.gradle build.gradle.kts) do (
    echo --- %%F
    findstr /i /n "applicationId namespace versionCode versionName compileSdk targetSdk minSdk" "%%F" 2^>nul
  )
  echo.
  echo ===== LIKELY LIVE TV / PLAYER / MULTIVIEW SOURCE FILES =====
  for /r "%SRC%" %%F in (*.kt *.java) do (
    echo %%~nxF | findstr /i "live tv player stream multi exo vlc ijk channel category" >nul && echo %%F
  )
  echo.
  echo ===== SOURCE REFERENCES: LIVE TV =====
  findstr /s /i /n /c:"Live TV" /c:"LiveTv" /c:"LiveTV" "%SRC%\*.kt" "%SRC%\*.java" 2^>nul
  echo.
  echo ===== SOURCE REFERENCES: PLAYER / EXOPLAYER / MEDIA3 =====
  findstr /s /i /n /c:"ExoPlayer" /c:"PlayerView" /c:"media3" /c:"VLC" /c:"Ijk" "%SRC%\*.kt" "%SRC%\*.java" "%SRC%\*.gradle" "%SRC%\*.kts" 2^>nul
  echo.
  echo ===== MANIFEST ACTIVITY LINES =====
  for /r "%SRC%" %%F in (AndroidManifest.xml) do (
    echo --- %%F
    findstr /i /n "activity service provider uses-permission" "%%F" 2^>nul
  )
  echo.
  echo ===== LAYOUT FILES WITH PLAYER / LIVE / CHANNEL / GUIDE / MULTI NAMES =====
  for /r "%SRC%" %%F in (*.xml) do (
    echo %%~nxF | findstr /i "player live channel guide multi stream" >nul && echo %%F
  )
  echo.
  echo ===== END SOURCE MAP =====
) > "%REPORT%"

echo Source map complete.
echo No app files were changed.
echo.
echo Report saved to:
echo %REPORT%
echo.
echo Copy the contents of that report into ChatGPT, or drag the TXT file into the chat.
echo.
type "%REPORT%"
echo.
pause
exit /b 0
