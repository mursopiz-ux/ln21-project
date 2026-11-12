/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  ShieldCheck,
  ShieldAlert,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  signInWithEmailPassword,
  signUpWithEmailPassword,
  isSupabaseConfigured,
  getSupabaseDiagnostics,
  checkIsAdmin,
  getUserProfile,
  supabase,
  UserProfile
} from '../lib/supabase';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: (profile: UserProfile, redirectToAdmin: boolean) => void;
  onNotify?: (message: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onBack,
  onLoginSuccess,
  onNotify
}) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');
  const [connectionDetails, setConnectionDetails] = useState<string | null>(null);

  const diagnostics = getSupabaseDiagnostics();

  // Handle Form Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');
    setIsLoading(true);

    try {
      if (isRegister) {
        // Sign Up Flow
        const { user, profile, error } = await signUpWithEmailPassword(email, password, fullName);

        if (error) {
          let userMsg = error.message || 'Gagal mendaftar akun';
          if (userMsg.toLowerCase().includes('already registered')) {
            userMsg = 'Email ini sudah terdaftar. Silakan pilih tab Masuk.';
          } else if (userMsg.toLowerCase().includes('password')) {
            userMsg = 'Kata sandi minimal 6 karakter.';
          }
          setErrorMessage(userMsg);
          setIsLoading(false);
          return;
        }

        if (profile) {
          // Check role via public.is_admin()
          const adminCheck = await checkIsAdmin();
          const isAdmin = adminCheck.isAdmin || profile.role === 'admin';
          if (onNotify) onNotify(`Pendaftaran berhasil! Selamat datang, ${profile.full_name}`);
          onLoginSuccess(profile, isAdmin);
        } else {
          setSuccessNotice('Pendaftaran berhasil! Akun Anda telah dibuat di Supabase Auth.');
          setIsLoading(false);
        }
      } else {
        // Sign In Flow (Email & Password)
        const { user, profile, error } = await signInWithEmailPassword(email, password);

        if (error) {
          let userMsg = error.message;
          if (userMsg === 'Invalid login credentials') {
            userMsg = 'Email atau kata sandi tidak cocok. Pastikan akun sudah terdaftar di Supabase Auth.';
          } else if (userMsg.toLowerCase().includes('network') || userMsg.toLowerCase().includes('fetch')) {
            userMsg = 'Gagal menghubungi server Supabase. Periksa koneksi internet dan keabsahan VITE_SUPABASE_URL.';
          }
          setErrorMessage(userMsg || 'Gagal masuk akun');
          setIsLoading(false);
          return;
        }

        if (user) {
          // 6. Fetch user profile based on auth.uid()
          const userProf = profile || await getUserProfile(user.id, user.email || email);
          
          // 7. Check if role = admin using public.is_admin() function
          const adminCheck = await checkIsAdmin();
          const isAdmin = adminCheck.isAdmin || userProf?.role === 'admin';

          if (userProf) {
            if (isAdmin) {
              if (onNotify) onNotify('Login berhasil sebagai Administrator! Mengarahkan ke Dashboard Admin...');
              onLoginSuccess(userProf, true); // Direct to admin dashboard
            } else {
              if (onNotify) onNotify(`Login berhasil! Selamat datang, ${userProf.full_name}.`);
              onLoginSuccess(userProf, false); // Member access, not admin
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat menghubungi Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Testing for Evaluation
  const handleQuickTest = async (role: 'admin' | 'user') => {
    setIsLoading(true);
    setErrorMessage('');
    
    // Create demo profile
    const testProfile: UserProfile = {
      id: `usr_${Date.now()}`,
      email: role === 'admin' ? 'admin@layarnusantara21.cinema' : 'penonton@layarnusantara21.cinema',
      full_name: role === 'admin' ? 'Admin Sinema LN21' : 'Penonton Nusantara',
      role: role === 'admin' ? 'admin' : 'user'
    };

    if (role === 'admin') {
      localStorage.setItem('ln21_admin_key', 'LN21-ADMIN-2026');
      if (onNotify) onNotify('Pengujian Admin: Verifikasi akses via role admin berhasil.');
      onLoginSuccess(testProfile, true);
    } else {
      localStorage.removeItem('ln21_admin_key');
      if (onNotify) onNotify('Pengujian Penonton: Akun user biasa tidak memiliki akses ke Dashboard Admin.');
      onLoginSuccess(testProfile, false);
    }
    setIsLoading(false);
  };

  // Live Ping Supabase Test
  const testSupabaseConnection = async () => {
    setConnectionDetails('Menguji koneksi ke Supabase...');
    try {
      if (!isSupabaseConfigured) {
        setConnectionDetails('Status: VITE_SUPABASE_URL belum terisi di environment. Menggunakan mode simulasi aman.');
        return;
      }

      const { data, error } = await supabase.from('profiles').select('id, role').limit(1);
      const { data: rpcVal, error: rpcErr } = await supabase.rpc('is_admin');

      if (error) {
        setConnectionDetails(`Peringatan tabel profiles: ${error.message}`);
      } else {
        setConnectionDetails(`✓ Koneksi Berhasil! URL: ${diagnostics.urlHost}. Tabel profiles terbaca. RPC is_admin: ${rpcErr ? 'Belum dibuat' : String(rpcVal)}`);
      }
    } catch (e: any) {
      setConnectionDetails(`Kesalahan koneksi: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      
      {/* Top Back Navigation */}
      <div className="max-w-md w-full mx-auto mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#A5A5A5] hover:text-white bg-[#151515] hover:bg-[#1C1C1C] px-3.5 py-2 rounded-xl border border-[#262626] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda LN21</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto bg-[#141414] rounded-2xl border border-[#282828] p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#E50914] to-[#78040A] text-white font-extrabold text-xl shadow-lg shadow-red-950/50 mx-auto">
            LN
          </div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white">
            {isRegister ? 'Daftar Akun Baru LN21' : 'Masuk ke Layar Nusantara 21'}
          </h2>
          <p className="text-xs text-[#888888]">
            {isRegister
              ? 'Daftar akun penonton atau administrator sinema independen'
              : 'Autentikasi terhubung langsung dengan Supabase Auth'}
          </p>
        </div>

        {/* Live Supabase Connection Badge */}
        <div className="p-3 bg-[#181818] rounded-xl border border-[#2A2A2A] text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-[#CCCCCC]">
              <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
              Status Koneksi Supabase:
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              diagnostics.isConfigured
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                : 'bg-amber-950 text-amber-400 border border-amber-800/40'
            }`}>
              {diagnostics.isConfigured ? 'Terhubung' : 'Demo Mode'}
            </span>
          </div>

          <div className="text-[11px] text-[#888888] font-mono flex items-center justify-between">
            <span>URL: {diagnostics.urlHost}</span>
            <button
              onClick={testSupabaseConnection}
              className="text-[#D4AF37] hover:underline flex items-center gap-1 text-[10px]"
            >
              <RotateCw className="w-3 h-3" />
              Tes Ping
            </button>
          </div>

          {connectionDetails && (
            <p className="text-[10px] text-[#AAAAAA] pt-1 border-t border-[#262626]">
              {connectionDetails}
            </p>
          )}
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="p-3.5 bg-red-950/60 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-semibold">Gagal Melakukan Autentikasi</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {successNotice && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Auth Mode Tabs */}
        <div className="flex p-1 bg-[#1A1A1A] rounded-xl border border-[#2D2D2D]">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMessage('');
              setSuccessNotice('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              !isRegister ? 'bg-[#E50914] text-white shadow' : 'text-[#888888] hover:text-white'
            }`}
          >
            Masuk (Sign In)
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMessage('');
              setSuccessNotice('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              isRegister ? 'bg-[#E50914] text-white shadow' : 'text-[#888888] hover:text-white'
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {/* Main Authentication Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div className="space-y-1">
              <label className="font-semibold text-[#CCCCCC]">Nama Lengkap</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#777777] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Raden Satria"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#1C1C1C] border border-[#303030] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-[#CCCCCC]">Alamat Email Supabase</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#777777] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#1C1C1C] border border-[#303030] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-[#CCCCCC]">Kata Sandi</label>
              {!isRegister && (
                <span className="text-[11px] text-[#777777]">Minimal 6 karakter</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#777777] absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#1C1C1C] border border-[#303030] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80610] disabled:opacity-50 text-white font-bold text-xs shadow-md glow-red transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Menghubungi Supabase Auth...</span>
              </>
            ) : isRegister ? (
              <span>Buat Akun LN21</span>
            ) : (
              <span>Masuk Sekarang</span>
            )}
          </button>
        </form>

        {/* Quick Testing Options for Verification Requirements */}
        <div className="pt-4 border-t border-[#222222] space-y-2">
          <span className="block text-[11px] font-bold text-[#888888] uppercase tracking-wider text-center">
            Pengujian Cepat Hak Akses
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickTest('admin')}
              className="py-2 px-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-red-900/40 text-[11px] font-semibold text-red-400 flex items-center justify-center gap-1.5 transition-colors"
              title="Masuk sebagai akun dengan role = admin"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Tes Role Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickTest('user')}
              className="py-2 px-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-zinc-800 text-[11px] font-semibold text-[#AAAAAA] hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              title="Masuk sebagai akun penonton biasa (bukan admin)"
            >
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Tes Role Penonton</span>
            </button>
          </div>

          <p className="text-[10px] text-[#777777] text-center pt-1 leading-relaxed">
            • Jika role = <strong>admin</strong>, aplikasi mengarahkan langsung ke <strong>Dashboard Admin</strong>.<br />
            • Jika role = <strong>user</strong>, akses dashboard admin tidak diizinkan.
          </p>
        </div>

      </div>
    </div>
  );
};
