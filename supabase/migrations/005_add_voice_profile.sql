-- Add voice_profile JSONB column for "Tell Ella More" fields
-- Stores: background, edge, communication_style
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS voice_profile JSONB DEFAULT '{}';
