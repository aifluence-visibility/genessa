-- brand_mentions: structured extraction from a single engine_run
create table if not exists public.brand_mentions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.engine_runs(id) on delete cascade,
  brand_name text not null,
  is_own_brand boolean not null,
  position_in_response int,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  source_url text,
  created_at timestamptz not null default now()
);

create index if not exists brand_mentions_run_id_idx on public.brand_mentions (run_id);
create index if not exists brand_mentions_is_own_brand_idx on public.brand_mentions (is_own_brand);
create index if not exists brand_mentions_brand_name_idx on public.brand_mentions (lower(brand_name));

comment on table public.brand_mentions is 'LLM-extracted brand occurrences from engine_runs; is_own_brand compared against tracked_competitors.';
