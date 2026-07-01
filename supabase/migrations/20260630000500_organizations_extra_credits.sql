-- Add query credit balance to organizations for overage control
alter table public.organizations
  add column if not exists extra_query_credits integer not null default 0;

comment on column public.organizations.extra_query_credits is 'Additional query credits purchased beyond plan quota. Worker checks this before each run.';
