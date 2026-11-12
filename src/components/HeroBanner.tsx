import React, { useState, useEffect } from 'react';
import { Play, Info, ChevronLeft, ChevronRight, Star, Bookmark, Volume2, VolumeX, Award } from 'lucide-react';
import { Movie } from '../data/movies';

interface HeroBannerProps {
  movies: Movie[];
  onWatchNow: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  onToggleWatchlist: (movie: Movie) => void;
  isWatchlisted: (movieId: string) => boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movies,
  onWatchNow,
  onOpenDetails,
  onToggleWatchlist,
  isWatchlisted
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const activeMovie = movies[currentIndex] || movies[0];

  // Auto-advance slides every 7 seconds when not paused
  useEffect(() => {
    if (isPaused || movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPaused, movies.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  if (!activeMovie) return null;

  const inWatchlist = isWatchlisted(activeMovie.id);

  return (
    <div
      className="relative w-full h-[520px] sm:h-[600px] lg:h-[680px] bg-[#090909] overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image Layer with Zoom transition */}
      <div className="absolute inset-0 z-0">
        <img
          src={activeMovie.bannerImage || activeMovie.posterImage}
          alt={activeMovie.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transform scale-100 transition-all duration-1000 ease-out"
        />

        {/* Gradient Scrims: Multi-layer for perfect typographic legibility */}
        {/* Dark to bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/60 to-black/30" />
        {/* Dark to right for text side */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#090909] via-[#090909]/80 to-transparent" />
        {/* Top subtle fade */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#090909]/80 to-transparent" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-2xl lg:max-w-3xl space-y-3 sm:space-y-4">
          
          {/* Top Kicker / Badge */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#E50914] text-white font-bold text-[11px] uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              PILIHAN UTAMA LN21
            </span>

            {activeMovie.awards && activeMovie.awards[0] && (
              <span className="inline-flex items-center gap-1 text-[#D4AF37] font-medium text-xs bg-[#1C1C1C]/90 px-2.5 py-1 rounded border border-[#D4AF37]/30 backdrop-blur-sm">
                <Award className="w-3.5 h-3.5" />
                <span className="truncate max-w-[280px] sm:max-w-none">{activeMovie.awards[0]}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-[1.08] text-balance">
            {activeMovie.title}
          </h1>

          {/* Clean Unboxed Metadata (Zero-pill discipline) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#A5A5A5]">
            <span className="flex items-center gap-1 text-[#D4AF37] font-semibold">
              <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
              {activeMovie.rating.toFixed(1)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-white font-medium">{activeMovie.year}</span>
            <span aria-hidden="true">·</span>
            <span>{activeMovie.duration}</span>
            <span aria-hidden="true">·</span>
            <span>{activeMovie.genres.join(', ')}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded border border-[#444444] text-[#E0E0E0] bg-[#151515]">
              {activeMovie.quality}
            </span>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded border border-[#444444] text-[#E0E0E0] bg-[#151515]">
              {activeMovie.ageRating}
            </span>
          </div>

          {/* Short Synopsis */}
          <p className="text-sm sm:text-base text-[#D0D0D0] leading-relaxed line-clamp-3 sm:line-clamp-3 max-w-2xl">
            {activeMovie.synopsis}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Primary Watch Now Button */}
            <button
              onClick={() => onWatchNow(activeMovie)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#c90711] text-white font-bold text-sm sm:text-base shadow-lg shadow-red-900/40 glow-red transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Tonton Sekarang</span>
            </button>

            {/* Secondary Details Button */}
            <button
              onClick={() => onOpenDetails(activeMovie)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1C1C1C]/90 hover:bg-[#252525] border border-[#3A3A3A] text-white font-semibold text-sm sm:text-base backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Info className="w-5 h-5 text-[#A5A5A5]" />
              <span>Detail Film</span>
            </button>

            {/* Watchlist Quick Toggle */}
            <button
              onClick={() => onToggleWatchlist(activeMovie)}
              className={`p-3 rounded-xl border transition-all ${
                inWatchlist
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                  : 'bg-[#1C1C1C]/90 border-[#3A3A3A] text-[#A5A5A5] hover:text-white hover:border-[#555]'
              }`}
              title={inWatchlist ? 'Hapus dari Watchlist' : 'Simpan ke Watchlist'}
            >
              <Bookmark className={`w-5 h-5 ${inWatchlist ? 'fill-[#D4AF37]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Navigation Controls & Indicators */}
      <div className="absolute right-4 sm:right-8 bottom-6 sm:bottom-12 z-20 flex items-center gap-3">
        {/* Sound toggle ambient demo */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white backdrop-blur-md transition-colors"
          title={isMuted ? 'Buka Suara Preview' : 'Bisukan Preview'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Prev / Next Arrows */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-full border border-white/20 backdrop-blur-md">
          <button
            onClick={handlePrev}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 text-white transition-colors"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          {/* Indicators */}
          <div className="flex items-center gap-1.5 px-2">
            {movies.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-6 bg-[#E50914]'
                    : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Buka slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 text-white transition-colors"
            aria-label="Slide berikutnya"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
