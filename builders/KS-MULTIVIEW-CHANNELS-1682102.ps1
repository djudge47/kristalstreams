$ErrorActionPreference = 'Stop'

$root = 'C:\ksserieslandscapebuttonverify-20260825-065729'
$app = Join-Path $root 'app'
$src = Join-Path $app 'src\main'
$java = Join-Path $src 'java\com\kristalstreams\player'
$multi = Join-Path $java 'MultiViewActivity.kt'
$gradle = Join-Path $app 'build.gradle.kts'
$gradlew = Join-Path $root 'gradlew.bat'
$outApk = Join-Path $env:USERPROFILE 'Desktop\KristalStreams-MULTIVIEW-CHANNELS-1682102.apk'
$utf8 = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' KRISTAL STREAMS - MULTIVIEW CHANNEL FIX 1682102' -ForegroundColor Cyan
Write-Host ' Existing Windows source + existing Gradle wrapper' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

foreach ($p in @($root,$multi,$gradle,$gradlew)) {
    if (-not (Test-Path $p)) { throw "Required file not found: $p" }
}

$gradleText = [System.IO.File]::ReadAllText($gradle,[System.Text.Encoding]::UTF8)
if ($gradleText -notmatch 'versionCode\s*=\s*1682101') {
    throw 'Expected 1682101 MultiView source is not active. Stopping without changes.'
}

$backup = Join-Path $root ('_multiview_1682102_backup_' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item $multi (Join-Path $backup 'MultiViewActivity.kt') -Force
Copy-Item $gradle (Join-Path $backup 'build.gradle.kts') -Force

try {
    $text = [System.IO.File]::ReadAllText($multi,[System.Text.Encoding]::UTF8)

    $oldCategories = @'
                val loaded = XtreamClient.liveCategories(credentials)
                val ids = loaded.map { it.id }
                val names = loaded.map { it.name }
                runOnUiThread {
                    progress.visibility = View.GONE
                    categoryIds = ids
                    categoryNames = names
                    categoryList.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, categoryNames)
                    if (categoryIds.isNotEmpty()) loadStreams(categoryIds.first())
                }
'@
    $newCategories = @'
                val loaded = XtreamClient.liveCategories(credentials)
                val ids = listOf("") + loaded.map { it.id }
                val names = listOf("ALL CHANNELS") + loaded.map { it.name }
                runOnUiThread {
                    progress.visibility = View.GONE
                    categoryIds = ids
                    categoryNames = names
                    categoryList.adapter = whiteListAdapter(categoryNames)
                    loadStreams("")
                }
'@
    if (-not $text.Contains($oldCategories)) { throw 'MultiView category-loading block not found.' }
    $text = $text.Replace($oldCategories,$newCategories)

    $oldChannelAdapter = '                    channelList.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, loaded.map { it.name })'
    $newChannelAdapter = '                    channelList.adapter = whiteListAdapter(loaded.map { it.name })'
    if (-not $text.Contains($oldChannelAdapter)) { throw 'MultiView channel adapter line not found.' }
    $text = $text.Replace($oldChannelAdapter,$newChannelAdapter)

    $insertAnchor = '    private fun sectionTitle(value: String) = TextView(this).apply {'
    if (-not $text.Contains($insertAnchor)) { throw 'MultiView sectionTitle anchor not found.' }
    $helper = @'
    private fun whiteListAdapter(items: List<String>) = object : ArrayAdapter<String>(this, android.R.layout.simple_list_item_1, items) {
        override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
            val row = super.getView(position, convertView, parent)
            (row as? TextView)?.apply {
                setTextColor(Color.WHITE)
                textSize = 13f
                setPadding(12.dp, 8.dp, 12.dp, 8.dp)
            }
            return row
        }
    }

'@
    $text = $text.Replace($insertAnchor,$helper + $insertAnchor)
    [System.IO.File]::WriteAllText($multi,$text,$utf8)

    $gradleText = [System.IO.File]::ReadAllText($gradle,[System.Text.Encoding]::UTF8)
    $gradleText = [regex]::Replace($gradleText,'versionCode\s*=\s*1682101','versionCode = 1682102')
    $gradleText = [regex]::Replace($gradleText,'versionName\s*=\s*"[^"]*"','versionName = "1.6.8-multiview-channels-1682102"')
    [System.IO.File]::WriteAllText($gradle,$gradleText,$utf8)

    $verify = [System.IO.File]::ReadAllText($multi,[System.Text.Encoding]::UTF8)
    if ($verify -notmatch 'ALL CHANNELS' -or $verify -notmatch 'loadStreams\(""\)' -or $verify -notmatch 'whiteListAdapter') {
        throw 'MultiView channel fix verification failed.'
    }

    Write-Host 'ALL CHANNELS + visible list adapters verified.' -ForegroundColor Green
    Write-Host 'Building with EXISTING Gradle wrapper...' -ForegroundColor Cyan
    Push-Location $root
    try {
        & $gradlew --no-daemon assembleDebug
        if ($LASTEXITCODE -ne 0) { throw "Gradle build failed with exit code $LASTEXITCODE" }
    } finally { Pop-Location }

    $builtApk = Join-Path $app 'build\outputs\apk\debug\app-debug.apk'
    if (-not (Test-Path $builtApk)) { throw "APK not found after build: $builtApk" }
    Copy-Item $builtApk $outApk -Force

    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Green
    Write-Host ' BUILD SUCCESSFUL' -ForegroundColor Green
    Write-Host ' MULTIVIEW CHANNEL LOADING FIXED' -ForegroundColor Green
    Write-Host " APK: $outApk" -ForegroundColor Green
    Write-Host '============================================================' -ForegroundColor Green
    Write-Host ''
    Start-Process explorer.exe -ArgumentList ('/select,"' + $outApk + '"')
}
catch {
    Write-Host ''
    Write-Host 'Build/fix failed - restoring 1682101 source...' -ForegroundColor Yellow
    Copy-Item (Join-Path $backup 'MultiViewActivity.kt') $multi -Force
    Copy-Item (Join-Path $backup 'build.gradle.kts') $gradle -Force
    throw
}
