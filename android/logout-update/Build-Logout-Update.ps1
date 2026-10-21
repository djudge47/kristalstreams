param(
  [string]$ApkPath,
  [string]$KeyStorePath = "$env:USERPROFILE\.android\debug.keystore",
  [string]$KeyAlias = 'androiddebugkey'
)
$ErrorActionPreference = 'Stop'
# SUPPORT_FUNCTIONS
if (-not (Get-Command Find-ManifestVersionOffset -ErrorAction SilentlyContinue)) {
  . (Join-Path $PSScriptRoot 'builder_support.ps1')
}
# PATCH_CONFIGURATION
$patch = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'patch.json') -Raw | ConvertFrom-Json

function Get-BytesHash([byte[]]$Data, [string]$Algorithm = 'SHA256') {
  $hash = [Security.Cryptography.HashAlgorithm]::Create($Algorithm)
  try { return ([BitConverter]::ToString($hash.ComputeHash($Data))).Replace('-', '').ToLowerInvariant() }
  finally { $hash.Dispose() }
}

function Convert-HexBytes([string]$Hex) {
  if ($Hex.Length % 2) { throw 'Invalid patch encoding.' }
  [byte[]]$bytes = New-Object byte[] ($Hex.Length / 2)
  for ($i = 0; $i -lt $bytes.Length; $i++) { $bytes[$i] = [Convert]::ToByte($Hex.Substring($i * 2, 2), 16) }
  return ,$bytes
}

function Update-LogoutDex([byte[]]$Data) {
  $sourceDexHash = Get-BytesHash $Data
  $variant = @($patch.sourceDexVariants | Where-Object { $_.sha256 -eq $sourceDexHash })
  if ($variant.Count -ne 1) {
    throw 'This APK has different app code. No output was created. Send the APK filename shown above so its logout code can be reviewed; do not substitute an older app.'
  }
  [int]$offset = $patch.method.offset
  [byte[]]$before = Convert-HexBytes $variant[0].methodHex
  [byte[]]$after = Convert-HexBytes $patch.method.replacementHex
  if ($before.Length -ne $after.Length -or $offset -lt 112 -or $offset + $before.Length -gt $Data.Length) { throw 'Invalid bounded code patch.' }
  for ($i = 0; $i -lt $before.Length; $i++) {
    if ($Data[$offset + $i] -ne $before[$i]) { throw 'Logout method does not match the reviewed code.' }
  }
  [byte[]]$changed = $Data.Clone()
  [Array]::Copy($after, 0, $changed, $offset, $after.Length)
  $sha1 = [Security.Cryptography.SHA1]::Create()
  try { [Array]::Copy($sha1.ComputeHash($changed, 32, $changed.Length - 32), 0, $changed, 12, 20) }
  finally { $sha1.Dispose() }
  if (-not ('KsLogoutChecksum' -as [type])) {
    Add-Type -TypeDefinition @'
public static class KsLogoutChecksum {
  public static uint Adler32(byte[] data, int start) {
    uint a = 1, b = 0;
    for (int i = start; i < data.Length;) {
      int end = System.Math.Min(i + 5552, data.Length);
      for (; i < end; i++) { a += data[i]; b += a; }
      a %= 65521; b %= 65521;
    }
    return (b << 16) | a;
  }
}
'@
  }
  [Array]::Copy([BitConverter]::GetBytes([KsLogoutChecksum]::Adler32($changed, 12)), 0, $changed, 8, 4)
  if ((Get-BytesHash $changed) -ne $patch.patchedDexSha256) { throw 'Patched code verification failed.' }
  return ,$changed
}

function Invoke-KsLogoutBuild {
  $work = $null; $pendingOutput = $null; $success = $false
  $previousStorePass = $env:KS_APK_REPAIR_STORE_PASS
  $previousKeyPass = $env:KS_APK_REPAIR_KEY_PASS
  try {
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    Write-Host 'Kristal Streams - Log Out to Onn Home update' -ForegroundColor Cyan
    if (-not $ApkPath) {
      foreach ($family in @('*2026102001-LOGOUT-*.apk', '*2026101903-WORKING-BASE-*.apk', '*2026101902-APPROVED-ARTWORK-*.apk')) {
        $candidates = @(Get-ChildItem -LiteralPath "$env:USERPROFILE\Downloads" -File -Filter $family -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
        if ($candidates.Count) { $ApkPath = $candidates[0].FullName; break }
      }
    }
    if (-not $ApkPath) {
      Add-Type -AssemblyName System.Windows.Forms
      $dialog = New-Object Windows.Forms.OpenFileDialog
      $dialog.Title = 'Choose your current Kristal Streams APK (LOGOUT, WORKING-BASE or APPROVED-ARTWORK)'
      $dialog.InitialDirectory = "$env:USERPROFILE\Downloads"
      $dialog.Filter = 'Android APK (*.apk)|*.apk'
      if ($dialog.ShowDialog() -ne 'OK') { throw 'No current APK selected.' }
      $ApkPath = $dialog.FileName
    }
    $ApkPath = (Resolve-Path -LiteralPath $ApkPath).Path
    Write-Host ('Using current APK: ' + [IO.Path]::GetFileName($ApkPath))
    $sourceHash = (Get-FileHash -LiteralPath $ApkPath -Algorithm SHA256).Hash.ToLowerInvariant()
    $replacementBytes = @{}
    $replacementHashes = @{}
    $sourceZip = [IO.Compression.ZipFile]::OpenRead($ApkPath)
    try {
      $sourcePayload = @($sourceZip.Entries | Where-Object { $_.FullName -notmatch '^META-INF/(MANIFEST\.MF|[^/]+\.(SF|RSA|DSA|EC))$' })
      if (@($sourcePayload.FullName | Select-Object -Unique).Count -ne $sourcePayload.Count) { throw 'Duplicate APK entries are not supported.' }
      foreach ($name in @('AndroidManifest.xml', 'classes.dex')) {
        $entry = $sourceZip.GetEntry($name)
        if (-not $entry) { throw "Current APK is missing $name." }
        $stream = $entry.Open(); $buffer = New-Object IO.MemoryStream
        try { $stream.CopyTo($buffer); $replacementBytes[$name] = $buffer.ToArray() }
        finally { $stream.Dispose(); $buffer.Dispose() }
      }
      [byte[]]$manifest = $replacementBytes['AndroidManifest.xml']
      $versionOffset = Find-ManifestVersionOffset $manifest
      $sourceVersion = Read-U32 $manifest $versionOffset
      if ($patch.sourceVersions -notcontains $sourceVersion) { throw 'Choose your current 2026102001 LOGOUT, 2026101903 WORKING-BASE or 2026101902 APPROVED-ARTWORK APK. The older launcher-only APK is not accepted.' }
      $replacementBytes['classes.dex'] = Update-LogoutDex $replacementBytes['classes.dex']
      foreach ($layout in $patch.layouts) {
        $entry = $sourceZip.GetEntry($layout.entry)
        if (-not $entry -or @($layout.originalSha256, $layout.replacementSha256) -notcontains (Get-ZipEntryHash $entry)) { throw "Unreviewed account layout: $($layout.entry). No older layout will be substituted." }
        [byte[]]$bytes = [Convert]::FromBase64String($layout.replacementBase64)
        if ((Get-BytesHash $bytes) -ne $layout.replacementSha256) { throw 'Logout layout checksum failed.' }
        $replacementBytes[$layout.entry] = $bytes
      }
      Write-U32 $manifest $versionOffset ([uint32]$patch.targetVersionCode)
      $replacementBytes['AndroidManifest.xml'] = $manifest
      foreach ($name in $replacementBytes.Keys) { $replacementHashes[$name] = Get-BytesHash $replacementBytes[$name] }
      $sourcePayloadCount = $sourcePayload.Count
      $sourceNativeCount = @($sourcePayload | Where-Object { $_.FullName -match '^lib/[^/]+/[^/]+\.so$' }).Count
    } finally { $sourceZip.Dispose() }

    $sdkRoots = @($env:ANDROID_SDK_ROOT, $env:ANDROID_HOME, "$env:LOCALAPPDATA\Android\Sdk") | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
    $buildTools = @($sdkRoots | ForEach-Object { Get-ChildItem -LiteralPath (Join-Path $_ 'build-tools') -Directory -ErrorAction SilentlyContinue }) | Where-Object { (Test-Path -LiteralPath (Join-Path $_.FullName 'apksigner.bat')) -and (Test-Path -LiteralPath (Join-Path $_.FullName 'zipalign.exe')) } | Sort-Object { [version](($_.Name -split '-')[0]) } -Descending | Select-Object -First 1
    if (-not $buildTools) { throw 'The existing Android SDK Build-Tools are required. Run this on the Windows computer that built your current APK.' }
    $studioJava = 'C:\Program Files\Android\Android Studio\jbr'
    if (-not $env:JAVA_HOME -and (Test-Path -LiteralPath "$studioJava\bin\java.exe")) { $env:JAVA_HOME = $studioJava }
    if ($env:JAVA_HOME) { $env:PATH = "$env:JAVA_HOME\bin;$env:PATH" }
    $keytool = (Get-Command keytool.exe -ErrorAction Stop).Source
    $signer = Join-Path $buildTools.FullName 'apksigner.bat'
    $aligner = Join-Path $buildTools.FullName 'zipalign.exe'
    $aapt = Join-Path $buildTools.FullName 'aapt.exe'
    if (-not (Test-Path -LiteralPath $aapt)) { throw 'The existing SDK aapt tool is required.' }
    $badging = Invoke-CheckedTool $aapt @('dump', 'badging', $ApkPath)
    $packageLine = @($badging | Where-Object { [string]$_ -match '^package: name=' } | Select-Object -First 1)
    if ($packageLine.Count -ne 1 -or [string]$packageLine[0] -notmatch "^package: name='com\.gearzoneiptv\.gearzoneiptviptvbox'") { throw 'This is a different app package. Build stopped.' }
    $sourceVerification = Invoke-CheckedTool $signer @('verify', '--verbose', '--print-certs', $ApkPath)
    if (((($sourceVerification -join '') -replace '[^a-zA-Z0-9]', '').ToLowerInvariant()) -notlike "*$($patch.certificateSha256)*") { throw 'The current APK has a different signing certificate.' }
    if (-not (Test-Path -LiteralPath $KeyStorePath)) { throw 'The existing matching signing key was not found. No new key will be created.' }
    $work = Join-Path $env:TEMP ('KS-Logout-' + [guid]::NewGuid().ToString('N'))
    New-Item -Path $work -ItemType Directory | Out-Null
    $certFile = Join-Path $work 'certificate.der'
    $env:KS_APK_REPAIR_STORE_PASS = 'android'; $env:KS_APK_REPAIR_KEY_PASS = 'android'
    try {
      $null = Invoke-CheckedTool $keytool @('-exportcert', '-keystore', $KeyStorePath, '-alias', $KeyAlias, '-storepass:env', 'KS_APK_REPAIR_STORE_PASS', '-file', $certFile)
    } catch {
      $secureStore = Read-Host 'Existing keystore password (entered locally only)' -AsSecureString
      $secureKey = Read-Host 'Existing key password (entered locally only)' -AsSecureString
      $env:KS_APK_REPAIR_STORE_PASS = (New-Object Net.NetworkCredential('', $secureStore)).Password
      $env:KS_APK_REPAIR_KEY_PASS = (New-Object Net.NetworkCredential('', $secureKey)).Password
      $null = Invoke-CheckedTool $keytool @('-exportcert', '-keystore', $KeyStorePath, '-alias', $KeyAlias, '-storepass:env', 'KS_APK_REPAIR_STORE_PASS', '-file', $certFile)
    }
    if ((Get-FileHash -LiteralPath $certFile -Algorithm SHA256).Hash.ToLowerInvariant() -ne $patch.certificateSha256) { throw 'The signing key does not match your current app.' }

    $unsigned = Join-Path $work 'logout-unsigned.apk'
    Copy-Item -LiteralPath $ApkPath -Destination $unsigned
    $zip = [IO.Compression.ZipFile]::Open($unsigned, [IO.Compression.ZipArchiveMode]::Update)
    try {
      foreach ($entry in @($zip.Entries)) { if ($entry.FullName -match '^META-INF/(MANIFEST\.MF|[^/]+\.(SF|RSA|DSA|EC))$') { $entry.Delete() } }
      foreach ($name in $replacementBytes.Keys) {
        $zip.GetEntry($name).Delete()
        $entry = $zip.CreateEntry($name, [IO.Compression.CompressionLevel]::Optimal)
        $stream = $entry.Open(); [byte[]]$bytes = $replacementBytes[$name]
        try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Dispose() }
      }
    } finally { $zip.Dispose() }
    [byte[]]$bytes = [IO.File]::ReadAllBytes($unsigned)
    $null = Test-OrRepairLayout -Data $bytes -Repair -SkipAlignment
    [IO.File]::WriteAllBytes($unsigned, $bytes)
    $null = Test-OrRepairLayout -Data $bytes -SkipAlignment
    $aligned = Join-Path $work 'logout-aligned.apk'
    $null = Invoke-CheckedTool $aligner @('-f', '-p', '4', $unsigned, $aligned)
    $null = Test-OrRepairLayout -Data ([IO.File]::ReadAllBytes($aligned))
    $pendingOutput = Join-Path "$env:USERPROFILE\Downloads" ('KristalStreams-' + $patch.targetVersionCode + '-LOGOUT-ONN-HOME-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0,8) + '.apk')
    $null = Invoke-CheckedTool $signer @('sign', '--ks', $KeyStorePath, '--ks-key-alias', $KeyAlias, '--ks-pass', 'env:KS_APK_REPAIR_STORE_PASS', '--key-pass', 'env:KS_APK_REPAIR_KEY_PASS', '--out', $pendingOutput, $aligned)
    $verified = Invoke-CheckedTool $signer @('verify', '--verbose', '--print-certs', $pendingOutput)
    if (((($verified -join '') -replace '[^a-zA-Z0-9]', '').ToLowerInvariant()) -notlike "*$($patch.certificateSha256)*") { throw 'Final signing certificate mismatch.' }
    $null = Invoke-CheckedTool $aligner @('-c', '-p', '4', $pendingOutput)
    $null = Test-OrRepairLayout -Data ([IO.File]::ReadAllBytes($pendingOutput))
    $original = [IO.Compression.ZipFile]::OpenRead($ApkPath)
    $final = [IO.Compression.ZipFile]::OpenRead($pendingOutput)
    $checked = 0; $changed = 0; $replaced = 0; $native = 0; $artwork = 0
    try {
      $originalPayload = @($original.Entries | Where-Object { $_.FullName -notmatch '^META-INF/(MANIFEST\.MF|[^/]+\.(SF|RSA|DSA|EC))$' })
      $finalPayload = @($final.Entries | Where-Object { $_.FullName -notmatch '^META-INF/(MANIFEST\.MF|[^/]+\.(SF|RSA|DSA|EC))$' })
      if ($originalPayload.Count -ne $finalPayload.Count -or $finalPayload.Count -ne $sourcePayloadCount) { throw 'APK payload count changed.' }
      foreach ($entry in $originalPayload) {
        $other = $final.GetEntry($entry.FullName)
        if (-not $other) { throw "App file lost: $($entry.FullName)" }
        $originalHash = Get-ZipEntryHash $entry
        $expected = if ($replacementHashes.ContainsKey($entry.FullName)) { $replacementHashes[$entry.FullName] } else { $originalHash }
        if ((Get-ZipEntryHash $other) -ne $expected) { throw "App-file preservation failed: $($entry.FullName)" }
        if ($replacementHashes.ContainsKey($entry.FullName)) { $replaced++ }
        if ($expected -ne $originalHash) { $changed++ }
        if ($entry.FullName -match '^lib/[^/]+/[^/]+\.so$') { $native++ }
        if ($entry.FullName -match '^res/.*\.(png|webp|jpg)$') { $artwork++ }
        $checked++
      }
    } finally { $original.Dispose(); $final.Dispose() }
    if ($replaced -ne 10 -or $changed -notin @(2, 10) -or $native -ne $sourceNativeCount) { throw 'Unexpected changed-file/native-library count.' }
    $proofPath = [IO.Path]::ChangeExtension($pendingOutput, '.verification.json')
    @{sourceFilename=[IO.Path]::GetFileName($ApkPath);sourceSha256=$sourceHash;sourceVersionCode=$sourceVersion;outputFilename=[IO.Path]::GetFileName($pendingOutput);outputSha256=(Get-FileHash -LiteralPath $pendingOutput -Algorithm SHA256).Hash.ToLowerInvariant();versionCode=$patch.targetVersionCode;payloadFilesVerified=$checked;changedPayloads=$changed;nativeLibrariesPreserved=$native;artworkFilesPreserved=$artwork;logoutMethod=$patch.method.signature;deviceLogoutTest='Pending'} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $proofPath -Encoding UTF8
    $success = $true
    Write-Host "SUCCESS: $pendingOutput" -ForegroundColor Green
    Write-Host 'Log Out is on the Account screen (single-person icon on Home).'
    Write-Host 'Log Out signs you out, closes Kristal Streams and opens the Onn home screen.'
    Write-Host 'Saved users are kept for your next sign-in.'
    Write-Host 'Install as an update. Keep the current app installed.'
    Start-Process explorer.exe -ArgumentList "/select,`"$pendingOutput`"" -ErrorAction SilentlyContinue
  } catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    return 1
  } finally {
    if (-not $success -and $pendingOutput) {
      Remove-Item -LiteralPath $pendingOutput -ErrorAction SilentlyContinue
      Remove-Item -LiteralPath ($pendingOutput + '.idsig') -ErrorAction SilentlyContinue
      Remove-Item -LiteralPath ([IO.Path]::ChangeExtension($pendingOutput, '.verification.json')) -ErrorAction SilentlyContinue
    }
    if ($null -eq $previousStorePass) { Remove-Item Env:\KS_APK_REPAIR_STORE_PASS -ErrorAction SilentlyContinue } else { $env:KS_APK_REPAIR_STORE_PASS = $previousStorePass }
    if ($null -eq $previousKeyPass) { Remove-Item Env:\KS_APK_REPAIR_KEY_PASS -ErrorAction SilentlyContinue } else { $env:KS_APK_REPAIR_KEY_PASS = $previousKeyPass }
    if ($work -and (Test-Path -LiteralPath $work)) { Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue }
  }
  return 0
}

if ($MyInvocation.InvocationName -ne '.') { exit (Invoke-KsLogoutBuild) }
