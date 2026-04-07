-- ═══════════════════════════════════════════════════════════
-- Ella — Add LinkedIn profile context to profiles
-- ═══════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists linkedin_context jsonb default null;

comment on column public.profiles.linkedin_context is
  'Structured LinkedIn profile data captured via the Chrome extension. Used by the generation pipeline for author context.';
