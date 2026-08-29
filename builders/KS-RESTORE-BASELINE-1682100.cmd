@echo off
setlocal
set "PS1=%TEMP%\KS-RESTORE-BASELINE-1682100.ps1"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/djudge47/kristalstreams/main/builders/KS-RESTORE-BASELINE-1682100.ps1' -OutFile '%PS1%'"
if errorlevel 1 goto :fail
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS1%"
if errorlevel 1 goto :fail
exit /b 0
:fail
echo.
echo BUILD FAILED. Send me the last lines from this window.
pause
exit /b 1
