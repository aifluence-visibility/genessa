-- Link profiles to organizations; store the tracked domain
alter table public.profiles
  add column if not exists domain text,
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists onboarding_locale text;

comment on column public.profiles.domain is 'Primary domain being tracked for this user.';
comment on column public.profiles.organization_id is 'Org created during onboarding; engine_prompts and engine_scores hang off this.';
comment on column public.profiles.onboarding_locale is 'Locale selected during onboarding (tr-TR or en-US).';
