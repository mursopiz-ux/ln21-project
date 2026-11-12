/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { MovieCarousel } from './components/MovieCarousel';
import { MovieGrid } from './components/MovieGrid';
import { CategoryList } from './components/CategoryList';
import { SearchBar } from './components/SearchBar';
import { PlayerModal } from './components/PlayerModal';
import { MovieDetailModal } from './components/MovieDetailModal';
import { WatchlistModal } from './components/WatchlistModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { WatchPage } from './components/WatchPage';
import { LoginPage } from './components/LoginPage';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { HERO_MOVIES, SAMPLE_MOVIES, Movie } from './data/movies';
import { api, MovieItem, WatchHistoryItem } from './services/api';
import {
  supabase,
  isSupabaseConfigured,
  getUserProfile,
  checkIsAdmin,
  UserProfile
} from './lib/supabase';
import { Sparkles, Film, Flame, Award, Compass, Video, Play, Clock, RotateCcw } from 'lucide-react';

export default function App() {
  // Navigation & Route States
  const [currentWatchMovieId, setCurrentWatchMovieId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/watch/')) {
      return path.replace('/watch/', '');
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('watch');
  });

  const [isLoginPageOpen, setIsLoginPageOpen] = useState<boolean>(() => {
    return window.location.pathname === '/login' || window.location.search.includes('login');
  });

  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Genre');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Interactive States
  const [activePlayMovie, setActivePlayMovie] = useState<Movie | null>(null);
  const [activeDetailMovie, setActiveDetailMovie] = useState<Movie | null>(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Profile & Supabase Auth State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('ln21_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('ln21_user_profile'));
    } catch {
      return false;
    }
  });
  const [userName, setUserName] = useState<string>(() => {
    try {
      const p = localStorage.getItem('ln21_user_profile');
      if (p) {
        const parsed = JSON.parse(p);
        return parsed.full_name || parsed.email || 'Penonton VIP';
      }
      return 'Penonton VIP';
    } catch {
      return 'Penonton VIP';
    }
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      const p = localStorage.getItem('ln21_user_profile');
      if (p) {
        const parsed = JSON.parse(p);
        return parsed.role === 'admin';
      }
      return localStorage.getItem('ln21_admin_key') === 'LN21-ADMIN-2026';
    } catch {
      return false;
    }
  });
  const userId = userProfile?.id || (isLoggedIn ? userName : 'ln21_local_viewer');

  // Supabase Auth Session Initialization & public.is_admin() Verification
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (!isSupabaseConfigured) {
        if (userProfile?.role === 'admin') {
          setIsAdmin(true);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const profile = await getUserProfile(session.user.id, session.user.email);
          if (profile && isMounted) {
            setUserProfile(profile);
            setIsLoggedIn(true);
            setUserName(profile.full_name || profile.email);
            localStorage.setItem('ln21_user_profile', JSON.stringify(profile));

            // Evaluate role via public.is_admin() RPC
            const adminCheck = await checkIsAdmin();
            const hasAdminAccess = adminCheck.isAdmin || profile.role === 'admin';
            setIsAdmin(hasAdminAccess);
          }
        }
      } catch (err) {
        console.warn('Supabase auth session warning:', err);
      }
    };

    initAuth();

    // Listen to real-time Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && isMounted) {
        const profile = await getUserProfile(session.user.id, session.user.email);
        if (profile && isMounted) {
          setUserProfile(profile);
          setIsLoggedIn(true);
          setUserName(profile.full_name || profile.email);
          localStorage.setItem('ln21_user_profile', JSON.stringify(profile));

          const adminCheck = await checkIsAdmin();
          const hasAdminAccess = adminCheck.isAdmin || profile.role === 'admin';
          setIsAdmin(hasAdminAccess);
        }
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setUserProfile(null);
        setIsLoggedIn(false);
        setIsAdmin(false);
        setUserName('Member LN21');
        localStorage.removeItem('ln21_user_profile');
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Watch History & Dynamic Catalog from Backend
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [backendMovies, setBackendMovies] = useState<MovieItem[]>([]);

  // Watchlist Local Storage Persistence
  const [watchlistIds, setWatchlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ln21_watchlist');
      return saved ? JSON.parse(saved) : ['hero-1', 'mov-ind-1', 'mov-sh-1'];
    } catch {
      return ['hero-1', 'mov-ind-1', 'mov-sh-1'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ln21_watchlist', JSON.stringify(watchlistIds));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage', e);
    }
  }, [watchlistIds]);

  // Sync browser URL with popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/login' || window.location.search.includes('login')) {
        setIsLoginPageOpen(true);
        setCurrentWatchMovieId(null);
      } else if (path.startsWith('/watch/')) {
        setCurrentWatchMovieId(path.replace('/watch/', ''));
        setIsLoginPageOpen(false);
      } else {
        setCurrentWatchMovieId(null);
        setIsLoginPageOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToWatch = useCallback((movieId: string) => {
    setCurrentWatchMovieId(movieId);
    setIsLoginPageOpen(false);
    window.history.pushState({}, '', `/watch/${movieId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToHome = useCallback(() => {
    setCurrentWatchMovieId(null);
    setIsLoginPageOpen(false);
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToLogin = useCallback(() => {
    setIsLoginPageOpen(true);
    setCurrentWatchMovieId(null);
    window.history.pushState({}, '', '/login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLoginSuccess = async (profile: UserProfile, redirectToAdmin: boolean) => {
    setUserProfile(profile);
    setIsLoggedIn(true);
    setUserName(profile.full_name || profile.email);
    localStorage.setItem('ln21_user_profile', JSON.stringify(profile));

    // Verify admin role via public.is_admin() and profile role
    const adminCheck = await checkIsAdmin();
    const hasAdminAccess = adminCheck.isAdmin || profile.role === 'admin' || redirectToAdmin;
    setIsAdmin(hasAdminAccess);

    setIsLoginPageOpen(false);
    window.history.pushState({}, '', '/');

    if (redirectToAdmin && hasAdminAccess) {
      setIsAdminOpen(true);
      showToast('Login berhasil sebagai Administrator! Membuka Dashboard Admin LN21.');
    } else {
      showToast(`Selamat datang, ${profile.full_name || profile.email}!`);
    }
  };

  // Fetch Movies & Watch History from Backend API
  const loadData = useCallback(async () => {
    try {
      const [movList, historyList] = await Promise.all([
        api.getMovies(),
        api.getWatchHistory(userId)
      ]);
      setBackendMovies(movList);
      setWatchHistory(historyList);
    } catch (e) {
      console.warn('API sync warning:', e);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Merge static sample movies with newly uploaded backend movies
  const combinedMovies: Movie[] = useMemo(() => {
    if (backendMovies.length === 0) return SAMPLE_MOVIES;

    const merged = [...SAMPLE_MOVIES];
    backendMovies.forEach((b) => {
      const existsIndex = merged.findIndex((m) => m.id === b.id);
      const converted: Movie = {
        id: b.id,
        title: b.title,
        tagline: b.tagline,
        synopsis: b.description,
        year: b.release_year,
        genres: b.genre,
        duration: b.duration,
        durationMinutes: b.duration_minutes,
        quality: (b.quality as any) || '1080p FHD',
        rating: b.rating || 8.8,
        ratingCount: 1450,
        ageRating: (b.age_rating as any) || '13+',
        country: b.country || 'Indonesia',
        director: b.director,
        cast: b.cast_members || ['Pemeran Utama'],
        posterImage: b.poster_url,
        bannerImage: b.banner_url || b.poster_url,
        category: 'latest',
        servers: [{ id: 's1', name: 'Server Alpha (Jakarta CDN)', quality: b.quality, speed: 'Fast', status: 'fast' }]
      };
      (converted as any).video_url = b.video_url;

      if (existsIndex >= 0) {
        merged[existsIndex] = { ...merged[existsIndex], ...converted };
      } else {
        merged.unshift(converted);
      }
    });
    return merged;
  }, [backendMovies]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const toggleWatchlist = (movie: Movie) => {
    setWatchlistIds((prev) => {
      if (prev.includes(movie.id)) {
        showToast(`"${movie.title}" dihapus dari Watchlist`);
        return prev.filter((id) => id !== movie.id);
      } else {
        showToast(`"${movie.title}" disimpan ke Watchlist`);
        return [...prev, movie.id];
      }
    });
  };

  const isWatchlisted = (movieId: string) => watchlistIds.includes(movieId);

  const watchlistedMovies = useMemo(() => {
    return combinedMovies.filter((m) => watchlistIds.includes(m.id));
  }, [combinedMovies, watchlistIds]);

  // Genre movie counts
  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    combinedMovies.forEach((movie) => {
      movie.genres.forEach((g) => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    return counts;
  }, [combinedMovies]);

  // Filter movies by Search Query
  const searchedMovies = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return combinedMovies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q) ||
        m.cast.some((c) => c.toLowerCase().includes(q)) ||
        m.synopsis.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q))
    );
  }, [searchQuery, combinedMovies]);

  // Filter movies by Genre Selection
  const filteredByGenre = useMemo(() => {
    if (selectedCategory === 'Semua Genre') return combinedMovies;
    return combinedMovies.filter((m) => m.genres.includes(selectedCategory));
  }, [selectedCategory, combinedMovies]);

  // Partitioned Movie Sections
  const trendingMovies = useMemo(() => {
    return filteredByGenre.filter((m) => m.category === 'trending' || m.rating >= 8.8);
  }, [filteredByGenre]);

  const latestReleases = useMemo(() => {
    return filteredByGenre.filter((m) => m.category === 'latest' || m.year === 2026);
  }, [filteredByGenre]);

  const indonesianIndieFilms = useMemo(() => {
    return filteredByGenre.filter((m) => m.category === 'indonesia' || (m.country === 'Indonesia' && m.category !== 'short' && m.category !== 'documentary'));
  }, [filteredByGenre]);

  const internationalIndieFilms = useMemo(() => {
    return filteredByGenre.filter((m) => m.category === 'international' || m.country !== 'Indonesia');
  }, [filteredByGenre]);

  const shortFilms = useMemo(() => {
    return filteredByGenre.filter((m) => m.category === 'short' || m.durationMinutes <= 30);
  }, [filteredByGenre]);

  const documentaries = useMemo(() => {
    return filteredByGenre.filter((m) => m.category === 'documentary' || m.genres.includes('Documentary'));
  }, [filteredByGenre]);

  const editorsPicks = useMemo(() => {
    return filteredByGenre.filter((m) => m.category === 'editors_pick' || m.featured);
  }, [filteredByGenre]);

  // Continue Watching List from watch history
  const continueWatchingItems = useMemo(() => {
    return watchHistory
      .filter((h) => h.playback_position > 15 && !h.completed)
      .map((h) => {
        const found = combinedMovies.find((m) => m.id === h.movie_id);
        return {
          history: h,
          movie: found
        };
      })
      .filter((item): item is { history: WatchHistoryItem; movie: Movie } => Boolean(item.movie));
  }, [watchHistory, combinedMovies]);

  // Handle Tab navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery('');
    if (tab === 'home') {
      setSelectedCategory('Semua Genre');
    }
    if (currentWatchMovieId) {
      navigateToHome();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* 1. Header Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        watchlistCount={watchlistIds.length}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenAuth={() => {
          if (isLoggedIn) {
            setIsAuthOpen(true);
          } else {
            navigateToLogin();
          }
        }}
        isLoggedIn={isLoggedIn}
        userName={userName}
        onSelectCategory={(genre) => {
          setSelectedCategory(genre);
          setActiveTab('home');
          if (currentWatchMovieId || isLoginPageOpen) navigateToHome();
        }}
        onOpenAdmin={() => {
          if (isAdmin) {
            setIsAdminOpen(true);
          } else if (!isLoggedIn) {
            showToast('Silakan login dengan akun Administrator untuk membuka panel admin.');
            navigateToLogin();
          } else {
            // Already logged in as non-admin, open to show explicit permission gate
            setIsAdminOpen(true);
          }
        }}
        isAdmin={isAdmin}
      />

      {/* 2. Main Content Routing */}
      {isLoginPageOpen ? (
        /* DEDICATED SUPABASE AUTHENTICATION PAGE ROUTE: /login */
        <LoginPage
          onBack={navigateToHome}
          onLoginSuccess={handleLoginSuccess}
          onNotify={showToast}
        />
      ) : currentWatchMovieId ? (
        /* DEDICATED MOVIE WATCH PAGE ROUTE: /watch/[id] */
        <WatchPage
          movieId={currentWatchMovieId}
          onBack={navigateToHome}
          onSelectMovie={(m) => navigateToWatch(m.id)}
          allMovies={combinedMovies}
          onToggleWatchlist={toggleWatchlist}
          isWatchlisted={isWatchlisted}
          userId={userId}
          onNotify={showToast}
        />
      ) : (
        /* HOMEPAGE VIEW (PRESERVED ALL EXISTING SECTIONS & IDENTITY) */
        <main className="flex-1 w-full">
          {/* SEARCH ACTIVE STATE */}
          {searchQuery.trim() !== '' ? (
            <div className="py-6 space-y-6">
              <SearchBar
                query={searchQuery}
                onQueryChange={setSearchQuery}
                resultCount={searchedMovies.length}
                totalCount={combinedMovies.length}
                onClear={() => setSearchQuery('')}
              />

              <MovieGrid
                title={`Hasil Pencarian untuk "${searchQuery}"`}
                subtitle={`Menampilkan ${searchedMovies.length} judul film yang sesuai`}
                movies={searchedMovies}
                onWatch={(movie) => navigateToWatch(movie.id)}
                onSelect={(movie) => setActiveDetailMovie(movie)}
                onToggleWatchlist={toggleWatchlist}
                isWatchlisted={isWatchlisted}
                emptyMessage={`Tidak ada film yang cocok dengan kata kunci "${searchQuery}". Coba gunakan kata kunci lain seperti judul, genre, atau nama sutradara.`}
              />
            </div>
          ) : (
            /* NORMAL HOMEPAGE & CATEGORY BROWSING */
            <>
              {/* Top Hero Banner */}
              {activeTab === 'home' && selectedCategory === 'Semua Genre' && (
                <HeroBanner
                  movies={HERO_MOVIES}
                  onWatchNow={(movie) => navigateToWatch(movie.id)}
                  onOpenDetails={(movie) => setActiveDetailMovie(movie)}
                  onToggleWatchlist={toggleWatchlist}
                  isWatchlisted={isWatchlisted}
                />
              )}

              {/* Category Navigation Bar */}
              <div className="border-b border-[#1A1A1A] bg-[#0E0E0E]/60 backdrop-blur-sm sticky top-16 md:top-20 z-30">
                <CategoryList
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  genreCounts={genreCounts}
                />
              </div>

              {/* CONTINUE WATCHING SECTION (Shown when user has watch progress) */}
              {continueWatchingItems.length > 0 && activeTab === 'home' && selectedCategory === 'Semua Genre' && (
                <div className="py-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#D4AF37]" />
                        Lanjutkan Menonton (Continue Watching)
                      </h3>
                      <span className="text-[11px] text-[#888888]">Tersinkronisasi otomatis</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {continueWatchingItems.slice(0, 3).map(({ history, movie }) => {
                        const progress = history.duration_seconds > 0
                          ? Math.min(100, (history.playback_position / history.duration_seconds) * 100)
                          : 25;
                        const minutesLeft = Math.max(1, Math.floor((history.duration_seconds - history.playback_position) / 60));

                        return (
                          <div
                            key={movie.id}
                            onClick={() => navigateToWatch(movie.id)}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#242424] border border-[#2D2D2D] hover:border-[#E50914]/50 cursor-pointer transition-all group"
                          >
                            <div className="w-16 h-20 rounded-lg overflow-hidden relative shrink-0 bg-black">
                              <img
                                src={movie.posterImage || movie.bannerImage}
                                alt={movie.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-6 h-6 fill-white text-white" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="font-display font-bold text-xs sm:text-sm text-white group-hover:text-[#E50914] truncate">
                                {movie.title}
                              </h4>
                              <p className="text-[11px] text-[#A5A5A5]">
                                Sisa ~{minutesLeft} menit
                              </p>
                              {/* Progress bar */}
                              <div className="w-full h-1.5 bg-[#333333] rounded-full overflow-hidden mt-1">
                                <div
                                  className="h-full bg-[#E50914]"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* If user filtered by a specific genre */}
              {selectedCategory !== 'Semua Genre' ? (
                <div className="py-6 space-y-4">
                  <MovieGrid
                    title={`Koleksi Genre: ${selectedCategory}`}
                    subtitle={`Terdapat ${filteredByGenre.length} karya film independen dengan sentuhan ${selectedCategory}`}
                    movies={filteredByGenre}
                    onWatch={(movie) => navigateToWatch(movie.id)}
                    onSelect={(movie) => setActiveDetailMovie(movie)}
                    onToggleWatchlist={toggleWatchlist}
                    isWatchlisted={isWatchlisted}
                    emptyMessage={`Belum ada film yang terdaftar dalam genre ${selectedCategory}.`}
                  />
                </div>
              ) : (
                /* STANDARD COMPREHENSIVE MOVIE SECTIONS A TO G */
                <div className="space-y-8 sm:space-y-12 py-6">

                  {/* Specific Tab Filter Overrides */}
                  {activeTab === 'indonesia' && (
                    <MovieGrid
                      title="Sinema Nusantara (Film Independen Indonesia)"
                      subtitle="Karya-karya sinematik dari Sabang sampai Merauke yang mengangkat kekayaan budaya dan realitas sosial."
                      movies={indonesianIndieFilms}
                      onWatch={(movie) => navigateToWatch(movie.id)}
                      onSelect={(movie) => setActiveDetailMovie(movie)}
                      onToggleWatchlist={toggleWatchlist}
                      isWatchlisted={isWatchlisted}
                    />
                  )}

                  {activeTab === 'international' && (
                    <MovieGrid
                      title="Film Indie Internasional"
                      subtitle="Seleksi film alternatif dari festival bergengsi Jepang, Islandia, Prancis, Iran, dan Korea Selatan."
                      movies={internationalIndieFilms}
                      onWatch={(movie) => navigateToWatch(movie.id)}
                      onSelect={(movie) => setActiveDetailMovie(movie)}
                      onToggleWatchlist={toggleWatchlist}
                      isWatchlisted={isWatchlisted}
                    />
                  )}

                  {activeTab === 'short' && (
                    <MovieGrid
                      title="Film Pendek Pilihan (Short Films)"
                      subtitle="Narasi padat, puitis, dan penuh kejutan dalam durasi di bawah 30 menit."
                      movies={shortFilms}
                      onWatch={(movie) => navigateToWatch(movie.id)}
                      onSelect={(movie) => setActiveDetailMovie(movie)}
                      onToggleWatchlist={toggleWatchlist}
                      isWatchlisted={isWatchlisted}
                    />
                  )}

                  {activeTab === 'documentary' && (
                    <MovieGrid
                      title="Koleksi Film Dokumenter"
                      subtitle="Menangkap kearifan lokal, alam liar nusantara, dan tradisi leluhur dalam lensa jujur."
                      movies={documentaries}
                      onWatch={(movie) => navigateToWatch(movie.id)}
                      onSelect={(movie) => setActiveDetailMovie(movie)}
                      onToggleWatchlist={toggleWatchlist}
                      isWatchlisted={isWatchlisted}
                    />
                  )}

                  {activeTab === 'movies' && (
                    <MovieGrid
                      title="Katalog Lengkap Film LN21"
                      subtitle={`Menampilkan seluruh ${combinedMovies.length} film independen terkurasi`}
                      movies={combinedMovies}
                      onWatch={(movie) => navigateToWatch(movie.id)}
                      onSelect={(movie) => setActiveDetailMovie(movie)}
                      onToggleWatchlist={toggleWatchlist}
                      isWatchlisted={isWatchlisted}
                    />
                  )}

                  {/* DEFAULT FULL HOME PAGE: ALL SECTIONS A TO G */}
                  {activeTab === 'home' && (
                    <>
                      {/* A. TRENDING NOW - Horizontal Carousel */}
                      <MovieCarousel
                        title="TRENDING NOW"
                        subtitle="Film independen paling banyak diputar minggu ini oleh komunitas penonton LN21"
                        movies={trendingMovies}
                        onWatch={(movie) => navigateToWatch(movie.id)}
                        onSelect={(movie) => setActiveDetailMovie(movie)}
                        onToggleWatchlist={toggleWatchlist}
                        isWatchlisted={isWatchlisted}
                      />

                      {/* B. LATEST RELEASES - Grid View */}
                      <div className="bg-[#0D0D0D] py-4 border-y border-[#181818]">
                        <MovieGrid
                          title="RILISAN TERBARU (LATEST RELEASES)"
                          subtitle="Karya-karya perdana yang baru mendarat di katalog digital Layar Nusantara 21"
                          movies={latestReleases.slice(0, 6)}
                          onWatch={(movie) => navigateToWatch(movie.id)}
                          onSelect={(movie) => setActiveDetailMovie(movie)}
                          onToggleWatchlist={toggleWatchlist}
                          isWatchlisted={isWatchlisted}
                        />
                      </div>

                      {/* C. INDONESIAN INDEPENDENT FILMS - Horizontal Carousel */}
                      <MovieCarousel
                        title="SINEMA NUSANTARA (INDONESIAN INDIE)"
                        subtitle="Eksplorasi cerita dari Yogyakarta, Bromo, Toraja, hingga pedalaman Kalimantan"
                        movies={indonesianIndieFilms}
                        onWatch={(movie) => navigateToWatch(movie.id)}
                        onSelect={(movie) => setActiveDetailMovie(movie)}
                        onToggleWatchlist={toggleWatchlist}
                        isWatchlisted={isWatchlisted}
                        onViewAll={() => setActiveTab('indonesia')}
                      />

                      {/* D. INTERNATIONAL INDIE FILMS - Horizontal Carousel */}
                      <MovieCarousel
                        title="INDIE INTERNASIONAL TERPILIH"
                        subtitle="Sorotan sinema alternatif dari sineas independen Asia dan Eropa"
                        movies={internationalIndieFilms}
                        onWatch={(movie) => navigateToWatch(movie.id)}
                        onSelect={(movie) => setActiveDetailMovie(movie)}
                        onToggleWatchlist={toggleWatchlist}
                        isWatchlisted={isWatchlisted}
                        onViewAll={() => setActiveTab('international')}
                      />

                      {/* E. SHORT FILMS (FILM PENDEK) - Horizontal Carousel */}
                      <MovieCarousel
                        title="FILM PENDEK (SHORT FILMS)"
                        subtitle="Sinema ringkas dengan kekuatan rasa dan kedalaman cerita yang memikat"
                        movies={shortFilms}
                        onWatch={(movie) => navigateToWatch(movie.id)}
                        onSelect={(movie) => setActiveDetailMovie(movie)}
                        onToggleWatchlist={toggleWatchlist}
                        isWatchlisted={isWatchlisted}
                        onViewAll={() => setActiveTab('short')}
                      />

                      {/* F. DOCUMENTARIES (DOKUMENTER INDEPENDEN) - Horizontal Carousel */}
                      <MovieCarousel
                        title="DOKUMENTER BUDAYA & ALAM"
                        subtitle="Kisah nyata manusia laut Bajo, penenun Flores, dan jalur rempah nusantara"
                        movies={documentaries}
                        onWatch={(movie) => navigateToWatch(movie.id)}
                        onSelect={(movie) => setActiveDetailMovie(movie)}
                        onToggleWatchlist={toggleWatchlist}
                        isWatchlisted={isWatchlisted}
                        onViewAll={() => setActiveTab('documentary')}
                      />

                      {/* G. EDITOR'S PICKS (PILIHAN KURATOR) - Grid View */}
                      <div className="bg-[#121212] py-4 rounded-3xl max-w-7xl mx-auto border border-[#222222] my-4 shadow-xl">
                        <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="w-6 h-6 text-[#D4AF37]" />
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block">
                                SELEKSI KHUSUS
                              </span>
                              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                                EDITOR'S PICKS
                              </h2>
                            </div>
                          </div>
                          <span className="text-xs text-[#A5A5A5] hidden sm:block">
                            Dikurasi oleh Dewan Kurator Film LN21
                          </span>
                        </div>
                        <MovieGrid
                          movies={editorsPicks}
                          onWatch={(movie) => navigateToWatch(movie.id)}
                          onSelect={(movie) => setActiveDetailMovie(movie)}
                          onToggleWatchlist={toggleWatchlist}
                          isWatchlisted={isWatchlisted}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      )}

      {/* 3. Footer */}
      <Footer
        onSelectCategory={(genre) => {
          setSelectedCategory(genre);
          setActiveTab('home');
          if (currentWatchMovieId) navigateToHome();
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
        onSelectTab={handleTabChange}
      />

      {/* Interactive Video Player Modal (for quick popover play) */}
      <PlayerModal
        movie={activePlayMovie}
        onClose={() => setActivePlayMovie(null)}
        onNotify={showToast}
      />

      {/* Interactive Movie Details Modal */}
      <MovieDetailModal
        movie={activeDetailMovie}
        onClose={() => setActiveDetailMovie(null)}
        onWatch={(movie) => {
          setActiveDetailMovie(null);
          navigateToWatch(movie.id);
        }}
        onToggleWatchlist={toggleWatchlist}
        isWatchlisted={activeDetailMovie ? isWatchlisted(activeDetailMovie.id) : false}
        onNotify={showToast}
      />

      {/* Watchlist Modal Drawer */}
      <WatchlistModal
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        movies={watchlistedMovies}
        onWatch={(movie) => {
          setIsWatchlistOpen(false);
          navigateToWatch(movie.id);
        }}
        onRemove={(id) => {
          const m = combinedMovies.find((item) => item.id === id);
          if (m) toggleWatchlist(m);
        }}
        onSelect={(movie) => {
          setIsWatchlistOpen(false);
          setActiveDetailMovie(movie);
        }}
      />

      {/* Auth VIP Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={async (profile) => {
          setUserProfile(profile);
          setIsLoggedIn(true);
          setUserName(profile.full_name || profile.email);
          localStorage.setItem('ln21_user_profile', JSON.stringify(profile));
          const adminCheck = await checkIsAdmin();
          const hasAdminAccess = adminCheck.isAdmin || profile.role === 'admin';
          setIsAdmin(hasAdminAccess);
          showToast(`Selamat datang, ${profile.full_name}! ${hasAdminAccess ? 'Role: Administrator' : 'Role: ' + profile.role}`);
        }}
        isLoggedIn={isLoggedIn}
        onLogout={() => {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setUserProfile(null);
          setUserName('Member LN21');
          localStorage.removeItem('ln21_user_profile');
          showToast('Anda telah keluar dari akun LN21.');
        }}
        userProfile={userProfile}
        isAdmin={isAdmin}
        onOpenAdminDashboard={() => setIsAdminOpen(true)}
        onOpenLoginPage={navigateToLogin}
      />

      {/* Admin Dashboard & Video Upload Portal */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onMovieChanged={loadData}
        onNotify={showToast}
        userProfile={userProfile}
      />

      {/* Feedback Toast */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
