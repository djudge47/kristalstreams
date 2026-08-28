$ErrorActionPreference = 'Stop'

$root = 'C:\ksserieslandscapebuttonverify-20260825-065729'
$app = Join-Path $root 'app'
$src = Join-Path $app 'src\main'
$java = Join-Path $src 'java\com\kristalstreams\player'
$res = Join-Path $src 'res'
$manifest = Join-Path $src 'AndroidManifest.xml'
$channels = Join-Path $java 'ChannelsActivity.kt'
$layout = Join-Path $res 'layout\activity_channels.xml'
$layoutLand = Join-Path $res 'layout-land\activity_channels.xml'
$gradle = Join-Path $app 'build.gradle.kts'
$gradlew = Join-Path $root 'gradlew.bat'
$outApk = Join-Path $env:USERPROFILE 'Desktop\KristalStreams-1.6.8-MultiView-1682043.apk'
$backup = Join-Path $root ('_multiview_backup_' + (Get-Date -Format 'yyyyMMdd-HHmmss'))

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' KRISTAL STREAMS - MULTIVIEW 1682043' -ForegroundColor Cyan
Write-Host ' Verified Windows source / existing Gradle wrapper' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$required = @($root,$gradlew,$channels,$layout,$layoutLand,$manifest,$gradle)
foreach ($p in $required) {
    if (-not (Test-Path $p)) { throw "Required working-source file not found: $p" }
}

$gradleText = Get-Content $gradle -Raw
if ($gradleText -notmatch 'versionCode\s*=\s*1682042' -and $gradleText -notmatch 'versionCode\s*=\s*1682043') {
    throw 'Expected baseline versionCode 1682042 was not found. Stopping to protect the working source.'
}

New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item $channels (Join-Path $backup 'ChannelsActivity.kt') -Force
Copy-Item $layout (Join-Path $backup 'activity_channels.xml') -Force
Copy-Item $layoutLand (Join-Path $backup 'activity_channels-land.xml') -Force
Copy-Item $manifest (Join-Path $backup 'AndroidManifest.xml') -Force
Copy-Item $gradle (Join-Path $backup 'build.gradle.kts') -Force
Write-Host "Backup created: $backup" -ForegroundColor DarkGray

# --- MultiViewActivity.kt ---
$multiViewKt = @'
package com.kristalstreams.player

import android.content.res.Configuration
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.FrameLayout
import android.widget.GridLayout
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
    private lateinit var grid: GridLayout
    private lateinit var status: TextView
    private lateinit var progress: ProgressBar

    private var categories: List<LiveCategory> = emptyList()
    private var channels: List<LiveStream> = emptyList()
    private var screenCount = 4
    private var activeTile = 0
    private val players = arrayOfNulls<ExoPlayer>(4)
    private val playerViews = arrayOfNulls<PlayerView>(4)
    private val tileLabels = arrayOfNulls<TextView>(4)

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
            text = "KS  MULTI-VIEW"
            setTextColor(Color.WHITE)
            textSize = 20f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }, LinearLayout.LayoutParams(0, 52.dp, 1f))

        for (n in 1..4) {
            header.addView(Button(this).apply {
                text = "$n"
                isAllCaps = false
                setTextColor(Color.WHITE)
                setBackgroundColor(0xff6f0000.toInt())
                setOnClickListener {
                    screenCount = n
                    if (activeTile >= n) activeTile = 0
                    rebuildGrid()
                }
            }, LinearLayout.LayoutParams(54.dp, 42.dp).apply { marginEnd = 6.dp })
        }

        header.addView(Button(this).apply {
            text = "BACK"
            setTextColor(Color.WHITE)
            setBackgroundColor(0xff6f0000.toInt())
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

        side.addView(TextView(this).apply {
            text = "CATEGORIES"
            setTextColor(0xffe50914.toInt())
            textSize = 12f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        })

        categoryList = ListView(this).apply {
            dividerHeight = 1
            setBackgroundColor(Color.TRANSPARENT)
        }
        side.addView(categoryList, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 0.42f))

        side.addView(TextView(this).apply {
            text = "CHANNELS"
            setTextColor(0xffe50914.toInt())
            textSize = 12f
            setPadding(0, 8.dp, 0, 4.dp)
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        })

        channelList = ListView(this).apply {
            dividerHeight = 1
            setBackgroundColor(Color.TRANSPARENT)
        }
        side.addView(channelList, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 0.58f))

        progress = ProgressBar(this).apply { visibility = View.GONE }
        side.addView(progress, LinearLayout.LayoutParams(36.dp, 36.dp))

        status = TextView(this).apply {
            text = "Select a tile, then choose a channel. Each active tile may count as a provider connection."
            setTextColor(0xffaaaaaa.toInt())
            textSize = 10f
            setPadding(0, 5.dp, 0, 0)
        }
        side.addView(status)

        body.addView(side, LinearLayout.LayoutParams(280.dp, ViewGroup.LayoutParams.MATCH_PARENT))

        grid = GridLayout(this).apply {
            columnCount = 2
            rowCount = 2
            setBackgroundColor(Color.BLACK)
        }
        body.addView(grid, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f).apply { marginStart = 10.dp })
        root.addView(body, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))

        setContentView(root)
        rebuildGrid()

        categoryList.setOnItemClickListener { _, _, position, _ ->
            val c = categories.getOrNull(position) ?: return@setOnItemClickListener
            loadStreams(c.id)
        }
        channelList.setOnItemClickListener { _, _, position, _ ->
            val ch = channels.getOrNull(position) ?: return@setOnItemClickListener
            playChannel(activeTile, ch)
            activeTile = (activeTile + 1) % screenCount
            updateTileSelection()
        }
    }

    private fun rebuildGrid() {
        for (i in screenCount until 4) releaseTile(i)
        grid.removeAllViews()
        grid.columnCount = if (screenCount == 1) 1 else 2
        grid.rowCount = when (screenCount) { 1, 2 -> 1 else -> 2 }

        for (i in 0 until screenCount) {
            val frame = FrameLayout(this).apply {
                setBackgroundColor(0xff1c1c1c.toInt())
                setPadding(3.dp, 3.dp, 3.dp, 3.dp)
                isFocusable = true
                isClickable = true
                setOnClickListener {
                    activeTile = i
                    updateTileSelection()
                }
            }
            val pv = PlayerView(this).apply {
                useController = true
                setBackgroundColor(Color.BLACK)
                player = players[i]
            }
            playerViews[i] = pv
            frame.addView(pv, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

            val label = TextView(this).apply {
                text = "SCREEN ${i + 1}"
                setTextColor(Color.WHITE)
                setBackgroundColor(0xaa000000.toInt())
                textSize = 11f
                setPadding(8.dp, 5.dp, 8.dp, 5.dp)
            }
            tileLabels[i] = label
            frame.addView(label, FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.TOP or Gravity.START))

            val lp = GridLayout.LayoutParams().apply {
                width = 0
                height = 0
                columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1f)
                rowSpec = GridLayout.spec(GridLayout.UNDEFINED, 1f)
                setMargins(4.dp, 4.dp, 4.dp, 4.dp)
            }
            grid.addView(frame, lp)
        }
        updateTileSelection()
    }

    private fun updateTileSelection() {
        for (i in 0 until screenCount) {
            val label = tileLabels[i] ?: continue
            label.text = if (i == activeTile) "SCREEN ${i + 1}  •  SELECTED" else "SCREEN ${i + 1}"
            label.setTextColor(if (i == activeTile) 0xffff4444.toInt() else Color.WHITE)
        }
    }

    private fun loadCategories() {
        progress.visibility = View.VISIBLE
        executor.execute {
            try {
                val loaded = XtreamClient.liveCategories(credentials)
                runOnUiThread {
                    progress.visibility = View.GONE
                    categories = loaded
                    categoryList.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, loaded.map { it.name })
                    if (loaded.isNotEmpty()) loadStreams(loaded.first().id)
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
                    status.text = "${loaded.size} channels • selected tile ${activeTile + 1}"
                }
            } catch (e: Exception) {
                runOnUiThread { showError(e.message ?: "Unable to load channels") }
            }
        }
    }

    private fun playChannel(index: Int, ch: LiveStream) {
        if (index !in 0..3) return
        try {
            releaseTile(index)
            val renderers = DefaultRenderersFactory(this)
                .setExtensionRendererMode(DefaultRenderersFactory.EXTENSION_RENDERER_MODE_PREFER)
                .setEnableDecoderFallback(true)
            val p = ExoPlayer.Builder(this, renderers).build()
            players[index] = p
            playerViews[index]?.player = p
            p.setMediaItem(MediaItem.fromUri(XtreamClient.streamUrl(credentials, ch)))
            p.prepare()
            p.playWhenReady = true
            tileLabels[index]?.text = "SCREEN ${index + 1}  •  ${ch.name}"
            Toast.makeText(this, "Screen ${index + 1}: ${ch.name}", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, e.message ?: "Unable to play channel", Toast.LENGTH_SHORT).show()
        }
    }

    private fun releaseTile(index: Int) {
        players[index]?.release()
        players[index] = null
        playerViews[index]?.player = null
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
Set-Content -Path (Join-Path $java 'MultiViewActivity.kt') -Value $multiViewKt -Encoding UTF8

# --- ChannelsActivity hook ---
$channelsText = Get-Content $channels -Raw
if ($channelsText -notmatch 'multiviewButton') {
    $anchor = @'
        findViewById<Button>(R.id.guideButton).setOnClickListener {
            startActivity(Intent(this, GuideActivity::class.java).apply {
                putExtra("categoryId", currentCategoryId)
            })
        }
'@
    $insert = $anchor + @'
        findViewById<Button>(R.id.multiviewButton).setOnClickListener {
            startActivity(Intent(this, MultiViewActivity::class.java))
        }
'@
    if (-not $channelsText.Contains($anchor)) { throw 'ChannelsActivity guide-button anchor not found. No changes applied beyond backup/new file.' }
    $channelsText = $channelsText.Replace($anchor, $insert)
    Set-Content -Path $channels -Value $channelsText -Encoding UTF8
}

# --- Portrait layout hook ---
$layoutText = Get-Content $layout -Raw
if ($layoutText -notmatch 'multiviewButton') {
    $guideAnchor = @'
        <Button
            android:id="@+id/guideButton"
'@
    $multiButton = @'
        <Button
            android:id="@+id/multiviewButton"
            android:layout_width="84dp"
            android:layout_height="42dp"
            android:layout_marginEnd="5dp"
            android:text="MULTI-VIEW"
            android:textColor="@color/ks_white"
            android:textStyle="bold"
            android:textSize="8sp"
            android:background="@drawable/bg_button"/>

'@
    if (-not $layoutText.Contains($guideAnchor)) { throw 'Portrait Live TV guide-button layout anchor not found.' }
    $layoutText = $layoutText.Replace($guideAnchor, $multiButton + $guideAnchor)
    Set-Content -Path $layout -Value $layoutText -Encoding UTF8
}

# --- Landscape layout hook ---
$landText = Get-Content $layoutLand -Raw
if ($landText -notmatch 'multiviewButton') {
    $landGuideAnchor = @'
        <Button
            android:id="@+id/guideButton"
'@
    $landMultiButton = @'
        <Button
            android:id="@+id/multiviewButton"
            android:layout_width="96dp"
            android:layout_height="42dp"
            android:layout_marginEnd="8dp"
            android:text="MULTI-VIEW"
            android:textColor="@color/ks_white"
            android:textStyle="bold"
            android:textSize="9sp"
            android:background="@drawable/bg_button"/>

'@
    if (-not $landText.Contains($landGuideAnchor)) { throw 'Landscape Live TV guide-button layout anchor not found.' }
    $landText = $landText.Replace($landGuideAnchor, $landMultiButton + $landGuideAnchor)
    Set-Content -Path $layoutLand -Value $landText -Encoding UTF8
}

# --- Manifest entry ---
$manifestText = Get-Content $manifest -Raw
if ($manifestText -notmatch 'MultiViewActivity') {
    $manifestAnchor = '<activity android:name=".PlayerActivity" android:screenOrientation="landscape" />'
    $manifestInsert = '<activity android:name=".MultiViewActivity" android:screenOrientation="landscape" />' + "`r`n        " + $manifestAnchor
    if (-not $manifestText.Contains($manifestAnchor)) { throw 'PlayerActivity manifest anchor not found.' }
    $manifestText = $manifestText.Replace($manifestAnchor, $manifestInsert)
    Set-Content -Path $manifest -Value $manifestText -Encoding UTF8
}

# --- Version bump only ---
$gradleText = Get-Content $gradle -Raw
$gradleText = $gradleText -replace 'versionCode\s*=\s*1682042', 'versionCode = 1682043'
$gradleText = $gradleText -replace 'versionName\s*=\s*"[^"]+"', 'versionName = "1.6.8-multiview-1682043"'
Set-Content -Path $gradle -Value $gradleText -Encoding UTF8

Write-Host ''
Write-Host 'Files updated successfully. Building with EXISTING Gradle wrapper...' -ForegroundColor Green
Push-Location $root
try {
    & $gradlew --no-daemon assembleDebug
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

$built = Join-Path $app 'build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $built)) { throw "Build reported success but APK not found: $built" }
Copy-Item $built $outApk -Force

Write-Host ''
Write-Host '============================================================' -ForegroundColor Green
Write-Host ' BUILD SUCCESSFUL' -ForegroundColor Green
Write-Host " APK: $outApk" -ForegroundColor Green
Write-Host ' VersionCode: 1682043' -ForegroundColor Green
Write-Host ' MultiView: 1 / 2 / 3 / 4 screens' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
