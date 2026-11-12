/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Settings,
  Subtitles,
  ShieldCheck,
  Check,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

interface LN21PlayerProps {
  src: string; // HLS (.m3u8) or MP4 URL
  poster?: string;
  title: string;
  movieId: string;
  userId?: string;
  initialTime?: number;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export const LN21Player: React.FC<LN21PlayerProps> = ({
  src,
  poster,
  title,
  movieId,
  userId = 'guest_user',
  initialTime = 0,
  autoPlay = true,
  onTimeUpdate,
  onEnded
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Player States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);

  // Settings Menu States
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState<boolean>(false);
  const [availableQualities, setAvailableQualities] = useState<{ id: number; label: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('Auto (Adaptif)');
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('Bahasa Indonesia');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Resume prompt
  const [resumePrompt, setResumePrompt] = useState<number | null>(initialTime > 15 ? initialTime : null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize HLS or Native Player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsSource = src.includes('.m3u8') || src.includes('/manifest/video.m3u8');

    if (isHlsSource && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsBuffering(false);
        const levels = data.levels.map((lvl, index) => ({
          id: index,
          label: `${lvl.height}p (${Math.round(lvl.bitrate / 1000)} kbps)`
        }));
        setAvailableQualities([{ id: -1, label: 'Auto (Adaptif)' }, ...levels]);

        if (initialTime > 0) {
          video.currentTime = initialTime;
        }

        if (autoPlay) {
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const level = hls.levels[data.level];
        if (level) {
          setCurrentQuality(`${level.height}p`);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      video.src = src;
      if (initialTime > 0) video.currentTime = initialTime;
      if (autoPlay) {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    } else {
      // Direct MP4 fallback
      video.src = src;
      if (initialTime > 0) video.currentTime = initialTime;
      if (autoPlay) {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay, initialTime]);

  // 2. Sync Periodic Watch History to Server
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (videoRef.current && isPlaying && currentTime > 5 && duration > 0) {
        api.saveWatchPosition(userId, movieId, currentTime, duration);
      }
    }, 8000);

    return () => {
      clearInterval(saveInterval);
      if (videoRef.current && currentTime > 5 && duration > 0) {
        api.saveWatchPosition(userId, movieId, currentTime, duration);
      }
    };
  }, [userId, movieId, currentTime, duration, isPlaying]);

  // 3. Desktop Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          seekBy(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(Math.min(100, volume + 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(Math.max(0, volume - 10));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Controls auto-hide on inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettings(false);
        setShowSubtitlesMenu(false);
      }
    }, 3500);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const changeVolume = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    setVolume(newVol);
    video.volume = newVol / 100;
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    video.muted = nextMuted;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleQualityChange = (levelId: number, label: string) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
      setCurrentQuality(label);
    }
    setShowSettings(false);
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
    setShowSettings(false);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl select-none group border border-[#222222]"
    >
      {/* HTML5 Video element */}
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        onClick={togglePlay}
        onTimeUpdate={() => {
          if (videoRef.current) {
            const cur = videoRef.current.currentTime;
            const dur = videoRef.current.duration || 0;
            setCurrentTime(cur);
            setDuration(dur);
            onTimeUpdate?.(cur, dur);
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-20">
          <div className="w-12 h-12 border-3 border-[#E50914] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Resume Watching Prompt */}
      {resumePrompt && (
        <div className="absolute top-4 left-4 z-30 bg-[#141414]/95 border border-[#D4AF37]/50 rounded-xl p-3 max-w-sm text-white shadow-xl animate-fadeIn backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-bold mb-1">
            <Sparkles className="w-4 h-4" />
            Lanjutkan Menonton
          </div>
          <p className="text-xs text-[#CCCCCC] mb-2.5">
            Anda sebelumnya menonton hingga <strong className="text-white">{formatTime(resumePrompt)}</strong>.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = resumePrompt;
                setResumePrompt(null);
                togglePlay();
              }}
              className="px-3 py-1 text-xs font-bold bg-[#E50914] text-white rounded-lg hover:bg-[#b80610]"
            >
              Lanjutkan ({formatTime(resumePrompt)})
            </button>
            <button
              onClick={() => setResumePrompt(null)}
              className="px-2.5 py-1 text-xs bg-[#222222] text-[#888888] hover:text-white rounded-lg"
            >
              Mulai dari Awal
            </button>
          </div>
        </div>
      )}

      {/* Top Bar (Title & LN21 Badge) */}
      <div
        className={`absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 sm:p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#E50914] to-[#78040A] text-white font-extrabold text-xs shadow-md">
              LN
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-display font-bold text-white truncate max-w-sm sm:max-w-xl">
                {title}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-[#A5A5A5]">
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Cloudflare Stream CDN
                </span>
                <span>·</span>
                <span>{currentQuality}</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-white/10 text-xs text-[#CCCCCC]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Kualitas Adaptif Aktif</span>
          </div>
        </div>
      </div>

      {/* Center Big Play Button (when paused) */}
      {!isPlaying && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <button
            onClick={togglePlay}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#E50914]/90 text-white flex items-center justify-center shadow-2xl glow-red pointer-events-auto transform hover:scale-110 active:scale-95 transition-all"
            aria-label="Putar"
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1" />
          </button>
        </div>
      )}

      {/* Subtitle simulation banner */}
      {currentSubtitle !== 'Nonaktif' && isPlaying && (
        <div className="absolute bottom-16 sm:bottom-20 inset-x-8 z-15 text-center pointer-events-none">
          <span className="inline-block px-3 py-1 bg-black/80 rounded-md text-white text-xs sm:text-sm font-medium border border-black/40 shadow-lg">
            {currentSubtitle === 'Bahasa Indonesia'
              ? 'Terima kasih telah menonton sinema independen di Layar Nusantara 21.'
              : 'Streaming independent cinema directly inside Layar Nusantara 21.'}
          </span>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black via-black/85 to-transparent pt-10 pb-3 px-4 sm:px-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            if (videoRef.current && duration > 0) {
              videoRef.current.currentTime = pos * duration;
            }
          }}
          className="relative w-full h-1.5 hover:h-3 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-all mb-3 group/bar"
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-[#E50914] rounded-full flex items-center justify-end"
            style={{ width: `${progressPct}%` }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md transform scale-0 group-hover/bar:scale-100 transition-transform" />
          </div>
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-white text-xs sm:text-sm">
          
          {/* Left: Play, Skip, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={togglePlay}
              className="p-1 hover:text-[#E50914] transition-colors"
              title={isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={() => seekBy(-10)}
              className="p-1 text-[#CCCCCC] hover:text-white transition-colors"
              title="Mundur 10 detik (←)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => seekBy(10)}
              className="p-1 text-[#CCCCCC] hover:text-white transition-colors"
              title="Maju 10 detik (→)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1 hover:text-[#E50914] transition-colors"
                title={isMuted ? 'Buka Suara (M)' : 'Bisukan (M)'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="w-14 sm:w-20 accent-[#E50914] h-1 bg-white/30 rounded cursor-pointer hidden sm:block"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-[11px] sm:text-xs font-mono text-[#CCCCCC]">
              <span>{formatTime(currentTime)}</span>
              <span className="text-[#666666] mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Subtitles, Settings, Fullscreen */}
          <div className="relative flex items-center gap-2 sm:gap-3">
            
            {/* Subtitles Toggle */}
            <button
              onClick={() => {
                setShowSubtitlesMenu(!showSubtitlesMenu);
                setShowSettings(false);
              }}
              className={`p-1.5 rounded-lg border transition-colors ${
                showSubtitlesMenu ? 'bg-[#E50914] text-white border-[#E50914]' : 'bg-black/50 text-[#A5A5A5] hover:text-white border-white/10'
              }`}
              title="Pilihan Subtitle"
            >
              <Subtitles className="w-4 h-4" />
            </button>

            {/* Subtitles Popover */}
            {showSubtitlesMenu && (
              <div className="absolute bottom-12 right-12 z-40 w-44 bg-[#181818] border border-[#2E2E2E] rounded-xl p-2 shadow-2xl text-xs space-y-1">
                <span className="block px-2 py-1 text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                  Subtitle
                </span>
                {['Bahasa Indonesia', 'English', 'Nonaktif'].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => {
                      setCurrentSubtitle(sub);
                      setShowSubtitlesMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                      currentSubtitle === sub ? 'bg-[#E50914] text-white font-semibold' : 'text-[#CCCCCC] hover:bg-[#222222]'
                    }`}
                  >
                    <span>{sub}</span>
                    {currentSubtitle === sub && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}

            {/* Quality & Speed Settings Toggle */}
            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setShowSubtitlesMenu(false);
              }}
              className={`p-1.5 rounded-lg border transition-colors ${
                showSettings ? 'bg-[#E50914] text-white border-[#E50914]' : 'bg-black/50 text-[#A5A5A5] hover:text-white border-white/10'
              }`}
              title="Pengaturan Streaming"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Settings Popover */}
            {showSettings && (
              <div className="absolute bottom-12 right-6 z-40 w-52 bg-[#181818] border border-[#2E2E2E] rounded-xl p-2.5 shadow-2xl text-xs space-y-3">
                {/* Quality options */}
                <div className="space-y-1">
                  <span className="block px-1 text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                    Resolusi Video (HLS)
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-0.5 no-scrollbar">
                    {availableQualities.length > 0 ? (
                      availableQualities.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => handleQualityChange(q.id, q.label)}
                          className={`w-full flex items-center justify-between px-2 py-1 rounded text-left ${
                            currentQuality === q.label ? 'bg-[#E50914] text-white font-medium' : 'text-[#CCCCCC] hover:bg-[#222222]'
                          }`}
                        >
                          <span>{q.label}</span>
                          {currentQuality === q.label && <Check className="w-3 h-3" />}
                        </button>
                      ))
                    ) : (
                      <span className="text-[#666666] text-[11px] px-1">1080p Full HD</span>
                    )}
                  </div>
                </div>

                {/* Speed options */}
                <div className="pt-2 border-t border-[#262626] space-y-1">
                  <span className="block px-1 text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                    Kecepatan Putar
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {[0.75, 1, 1.25, 1.5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => handleSpeedChange(spd)}
                        className={`py-1 rounded text-center font-mono text-[11px] ${
                          playbackSpeed === spd ? 'bg-[#E50914] text-white font-bold' : 'bg-[#222222] text-[#888888] hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-black/50 text-[#A5A5A5] hover:text-white border border-white/10 transition-colors"
              title="Layar Penuh (F)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
