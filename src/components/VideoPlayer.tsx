import React, { useEffect, useRef, useState, memo } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoplay?: boolean;
  authToken?: string;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = memo(({
  src,
  poster,
  title,
  autoplay = false,
  authToken,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [sessionAuthToken, setSessionAuthToken] = useState<string | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveAuthToken = authToken || sessionAuthToken;
  const usesSecureRelay = resolvedSrc.includes('/api/stream');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSessionAuthToken(data.session?.access_token);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSessionAuthToken(session?.access_token);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const resolveStreamSource = async () => {
      setError(null);
      setIsLoading(true);

      if (!src.startsWith('http://')) {
        setResolvedSrc(src);
        return;
      }

      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('id')
        .eq('stream_url', src)
        .single();

      if (!mounted) return;

      if (channelError || !channel?.id) {
        setError('This channel could not be verified in the channel database.');
        setIsLoading(false);
        return;
      }

      setResolvedSrc(`/api/stream?channel=${encodeURIComponent(String(channel.id))}`);
    };

    resolveStreamSource();

    return () => {
      mounted = false;
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const relayCheckController = new AbortController();

    const resetPlayer = () => {
      setError(null);
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    const readRelayError = async (response: Response): Promise<string> => {
      const fallback = `Secure stream relay failed with status ${response.status}.`;

      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const body = await response.json() as { error?: string };
          return body.error || fallback;
        }

        const text = (await response.text()).trim();
        if (text && !text.startsWith('<!DOCTYPE html')) {
          return text.slice(0, 240);
        }
      } catch {
        return fallback;
      }

      return fallback;
    };

    const startPlayback = async () => {
      resetPlayer();

      if (usesSecureRelay && !effectiveAuthToken) {
        return;
      }

      if (usesSecureRelay && effectiveAuthToken) {
        try {
          const relayResponse = await fetch(resolvedSrc, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${effectiveAuthToken}`,
              Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, */*',
            },
            cache: 'no-store',
            signal: relayCheckController.signal,
          });

          if (!relayResponse.ok) {
            const message = await readRelayError(relayResponse);
            if (!cancelled) {
              setError(message);
              setIsLoading(false);
            }
            return;
          }

          const contentType = relayResponse.headers.get('content-type') || '';
          const playlistText = await relayResponse.text();
          const looksLikePlaylist =
            contentType.includes('mpegurl') ||
            contentType.includes('m3u8') ||
            playlistText.trimStart().startsWith('#EXTM3U');

          if (!looksLikePlaylist) {
            if (!cancelled) {
              setError('The provider did not return a valid HLS playlist.');
              setIsLoading(false);
            }
            return;
          }
        } catch (relayError) {
          if (cancelled || relayCheckController.signal.aborted) return;
          const message = relayError instanceof Error ? relayError.message : 'The secure stream relay could not be reached.';
          setError(`Secure relay check failed: ${message}`);
          setIsLoading(false);
          return;
        }
      }

      if (cancelled) return;

      const isHLS = resolvedSrc.includes('.m3u8') || usesSecureRelay;

      if (isHLS) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
            xhrSetup: (xhr) => {
              xhr.withCredentials = false;
              if (usesSecureRelay && effectiveAuthToken) {
                xhr.setRequestHeader('Authorization', `Bearer ${effectiveAuthToken}`);
              }
            }
          });

          hlsRef.current = hls;
          hls.loadSource(resolvedSrc);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setError(null);
            setIsLoading(false);
            if (autoplay) {
              video.play().catch(() => setIsPlaying(false));
            }
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;

            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              setError(`Media playback error: ${data.details}. Retrying...`);
              hls.recoverMediaError();
              return;
            }

            const statusCode = data.response?.code;
            const statusText = data.response?.text;
            const detail = statusText || data.details || 'Unknown stream error';
            setError(statusCode ? `Stream request failed (${statusCode}): ${detail}` : `Stream request failed: ${detail}`);
            setIsLoading(false);
            hls.destroy();
          });

          return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          if (usesSecureRelay) {
            setError('Secure Live TV playback is not supported in this browser.');
            setIsLoading(false);
          } else {
            video.src = resolvedSrc;
            setIsLoading(false);
            if (autoplay) {
              video.play().catch(() => setIsPlaying(false));
            }
          }
          return;
        }

        setError('HLS is not supported in this browser');
        setIsLoading(false);
        return;
      }

      video.src = resolvedSrc;
      setIsLoading(false);
      if (autoplay) {
        video.play().catch(() => setIsPlaying(false));
      }
    };

    startPlayback();

    return () => {
      cancelled = true;
      relayCheckController.abort();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [resolvedSrc, autoplay, effectiveAuthToken, usesSecureRelay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onEnded]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => setIsPlaying(false));
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(!video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setQuality(level === -1 ? 'auto' : `${hlsRef.current.levels[level].height}p`);
      setShowQualityMenu(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group aspect-video"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(isPlaying ? false : true)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        playsInline
        onClick={togglePlay}
      />

      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center px-6 max-w-2xl">
            <p className="text-red-500 mb-4 break-words">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {title && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <h3 className="text-white text-lg font-medium">{title}</h3>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="px-4 pt-8 pb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
            }}
          />

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                className="text-white hover:text-primary transition-colors"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>

              <div className="flex items-center space-x-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-primary transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-20 transition-all duration-200 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="text-white hover:text-primary transition-colors"
                >
                  <Settings size={20} />
                </button>
                {showQualityMenu && hlsRef.current && (
                  <div className="absolute bottom-full right-0 mb-2 bg-dark-100 rounded-lg shadow-lg py-2 min-w-[120px]">
                    <button
                      onClick={() => handleQualityChange(-1)}
                      className="w-full px-4 py-2 text-left text-white hover:bg-dark-200 transition-colors"
                    >
                      Auto
                    </button>
                    {hlsRef.current.levels.map((level, index) => (
                      <button
                        key={index}
                        onClick={() => handleQualityChange(index)}
                        className="w-full px-4 py-2 text-left text-white hover:bg-dark-200 transition-colors"
                      >
                        {level.height}p
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-primary transition-colors"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;