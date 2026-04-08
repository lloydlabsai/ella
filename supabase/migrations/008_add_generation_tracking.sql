-- Server-side generation tracking for rate limiting
CREATE TABLE IF NOT EXISTS public.generation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generation log"
  ON generation_log FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation log"
  ON generation_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_generation_log_user_month ON generation_log(user_id, created_at);
