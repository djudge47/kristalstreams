$ErrorActionPreference = 'Stop'

$ksExpectedPackage = 'com.kristalstreams.player'
$ksExpectedSourceVersion = '1681003'
$ksTargetVersion = '1682198'
$ksTargetVersionName = '1.6.8-original-kristalstreams-base-1682198'
$ksSourceApk = Join-Path $env:USERPROFILE 'Downloads\kristalstreams.apk'
$ksStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$ksWork = "C:\ks-original-kristalstreams-base-1682198-$ksStamp"
$ksDecoded = Join-Path $ksWork 'decoded'
$ksUnsigned = Join-Path $ksWork 'KristalStreams-ORIGINAL-BASE-1682198-unsigned.apk'
$ksAligned = Join-Path $ksWork 'KristalStreams-ORIGINAL-BASE-1682198-aligned.apk'
$ksDesktop = [Environment]::GetFolderPath('Desktop')
$ksFinal = Join-Path $ksDesktop 'KristalStreams-ORIGINAL-BASE-1682198.apk'

Write-Host ''
Write-Host 'KRISTAL STREAMS - ORIGINAL APK BASE 1682198' -ForegroundColor Cyan
Write-Host 'BASE: original Downloads\kristalstreams.apk' -ForegroundColor Green
Write-Host 'PACKAGE LOCK: com.kristalstreams.player' -ForegroundColor Green
Write-Host 'NO DONOR APP - NO DASHBOARD REDESIGN' -ForegroundColor Green
Write-Host ''

if (!(Test-Path -LiteralPath $ksSourceApk)) { throw "Original APK not found: $ksSourceApk" }

$ksBuildToolsRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk\build-tools'
if (!(Test-Path -LiteralPath $ksBuildToolsRoot)) { throw "Android SDK build-tools not found: $ksBuildToolsRoot" }

$ksToolDir = Get-ChildItem -LiteralPath $ksBuildToolsRoot -Directory -ErrorAction SilentlyContinue |
    Sort-Object { try { [version]$_.Name } catch { [version]'0.0' } } -Descending |
    Where-Object {
        (Test-Path (Join-Path $_.FullName 'aapt.exe')) -and
        (Test-Path (Join-Path $_.FullName 'zipalign.exe')) -and
        (Test-Path (Join-Path $_.FullName 'apksigner.bat'))
    } |
    Select-Object -First 1
if ($null -eq $ksToolDir) { throw 'aapt / zipalign / apksigner not found in Android SDK build-tools' }

$ksAapt = Join-Path $ksToolDir.FullName 'aapt.exe'
$ksZipalign = Join-Path $ksToolDir.FullName 'zipalign.exe'
$ksApksigner = Join-Path $ksToolDir.FullName 'apksigner.bat'

$ksBadging = @(& $ksAapt dump badging $ksSourceApk 2>$null)
$ksPackageLine = ($ksBadging | Select-String '^package:').Line | Select-Object -First 1
if (!$ksPackageLine) { throw 'Could not read package metadata from original kristalstreams.apk' }
$ksSourcePackage = ([regex]::Match($ksPackageLine, "name='([^']+)'" )).Groups[1].Value
$ksSourceVersion = ([regex]::Match($ksPackageLine, "versionCode='([^']+)'" )).Groups[1].Value
$ksSourceVersionName = ([regex]::Match($ksPackageLine, "versionName='([^']*)'" )).Groups[1].Value
if ($ksSourcePackage -ne $ksExpectedPackage) { throw "STOP: wrong APK. Expected $ksExpectedPackage but found $ksSourcePackage" }
if ($ksSourceVersion -ne $ksExpectedSourceVersion) { throw "STOP: this is not the original 1681003 kristalstreams.apk. Found versionCode $ksSourceVersion" }
Write-Host ('SOURCE VERIFIED: ' + $ksSourcePackage + '  versionCode=' + $ksSourceVersion + '  versionName=' + $ksSourceVersionName) -ForegroundColor Green

$ksApktoolCandidates = @(
    'C:\KS-FINAL-BASE-20260903-204457\apktool.jar',
    'C:\KS-76MB-FUNCTIONAL-MASTER\apktool.jar',
    'C:\KS-FINAL-BASE-20260903-204457\apktool_2.12.1.jar'
)
$ksApktool = $ksApktoolCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (!$ksApktool) {
    $ksApktool = Get-ChildItem 'C:\KS-FINAL-BASE-20260903-204457' -File -Filter 'apktool*.jar' -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (!$ksApktool) { throw 'apktool.jar not found in the known Kristal Streams tool workspace' }

New-Item -ItemType Directory -Path $ksWork -Force | Out-Null
Copy-Item -LiteralPath $ksSourceApk -Destination (Join-Path $ksWork 'kristalstreams-ORIGINAL-1681003.apk') -Force

Write-Host '[1/4] Decoding the ORIGINAL kristalstreams.apk...' -ForegroundColor Cyan
& java -jar $ksApktool d -f $ksSourceApk -o $ksDecoded
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath (Join-Path $ksDecoded 'AndroidManifest.xml'))) { throw 'Original kristalstreams.apk decode failed' }

$ksYamlPath = Join-Path $ksDecoded 'apktool.yml'
$ksManifestPath = Join-Path $ksDecoded 'AndroidManifest.xml'
if (!(Test-Path -LiteralPath $ksYamlPath)) { throw 'apktool.yml missing after decode' }

# IMPORTANT: use MatchEvaluator-style replacements. `$1` followed by 1682198 was
# being interpreted by .NET as one giant capture-group number, which erased the value.
$ksYamlText = Get-Content -LiteralPath $ksYamlPath -Raw
if ($ksYamlText -notmatch '(?m)^\s*versionCode:\s*') { throw 'versionCode was not found in apktool.yml' }
$ksYamlText = [regex]::Replace($ksYamlText, '(?m)^(\s*versionCode:\s*).+$', { param($m) $m.Groups[1].Value + "'$ksTargetVersion'" }, 1)
if ($ksYamlText -match '(?m)^\s*versionName:\s*') {
    $ksYamlText = [regex]::Replace($ksYamlText, '(?m)^(\s*versionName:\s*).+$', { param($m) $m.Groups[1].Value + "'$ksTargetVersionName'" }, 1)
}
Set-Content -LiteralPath $ksYamlPath -Value $ksYamlText -Encoding UTF8

# Also set the decoded manifest identity explicitly so apktool cannot fall back to a blank value.
$ksManifestText = Get-Content -LiteralPath $ksManifestPath -Raw
if ($ksManifestText -notmatch 'package="com\.kristalstreams\.player"') { throw 'STOP: decoded package identity is not com.kristalstreams.player' }
if ($ksManifestText -match 'android:versionCode="[^"]*"') {
    $ksManifestText = [regex]::Replace($ksManifestText, 'android:versionCode="[^"]*"', ('android:versionCode="' + $ksTargetVersion + '"'), 1)
} else {
    $ksManifestText = [regex]::Replace($ksManifestText, '<manifest\b', ('<manifest android:versionCode="' + $ksTargetVersion + '"'), 1)
}
if ($ksManifestText -match 'android:versionName="[^"]*"') {
    $ksManifestText = [regex]::Replace($ksManifestText, 'android:versionName="[^"]*"', ('android:versionName="' + $ksTargetVersionName + '"'), 1)
} else {
    $ksManifestText = [regex]::Replace($ksManifestText, '<manifest\b', ('<manifest android:versionName="' + $ksTargetVersionName + '"'), 1)
}
Set-Content -LiteralPath $ksManifestPath -Value $ksManifestText -Encoding UTF8

# Guard the source before build.
$ksYamlCheck = Get-Content -LiteralPath $ksYamlPath -Raw
$ksManifestCheck = Get-Content -LiteralPath $ksManifestPath -Raw
if ($ksYamlCheck -notmatch ('(?m)^\s*versionCode:\s*[\'\"]?' + [regex]::Escape($ksTargetVersion) + '[\'\"]?\s*$')) { throw 'STOP: apktool.yml versionCode patch failed' }
if ($ksManifestCheck -notmatch ('android:versionCode="' + [regex]::Escape($ksTargetVersion) + '"')) { throw 'STOP: AndroidManifest versionCode patch failed' }
if ($ksManifestCheck -notmatch 'package="com\.kristalstreams\.player"') { throw 'STOP: package identity changed before build' }

# Do not change activity routing, screenOrientation, EPG, playback, login/provider code,
# dashboard geometry, or resource qualifiers in this reset build.
Write-Host '[2/4] Building the original Kristal Streams engine...' -ForegroundColor Cyan
& java -jar $ksApktool b -f $ksDecoded -o $ksUnsigned
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $ksUnsigned)) { throw 'APK build failed' }

Write-Host '[3/4] Aligning and signing...' -ForegroundColor Cyan
& $ksZipalign -f -p 4 $ksUnsigned $ksAligned
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $ksAligned)) { throw 'zipalign failed' }

$ksKeystore = Join-Path $env:USERPROFILE '.android\debug.keystore'
if (!(Test-Path -LiteralPath $ksKeystore)) { throw "Debug keystore not found: $ksKeystore" }
Remove-Item -LiteralPath $ksFinal -Force -ErrorAction SilentlyContinue
& $ksApksigner sign --ks $ksKeystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out $ksFinal $ksAligned
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $ksFinal)) { throw 'APK signing failed' }
& $ksApksigner verify --verbose --print-certs $ksFinal | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed' }

Write-Host '[4/4] Verifying finished APK...' -ForegroundColor Cyan
$ksFinalBadging = @(& $ksAapt dump badging $ksFinal 2>$null)
$ksFinalPackageLine = ($ksFinalBadging | Select-String '^package:').Line | Select-Object -First 1
if (!$ksFinalPackageLine) { throw 'Could not verify finished APK metadata' }
$ksFinalPackage = ([regex]::Match($ksFinalPackageLine, "name='([^']+)'" )).Groups[1].Value
$ksFinalVersion = ([regex]::Match($ksFinalPackageLine, "versionCode='([^']*)'" )).Groups[1].Value
$ksFinalVersionName = ([regex]::Match($ksFinalPackageLine, "versionName='([^']*)'" )).Groups[1].Value
if ($ksFinalPackage -ne $ksExpectedPackage) { throw "Finished APK package changed unexpectedly: $ksFinalPackage" }
if ($ksFinalVersion -ne $ksTargetVersion) { throw "Finished APK versionCode is '$ksFinalVersion' instead of '$ksTargetVersion'" }
if ((Get-Item -LiteralPath $ksFinal).Length -lt 8MB) { throw 'Finished APK is unexpectedly small - STOP' }

Write-Host ''
Write-Host 'BUILD SUCCESSFUL' -ForegroundColor Green
Write-Host 'CORRECT BASE: original kristalstreams.apk' -ForegroundColor Green
Write-Host ('PACKAGE: ' + $ksFinalPackage) -ForegroundColor Green
Write-Host ('VERSION CODE: ' + $ksFinalVersion) -ForegroundColor Green
Write-Host ('VERSION NAME: ' + $ksFinalVersionName) -ForegroundColor Green
Write-Host 'ORIGINAL ENGINE / ROUTING / EPG / PLAYBACK: PRESERVED' -ForegroundColor Green
Write-Host '1682193 / 1682197 DONOR APP: NOT USED' -ForegroundColor Green
Write-Host ('APK: ' + $ksFinal) -ForegroundColor Cyan
Write-Host ('WORKSPACE: ' + $ksWork) -ForegroundColor DarkGray
Write-Host ''
explorer.exe /select,"$ksFinal"
