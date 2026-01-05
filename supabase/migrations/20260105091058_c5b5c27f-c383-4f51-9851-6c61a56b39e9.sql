-- Create table for shareable analyses
CREATE TABLE public.shared_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_code TEXT NOT NULL UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  product_name TEXT,
  verdict TEXT NOT NULL,
  verdict_explanation TEXT,
  health_score INTEGER,
  quick_advice TEXT,
  confidence INTEGER,
  ingredients JSONB NOT NULL DEFAULT '[]',
  tradeoffs JSONB,
  suggested_questions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups by share_code
CREATE INDEX idx_shared_analyses_share_code ON public.shared_analyses(share_code);

-- Enable RLS
ALTER TABLE public.shared_analyses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read shared analyses (they're meant to be public)
CREATE POLICY "Shared analyses are publicly viewable"
ON public.shared_analyses
FOR SELECT
USING (true);

-- Allow anyone to create shared analyses (no auth required)
CREATE POLICY "Anyone can create shared analyses"
ON public.shared_analyses
FOR INSERT
WITH CHECK (true);