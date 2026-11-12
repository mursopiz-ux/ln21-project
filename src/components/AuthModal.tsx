/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, User, Lock, Mail, Sparkles, CheckCircle2, ShieldCheck, ShieldAlert, ArrowRight, Database } from 'lucide-react';
import {
  signInWithEmailPassword,
  signUpWithEmailPassword,
  signOutSupabase,
  UserProfile,
  isSupabaseConfigured,
  getSupabaseDiagnostics
} from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: UserProfile) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  userProfile?: UserProfile | null;
  isAdmin?: boolean;
  onOpenAdminDashboard?: () => void;
  onOpenLoginPage?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isLoggedIn,
  onLogout,
  userProfile,
  isAdmin = false,
  onOpenAdminDashboard,
  onOpenLoginPage
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  const diagnostics = getSupabaseDiagnostics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');
    setIsLoading(true);

    try {
      if (isRegister) {
        const { user, profile, error } = await signUpWithEmailPassword(email, password, name);
        if (error) {
          setErrorMessage(error.message || 'Gagal mendaftar akun');
          setIsLoading(false);
          return;
        }

        if (profile) {
          onLoginSuccess(profile);
          onClose();
        } else {
          setSuccessNotice('Pendaftaran berhasil! Silakan periksa email konfirmasi jika verifikasi diaktifkan di Supabase.');
        }
      } else {
        const { user, profile, error } = await signInWithEmailPassword(email, password);
        if (error) {
          setErrorMessage(error.message === 'Invalid login credentials' 
            ? 'Email atau kata sandi tidak sesuai.' 
            : (error.message || 'Gagal masuk akun'));
          setIsLoading(false);
          return;
        }

        if (profile) {
          onLoginSuccess(profile);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (role: 'admin' | 'vip') => {
    const demoProfile: UserProfile = {
      id: `demo-${Date.now()}`,
      email: role === 'admin' ? 'admin@layarnusantara21.cinema' : 'penonton.vip@layarnusantara21.cinema',
      full_name: role === 'admin' ? 'Admin LN21 Resmi' : 'Budi Santoso (VIP)',
      role: role === 'admin' ? 'admin' : 'vip'
    };
    onLoginSuccess(demoProfile);
    onClose();
  };

  const handleSignOut = async () => {
    await signOutSupabase();
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#141414] rounded-2xl border border-[#2A2A2A] overflow-hidden shadow-2xl my-auto text-white p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#222222] hover:bg-[#333333] text-[#A5A5A5] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoggedIn && userProfile ? (
          /* Profile Logged-in View */
          <div className="text-center space-y-5 py-4">
            <div className={`w-16 h-16 rounded-full font-bold text-2xl flex items-center justify-center mx-auto shadow-lg ${
              userProfile.role === 'admin' || isAdmin
                ? 'bg-gradient-to-br from-[#E50914] to-red-800 text-white shadow-red-900/50'
                : 'bg-gradient-to-br from-[#E50914] to-[#D4AF37] text-white shadow-red-900/40'
            }`}>
              {(userProfile.full_name || userProfile.email || 'U').charAt(0).toUpperCase()}
            </div>
            
            <div className="space-y-1">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                userProfile.role === 'admin' || isAdmin
                  ? 'bg-red-950/60 text-red-400 border-red-700/50'
                  : 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40'
              }`}>
                {userProfile.role === 'admin' || isAdmin ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    ROLE: ADMINISTRATOR (is_admin: true)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    ROLE: {userProfile.role.toUpperCase()}
                  </>
                )}
              </div>
              <h3 className="text-xl font-bold font-display">{userProfile.full_name}</h3>
              <p className="text-xs text-[#888888] font-mono">{userProfile.email}</p>
            </div>

            {/* Quick action for admin */}
            {(userProfile.role === 'admin' || isAdmin) && onOpenAdminDashboard && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminDashboard();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#E50914] hover:bg-[#b80610] text-white text-xs font-bold shadow-md shadow-red-950/40 glow-red transition-all flex items-center justify-center gap-2"
              >
                <span>Buka Dashboard Admin Langsung</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="p-3.5 bg-[#1C1C1C] rounded-xl border border-[#2D2D2D] text-left text-xs text-[#CCCCCC] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#888888]">Tabel Database:</span>
                <span className="font-mono text-[#D4AF37]">public.profiles</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#888888]">Hak Akses Unggah:</span>
                <span className={`font-semibold ${userProfile.role === 'admin' || isAdmin ? 'text-emerald-400' : 'text-[#888888]'}`}>
                  {userProfile.role === 'admin' || isAdmin ? 'Diizinkan (Admin)' : 'Penonton Saja'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#888888]">Koneksi Auth:</span>
                <span className="text-emerald-400 font-medium">
                  {diagnostics.isConfigured ? 'Supabase Auth' : 'Demo Local Auth'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 rounded-xl bg-[#222222] hover:bg-[#2C2C2C] text-[#E50914] text-xs font-bold border border-[#333333] transition-colors"
            >
              Keluar dari Akun
            </button>
          </div>
        ) : (
          /* Login/Register Form */
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] font-semibold bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                {diagnostics.isConfigured ? 'Supabase Authentication' : 'Akses Eksklusif LN21'}
              </div>
              <h3 className="text-2xl font-display font-extrabold text-white">
                {isRegister ? 'Daftar Akun Baru' : 'Masuk ke LN21'}
              </h3>
              <p className="text-xs text-[#888888]">
                {isRegister
                  ? 'Daftar dengan email dan password untuk akun penonton atau kurator'
                  : 'Masuk dengan email & password akun Supabase Anda'}
              </p>
            </div>

            {/* Error or Notice messages */}
            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-xs text-red-300">
                {errorMessage}
              </div>
            )}
            {successNotice && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/50 rounded-xl text-xs text-emerald-300">
                {successNotice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-[#CCCCCC] mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#777777] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Raden Satria"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#1C1C1C] border border-[#303030] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#CCCCCC] mb-1">Alamat Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#777777] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#1C1C1C] border border-[#303030] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCCCCC] mb-1">Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#777777] absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#1C1C1C] border border-[#303030] rounded-xl text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80610] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-red-950/40 glow-red transition-all"
              >
                {isLoading ? 'Memproses Autentikasi...' : isRegister ? 'Buat Akun LN21' : 'Masuk Sekarang'}
              </button>
            </form>

            {/* Quick Demo Access & Role Testing */}
            <div className="pt-2 border-t border-[#252525] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  className="py-1.5 px-2 rounded-lg bg-[#1C1C1C] hover:bg-[#252525] border border-red-900/40 text-[11px] font-semibold text-red-400 transition-colors text-center"
                  title="Masuk sebagai Administrator untuk menguji akses admin"
                >
                  ⚡ Masuk Demo Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('vip')}
                  className="py-1.5 px-2 rounded-lg bg-[#1C1C1C] hover:bg-[#252525] border border-amber-900/40 text-[11px] font-semibold text-[#D4AF37] transition-colors text-center"
                  title="Masuk sebagai Penonton VIP"
                >
                  ⚡ Masuk Demo VIP
                </button>
              </div>

              <div className="text-center pt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setErrorMessage('');
                    setSuccessNotice('');
                  }}
                  className="text-xs text-[#A5A5A5] hover:text-white block w-full"
                >
                  {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Buat akun sekarang'}
                </button>
                {onOpenLoginPage && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLoginPage();
                    }}
                    className="text-[11px] text-[#D4AF37] hover:text-amber-300 block w-full pt-1"
                  >
                    Buka Halaman Login Penuh (/login) &rarr;
                  </button>
                )}
              </div>

              {/* Status footer banner */}
              <div className="pt-2 flex items-center justify-between text-[10px] text-[#777777]">
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-[#D4AF37]" />
                  {diagnostics.isConfigured ? 'Supabase Aktif' : 'Menunggu VITE_SUPABASE_URL'}
                </span>
                <span>Tabel: public.profiles</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
