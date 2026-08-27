@echo off
setlocal EnableExtensions
title Kristal Streams Search Bar Mic Complete 1682053

echo.
echo ==========================================================
echo   KRISTAL STREAMS SEARCH BAR MIC COMPLETE 1682053
echo ==========================================================
echo.
echo Downloading the verified full-code Windows builder...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference='Stop'; $root=Join-Path $env:TEMP 'ks-1682053-search-bar-mic-complete'; $b64=$root+'.b64'; $zip=$root+'.zip'; $dir=$root+'-files'; Remove-Item $b64,$zip -Force -ErrorAction SilentlyContinue; Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue; Invoke-WebRequest -UseBasicParsing 'https://raw.githubusercontent.com/djudge47/kristalstreams/88765e0cf880ba55533f1afb0e5782765b66868e/kristalstreams-1682053.zip.b64' -OutFile $b64; [IO.File]::WriteAllBytes($zip,[Convert]::FromBase64String([IO.File]::ReadAllText($b64))); Expand-Archive -LiteralPath $zip -DestinationPath $dir -Force; $builder=Join-Path $dir 'KS-SEARCH-BAR-MIC-COMPLETE-1682053.cmd'; if(-not (Test-Path -LiteralPath $builder)){throw 'Corrected full-code search-bar microphone builder was not found after extraction'}; Unblock-File $builder; & $builder; if($LASTEXITCODE){exit $LASTEXITCODE}"

if errorlevel 1 (
    color 4F
    echo.
    echo ERROR: The full-code 1682053 builder could not be downloaded or started.
    echo.
    pause
    exit /b 1
)

exit /b 0
