/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MovieItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  poster_url: string;
  banner_url?: string;
  release_year: number;
  genre: string[];
  duration: string;
  duration_minutes: number;
  director: string;
  cast_members: string[];
  video_uid: string;
  video_url: string;
  playback_status: 'uploading' | 'processing' | 'ready' | 'error';
  publication_status: 'draft' | 'published' | 'archived';
  rating: number;
  quality: string;
  age_rating: string;
  country: string;
  awards?: string[];
  tagline?: string;
  created_at: string;
}

export interface WatchHistoryItem {
  id: string;
  user_id: string;
  movie_id: string;
  playback_position: number;
  duration_seconds: number;
  completed: boolean;
  updated_at: string;
  movie?: MovieItem;
}

export interface SystemConfig {
  cloudflare_stream: {
    configured: boolean;
    account_id_masked: string | null;
    mode: string;
  };
  supabase: {
    configured: boolean;
    url_masked: string | null;
    mode: string;
  };
  admin_protection: {
    enabled: boolean;
    hint: string;
  };
  server_time: string;
}

export const api = {
  async getConfig(): Promise<SystemConfig> {
    try {
      const res = await fetch('/api/config');
      return await res.json();
    } catch (e) {
      console.warn('Failed to fetch config:', e);
      return {
        cloudflare_stream: { configured: false, account_id_masked: null, mode: 'demo_fallback' },
        supabase: { configured: false, url_masked: null, mode: 'in_memory_fallback' },
        admin_protection: { enabled: true, hint: 'LN21-ADMIN-2026' },
        server_time: new Date().toISOString()
      };
    }
  },

  async getMovies(params?: { genre?: string; status?: string; search?: string }): Promise<MovieItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.genre && params.genre !== 'Semua Genre') query.append('genre', params.genre);
      if (params?.status) query.append('status', params.status);
      if (params?.search) query.append('search', params.search);

      const res = await fetch(`/api/movies?${query.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil film');
      return await res.json();
    } catch (e) {
      console.error('getMovies error:', e);
      return [];
    }
  },

  async getMovieById(id: string): Promise<MovieItem | null> {
    try {
      const res = await fetch(`/api/movies/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('getMovieById error:', e);
      return null;
    }
  },

  async createMovie(data: Partial<MovieItem> & { rights_confirmed: boolean }, adminKey: string): Promise<MovieItem> {
    const res = await fetch('/api/movies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal membuat film' }));
      throw new Error(err.error || 'Gagal membuat film');
    }
    return await res.json();
  },

  async updateMovie(id: string, data: Partial<MovieItem>, adminKey: string): Promise<MovieItem> {
    const res = await fetch(`/api/movies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal memperbarui film' }));
      throw new Error(err.error || 'Gagal memperbarui film');
    }
    return await res.json();
  },

  async deleteMovie(id: string, adminKey: string): Promise<void> {
    const res = await fetch(`/api/movies/${id}`, {
      method: 'DELETE',
      headers: {
        'x-admin-key': adminKey
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal menghapus film' }));
      throw new Error(err.error || 'Gagal menghapus film');
    }
  },

  async togglePublish(id: string, status: 'published' | 'draft', adminKey: string): Promise<void> {
    const res = await fetch(`/api/movies/${id}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      throw new Error('Gagal mengubah status publikasi');
    }
  },

  async initiateDirectUpload(adminKey: string): Promise<{ uid: string; uploadURL: string; hlsURL: string; provider: string }> {
    const res = await fetch('/api/stream/direct-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey
      },
      body: JSON.stringify({ maxDurationSeconds: 14400 })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal inisiasi direct upload' }));
      throw new Error(err.error || 'Gagal inisiasi direct upload');
    }
    return await res.json();
  },

  async checkStreamStatus(uid: string): Promise<{ uid: string; status: string; pctComplete: number; hlsURL: string }> {
    const res = await fetch(`/api/stream/status/${uid}`);
    if (!res.ok) throw new Error('Gagal memeriksa status streaming');
    return await res.json();
  },

  async getWatchHistory(userId: string): Promise<WatchHistoryItem[]> {
    try {
      const res = await fetch(`/api/watch-history/${userId}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn('getWatchHistory error:', e);
      return [];
    }
  },

  async saveWatchPosition(userId: string, movieId: string, position: number, duration: number): Promise<void> {
    try {
      await fetch('/api/watch-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          movie_id: movieId,
          playback_position: Math.floor(position),
          duration_seconds: Math.floor(duration)
        })
      });
    } catch (e) {
      console.warn('Failed to save watch position:', e);
    }
  }
};
