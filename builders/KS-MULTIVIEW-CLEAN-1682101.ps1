$ErrorActionPreference = 'Stop'

$root = 'C:\ksserieslandscapebuttonverify-20260825-065729'
$app = Join-Path $root 'app'
$src = Join-Path $app 'src\main'
$java = Join-Path $src 'java\com\kristalstreams\player'
$res = Join-Path $src 'res'
$homeActivity = Join-Path $java 'HomeActivity.kt'
$multiActivity = Join-Path $java 'MultiViewActivity.kt'
$manifest = Join-Path $src 'AndroidManifest.xml'
$portrait = Join-Path $res 'layout\activity_home.xml'
$landscape = Join-Path $res 'layout-land\activity_home.xml'
$gradle = Join-Path $app 'build.gradle.kts'
$gradlew = Join-Path $root 'gradlew.bat'
$outApk = Join-Path $env:USERPROFILE 'Desktop\KristalStreams-MULTIVIEW-CLEAN-1682101.apk'
$utf8 = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' KRISTAL STREAMS - CLEAN MULTIVIEW 1682101' -ForegroundColor Cyan
Write-Host ' Based on verified 1682100 baseline' -ForegroundColor Cyan
Write-Host ' Existing Windows source + existing Gradle wrapper' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

foreach ($path in @($root,$gradlew,$homeActivity,$manifest,$portrait,$landscape,$gradle)) {
    if (-not (Test-Path $path)) { throw "Required baseline file not found: $path" }
}

$gradleText = [System.IO.File]::ReadAllText($gradle, [System.Text.Encoding]::UTF8)
if ($gradleText -notmatch 'versionCode\s*=\s*1682100') {
    throw 'Verified 1682100 baseline is not active. Stopping without changing source.'
}

$backup = Join-Path $root ('_multiview_clean_1682101_backup_' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item $homeActivity (Join-Path $backup 'HomeActivity.kt') -Force
Copy-Item $manifest (Join-Path $backup 'AndroidManifest.xml') -Force
Copy-Item $portrait (Join-Path $backup 'activity_home.xml') -Force
Copy-Item $landscape (Join-Path $backup 'activity_home-land.xml') -Force
Copy-Item $gradle (Join-Path $backup 'build.gradle.kts') -Force
if (Test-Path $multiActivity) { Copy-Item $multiActivity (Join-Path $backup 'MultiViewActivity.kt') -Force }

function Restore-Baseline {
    Copy-Item (Join-Path $backup 'HomeActivity.kt') $homeActivity -Force
    Copy-Item (Join-Path $backup 'AndroidManifest.xml') $manifest -Force
    Copy-Item (Join-Path $backup 'activity_home.xml') $portrait -Force
    Copy-Item (Join-Path $backup 'activity_home-land.xml') $landscape -Force
    Copy-Item (Join-Path $backup 'build.gradle.kts') $gradle -Force
    $savedMulti = Join-Path $backup 'MultiViewActivity.kt'
    if (Test-Path $savedMulti) { Copy-Item $savedMulti $multiActivity -Force }
    elseif (Test-Path $multiActivity) { Remove-Item $multiActivity -Force }
}

try {
    Write-Host "Safety backup: $backup" -ForegroundColor DarkGray

    # Create MultiViewActivity without depending on a named category model class.
    $multiCode = @'
package com.kristalstreams.player

import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ListView
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import java.util.concurrent.Executors

class MultiViewActivity : AppCompatActivity() {
    private val executor = Executors.newSingleThreadExecutor()
    private lateinit var credentials: XtreamCredentials
    private lateinit var categoryList: ListView
    private lateinit var channelList: ListView
    private lateinit var playerArea: LinearLayout
    private lateinit var progress: ProgressBar
    private lateinit var status: TextView

    private var categoryIds: List<String> = emptyList()
    private var categoryNames: List<String> = emptyList()
    private var channels: List<LiveStream> = emptyList()
    private var screenCount = 4
    private var activeTile = 0
    private val players = arrayOfNulls<ExoPlayer>(4)
    private val views = arrayOfNulls<PlayerView>(4)
    private val labels = arrayOfNulls<TextView>(4)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.BLACK
        window.navigationBarColor = Color.BLACK

        credentials = Session.load(this) ?: run {
            finish()
            return
        }

        buildUi()
        loadCategories()
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.BLACK)
        }

        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(14.dp, 8.dp, 12.dp, 8.dp)
            setBackgroundColor(0xff110000.toInt())
        }

        header.addView(TextView(this).apply {
            text = "KRISTAL STREAMS  MULTI-VIEW"
            setTextColor(Color.WHITE)
            textSize = 19f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }, LinearLayout.LayoutParams(0, 52.dp, 1f))

        for (count in 1..4) {
            header.addView(Button(this).apply {
                text = count.toString()
                setTextColor(Color.WHITE)
                setBackgroundColor(0xff6f0000.toInt())
                isFocusable = true
                setOnClickListener {
                    screenCount = count
                    if (activeTile >= count) activeTile = 0
                    rebuildPlayers()
                }
            }, LinearLayout.LayoutParams(54.dp, 42.dp).apply { marginEnd = 6.dp })
        }

        header.addView(Button(this).apply {
            text = "BACK"
            setTextColor(Color.WHITE)
            setBackgroundColor(0xff6f0000.toInt())
            isFocusable = true
            setOnClickListener { finish() }
        }, LinearLayout.LayoutParams(76.dp, 42.dp))
        root.addView(header)

        val body = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(10.dp, 10.dp, 10.dp, 10.dp)
        }

        val side = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(8.dp, 8.dp, 8.dp, 8.dp)
            setBackgroundColor(0xff101010.toInt())
        }

        side.addView(sectionTitle("CATEGORIES"))
        categoryList = ListView(this)
        side.addView(categoryList, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 0.42f))

        side.addView(sectionTitle("CHANNELS").apply { setPadding(0, 8.dp, 0, 4.dp) })
        channelList = ListView(this)
        side.addView(channelList, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 0.58f))

        progress = ProgressBar(this).apply { visibility = View.GONE }
        side.addView(progress, LinearLayout.LayoutParams(36.dp, 36.dp))

        status = TextView(this).apply {
            text = "Select a screen, then choose a channel."
            setTextColor(0xffaaaaaa.toInt())
            textSize = 10f
            setPadding(0, 5.dp, 0, 0)
        }
        side.addView(status)

        body.addView(side, LinearLayout.LayoutParams(280.dp, ViewGroup.LayoutParams.MATCH_PARENT))

        playerArea = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.BLACK)
        }
        body.addView(playerArea, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f).apply { marginStart = 10.dp })
        root.addView(body, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        setContentView(root)

        categoryList.setOnItemClickListener { _, _, position, _ ->
            categoryIds.getOrNull(position)?.let { loadStreams(it) }
        }
        channelList.setOnItemClickListener { _, _, position, _ ->
            val channel = channels.getOrNull(position) ?: return@setOnItemClickListener
            playChannel(activeTile, channel)
            activeTile = (activeTile + 1) % screenCount
            updateLabels()
        }

        rebuildPlayers()
    }

    private fun sectionTitle(value: String) = TextView(this).apply {
        text = value
        setTextColor(0xffe50914.toInt())
        textSize = 12f
        setTypeface(typeface, android.graphics.Typeface.BOLD)
    }

    private fun rebuildPlayers() {
        for (i in screenCount until 4) releaseTile(i)
        playerArea.removeAllViews()
        for (i in 0..3) {
            views[i] = null
            labels[i] = null
        }

        if (screenCount <= 2) {
            val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            playerArea.addView(row, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
            for (i in 0 until screenCount) addTile(row, i)
        } else {
            val top = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            val bottom = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            playerArea.addView(top, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
            playerArea.addView(bottom, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
            addTile(top, 0)
            addTile(top, 1)
            addTile(bottom, 2)
            if (screenCount == 4) addTile(bottom, 3)
        }
        updateLabels()
    }

    private fun addTile(row: LinearLayout, index: Int) {
        val frame = FrameLayout(this).apply {
            setBackgroundColor(0xff1c1c1c.toInt())
            setPadding(4.dp, 4.dp, 4.dp, 4.dp)
            isFocusable = true
            isClickable = true
            setOnClickListener {
                activeTile = index
                updateLabels()
            }
        }

        val playerView = PlayerView(this).apply {
            useController = false
            setBackgroundColor(Color.BLACK)
            player = players[index]
        }
        views[index] = playerView
        frame.addView(playerView, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

        val label = TextView(this).apply {
            text = "SCREEN ${index + 1}"
            setTextColor(Color.WHITE)
            setBackgroundColor(0xaa000000.toInt())
            textSize = 11f
            setPadding(8.dp, 5.dp, 8.dp, 5.dp)
        }
        labels[index] = label
        frame.addView(label, FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.TOP or Gravity.START))
        row.addView(frame, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f).apply { setMargins(4.dp, 4.dp, 4.dp, 4.dp) })
    }

    private fun updateLabels() {
        for (i in 0 until screenCount) {
            labels[i]?.setTextColor(if (i == activeTile) 0xffff4444.toInt() else Color.WHITE)
        }
    }

    private fun loadCategories() {
        progress.visibility = View.VISIBLE
        executor.execute {
            try {
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
            } catch (e: Exception) {
                runOnUiThread { showError(e.message ?: "Unable to load categories") }
            }
        }
    }

    private fun loadStreams(categoryId: String) {
        progress.visibility = View.VISIBLE
        executor.execute {
            try {
                val loaded = XtreamClient.liveStreams(credentials, categoryId)
                runOnUiThread {
                    progress.visibility = View.GONE
                    channels = loaded
                    channelList.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, loaded.map { it.name })
                    status.text = "${loaded.size} channels - selected screen ${activeTile + 1}"
                }
            } catch (e: Exception) {
                runOnUiThread { showError(e.message ?: "Unable to load channels") }
            }
        }
    }

    private fun playChannel(index: Int, channel: LiveStream) {
        try {
            releaseTile(index)
            val renderers = DefaultRenderersFactory(this)
                .setExtensionRendererMode(DefaultRenderersFactory.EXTENSION_RENDERER_MODE_PREFER)
                .setEnableDecoderFallback(true)
            val player = ExoPlayer.Builder(this, renderers).build()
            players[index] = player
            views[index]?.player = player
            player.setMediaItem(MediaItem.fromUri(XtreamClient.streamUrl(credentials, channel)))
            player.prepare()
            player.playWhenReady = true
            labels[index]?.text = "SCREEN ${index + 1} - ${channel.name}"
            Toast.makeText(this, "Screen ${index + 1}: ${channel.name}", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, e.message ?: "Unable to play channel", Toast.LENGTH_SHORT).show()
        }
    }

    private fun releaseTile(index: Int) {
        players[index]?.release()
        players[index] = null
        views[index]?.player = null
    }

    private fun showError(message: String) {
        progress.visibility = View.GONE
        status.text = message
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    override fun onDestroy() {
        executor.shutdownNow()
        for (i in 0..3) releaseTile(i)
        super.onDestroy()
    }

    private val Int.dp: Int get() = (this * resources.displayMetrics.density).toInt()
}
'@
    [System.IO.File]::WriteAllText($multiActivity, $multiCode, $utf8)

    # Wire the dashboard action using stable ASCII anchors.
    $homeText = [System.IO.File]::ReadAllText($homeActivity, [System.Text.Encoding]::UTF8)
    $actionAnchor = '        val continuing = { launch(ContinueWatchingActivity::class.java) }'
    if (-not $homeText.Contains($actionAnchor)) { throw 'HomeActivity action anchor not found.' }
    $homeText = $homeText.Replace($actionAnchor, $actionAnchor + "`r`n        val multiview = { launch(MultiViewActivity::class.java) }")

    $clickAnchor = '        click(R.id.continueCard, continuing)'
    if (-not $homeText.Contains($clickAnchor)) { throw 'HomeActivity click anchor not found.' }
    $homeText = $homeText.Replace($clickAnchor, $clickAnchor + "`r`n        click(R.id.multiviewCard, multiview)")
    [System.IO.File]::WriteAllText($homeActivity, $homeText, $utf8)

    function Add-MultiViewCard([string]$layoutPath) {
        $xmlText = [System.IO.File]::ReadAllText($layoutPath, [System.Text.Encoding]::UTF8)
        [xml]$doc = $xmlText
        $androidNs = 'http://schemas.android.com/apk/res/android'
        $mgr = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
        $mgr.AddNamespace('android', $androidNs)

        $existing = $doc.SelectSingleNode('//*[@android:id="@+id/multiviewCard"]', $mgr)
        if ($existing) { return }

        $searchNode = $doc.SelectSingleNode('//*[@android:id="@+id/searchCard"]', $mgr)
        if (-not $searchNode) { throw "searchCard not found in $layoutPath" }
        $parent = $searchNode.ParentNode
        if (-not $parent) { throw "searchCard parent not found in $layoutPath" }

        $node = $doc.CreateElement('TextView')
        $node.SetAttribute('id', $androidNs, '@+id/multiviewCard')
        $node.SetAttribute('layout_width', $androidNs, '0dp')
        $node.SetAttribute('layout_height', $androidNs, 'match_parent')
        $node.SetAttribute('layout_weight', $androidNs, '1')
        $node.SetAttribute('layout_marginStart', $androidNs, '4dp')
        $node.SetAttribute('gravity', $androidNs, 'center')
        $node.SetAttribute('text', $androidNs, 'MULTI-VIEW')
        $node.SetAttribute('textColor', $androidNs, '@color/ks_white')
        $node.SetAttribute('textStyle', $androidNs, 'bold')
        $node.SetAttribute('textSize', $androidNs, '12sp')
        $node.SetAttribute('background', $androidNs, '@drawable/bg_official_utility')
        $node.SetAttribute('focusable', $androidNs, 'true')
        $node.SetAttribute('clickable', $androidNs, 'true')

        [void]$parent.InsertAfter($node, $searchNode)

        $settings = New-Object System.Xml.XmlWriterSettings
        $settings.Indent = $true
        $settings.Encoding = $utf8
        $writer = [System.Xml.XmlWriter]::Create($layoutPath, $settings)
        try { $doc.Save($writer) } finally { $writer.Close() }
    }

    Add-MultiViewCard $portrait
    Add-MultiViewCard $landscape

    # Register activity in manifest using UTF-8 text only.
    $manifestText = [System.IO.File]::ReadAllText($manifest, [System.Text.Encoding]::UTF8)
    if ($manifestText -notmatch 'MultiViewActivity') {
        $manifestAnchor = '</application>'
        if (-not $manifestText.Contains($manifestAnchor)) { throw 'Manifest application closing tag not found.' }
        $activityLine = '        <activity android:name=".MultiViewActivity" android:screenOrientation="landscape" />' + "`r`n    "
        $manifestText = $manifestText.Replace($manifestAnchor, $activityLine + $manifestAnchor)
        [System.IO.File]::WriteAllText($manifest, $manifestText, $utf8)
    }

    # Bump Android version above the verified baseline.
    $gradleText = [System.IO.File]::ReadAllText($gradle, [System.Text.Encoding]::UTF8)
    $gradleText = [regex]::Replace($gradleText, 'versionCode\s*=\s*1682100', 'versionCode = 1682101')
    $gradleText = [regex]::Replace($gradleText, 'versionName\s*=\s*"[^"]*"', 'versionName = "1.6.8-multiview-clean-1682101"')
    [System.IO.File]::WriteAllText($gradle, $gradleText, $utf8)

    # Verify every required hook before compiling.
    $verifyHome = [System.IO.File]::ReadAllText($homeActivity, [System.Text.Encoding]::UTF8)
    $verifyManifest = [System.IO.File]::ReadAllText($manifest, [System.Text.Encoding]::UTF8)
    $verifyPortrait = [System.IO.File]::ReadAllText($portrait, [System.Text.Encoding]::UTF8)
    $verifyLandscape = [System.IO.File]::ReadAllText($landscape, [System.Text.Encoding]::UTF8)
    if ($verifyHome -notmatch 'multiviewCard' -or $verifyHome -notmatch 'MultiViewActivity') { throw 'Home MultiView wiring verification failed.' }
    if ($verifyManifest -notmatch 'MultiViewActivity') { throw 'Manifest MultiView verification failed.' }
    if ($verifyPortrait -notmatch 'multiviewCard') { throw 'Portrait dashboard MultiView verification failed.' }
    if ($verifyLandscape -notmatch 'multiviewCard') { throw 'Landscape dashboard MultiView verification failed.' }

    Write-Host 'MultiView source and dashboard wiring verified.' -ForegroundColor Green
    Write-Host 'Building with EXISTING Gradle wrapper...' -ForegroundColor Cyan

    Push-Location $root
    try {
        & $gradlew --no-daemon assembleDebug
        if ($LASTEXITCODE -ne 0) { throw "Gradle build failed with exit code $LASTEXITCODE" }
    } finally {
        Pop-Location
    }

    $builtApk = Join-Path $app 'build\outputs\apk\debug\app-debug.apk'
    if (-not (Test-Path $builtApk)) { throw "Build reported success but APK was not found: $builtApk" }

    if (Test-Path $outApk) { Remove-Item $outApk -Force }
    Copy-Item $builtApk $outApk -Force
    if (-not (Test-Path $outApk)) { throw 'Desktop APK copy verification failed.' }

    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Green
    Write-Host ' BUILD SUCCESSFUL' -ForegroundColor Green
    Write-Host ' MULTI-VIEW ADDED TO MAIN DASHBOARD' -ForegroundColor Green
    Write-Host " APK: $outApk" -ForegroundColor Green
    Write-Host '============================================================' -ForegroundColor Green
    Write-Host ''

    Start-Process explorer.exe -ArgumentList ('/select,"' + $outApk + '"')
}
catch {
    Write-Host ''
    Write-Host 'MULTIVIEW BUILD FAILED - restoring verified 1682100 baseline...' -ForegroundColor Yellow
    Restore-Baseline
    Write-Host 'Verified baseline source restored. No failed MultiView changes were left behind.' -ForegroundColor Green
    throw
}
