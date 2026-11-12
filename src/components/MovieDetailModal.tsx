import React, { useState } from 'react';
import { X, Play, Star, Bookmark, Share2, Award, Clock, Calendar, User, Film, Check } from 'lucide-react';
import { Movie } from '../data/movies';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  onWatch: (movie: Movie) => void;
  onToggleWatchlist: (movie: Movie) => void;
  isWatchlisted: boolean;
  onNotify?: (message: string) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onClose,
  onWatch,
  onToggleWatchlist,
  isWatchlisted,
  onNotify
}) => {
  const [copied, setCopied] = useState(false);

  if (!movie) return null;

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopied(true);
    if (onNotify) onNotify('Tautan film berhasil disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#141414] rounded-2xl border border-[#2A2A2A] overflow-hidden shadow-2xl my-auto text-white">
        
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 backdrop-blur-sm transition-colors"
          aria-label="Tutup Detail"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="relative h-60 sm:h-72 w-full overflow-hidden">
          <img
            src={movie.bannerImage || movie.posterImage}
            alt={movie.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-90"
          />
          {/* Gradient Scrims */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/90 via-transparent to-black/30" />

          {/* Quick Play Trailer Button Floating on Backdrop */}
          <div className="absolute bottom-6 left-6 flex items-center gap-3">
            <button
              onClick={() => onWatch(movie)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80610] text-white font-bold text-sm shadow-lg shadow-red-950/60 glow-red transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Putar Film Sekarang</span>
            </button>
          </div>
        </div>

        {/* Details Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Title & Tagline */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E50914] bg-[#E50914]/10 px-2 py-0.5 rounded border border-[#E50914]/30">
                {movie.quality}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A5A5A5] bg-[#222222] px-2 py-0.5 rounded">
                {movie.ageRating}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A5A5A5] bg-[#222222] px-2 py-0.5 rounded">
                {movie.country}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
              {movie.title}
            </h2>

            {movie.tagline && (
              <p className="text-sm text-[#D4AF37] italic font-medium">
                "{movie.tagline}"
              </p>
            )}
          </div>

          {/* Unboxed Metadata Line */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#A5A5A5] pb-2 border-b border-[#242424]">
            <span className="flex items-center gap-1 text-[#D4AF37] font-semibold">
              <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
              {movie.rating.toFixed(1)} / 10
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {movie.year}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {movie.duration}
            </span>
            <span aria-hidden="true">·</span>
            <span>{movie.genres.join(', ')}</span>
          </div>

          {/* Synopsis */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#888888]">
              Sinopsis Lengkap
            </h4>
            <p className="text-sm sm:text-base text-[#D0D0D0] leading-relaxed">
              {movie.synopsis}
            </p>
          </div>

          {/* Cast & Crew Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#888888] block mb-1">
                Sutradara
              </span>
              <p className="text-sm font-medium text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#E50914]" />
                {movie.director}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#888888] block mb-1">
                Pemeran Utama
              </span>
              <p className="text-sm font-medium text-white flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-[#D4AF37]" />
                {movie.cast.join(', ')}
              </p>
            </div>
          </div>

          {/* Awards If Any */}
          {movie.awards && movie.awards.length > 0 && (
            <div className="p-3.5 bg-[#1C1C1C] rounded-xl border border-[#D4AF37]/30 flex items-start gap-3">
              <Award className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-[#D4AF37] block">
                  Penghargaan & Festival Film
                </span>
                <p className="text-xs text-[#CCCCCC] mt-0.5">
                  {movie.awards.join(' · ')}
                </p>
              </div>
            </div>
          )}

          {/* Actions Bottom Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#242424]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onWatch(movie)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80610] text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Nonton Sekarang</span>
              </button>

              <button
                onClick={() => onToggleWatchlist(movie)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  isWatchlisted
                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-[#1C1C1C] hover:bg-[#252525] border-[#333333] text-white'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-[#D4AF37]' : ''}`} />
                <span>{isWatchlisted ? 'Tersimpan di Watchlist' : 'Tambah ke Watchlist'}</span>
              </button>
            </div>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#333333] text-xs font-medium text-[#A5A5A5] hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Tersalin' : 'Bagikan Film'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
