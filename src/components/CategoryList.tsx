import React from 'react';
import { GENRES } from '../data/movies';
import { Flame, Film, Compass, Heart, Ghost, Smile, Sparkles, Video, ShieldAlert } from 'lucide-react';

interface CategoryListProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  genreCounts?: Record<string, number>;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  selectedCategory,
  onSelectCategory,
  genreCounts = {}
}) => {
  // Helpful subtle icons for each genre
  const getGenreIcon = (genre: string) => {
    switch (genre) {
      case 'Action': return <Flame className="w-3.5 h-3.5 text-red-500" />;
      case 'Drama': return <Film className="w-3.5 h-3.5 text-amber-500" />;
      case 'Comedy': return <Smile className="w-3.5 h-3.5 text-yellow-400" />;
      case 'Horror': return <Ghost className="w-3.5 h-3.5 text-purple-400" />;
      case 'Romance': return <Heart className="w-3.5 h-3.5 text-pink-500" />;
      case 'Adventure': return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Animation': return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Documentary': return <Video className="w-3.5 h-3.5 text-blue-400" />;
      case 'Thriller': return <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />;
      default: return null;
    }
  };

  return (
    <div className="w-full py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-widest font-bold text-[#A5A5A5]">
          Eksplorasi Menurut Genre
        </h3>
        {selectedCategory !== 'Semua Genre' && (
          <button
            onClick={() => onSelectCategory('Semua Genre')}
            className="text-xs text-[#E50914] hover:underline font-medium"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Genre Filter Buttons Container */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {GENRES.map((genre) => {
          const isActive = selectedCategory === genre;
          const count = genreCounts[genre];

          return (
            <button
              key={genre}
              onClick={() => onSelectCategory(genre)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? 'bg-[#E50914] text-white border-[#E50914] shadow-md shadow-red-900/30 scale-[1.02]'
                  : 'bg-[#151515] text-[#A5A5A5] hover:text-white hover:bg-[#1C1C1C] border-[#252525]'
              }`}
            >
              {getGenreIcon(genre)}
              <span>{genre}</span>
              {count !== undefined && count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                  isActive ? 'bg-black/30 text-white' : 'bg-[#222222] text-[#888888]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
