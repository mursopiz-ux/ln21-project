import React from 'react';
import { X, Play, Trash2, Film, Star, Bookmark } from 'lucide-react';
import { Movie } from '../data/movies';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
  onWatch: (movie: Movie) => void;
  onRemove: (movieId: string) => void;
  onSelect: (movie: Movie) => void;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  onClose,
  movies,
  onWatch,
  onRemove,
  onSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#141414] rounded-2xl border border-[#2B2B2B] overflow-hidden shadow-2xl my-auto text-white flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1A1A1A] border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
            <h3 className="font-display font-bold text-base sm:text-lg text-white">
              Daftar Tontonan Saya ({movies.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#333333] text-[#A5A5A5] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
          {movies.length > 0 ? (
            movies.map((movie) => (
              <div
                key={movie.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C1C] hover:bg-[#222222] border border-[#2C2C2C] transition-colors gap-3"
              >
                {/* Thumbnail & Title */}
                <div 
                  onClick={() => {
                    onSelect(movie);
                    onClose();
                  }}
                  className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer group"
                >
                  <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-lg overflow-hidden bg-black shrink-0 relative">
                    <img
                      src={movie.posterImage || movie.bannerImage}
                      alt={movie.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h4 className="font-display font-bold text-sm text-white group-hover:text-[#E50914] transition-colors truncate">
                      {movie.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-[#A5A5A5]">
                      <span className="flex items-center gap-1 text-[#D4AF37]">
                        <Star className="w-3 h-3 fill-[#D4AF37]" />
                        {movie.rating.toFixed(1)}
                      </span>
                      <span>·</span>
                      <span>{movie.year}</span>
                      <span>·</span>
                      <span>{movie.duration}</span>
                    </div>
                    <span className="inline-block text-[10px] font-bold text-[#E50914] bg-[#E50914]/10 px-1.5 py-0.5 rounded">
                      {movie.quality}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onWatch(movie);
                      onClose();
                    }}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-[#E50914] hover:bg-[#b80610] text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                    title="Tonton Film"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span className="hidden sm:inline">Tonton</span>
                  </button>

                  <button
                    onClick={() => onRemove(movie.id)}
                    className="p-2 rounded-lg bg-[#252525] hover:bg-red-950/60 text-[#888888] hover:text-red-400 transition-colors"
                    title="Hapus dari Watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center space-y-3">
              <Film className="w-12 h-12 text-[#444444] mx-auto" />
              <h4 className="text-base font-semibold text-white">Watchlist Masih Kosong</h4>
              <p className="text-xs sm:text-sm text-[#888888] max-w-sm mx-auto">
                Tekan tombol ikon bookmark pada poster film yang ingin Anda simpan dan tonton nanti.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-xl bg-[#E50914] text-white text-xs font-bold hover:bg-[#b80610] transition-colors"
              >
                Jelajahi Film Sekarang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
