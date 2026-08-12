package com.kristalstreams.player

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.ui.PlayerView
import java.util.concurrent.Executors

class PlayerActivity : AppCompatActivity() {
    private var player: ExoPlayer? = null
    private val executor = Executors.newSingleThreadExecutor()
    private val handler = Handler(Looper.getMainLooper())
    private var url: String = ""
    private var name: String = "Kristal Streams"
    private var kind: String = "video"
    private var resumeMs: Long = 0
    private var retryCount = 0
    private var retryRunnable: Runnable? = null

    private val listener = object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
            when (playbackState) {
                Player.STATE_BUFFERING -> showLoading("Buffering…")
                Player.STATE_READY -> {
                    retryCount = 0
                    hideStatus()
                }
                Player.STATE_ENDED -> hideStatus()
                Player.STATE_IDLE -> Unit
            }
        }

        override fun onPlayerError(error: PlaybackException) {
            handlePlaybackError(error)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_player)
        name = intent.getStringExtra("name") ?: "Kristal Streams"
        url = intent.getStringExtra("url") ?: ""
        kind = intent.getStringExtra("kind") ?: "video"
        resumeMs = intent.getLongExtra("resumeMs", 0)
        findViewById<TextView>(R.id.channelName).text = name
        findViewById<Button>(R.id.retryButton).setOnClickListener {
            retryCount = 0
            startPlayback(forceRestart = kind == "live")
        }
        val streamId = intent.getIntExtra("streamId", -1)
        if (kind == "live" && streamId > 0) loadEpg(streamId) else findViewById<TextView>(R.id.nowNext).visibility = View.GONE
    }

    private fun loadEpg(streamId: Int) {
        val c = Session.load(this) ?: return
        executor.execute {
            try {
                val epg = XtreamClient.shortEpg(c, streamId, 2)
                runOnUiThread {
                    val label = findViewById<TextView>(R.id.nowNext)
                    if (epg.isEmpty()) label.visibility = View.GONE
                    else {
                        val now = epg.getOrNull(0)?.title ?: "Live"
                        val next = epg.getOrNull(1)?.title
                        label.text = if (next.isNullOrBlank()) "NOW  •  $now" else "NOW  •  $now     NEXT  •  $next"
                        label.visibility = View.VISIBLE
                    }
                }
            } catch (_: Exception) {
                runOnUiThread { findViewById<TextView>(R.id.nowNext).visibility = View.GONE }
            }
        }
    }

    override fun onStart() {
        super.onStart()
        startPlayback(forceRestart = false)
    }

    private fun startPlayback(forceRestart: Boolean) {
        retryRunnable?.let { handler.removeCallbacks(it) }
        retryRunnable = null
        if (url.isBlank()) {
            showError("This stream does not have a playable URL.")
            return
        }
        if (!NetworkState.isOnline(this)) {
            showError("No internet connection. Check Wi-Fi or Ethernet, then choose Retry.")
            return
        }

        val oldPosition = if (!forceRestart && kind != "live") player?.currentPosition ?: resumeMs else if (forceRestart) 0L else resumeMs
        player?.removeListener(listener)
        player?.release()
        player = null

        try {
            val httpFactory = DefaultHttpDataSource.Factory()
                .setUserAgent("KristalStreams/1.6.8 Android")
                .setAllowCrossProtocolRedirects(true)
                .setConnectTimeoutMs(15_000)
                .setReadTimeoutMs(45_000)
                .setDefaultRequestProperties(
                    mapOf(
                        "Accept" to "*/*",
                        "Connection" to "keep-alive"
                    )
                )

            val mediaSourceFactory = DefaultMediaSourceFactory(httpFactory)
            val newPlayer = ExoPlayer.Builder(this)
                .setMediaSourceFactory(mediaSourceFactory)
                .build()
            player = newPlayer
            findViewById<PlayerView>(R.id.playerView).player = newPlayer
            newPlayer.addListener(listener)

            val mediaItemBuilder = MediaItem.Builder().setUri(url)
            val normalizedUrl = url.substringBefore('?').lowercase()
            if (normalizedUrl.endsWith(".m3u8")) {
                mediaItemBuilder.setMimeType(MimeTypes.APPLICATION_M3U8)
            }
            newPlayer.setMediaItem(mediaItemBuilder.build())
            newPlayer.prepare()
            if (oldPosition > 0 && kind != "live") newPlayer.seekTo(oldPosition)
            newPlayer.playWhenReady = true
            showLoading("Connecting…")
        } catch (t: Throwable) {
            player?.removeListener(listener)
            player?.release()
            player = null
            val detail = t.message?.takeIf { it.isNotBlank() }
                ?: "The player could not start this stream."
            showError("Player startup failed.\n$detail")
        }
    }

    private fun handlePlaybackError(error: PlaybackException) {
        if (!NetworkState.isOnline(this)) {
            showError("Connection lost. Reconnect to the internet, then choose Retry.")
            return
        }

        if (PlayerPrefs.autoRetry(this) && retryCount < 2) {
            retryCount++
            val seconds = retryCount * 2L
            showLoading("Stream interrupted • reconnecting in ${seconds}s…")
            retryRunnable = Runnable { startPlayback(forceRestart = kind == "live") }.also {
                handler.postDelayed(it, seconds * 1000L)
            }
        } else {
            val detail = when (error.errorCode) {
                PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED,
                PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT -> "The stream server could not be reached."
                PlaybackException.ERROR_CODE_PARSING_CONTAINER_UNSUPPORTED,
                PlaybackException.ERROR_CODE_DECODING_FORMAT_UNSUPPORTED -> "This stream format is not supported on this device."
                else -> "The stream could not be played right now."
            }
            val diagnostic = error.cause?.message?.takeIf { it.isNotBlank() } ?: error.message
            showError(
                buildString {
                    append(detail)
                    append("\nError code: ${error.errorCode}")
                    if (!diagnostic.isNullOrBlank()) append("\n${diagnostic.take(180)}")
                    append("\nChoose Retry, or try another title/channel.")
                }
            )
        }
    }

    private fun showLoading(message: String) {
        findViewById<View>(R.id.statusOverlay).visibility = View.VISIBLE
        findViewById<ProgressBar>(R.id.loadingSpinner).visibility = View.VISIBLE
        findViewById<TextView>(R.id.statusText).text = message
        findViewById<Button>(R.id.retryButton).visibility = View.GONE
    }

    private fun showError(message: String) {
        findViewById<View>(R.id.statusOverlay).visibility = View.VISIBLE
        findViewById<ProgressBar>(R.id.loadingSpinner).visibility = View.GONE
        findViewById<TextView>(R.id.statusText).text = message
        findViewById<Button>(R.id.retryButton).apply {
            visibility = View.VISIBLE
            requestFocus()
        }
    }

    private fun hideStatus() {
        findViewById<View>(R.id.statusOverlay).visibility = View.GONE
    }

    override fun onStop() {
        retryRunnable?.let { handler.removeCallbacks(it) }
        retryRunnable = null
        val p = player
        if (p != null && kind != "live" && url.isNotBlank() && PlayerPrefs.saveProgress(this)) {
            val position = p.currentPosition.coerceAtLeast(0)
            val duration = p.duration.coerceAtLeast(0)
            if (position >= 15_000L && (duration <= 0L || position < duration - 10_000L)) {
                ContinueWatching.save(this, ContinueItem(name, url, position, duration, kind, System.currentTimeMillis()))
            }
        }
        findViewById<PlayerView>(R.id.playerView).player = null
        p?.removeListener(listener)
        p?.release()
        player = null
        super.onStop()
    }

    override fun onDestroy() {
        retryRunnable?.let { handler.removeCallbacks(it) }
        executor.shutdownNow()
        super.onDestroy()
    }
}
