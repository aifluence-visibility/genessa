-- reports: one row per report generation job
create table if not exists public.reports (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  domain               text not null,
  target_locale        text not null default 'en-US',   -- market queried (en-US / tr-TR)
  report_language      text not null default 'en',       -- language of the report text (en / tr)
  status               text not null default 'pending'
    check (status in ('pending', 'generating', 'completed', 'failed')),

  -- Computed top-line score (0-100) — written by 4.6 scoring module
  ai_visibility_score  numeric check (ai_visibility_score between 0 and 100),

  -- Final outputs
  report_html          text,   -- full rendered HTML of the report
  pdf_url              text,   -- Supabase Storage path after PDF is generated

  error_message        text,
  created_at           timestamptz not null default now(),
  completed_at         timestamptz
);

create index if not exists reports_organization_id_idx on public.reports (organization_id);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_created_at_idx on public.reports (organization_id, created_at desc);

comment on table public.reports is
  'Top-level report job record. One row = one end-to-end report for an org. Sections stored in report_sections.';
