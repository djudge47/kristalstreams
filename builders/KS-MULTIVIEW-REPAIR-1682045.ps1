$ErrorActionPreference = 'Stop'

$root = 'C:\ksserieslandscapebuttonverify-20260825-065729'
$app = Join-Path $root 'app'
$src = Join-Path $app 'src\main'
$java = Join-Path $src 'java\com\kristalstreams\player'
$manifest = Join-Path $src 'AndroidManifest.xml'
$channels = Join-Path $java 'ChannelsActivity.kt'
$gradle = Join-Path $app 'build.gradle.kts'
$gradlew = Join-Path $root 'gradlew.bat'
$outApk = Join-Path $env:USERPROFILE 'Desktop\KristalStreams-1.6.8-MultiView-1682045.apk'
$utf8 = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' KRISTAL STREAMS - MULTIVIEW REPAIR 1682045' -ForegroundColor Cyan
Write-Host ' Restore clean source / existing Gradle wrapper' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

foreach ($p in @($root,$gradlew,$channels,$manifest,$gradle)) {
    if (-not (Test-Path $p)) { throw "Required working-source file not found: $p" }
}

# Restore the clean pre-MultiView backup created by the first 1682043 attempt.
$backup = Get-ChildItem -Path $root -Directory -Filter '_multiview_backup_*' |
    Where-Object { Test-Path (Join-Path $_.FullName 'ChannelsActivity.kt') } |
    Sort-Object Name |
    Select-Object -First 1
if (-not $backup) { throw 'No pre-MultiView backup folder was found. Stopping to protect the working source.' }

Write-Host "Restoring clean backup: $($backup.FullName)" -ForegroundColor Yellow
Copy-Item (Join-Path $backup.FullName 'ChannelsActivity.kt') $channels -Force
if (Test-Path (Join-Path $backup.FullName 'AndroidManifest.xml')) {
    Copy-Item (Join-Path $backup.FullName 'AndroidManifest.xml') $manifest -Force
}
if (Test-Path (Join-Path $backup.FullName 'build.gradle.kts')) {
    Copy-Item (Join-Path $backup.FullName 'build.gradle.kts') $gradle -Force
}

# Remove any MultiView source from previous failed attempts.
$multiPath = Join-Path $java 'MultiViewActivity.kt'
if (Test-Path $multiPath) { Remove-Item $multiPath -Force }

# Add a MultiView button dynamically to the existing Live TV header.
# This intentionally avoids changing either activity_channels.xml layout.
$channelsText = [System.IO.File]::ReadAllText($channels, [System.Text.Encoding]::UTF8)
$hookMarker = '        // Keep the known-good ListView ownership model: rows never steal touch/DPAD.'
if (-not $channelsText.Contains($hookMarker)) {
    throw 'Safe ChannelsActivity hook marker was not found. No source patch applied.'
}
$hook = @'
        val guideButtonForMulti = findViewById<Button>(R.id.guideButton)
        (guideButtonForMulti.parent as? LinearLayout)?.let { header ->
            val multiViewButton = Button(this).apply {
                text = "MULTI-VIEW"
                isAllCaps = false
                setTextColor(Color.WHITE)
                textSize = if (resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE) 9f else 8f
                background = getDrawable(R.drawable.bg_button)
                isFocusable = true
                isClickable = true
                setOnClickListener { startActivity(Intent(this@ChannelsActivity, MultiViewActivity::class.java)) }
            }
            val buttonWidth = if (resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE) 96.dp else 84.dp
            val params = LinearLayout.LayoutParams(buttonWidth, 42.dp).apply {
                marginEnd = if (resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE) 8.dp else 5.dp
            }
            header.addView(multiViewButton, header.indexOfChild(guideButtonForMulti), params)
        }

'@
$channelsText = $channelsText.Replace($hookMarker, $hook + $hookMarker)
[System.IO.File]::WriteAllText($channels, $channelsText, $utf8)

# Add MultiView activity using the same Xtream data and Media3 player stack already in the app.
$multiViewKt = @'
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

    private var categories: List<LiveCategory> = emptyList()
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

        for (n in 1..4) {
            header.addView(Button(this).apply {
                text = n.toString()
                setTextColor(Color.WHITE)
                setBackgroundColor(0xff6f0000.toInt())
                isFocusable = true
                setOnClickListener {
                    screenCount = n
                    if (activeTile >= n) activeTile = 0
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
            categories.getOrNull(position)?.let { loadStreams(it.id) }
        }
        channelList.setOnItemClickListener { _, _, position, _ ->
            val ch = channels.getOrNull(position) ?: return@setOnItemClickListener
            playChannel(activeTile, ch)
            activeTile = (activeTile + 1) % screenCount
            updateLabels()
        }

        rebuildPlayers()
    }

    private fun sectionTitle(textValue: String) = TextView(this).apply {
        text = textValue
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

        val pv = PlayerView(this).apply {
            useController = false
            setBackgroundColor(Color.BLACK)
            player = players[index]
        }
        views[index] = pv
        frame.addView(pv, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

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
                    status.text = "${loaded.size} channels - selected screen ${activeTile + 1}"
                }
            } catch (e: Exception) {
                runOnUiThread { showError(e.message ?: "Unable to load channels") }
            }
        }
    }

    private fun playChannel(index: Int, ch: LiveStream) {
        try {
            releaseTile(index)
            val renderers = DefaultRenderersFactory(this)
                .setExtensionRendererMode(DefaultRenderersFactory.EXTENSION_RENDERER_MODE_PREFER)
                .setEnableDecoderFallback(true)
            val p = ExoPlayer.Builder(this, renderers).build()
            players[index] = p
            views[index]?.player = p
            p.setMediaItem(MediaItem.fromUri(XtreamClient.streamUrl(credentials, ch)))
            p.prepare()
            p.playWhenReady = true
            labels[index]?.text = "SCREEN ${index + 1} - ${ch.name}"
            Toast.makeText(this, "Screen ${index + 1}: ${ch.name}", Toast.LENGTH_SHORT).show()
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
[System.IO.File]::WriteAllText($multiPath, $multiViewKt, $utf8)

# Add activity to the manifest using XML DOM instead of fragile quoted text replacement.
[xml]$doc = Get-Content -LiteralPath $manifest -Raw
$androidNs = 'http://schemas.android.com/apk/res/android'
$appNode = $doc.manifest.application
$already = $false
foreach ($node in $appNode.activity) {
    if ($node.GetAttribute('name', $androidNs) -eq '.MultiViewActivity') { $already = $true; break }
}
if (-not $already) {
    $activity = $doc.CreateElement('activity')
    $activity.SetAttribute('name', $androidNs, '.MultiViewActivity')
    $activity.SetAttribute('screenOrientation', $androidNs, 'landscape')
    [void]$appNode.AppendChild($activity)
}
$settings = New-Object System.Xml.XmlWriterSettings
$settings.Indent = $true
$settings.Encoding = $utf8
$writer = [System.Xml.XmlWriter]::Create($manifest, $settings)
$doc.Save($writer)
$writer.Close()

# Bump only version metadata. Leave dependencies and SDK settings unchanged.
$gradleText = [System.IO.File]::ReadAllText($gradle, [System.Text.Encoding]::UTF8)
$gradleText = [regex]::Replace($gradleText, 'versionCode\s*=\s*1682042', 'versionCode = 1682045')
$gradleText = [regex]::Replace($gradleText, 'versionCode\s*=\s*1682043', 'versionCode = 1682045')
$gradleText = [regex]::Replace($gradleText, 'versionCode\s*=\s*1682044', 'versionCode = 1682045')
$gradleText = [regex]::Replace($gradleText, 'versionName\s*=\s*"[^"]+"', 'versionName = "1.6.8-multiview-1682045"')
[System.IO.File]::WriteAllText($gradle, $gradleText, $utf8)

# Sanity checks before Gradle touches anything.
$verify = [System.IO.File]::ReadAllText($channels, [System.Text.Encoding]::UTF8)
if (-not $verify.Contains('MultiViewActivity::class.java')) { throw 'ChannelsActivity MultiView hook verification failed.' }
if ($verify.Contains('s├')) { throw 'Encoding corruption detected before build. Stopping.' }
if (-not (Test-Path $multiPath)) { throw 'MultiViewActivity source was not created.' }

Write-Host 'Source repaired and MultiView added safely.' -ForegroundColor Green
Write-Host 'Building with EXISTING Gradle wrapper...' -ForegroundColor Cyan
Push-Location $root
try {
    & $gradlew --no-daemon assembleDebug
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

$built = Join-Path $app 'build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $built)) { throw "Build reported success but APK was not found: $built" }
Copy-Item $built $outApk -Force

Write-Host ''
Write-Host '============================================================' -ForegroundColor Green
Write-Host ' BUILD SUCCESSFUL - MULTIVIEW 1682045' -ForegroundColor Green
Write-Host " APK: $outApk" -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
Write-Host ''
