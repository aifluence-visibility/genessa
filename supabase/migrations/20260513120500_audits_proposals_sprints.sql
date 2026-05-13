-- Audits, commercial proposals, sprint windows (idempotent)
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.engagements (id) on delete restrict,
  owner_user_id uuid references public.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'waiting_review', 'completed', 'cancelled')),
  notes text,
  scores_breakdown jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists audits_engagement_id_idx on public.audits (engagement_id);
create index if not exists audits_status_idx on public.audits (status);
create index if not exists audits_owner_user_id_idx on public.audits (owner_user_id);
create index if not exists audits_updated_at_idx on public.audits (updated_at desc);

drop trigger if exists audits_set_updated_at on public.audits;
create trigger audits_set_updated_at
before update on public.audits
for each row execute function public.set_updated_at();

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.engagements (id) on delete restrict,
  version integer not null default 1,
  status text not null default 'draft'
    check (status in ('draft', 'internal_review', 'sent', 'accepted', 'rejected', 'lost', 'expired')),
  duration_label text,
  target_score integer,
  pricing_summary text,
  roadmap_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposals_engagement_version_key unique (engagement_id, version)
);

create index if not exists proposals_engagement_id_idx on public.proposals (engagement_id);
create index if not exists proposals_status_idx on public.proposals (status);
create index if not exists proposals_updated_at_idx on public.proposals (updated_at desc);

drop trigger if exists proposals_set_updated_at on public.proposals;
create trigger proposals_set_updated_at
before update on public.proposals
for each row execute function public.set_updated_at();

create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.engagements (id) on delete restrict,
  label text not null,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed')),
  period_start date,
  period_end date,
  goals_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sprints_engagement_id_idx on public.sprints (engagement_id);
create index if not exists sprints_status_idx on public.sprints (status);
create index if not exists sprints_period_idx on public.sprints (period_start, period_end);

drop trigger if exists sprints_set_updated_at on public.sprints;
create trigger sprints_set_updated_at
before update on public.sprints
for each row execute function public.set_updated_at();

comment on table public.audits is 'AI visibility audit lifecycle per engagement (human-owned in Stage 1).';
comment on table public.proposals is 'Commercial / strategy packaging; versioned per engagement.';
comment on table public.sprints is 'Operational time boxing; tasks may link here.';
