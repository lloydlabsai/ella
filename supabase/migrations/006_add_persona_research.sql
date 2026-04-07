-- Add persona_research JSONB column for deep profile research
-- Stores: niche, company_context, competitive_landscape, audience, pain_points, etc.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS persona_research JSONB DEFAULT NULL;
