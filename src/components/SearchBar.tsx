import React from 'react';
import { Search, X, SlidersHorizontal, Film } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
  onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  resultCount,
  totalCount,
  onClear
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="bg-[#151515] p-3 sm:p-4 rounded-2xl border border-[#262626] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        
        {/* Search Input Box */}
        <div className="relative flex-1 flex items-center">
          <Search className="w-5 h-5 text-[#888888] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari film berdasarkan judul, sutradara, aktor, atau sinopsis..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 text-sm sm:text-base text-white bg-[#1C1C1C] border border-[#303030] focus:border-[#E50914] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E50914] placeholder-[#777777] transition-all"
          />
          {query && (
            <button
              onClick={onClear}
              className="absolute right-3 p-1 text-[#888888] hover:text-white rounded-md transition-colors"
              title="Bersihkan pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Result Counter & Info */}
        <div className="flex items-center justify-between md:justify-end gap-3 text-xs sm:text-sm text-[#A5A5A5] shrink-0 px-1">
          {query ? (
            <span className="flex items-center gap-1.5 font-medium text-white">
              <span className="w-2 h-2 rounded-full bg-[#E50914]" />
              Ditemukan <strong className="text-[#E50914]">{resultCount}</strong> film untuk "{query}"
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Film className="w-4 h-4 text-[#777777]" />
              Katalog aktif: <strong className="text-white">{totalCount} film terkurasi</strong>
            </span>
          )}

          {query && (
            <button
              onClick={onClear}
              className="text-xs text-[#E50914] hover:underline font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
