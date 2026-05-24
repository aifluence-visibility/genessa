CREATE TABLE IF NOT EXISTS public.agency_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  sector TEXT,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

ALTER TABLE public.agency_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own domains"
ON public.agency_domains
FOR ALL USING (auth.uid() = user_id);
