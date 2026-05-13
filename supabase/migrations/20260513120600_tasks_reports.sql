-- Tasks and report artifacts (idempotent)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.engagements (id) on delete restrict,
  sprint_id uuid references public.sprints (id) on delete set null,
  assignee_user_id uuid references public.users (id) on delete set null,
  assignee_label text,
  task_type text not null,
  title text not null,
  sector text,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  approval_state text not null default 'not_required'
    check (approval_state in ('not_required', 'pending', 'approved', 'rejected')),
  output_summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_engagement_id_idx on public.tasks (engagement_id);
create index if not exists tasks_sprint_id_idx on public.tasks (sprint_id);
create index if not exists tasks_assignee_user_id_idx on public.tasks (assignee_user_id);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_priority_idx on public.tasks (priority);
create index if not exists tasks_updated_at_idx on public.tasks (updated_at desc);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create table if not exists public.report_artifacts (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.engagements (id) on delete restrict,
  report_type text not null
    check (report_type in ('audit', 'weekly', 'executive', 'deliverable')),
  title text not null,
  version_label text not null,
  status text not null default 'draft'
    check (status in ('draft', 'internal_review', 'client_ready', 'delivered', 'archived')),
  storage_ref text,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists report_artifacts_engagement_id_idx on public.report_artifacts (engagement_id);
create index if not exists report_artifacts_report_type_idx on public.report_artifacts (report_type);
create index if not exists report_artifacts_updated_at_idx on public.report_artifacts (updated_at desc);

drop trigger if exists report_artifacts_set_updated_at on public.report_artifacts;
create trigger report_artifacts_set_updated_at
before update on public.report_artifacts
for each row execute function public.set_updated_at();

comment on table public.tasks is 'Operational task units; assignee_label supports non-user attribution in Stage 1.';
comment on table public.report_artifacts is 'Generated or uploaded deliverables tied to an engagement.';
