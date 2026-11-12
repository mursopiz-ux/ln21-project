import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../data/movies';
import { MovieCard } from './MovieCard';

interface MovieCarouselProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  onWatch: (movie: Movie) => void;
  onSelect: (movie: Movie) => void;
  onToggleWatchlist: (movie: Movie) => void;
  isWatchlisted: (movieId: string) => boolean;
  onViewAll?: () => void;
}

export const MovieCarousel: React.FC<MovieCarouselProps> = ({
  title,
  subtitle,
  movies,
  onWatch,
  onSelect,
  onToggleWatchlist,
  isWatchlisted,
  onViewAll
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (movies.length === 0) return null;

  return (
    <section className="relative w-full py-4 group/carousel">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div>
          <h2 className="font-display font-bold text-lg sm:text-xl md:text-2xl text-white tracking-tight flex items-center gap-2">
            <span className="w-1 h-5 sm:h-6 bg-[#E50914] rounded-full inline-block" />
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#A5A5A5] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs sm:text-sm font-semibold text-[#D4AF37] hover:text-amber-300 transition-colors mr-2 hidden sm:block"
            >
              Lihat Semua ({movies.length})
            </button>
          )}

          {/* Carousel Arrow Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 sm:p-2 rounded-lg bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white border border-[#2E2E2E] transition-all hover:scale-105 active:scale-95"
              aria-label="Geser ke kiri"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 sm:p-2 rounded-lg bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white border border-[#2E2E2E] transition-all hover:scale-105 active:scale-95"
              aria-label="Geser ke kanan"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1"
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="w-[150px] sm:w-[180px] md:w-[200px] shrink-0"
            >
              <MovieCard
                movie={movie}
                onWatch={onWatch}
                onSelect={onSelect}
                onToggleWatchlist={onToggleWatchlist}
                isWatchlisted={isWatchlisted(movie.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
