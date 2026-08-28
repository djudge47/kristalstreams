$ErrorActionPreference = 'Stop'

$root = 'C:\ksserieslandscapebuttonverify-20260825-065729'
$app = Join-Path $root 'app'
$src = Join-Path $app 'src\main'
$java = Join-Path $src 'java\com\kristalstreams\player'
$res = Join-Path $src 'res'
$homeActivity = Join-Path $java 'HomeActivity.kt'
$multi = Join-Path $java 'MultiViewActivity.kt'
$manifest = Join-Path $src 'AndroidManifest.xml'
$portrait = Join-Path $res 'layout\activity_home.xml'
$land = Join-Path $res 'layout-land\activity_home.xml'
$gradle = Join-Path $app 'build.gradle.kts'
$gradlew = Join-Path $root 'gradlew.bat'
$outApk = Join-Path $env:USERPROFILE 'Desktop\KristalStreams-1.6.8-MultiView-Home-1682046.apk'
$utf8 = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' KRISTAL STREAMS - MULTIVIEW HOME 1682046' -ForegroundColor Cyan
Write-Host ' Existing Windows source + existing Gradle wrapper' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

foreach ($p in @($root,$gradlew,$homeActivity,$multi,$manifest,$portrait,$land,$gradle)) {
    if (-not (Test-Path $p)) { throw "Required working-source file not found: $p" }
}

$manifestText = [System.IO.File]::ReadAllText($manifest, [System.Text.Encoding]::UTF8)
if ($manifestText -notmatch 'MultiViewActivity') { throw 'MultiViewActivity is not registered in AndroidManifest.xml. Stopping to protect the source.' }

$gradleText = [System.IO.File]::ReadAllText($gradle, [System.Text.Encoding]::UTF8)
if ($gradleText -notmatch 'versionCode\s*=\s*1682045' -and $gradleText -notmatch 'versionCode\s*=\s*1682046') {
    throw 'Expected 1682045 MultiView baseline not found. Stopping to protect the working source.'
}

$backup = Join-Path $root ('_multiview_home_backup_' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item $homeActivity (Join-Path $backup 'HomeActivity.kt') -Force
Copy-Item $portrait (Join-Path $backup 'activity_home.xml') -Force
Copy-Item $land (Join-Path $backup 'activity_home-land.xml') -Force
Copy-Item $gradle (Join-Path $backup 'build.gradle.kts') -Force
Write-Host "Backup created: $backup" -ForegroundColor DarkGray

# Wire MultiView into HomeActivity using stable ASCII anchors only.
$homeText = [System.IO.File]::ReadAllText($homeActivity, [System.Text.Encoding]::UTF8)
if ($homeText -notmatch 'val multiview =') {
    $anchor1 = '        val continuing = { launch(ContinueWatchingActivity::class.java) }'
    if (-not $homeText.Contains($anchor1)) { throw 'HomeActivity action anchor not found.' }
    $homeText = $homeText.Replace($anchor1, $anchor1 + "`r`n        val multiview = { launch(MultiViewActivity::class.java) }")
}
if ($homeText -notmatch 'multiviewCard') {
    $anchor2 = '        click(R.id.continueCard, continuing)'
    if (-not $homeText.Contains($anchor2)) { throw 'HomeActivity card anchor not found.' }
    $homeText = $homeText.Replace($anchor2, $anchor2 + "`r`n        click(R.id.multiviewCard, multiview)")
}
[System.IO.File]::WriteAllText($homeActivity, $homeText, $utf8)

function Add-MultiViewCardToLayout([string]$path) {
    [xml]$doc = Get-Content -LiteralPath $path -Raw
    $androidNs = 'http://schemas.android.com/apk/res/android'

    $mgr = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
    $mgr.AddNamespace('android', $androidNs)
    $existing = $doc.SelectSingleNode('//*[@android:id="@+id/multiviewCard"]', $mgr)
    if ($existing) { return }

    $searchNode = $doc.SelectSingleNode('//*[@android:id="@+id/searchCard"]', $mgr)
    if (-not $searchNode) { throw "searchCard not found in $path" }
    $parent = $searchNode.ParentNode
    if (-not $parent) { throw "searchCard parent not found in $path" }

    $node = $doc.CreateElement('TextView')
    $node.SetAttribute('id', $androidNs, '@+id/multiviewCard')
    $node.SetAttribute('layout_width', $androidNs, '0dp')
    $node.SetAttribute('layout_height', $androidNs, 'match_parent')
    $node.SetAttribute('layout_weight', $androidNs, '1')
    $node.SetAttribute('layout_marginStart', $androidNs, '4dp')
    $node.SetAttribute('gravity', $androidNs, 'center')
    $node.SetAttribute('text', $androidNs, 'MULTI-VIEW')
    $node.SetAttribute('textColor', $androidNs, '@color/ks_white')
    $node.SetAttribute('textStyle', $androidNs, 'bold')
    $node.SetAttribute('textSize', $androidNs, '12sp')
    $node.SetAttribute('background', $androidNs, '@drawable/bg_official_utility')
    $node.SetAttribute('focusable', $androidNs, 'true')
    $node.SetAttribute('clickable', $androidNs, 'true')

    if ($searchNode.NextSibling) {
        [void]$parent.InsertAfter($node, $searchNode)
    } else {
        [void]$parent.AppendChild($node)
    }

    $settings = New-Object System.Xml.XmlWriterSettings
    $settings.Indent = $true
    $settings.Encoding = $utf8
    $settings.OmitXmlDeclaration = $false
    $writer = [System.Xml.XmlWriter]::Create($path, $settings)
    try { $doc.Save($writer) } finally { $writer.Close() }
}

Add-MultiViewCardToLayout $portrait
Add-MultiViewCardToLayout $land

# Bump version only.
$gradleText = [System.IO.File]::ReadAllText($gradle, [System.Text.Encoding]::UTF8)
$gradleText = [regex]::Replace($gradleText, 'versionCode\s*=\s*1682045', 'versionCode = 1682046')
$gradleText = [regex]::Replace($gradleText, 'versionName\s*=\s*"[^"]*"', 'versionName = "1.6.8-multiview-home-1682046"')
[System.IO.File]::WriteAllText($gradle, $gradleText, $utf8)

# Verification before build.
$verifyHome = [System.IO.File]::ReadAllText($homeActivity, [System.Text.Encoding]::UTF8)
$verifyPortrait = [System.IO.File]::ReadAllText($portrait, [System.Text.Encoding]::UTF8)
$verifyLand = [System.IO.File]::ReadAllText($land, [System.Text.Encoding]::UTF8)
if ($verifyHome -notmatch 'MultiViewActivity' -or $verifyHome -notmatch 'multiviewCard') { throw 'HomeActivity MultiView verification failed.' }
if ($verifyPortrait -notmatch 'multiviewCard') { throw 'Portrait home MultiView card verification failed.' }
if ($verifyLand -notmatch 'multiviewCard') { throw 'Landscape home MultiView card verification failed.' }

Write-Host 'MultiView dashboard wiring verified.' -ForegroundColor Green
Write-Host 'Building with EXISTING Gradle wrapper...' -ForegroundColor Cyan
Push-Location $root
try {
    & $gradlew --no-daemon assembleDebug
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

$builtApk = Join-Path $app 'build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $builtApk)) { throw "Build reported success but APK was not found: $builtApk" }

Copy-Item $builtApk $outApk -Force
if (-not (Test-Path $outApk)) { throw 'Desktop APK copy verification failed.' }

Write-Host ''
Write-Host '============================================================' -ForegroundColor Green
Write-Host ' BUILD SUCCESSFUL' -ForegroundColor Green
Write-Host ' MULTI-VIEW IS NOW ON THE MAIN DASHBOARD' -ForegroundColor Green
Write-Host " APK: $outApk" -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
Write-Host ''

Start-Process explorer.exe -ArgumentList ('/select,"' + $outApk + '"')
