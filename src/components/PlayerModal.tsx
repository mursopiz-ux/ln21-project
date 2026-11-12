import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, Settings, Server, Subtitles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Movie } from '../data/movies';

interface PlayerModalProps {
  movie: Movie | null;
  onClose: () => void;
  onNotify?: (message: string) => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({ movie, onClose, onNotify }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(15);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedServer, setSelectedServer] = useState(movie?.servers?.[0]?.name || 'Server Alpha (Jakarta CDN)');
  const [selectedQuality, setSelectedQuality] = useState(movie?.quality || '1080p FHD');
  const [selectedSubtitle, setSelectedSubtitle] = useState('Bahasa Indonesia');
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Video progress simulation
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 0.3));
    }, 500);
    return () => clearInterval(timer);
  }, [isPlaying]);

  if (!movie) return null;

  const currentSeconds = Math.floor((progress / 100) * (movie.durationMinutes * 60));
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleServerChange = (serverName: string) => {
    setSelectedServer(serverName);
    if (onNotify) onNotify(`Server dialihkan ke ${serverName}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 lg:p-6 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#121212] rounded-2xl border border-[#2B2B2B] overflow-hidden shadow-2xl flex flex-col my-auto">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#181818] border-b border-[#282828]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-pulse" />
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-white truncate max-w-xs sm:max-w-md">
                {movie.title}
              </h3>
              <p className="text-[11px] text-[#A5A5A5]">
                {movie.year} · {movie.genres.join(', ')} · Sedang Diputar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              Stream Bebas Iklan LN21
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#222222] hover:bg-[#333333] text-[#A5A5A5] hover:text-white transition-colors"
              aria-label="Tutup Pemutar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Screen Simulation */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group">
          {/* Backdrop Still */}
          <img
            src={movie.bannerImage || movie.posterImage}
            alt={movie.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter brightness-75"
          />

          {/* Film Title Watermark / LN21 Logo */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none opacity-80">
            <div className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[11px] font-extrabold font-display">
              LN21 HD
            </div>
            <span className="text-xs text-white/70 font-mono tracking-widest hidden sm:inline">
              LIVE BUFFER {selectedQuality}
            </span>
          </div>

          {/* Center Play/Pause Overlay Animation Indicator */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute z-20 w-16 h-16 rounded-full bg-black/60 hover:bg-[#E50914] text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all transform hover:scale-110 active:scale-95 shadow-xl"
            aria-label={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-1" />
            )}
          </button>

          {/* Subtitles text simulation */}
          {selectedSubtitle !== 'Mati' && (
            <div className="absolute bottom-16 inset-x-8 z-20 text-center pointer-events-none">
              <span className="inline-block px-3 py-1 rounded bg-black/75 text-white text-xs sm:text-sm font-medium tracking-wide border border-black/50 shadow">
                {selectedSubtitle === 'Bahasa Indonesia'
                  ? `"${movie.synopsis.slice(0, 75)}..."`
                  : `"The ancient mountain winds speak to those who listen carefully..."`}
              </span>
            </div>
          )}

          {/* Bottom Player Controller Bar */}
          <div className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent pt-8 pb-3 px-4 sm:px-6">
            
            {/* Scrubber Progress Bar */}
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                setProgress(Math.max(0, Math.min(100, pos * 100)));
              }}
              className="relative w-full h-1.5 hover:h-2.5 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-all mb-3 group/scrubber"
            >
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#E50914] rounded-full flex items-center justify-end"
                style={{ width: `${progress}%` }}
              >
                <div className="w-3 h-3 rounded-full bg-white shadow-md transform scale-0 group-hover/scrubber:scale-100 transition-transform" />
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white text-xs sm:text-sm">
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="hover:text-[#E50914] transition-colors p-1"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                <button
                  onClick={() => setProgress(Math.max(0, progress - 5))}
                  className="hover:text-white text-[#A5A5A5] transition-colors p-1"
                  title="Mundur 10 detik"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="hover:text-[#E50914] transition-colors p-1"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-16 sm:w-20 accent-[#E50914] h-1 bg-white/30 rounded cursor-pointer"
                  />
                </div>

                {/* Time Display */}
                <div className="text-[11px] sm:text-xs font-mono text-[#CCCCCC]">
                  <span>{formatTime(currentSeconds)}</span>
                  <span className="text-[#666666] mx-1">/</span>
                  <span>{movie.duration}</span>
                </div>
              </div>

              {/* Right Side Settings */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    showSettings ? 'bg-[#E50914] text-white border-[#E50914]' : 'bg-black/50 text-[#A5A5A5] hover:text-white border-white/20'
                  }`}
                  title="Pengaturan Streaming"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg bg-black/50 text-[#A5A5A5] hover:text-white border border-white/20 transition-colors"
                  title="Layar Penuh"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Streaming Server & Quality Options (Classic LK21 Practicality with Modern Design) */}
        <div className="p-4 sm:p-5 bg-[#161616] border-t border-[#262626] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Server Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A5A5A5] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#E50914]" />
                Pilih Server Streaming:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { name: 'Server Alpha (Jakarta CDN)', speed: 'Super Cepat', ping: '12ms' },
                  { name: 'Server Beta (Surabaya FHD)', speed: 'Stabil 1080p', ping: '24ms' },
                  { name: 'Server Gamma (Cloud SG)', speed: 'Cadangan Multi-CDN', ping: '38ms' }
                ].map((srv) => {
                  const isCur = selectedServer === srv.name;
                  return (
                    <button
                      key={srv.name}
                      onClick={() => handleServerChange(srv.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 ${
                        isCur
                          ? 'bg-[#E50914] text-white border-[#E50914] shadow-sm'
                          : 'bg-[#1F1F1F] text-[#CCCCCC] hover:text-white border-[#333333]'
                      }`}
                    >
                      <span>{srv.name}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                        isCur ? 'bg-black/30 text-white' : 'text-emerald-400 bg-emerald-950/40'
                      }`}>
                        {srv.ping}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quality & Subtitle Selectors */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              {/* Quality */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#888888] mb-1">
                  Resolusi
                </span>
                <select
                  value={selectedQuality}
                  onChange={(e) => {
                    setSelectedQuality(e.target.value);
                    if (onNotify) onNotify(`Resolusi diubah ke ${e.target.value}`);
                  }}
                  className="bg-[#202020] text-xs text-white border border-[#333333] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#E50914]"
                >
                  <option value="4K UHD">4K UHD</option>
                  <option value="1080p FHD">1080p FHD</option>
                  <option value="720p HD">720p HD</option>
                  <option value="480p SD">480p Hemat Kuota</option>
                </select>
              </div>

              {/* Subtitles */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#888888] mb-1">
                  Subtitle
                </span>
                <select
                  value={selectedSubtitle}
                  onChange={(e) => setSelectedSubtitle(e.target.value)}
                  className="bg-[#202020] text-xs text-white border border-[#333333] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#E50914]"
                >
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="English">English</option>
                  <option value="Mati">Nonaktifkan</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
