-- report_sections: one row per section of a report
-- Each section_key corresponds to one of the 6 PRD 4.8 sections.
-- content_json stores the structured output of that section's module.

create table if not exists public.report_sections (
  id           uuid primary key default gen_random_uuid(),
  report_id    uuid not null references public.reports(id) on delete cascade,
  section_key  text not null check (section_key in (
    'executive_summary',   -- 4.8.1 — Yönetici Özeti
    'quick_findings',      -- 4.8.2 — Hızlı Bulgular Tablosu
    'technical_findings',  -- 4.1   — Teknik SEO detayı
    'ai_visibility',       -- 4.2   — AI Visibility + engine breakdown
    'competitor_comparison',-- 4.3  — Rakip kıyaslama
    'content_gap',         -- 4.4   — Content Gap analizi
    'trend_signals',       -- 4.5   — Trend sinyalleri
    'action_plan',         -- 4.8.4 — Önerilen Aksiyon Planı (Faz 1/2/3)
    'expected_impact',     -- 4.8.5 — Beklenen Etki ve ROI
    'next_steps'           -- 4.8.6 — Sonraki Adımlar / CTA
  )),
  content_json jsonb not null default '{}',
  generated_at timestamptz not null default now(),

  constraint report_sections_report_section_key unique (report_id, section_key)
);

create index if not exists report_sections_report_id_idx on public.report_sections (report_id);

comment on table public.report_sections is
  'Structured content for each section of a report. Upsert-safe via the unique constraint.';
