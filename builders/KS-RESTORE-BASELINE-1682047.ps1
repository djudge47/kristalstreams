$ErrorActionPreference = 'Stop'

$root = 'C:\ksserieslandscapebuttonverify-20260825-065729'
$app = Join-Path $root 'app'
$src = Join-Path $app 'src\main'
$java = Join-Path $src 'java\com\kristalstreams\player'
$manifest = Join-Path $src 'AndroidManifest.xml'
$channels = Join-Path $java 'ChannelsActivity.kt'
$gradle = Join-Path $app 'build.gradle.kts'
$gradlew = Join-Path $root 'gradlew.bat'
$outApk = Join-Path $env:USERPROFILE 'Desktop\KristalStreams-BASELINE-RESTORE-1682047.apk'
$utf8 = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' KRISTAL STREAMS - BASELINE RESTORE 1682047' -ForegroundColor Cyan
Write-Host ' Restore clean pre-MultiView source + existing Gradle wrapper' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

foreach ($p in @($root,$gradlew,$channels,$manifest,$gradle)) {
    if (-not (Test-Path $p)) { throw "Required file not found: $p" }
}

$backup = Join-Path $root '_multiview_backup_20260828-143340'
if (-not (Test-Path $backup)) { throw "Expected clean backup not found: $backup" }

Write-Host "Restoring clean backup: $backup" -ForegroundColor Yellow

$map = @{
    'ChannelsActivity.kt' = $channels
    'AndroidManifest.xml' = $manifest
    'build.gradle.kts' = $gradle
    'activity_channels.xml' = (Join-Path $src 'res\layout\activity_channels.xml')
    'activity_channels-land.xml' = (Join-Path $src 'res\layout-land\activity_channels.xml')
}

foreach ($name in $map.Keys) {
    $from = Join-Path $backup $name
    if (Test-Path $from) {
        Copy-Item $from $map[$name] -Force
        Write-Host "Restored $name" -ForegroundColor DarkGray
    }
}

$multi = Join-Path $java 'MultiViewActivity.kt'
if (Test-Path $multi) {
    Remove-Item $multi -Force
    Write-Host 'Removed MultiViewActivity.kt from working source.' -ForegroundColor DarkGray
}

# Ensure manifest does not retain the MultiView activity after baseline restore.
$manifestText = [System.IO.File]::ReadAllText($manifest, [System.Text.Encoding]::UTF8)
$manifestText = [regex]::Replace($manifestText, '\s*<activity\s+android:name="\.MultiViewActivity"[^>]*/>', '')
[System.IO.File]::WriteAllText($manifest, $manifestText, $utf8)

# Keep the restored source, but give this verification build a new Android version and unique filename.
$gradleText = [System.IO.File]::ReadAllText($gradle, [System.Text.Encoding]::UTF8)
$gradleText = [regex]::Replace($gradleText, 'versionCode\s*=\s*\d+', 'versionCode = 1682047')
$gradleText = [regex]::Replace($gradleText, 'versionName\s*=\s*"[^"]*"', 'versionName = "1.6.8-baseline-restore-1682047"')
[System.IO.File]::WriteAllText($gradle, $gradleText, $utf8)

if (Test-Path $outApk) { Remove-Item $outApk -Force }

Write-Host 'Building restored baseline with EXISTING Gradle wrapper...' -ForegroundColor Cyan
Push-Location $root
try {
    & $gradlew --no-daemon assembleDebug
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

$builtApk = Join-Path $app 'build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $builtApk)) { throw "Build completed but APK not found: $builtApk" }

Copy-Item $builtApk $outApk -Force
if (-not (Test-Path $outApk)) { throw 'Desktop APK copy failed.' }

Write-Host ''
Write-Host '============================================================' -ForegroundColor Green
Write-Host ' BUILD SUCCESSFUL' -ForegroundColor Green
Write-Host ' CLEAN BASELINE RESTORED AND BUILT' -ForegroundColor Green
Write-Host " APK: $outApk" -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
Write-Host ''

Start-Process explorer.exe -ArgumentList ('/select,"' + $outApk + '"')
