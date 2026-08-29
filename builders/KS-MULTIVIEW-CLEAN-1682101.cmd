@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$u='https://raw.githubusercontent.com/djudge47/kristalstreams/main/builders/KS-MULTIVIEW-CLEAN-1682101.ps1'; $p=Join-Path $env:TEMP 'KS-MULTIVIEW-CLEAN-1682101.ps1'; Invoke-WebRequest -Uri $u -OutFile $p; Unblock-File $p; & $p"
set "ec=%ERRORLEVEL%"
if not "%ec%"=="0" (
  echo.
  echo BUILD FAILED. Send me the last lines from this window.
)
pause
exit /b %ec%
