-- engine_scores: weekly/monthly aggregated scores read by the dashboard
create table if not exists public.engine_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  engine text not null check (engine in ('claude', 'gpt', 'perplexity')),
  target_locale text not null,
  citation_rate numeric check (citation_rate between 0 and 1),
  share_of_voice numeric check (share_of_voice between 0 and 1),
  source_attribution_rate numeric check (source_attribution_rate between 0 and 1),
  sentiment_positive_pct numeric check (sentiment_positive_pct between 0 and 1),
  sentiment_neutral_pct numeric check (sentiment_neutral_pct between 0 and 1),
  sentiment_negative_pct numeric check (sentiment_negative_pct between 0 and 1),
  created_at timestamptz not null default now(),
  constraint engine_scores_period_engine_locale_key unique (organization_id, period_start, engine, target_locale)
);

create index if not exists engine_scores_organization_id_idx on public.engine_scores (organization_id);
create index if not exists engine_scores_period_idx on public.engine_scores (organization_id, period_start desc);
create index if not exists engine_scores_engine_idx on public.engine_scores (engine);

comment on table public.engine_scores is 'Aggregated citation/SOV/sentiment scores per org × engine × locale × period. Unique per period+engine+locale to allow upsert.';
