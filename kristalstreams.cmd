@echo off
setlocal EnableExtensions
title Kristal Streams Complete Grouped Series 1682049

echo.
echo ==========================================================
echo   KRISTAL STREAMS COMPLETE GROUPED SERIES 1682049
echo ==========================================================
echo.
echo Downloading the verified full-code Windows builder...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference='Stop'; $root=Join-Path $env:TEMP 'ks-1682049-series-grouped'; $b64=$root+'.b64'; $zip=$root+'.zip'; $dir=$root+'-files'; Remove-Item $b64,$zip -Force -ErrorAction SilentlyContinue; Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue; Invoke-WebRequest -UseBasicParsing 'https://raw.githubusercontent.com/djudge47/kristalstreams/0caf23effa4c776dfc0a71ed02c86cd8ec86e315/kristalstreams-1682049.zip.b64' -OutFile $b64; [IO.File]::WriteAllBytes($zip,[Convert]::FromBase64String([IO.File]::ReadAllText($b64))); Expand-Archive -LiteralPath $zip -DestinationPath $dir -Force; $builder=Join-Path $dir 'KS-SERIES-GROUPED-COMPLETE-1682049.cmd'; if(-not (Test-Path -LiteralPath $builder)){throw 'Full-code grouped Series builder was not found after extraction'}; Unblock-File $builder; & $builder; if($LASTEXITCODE){exit $LASTEXITCODE}"

if errorlevel 1 (
    color 4F
    echo.
    echo ERROR: The full-code 1682049 builder could not be downloaded or started.
    echo.
    pause
    exit /b 1
)

exit /b 0
