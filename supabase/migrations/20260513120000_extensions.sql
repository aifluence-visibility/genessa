-- Stage 1 · extensions & shared trigger helper (idempotent)
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Sets updated_at to now() before row update; attach with BEFORE UPDATE for each table.';
