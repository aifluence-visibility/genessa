-- Link Supabase Auth to internal operators + RLS for JWT (anon key) access.
-- Service role continues to bypass RLS for server-side admin RPCs.

-- 1) Bridge: which auth user maps to which internal profile
alter table public.users
  add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;

create index if not exists users_auth_user_id_idx
  on public.users (auth_user_id)
  where auth_user_id is not null and deleted_at is null;

comment on column public.users.auth_user_id is 'Supabase Auth user id; set after first signup (Dashboard or SQL).';

-- 2) Stable helper: operator session (SECURITY DEFINER so policies can call it without recursion)
create or replace function public.is_internal_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.auth_user_id = auth.uid()
      and u.deleted_at is null
  );
$$;

comment on function public.is_internal_operator() is
  'True when JWT subject matches a non-deleted row in public.users.';

revoke all on function public.is_internal_operator() from public;
grant execute on function public.is_internal_operator() to authenticated;

-- 3) Table grants (PostgREST / JS client with user JWT)
grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.organizations to authenticated;
grant select, insert, update, delete on table public.users to authenticated;
grant select, insert, update, delete on table public.client_accounts to authenticated;
grant select, insert, update, delete on table public.leads to authenticated;
grant select, insert, update, delete on table public.engagements to authenticated;
grant select, insert, update, delete on table public.audits to authenticated;
grant select, insert, update, delete on table public.proposals to authenticated;
grant select, insert, update, delete on table public.sprints to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.report_artifacts to authenticated;
grant select, insert, update, delete on table public.approval_requests to authenticated;
grant select, insert, update, delete on table public.activity_events to authenticated;

-- 4) Policies: internal operators full DML (Stage 1 single-tenant Genessa)
--    Plus self-read on users for auth_user_id link checks from the app.

drop policy if exists users_select_self on public.users;
drop policy if exists users_all_operators on public.users;
drop policy if exists organizations_all_operators on public.organizations;
drop policy if exists client_accounts_all_operators on public.client_accounts;
drop policy if exists leads_all_operators on public.leads;
drop policy if exists engagements_all_operators on public.engagements;
drop policy if exists audits_all_operators on public.audits;
drop policy if exists proposals_all_operators on public.proposals;
drop policy if exists sprints_all_operators on public.sprints;
drop policy if exists tasks_all_operators on public.tasks;
drop policy if exists report_artifacts_all_operators on public.report_artifacts;
drop policy if exists approval_requests_all_operators on public.approval_requests;
drop policy if exists activity_events_all_operators on public.activity_events;

create policy users_select_self
  on public.users
  for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy users_all_operators
  on public.users
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());

create policy organizations_all_operators
  on public.organizations
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());

create policy client_accounts_all_operators
  on public.client_accounts
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());

create policy leads_all_operators
  on public.leads
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());

create policy engagements_all_operators
  on public.engagements
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());

create policy audits_all_operators
  on public.audits
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());

create policy proposals_all_operators
  on public.proposals
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());

create policy sprints_all_operators
  on public.sprints
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());

create policy tasks_all_operators
  on public.tasks
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());

create policy report_artifacts_all_operators
  on public.report_artifacts
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());

create policy approval_requests_all_operators
  on public.approval_requests
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());

create policy activity_events_all_operators
  on public.activity_events
  for all
  to authenticated
  using (public.is_internal_operator())
  with check (public.is_internal_operator());
