-- ═══════════════════════════════════════════════════════════
-- Ella — Add reactions breakdown to posts
-- Stores dominant reaction types visible on the post
-- and optionally full per-type counts from deep capture.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS reactions_breakdown JSONB DEFAULT '{}';

COMMENT ON COLUMN public.posts.reactions_breakdown IS
  'LinkedIn reaction breakdown. Minimal: {"dominant_types":["like","insightful"],"total":22}. Full (deep capture): {"like":19,"celebrate":0,"support":0,"love":2,"insightful":1,"funny":0,"total":22}';
