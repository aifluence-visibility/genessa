-- Engagement spine: schedules work for a client account (idempotent)
create table if not exists public.engagements (
  id uuid primary key default gen_random_uuid(),
  client_account_id uuid not null references public.client_accounts (id) on delete restrict,
  lead_id uuid references public.leads (id) on delete set null,
  kind text not null default 'delivery'
    check (kind in ('presales', 'delivery', 'pilot')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'completed', 'churned')),
  sector_pack_key text,
  started_on date,
  ended_on date,
  roadmap_phase_label text,
  current_sprint_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists engagements_client_account_id_idx on public.engagements (client_account_id);
create index if not exists engagements_lead_id_idx on public.engagements (lead_id);
create index if not exists engagements_status_idx on public.engagements (status);
create index if not exists engagements_active_idx
  on public.engagements (client_account_id)
  where deleted_at is null and status = 'active';

drop trigger if exists engagements_set_updated_at on public.engagements;
create trigger engagements_set_updated_at
before update on public.engagements
for each row execute function public.set_updated_at();

comment on table public.engagements is 'Canonical program / contract slice; audits, tasks, and approvals reference this.';
