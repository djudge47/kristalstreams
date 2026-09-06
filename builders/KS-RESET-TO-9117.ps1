$ErrorActionPreference = 'Stop'

$expectedPackage = 'com.gearzoneiptv.gearzoneiptviptvbox'
$expectedVersion = '9117'
$targetApkName = 'KristalStreams-KS-LABELED-REFRESH-9117-TEST.apk'
$dashboardClass = 'com.gearzoneiptv.gearzoneiptviptvbox.view.activity.NewDashboardActivity'
$master = 'C:\KS-76MB-FUNCTIONAL-MASTER'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$resetWork = "C:\ks-reset-9117-$stamp"
$resetDecoded = Join-Path $resetWork 'decoded'
$masterDecoded = Join-Path $master 'decoded'
$backupDecoded = Join-Path $master ("decoded-before-reset-$stamp")

Write-Host ''
Write-Host 'KRISTAL STREAMS - RESET TO 9117' -ForegroundColor Cyan
Write-Host 'TARGET: KristalStreams-KS-LABELED-REFRESH-9117-TEST.apk' -ForegroundColor Green
Write-Host 'ACTION: restore decoded source baseline only' -ForegroundColor Green
Write-Host 'NO BUILD / NO INSTALL / NO ROTATION PATCH' -ForegroundColor Green
Write-Host ''

if (!(Test-Path -LiteralPath $master)) { throw "Master folder not found: $master" }

$buildToolsRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk\build-tools'
if (!(Test-Path -LiteralPath $buildToolsRoot)) { throw "Android SDK build-tools not found: $buildToolsRoot" }
$toolDir = Get-ChildItem -LiteralPath $buildToolsRoot -Directory -ErrorAction SilentlyContinue |
    Sort-Object { try { [version]$_.Name } catch { [version]'0.0' } } -Descending |
    Where-Object { Test-Path (Join-Path $_.FullName 'aapt.exe') } |
    Select-Object -First 1
if (!$toolDir) { throw 'aapt.exe was not found.' }
$aapt = Join-Path $toolDir.FullName 'aapt.exe'
$java = (Get-Command java.exe -ErrorAction Stop).Source

$searchRoots = New-Object System.Collections.Generic.List[string]
foreach ($p in @(
    (Join-Path $env:USERPROFILE 'Desktop'),
    (Join-Path $env:USERPROFILE 'Downloads'),
    (Join-Path $env:USERPROFILE 'Documents'),
    (Join-Path $env:USERPROFILE 'OneDrive\Desktop'),
    $master
)) {
    if ((Test-Path -LiteralPath $p) -and -not $searchRoots.Contains($p)) { [void]$searchRoots.Add($p) }
}
$topLevelKs = Get-ChildItem -LiteralPath 'C:\' -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '(?i)(9117|labeled|76mb|kristal)' }
foreach ($d in $topLevelKs) {
    if (-not $searchRoots.Contains($d.FullName)) { [void]$searchRoots.Add($d.FullName) }
}

$candidates = New-Object System.Collections.Generic.List[System.IO.FileInfo]
foreach ($root in $searchRoots) {
    Get-ChildItem -LiteralPath $root -File -Filter '*9117*.apk' -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notmatch '(?i)(UNSIGNED|ALIGNED)' } |
        ForEach-Object { [void]$candidates.Add($_) }
}

$valid = New-Object System.Collections.Generic.List[object]
foreach ($apk in ($candidates | Sort-Object FullName -Unique)) {
    $badging = @(& $aapt dump badging $apk.FullName 2>$null)
    $packageLine = ($badging | Select-String '^package:').Line | Select-Object -First 1
    if (!$packageLine) { continue }
    $pkg = ([regex]::Match($packageLine, "name='([^']+)'" )).Groups[1].Value
    $ver = ([regex]::Match($packageLine, "versionCode='([^']+)'" )).Groups[1].Value
    if ($pkg -ne $expectedPackage -or $ver -ne $expectedVersion) { continue }
    $priority = 2
    if ($apk.Name -eq $targetApkName) { $priority = 0 }
    elseif ($apk.Name -match '(?i)LABELED-REFRESH-9117.*TEST') { $priority = 1 }
    [void]$valid.Add([pscustomobject]@{ File = $apk; Priority = $priority })
}

$selected = $valid | Sort-Object Priority, @{Expression={$_.File.LastWriteTime};Descending=$true} | Select-Object -First 1
if (!$selected) { throw 'Exact 9117 labeled-refresh TEST APK was not found. Nothing was changed.' }
$source = $selected.File
Write-Host ('FOUND 9117: ' + $source.FullName) -ForegroundColor Yellow

$apktoolCandidates = @(
    (Join-Path $master 'apktool.jar'),
    'C:\KS-FINAL-BASE-20260903-204457\apktool.jar'
)
$apktool = $apktoolCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (!$apktool) { throw 'apktool.jar was not found in the known Kristal Streams tool locations.' }

New-Item -ItemType Directory -Path $resetWork -Force | Out-Null
Write-Host '[1/3] Decoding clean 9117 baseline...' -ForegroundColor Cyan
& $java -jar $apktool d -f $source.FullName -o $resetDecoded
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $resetDecoded)) { throw '9117 baseline decode failed. Existing source was not touched.' }

$manifestPath = Join-Path $resetDecoded 'AndroidManifest.xml'
if (!(Test-Path -LiteralPath $manifestPath)) { throw 'Decoded 9117 manifest missing. Existing source was not touched.' }
$manifestText = [IO.File]::ReadAllText($manifestPath)
if ($manifestText -notmatch [regex]::Escape($dashboardClass)) { throw '9117 dashboard activity missing from decoded baseline. Existing source was not touched.' }
$activityPattern = '(?s)<activity\b(?=[^>]*android:name="' + [regex]::Escape($dashboardClass) + '")[^>]*>'
$activityMatch = [regex]::Match($manifestText, $activityPattern)
if (!$activityMatch.Success -or $activityMatch.Value -notmatch 'android:screenOrientation="sensorLandscape"') {
    throw 'Decoded 9117 baseline does not have the original sensorLandscape dashboard lock. Existing source was not touched.'
}

Write-Host '[2/3] Backing up current decoded source...' -ForegroundColor Cyan
if (Test-Path -LiteralPath $masterDecoded) {
    Move-Item -LiteralPath $masterDecoded -Destination $backupDecoded
}

Write-Host '[3/3] Restoring 9117 decoded source...' -ForegroundColor Cyan
Move-Item -LiteralPath $resetDecoded -Destination $masterDecoded
Copy-Item -LiteralPath $source.FullName -Destination (Join-Path $master $targetApkName) -Force

@(
    'KRISTAL STREAMS CURRENT SOURCE BASELINE',
    'BASE APK: ' + $targetApkName,
    'VERSION CODE: 9117',
    'VERSION NAME: 9.0.17',
    'PACKAGE: ' + $expectedPackage,
    'ROTATION: ORIGINAL sensorLandscape',
    'RESET TIME: ' + (Get-Date),
    'PREVIOUS DECODED BACKUP: ' + $(if (Test-Path -LiteralPath $backupDecoded) { $backupDecoded } else { 'NONE' })
) | Set-Content -LiteralPath (Join-Path $master 'CURRENT-BASELINE.txt') -Encoding UTF8

Write-Host ''
Write-Host 'RESET COMPLETE' -ForegroundColor Green
Write-Host 'CURRENT SOURCE: 9117 LABELED-REFRESH' -ForegroundColor Green
Write-Host 'ROTATION: ORIGINAL sensorLandscape' -ForegroundColor Green
Write-Host 'NO APK BUILT' -ForegroundColor Green
Write-Host 'NO APP INSTALLED OR REMOVED' -ForegroundColor Green
Write-Host ('SOURCE: ' + $masterDecoded) -ForegroundColor Cyan
if (Test-Path -LiteralPath $backupDecoded) { Write-Host ('BACKUP: ' + $backupDecoded) -ForegroundColor DarkGray }
Write-Host ''
