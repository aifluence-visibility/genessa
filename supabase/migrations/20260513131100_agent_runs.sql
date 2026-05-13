-- Minimal agent run ledger: enqueue from Next, process from workers (Stage 1.5 orchestration stub).

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  run_key text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'succeeded', 'failed', 'cancelled')),
  task_type_snapshot text,
  error_message text,
  output_ref jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_runs_run_key_key unique (run_key)
);

create index if not exists agent_runs_task_id_idx on public.agent_runs (task_id);
create index if not exists agent_runs_status_created_idx
  on public.agent_runs (status, created_at desc);

drop trigger if exists agent_runs_set_updated_at on public.agent_runs;
create trigger agent_runs_set_updated_at
before update on public.agent_runs
for each row execute function public.set_updated_at();

comment on table public.agent_runs is
  'One row per asynchronous agent execution; run_key idempotency for safe retries.';

alter table public.agent_runs enable row level security;

grant select, insert, update, delete on table public.agent_runs to authenticated;

drop policy if exists agent_runs_all_operators on public.agent_runs;

create policy agent_runs_all_operators
  on public.agent_runs
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());
