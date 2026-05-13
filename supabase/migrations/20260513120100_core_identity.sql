-- organizations, internal users, client accounts (idempotent)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  email text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint users_email_lowercase check (email = lower(email)),
  constraint users_email_format check (email ~ '^[^@]+@[^@]+\.[^@]+$')
);

create unique index if not exists users_email_active_key
  on public.users (lower(email))
  where deleted_at is null;

create index if not exists users_organization_id_idx on public.users (organization_id);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create table if not exists public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  primary_domain text,
  sector_pack_key text,
  current_visibility_score integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists client_accounts_primary_domain_idx
  on public.client_accounts (lower(primary_domain))
  where deleted_at is null;

create index if not exists client_accounts_sector_pack_key_idx
  on public.client_accounts (sector_pack_key)
  where deleted_at is null;

drop trigger if exists client_accounts_set_updated_at on public.client_accounts;
create trigger client_accounts_set_updated_at
before update on public.client_accounts
for each row execute function public.set_updated_at();

comment on table public.organizations is 'Owning org for internal users (Genessa).';
comment on table public.users is 'Internal operators; Supabase Auth linkage can be added later without breaking this table.';
comment on table public.client_accounts is 'Customer / institution record; engagements hang off this.';
