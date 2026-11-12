/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Calendar, Clock, User, Film, Bookmark, Share2, Award, ShieldCheck, Check } from 'lucide-react';
import { LN21Player } from './LN21Player';
import { MovieCard } from './MovieCard';
import { Movie } from '../data/movies';
import { api, MovieItem } from '../services/api';

interface WatchPageProps {
  movieId: string;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  allMovies: Movie[];
  onToggleWatchlist: (movie: Movie) => void;
  isWatchlisted: (id: string) => boolean;
  userId?: string;
  onNotify?: (message: string) => void;
}

export const WatchPage: React.FC<WatchPageProps> = ({
  movieId,
  onBack,
  onSelectMovie,
  allMovies,
  onToggleWatchlist,
  isWatchlisted,
  userId = 'guest_user',
  onNotify
}) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [savedPosition, setSavedPosition] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  // Find movie from list or backend
  useEffect(() => {
    const found = allMovies.find((m) => m.id === movieId);
    if (found) {
      setMovie(found);
    } else {
      api.getMovieById(movieId).then((res) => {
        if (res) {
          // map backend item to Movie
          setMovie({
            id: res.id,
            title: res.title,
            synopsis: res.description,
            year: res.release_year,
            genres: res.genre,
            duration: res.duration,
            durationMinutes: res.duration_minutes,
            quality: res.quality as any,
            rating: res.rating,
            ratingCount: 1200,
            ageRating: res.age_rating as any,
            country: res.country,
            director: res.director,
            cast: res.cast_members,
            posterImage: res.poster_url,
            bannerImage: res.banner_url || res.poster_url,
            category: 'trending',
            servers: [{ id: 's1', name: 'Server Alpha (Jakarta CDN)', quality: res.quality, speed: 'Fast', status: 'fast' }]
          });
        }
      });
    }

    // Check watch history for this user
    api.getWatchHistory(userId).then((history) => {
      const match = history.find((h) => h.movie_id === movieId);
      if (match && match.playback_position > 10) {
        setSavedPosition(match.playback_position);
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [movieId, allMovies, userId]);

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#888888]">Memuat tayangan sinema...</p>
      </div>
    );
  }

  // Related movies in same genre
  const relatedMovies = allMovies
    .filter((m) => m.id !== movie.id && m.genres.some((g) => movie.genres.includes(g)))
    .slice(0, 6);

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopied(true);
    if (onNotify) onNotify('Tautan tayangan film disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const inWatchlist = isWatchlisted(movie.id);

  // Playback stream source URL (direct HLS test stream if demo)
  const streamUrl = (movie as any).video_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  return (
    <div className="w-full bg-[#090909] text-white min-h-screen pb-16 animate-fadeIn">
      {/* Top Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#A5A5A5] hover:text-white bg-[#151515] hover:bg-[#1E1E1E] px-3.5 py-2 rounded-xl border border-[#252525] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda LN21</span>
        </button>
      </div>

      {/* Main Video Player Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full rounded-2xl overflow-hidden bg-black border border-[#222222] shadow-2xl">
          <LN21Player
            src={streamUrl}
            poster={movie.bannerImage || movie.posterImage}
            title={movie.title}
            movieId={movie.id}
            userId={userId}
            initialTime={savedPosition}
            autoPlay={true}
          />
        </div>
      </div>

      {/* Movie Information & Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-8 border-b border-[#1E1E1E]">
          
          {/* Left Details */}
          <div className="space-y-4 max-w-3xl">
            {/* Title & Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-[#E50914] text-white font-bold tracking-wider text-[11px]">
                  {movie.quality}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#1C1C1C] text-[#A5A5A5] font-semibold border border-[#2C2C2C] text-[11px]">
                  {movie.ageRating}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#1C1C1C] text-[#A5A5A5] font-semibold border border-[#2C2C2C] text-[11px]">
                  {movie.country}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Streaming Resmi Independen
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-sm sm:text-base text-[#D4AF37] italic font-medium">
                  "{movie.tagline}"
                </p>
              )}
            </div>

            {/* Unboxed Metadata Line */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-[#A5A5A5]">
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

            {/* Full Synopsis */}
            <div className="space-y-1.5 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#888888]">
                Sinopsis Film
              </h3>
              <p className="text-sm sm:text-base text-[#CCCCCC] leading-relaxed">
                {movie.synopsis}
              </p>
            </div>

            {/* Crew Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#777777] block mb-1">
                  Sutradara
                </span>
                <p className="text-sm font-medium text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#E50914]" />
                  {movie.director}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#777777] block mb-1">
                  Pemeran Utama
                </span>
                <p className="text-sm font-medium text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#D4AF37]" />
                  {movie.cast.join(', ')}
                </p>
              </div>
            </div>

            {/* Awards Highlight */}
            {movie.awards && movie.awards.length > 0 && (
              <div className="p-3.5 bg-[#141414] rounded-xl border border-[#D4AF37]/30 flex items-start gap-3">
                <Award className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-[#D4AF37] block">
                    Penghargaan & Festival
                  </span>
                  <p className="text-xs text-[#CCCCCC] mt-0.5">
                    {movie.awards.join(' · ')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Action Panel */}
          <div className="flex flex-col gap-3 lg:w-72 shrink-0 bg-[#141414] p-4 sm:p-5 rounded-2xl border border-[#242424]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#888888]">
              Aksi Penonton
            </h4>

            <button
              onClick={() => onToggleWatchlist(movie)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                inWatchlist
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                  : 'bg-[#1C1C1C] hover:bg-[#252525] border-[#333333] text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-[#D4AF37]' : ''}`} />
              <span>{inWatchlist ? 'Tersimpan di Watchlist' : 'Simpan ke Watchlist'}</span>
            </button>

            <button
              onClick={handleShare}
              className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 bg-[#1C1C1C] hover:bg-[#252525] border border-[#333333] text-[#A5A5A5] hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Tautan Tersalin!' : 'Bagikan Film Ini'}</span>
            </button>

            <div className="pt-3 border-t border-[#222222] text-[11px] text-[#777777] space-y-1.5">
              <div className="flex justify-between">
                <span>Transkoding Video</span>
                <span className="text-[#AAAAAA]">Cloudflare Stream</span>
              </div>
              <div className="flex justify-between">
                <span>Protokol Aliran</span>
                <span className="text-[#AAAAAA]">HLS Adaptive Multi-bitrate</span>
              </div>
              <div className="flex justify-between">
                <span>Posisi Tontonan Terakhir</span>
                <span className="text-[#AAAAAA]">{savedPosition > 0 ? `${Math.floor(savedPosition / 60)}m` : 'Awal'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Movies Section */}
        {relatedMovies.length > 0 && (
          <div className="pt-4 space-y-4">
            <h3 className="font-display font-bold text-lg sm:text-xl text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-[#E50914] rounded-full inline-block" />
              Film Serupa yang Mungkin Anda Sukai
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5">
              {relatedMovies.map((rel) => (
                <MovieCard
                  key={rel.id}
                  movie={rel}
                  onWatch={(m) => onSelectMovie(m)}
                  onSelect={(m) => onSelectMovie(m)}
                  onToggleWatchlist={onToggleWatchlist}
                  isWatchlisted={isWatchlisted(rel.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
