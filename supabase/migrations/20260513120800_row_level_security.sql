-- RLS: default deny for anon/authenticated JWT; service role bypasses RLS.
-- Idempotent: ENABLE ROW LEVEL SECURITY is safe to repeat.
alter table if exists public.organizations enable row level security;
alter table if exists public.users enable row level security;
alter table if exists public.client_accounts enable row level security;
alter table if exists public.leads enable row level security;
alter table if exists public.engagements enable row level security;
alter table if exists public.audits enable row level security;
alter table if exists public.proposals enable row level security;
alter table if exists public.sprints enable row level security;
alter table if exists public.tasks enable row level security;
alter table if exists public.report_artifacts enable row level security;
alter table if exists public.approval_requests enable row level security;
alter table if exists public.activity_events enable row level security;
