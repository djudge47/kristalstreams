@echo off
setlocal EnableExtensions
title Kristal Streams Complete Voice Commands 1682052

echo.
echo ==========================================================
echo   KRISTAL STREAMS COMPLETE VOICE COMMANDS 1682052
echo ==========================================================
echo.
echo Downloading the verified full-code Windows builder...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference='Stop'; $root=Join-Path $env:TEMP 'ks-1682052-voice-commands-complete'; $b64=$root+'.b64'; $zip=$root+'.zip'; $dir=$root+'-files'; Remove-Item $b64,$zip -Force -ErrorAction SilentlyContinue; Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue; Invoke-WebRequest -UseBasicParsing 'https://raw.githubusercontent.com/djudge47/kristalstreams/0d398d9e0617dd9e0473b2feb6a0d25273ce4f7f/kristalstreams-1682052.zip.b64' -OutFile $b64; [IO.File]::WriteAllBytes($zip,[Convert]::FromBase64String([IO.File]::ReadAllText($b64))); Expand-Archive -LiteralPath $zip -DestinationPath $dir -Force; $builder=Join-Path $dir 'KS-VOICE-COMMANDS-COMPLETE-1682052.cmd'; if(-not (Test-Path -LiteralPath $builder)){throw 'Complete full-code voice-command builder was not found after extraction'}; Unblock-File $builder; & $builder; if($LASTEXITCODE){exit $LASTEXITCODE}"

if errorlevel 1 (
    color 4F
    echo.
    echo ERROR: The full-code 1682052 builder could not be downloaded or started.
    echo.
    pause
    exit /b 1
)

exit /b 0
