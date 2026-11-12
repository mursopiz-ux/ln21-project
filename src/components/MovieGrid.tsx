import React from 'react';
import { Film } from 'lucide-react';
import { Movie } from '../data/movies';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  title?: string;
  subtitle?: string;
  movies: Movie[];
  onWatch: (movie: Movie) => void;
  onSelect: (movie: Movie) => void;
  onToggleWatchlist: (movie: Movie) => void;
  isWatchlisted: (movieId: string) => boolean;
  emptyMessage?: string;
}

export const MovieGrid: React.FC<MovieGridProps> = ({
  title,
  subtitle,
  movies,
  onWatch,
  onSelect,
  onToggleWatchlist,
  isWatchlisted,
  emptyMessage = 'Belum ada film yang tersedia di kategori ini.'
}) => {
  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Optional Title */}
      {title && (
        <div className="mb-6">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight flex items-center gap-2">
            <span className="w-1 h-6 bg-[#E50914] rounded-full inline-block" />
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#A5A5A5] mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Grid of Movies */}
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onWatch={onWatch}
              onSelect={onSelect}
              onToggleWatchlist={onToggleWatchlist}
              isWatchlisted={isWatchlisted(movie.id)}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-[#151515] rounded-2xl border border-[#222222] p-8 max-w-lg mx-auto">
          <Film className="w-12 h-12 text-[#555555] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">Film Tidak Ditemukan</h3>
          <p className="text-xs sm:text-sm text-[#888888]">
            {emptyMessage}
          </p>
        </div>
      )}
    </section>
  );
};
