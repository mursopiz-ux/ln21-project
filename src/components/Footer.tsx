import React from 'react';
import { Film, Shield, Send, Heart, Play } from 'lucide-react';

interface FooterProps {
  onSelectCategory?: (category: string) => void;
  onSelectTab?: (tab: string) => void;
  onOpenPrivacy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onSelectTab,
  onOpenPrivacy
}) => {
  return (
    <footer className="w-full bg-[#0E0E0E] border-t border-[#1F1F1F] text-[#A5A5A5] pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Info (2 columns on lg) */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#E50914] to-[#78040A] text-white font-extrabold text-base shadow-md">
                <span className="font-display">LN</span>
                <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-[#D4AF37] text-black px-1 rounded-sm">
                  21
                </span>
              </div>
              <span className="font-display font-extrabold text-lg text-white tracking-tight">
                LAYAR NUSANTARA 21
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#888888] leading-relaxed max-w-sm">
              Menghadirkan sinema nusantara dan karya independen berkualitas dengan pengalaman streaming modern. Menghargai kreasi sineas lokal dan memperluas jangkauan film alternatif Indonesia ke kancah global.
            </p>

            <div className="flex items-center gap-3 pt-1">
              {['Instagram', 'YouTube', 'Telegram', 'X (Twitter)'].map((social) => (
                <button
                  key={social}
                  onClick={() => alert(`Membuka kanal resmi LN21 di ${social}`)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-[#181818] hover:bg-[#222222] hover:text-white border border-[#272727] transition-colors"
                >
                  {social}
                </button>
              ))}
            </div>
          </div>

          {/* Navigasi Utama */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Navigasi Film
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              <li>
                <button 
                  onClick={() => onSelectTab?.('home')}
                  className="hover:text-white transition-colors"
                >
                  Beranda
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTab?.('indonesia')}
                  className="hover:text-white transition-colors"
                >
                  Sinema Nusantara
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTab?.('international')}
                  className="hover:text-white transition-colors"
                >
                  Film Indie Internasional
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTab?.('short')}
                  className="hover:text-white transition-colors"
                >
                  Film Pendek Terpilih
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTab?.('documentary')}
                  className="hover:text-white transition-colors"
                >
                  Dokumenter Budaya & Alam
                </button>
              </li>
            </ul>
          </div>

          {/* Genre Populer */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Genre Pilihan
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              {['Action', 'Drama', 'Horror', 'Adventure', 'Documentary', 'Thriller'].map((genre) => (
                <li key={genre}>
                  <button
                    onClick={() => onSelectCategory?.(genre)}
                    className="hover:text-white transition-colors"
                  >
                    {genre}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Info & Legal */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Bantuan & Kebijakan
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => alert('LN21 berkomitmen menghargai hak kekayaan intelektual (HAKI) dan hak cipta sineas independen.')}
                  className="hover:text-white transition-colors"
                >
                  Pemberitahuan DMCA & Hak Cipta
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Syarat & Ketentuan Layanan Penonton Layar Nusantara 21.')}
                  className="hover:text-white transition-colors"
                >
                  Syarat Layanan
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Kebijakan Privasi: LN21 tidak menjual data penonton kepada pihak ketiga.')}
                  className="hover:text-white transition-colors"
                >
                  Kebijakan Privasi
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Hubungi redaksi kurasi LN21 melalui support@ln21.cinema')}
                  className="hover:text-white transition-colors"
                >
                  Kontak Kurator & Kerjasama
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Server Architecture Notice */}
        <div className="p-4 rounded-xl bg-[#141414] border border-[#202020] text-xs text-[#777777] leading-relaxed">
          <p>
            <strong className="text-[#AAAAAA]">Pemberitahuan Hak Cipta:</strong> Layar Nusantara 21 (LN21) adalah platform etalase apresiasi film independen. Seluruh materi video, sinopsis, dan nama karya adalah properti sah masing-masing pembuat film dan rumah produksi terdaftar.
          </p>
        </div>

        {/* Bottom Copyright Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#1C1C1C] text-xs text-[#666666]">
          <p>© 2026 Layar Nusantara 21 (LN21). Hak Cipta Dilindungi Undang-Undang.</p>
          <div className="flex items-center gap-1 text-[#888888]">
            <span>Didedikasikan untuk Kebangkitan Sinema Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
