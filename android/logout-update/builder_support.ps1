function Invoke-CheckedTool {
  param([string]$Exe, [string[]]$ArgumentList)
  $savedPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $toolLines = @(& $Exe @ArgumentList 2>&1)
    $toolExit = $LASTEXITCODE
  } finally { $ErrorActionPreference = $savedPreference }
  if ($toolExit -ne 0) { throw (([IO.Path]::GetFileName($Exe)) + ' failed: ' + ($toolLines -join [Environment]::NewLine)) }
  return $toolLines
}

function Read-U16([byte[]]$Data, [int]$Offset) {
  if ($Offset -lt 0 -or $Offset + 2 -gt $Data.Length) { throw 'Truncated ZIP header.' }
  return [BitConverter]::ToUInt16($Data, $Offset)
}
function Read-U32([byte[]]$Data, [int]$Offset) {
  if ($Offset -lt 0 -or [long]$Offset + 4 -gt $Data.Length) { throw 'Truncated ZIP header.' }
  return [BitConverter]::ToUInt32($Data, $Offset)
}
function Write-U16([byte[]]$Data, [int]$Offset, [int]$Value) {
  $Data[$Offset] = [byte]($Value -band 255)
  $Data[$Offset + 1] = [byte](($Value -shr 8) -band 255)
}

# Read ZIP headers directly and normalize descriptor flags after ZIP updates.
# Some .NET update paths drop the descriptors but leave their flags set.
function Test-OrRepairLayout {
  param([byte[]]$Data, [switch]$Repair, [switch]$SkipAlignment)
  $eocd = -1
  for ($i = $Data.Length - 22; $i -ge [Math]::Max(0, $Data.Length - 65557); $i--) {
    if ((Read-U32 $Data $i) -eq 0x06054b50 -and ($i + 22 + (Read-U16 $Data ($i + 20))) -eq $Data.Length) { $eocd = $i; break }
  }
  if ($eocd -lt 0) { throw 'ZIP end record was not found.' }
  if ((Read-U16 $Data ($eocd + 4)) -ne 0 -or (Read-U16 $Data ($eocd + 6)) -ne 0) { throw 'Multi-disk ZIP is not supported.' }
  $count = Read-U16 $Data ($eocd + 10)
  if ((Read-U16 $Data ($eocd + 8)) -ne $count -or $count -eq 65535) { throw 'Unexpected ZIP entry count.' }
  $cdSize = Read-U32 $Data ($eocd + 12)
  $cdOffset = Read-U32 $Data ($eocd + 16)
  if ([long]$cdOffset + $cdSize -ne $eocd) { throw 'Invalid ZIP directory bounds.' }
  $pos = [int]$cdOffset
  $fixed = 0; $nativeCount = 0; $names = @{}
  for ($entryIndex = 0; $entryIndex -lt $count; $entryIndex++) {
    if ((Read-U32 $Data $pos) -ne 0x02014b50) { throw 'Invalid ZIP directory entry.' }
    $flags = Read-U16 $Data ($pos + 8)
    $method = Read-U16 $Data ($pos + 10)
    $crc = Read-U32 $Data ($pos + 16)
    $compressed = Read-U32 $Data ($pos + 20)
    $expanded = Read-U32 $Data ($pos + 24)
    $nameLen = Read-U16 $Data ($pos + 28)
    $extraLen = Read-U16 $Data ($pos + 30)
    $commentLen = Read-U16 $Data ($pos + 32)
    $local = [int](Read-U32 $Data ($pos + 42))
    if ($nameLen -lt 1 -or [long]$pos + 46 + $nameLen + $extraLen + $commentLen -gt $eocd) { throw 'Invalid ZIP filename bounds.' }
    $name = [Text.Encoding]::UTF8.GetString($Data, $pos + 46, $nameLen)
    if ($names.ContainsKey($name)) { throw "Duplicate ZIP filename: $name" }
    $names[$name] = $true
    if ((Read-U32 $Data $local) -ne 0x04034b50) { throw "Invalid local header: $name" }
    $localFlags = Read-U16 $Data ($local + 6)
    $localNameLen = Read-U16 $Data ($local + 26)
    $localExtraLen = Read-U16 $Data ($local + 28)
    if ($flags -ne $localFlags -or $method -ne (Read-U16 $Data ($local + 8))) { throw "Conflicting ZIP headers: $name" }
    if ($nameLen -ne $localNameLen -or $name -cne [Text.Encoding]::UTF8.GetString($Data, $local + 30, $localNameLen)) { throw "Conflicting ZIP names: $name" }
    $payload = $local + 30 + $localNameLen + $localExtraLen
    $end = [long]$payload + $compressed
    if ($end -gt $cdOffset -or $end -lt $payload) { throw "Invalid ZIP payload bounds: $name" }
    $headersMatch = ((Read-U32 $Data ($local + 14)) -eq $crc -and (Read-U32 $Data ($local + 18)) -eq $compressed -and (Read-U32 $Data ($local + 22)) -eq $expanded)
    if (($flags -band 8) -ne 0) {
      $descriptor = [int]$end
      if ((Read-U32 $Data $descriptor) -eq 0x08074b50) { $descriptor += 4 }
      $descriptorValid = ((Read-U32 $Data $descriptor) -eq $crc -and (Read-U32 $Data ($descriptor + 4)) -eq $compressed -and (Read-U32 $Data ($descriptor + 8)) -eq $expanded)
      if (-not $descriptorValid) {
        if (-not $Repair) { throw "Missing or invalid ZIP data descriptor: $name" }
        if (-not $headersMatch) { throw "Cannot safely repair ZIP entry: $name" }
        Write-U16 $Data ($pos + 8) ($flags -band 65527)
        Write-U16 $Data ($local + 6) ($localFlags -band 65527)
        $fixed++
      }
    } elseif (-not $headersMatch) { throw "Conflicting ZIP sizes/checksum: $name" }
    if (-not $SkipAlignment -and $method -eq 0 -and $payload % 4 -ne 0) { throw "Unaligned stored resource: $name" }
    if ($name -match '^lib/[^/]+/[^/]+\.so$') { $nativeCount++ }
    $pos += 46 + $nameLen + $extraLen + $commentLen
  }
  if ($pos -ne $eocd) { throw 'ZIP directory length mismatch.' }
  return @{ Entries = $count; NativeLibraries = $nativeCount; Fixed = $fixed }
}

function Get-ZipEntryHash($Entry) {
  $stream = $Entry.Open(); $sha = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash($stream))).Replace('-', '').ToLowerInvariant() }
  finally { $stream.Dispose(); $sha.Dispose() }
}

function Write-U32([byte[]]$Data, [int]$Offset, [uint32]$Value) {
  [Array]::Copy([BitConverter]::GetBytes($Value), 0, $Data, $Offset, 4)
}

function Find-ManifestVersionOffset([byte[]]$Data) {
  if ((Read-U16 $Data 0) -ne 3 -or (Read-U32 $Data 4) -ne $Data.Length) { throw 'Unexpected Android manifest format.' }
  $pos = [int](Read-U16 $Data 2)
  $resourceIds = @()
  $result = -1
  while ($pos -lt $Data.Length) {
    $kind = Read-U16 $Data $pos
    $header = Read-U16 $Data ($pos + 2)
    $size = Read-U32 $Data ($pos + 4)
    if ($size -lt $header -or $header -lt 8 -or [long]$pos + $size -gt $Data.Length) { throw 'Invalid Android manifest chunk.' }
    if ($kind -eq 384) {
      $resourceIds = @()
      for ($j = $pos + $header; $j -lt $pos + $size; $j += 4) { $resourceIds += (Read-U32 $Data $j) }
    } elseif ($kind -eq 258) {
      $attrStart = Read-U16 $Data ($pos + 24)
      $attrSize = Read-U16 $Data ($pos + 26)
      $attrCount = Read-U16 $Data ($pos + 28)
      if ($attrSize -lt 20) { throw 'Invalid Android manifest attribute size.' }
      for ($j = 0; $j -lt $attrCount; $j++) {
        $attr = $pos + 16 + $attrStart + $j * $attrSize
        if ($attr + 20 -gt $pos + $size) { throw 'Invalid Android manifest attribute bounds.' }
        $nameIndex = Read-U32 $Data ($attr + 4)
        if ($nameIndex -lt $resourceIds.Count -and $resourceIds[$nameIndex] -eq 16843291) {
          if ($Data[$attr + 15] -ne 16 -and $Data[$attr + 15] -ne 17) { throw 'Manifest versionCode is not a typed integer.' }
          if ($result -ne -1) { throw 'Duplicate manifest versionCode.' }
          $result = $attr + 16
        }
      }
      # The first element is the root manifest. Do not patch component attributes.
      break
    }
    $pos += $size
  }
  if ($result -lt 0) { throw 'Could not locate the original manifest versionCode.' }
  return $result
}

