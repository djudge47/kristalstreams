$ErrorActionPreference = 'Stop'

$expectedPackage = 'com.gearzoneiptv.gearzoneiptviptvbox'
$expectedSourceVersion = '9111'
$newVersion = 9201
$outputName = 'KristalStreams-Rotation-Check-A.apk'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$work = "C:\ks-rotation-check-a-9201-$stamp"
$decoded = Join-Path $work 'decoded'
$unsigned = Join-Path $work 'unsigned.apk'
$aligned = Join-Path $work 'aligned.apk'
$desktop = [Environment]::GetFolderPath('Desktop')
$final = Join-Path $desktop $outputName

Write-Host ''
Write-Host 'KRISTAL STREAMS - ROTATION CHECK A' -ForegroundColor Cyan
Write-Host 'SOURCE: POST-CATEGORY-TOP 9111' -ForegroundColor Green
Write-Host 'NO ROTATION OR LAYOUT CHANGES WILL BE MADE' -ForegroundColor Green
Write-Host 'ONLY INTERNAL VERSIONCODE WILL CHANGE: 9111 -> 9201' -ForegroundColor Green
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

function Get-ApkCert([string]$apkPath) {
    $tag = [Guid]::NewGuid().ToString('N')
    $out = Join-Path $env:TEMP ("ks-cert-$tag.txt")
    $err = Join-Path $env:TEMP ("ks-cert-$tag.err.txt")
    try {
        $cmd = '"' + $apksigner + '" verify --print-certs "' + $apkPath + '" 1>"' + $out + '" 2>"' + $err + '"'
        & $env:ComSpec /d /c $cmd | Out-Null
        if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $out)) { return $null }
        $m = Get-Content -LiteralPath $out | Select-String 'certificate SHA-256 digest:' | Select-Object -First 1
        if (!$m) { return $null }
        return (($m.Line -split ':\s*',2)[1].Trim().ToLowerInvariant())
    }
    finally {
        Remove-Item -LiteralPath $out,$err -Force -ErrorAction SilentlyContinue
    }
}

$roots = @(
    (Join-Path $env:USERPROFILE 'Desktop'),
    (Join-Path $env:USERPROFILE 'Downloads'),
    (Join-Path $env:USERPROFILE 'Documents'),
    (Join-Path $env:USERPROFILE 'OneDrive\Desktop'),
    'C:\KS-76MB-FUNCTIONAL-MASTER'
) | Where-Object { Test-Path -LiteralPath $_ }

$targetName = 'KristalStreams-KS-POST-CATEGORY-TOP-9111-TEST.apk'
$candidates = foreach ($root in $roots) {
    Get-ChildItem -LiteralPath $root -File -Filter $targetName -ErrorAction SilentlyContinue
}

$source = $null
foreach ($apk in ($candidates | Sort-Object LastWriteTime -Descending)) {
    $badging = @(& $aapt dump badging $apk.FullName 2>$null)
    $line = ($badging | Select-String '^package:').Line | Select-Object -First 1
    if (!$line) { continue }
    $pkg = ([regex]::Match($line, "name='([^']+)'" )).Groups[1].Value
    $ver = ([regex]::Match($line, "versionCode='([^']+)'" )).Groups[1].Value
    if ($pkg -eq $expectedPackage -and $ver -eq $expectedSourceVersion) {
        $source = $apk
        break
    }
}
if (!$source) { throw "Exact 9111 test APK not found: $targetName" }

$sourceCert = Get-ApkCert $source.FullName
if (!$sourceCert) { throw 'Could not verify the 9111 APK signing certificate.' }
Write-Host ('FOUND 9111: ' + $source.FullName) -ForegroundColor Yellow

$apktool = 'C:\KS-FINAL-BASE-20260903-204457\apktool.jar'
if (!(Test-Path -LiteralPath $apktool)) { throw "Known Apktool not found: $apktool" }

New-Item -ItemType Directory -Path $work -Force | Out-Null
Write-Host '[1/4] Opening 9111...' -ForegroundColor Cyan
& $java -jar $apktool d -f $source.FullName -o $decoded
if ($LASTEXITCODE -ne 0) { throw 'APK decode failed.' }

$yamlPath = Join-Path $decoded 'apktool.yml'
if (!(Test-Path -LiteralPath $yamlPath)) { throw 'apktool.yml was not created.' }
$lines = Get-Content -LiteralPath $yamlPath
$changed = $false
for ($i=0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*versionCode:\s*') {
        $indent = ([regex]::Match($lines[$i], '^\s*')).Value
        $lines[$i] = $indent + 'versionCode: ' + $newVersion
        $changed = $true
        break
    }
}
if (!$changed) { throw 'versionCode was not found.' }
[IO.File]::WriteAllLines($yamlPath, $lines, (New-Object Text.UTF8Encoding($false)))
if (-not (Select-String -LiteralPath $yamlPath -Pattern ('^\s*versionCode:\s*' + $newVersion + '\s*$') -Quiet)) { throw 'versionCode verification failed.' }

Write-Host '[2/4] Rebuilding 9111 unchanged except versionCode...' -ForegroundColor Cyan
$log = Join-Path $work 'apktool-build.log'
$cmd = '"' + $java + '" -jar "' + $apktool + '" b -f "' + $decoded + '" -o "' + $unsigned + '" > "' + $log + '" 2>&1'
& $env:ComSpec /d /c $cmd | Out-Null
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $unsigned)) {
    if (Test-Path -LiteralPath $log) { Get-Content -LiteralPath $log -Tail 30 }
    throw 'APK rebuild failed.'
}

Write-Host '[3/4] Aligning and signing...' -ForegroundColor Cyan
& $zipalign -f -p 4 $unsigned $aligned
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $aligned)) { throw 'zipalign failed.' }

$keystore = Join-Path $env:USERPROFILE '.android\debug.keystore'
if (!(Test-Path -LiteralPath $keystore)) { throw "Signing key not found: $keystore" }
Remove-Item -LiteralPath $final -Force -ErrorAction SilentlyContinue
& $apksigner sign --ks $keystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --v4-signing-enabled false --out $final $aligned
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $final)) { throw 'APK signing failed.' }

$finalCert = Get-ApkCert $final
if (!$finalCert -or $finalCert -ne $sourceCert) {
    Remove-Item -LiteralPath $final -Force -ErrorAction SilentlyContinue
    throw 'Signing key does not match the 9111 APK.'
}

Write-Host '[4/4] Verifying test APK...' -ForegroundColor Cyan
$badging = @(& $aapt dump badging $final 2>$null)
$line = ($badging | Select-String '^package:').Line | Select-Object -First 1
if (!$line) { throw 'Finished APK could not be verified.' }
$pkg = ([regex]::Match($line, "name='([^']+)'" )).Groups[1].Value
$ver = ([regex]::Match($line, "versionCode='([^']+)'" )).Groups[1].Value
if ($pkg -ne $expectedPackage) { throw "Package changed unexpectedly: $pkg" }
if ($ver -ne [string]$newVersion) { throw "VersionCode is $ver instead of $newVersion" }

Write-Host ''
Write-Host 'ROTATION CHECK A READY' -ForegroundColor Green
Write-Host 'SOURCE CONTENTS: 9111 POST-CATEGORY-TOP' -ForegroundColor Green
Write-Host 'ROTATION/LAYOUT: UNCHANGED FROM 9111' -ForegroundColor Green
Write-Host 'INTERNAL VERSIONCODE: 9201' -ForegroundColor Green
Write-Host ('APK: ' + $final) -ForegroundColor Cyan
Write-Host ''
explorer.exe /select,"$final"
