CREATE TABLE IF NOT EXISTS scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  readiness_score INTEGER,
  authority_score INTEGER,
  influence_score INTEGER,
  insight JSONB,
  checklist JSONB,
  issues JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see own scans"
  ON scans FOR ALL
  USING (auth.uid() = user_id);
