-- Report artifacts · status changes → activity_events + admin update RPC (Stage 1 internal)

create or replace function public.report_artifacts_activity_after_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_name text;
  v_actor text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  v_actor := coalesce(
    nullif(trim(current_setting('genessa.actor_label', true)), ''),
    'System'
  );

  select ca.name
  into v_client_name
  from public.engagements e
  join public.client_accounts ca on ca.id = e.client_account_id
  where e.id = new.engagement_id;

  if old.status is distinct from new.status then
    insert into public.activity_events (
      engagement_id,
      event_type,
      title,
      detail,
      actor_label,
      payload
    )
    values (
      new.engagement_id,
      'report',
      left(coalesce(new.title, 'Report'), 200) || ' · status ' || old.status || ' → ' || new.status,
      trim(both ' · ' from (
        coalesce(v_client_name, '') || ' · ' || coalesce(new.version_label, '')
      )),
      v_actor,
      jsonb_build_object(
        'report_id', new.id,
        'change', 'status',
        'from', old.status,
        'to', new.status
      )
    );
  end if;

  return new;
end;
$$;

comment on function public.report_artifacts_activity_after_update() is
  'After report_artifacts update: append activity_events when status changes.';

drop trigger if exists report_artifacts_activity_after_update on public.report_artifacts;
create trigger report_artifacts_activity_after_update
after update on public.report_artifacts
for each row execute function public.report_artifacts_activity_after_update();

revoke all on function public.report_artifacts_activity_after_update() from public;


create or replace function public.admin_update_report_artifact(
  p_report_id uuid,
  p_status text,
  p_actor_label text default 'Internal'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_report_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_id');
  end if;

  p_status := lower(trim(coalesce(p_status, '')));
  if p_status not in ('draft', 'internal_review', 'client_ready', 'delivered', 'archived') then
    return jsonb_build_object('ok', false, 'error', 'invalid_status');
  end if;

  p_actor_label := coalesce(nullif(trim(p_actor_label), ''), 'Internal');
  if length(p_actor_label) > 200 then
    p_actor_label := left(p_actor_label, 200);
  end if;

  perform set_config('genessa.actor_label', p_actor_label, true);

  update public.report_artifacts r
  set status = p_status
  where r.id = p_report_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.admin_update_report_artifact(uuid, text, text) is
  'Updates report_artifact status; activity via report_artifacts_activity_after_update trigger.';

revoke all on function public.admin_update_report_artifact(uuid, text, text) from public;
grant execute on function public.admin_update_report_artifact(uuid, text, text) to service_role;
