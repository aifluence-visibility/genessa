create table if not exists public.scan_cache (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists scan_cache_domain_idx on public.scan_cache (domain);
create index if not exists scan_cache_created_at_idx on public.scan_cache (created_at desc);
