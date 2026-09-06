$ErrorActionPreference = 'Stop'

# Use the most recent successful 1682195 workspace so the exact working rotating build is preserved.
$sourceDir = Get-ChildItem -LiteralPath 'C:\' -Directory -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Name -like 'ks-mobile-rotation-restore-1682195-*' -and
        (Test-Path (Join-Path $_.FullName 'app\build\outputs\apk\debug\app-debug.apk')) -and
        (Test-Path (Join-Path $_.FullName 'app\src\main\res\layout-land\activity_home.xml'))
    } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if ($null -eq $sourceDir) {
    $fallbackPath = 'C:\ks-mobile-landscape-home-1682193-20260902-151413'
    if (!(Test-Path (Join-Path $fallbackPath 'app\src\main\res\layout-land\activity_home.xml'))) {
        throw 'No successful 1682195 workspace and no 1682193 fallback source were found.'
    }
    $sourcePath = $fallbackPath
} else {
    $sourcePath = $sourceDir.FullName
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$workPath = "C:\ks-mobile-rotation-centered-1682197-$stamp"
$desktopPath = [Environment]::GetFolderPath('Desktop')
$outputApk = Join-Path $desktopPath 'KristalStreams-MOBILE-ROTATION-CENTERED-1682197.apk'

Write-Host ''
Write-Host 'KRISTAL STREAMS - CENTER MOBILE LANDSCAPE 1682197' -ForegroundColor Cyan
Write-Host ('SOURCE: ' + $sourcePath) -ForegroundColor DarkGray
Write-Host 'Preserving com.kristalstreams.player and the working rotation behavior.' -ForegroundColor Green
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
$gradleText = [regex]::Replace($gradleText, 'versionCode\s*=\s*\d+', 'versionCode = 1682197', 1)
$gradleText = [regex]::Replace($gradleText, 'versionName\s*=\s*"[^"]*"', 'versionName = "1.6.8-mobile-rotation-centered-1682197"', 1)
Set-Content -LiteralPath $gradlePath -Value $gradleText -Encoding UTF8

# Center LIVE / MOVIES / SERIES on mobile landscape without changing card sizes.
# XmlDocument is used because it is available in Windows PowerShell without loading System.Xml.Linq.
$androidNsUri = 'http://schemas.android.com/apk/res/android'
$xmlDoc = New-Object System.Xml.XmlDocument
$xmlDoc.PreserveWhitespace = $true
$xmlDoc.Load($landscapePath)

$scrollNode = $null
foreach ($candidateNode in @($xmlDoc.SelectNodes("//*[local-name()='HorizontalScrollView']"))) {
    $candidateXml = $candidateNode.OuterXml
    if ($candidateXml -match '(?:@\+?id/)?liveCard' -and $candidateXml -match '(?:@\+?id/)?moviesCard' -and $candidateXml -match '(?:@\+?id/)?seriesCard') {
        $scrollNode = $candidateNode
        break
    }
}
if ($null -eq $scrollNode) { throw 'STOP: WATCH NOW HorizontalScrollView was not found' }

$scrollNode.SetAttribute('layout_width', $androidNsUri, 'match_parent')
$scrollNode.SetAttribute('fillViewport', $androidNsUri, 'true')

$rowNode = $null
foreach ($candidateRow in @($scrollNode.SelectNodes(".//*[local-name()='LinearLayout']"))) {
    $rowXml = $candidateRow.OuterXml
    $orientation = $candidateRow.GetAttribute('orientation', $androidNsUri)
    if ($orientation -eq 'horizontal' -and $rowXml -match '(?:@\+?id/)?liveCard' -and $rowXml -match '(?:@\+?id/)?moviesCard' -and $rowXml -match '(?:@\+?id/)?seriesCard') {
        $rowNode = $candidateRow
        break
    }
}
if ($null -eq $rowNode) { throw 'STOP: LIVE/MOVIES/SERIES landscape row was not found' }

# Natural width remains scrollable on narrow phones; fillViewport expands it only when there is spare desktop/landscape width.
$rowNode.SetAttribute('layout_width', $androidNsUri, 'wrap_content')
$rowNode.SetAttribute('gravity', $androidNsUri, 'center_horizontal')
$rowNode.SetAttribute('layout_gravity', $androidNsUri, 'center_horizontal')

$xmlWriterSettings = New-Object System.Xml.XmlWriterSettings
$xmlWriterSettings.Encoding = New-Object System.Text.UTF8Encoding($false)
$xmlWriterSettings.Indent = $false
$xmlWriter = [System.Xml.XmlWriter]::Create($landscapePath, $xmlWriterSettings)
try {
    $xmlDoc.Save($xmlWriter)
} finally {
    $xmlWriter.Close()
}

$verifyText = Get-Content -LiteralPath $landscapePath -Raw
if ($verifyText -notmatch 'fillViewport="true"') { throw 'STOP: fillViewport patch did not stick' }
if ($verifyText -notmatch 'gravity="center_horizontal"') { throw 'STOP: centering patch did not stick' }

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
Write-Host 'LANDSCAPE HOME CONTAINERS: CENTERED' -ForegroundColor Green
Write-Host ('APK: ' + $outputApk) -ForegroundColor Cyan
Write-Host ('WORKSPACE: ' + $workPath) -ForegroundColor DarkGray
Write-Host ''

explorer.exe /select,"$outputApk"
