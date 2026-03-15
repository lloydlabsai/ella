-- ═══════════════════════════════════════════════════════════
-- Ella — Initial Schema
-- ═══════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  industry text default '',
  brand_voice text default '',
  product_name text default '',
  product_description text default '',
  tier text default 'free' check (tier in ('free', 'paid')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── POSTS ──────────────────────────────────────────────
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_text text not null check (char_length(post_text) > 10),
  author_name text default '',
  author_title text default '',
  date_posted date,
  likes int default 0,
  comments_count int default 0,
  shares int default 0,
  impressions int default 0,
  comment_texts text default '',
  hashtags text default '',
  has_image boolean default false,
  has_video boolean default false,
  has_carousel boolean default false,
  category text default '',
  screenshot_url text default '',
  industry text default '',
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "Users can view own posts"
  on posts for select using (auth.uid() = user_id);

create policy "Users can insert own posts"
  on posts for insert with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on posts for update using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on posts for delete using (auth.uid() = user_id);

create index idx_posts_user_id on posts(user_id);
create index idx_posts_industry on posts(industry);
create index idx_posts_created_at on posts(created_at desc);

-- ─── ML RESULTS ─────────────────────────────────────────
create table public.ml_results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  results_json jsonb not null,
  post_count int default 0,
  created_at timestamptz default now()
);

alter table public.ml_results enable row level security;

create policy "Users can view own ml_results"
  on ml_results for select using (auth.uid() = user_id);

create policy "Users can insert own ml_results"
  on ml_results for insert with check (auth.uid() = user_id);

create index idx_ml_results_user_id on ml_results(user_id);

-- ─── DRAFTS ─────────────────────────────────────────────
create table public.drafts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  draft_text text not null,
  tone text default 'thought-leader',
  ml_result_id uuid references public.ml_results(id) on delete set null,
  validated boolean default false,
  validation_notes text default '',
  created_at timestamptz default now()
);

alter table public.drafts enable row level security;

create policy "Users can view own drafts"
  on drafts for select using (auth.uid() = user_id);

create policy "Users can insert own drafts"
  on drafts for insert with check (auth.uid() = user_id);

create policy "Users can delete own drafts"
  on drafts for delete using (auth.uid() = user_id);

create index idx_drafts_user_id on drafts(user_id);

-- ─── STORAGE BUCKET FOR SCREENSHOTS ─────────────────────
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', false);

create policy "Users can upload screenshots"
  on storage.objects for insert
  with check (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own screenshots"
  on storage.objects for select
  using (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
