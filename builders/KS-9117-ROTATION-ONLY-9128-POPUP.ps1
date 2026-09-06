$ErrorActionPreference = 'Stop'

$builderUrl = 'https://raw.githubusercontent.com/djudge47/kristalstreams/58ee51cf14241a9255f67a6d5af3c832a5a97cb1/builders/KS-9117-ROTATION-ONLY-9128.ps1'
$desktop = [Environment]::GetFolderPath('Desktop')
$final = Join-Path $desktop 'KristalStreams-KS-ROTATION-ONLY-9128.apk'

& ([scriptblock]::Create((Invoke-RestMethod $builderUrl)))

if (!(Test-Path -LiteralPath $final)) {
    throw "Build returned without the expected APK: $final"
}

Start-Process explorer.exe -ArgumentList "/select,`"$final`""

Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show(
    "Kristal Streams rotation APK is ready.`n`n$final",
    'Kristal Streams - APK Ready',
    [System.Windows.MessageBoxButton]::OK,
    [System.Windows.MessageBoxImage]::Information
) | Out-Null
