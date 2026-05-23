ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
CHECK (plan IN ('free', 'premium', 'agency'));
