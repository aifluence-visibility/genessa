-- Inbound leads (may exist before a client account is created) (idempotent)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  client_account_id uuid references public.client_accounts (id) on delete set null,
  domain text not null,
  sector text,
  email text,
  score_snapshot integer,
  audit_requested boolean not null default false,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'converted', 'lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_client_account_id_idx on public.leads (client_account_id);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

comment on table public.leads is 'Lead / free-score funnel; converted_engagement_id added after engagements exist.';
