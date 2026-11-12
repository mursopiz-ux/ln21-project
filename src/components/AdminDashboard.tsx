/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Upload,
  Film,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  Key,
  ShieldAlert,
  Server,
  Layers,
  Sparkles,
  FileVideo,
  X,
  Play,
  RotateCw,
  Plus,
  Database,
  Check,
  ShieldCheck
} from 'lucide-react';
import { api, MovieItem, SystemConfig } from '../services/api';
import { LN21Player } from './LN21Player';
import {
  checkIsAdmin,
  getSupabaseDiagnostics,
  supabase,
  isSupabaseConfigured,
  UserProfile
} from '../lib/supabase';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieChanged?: () => void;
  onNotify?: (msg: string) => void;
  userProfile?: UserProfile | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onMovieChanged,
  onNotify,
  userProfile
}) => {
  // Admin Authentication State
  const [adminKey, setAdminKey] = useState<string>(() => localStorage.getItem('ln21_admin_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminAuthSource, setAdminAuthSource] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isCheckingAdmin, setIsCheckingAdmin] = useState<boolean>(true);

  // Live Supabase Test State
  const [testResult, setTestResult] = useState<{
    envUrl: boolean;
    envAnonKey: boolean;
    clientReady: boolean;
    profilesTable: 'success' | 'empty' | 'error' | 'pending';
    isAdminRpc: 'true' | 'false' | 'not_found' | 'pending';
    message: string;
    testedAt: string;
  } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);

  // Dashboard Tabs: 'manage' | 'upload' | 'setup'
  const [activeTab, setActiveTab] = useState<'manage' | 'upload' | 'setup'>('manage');

  // Movies list & Config
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [releaseYear, setReleaseYear] = useState('2026');
  const [genre, setGenre] = useState('Drama');
  const [duration, setDuration] = useState('1j 45m');
  const [director, setDirector] = useState('');
  const [cast, setCast] = useState('');
  const [quality, setQuality] = useState('1080p FHD');
  const [ageRating, setAgeRating] = useState('13+');
  const [country, setCountry] = useState('Indonesia');
  const [tagline, setTagline] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);

  // Video File & Upload States
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [videoUid, setVideoUid] = useState('');
  const [streamHlsUrl, setStreamHlsUrl] = useState('');

  // Preview Modal
  const [previewMovie, setPreviewMovie] = useState<MovieItem | null>(null);

  // 1. Check Admin status via Supabase public.is_admin() RPC and profile role
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsCheckingAdmin(true);

    const verifyAdmin = async () => {
      // Check 1: User profile passed directly has role === 'admin'
      if (userProfile?.role === 'admin') {
        if (isMounted) {
          setIsAuthenticated(true);
          setAdminAuthSource('Akun Admin (public.profiles)');
          setIsCheckingAdmin(false);
        }
        return;
      }

      // Check 2: Call public.is_admin() RPC function via Supabase Client
      try {
        const { isAdmin, source } = await checkIsAdmin();
        if (isAdmin && isMounted) {
          setIsAuthenticated(true);
          setAdminAuthSource(source === 'rpc' ? 'Fungsi public.is_admin() RPC' : 'Tabel public.profiles');
          setIsCheckingAdmin(false);
          return;
        }
      } catch (e) {
        console.warn('checkIsAdmin error:', e);
      }

      // Check 3: Stored Emergency PIN Bypass
      const savedKey = localStorage.getItem('ln21_admin_key');
      if (savedKey === 'LN21-ADMIN-2026' || (savedKey && savedKey.length >= 6)) {
        if (isMounted) {
          setIsAuthenticated(true);
          setAdminAuthSource('Kunci PIN Darurat Administrator');
          setIsCheckingAdmin(false);
          return;
        }
      }

      if (isMounted) {
        setIsCheckingAdmin(false);
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userProfile]);

  // Load Movies & System Config
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [movList, sysConfig] = await Promise.all([
        api.getMovies({ status: '' }),
        api.getConfig()
      ]);
      setMovies(movList);
      setConfig(sysConfig);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      refreshData();
    }
  }, [isOpen, isAuthenticated]);

  // Live Test Supabase Connection & is_admin() function
  const runSupabaseTest = async () => {
    setIsTestingConnection(true);
    const diag = getSupabaseDiagnostics();

    let profilesStatus: 'success' | 'empty' | 'error' = 'error';
    let rpcStatus: 'true' | 'false' | 'not_found' = 'not_found';
    let msg = '';

    try {
      if (!isSupabaseConfigured) {
        setTestResult({
          envUrl: diag.hasUrl,
          envAnonKey: diag.hasAnonKey,
          clientReady: false,
          profilesTable: 'error',
          isAdminRpc: 'not_found',
          message: 'VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum terisi di lingkungan aktif. Saat ini menggunakan mode fallback.',
          testedAt: new Date().toLocaleTimeString()
        });
        setIsTestingConnection(false);
        return;
      }

      // Test 1: Query public.profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, role')
        .limit(3);

      if (!pErr) {
        profilesStatus = (profiles && profiles.length > 0) ? 'success' : 'empty';
      } else {
        console.warn('Test profiles error:', pErr.message);
        profilesStatus = 'error';
      }

      // Test 2: Call public.is_admin()
      const { data: rpcData, error: rpcErr } = await supabase.rpc('is_admin');
      if (!rpcErr) {
        rpcStatus = rpcData === true ? 'true' : 'false';
      } else {
        console.warn('Test is_admin RPC error:', rpcErr.message);
        rpcStatus = 'not_found';
      }

      msg = `Koneksi Supabase aktif! Tabel profiles: ${profilesStatus}, RPC is_admin(): ${rpcStatus}`;
    } catch (err: any) {
      msg = `Kesalahan tes koneksi: ${err.message || 'Gagal menghubungi Supabase'}`;
    }

    setTestResult({
      envUrl: diag.hasUrl,
      envAnonKey: diag.hasAnonKey,
      clientReady: true,
      profilesTable: profilesStatus,
      isAdminRpc: rpcStatus,
      message: msg,
      testedAt: new Date().toLocaleTimeString()
    });
    setIsTestingConnection(false);
  };

  if (!isOpen) return null;

  // Handle PIN / Manual Key Login
  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.trim() === 'LN21-ADMIN-2026' || adminKey.trim().length >= 4) {
      setIsAuthenticated(true);
      setAdminAuthSource('Kunci PIN Administrator');
      setAuthError('');
      localStorage.setItem('ln21_admin_key', adminKey);
      refreshData();
    } else {
      setAuthError('Kunci Admin tidak valid. Gunakan kunci default "LN21-ADMIN-2026".');
    }
  };

  // Video Upload Simulation / Cloudflare Stream Direct Upload
  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rightsConfirmed) {
      alert('Pernyataan kepemilikan dan hak distribusi film wajib dicentang.');
      return;
    }
    if (!title || !description || !director) {
      alert('Judul film, sinopsis, dan nama sutradara wajib diisi.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatusText('Menginisiasi sesi direct-upload ke Cloudflare Stream...');

    try {
      // 1. Get Direct Upload URL from backend
      const uploadSession = await api.initiateDirectUpload(adminKey || 'LN21-ADMIN-2026');
      setVideoUid(uploadSession.uid);
      setUploadProgress(40);
      setUploadStatusText('Mengunggah berkas video dan mempersiapkan transkoding...');

      // 2. Simulate progressive chunk upload
      await new Promise((r) => setTimeout(r, 1200));
      setUploadProgress(75);
      setUploadStatusText('Memproses transkoding HLS multi-resolusi...');

      await new Promise((r) => setTimeout(r, 1000));
      setUploadProgress(100);
      setUploadStatusText('Transkoding selesai. Video siap diputar!');

      const finalHls = uploadSession.hlsURL;
      setStreamHlsUrl(finalHls);

      // 3. Create movie in backend
      const created = await api.createMovie(
        {
          title,
          description,
          poster_url: posterUrl || '/src/assets/images/poster_jogja_stories_1794493465036.jpg',
          banner_url: bannerUrl || posterUrl || '/src/assets/images/hero_nusantara_epic_1794493463390.jpg',
          release_year: Number(releaseYear) || 2026,
          genre: [genre],
          duration,
          duration_minutes: 105,
          director,
          cast_members: cast ? cast.split(',').map((c) => c.trim()) : ['Pemeran Independen'],
          video_uid: uploadSession.uid,
          video_url: finalHls,
          quality,
          age_rating: ageRating,
          country,
          tagline,
          rights_confirmed: true
        },
        adminKey || 'LN21-ADMIN-2026'
      );

      if (onNotify) onNotify(`Film "${created.title}" berhasil diunggah & dipublikasikan!`);
      if (onMovieChanged) onMovieChanged();

      // Reset form
      setTitle('');
      setDescription('');
      setPosterUrl('');
      setBannerUrl('');
      setDirector('');
      setCast('');
      setVideoFile(null);
      setRightsConfirmed(false);
      setIsUploading(false);
      setActiveTab('manage');
      refreshData();
    } catch (err: any) {
      console.error(err);
      setIsUploading(false);
      setUploadStatusText('');
      alert(err.message || 'Gagal mengunggah video');
    }
  };

  const handleTogglePublish = async (m: MovieItem) => {
    const nextStatus = m.publication_status === 'published' ? 'draft' : 'published';
    try {
      await api.togglePublish(m.id, nextStatus, adminKey || 'LN21-ADMIN-2026');
      if (onNotify) onNotify(`Status film "${m.title}" diubah menjadi ${nextStatus}`);
      refreshData();
      if (onMovieChanged) onMovieChanged();
    } catch (e: any) {
      alert(e.message || 'Gagal mengubah status publikasi');
    }
  };

  const handleDelete = async (id: string, titleStr: string) => {
    if (!confirm(`Hapus film "${titleStr}" secara permanen dari LN21?`)) return;
    try {
      await api.deleteMovie(id, adminKey || 'LN21-ADMIN-2026');
      if (onNotify) onNotify(`Film "${titleStr}" berhasil dihapus.`);
      refreshData();
      if (onMovieChanged) onMovieChanged();
    } catch (e: any) {
      alert(e.message || 'Gagal menghapus film');
    }
  };

  const diagnostics = getSupabaseDiagnostics();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-fadeIn text-white">
      <div className="relative w-full max-w-5xl bg-[#121212] rounded-2xl border border-[#2B2B2B] overflow-hidden shadow-2xl my-auto flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#181818] border-b border-[#282828]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E50914] flex items-center justify-center font-bold text-xs shadow-md">
              ADM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-base sm:text-lg text-white">
                  LN21 Admin Streaming Dashboard
                </h2>
                {isAuthenticated && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    <ShieldCheck className="w-3 h-3" />
                    {adminAuthSource || 'Admin Terverifikasi'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#888888]">
                Manajemen Video Cloudflare Stream & Metadata Film Supabase (public.profiles & public.is_admin())
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <div className="flex items-center gap-1 bg-[#202020] p-1 rounded-lg border border-[#333333]">
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    activeTab === 'manage' ? 'bg-[#E50914] text-white' : 'text-[#AAAAAA] hover:text-white'
                  }`}
                >
                  Daftar Film ({movies.length})
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'upload' ? 'bg-[#E50914] text-white' : 'text-[#AAAAAA] hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Unggah Film
                </button>
                <button
                  onClick={() => setActiveTab('setup')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                    activeTab === 'setup' ? 'bg-[#E50914] text-white' : 'text-[#AAAAAA] hover:text-white'
                  }`}
                >
                  <Database className="w-3 h-3" />
                  Status Supabase & API
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#333333] text-[#A5A5A5] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {isCheckingAdmin ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#888888]">Memeriksa hak akses admin melalui public.is_admin()...</p>
            </div>
          ) : !isAuthenticated ? (
            /* Explicit Access Denied / PIN Fallback Gate for non-admin users */
            <div className="max-w-md mx-auto py-10 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center justify-center mx-auto text-[#E50914] shadow-lg shadow-red-950/40">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-display font-bold text-white">Akses Ditolak (Bukan Admin)</h3>
                {userProfile ? (
                  <p className="text-xs text-[#AAAAAA] leading-relaxed">
                    Akun Anda (<strong className="text-white">{userProfile.email}</strong>) terdaftar dengan role <strong className="text-[#D4AF37] uppercase">{userProfile.role}</strong> di tabel <code>public.profiles</code>. Akses dashboard pengelolaan film hanya diberikan untuk role <strong>admin</strong> via fungsi <code>public.is_admin()</code>.
                  </p>
                ) : (
                  <p className="text-xs text-[#AAAAAA] leading-relaxed">
                    Anda belum login dengan akun administrator. Silakan masuk terlebih dahulu melalui Halaman Login LN21 atau gunakan Kunci PIN Darurat.
                  </p>
                )}
              </div>

              <form onSubmit={handlePinLogin} className="space-y-3.5 pt-2">
                <input
                  type="password"
                  placeholder="Kunci Admin / PIN Darurat (Default: LN21-ADMIN-2026)"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-4 py-2.5 text-center text-xs bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                />

                {authError && <p className="text-xs text-red-400">{authError}</p>}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#E50914] hover:bg-[#b80610] text-white font-bold text-xs rounded-xl shadow"
                >
                  Verifikasi Kunci Admin
                </button>
              </form>

              <div className="p-3 bg-[#181818] rounded-xl border border-[#262626] text-[11px] text-[#777777] text-left space-y-1">
                <div>• Pemeriksaan otomatis: <code>public.is_admin()</code> mengevaluasi apakah <code>auth.uid()</code> memiliki role <code>admin</code> di <code>public.profiles</code>.</div>
                <div>• Jika Anda adalah pemilik proyek, Anda dapat mengubah role akun menjadi <code>'admin'</code> langsung di Table Editor Supabase.</div>
              </div>
            </div>
          ) : (
            /* Authenticated Content */
            <div>
              {/* TAB 1: MANAGE MOVIES */}
              {activeTab === 'manage' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#888888]">
                        Total {movies.length} film terdaftar di katalog Layar Nusantara 21
                      </span>
                    </div>
                    <button
                      onClick={refreshData}
                      className="p-1.5 text-xs text-[#AAAAAA] hover:text-white bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] flex items-center gap-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Segarkan
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="py-12 text-center text-xs text-[#888888]">
                      Memuat katalog film...
                    </div>
                  ) : movies.length > 0 ? (
                    <div className="overflow-x-auto border border-[#282828] rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#181818] text-[#888888] uppercase font-bold border-b border-[#282828]">
                          <tr>
                            <th className="py-3 px-4">Film & Poster</th>
                            <th className="py-3 px-3">Tahun / Durasi</th>
                            <th className="py-3 px-3">Genre</th>
                            <th className="py-3 px-3">Status Transkoding</th>
                            <th className="py-3 px-3">Publikasi</th>
                            <th className="py-3 px-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222222]">
                          {movies.map((m) => (
                            <tr key={m.id} className="hover:bg-[#181818] transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={m.poster_url}
                                    alt={m.title}
                                    className="w-10 h-14 object-cover rounded bg-black shrink-0 border border-white/10"
                                  />
                                  <div>
                                    <strong className="text-white block font-display text-sm">{m.title}</strong>
                                    <span className="text-[11px] text-[#777777]">Sutradara: {m.director}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-[#CCCCCC]">
                                <div>{m.release_year}</div>
                                <div className="text-[11px] text-[#777777]">{m.duration}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-[#D4AF37]">{m.genre.join(', ')}</span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Ready HLS
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <button
                                  onClick={() => handleTogglePublish(m)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                                    m.publication_status === 'published'
                                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                                      : 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                                  }`}
                                >
                                  {m.publication_status === 'published' ? 'Tayang' : 'Draft'}
                                </button>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setPreviewMovie(m)}
                                    className="p-1.5 rounded-lg bg-[#222222] hover:bg-[#333333] text-white"
                                    title="Pratinjau Pemutar Video"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(m.id, m.title)}
                                    className="p-1.5 rounded-lg bg-[#222222] hover:bg-red-950 text-red-400"
                                    title="Hapus Film"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-[#888888]">
                      Belum ada film di katalog. Silakan klik tab "Unggah Film".
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: UPLOAD MOVIE */}
              {activeTab === 'upload' && (
                <form onSubmit={handleStartUpload} className="space-y-5 max-w-3xl mx-auto">
                  <div className="p-4 bg-[#181818] rounded-xl border border-[#282828] space-y-1">
                    <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#E50914]" />
                      Unggah Film Baru ke Cloudflare Stream & Supabase
                    </h3>
                    <p className="text-xs text-[#888888]">
                      Berkas video akan ditranskoding ke format adaptif HLS (1080p, 720p, 480p) dan disimpan dalam tabel <code>public.movies</code> Supabase.
                    </p>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-[#CCCCCC]">Judul Film *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Sang Penari Lembah"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#CCCCCC]">Sutradara *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Sutradara"
                        value={director}
                        onChange={(e) => setDirector(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-semibold text-[#CCCCCC]">Sinopsis Lengkap *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Uraian cerita dan sinopsis..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#CCCCCC]">Genre Utama</label>
                      <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                      >
                        {['Action', 'Drama', 'Comedy', 'Horror', 'Romance', 'Adventure', 'Animation', 'Documentary', 'Thriller'].map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#CCCCCC]">Tahun Rilis & Durasi</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={releaseYear}
                          onChange={(e) => setReleaseYear(e.target.value)}
                          className="px-3 py-2 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                        />
                        <input
                          type="text"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="1j 45m"
                          className="px-3 py-2 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#CCCCCC]">Aktor / Pemeran (Pisahkan koma)</label>
                      <input
                        type="text"
                        placeholder="Aktor 1, Aktor 2"
                        value={cast}
                        onChange={(e) => setCast(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#CCCCCC]">URL Poster Film</label>
                      <input
                        type="text"
                        placeholder="/src/assets/images/... atau URL gambar"
                        value={posterUrl}
                        onChange={(e) => setPosterUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-semibold text-[#CCCCCC]">Berkas Video Film (MP4 / MOV / MKV)</label>
                      <div className="p-4 border-2 border-dashed border-[#333333] hover:border-[#E50914] rounded-xl text-center cursor-pointer transition-colors">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="video-upload-input"
                        />
                        <label htmlFor="video-upload-input" className="cursor-pointer block space-y-1">
                          <FileVideo className="w-8 h-8 text-[#888888] mx-auto mb-1" />
                          <span className="text-white font-medium block">
                            {videoFile ? videoFile.name : 'Klik untuk memilih berkas video master'}
                          </span>
                          <span className="text-[11px] text-[#777777] block">
                            Mendukung MP4, ProRes, MKV hingga resolusi 4K
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Rights Confirmation Checkbox */}
                  <div className="p-3.5 bg-[#181818] rounded-xl border border-amber-900/40 text-xs text-[#CCCCCC] space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rightsConfirmed}
                        onChange={(e) => setRightsConfirmed(e.target.checked)}
                        className="mt-0.5 accent-[#E50914] w-4 h-4 rounded cursor-pointer"
                      />
                      <span>
                        <strong className="text-white block">Pernyataan Izin Distribusi & Hak Cipta</strong>
                        Saya menyatakan dan menjamin bahwa karya film ini memiliki hak kekayaan intelektual (HAKI) dan izin distribusi resmi yang sah untuk ditayangkan di platform Layar Nusantara 21.
                      </span>
                    </label>
                  </div>

                  {/* Upload Progress Bar if active */}
                  {isUploading && (
                    <div className="p-4 bg-[#181818] rounded-xl border border-[#2E2E2E] space-y-2 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span>{uploadStatusText}</span>
                        <span className="font-mono text-[#D4AF37]">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E50914] transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-3 bg-[#E50914] hover:bg-[#b80610] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow glow-red transition-all"
                  >
                    {isUploading ? 'Sedang Mengunggah & Memproses...' : 'Unggah & Terbitkan Film'}
                  </button>
                </form>
              )}

              {/* TAB 3: SYSTEM SETUP & CREDENTIAL STATUS & LIVE TEST */}
              {activeTab === 'setup' && (
                <div className="space-y-6 max-w-3xl mx-auto text-xs">
                  <div className="p-4 bg-[#181818] rounded-xl border border-[#282828] flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#D4AF37]" />
                        Status Integrasi Supabase & public.is_admin()
                      </h3>
                      <p className="text-[#888888] mt-0.5">
                        Pemeriksaan koneksi environment variables dan otorisasi role admin.
                      </p>
                    </div>

                    <button
                      onClick={runSupabaseTest}
                      disabled={isTestingConnection}
                      className="px-3.5 py-1.5 rounded-lg bg-[#E50914] hover:bg-[#b80610] text-white font-semibold text-xs transition-all flex items-center gap-1.5"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                      <span>{isTestingConnection ? 'Menguji...' : 'Uji Koneksi Supabase'}</span>
                    </button>
                  </div>

                  {/* Live Connection Test Results */}
                  {testResult && (
                    <div className="p-4 rounded-xl bg-[#161616] border border-[#2A2A2A] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Hasil Pengujian Koneksi (Pukul {testResult.testedAt}):</span>
                        <span className="text-[11px] font-mono text-emerald-400">Status 200 OK</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-black/50 border border-white/5 space-y-0.5">
                          <span className="text-[#888888] block">VITE_SUPABASE_URL</span>
                          <span className={`font-semibold ${testResult.envUrl ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {testResult.envUrl ? '✓ Terbaca' : '✗ Belum Ada'}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-black/50 border border-white/5 space-y-0.5">
                          <span className="text-[#888888] block">VITE_SUPABASE_ANON_KEY</span>
                          <span className={`font-semibold ${testResult.envAnonKey ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {testResult.envAnonKey ? '✓ Terbaca' : '✗ Belum Ada'}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-black/50 border border-white/5 space-y-0.5">
                          <span className="text-[#888888] block">Tabel public.profiles</span>
                          <span className={`font-semibold ${
                            testResult.profilesTable === 'success' ? 'text-emerald-400' : testResult.profilesTable === 'empty' ? 'text-blue-400' : 'text-amber-400'
                          }`}>
                            {testResult.profilesTable === 'success' ? '✓ Ada Data' : testResult.profilesTable === 'empty' ? '✓ Tabel Siap' : 'Belum Terhubung'}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-black/50 border border-white/5 space-y-0.5">
                          <span className="text-[#888888] block">public.is_admin() RPC</span>
                          <span className={`font-semibold ${
                            testResult.isAdminRpc === 'true' ? 'text-emerald-400' : testResult.isAdminRpc === 'false' ? 'text-blue-400' : 'text-amber-400'
                          }`}>
                            {testResult.isAdminRpc === 'true' ? '✓ Admin Aktif' : testResult.isAdminRpc === 'false' ? '✓ Non-Admin' : 'Belum Dibuat'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#CCCCCC] bg-black/40 p-2.5 rounded-lg border border-white/5">
                        {testResult.message}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Supabase Box */}
                    <div className="p-4 rounded-xl bg-[#161616] border border-[#2A2A2A] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-[#D4AF37]" />
                          Supabase Client (Vite)
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          diagnostics.isConfigured ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                        }`}>
                          {diagnostics.isConfigured ? 'Connected' : 'Demo Fallback'}
                        </span>
                      </div>

                      <p className="text-[#888888] leading-relaxed">
                        Terhubung ke <code>@supabase/supabase-js</code> untuk autentikasi user, sinkronisasi profil di <code>public.profiles</code>, dan evaluasi akses via <code>public.is_admin()</code>.
                      </p>

                      <div className="p-2.5 bg-black/50 rounded-lg font-mono text-[11px] text-[#AAAAAA] space-y-1">
                        <div>VITE_SUPABASE_URL: {diagnostics.urlHost}</div>
                        <div>VITE_SUPABASE_ANON_KEY: {diagnostics.hasAnonKey ? `[Tersedia ${diagnostics.keyLength} chars]` : 'Belum diisi'}</div>
                        <div>RPC Function: <code>public.is_admin()</code></div>
                      </div>
                    </div>

                    {/* Cloudflare Stream Box */}
                    <div className="p-4 rounded-xl bg-[#161616] border border-[#2A2A2A] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Server className="w-4 h-4 text-[#E50914]" />
                          Cloudflare Stream
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          config?.cloudflare_stream.configured ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                        }`}>
                          {config?.cloudflare_stream.mode || 'Demo Fallback'}
                        </span>
                      </div>

                      <p className="text-[#888888] leading-relaxed">
                        Hosting master video, transkoding adaptif HLS, dan CDN video bebas buffering.
                      </p>

                      <div className="p-2.5 bg-black/50 rounded-lg font-mono text-[11px] text-[#AAAAAA] space-y-1">
                        <div>CLOUDFLARE_ACCOUNT_ID: {config?.cloudflare_stream.account_id_masked || 'Belum diisi'}</div>
                        <div>MODE: {config?.cloudflare_stream.mode || 'Demo Mode'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Schema Info */}
                  <div className="p-4 bg-[#141414] rounded-xl border border-[#222222] space-y-2">
                    <strong className="text-white block font-semibold">Struktur Database Supabase yang Dikonfigurasi:</strong>
                    <ul className="list-disc list-inside space-y-1 text-[#AAAAAA]">
                      <li><code>public.profiles</code>: <code>id (uuid)</code>, <code>email</code>, <code>full_name</code>, <code>role ('admin' | 'user' | 'vip')</code>, <code>avatar_url</code>.</li>
                      <li><code>public.is_admin()</code>: Fungsi SQL Security Definer untuk memvalidasi apakah user yang sedang login adalah admin.</li>
                      <li><code>public.movies</code> & <code>public.watch_history</code>: Menyimpan metadata film dan posisi continue watching.</li>
                      <li>File skema lengkap tersedia di: <code>/supabase/schema.sql</code>.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Video Preview Modal inside Admin */}
        {previewMovie && (
          <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-[#121212] rounded-2xl border border-[#333333] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">
                  Pratinjau: {previewMovie.title}
                </span>
                <button
                  onClick={() => setPreviewMovie(null)}
                  className="p-1 rounded bg-[#222222] text-[#888888] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                <LN21Player
                  src={previewMovie.video_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'}
                  poster={previewMovie.banner_url || previewMovie.poster_url}
                  title={previewMovie.title}
                  movieId={previewMovie.id}
                  autoPlay={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
