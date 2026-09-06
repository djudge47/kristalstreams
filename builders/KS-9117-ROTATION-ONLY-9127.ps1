$ErrorActionPreference = 'Stop'

$expectedPackage = 'com.gearzoneiptv.gearzoneiptviptvbox'
$expectedVersion = '9117'
$newVersion = '9127'
$targetApkName = 'KristalStreams-KS-LABELED-REFRESH-9117-TEST.apk'
$dashboardClass = 'com.gearzoneiptv.gearzoneiptviptvbox.view.activity.NewDashboardActivity'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$work = "C:\ks-9117-rotation-only-9127-$stamp"
$decoded = Join-Path $work 'decoded'
$unsigned = Join-Path $work 'KristalStreams-KS-ROTATION-ONLY-9127-unsigned.apk'
$aligned = Join-Path $work 'KristalStreams-KS-ROTATION-ONLY-9127-aligned.apk'
$desktop = [Environment]::GetFolderPath('Desktop')
$final = Join-Path $desktop 'KristalStreams-KS-ROTATION-ONLY-9127.apk'
$buildLog = Join-Path $work 'apktool-build.log'

Write-Host ''
Write-Host 'KRISTAL STREAMS 9117 - ROTATION ONLY' -ForegroundColor Cyan
Write-Host 'BASE: signed 9117 labeled-refresh TEST APK' -ForegroundColor Green
Write-Host 'CHANGE: NewDashboardActivity orientation only' -ForegroundColor Green
Write-Host 'NO LAYOUT / ARTWORK / REFRESH / ENGINE CHANGES' -ForegroundColor Green
Write-Host ''

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
$java = (Get-Command java.exe -ErrorAction Stop).Source

function Get-ApkSignerCertificate([string]$apkPath) {
    $tag = [Guid]::NewGuid().ToString('N')
    $outFile = Join-Path $env:TEMP ("ks-apksigner-$tag.out.txt")
    $errFile = Join-Path $env:TEMP ("ks-apksigner-$tag.err.txt")
    try {
        $cmd = '"' + $apksigner + '" verify --print-certs "' + $apkPath + '" 1>"' + $outFile + '" 2>"' + $errFile + '"'
        & $env:ComSpec /d /c $cmd | Out-Null
        if ($LASTEXITCODE -ne 0) { return $null }
        if (!(Test-Path -LiteralPath $outFile)) { return $null }
        $line = Get-Content -LiteralPath $outFile -ErrorAction SilentlyContinue | Select-String 'certificate SHA-256 digest:' | Select-Object -First 1
        if (!$line) { return $null }
        return (($line.Line -split ':\s*',2)[1].Trim().ToLowerInvariant())
    }
    finally {
        Remove-Item -LiteralPath $outFile,$errFile -Force -ErrorAction SilentlyContinue
    }
}

# Find only the signed TEST build. Ignore unsigned/aligned intermediates completely.
$searchRoots = New-Object System.Collections.Generic.List[string]
foreach ($p in @(
    (Join-Path $env:USERPROFILE 'Desktop'),
    (Join-Path $env:USERPROFILE 'Downloads'),
    (Join-Path $env:USERPROFILE 'Documents'),
    (Join-Path $env:USERPROFILE 'OneDrive\Desktop'),
    'C:\KS-76MB-FUNCTIONAL-MASTER'
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
Get-ChildItem -LiteralPath 'C:\' -File -Filter '*9117*.apk' -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notmatch '(?i)(UNSIGNED|ALIGNED)' } |
    ForEach-Object { [void]$candidates.Add($_) }

$valid = New-Object System.Collections.Generic.List[object]
foreach ($apk in ($candidates | Sort-Object FullName -Unique)) {
    $badging = @(& $aapt dump badging $apk.FullName 2>$null)
    $packageLine = ($badging | Select-String '^package:').Line | Select-Object -First 1
    if (!$packageLine) { continue }
    $pkg = ([regex]::Match($packageLine, "name='([^']+)'" )).Groups[1].Value
    $ver = ([regex]::Match($packageLine, "versionCode='([^']+)'" )).Groups[1].Value
    if ($pkg -ne $expectedPackage -or $ver -ne $expectedVersion) { continue }
    $cert = Get-ApkSignerCertificate $apk.FullName
    if (!$cert) { continue }
    $priority = 3
    if ($apk.Name -eq $targetApkName) { $priority = 0 }
    elseif ($apk.Name -match '(?i)LABELED-REFRESH-9117.*TEST') { $priority = 1 }
    elseif ($apk.Name -match '(?i)9117.*TEST') { $priority = 2 }
    [void]$valid.Add([pscustomobject]@{ File = $apk; Priority = $priority; Cert = $cert })
}

$selected = $valid | Sort-Object Priority, @{Expression={$_.File.LastWriteTime};Descending=$true} | Select-Object -First 1
if (!$selected) { throw 'Signed 9117 TEST APK was not found in the known Kristal Streams locations. Nothing was changed.' }
$source = $selected.File
$sourceDigest = $selected.Cert
Write-Host ('FOUND 9117: ' + $source.FullName) -ForegroundColor Yellow

# Use the exact apktool jar that successfully rebuilt the 76MB Kristal Streams source earlier.
$provenApktool = 'C:\KS-FINAL-BASE-20260903-204457\apktool.jar'
if (!(Test-Path -LiteralPath $provenApktool)) {
    New-Item -ItemType Directory -Path $work -Force | Out-Null
    $release = Invoke-RestMethod 'https://api.github.com/repos/iBotPeaches/Apktool/releases/latest'
    $asset = $release.assets | Where-Object { $_.name -match '^apktool_.*\.jar$' } | Select-Object -First 1
    if (!$asset) { throw 'Apktool release jar was not found.' }
    $provenApktool = Join-Path $work 'apktool.jar'
    Invoke-WebRequest $asset.browser_download_url -OutFile $provenApktool
}
$apktool = $provenApktool

New-Item -ItemType Directory -Path $work -Force | Out-Null
Copy-Item -LiteralPath $source.FullName -Destination (Join-Path $work 'KristalStreams-9117-BASE.apk') -Force

Write-Host '[1/4] Decoding exact signed 9117 TEST APK...' -ForegroundColor Cyan
& $java -jar $apktool d -f $source.FullName -o $decoded
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
if ($activityTag -notmatch 'android:screenOrientation="sensorLandscape"') { throw 'STOP: 9117 dashboard is not locked to sensorLandscape as expected.' }
$newActivityTag = $activityTag -replace 'android:screenOrientation="sensorLandscape"', 'android:screenOrientation="unspecified"'
$manifestText = $manifestText.Substring(0, $activityMatch.Index) + $newActivityTag + $manifestText.Substring($activityMatch.Index + $activityMatch.Length)
[IO.File]::WriteAllText($manifestPath, $manifestText, (New-Object Text.UTF8Encoding($false)))

# VersionCode bump only so it can install over prior builds. VersionName and app content remain unchanged.
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
[IO.File]::WriteAllLines($yamlPath, $yamlLines, (New-Object Text.UTF8Encoding($false)))

$verifyManifest = [IO.File]::ReadAllText($manifestPath)
$verifyMatch = [regex]::Match($verifyManifest, $activityPattern)
if (!$verifyMatch.Success -or $verifyMatch.Value -notmatch 'android:screenOrientation="unspecified"') { throw 'Rotation-only manifest patch did not stick.' }

Write-Host '[2/4] Rebuilding with the proven Kristal Streams apktool...' -ForegroundColor Cyan
Remove-Item -LiteralPath $unsigned -Force -ErrorAction SilentlyContinue
$cmd = '"' + $java + '" -jar "' + $apktool + '" b -f "' + $decoded + '" -o "' + $unsigned + '" > "' + $buildLog + '" 2>&1'
& $env:ComSpec /d /c $cmd | Out-Null
$buildExit = $LASTEXITCODE
if ($buildExit -ne 0 -or !(Test-Path -LiteralPath $unsigned)) {
    Write-Host ''
    Write-Host 'APKTOOL BUILD ERROR:' -ForegroundColor Red
    if (Test-Path -LiteralPath $buildLog) { Get-Content -LiteralPath $buildLog -Tail 25 | ForEach-Object { Write-Host $_ } }
    throw 'APK rebuild failed with the proven Kristal Streams toolchain.'
}

Write-Host '[3/4] Aligning and signing...' -ForegroundColor Cyan
& $zipalign -f -p 4 $unsigned $aligned
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $aligned)) { throw 'zipalign failed.' }

$keystore = Join-Path $env:USERPROFILE '.android\debug.keystore'
if (!(Test-Path -LiteralPath $keystore)) { throw "Debug keystore not found: $keystore" }
Remove-Item -LiteralPath $final -Force -ErrorAction SilentlyContinue
& $apksigner sign --ks $keystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --v4-signing-enabled false --out $final $aligned
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $final)) { throw 'APK signing failed.' }

$finalDigest = Get-ApkSignerCertificate $final
if (!$finalDigest) { throw 'Could not verify finished signing certificate.' }
if ($sourceDigest -ne $finalDigest) {
    Remove-Item -LiteralPath $final -Force -ErrorAction SilentlyContinue
    throw 'STOP: local signing key does not match the signed 9117 base. No APK was released.'
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
Write-Host 'BASE: SIGNED 9117 LABELED-REFRESH TEST APK' -ForegroundColor Green
Write-Host 'ROTATION: NewDashboardActivity = unspecified' -ForegroundColor Green
Write-Host 'EVERYTHING ELSE: UNCHANGED' -ForegroundColor Green
Write-Host ('APK: ' + $final) -ForegroundColor Cyan
Write-Host ('WORKSPACE: ' + $work) -ForegroundColor DarkGray
Write-Host ''
explorer.exe /select,"$final"
