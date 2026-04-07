ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS capture_method TEXT DEFAULT 'extension',
  ADD COLUMN IF NOT EXISTS has_engagement_data BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.posts.capture_method IS 'How the post was captured: extension, bulk, screenshot, linkedin_export, csv_import';
COMMENT ON COLUMN public.posts.has_engagement_data IS 'False for imported posts without engagement numbers';
