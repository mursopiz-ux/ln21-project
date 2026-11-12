-- =========================================================================
-- LAYAR NUSANTARA 21 (LN21) — SUPABASE DATABASE SCHEMA
-- Direct Video Streaming, Watch History, and Video Sources with RLS
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. MOVIES TABLE
create table if not exists public.movies (
  id text primary key,
  title text not null,
  slug text unique not null,
  description text,
  poster_url text,
  banner_url text,
  release_year integer not null,
  genre text[] not null default '{}',
  duration text not null,
  duration_minutes integer default 90,
  director text not null,
  cast_members text[] default '{}',
  video_uid text,
  playback_status text not null default 'ready' check (playback_status in ('uploading', 'processing', 'ready', 'error')),
  publication_status text not null default 'published' check (publication_status in ('draft', 'published', 'archived')),
  rating numeric(3,1) default 8.5,
  quality text default '1080p FHD',
  age_rating text default '17+',
  country text default 'Indonesia',
  awards text[] default '{}',
  tagline text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast queries
create index if not exists idx_movies_publication on public.movies(publication_status, release_year desc);
create index if not exists idx_movies_slug on public.movies(slug);

-- 2. VIDEO SOURCES TABLE (Cloudflare Stream, HLS Direct, etc.)
create table if not exists public.video_sources (
  id uuid primary key default uuid_generate_v4(),
  movie_id text not null references public.movies(id) on delete cascade,
  provider text not null default 'cloudflare_stream' check (provider in ('cloudflare_stream', 'hls_direct', 'demo')),
  video_uid text not null,
  hls_url text,
  dash_url text,
  mp4_url text,
  thumbnail_url text,
  status text not null default 'ready' check (status in ('pending', 'processing', 'ready', 'failed')),
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_video_sources_movie on public.video_sources(movie_id);

-- 3. WATCH HISTORY TABLE (Resume Watching functionality)
create table if not exists public.watch_history (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  movie_id text not null references public.movies(id) on delete cascade,
  playback_position integer not null default 0, -- playback position in seconds
  duration_seconds integer default 0,
  completed boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_movie_watch unique(user_id, movie_id)
);

create index if not exists idx_watch_history_user on public.watch_history(user_id, updated_at desc);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.movies enable row level security;
alter table public.video_sources enable row level security;
alter table public.watch_history enable row level security;

-- Movies: Anyone can view published movies
create policy "Allow public read of published movies"
  on public.movies for select
  using (publication_status = 'published');

-- Movies: Service role / Admin can insert/update/delete
create policy "Allow service role full access on movies"
  on public.movies for all
  using (true)
  with check (true);

-- Video Sources: Anyone can view sources for published movies
create policy "Allow public read of video sources for published movies"
  on public.video_sources for select
  using (
    exists (
      select 1 from public.movies 
      where public.movies.id = public.video_sources.movie_id 
      and public.movies.publication_status = 'published'
    )
  );

-- Video Sources: Service role full access
create policy "Allow service role full access on video sources"
  on public.video_sources for all
  using (true)
  with check (true);

-- Watch History: Users can view their own watch history
create policy "Allow users to read own watch history"
  on public.watch_history for select
  using (auth.uid()::text = user_id or user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Watch History: Users can insert/update own watch history
create policy "Allow users to insert or update own watch history"
  on public.watch_history for all
  using (auth.uid()::text = user_id or user_id = current_setting('request.jwt.claims', true)::json->>'sub')
  with check (auth.uid()::text = user_id or user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role full access on watch history
create policy "Allow service role full access on watch history"
  on public.watch_history for all
  using (true)
  with check (true);

-- 5. PROFILES TABLE (Linked with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'editor', 'user', 'vip')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_role on public.profiles(role);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Allow users to view their own profile or public profiles"
  on public.profiles for select
  using (true);

create policy "Allow users to update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Allow users to insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 6. RPC FUNCTION public.is_admin()
-- Returns true if the currently authenticated user has role = 'admin' in public.profiles
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select role = 'admin'
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

-- Grant execution to authenticated & anon roles
grant execute on function public.is_admin() to authenticated, anon;

