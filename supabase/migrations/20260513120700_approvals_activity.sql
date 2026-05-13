-- Human approval queue + append-only activity feed for dashboard (idempotent)
create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.engagements (id) on delete restrict,
  task_id uuid references public.tasks (id) on delete cascade,
  report_artifact_id uuid references public.report_artifacts (id) on delete cascade,
  title text not null,
  artifact_label text not null,
  submitted_by_label text,
  requested_by_user_id uuid references public.users (id) on delete set null,
  resolved_by_user_id uuid references public.users (id) on delete set null,
  risk text not null default 'medium'
    check (risk in ('low', 'medium', 'high')),
  status text not null default 'open'
    check (status in ('open', 'approved', 'rejected', 'superseded')),
  submitted_at timestamptz not null default now(),
  resolved_at timestamptz,
  context jsonb not null default '{}'::jsonb,
  constraint approval_requests_target_xor check (
    (task_id is not null and report_artifact_id is null)
    or (task_id is null and report_artifact_id is not null)
  )
);

create index if not exists approval_requests_engagement_id_idx on public.approval_requests (engagement_id);
create index if not exists approval_requests_queue_idx on public.approval_requests (status, submitted_at desc);
create index if not exists approval_requests_task_id_idx on public.approval_requests (task_id);
create index if not exists approval_requests_report_id_idx on public.approval_requests (report_artifact_id);

comment on table public.approval_requests is 'Exactly one of task_id or report_artifact_id must be set.';

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references public.engagements (id) on delete cascade,
  event_type text not null
    check (event_type in ('audit', 'approval', 'lead', 'task', 'engagement', 'report')),
  title text not null,
  detail text,
  actor_label text,
  created_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create index if not exists activity_events_created_at_idx on public.activity_events (created_at desc);
create index if not exists activity_events_engagement_id_idx on public.activity_events (engagement_id);
create index if not exists activity_events_type_idx on public.activity_events (event_type);

comment on table public.activity_events is 'Append-only operational narrative for the admin dashboard.';
