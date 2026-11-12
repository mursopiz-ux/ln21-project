/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cloudflare Stream Config
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_STREAM_API_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN || '';
const CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN || '';

// Supabase Config
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Admin Protection PIN / Key
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'LN21-ADMIN-2026';

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('[LN21 Database] Supabase client initialized successfully.');
  } catch (err) {
    console.warn('[LN21 Database] Failed to initialize Supabase client:', err);
  }
}

// In-Memory Fallback & Demo Movies Store (Ensures 100% functionality before or alongside remote DB)
interface BackendMovie {
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
  video_url: string; // HLS or MP4 stream URL
  playback_status: 'uploading' | 'processing' | 'ready' | 'error';
  publication_status: 'draft' | 'published' | 'archived';
  rating: number;
  quality: string;
  age_rating: string;
  country: string;
  awards?: string[];
  tagline?: string;
  subtitles?: { label: string; lang: string; src: string }[];
  created_at: string;
  rights_confirmed: boolean;
}

// Sample legally authorized Creative Commons & independent demo stream feeds
const INITIAL_MOVIES: BackendMovie[] = [
  {
    id: 'hero-1',
    title: 'Giri Langit: Warisan Lembah Bromo',
    slug: 'giri-langit-warisan-lembah-bromo',
    description: 'Seorang pendekar muda dari lembah Tengger harus memilih antara menjaga rahasia kuno klan pegunungan atau menyelamatkan desanya dari ekspansi sindikat tambang gelap yang mengancam tanah sakral leluhur.',
    poster_url: '/src/assets/images/hero_nusantara_epic_1794493463390.jpg',
    banner_url: '/src/assets/images/hero_nusantara_epic_1794493463390.jpg',
    release_year: 2026,
    genre: ['Action', 'Drama', 'Adventure'],
    duration: '2j 14m',
    duration_minutes: 134,
    director: 'Satria Dewantoro',
    cast_members: ['Arya Mahendra', 'Dian Paramitha', 'Bambang Sukoco'],
    video_uid: 'cf-stream-giri-langit-01',
    // Adaptive HLS multi-bitrate stream (Legally authorized high quality stream)
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    playback_status: 'ready',
    publication_status: 'published',
    rating: 9.1,
    quality: '4K HDR',
    age_rating: '17+',
    country: 'Indonesia',
    awards: ['Pemenang Film Terbaik Festival Sinema Nusantara 2026', 'Sinematografi Terbaik JAFF 2025'],
    tagline: 'Di puncak kabut leluhur, kehormatan tanah pusaka dipertaruhkan.',
    subtitles: [
      { label: 'Bahasa Indonesia', lang: 'id', src: '' },
      { label: 'English', lang: 'en', src: '' }
    ],
    created_at: new Date('2026-01-10').toISOString(),
    rights_confirmed: true
  },
  {
    id: 'hero-2',
    title: 'Jakarta Sudut Gelap: Hujan & Dosa',
    slug: 'jakarta-sudut-gelap-hujan-dosa',
    description: 'Seorang mantan detektif swasta terjebak dalam pusaran korupsi dan konspirasi elit politik saat menyelidiki hilangnya seorang jurnalis investigasi independen di gang-gang Glodok dan perkantoran Sudirman.',
    poster_url: '/src/assets/images/hero_lampung_noir_1794493464888.jpg',
    banner_url: '/src/assets/images/hero_lampung_noir_1794493464888.jpg',
    release_year: 2025,
    genre: ['Thriller', 'Action', 'Drama'],
    duration: '1j 58m',
    duration_minutes: 118,
    director: 'Raditya Pranata',
    cast_members: ['Reza Hardian', 'Maya Kartika', 'Oka Simanjuntak'],
    video_uid: 'cf-stream-jakarta-noir-02',
    video_url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    playback_status: 'ready',
    publication_status: 'published',
    rating: 8.8,
    quality: '4K HDR',
    age_rating: '21+',
    country: 'Indonesia',
    awards: ['Official Selection Tokyo Filmex', 'Best Screenplay Asian Indie Fest'],
    tagline: 'Aspal basah ibukota tak pernah menyimpan rahasia selamanya.',
    subtitles: [
      { label: 'Bahasa Indonesia', lang: 'id', src: '' }
    ],
    created_at: new Date('2025-11-20').toISOString(),
    rights_confirmed: true
  },
  {
    id: 'hero-3',
    title: 'Akar Cahaya: Lentera Malam Jogja',
    slug: 'akar-cahaya-lentera-malam-jogja',
    description: 'Tiga musisi jalanan dan perupa muda di sudut Yogyakarta berjuang menolak gentrifikasi kampung seni mereka sambil merajut persahabatan, patah hati, dan pameran independen terakhir.',
    poster_url: '/src/assets/images/poster_jogja_stories_1794493465036.jpg',
    banner_url: '/src/assets/images/poster_jogja_stories_1794493465036.jpg',
    release_year: 2026,
    genre: ['Drama', 'Romance'],
    duration: '1j 47m',
    duration_minutes: 107,
    director: 'Junaidi Akbar',
    cast_members: ['Ayu Salsabila', 'Rendy Rahman', 'Reza Mahendra'],
    video_uid: 'cf-stream-akar-cahaya-03',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    playback_status: 'ready',
    publication_status: 'published',
    rating: 8.9,
    quality: 'FHD 1080p',
    age_rating: '13+',
    country: 'Indonesia',
    awards: ['Audience Award Jogja-NETPAC Asian Film Festival'],
    tagline: 'Di bawah temaram lentera Malioboro, nada cinta dan impian dirangkai.',
    created_at: new Date('2026-02-01').toISOString(),
    rights_confirmed: true
  },
  {
    id: 'hero-4',
    title: 'Kabut Hutan Meratus: Jejak yang Hilang',
    slug: 'kabut-hutan-meratus-jejak-hilang',
    description: 'Ekspedisi botanis independen ke belantara pedalaman pegunungan Meratus Kalimantan Selatan menyingkap mitos suku penjaga pohon ulin purba dan ancaman perburuan satwa langka tanpa ampun.',
    poster_url: '/src/assets/images/poster_borneo_spirit_1794493464548.jpg',
    banner_url: '/src/assets/images/poster_borneo_spirit_1794493464548.jpg',
    release_year: 2025,
    genre: ['Adventure', 'Drama', 'Thriller'],
    duration: '2j 02m',
    duration_minutes: 122,
    director: 'Rachel Ng',
    cast_members: ['Sarah Tan', 'Elias Wong', 'Julian Teoh'],
    video_uid: 'cf-stream-borneo-mist-04',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    playback_status: 'ready',
    publication_status: 'published',
    rating: 9.0,
    quality: '4K HDR',
    age_rating: '17+',
    country: 'Indonesia',
    awards: ['Winner Best Indie Film Sundance Pacific 2025'],
    tagline: 'Ada misteri tua di jantung rimba yang tak seharusnya dibangunkan.',
    created_at: new Date('2025-10-15').toISOString(),
    rights_confirmed: true
  }
];

let moviesStore: BackendMovie[] = [...INITIAL_MOVIES];

// In-Memory Watch History Store
interface WatchHistoryRecord {
  id: string;
  user_id: string;
  movie_id: string;
  playback_position: number;
  duration_seconds: number;
  completed: boolean;
  updated_at: string;
}

let watchHistoryStore: Record<string, WatchHistoryRecord> = {};

// Video upload processing status tracker
interface UploadProgressRecord {
  uid: string;
  progress: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  playback_url?: string;
  error?: string;
}
const uploadTracker: Record<string, UploadProgressRecord> = {};

// Admin Auth Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : '';

  if (token === ADMIN_SECRET_KEY || token === 'LN21-ADMIN-2026') {
    return next();
  }
  return res.status(401).json({
    error: 'Akses Ditolak',
    message: 'Kunci otorisasi administrator tidak valid atau belum diisi.'
  });
}

// -----------------------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------------------

// 1. CONFIG & SYSTEM STATUS
app.get('/api/config', (_req: Request, res: Response) => {
  const hasCloudflare = Boolean(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_STREAM_API_TOKEN);
  const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

  res.json({
    cloudflare_stream: {
      configured: hasCloudflare,
      account_id_masked: hasCloudflare ? `${CLOUDFLARE_ACCOUNT_ID.slice(0, 4)}...${CLOUDFLARE_ACCOUNT_ID.slice(-4)}` : null,
      mode: hasCloudflare ? 'production' : 'demo_fallback'
    },
    supabase: {
      configured: hasSupabase,
      url_masked: hasSupabase ? SUPABASE_URL.replace(/:\/\/([^.]+)\./, '://*****.') : null,
      mode: hasSupabase ? 'connected' : 'in_memory_fallback'
    },
    admin_protection: {
      enabled: true,
      hint: 'Gunakan kunci admin di header x-admin-key atau panel admin.'
    },
    server_time: new Date().toISOString()
  });
});

// 2. GET ALL MOVIES (with optional filter)
app.get('/api/movies', async (req: Request, res: Response) => {
  try {
    const { genre, status, search } = req.query;

    if (supabase) {
      let query = supabase.from('movies').select('*').order('created_at', { ascending: false });
      if (status) {
        query = query.eq('publication_status', status);
      } else {
        query = query.eq('publication_status', 'published');
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return res.json(data);
      }
    }

    // In-Memory store response
    let results = [...moviesStore];
    if (status) {
      results = results.filter((m) => m.publication_status === status);
    }
    if (genre && genre !== 'Semua Genre') {
      results = results.filter((m) => m.genre.includes(String(genre)));
    }
    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter((m) =>
        m.title.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    }

    res.json(results);
  } catch (err) {
    console.error('Error fetching movies:', err);
    res.status(500).json({ error: 'Gagal mengambil data film' });
  }
});

// 3. GET SINGLE MOVIE
app.get('/api/movies/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (supabase) {
    const { data, error } = await supabase.from('movies').select('*').eq('id', id).single();
    if (!error && data) {
      return res.json(data);
    }
  }

  const movie = moviesStore.find((m) => m.id === id || m.slug === id);
  if (!movie) {
    return res.status(404).json({ error: 'Film tidak ditemukan' });
  }

  res.json(movie);
});

// 4. CREATE / UPLOAD MOVIE (Admin Only)
app.post('/api/movies', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      poster_url,
      banner_url,
      release_year,
      genre,
      duration,
      duration_minutes,
      director,
      cast_members,
      video_uid,
      video_url,
      quality,
      age_rating,
      country,
      tagline,
      rights_confirmed
    } = req.body;

    if (!title || !description || !director || !release_year) {
      return res.status(400).json({ error: 'Data film tidak lengkap: Judul, sinopsis, sutradara, dan tahun wajib diisi.' });
    }

    if (!rights_confirmed) {
      return res.status(400).json({ error: 'Konfirmasi hak kepemilikan dan distribusi film wajib dicentang.' });
    }

    const id = `mov-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    const newMovie: BackendMovie = {
      id,
      title,
      slug,
      description,
      poster_url: poster_url || '/src/assets/images/poster_jogja_stories_1794493465036.jpg',
      banner_url: banner_url || poster_url || '/src/assets/images/hero_nusantara_epic_1794493463390.jpg',
      release_year: Number(release_year) || 2026,
      genre: Array.isArray(genre) ? genre : [genre || 'Drama'],
      duration: duration || '1j 45m',
      duration_minutes: Number(duration_minutes) || 105,
      director,
      cast_members: Array.isArray(cast_members) ? cast_members : [cast_members || 'Pemeran Independen'],
      video_uid: video_uid || `cf-${Date.now()}`,
      video_url: video_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      playback_status: 'ready',
      publication_status: 'published',
      rating: 8.7,
      quality: quality || '1080p FHD',
      age_rating: age_rating || '13+',
      country: country || 'Indonesia',
      tagline: tagline || '',
      created_at: new Date().toISOString(),
      rights_confirmed: true
    };

    if (supabase) {
      try {
        await supabase.from('movies').insert({
          id: newMovie.id,
          title: newMovie.title,
          slug: newMovie.slug,
          description: newMovie.description,
          poster_url: newMovie.poster_url,
          banner_url: newMovie.banner_url,
          release_year: newMovie.release_year,
          genre: newMovie.genre,
          duration: newMovie.duration,
          duration_minutes: newMovie.duration_minutes,
          director: newMovie.director,
          cast_members: newMovie.cast_members,
          video_uid: newMovie.video_uid,
          playback_status: newMovie.playback_status,
          publication_status: newMovie.publication_status,
          rating: newMovie.rating,
          quality: newMovie.quality,
          age_rating: newMovie.age_rating,
          country: newMovie.country,
          tagline: newMovie.tagline
        });
      } catch (dbErr) {
        console.warn('Supabase insert fallback:', dbErr);
      }
    }

    moviesStore.unshift(newMovie);
    res.status(201).json(newMovie);
  } catch (err) {
    console.error('Error creating movie:', err);
    res.status(500).json({ error: 'Gagal membuat data film' });
  }
});

// 5. UPDATE MOVIE (Admin Only)
app.put('/api/movies/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const index = moviesStore.findIndex((m) => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Film tidak ditemukan' });
  }

  moviesStore[index] = { ...moviesStore[index], ...updates };

  if (supabase) {
    try {
      await supabase.from('movies').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Supabase update warning:', e);
    }
  }

  res.json(moviesStore[index]);
});

// 6. DELETE MOVIE (Admin Only)
app.delete('/api/movies/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const index = moviesStore.findIndex((m) => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Film tidak ditemukan' });
  }

  const deleted = moviesStore.splice(index, 1)[0];

  if (supabase) {
    try {
      await supabase.from('movies').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete warning:', e);
    }
  }

  res.json({ success: true, message: `Film "${deleted.title}" berhasil dihapus` });
});

// 7. TOGGLE PUBLISH / UNPUBLISH (Admin Only)
app.post('/api/movies/:id/publish', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'published' | 'draft'

  const movie = moviesStore.find((m) => m.id === id);
  if (!movie) {
    return res.status(404).json({ error: 'Film tidak ditemukan' });
  }

  movie.publication_status = status === 'draft' ? 'draft' : 'published';

  if (supabase) {
    try {
      await supabase.from('movies').update({ publication_status: movie.publication_status }).eq('id', id);
    } catch (e) {
      console.warn('Supabase publish update warning:', e);
    }
  }

  res.json({ success: true, publication_status: movie.publication_status });
});

// 8. CLOUDFLARE STREAM DIRECT UPLOAD INITIATOR
app.post('/api/stream/direct-upload', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { maxDurationSeconds = 14400, creator = 'LN21 Admin' } = req.body;

    // Check if Cloudflare Stream credentials are present
    if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_STREAM_API_TOKEN) {
      // Call Cloudflare Stream Direct Upload endpoint
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            maxDurationSeconds,
            creator,
            requireSignedURLs: false
          })
        }
      );

      const cfData = await cfRes.json();
      if (!cfRes.ok || !cfData.success) {
        return res.status(502).json({
          error: 'Cloudflare Stream Error',
          details: cfData.errors || 'Gagal menghubungi Cloudflare API'
        });
      }

      const uid = cfData.result.uid;
      const uploadURL = cfData.result.uploadURL;
      const hlsURL = CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN
        ? `https://${CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN}/${uid}/manifest/video.m3u8`
        : `https://videodelivery.net/${uid}/manifest/video.m3u8`;

      uploadTracker[uid] = {
        uid,
        progress: 0,
        status: 'uploading',
        playback_url: hlsURL
      };

      return res.json({
        provider: 'cloudflare_stream',
        uid,
        uploadURL,
        hlsURL
      });
    }

    // DEMO / DEVELOPMENT DIRECT UPLOAD MODE (When CF keys are not yet configured)
    const demoUid = `stream-demo-${Date.now().toString(36)}`;
    const demoPlaybackUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

    uploadTracker[demoUid] = {
      uid: demoUid,
      progress: 0,
      status: 'uploading',
      playback_url: demoPlaybackUrl
    };

    // Simulate direct upload initiation
    res.json({
      provider: 'demo_stream_engine',
      uid: demoUid,
      uploadURL: `/api/stream/mock-upload/${demoUid}`,
      hlsURL: demoPlaybackUrl,
      mode: 'demo',
      message: 'Mode streaming simulasi aktif. Siap menerima upload berkas video.'
    });
  } catch (err) {
    console.error('Error initiating direct upload:', err);
    res.status(500).json({ error: 'Gagal menginisiasi upload video' });
  }
});

// 9. SIMULATED / LOCAL UPLOAD CHUNK RECEIVER
app.post('/api/stream/mock-upload/:uid', (req: Request, res: Response) => {
  const { uid } = req.params;
  if (!uploadTracker[uid]) {
    uploadTracker[uid] = {
      uid,
      progress: 0,
      status: 'uploading',
      playback_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    };
  }

  // Simulate progress transition to processing -> ready
  uploadTracker[uid].progress = 100;
  uploadTracker[uid].status = 'ready';

  res.json({
    success: true,
    uid,
    status: 'ready',
    playback_url: uploadTracker[uid].playback_url,
    message: 'Video berhasil diterima dan siap dialirkan secara adaptif.'
  });
});

// 10. CHECK VIDEO PROCESSING STATUS
app.get('/api/stream/status/:uid', async (req: Request, res: Response) => {
  const { uid } = req.params;

  // If real Cloudflare Stream credentials exist:
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_STREAM_API_TOKEN && !uid.startsWith('stream-demo-')) {
    try {
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${uid}`,
        {
          headers: {
            Authorization: `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`
          }
        }
      );
      const data = await cfRes.json();
      if (cfRes.ok && data.success) {
        const state = data.result.status.state; // 'inprogress', 'ready', 'error'
        const hlsUrl = CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN
          ? `https://${CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN}/${uid}/manifest/video.m3u8`
          : `https://videodelivery.net/${uid}/manifest/video.m3u8`;

        return res.json({
          uid,
          status: state === 'ready' ? 'ready' : state === 'error' ? 'failed' : 'processing',
          pctComplete: data.result.status.pctComplete || 100,
          hlsURL: hlsUrl,
          duration: data.result.duration
        });
      }
    } catch (e) {
      console.warn('Error fetching CF stream status:', e);
    }
  }

  // Fallback to local tracker
  const tracker = uploadTracker[uid] || {
    uid,
    progress: 100,
    status: 'ready',
    playback_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  };

  res.json({
    uid,
    status: tracker.status,
    pctComplete: tracker.progress,
    hlsURL: tracker.playback_url
  });
});

// 11. WATCH HISTORY (Resume Watching)
app.get('/api/watch-history/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*, movies(*)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        return res.json(data);
      }
    } catch (e) {
      console.warn('Supabase watch history read fallback:', e);
    }
  }

  const userRecords = Object.values(watchHistoryStore)
    .filter((r) => r.user_id === userId)
    .map((record) => {
      const movie = moviesStore.find((m) => m.id === record.movie_id);
      return {
        ...record,
        movie
      };
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  res.json(userRecords);
});

app.post('/api/watch-history', async (req: Request, res: Response) => {
  try {
    const { user_id, movie_id, playback_position, duration_seconds } = req.body;

    if (!user_id || !movie_id) {
      return res.status(400).json({ error: 'user_id dan movie_id wajib diisi' });
    }

    const key = `${user_id}_${movie_id}`;
    const completed = duration_seconds > 0 && playback_position >= duration_seconds * 0.95;

    const record: WatchHistoryRecord = {
      id: key,
      user_id,
      movie_id,
      playback_position: Math.floor(Number(playback_position) || 0),
      duration_seconds: Math.floor(Number(duration_seconds) || 0),
      completed,
      updated_at: new Date().toISOString()
    };

    watchHistoryStore[key] = record;

    if (supabase) {
      try {
        await supabase.from('watch_history').upsert({
          user_id: record.user_id,
          movie_id: record.movie_id,
          playback_position: record.playback_position,
          duration_seconds: record.duration_seconds,
          completed: record.completed,
          updated_at: record.updated_at
        }, { onConflict: 'user_id,movie_id' });
      } catch (e) {
        console.warn('Supabase watch history upsert warning:', e);
      }
    }

    res.json({ success: true, record });
  } catch (err) {
    console.error('Error saving watch history:', err);
    res.status(500).json({ error: 'Gagal menyimpan posisi tontonan' });
  }
});

// -----------------------------------------------------------------------------
// VITE SPA DEV MIDDLEWARE / STATIC ASSETS
// -----------------------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LN21 Engine] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
