$ErrorActionPreference = 'Stop'

$targetApkName = 'KristalStreams-KS-LABELED-REFRESH-9117-TEST.apk'
$expectedPackage = 'com.gearzoneiptv.gearzoneiptviptvbox'
$expectedVersion = '9117'
$newVersion = '9124'
$dashboardClass = 'com.gearzoneiptv.gearzoneiptviptvbox.view.activity.NewDashboardActivity'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$work = "C:\ks-9117-rotation-only-9124-$stamp"
$decoded = Join-Path $work 'decoded'
$unsigned = Join-Path $work 'KristalStreams-KS-ROTATION-ONLY-9124-unsigned.apk'
$aligned = Join-Path $work 'KristalStreams-KS-ROTATION-ONLY-9124-aligned.apk'
$desktop = [Environment]::GetFolderPath('Desktop')
$final = Join-Path $desktop 'KristalStreams-KS-ROTATION-ONLY-9124.apk'

Write-Host ''
Write-Host 'KRISTAL STREAMS 9117 - ROTATION ONLY' -ForegroundColor Cyan
Write-Host 'BASE: KristalStreams-KS-LABELED-REFRESH-9117-TEST.apk' -ForegroundColor Green
Write-Host 'CHANGE: NewDashboardActivity orientation only' -ForegroundColor Green
Write-Host 'NO LAYOUT / ARTWORK / REFRESH / ENGINE CHANGES' -ForegroundColor Green
Write-Host ''

$roots = @(
    (Join-Path $env:USERPROFILE 'Desktop'),
    (Join-Path $env:USERPROFILE 'Downloads'),
    (Join-Path $env:USERPROFILE 'OneDrive\Desktop')
) | Where-Object { Test-Path -LiteralPath $_ }

$source = $null
foreach ($root in $roots) {
    $candidate = Get-ChildItem -LiteralPath $root -File -Filter $targetApkName -Recurse -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($candidate) { $source = $candidate; break }
}
if (!$source) { throw "Exact 9117 APK not found on Desktop, Downloads, or OneDrive Desktop: $targetApkName" }

$buildToolsRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk\build-tools'
if (!(Test-Path -LiteralPath $buildToolsRoot)) { throw "Android SDK build-tools not found: $buildToolsRoot" }
$toolDir = Get-ChildItem -LiteralPath $buildToolsRoot -Directory -ErrorAction SilentlyContinue |
    Sort-Object { try { [version]$_.Name } catch { [version]'0.0' } } -Descending |
    Where-Object {
        (Test-Path (Join-Path $_.FullName 'aapt.exe')) -and
        (Test-Path (Join-Path $_.FullName 'zipalign.exe')) -and
        (Test-Path (Join-Path $_.FullName 'apksigner.bat'))
    } | Select-Object -First 1
if (!$toolDir) { throw 'Required Android build-tools were not found.' }

$aapt = Join-Path $toolDir.FullName 'aapt.exe'
$zipalign = Join-Path $toolDir.FullName 'zipalign.exe'
$apksigner = Join-Path $toolDir.FullName 'apksigner.bat'

$badging = @(& $aapt dump badging $source.FullName 2>$null)
$packageLine = ($badging | Select-String '^package:').Line | Select-Object -First 1
if (!$packageLine) { throw 'Could not read 9117 APK metadata.' }
$pkg = ([regex]::Match($packageLine, "name='([^']+)'" )).Groups[1].Value
$ver = ([regex]::Match($packageLine, "versionCode='([^']+)'" )).Groups[1].Value
if ($pkg -ne $expectedPackage) { throw "STOP: wrong package. Found $pkg" }
if ($ver -ne $expectedVersion) { throw "STOP: wrong base version. Found $ver instead of 9117" }

$apktoolCandidates = @(
    'C:\KS-76MB-FUNCTIONAL-MASTER\apktool.jar',
    'C:\KS-FINAL-BASE-20260903-204457\apktool.jar'
)
$apktool = $apktoolCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (!$apktool) {
    New-Item -ItemType Directory -Path $work -Force | Out-Null
    $release = Invoke-RestMethod 'https://api.github.com/repos/iBotPeaches/Apktool/releases/latest'
    $asset = $release.assets | Where-Object { $_.name -match '^apktool_.*\.jar$' } | Select-Object -First 1
    if (!$asset) { throw 'Apktool release jar was not found.' }
    $apktool = Join-Path $work 'apktool.jar'
    Invoke-WebRequest $asset.browser_download_url -OutFile $apktool
}

New-Item -ItemType Directory -Path $work -Force | Out-Null
Copy-Item -LiteralPath $source.FullName -Destination (Join-Path $work $targetApkName) -Force

Write-Host '[1/4] Decoding exact 9117 APK...' -ForegroundColor Cyan
& java -jar $apktool d -f $source.FullName -o $decoded
if ($LASTEXITCODE -ne 0) { throw '9117 decode failed.' }

$manifestPath = Join-Path $decoded 'AndroidManifest.xml'
$yamlPath = Join-Path $decoded 'apktool.yml'
if (!(Test-Path -LiteralPath $manifestPath)) { throw 'Decoded AndroidManifest.xml missing.' }
if (!(Test-Path -LiteralPath $yamlPath)) { throw 'Decoded apktool.yml missing.' }

$manifestText = [IO.File]::ReadAllText($manifestPath)
$activityPattern = '(?s)<activity\b(?=[^>]*android:name="' + [regex]::Escape($dashboardClass) + '")[^>]*>'
$activityMatch = [regex]::Match($manifestText, $activityPattern)
if (!$activityMatch.Success) { throw 'NewDashboardActivity was not found in the 9117 manifest.' }
$activityTag = $activityMatch.Value
if ($activityTag -notmatch 'android:screenOrientation="sensorLandscape"') {
    throw 'STOP: 9117 dashboard is not locked to sensorLandscape as expected.'
}
$newActivityTag = $activityTag -replace 'android:screenOrientation="sensorLandscape"', 'android:screenOrientation="unspecified"'
$manifestText = $manifestText.Substring(0, $activityMatch.Index) + $newActivityTag + $manifestText.Substring($activityMatch.Index + $activityMatch.Length)
[IO.File]::WriteAllText($manifestPath, $manifestText, (New-Object Text.UTF8Encoding($false)))

# Required install version bump only. Keep the original 9.0.17 versionName and every other field unchanged.
$yamlLines = Get-Content -LiteralPath $yamlPath
$versionPatched = $false
for ($i = 0; $i -lt $yamlLines.Count; $i++) {
    if ($yamlLines[$i] -match '^\s*versionCode:\s*') {
        $indent = ([regex]::Match($yamlLines[$i], '^\s*')).Value
        $yamlLines[$i] = $indent + "versionCode: '$newVersion'"
        $versionPatched = $true
        break
    }
}
if (!$versionPatched) { throw 'versionCode was not found in apktool.yml.' }
Set-Content -LiteralPath $yamlPath -Value $yamlLines -Encoding UTF8

$verifyManifest = [IO.File]::ReadAllText($manifestPath)
$verifyMatch = [regex]::Match($verifyManifest, $activityPattern)
if (!$verifyMatch.Success -or $verifyMatch.Value -notmatch 'android:screenOrientation="unspecified"') {
    throw 'Rotation-only manifest patch did not stick.'
}

Write-Host '[2/4] Rebuilding 9117 with rotation unlocked...' -ForegroundColor Cyan
& java -jar $apktool b -f $decoded -o $unsigned
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $unsigned)) { throw 'APK rebuild failed.' }

Write-Host '[3/4] Aligning and signing...' -ForegroundColor Cyan
& $zipalign -f -p 4 $unsigned $aligned
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $aligned)) { throw 'zipalign failed.' }

$keystore = Join-Path $env:USERPROFILE '.android\debug.keystore'
if (!(Test-Path -LiteralPath $keystore)) { throw "Debug keystore not found: $keystore" }
Remove-Item -LiteralPath $final -Force -ErrorAction SilentlyContinue
& $apksigner sign --ks $keystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out $final $aligned
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $final)) { throw 'APK signing failed.' }

# Refuse to hand off an APK signed differently from the exact 9117 base.
$sourceCert = @(& $apksigner verify --print-certs $source.FullName 2>$null) | Select-String 'certificate SHA-256 digest:' | Select-Object -First 1
$finalCert = @(& $apksigner verify --print-certs $final 2>$null) | Select-String 'certificate SHA-256 digest:' | Select-Object -First 1
if (!$sourceCert -or !$finalCert) { throw 'Could not verify signing certificates.' }
$sourceDigest = ($sourceCert.Line -split ':\s*',2)[1].Trim().ToLowerInvariant()
$finalDigest = ($finalCert.Line -split ':\s*',2)[1].Trim().ToLowerInvariant()
if ($sourceDigest -ne $finalDigest) {
    Remove-Item -LiteralPath $final -Force -ErrorAction SilentlyContinue
    throw 'STOP: local signing key does not match 9117. No installable APK was released.'
}

Write-Host '[4/4] Verifying finished APK...' -ForegroundColor Cyan
$finalBadging = @(& $aapt dump badging $final 2>$null)
$finalPackageLine = ($finalBadging | Select-String '^package:').Line | Select-Object -First 1
if (!$finalPackageLine) { throw 'Could not verify finished APK metadata.' }
$finalPkg = ([regex]::Match($finalPackageLine, "name='([^']+)'" )).Groups[1].Value
$finalVer = ([regex]::Match($finalPackageLine, "versionCode='([^']+)'" )).Groups[1].Value
if ($finalPkg -ne $expectedPackage) { throw "Finished APK package changed: $finalPkg" }
if ($finalVer -ne $newVersion) { throw "Finished APK versionCode is $finalVer instead of $newVersion" }
if ((Get-Item -LiteralPath $final).Length -lt 70MB) { throw 'Finished APK is unexpectedly small.' }

Write-Host ''
Write-Host 'BUILD SUCCESSFUL' -ForegroundColor Green
Write-Host 'BASE: EXACT 9117 LABELED-REFRESH APK' -ForegroundColor Green
Write-Host 'ROTATION: NewDashboardActivity = unspecified' -ForegroundColor Green
Write-Host 'LAYOUTS / ARTWORK / REFRESH / ENGINE: UNCHANGED' -ForegroundColor Green
Write-Host ('APK: ' + $final) -ForegroundColor Cyan
Write-Host ('WORKSPACE: ' + $work) -ForegroundColor DarkGray
Write-Host ''
explorer.exe /select,"$final"
