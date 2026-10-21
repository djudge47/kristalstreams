param([string]$SourceApk, [string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$builder = Join-Path $root 'Build-Logout-Update.ps1'
foreach ($file in @($builder, (Join-Path $root 'builder_support.ps1'))) {
  $tokens = $null; $errors = $null
  $null = [Management.Automation.Language.Parser]::ParseFile($file, [ref]$tokens, [ref]$errors)
  if ($errors.Count) { throw ($errors -join "`n") }
}
. $builder
Add-Type -AssemblyName System.IO.Compression.FileSystem
New-Item -Path $OutputDirectory -ItemType Directory -Force | Out-Null
$zip = [IO.Compression.ZipFile]::OpenRead($SourceApk)
try {
  $entry = $zip.GetEntry('classes.dex'); $stream = $entry.Open(); $memory = New-Object IO.MemoryStream
  try { $stream.CopyTo($memory); [byte[]]$original = $memory.ToArray() }
  finally { $stream.Dispose(); $memory.Dispose() }
  [byte[]]$changed = Update-LogoutDex $original
  if ((Get-BytesHash $changed) -ne $patch.patchedDexSha256) { throw 'PowerShell/Python DEX mismatch.' }
  [IO.File]::WriteAllBytes((Join-Path $OutputDirectory 'classes.dex'), $changed)
  $original[100] = $original[100] -bxor 1
  $rejected = $false
  try { $null = Update-LogoutDex $original } catch { $rejected = $true }
  if (-not $rejected) { throw 'Unknown DEX accepted.' }
  $entry = $zip.GetEntry('AndroidManifest.xml'); $stream = $entry.Open(); $memory = New-Object IO.MemoryStream
  try { $stream.CopyTo($memory); [byte[]]$manifest = $memory.ToArray() }
  finally { $stream.Dispose(); $memory.Dispose() }
  $offset = Find-ManifestVersionOffset $manifest
  if ((Read-U32 $manifest $offset) -ne 9506) { throw 'Test fixture version differs.' }
  $before = $manifest.Clone()
  Write-U32 $manifest $offset ([uint32]$patch.targetVersionCode)
  if ((Read-U32 $manifest (Find-ManifestVersionOffset $manifest)) -ne $patch.targetVersionCode) { throw 'Manifest version was not patched.' }
  for ($i=0; $i -lt $manifest.Length; $i++) {
    if (($i -lt $offset -or $i -ge $offset+4) -and $before[$i] -ne $manifest[$i]) { throw 'Unrelated manifest change.' }
  }
} finally { $zip.Dispose() }

# Exercise the actual .NET APK update path and descriptor normalization.
$unsigned = Join-Path $OutputDirectory 'test-only-unsigned.apk'
Copy-Item -LiteralPath $SourceApk -Destination $unsigned -Force
$zip = [IO.Compression.ZipFile]::Open($unsigned, [IO.Compression.ZipArchiveMode]::Update)
try {
  $replacements = @{'classes.dex'=$changed; 'AndroidManifest.xml'=$manifest}
  foreach ($layout in $patch.layouts) { $replacements[$layout.entry] = [Convert]::FromBase64String($layout.replacementBase64) }
  foreach ($name in $replacements.Keys) {
    $zip.GetEntry($name).Delete()
    $entry = $zip.CreateEntry($name, [IO.Compression.CompressionLevel]::Optimal)
    $stream = $entry.Open()
    try { $stream.Write($replacements[$name], 0, $replacements[$name].Length) } finally { $stream.Dispose() }
  }
} finally { $zip.Dispose() }
[byte[]]$bytes = [IO.File]::ReadAllBytes($unsigned)
$null = Test-OrRepairLayout -Data $bytes -Repair -SkipAlignment
[IO.File]::WriteAllBytes($unsigned, $bytes)
$null = Test-OrRepairLayout -Data $bytes -SkipAlignment
$originalZip = [IO.Compression.ZipFile]::OpenRead($SourceApk)
$finalZip = [IO.Compression.ZipFile]::OpenRead($unsigned)
$count=0
try {
  if ($originalZip.Entries.Count -ne $finalZip.Entries.Count) { throw 'Entry count changed.' }
  foreach ($entry in $originalZip.Entries) {
    $expected = if ($replacements.ContainsKey($entry.FullName)) { Get-BytesHash $replacements[$entry.FullName] } else { Get-ZipEntryHash $entry }
    if ((Get-ZipEntryHash $finalZip.GetEntry($entry.FullName)) -ne $expected) { throw "Payload mismatch: $($entry.FullName)" }
    $count++
  }
} finally { $originalZip.Dispose(); $finalZip.Dispose() }
Write-Host "PASS: PowerShell syntax, bounded DEX, input rejection, manifest integer, ZIP update and $count payload hashes."
