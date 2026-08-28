$ErrorActionPreference = 'Stop'

$root = 'C:\ksserieslandscapebuttonverify-20260825-065729'
$app = Join-Path $root 'app'
$src = Join-Path $app 'src\main'
$java = Join-Path $src 'java\com\kristalstreams\player'
$res = Join-Path $src 'res'
$manifest = Join-Path $src 'AndroidManifest.xml'
$channels = Join-Path $java 'ChannelsActivity.kt'
$layout = Join-Path $res 'layout\activity_channels.xml'
$layoutLand = Join-Path $res 'layout-land\activity_channels.xml'
$gradle = Join-Path $app 'build.gradle.kts'
$gradlew = Join-Path $root 'gradlew.bat'
$multi = Join-Path $java 'MultiViewActivity.kt'
$outApk = Join-Path $env:USERPROFILE 'Desktop\KristalStreams-1.6.8-MultiView-1682044.apk'
$cleanBackup = 'C:\ksserieslandscapebuttonverify-20260825-065729\_multiview_backup_20260828-143340'
$utf8 = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' KRISTAL STREAMS - MULTIVIEW REPAIR 1682044' -ForegroundColor Cyan
Write-Host ' Restore clean backup -> corrected hook -> existing Gradle' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$required = @($root,$gradlew,$cleanBackup,$multi)
foreach ($p in $required) {
    if (-not (Test-Path $p)) { throw "Required file/folder not found: $p" }
}

# Restore only the five files protected before the failed 1682043 attempt.
$restoreMap = @{
    (Join-Path $cleanBackup 'ChannelsActivity.kt') = $channels
    (Join-Path $cleanBackup 'activity_channels.xml') = $layout
    (Join-Path $cleanBackup 'activity_channels-land.xml') = $layoutLand
    (Join-Path $cleanBackup 'AndroidManifest.xml') = $manifest
    (Join-Path $cleanBackup 'build.gradle.kts') = $gradle
}
foreach ($source in $restoreMap.Keys) {
    if (-not (Test-Path $source)) { throw "Clean backup file missing: $source" }
    Copy-Item $source $restoreMap[$source] -Force
}
Write-Host 'Clean 1682042 source files restored from protected backup.' -ForegroundColor Green

# Helper functions: preserve UTF-8 and avoid PowerShell 5 encoding damage.
function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}
function Write-Utf8([string]$path, [string]$text) {
    [System.IO.File]::WriteAllText($path, $text, $utf8)
}

# 1) Add MultiView button listener immediately after the existing Guide listener.
$channelsText = Read-Utf8 $channels
if ($channelsText -notmatch 'R\.id\.multiviewButton') {
    $guidePattern = '(?ms)^(\s*)findViewById<Button>\(R\.id\.guideButton\)\.setOnClickListener \{\s*startActivity\(Intent\(this, GuideActivity::class\.java\)\.apply \{\s*putExtra\("categoryId", currentCategoryId\)\s*\}\)\s*\}'
    $rx = New-Object System.Text.RegularExpressions.Regex($guidePattern)
    $m = $rx.Match($channelsText)
    if (-not $m.Success) { throw 'Could not find the existing Guide button listener in clean ChannelsActivity.kt.' }
    $indent = $m.Groups[1].Value
    $listener = $m.Value + "`r`n" + $indent + 'findViewById<Button>(R.id.multiviewButton).setOnClickListener {' + "`r`n" + $indent + '    startActivity(Intent(this, MultiViewActivity::class.java))' + "`r`n" + $indent + '}'
    $channelsText = $channelsText.Substring(0,$m.Index) + $listener + $channelsText.Substring($m.Index + $m.Length)
    Write-Utf8 $channels $channelsText
}

# 2) Add portrait MultiView button before Guide.
$layoutText = Read-Utf8 $layout
if ($layoutText -notmatch '@\+id/multiviewButton') {
    $anchor = "        <Button`r`n            android:id=\"@+id/guideButton\""
    if (-not $layoutText.Contains($anchor)) {
        $anchor = "        <Button`n            android:id=\"@+id/guideButton\""
    }
    if (-not $layoutText.Contains($anchor)) { throw 'Portrait Guide button anchor not found.' }
    $nl = if ($layoutText.Contains("`r`n")) { "`r`n" } else { "`n" }
    $button = '        <Button' + $nl +
              '            android:id="@+id/multiviewButton"' + $nl +
              '            android:layout_width="84dp"' + $nl +
              '            android:layout_height="42dp"' + $nl +
              '            android:layout_marginEnd="5dp"' + $nl +
              '            android:text="MULTI-VIEW"' + $nl +
              '            android:textColor="@color/ks_white"' + $nl +
              '            android:textStyle="bold"' + $nl +
              '            android:textSize="8sp"' + $nl +
              '            android:background="@drawable/bg_button"/>' + $nl + $nl
    $layoutText = $layoutText.Replace($anchor, $button + $anchor)
    Write-Utf8 $layout $layoutText
}

# 3) Add landscape MultiView button before TV Guide.
$landText = Read-Utf8 $layoutLand
if ($landText -notmatch '@\+id/multiviewButton') {
    $anchor = "        <Button`r`n            android:id=\"@+id/guideButton\""
    if (-not $landText.Contains($anchor)) {
        $anchor = "        <Button`n            android:id=\"@+id/guideButton\""
    }
    if (-not $landText.Contains($anchor)) { throw 'Landscape Guide button anchor not found.' }
    $nl = if ($landText.Contains("`r`n")) { "`r`n" } else { "`n" }
    $button = '        <Button' + $nl +
              '            android:id="@+id/multiviewButton"' + $nl +
              '            android:layout_width="96dp"' + $nl +
              '            android:layout_height="42dp"' + $nl +
              '            android:layout_marginEnd="8dp"' + $nl +
              '            android:text="MULTI-VIEW"' + $nl +
              '            android:textColor="@color/ks_white"' + $nl +
              '            android:textStyle="bold"' + $nl +
              '            android:textSize="9sp"' + $nl +
              '            android:background="@drawable/bg_button"/>' + $nl + $nl
    $landText = $landText.Replace($anchor, $button + $anchor)
    Write-Utf8 $layoutLand $landText
}

# 4) Register activity in manifest, beside existing PlayerActivity.
$manifestText = Read-Utf8 $manifest
if ($manifestText -notmatch 'MultiViewActivity') {
    $playerLine = '<activity android:name=".PlayerActivity" android:screenOrientation="landscape" />'
    if (-not $manifestText.Contains($playerLine)) { throw 'PlayerActivity manifest anchor not found.' }
    $manifestText = $manifestText.Replace($playerLine, '<activity android:name=".MultiViewActivity" android:screenOrientation="landscape" />' + "`r`n        " + $playerLine)
    Write-Utf8 $manifest $manifestText
}

# 5) Bump only version metadata. Dependencies/build system stay unchanged.
$gradleText = Read-Utf8 $gradle
if ($gradleText -notmatch 'versionCode\s*=\s*1682042') { throw 'Restored build.gradle.kts is not baseline 1682042.' }
$gradleText = [regex]::Replace($gradleText, 'versionCode\s*=\s*1682042', 'versionCode = 1682044', 1)
$gradleText = [regex]::Replace($gradleText, 'versionName\s*=\s*"[^"]+"', 'versionName = "1.6.8-multiview-1682044"', 1)
Write-Utf8 $gradle $gradleText

# Sanity checks before Gradle.
$verifyChannels = Read-Utf8 $channels
if ($verifyChannels -notmatch 'findViewById<Button>\(R\.id\.multiviewButton\)\.setOnClickListener') { throw 'MultiView listener verification failed.' }
if ($verifyChannels -match 's├|├ó|â€“|â€¢') { throw 'Encoding corruption detected in ChannelsActivity.kt. Build stopped.' }
if ((Read-Utf8 $layout) -notmatch '@\+id/multiviewButton') { throw 'Portrait MultiView button verification failed.' }
if ((Read-Utf8 $layoutLand) -notmatch '@\+id/multiviewButton') { throw 'Landscape MultiView button verification failed.' }
if ((Read-Utf8 $manifest) -notmatch 'MultiViewActivity') { throw 'Manifest MultiView verification failed.' }

Write-Host 'Corrected files verified. Building with EXISTING Gradle wrapper...' -ForegroundColor Green
Push-Location $root
try {
    & $gradlew --no-daemon assembleDebug
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

$built = Join-Path $app 'build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $built)) { throw "Build completed but APK not found: $built" }
Copy-Item $built $outApk -Force

Write-Host ''
Write-Host '============================================================' -ForegroundColor Green
Write-Host ' BUILD SUCCESSFUL - MULTIVIEW 1682044' -ForegroundColor Green
Write-Host " APK: $outApk" -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
