/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// 1. Read environment variables from Vite
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Check if valid credentials are present
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
  !SUPABASE_URL.includes('placeholder')
);

// Diagnostics object (Safely masks values - NEVER exposes keys)
export const getSupabaseDiagnostics = () => {
  return {
    isConfigured: isSupabaseConfigured,
    hasUrl: Boolean(SUPABASE_URL),
    hasAnonKey: Boolean(SUPABASE_ANON_KEY),
    urlHost: SUPABASE_URL ? (() => {
      try {
        return new URL(SUPABASE_URL).hostname;
      } catch {
        return 'URL tidak valid';
      }
    })() : 'Belum diisi',
    keyLength: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.length : 0,
    timestamp: new Date().toISOString()
  };
};

// 2. Initialize the Supabase Client
// Provide a safe fallback if credentials are not yet configured so the app runs smoothly
const clientUrl = isSupabaseConfigured ? SUPABASE_URL : 'https://ln21-placeholder.supabase.co';
const clientKey = isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder-anon-key-ln21';

export const supabase: SupabaseClient = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Profile Interface mapping to public.profiles
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'user' | 'vip';
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

// 3. Profiles Service: Fetch or ensure user profile exists in public.profiles
export async function getUserProfile(userId: string, email?: string, fullName?: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) {
    // Local / Demo user fallback
    return {
      id: userId,
      email: email || 'user@ln21.cinema',
      full_name: fullName || 'Penonton LN21',
      role: email?.includes('admin') ? 'admin' : 'vip'
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[LN21 Supabase] Fetch profile notice:', error.message);
    }

    if (data) {
      return data as UserProfile;
    }

    // If profile does not exist yet, create default profile row
    const newProfile: Partial<UserProfile> = {
      id: userId,
      email: email || '',
      full_name: fullName || email?.split('@')[0] || 'Member LN21',
      role: 'user'
    };

    const { data: created, error: createError } = await supabase
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (!createError && created) {
      return created as UserProfile;
    }

    return newProfile as UserProfile;
  } catch (err) {
    console.warn('[LN21 Supabase] Profile operation exception:', err);
    return {
      id: userId,
      email: email || '',
      full_name: fullName || 'Member LN21',
      role: 'user'
    };
  }
}

// 4. Role & Admin Access Check using public.is_admin() RPC
export async function checkIsAdmin(): Promise<{ isAdmin: boolean; source: 'rpc' | 'profiles_table' | 'fallback' }> {
  if (!isSupabaseConfigured) {
    // If Supabase is not yet configured, check if local admin session key is active
    const localKey = localStorage.getItem('ln21_admin_key');
    const isAdmin = localKey === 'LN21-ADMIN-2026';
    return { isAdmin, source: 'fallback' };
  }

  try {
    // Primary: Call the requested Supabase RPC function public.is_admin()
    const { data, error } = await supabase.rpc('is_admin');

    if (!error && typeof data === 'boolean') {
      return { isAdmin: data, source: 'rpc' };
    }

    // Secondary: If RPC is not created yet or errors, query public.profiles directly
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && profile.role === 'admin') {
        return { isAdmin: true, source: 'profiles_table' };
      }
    }

    return { isAdmin: false, source: 'rpc' };
  } catch (err) {
    console.warn('[LN21 Supabase] checkIsAdmin error:', err);
    return { isAdmin: false, source: 'fallback' };
  }
}

// 5. Authentication Helpers: Sign In, Sign Up, Sign Out
export async function signInWithEmailPassword(email: string, password: string) {
  if (!isSupabaseConfigured) {
    // Demo fallback when environment keys are pending
    const isAdminUser = email.toLowerCase().includes('admin');
    const demoProfile: UserProfile = {
      id: `demo-${Date.now()}`,
      email,
      full_name: email.split('@')[0],
      role: isAdminUser ? 'admin' : 'vip'
    };
    return { user: { id: demoProfile.id, email }, profile: demoProfile, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { user: null, profile: null, error };
  }

  const profile = data.user ? await getUserProfile(data.user.id, data.user.email) : null;
  return { user: data.user, profile, error: null };
}

export async function signUpWithEmailPassword(email: string, password: string, fullName: string) {
  if (!isSupabaseConfigured) {
    const demoProfile: UserProfile = {
      id: `demo-${Date.now()}`,
      email,
      full_name: fullName,
      role: 'user'
    };
    return { user: { id: demoProfile.id, email }, profile: demoProfile, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    return { user: null, profile: null, error };
  }

  const profile = data.user ? await getUserProfile(data.user.id, data.user.email, fullName) : null;
  return { user: data.user, profile, error: null };
}

export async function signOutSupabase() {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
  }
}
