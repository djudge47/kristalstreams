import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoplay?: boolean;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = memo(({
  src,
  poster,
  title,
  autoplay = false,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isHLS = src.includes('.m3u8');

    if (isHLS) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          if (autoplay) {
            video.play().catch(() => setIsPlaying(false));
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('Network error - attempting to recover');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('Media error - attempting to recover');
                hls.recoverMediaError();
                break;
              default:
                setError('Fatal error - cannot recover');
                hls.destroy();
                break;
            }
          }
        });

        return () => {
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        setIsLoading(false);
        if (autoplay) {
          video.play().catch(() => setIsPlaying(false));
        }
      } else {
        setError('HLS is not supported in this browser');
        setIsLoading(false);
      }
    } else {
      video.src = src;
      setIsLoading(false);
      if (autoplay) {
        video.play().catch(() => setIsPlaying(false));
      }
    }
  }, [src, autoplay]);

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

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
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
