$ErrorActionPreference = 'Stop'

# Use the most recent successful 1682195 workspace so the exact working build is preserved.
$sourceDir = Get-ChildItem -LiteralPath 'C:\' -Directory -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Name -like 'ks-mobile-rotation-restore-1682195-*' -and
        (Test-Path (Join-Path $_.FullName 'app\build\outputs\apk\debug\app-debug.apk')) -and
        (Test-Path (Join-Path $_.FullName 'app\src\main\res\layout-land\activity_home.xml'))
    } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if ($null -eq $sourceDir) {
    $fallback = 'C:\ks-mobile-landscape-home-1682193-20260902-151413'
    if (!(Test-Path (Join-Path $fallback 'app\src\main\res\layout-land\activity_home.xml'))) {
        throw 'No successful 1682195 workspace and no 1682193 fallback source were found.'
    }
    $sourcePath = $fallback
} else {
    $sourcePath = $sourceDir.FullName
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$workPath = "C:\ks-mobile-rotation-centered-1682196-$stamp"
$desktopPath = [Environment]::GetFolderPath('Desktop')
$outputApk = Join-Path $desktopPath 'KristalStreams-MOBILE-ROTATION-CENTERED-1682196.apk'

Write-Host ''
Write-Host 'KRISTAL STREAMS - CENTER MOBILE LANDSCAPE 1682196' -ForegroundColor Cyan
Write-Host ('SOURCE: ' + $sourcePath) -ForegroundColor DarkGray
Write-Host 'Preserving com.kristalstreams.player and the working 1682195 rotation behavior.' -ForegroundColor Green
Write-Host ''

Copy-Item -LiteralPath $sourcePath -Destination $workPath -Recurse -Force

$gradlePath = Join-Path $workPath 'app\build.gradle.kts'
$landscapePath = Join-Path $workPath 'app\src\main\res\layout-land\activity_home.xml'
$portraitPath = Join-Path $workPath 'app\src\main\res\layout\activity_home.xml'
$homePath = Join-Path $workPath 'app\src\main\java\com\kristalstreams\player\HomeActivity.kt'

foreach ($requiredPath in @($gradlePath,$landscapePath,$portraitPath,$homePath)) {
    if (!(Test-Path $requiredPath)) { throw "Required file missing: $requiredPath" }
}

$gradleText = Get-Content -LiteralPath $gradlePath -Raw
if ($gradleText -notmatch 'applicationId\s*=\s*"com\.kristalstreams\.player"') {
    throw 'STOP: package is not com.kristalstreams.player'
}

$homeText = Get-Content -LiteralPath $homePath -Raw
if ($homeText -notmatch 'SCREEN_ORIENTATION_UNSPECIFIED') {
    throw 'STOP: mobile auto-rotation logic is missing'
}

# Advance only the build identity.
$gradleText = [regex]::Replace($gradleText, 'versionCode\s*=\s*\d+', 'versionCode = 1682196', 1)
$gradleText = [regex]::Replace($gradleText, 'versionName\s*=\s*"[^"]*"', 'versionName = "1.6.8-mobile-rotation-centered-1682196"', 1)
Set-Content -LiteralPath $gradlePath -Value $gradleText -Encoding UTF8

# Center the LIVE / MOVIES / SERIES mobile-landscape row when the viewport is wider than the cards.
# On narrow phones it remains horizontally scrollable.
[System.Xml.Linq.XDocument]$doc = [System.Xml.Linq.XDocument]::Load($landscapePath)
$androidNs = [System.Xml.Linq.XNamespace]'http://schemas.android.com/apk/res/android'

$allElements = @($doc.Descendants())
$cardIds = @('liveCard','moviesCard','seriesCard')

$scroll = $allElements | Where-Object {
    $_.Name.LocalName -eq 'HorizontalScrollView' -and
    (@($_.Descendants() | Where-Object {
        $idAttr = $_.Attribute($androidNs + 'id')
        if ($null -eq $idAttr) { return $false }
        $idValue = $idAttr.Value
        return ($cardIds | Where-Object { $idValue -match ('/' + [regex]::Escape($_) + '$') }).Count -gt 0
    }).Count -ge 3)
} | Select-Object -First 1

if ($null -eq $scroll) {
    throw 'STOP: could not locate the mobile landscape WATCH NOW HorizontalScrollView'
}

$scroll.SetAttributeValue($androidNs + 'layout_width','match_parent')
$scroll.SetAttributeValue($androidNs + 'fillViewport','true')

$row = $scroll.Descendants() | Where-Object {
    $_.Name.LocalName -eq 'LinearLayout' -and
    $_.Attribute($androidNs + 'orientation') -and
    $_.Attribute($androidNs + 'orientation').Value -eq 'horizontal' -and
    (@($_.Descendants() | Where-Object {
        $idAttr = $_.Attribute($androidNs + 'id')
        if ($null -eq $idAttr) { return $false }
        $idValue = $idAttr.Value
        return ($cardIds | Where-Object { $idValue -match ('/' + [regex]::Escape($_) + '$') }).Count -gt 0
    }).Count -ge 3)
} | Select-Object -First 1

if ($null -eq $row) {
    throw 'STOP: could not locate the LIVE/MOVIES/SERIES landscape row'
}

$row.SetAttributeValue($androidNs + 'layout_width','wrap_content')
$row.SetAttributeValue($androidNs + 'gravity','center_horizontal')
$row.SetAttributeValue($androidNs + 'layout_gravity','center_horizontal')

$doc.Save($landscapePath)

# Verify the exact centering patch exists before building.
$verifyText = Get-Content -LiteralPath $landscapePath -Raw
if ($verifyText -notmatch 'fillViewport="true"') { throw 'STOP: fillViewport centering patch did not stick' }
if ($verifyText -notmatch 'gravity="center_horizontal"') { throw 'STOP: row centering patch did not stick' }

# Android SDK path for this isolated workspace.
$sdkPath = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
if (Test-Path $sdkPath) {
    $escapedSdk = $sdkPath -replace '\\','\\\\'
    Set-Content -LiteralPath (Join-Path $workPath 'local.properties') -Value ('sdk.dir=' + $escapedSdk) -Encoding ASCII
}

Push-Location $workPath
try {
    & .\gradlew.bat clean assembleDebug --rerun-tasks --console=plain
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}

$builtApk = Join-Path $workPath 'app\build\outputs\apk\debug\app-debug.apk'
if (!(Test-Path $builtApk)) { throw 'Build completed but app-debug.apk was not found' }

Copy-Item -LiteralPath $builtApk -Destination $outputApk -Force
if (!(Test-Path $outputApk)) { throw 'Finished APK could not be copied to Desktop' }

Write-Host ''
Write-Host 'BUILD SUCCESSFUL' -ForegroundColor Green
Write-Host 'PACKAGE: com.kristalstreams.player' -ForegroundColor Green
Write-Host 'ROTATION: PRESERVED' -ForegroundColor Green
Write-Host 'MOBILE LANDSCAPE HOME ROW: CENTERED' -ForegroundColor Green
Write-Host ('APK: ' + $outputApk) -ForegroundColor Cyan
Write-Host ('WORKSPACE: ' + $workPath) -ForegroundColor DarkGray
Write-Host ''

explorer.exe /select,"$outputApk"
