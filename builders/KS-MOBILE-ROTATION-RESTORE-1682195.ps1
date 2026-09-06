$ErrorActionPreference = 'Stop'

$source = 'C:\ks-mobile-landscape-home-1682193-20260902-151413'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$work = "C:\ks-mobile-rotation-restore-1682195-$stamp"
$desktop = [Environment]::GetFolderPath('Desktop')
$outApk = Join-Path $desktop 'KristalStreams-MOBILE-ROTATION-RESTORE-1682195.apk'

if (!(Test-Path $source)) { throw "Known rotating 1682193 source not found: $source" }
if (!(Test-Path (Join-Path $source 'gradlew.bat'))) { throw 'gradlew.bat missing from 1682193 source' }

Write-Host ''
Write-Host 'KRISTAL STREAMS - MOBILE ROTATION RESTORE 1682195' -ForegroundColor Cyan
Write-Host 'Using the known rotating com.kristalstreams.player 1682193 source.' -ForegroundColor Green
Write-Host 'No Gearzone package. No APK decompile. No dashboard redesign.' -ForegroundColor Green
Write-Host ''

Copy-Item -LiteralPath $source -Destination $work -Recurse -Force

$gradlePath = Join-Path $work 'app\build.gradle.kts'
$manifestPath = Join-Path $work 'app\src\main\AndroidManifest.xml'
$homePath = Join-Path $work 'app\src\main\java\com\kristalstreams\player\HomeActivity.kt'
$portraitPath = Join-Path $work 'app\src\main\res\layout\activity_home.xml'
$landscapePath = Join-Path $work 'app\src\main\res\layout-land\activity_home.xml'

foreach ($requiredPath in @($gradlePath,$manifestPath,$homePath,$portraitPath,$landscapePath)) {
    if (!(Test-Path $requiredPath)) { throw "Required rotating-source file missing: $requiredPath" }
}

$g = Get-Content -LiteralPath $gradlePath -Raw
if ($g -notmatch 'applicationId\s*=\s*"com\.kristalstreams\.player"') {
    throw 'STOP: applicationId is not com.kristalstreams.player'
}

$h = Get-Content -LiteralPath $homePath -Raw
if ($h -notmatch 'SCREEN_ORIENTATION_UNSPECIFIED') {
    throw 'STOP: known mobile auto-rotation logic is missing from HomeActivity'
}
if ($h -notmatch 'R\.layout\.activity_home') {
    throw 'STOP: HomeActivity is not wired to the mobile activity_home resource'
}

# Preserve the rotating architecture and only advance the build identity.
$g = [regex]::Replace($g, 'versionCode\s*=\s*\d+', 'versionCode = 1682195', 1)
$g = [regex]::Replace($g, 'versionName\s*=\s*"[^"]*"', 'versionName = "1.6.8-mobile-rotation-restore-1682195"', 1)
Set-Content -LiteralPath $gradlePath -Value $g -Encoding UTF8

# Keep package identity locked to the provider package.
$g2 = Get-Content -LiteralPath $gradlePath -Raw
if ($g2 -notmatch 'applicationId\s*=\s*"com\.kristalstreams\.player"') {
    throw 'STOP: provider package identity changed unexpectedly'
}

# Prepare Android SDK path without touching the source baseline.
$sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
if (Test-Path $sdk) {
    $sdkEscaped = $sdk -replace '\\','\\\\'
    Set-Content -LiteralPath (Join-Path $work 'local.properties') -Value ("sdk.dir=" + $sdkEscaped) -Encoding ASCII
}

Push-Location $work
try {
    & .\gradlew.bat clean assembleDebug --rerun-tasks --console=plain
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}

$built = Join-Path $work 'app\build\outputs\apk\debug\app-debug.apk'
if (!(Test-Path $built)) { throw 'Build completed but app-debug.apk was not found' }

Copy-Item -LiteralPath $built -Destination $outApk -Force
if (!(Test-Path $outApk)) { throw 'Finished APK could not be copied to Desktop' }

Write-Host ''
Write-Host 'BUILD SUCCESSFUL' -ForegroundColor Green
Write-Host 'PACKAGE PRESERVED: com.kristalstreams.player' -ForegroundColor Green
Write-Host 'MOBILE ROTATION ARCHITECTURE PRESERVED FROM 1682193' -ForegroundColor Green
Write-Host ('APK: ' + $outApk) -ForegroundColor Cyan
Write-Host ('WORKSPACE: ' + $work) -ForegroundColor DarkGray
Write-Host ''

explorer.exe /select,"$outApk"
