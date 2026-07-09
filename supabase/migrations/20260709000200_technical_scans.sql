-- technical_scans: raw output of the 4.1 Technical SEO Scanner for one domain
create table if not exists public.technical_scans (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid references public.organizations(id) on delete cascade,
  report_id               uuid references public.reports(id) on delete set null,
  domain                  text not null,
  scanned_at              timestamptz not null default now(),

  -- ── HTTP basics ──────────────────────────────────────────────────────────
  final_url               text,          -- URL after redirects
  status_code             int,
  response_time_ms        int,
  is_https                boolean,
  is_server_side_rendered boolean,       -- true if body has meaningful text without JS

  -- ── Title & Meta ─────────────────────────────────────────────────────────
  title                   text,
  meta_description        text,
  has_og_tags             boolean,
  og_title                text,
  og_description          text,
  og_image                text,
  has_twitter_card        boolean,

  -- ── Schema.org / JSON-LD ─────────────────────────────────────────────────
  has_json_ld             boolean,
  schema_types            text[],        -- ['Organization','WebSite','Product',...]
  schema_raw              jsonb,         -- first 3 JSON-LD blocks, truncated

  -- ── Robots.txt ───────────────────────────────────────────────────────────
  robots_accessible       boolean,
  robots_content          text,          -- raw content (first 4000 chars)
  -- Per-bot permission: 'allowed' | 'blocked' | 'unknown'
  ai_bot_permissions      jsonb,
  -- {
  --   "GPTBot":           "allowed"|"blocked"|"unknown",
  --   "ClaudeBot":        "...",
  --   "PerplexityBot":    "...",
  --   "Google-Extended":  "...",
  --   "Applebot-Extended":"...",
  --   "OAI-SearchBot":    "..."
  -- }

  -- ── Sitemap ──────────────────────────────────────────────────────────────
  sitemap_accessible      boolean,
  sitemap_url             text,          -- the URL that worked (/sitemap.xml or from robots)

  -- ── llms.txt ─────────────────────────────────────────────────────────────
  llms_txt_accessible     boolean,
  llms_txt_content        text,          -- first 2000 chars

  -- ── Entity signals ───────────────────────────────────────────────────────
  has_wikidata_link       boolean,
  has_wikipedia_link      boolean,

  -- ── Computed check results ───────────────────────────────────────────────
  -- Each key: { status: 'pass'|'partial'|'fail', detail: '...', weight: N }
  checks                  jsonb not null default '{}',

  -- ── Technical sub-score (0-100) ──────────────────────────────────────────
  technical_score         numeric check (technical_score between 0 and 100),

  error_message           text
);

create index if not exists technical_scans_org_idx    on public.technical_scans (organization_id);
create index if not exists technical_scans_report_idx on public.technical_scans (report_id);
create index if not exists technical_scans_domain_idx on public.technical_scans (domain);
create index if not exists technical_scans_scanned_at on public.technical_scans (organization_id, scanned_at desc);

comment on table public.technical_scans is
  'Output of 4.1 Technical SEO Scanner. One row per scan run. checks JSONB drives report section content.';
