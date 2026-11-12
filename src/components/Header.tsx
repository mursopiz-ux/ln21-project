import React, { useState } from 'react';
import { Search, Bookmark, User, Menu, X, Play, Film, Sparkles, SlidersHorizontal, Upload } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  watchlistCount: number;
  onOpenWatchlist: () => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
  userName?: string;
  onSelectCategory?: (category: string) => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  watchlistCount,
  onOpenWatchlist,
  onOpenAuth,
  isLoggedIn,
  userName = 'Member LN21',
  onSelectCategory,
  onOpenAdmin,
  isAdmin = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Beranda' },
    { id: 'movies', label: 'Semua Film' },
    { id: 'indonesia', label: 'Sinema Nusantara' },
    { id: 'international', label: 'Indie Dunia' },
    { id: 'short', label: 'Film Pendek' },
    { id: 'documentary', label: 'Dokumenter' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090909]/90 backdrop-blur-md border-b border-[#222222] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          
          {/* Brand Logo Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => {
                onTabChange('home');
                if (onSelectCategory) onSelectCategory('Semua Genre');
              }}
              className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] rounded-lg p-1"
            >
              {/* Distinctive Logo Badge */}
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914] via-[#B80610] to-[#78040A] text-white font-extrabold text-lg shadow-lg shadow-red-900/40 group-hover:scale-105 transition-transform">
                <span className="font-display tracking-wider">LN</span>
                <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-[#D4AF37] text-black px-1 rounded-sm leading-tight">
                  21
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-base md:text-lg tracking-tight text-white group-hover:text-red-500 transition-colors whitespace-nowrap">
                  LAYAR NUSANTARA
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold -mt-1 hidden sm:block">
                  Sinema Merdeka
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onTabChange(link.id)}
                  className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all ${
                    isActive
                      ? 'text-white bg-[#1C1C1C] border border-[#2D2D2D] shadow-inner'
                      : 'text-[#A5A5A5] hover:text-white hover:bg-[#151515]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Zone */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Inline Desktop Search */}
            <div className="relative hidden md:flex items-center">
              <input
                type="text"
                placeholder="Cari judul film, sutradara..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-48 lg:w-64 pl-9 pr-8 py-1.5 text-xs text-white bg-[#151515] hover:bg-[#1A1A1A] focus:bg-[#1C1C1C] border border-[#2A2A2A] focus:border-[#E50914] rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#E50914] placeholder-[#777777]"
              />
              <Search className="w-4 h-4 text-[#888888] absolute left-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 text-xs text-[#888888] hover:text-white p-0.5 rounded"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Search Toggle Icon */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 md:hidden text-[#A5A5A5] hover:text-white bg-[#151515] border border-[#252525] rounded-lg transition-colors"
              aria-label="Cari Film"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Watchlist Quick Button */}
            <button
              onClick={onOpenWatchlist}
              className="relative p-2 text-[#A5A5A5] hover:text-white bg-[#151515] hover:bg-[#1C1C1C] border border-[#252525] rounded-lg transition-colors group"
              title="Daftar Tontonan Saya"
            >
              <Bookmark className="w-4 h-4 text-[#A5A5A5] group-hover:text-[#D4AF37] transition-colors" />
              {watchlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E50914] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                  {watchlistCount}
                </span>
              )}
            </button>

            {/* Admin Upload / Manage Portal Button */}
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  isAdmin
                    ? 'bg-red-950/70 border-red-700/60 text-white shadow-sm glow-red'
                    : 'bg-[#181818] hover:bg-[#222222] text-[#D4AF37] hover:text-amber-300 border-[#333333]'
                }`}
                title={isAdmin ? 'Panel Admin Terverifikasi (public.is_admin)' : 'Panel Admin & Unggah Film'}
              >
                <Upload className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Admin</span>
                {isAdmin && <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse" />}
              </button>
            )}

            {/* Login / VIP Pass Button */}
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isLoggedIn
                  ? 'bg-[#1C1C1C] border border-[#333333] text-white hover:border-[#E50914]'
                  : 'bg-[#E50914] hover:bg-[#B80610] text-white shadow-md shadow-red-900/30'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isLoggedIn ? userName : 'Masuk VIP'}
              </span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-[#A5A5A5] hover:text-white bg-[#151515] border border-[#252525] rounded-lg transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input Drawer (Visible when searchOpen is true on mobile) */}
        {searchOpen && (
          <div className="md:hidden py-2.5 border-t border-[#1C1C1C]">
            <div className="relative flex items-center">
              <input
                type="text"
                autoFocus
                placeholder="Cari judul film, sutradara, aktor..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-sm text-white bg-[#151515] border border-[#2E2E2E] focus:border-[#E50914] rounded-lg focus:outline-none"
              />
              <Search className="w-4 h-4 text-[#888888] absolute left-3" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 text-[#888888] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Fullscreen Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#1C1C1C] space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              {navLinks.map((link) => {
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => {
                      onTabChange(link.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-[#E50914] text-white font-semibold'
                        : 'bg-[#151515] text-[#A5A5A5] hover:text-white'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>
            
            {onOpenAdmin && (
              <button
                onClick={() => {
                  onOpenAdmin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 px-3 rounded-lg bg-[#181818] border border-[#333333] text-[#D4AF37] font-semibold text-xs flex items-center justify-center gap-2"
              >
                <Upload className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Buka Panel Admin & Unggah Film</span>
              </button>
            )}

            <div className="pt-2 flex items-center justify-between text-xs text-[#888888] px-1">
              <span>Status Server: <span className="text-emerald-400 font-medium">Ultra CDN 100% Aktif</span></span>
              <span>v2.6 Nusantara</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
