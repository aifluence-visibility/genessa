-- engine_runs: one row per prompt × engine × execution
create table if not exists public.engine_runs (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.engine_prompts(id) on delete cascade,
  engine text not null check (engine in ('claude', 'gpt', 'perplexity')),
  run_timestamp timestamptz not null default now(),
  raw_response_text text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  error_message text
);

create index if not exists engine_runs_prompt_id_idx on public.engine_runs (prompt_id);
create index if not exists engine_runs_status_idx on public.engine_runs (status);
create index if not exists engine_runs_engine_idx on public.engine_runs (engine);
create index if not exists engine_runs_run_timestamp_idx on public.engine_runs (run_timestamp desc);

comment on table public.engine_runs is 'Raw engine execution log; brand_mentions are extracted from completed rows.';
