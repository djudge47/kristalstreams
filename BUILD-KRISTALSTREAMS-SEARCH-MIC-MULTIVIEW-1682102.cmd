@echo off
setlocal
set "KS_BUILDER_PATH=%~f0"
title Kristal Streams Search Mic Multi-View 1682102 Builder
echo.
echo ============================================================
echo   KRISTAL STREAMS - SEARCH MIC + MULTI-VIEW - 1682102
echo ============================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$p=$env:KS_BUILDER_PATH; $c=[IO.File]::ReadAllText($p); $m=':__POWER'+'SHELL__'; $i=$c.IndexOf($m); if($i -lt 0){throw 'PowerShell section not found'}; & ([scriptblock]::Create($c.Substring($i+$m.Length)))"
set "KS_EXIT=%ERRORLEVEL%"
echo.
if not "%KS_EXIT%"=="0" (
  echo BUILD FAILED. Keep this window open and send the complete error.
) else (
  echo BUILD COMPLETED SUCCESSFULLY.
  echo APK: %%USERPROFILE%%\Desktop\KristalStreams-SEARCH-MIC-MULTIVIEW-1682102.apk
)
echo.
pause
exit /b %KS_EXIT%

:__POWERSHELL__
$ErrorActionPreference = 'Stop'

$approvedSource = 'C:\kssearchbarmiccomplete-20260827-123517'
$multiViewSource = 'C:\ksserieslandscapebuttonverify-20260825-065729'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$workingCopy = "C:\kssearchmicmultiviewcomplete-$stamp"
$desktopApk = Join-Path $env:USERPROFILE 'Desktop\KristalStreams-SEARCH-MIC-MULTIVIEW-1682102.apk'

function Require-Path([string]$path, [string]$label) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "$label was not found: $path"
    }
}

Require-Path $approvedSource 'Approved search-bar microphone source'
Require-Path (Join-Path $approvedSource 'gradlew.bat') 'Gradle wrapper'
Require-Path (Join-Path $multiViewSource 'app\src\main\java\com\kristalstreams\player\MultiViewActivity.kt') 'Previous Multi-View source'

Write-Host 'Creating a complete working copy from approved version 1682053...' -ForegroundColor Cyan
Copy-Item -LiteralPath $approvedSource -Destination $workingCopy -Recurse -Force

$targetMain = Join-Path $workingCopy 'app\src\main'
$oldMain = Join-Path $multiViewSource 'app\src\main'

Write-Host 'Installing complete Home screen files with the Multi-View entry...' -ForegroundColor Cyan
Copy-Item -LiteralPath (Join-Path $oldMain 'java\com\kristalstreams\player\HomeActivity.kt') -Destination (Join-Path $targetMain 'java\com\kristalstreams\player\HomeActivity.kt') -Force
Copy-Item -LiteralPath (Join-Path $oldMain 'res\layout\activity_home.xml') -Destination (Join-Path $targetMain 'res\layout\activity_home.xml') -Force
Copy-Item -LiteralPath (Join-Path $oldMain 'res\layout-land\activity_home.xml') -Destination (Join-Path $targetMain 'res\layout-land\activity_home.xml') -Force

$multiViewFile = Join-Path $targetMain 'java\com\kristalstreams\player\MultiViewActivity.kt'
$multiViewCode = @'
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
                    selectTile(activeTile)
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
            selectTile(activeTile)
        }

        rebuildPlayers()
        selectTile(0)
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
        updateAudio()
    }

    private fun addTile(row: LinearLayout, index: Int) {
        val frame = FrameLayout(this).apply {
            setBackgroundColor(0xff1c1c1c.toInt())
            setPadding(4.dp, 4.dp, 4.dp, 4.dp)
            isFocusable = true
            isClickable = true
            setOnClickListener { selectTile(index) }
            setOnFocusChangeListener { view, hasFocus ->
                if (hasFocus) {
                    view.setBackgroundColor(0xffe50914.toInt())
                    selectTile(index)
                } else {
                    view.setBackgroundColor(0xff1c1c1c.toInt())
                }
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

    private fun selectTile(index: Int) {
        if (index !in 0 until screenCount) return
        activeTile = index
        updateLabels()
        updateAudio()
        status.text = "Selected screen ${activeTile + 1} - choose any category and channel"
    }

    private fun updateLabels() {
        for (i in 0 until screenCount) {
            labels[i]?.setTextColor(if (i == activeTile) 0xffff4444.toInt() else Color.WHITE)
        }
    }

    private fun updateAudio() {
        for (i in 0..3) {
            players[i]?.volume = if (i == activeTile && i < screenCount) 1f else 0f
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
            player.volume = if (index == activeTile) 1f else 0f
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

    override fun onStop() {
        for (player in players) player?.pause()
        super.onStop()
    }

    override fun onDestroy() {
        executor.shutdownNow()
        for (i in 0..3) releaseTile(i)
        super.onDestroy()
    }

    private val Int.dp: Int get() = (this * resources.displayMetrics.density).toInt()
}
'@
[IO.File]::WriteAllText($multiViewFile, $multiViewCode, [Text.UTF8Encoding]::new($false))

$manifestPath = Join-Path $targetMain 'AndroidManifest.xml'
$manifest = [IO.File]::ReadAllText($manifestPath)
if ($manifest -notmatch 'MultiViewActivity') {
    $entry = '        <activity android:name=".MultiViewActivity" android:screenOrientation="landscape" />'
    $manifest = $manifest.Replace('    </application>', $entry + [Environment]::NewLine + '    </application>')
}
[IO.File]::WriteAllText($manifestPath, $manifest, [Text.UTF8Encoding]::new($false))

$gradlePath = Join-Path $workingCopy 'app\build.gradle.kts'
$gradle = [IO.File]::ReadAllText($gradlePath)
$gradle = [regex]::Replace($gradle, 'versionCode\s*=\s*\d+', 'versionCode = 1682102')
$gradle = [regex]::Replace($gradle, 'versionName\s*=\s*"[^"]+"', 'versionName = "1.6.8-search-mic-multiview-1682102"')
[IO.File]::WriteAllText($gradlePath, $gradle, [Text.UTF8Encoding]::new($false))

Write-Host "Complete source prepared at: $workingCopy" -ForegroundColor Green
Write-Host 'Building APK with preserved Gradle outputs...' -ForegroundColor Cyan
Push-Location $workingCopy
try {
    & .\gradlew.bat assembleDebug --no-daemon
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

$builtApk = Join-Path $workingCopy 'app\build\outputs\apk\debug\app-debug.apk'
Require-Path $builtApk 'Built APK'
Copy-Item -LiteralPath $builtApk -Destination $desktopApk -Force

$apk = Get-Item -LiteralPath $desktopApk
if ($apk.Length -lt 10000000) { throw "APK verification failed because the file is unexpectedly small: $($apk.Length) bytes" }

Write-Host ''
Write-Host 'SEARCH-BAR MICROPHONE + MULTI-VIEW BUILD PASSED' -ForegroundColor Green
Write-Host "APK: $($apk.FullName)" -ForegroundColor Green
Write-Host "SIZE: $($apk.Length) bytes" -ForegroundColor Green
Write-Host 'Install directly over the current app. Do not uninstall or clear app data.' -ForegroundColor Yellow
