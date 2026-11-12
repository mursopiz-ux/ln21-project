import React, { useState } from 'react';
import { Play, Star, Bookmark, Film } from 'lucide-react';
import { Movie } from '../data/movies';

interface MovieCardProps {
  movie: Movie;
  onWatch: (movie: Movie) => void;
  onSelect: (movie: Movie) => void;
  onToggleWatchlist: (movie: Movie) => void;
  isWatchlisted: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onWatch,
  onSelect,
  onToggleWatchlist,
  isWatchlisted
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative flex flex-col cursor-pointer transition-all duration-300">
      
      {/* Poster Media Box with 3:4 Aspect Ratio */}
      <div 
        onClick={() => onSelect(movie)}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] group-hover:border-[#E50914]/60 group-hover:shadow-xl group-hover:shadow-red-950/30 transition-all duration-300"
      >
        {/* Poster Image or Resilient Styled Fallback */}
        {!imageError && movie.posterImage ? (
          <img
            src={movie.posterImage}
            alt={movie.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-b ${movie.posterBgGradient || 'from-neutral-900 via-neutral-950 to-black'} p-4 flex flex-col justify-between relative`}>
            {/* Top decorative film badge */}
            <div className="flex items-center justify-between text-[#888888]">
              <Film className="w-5 h-5 text-[#E50914]" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#A5A5A5]">
                {movie.country}
              </span>
            </div>

            {/* Stylized Poster Center Title */}
            <div className="space-y-1 text-center my-auto">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                {movie.genres[0]}
              </span>
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white leading-snug line-clamp-3">
                {movie.title}
              </h3>
              <p className="text-[11px] text-[#888888] italic line-clamp-2">
                "{movie.tagline || movie.synopsis.slice(0, 50) + '...'}"
              </p>
            </div>

            <div className="text-[10px] text-center text-[#666666] border-t border-white/10 pt-1">
              LN21 ORIGINAL SELECTION
            </div>
          </div>
        )}

        {/* Dark Scrim overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 opacity-60 group-hover:opacity-85 transition-opacity" />

        {/* Top Badges: Quality & Watchlist Action */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
          <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider rounded bg-black/70 text-[#E50914] border border-[#E50914]/40 backdrop-blur-sm">
            {movie.quality}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(movie);
            }}
            className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${
              isWatchlisted
                ? 'bg-[#D4AF37] text-black shadow-md'
                : 'bg-black/60 text-[#A5A5A5] hover:text-white hover:bg-black/90'
            }`}
            title={isWatchlisted ? 'Hapus dari Watchlist' : 'Simpan ke Watchlist'}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Rating Floating Tag */}
        <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 text-[11px] font-semibold text-[#D4AF37] bg-black/70 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
          <Star className="w-3 h-3 fill-[#D4AF37]" />
          <span>{movie.rating.toFixed(1)}</span>
        </div>

        {/* Play Icon Center Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatch(movie);
            }}
            className="w-12 h-12 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-red-950/60 glow-red hover:scale-110 active:scale-95 transition-transform"
            title="Tonton Langsung"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        </div>
      </div>

      {/* Movie Information Below Card (Zero-Pill Discipline) */}
      <div 
        onClick={() => onSelect(movie)} 
        className="mt-2.5 space-y-1"
      >
        <h4 className="font-display font-semibold text-sm text-white group-hover:text-[#E50914] transition-colors truncate">
          {movie.title}
        </h4>

        {/* Metadata Line */}
        <div className="flex items-center gap-1.5 text-xs text-[#A5A5A5]">
          <span>{movie.year}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate max-w-[90px]">{movie.genres[0]}</span>
          <span aria-hidden="true">·</span>
          <span>{movie.duration}</span>
        </div>
      </div>
    </div>
  );
};
