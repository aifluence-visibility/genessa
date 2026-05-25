ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_plan_check
CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'consulting'));
