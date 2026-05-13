-- Back-link leads to engagements after conversion (idempotent)
alter table public.leads
  add column if not exists converted_engagement_id uuid references public.engagements (id) on delete set null;

create index if not exists leads_converted_engagement_id_idx on public.leads (converted_engagement_id);

comment on column public.leads.converted_engagement_id is 'Populated when a lead becomes an engagement spine.';
