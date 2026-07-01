-- engine_prompts: per-organization query list to track across AI engines
create table if not exists public.engine_prompts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  prompt_text text not null,
  prompt_type text not null check (prompt_type in ('category', 'solution', 'comparison', 'brand', 'long_tail')),
  target_locale text not null default 'en-US',
  target_engines text[] not null default array['claude', 'gpt', 'perplexity'],
  is_active boolean not null default true,
  is_user_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists engine_prompts_organization_id_idx on public.engine_prompts (organization_id);
create index if not exists engine_prompts_active_approved_idx on public.engine_prompts (organization_id)
  where is_active = true and is_user_approved = true;

comment on table public.engine_prompts is 'Tracked queries per org; worker only processes active + user-approved rows.';
