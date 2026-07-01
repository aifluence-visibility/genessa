-- tracked_competitors: competitor list per org (AI-suggested or user-added)
create table if not exists public.tracked_competitors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competitor_name text not null,
  competitor_url text,
  is_user_added boolean not null default false,
  created_at timestamptz not null default now(),
);

create unique index if not exists tracked_competitors_org_name_key
  on public.tracked_competitors (organization_id, lower(competitor_name));

create index if not exists tracked_competitors_organization_id_idx on public.tracked_competitors (organization_id);

comment on table public.tracked_competitors is 'Competitor names used to resolve is_own_brand in brand_mentions. is_user_added=false means AI-suggested, pending user approval.';
