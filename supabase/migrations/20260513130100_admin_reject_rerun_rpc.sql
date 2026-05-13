-- Stage 1 · reject + rerun RPCs (atomic with activity_events; service_role only)

-- Reject: terminal "no" — task-linked rows get approval_state rejected (output not accepted as final)
create or replace function public.admin_reject_approval_request(
  p_approval_id uuid,
  p_actor_label text default 'Internal'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_engagement_id uuid;
  v_title text;
  v_artifact text;
  v_task_id uuid;
  v_report_id uuid;
  v_client_name text;
begin
  if p_approval_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_id');
  end if;

  p_actor_label := coalesce(nullif(trim(p_actor_label), ''), 'Internal');
  if length(p_actor_label) > 200 then
    p_actor_label := left(p_actor_label, 200);
  end if;

  update public.approval_requests ar
  set
    status = 'rejected',
    resolved_at = now()
  where ar.id = p_approval_id
    and ar.status = 'open'
  returning
    ar.engagement_id,
    ar.title,
    ar.artifact_label,
    ar.task_id,
    ar.report_artifact_id
  into v_engagement_id, v_title, v_artifact, v_task_id, v_report_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found_or_not_open');
  end if;

  if v_task_id is not null then
    update public.tasks t
    set approval_state = 'rejected'
    where t.id = v_task_id
      and t.engagement_id = v_engagement_id
      and t.status <> 'cancelled';
  end if;

  select ca.name
  into v_client_name
  from public.engagements e
  join public.client_accounts ca on ca.id = e.client_account_id
  where e.id = v_engagement_id;

  insert into public.activity_events (
    engagement_id,
    event_type,
    title,
    detail,
    actor_label,
    payload
  )
  values (
    v_engagement_id,
    'approval',
    'Approval rejected: ' || coalesce(v_title, ''),
    trim(both ' · ' from (coalesce(v_client_name, '') || ' · ' || coalesce(v_artifact, ''))),
    p_actor_label,
    jsonb_build_object(
      'approval_id', p_approval_id,
      'action', 'reject',
      'task_id', v_task_id,
      'report_artifact_id', v_report_id
    )
  );

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.admin_reject_approval_request(uuid, text) is
  'Atomically rejects an open approval_request, updates linked task approval_state when applicable, appends activity_events.';

revoke all on function public.admin_reject_approval_request(uuid, text) from public;
grant execute on function public.admin_reject_approval_request(uuid, text) to service_role;


-- Rerun: "send back for another pass" — supersede queue row; optional task nudge for rework (no agents)
create or replace function public.admin_rerun_approval_request(
  p_approval_id uuid,
  p_actor_label text default 'Internal'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_engagement_id uuid;
  v_title text;
  v_artifact text;
  v_task_id uuid;
  v_report_id uuid;
  v_client_name text;
begin
  if p_approval_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_id');
  end if;

  p_actor_label := coalesce(nullif(trim(p_actor_label), ''), 'Internal');
  if length(p_actor_label) > 200 then
    p_actor_label := left(p_actor_label, 200);
  end if;

  update public.approval_requests ar
  set
    status = 'superseded',
    resolved_at = now(),
    context = coalesce(ar.context, '{}'::jsonb) || jsonb_build_object(
      'lifecycle_closed_as', 'rerun',
      'superseded_at', to_char(clock_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  where ar.id = p_approval_id
    and ar.status = 'open'
  returning
    ar.engagement_id,
    ar.title,
    ar.artifact_label,
    ar.task_id,
    ar.report_artifact_id
  into v_engagement_id, v_title, v_artifact, v_task_id, v_report_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found_or_not_open');
  end if;

  if v_task_id is not null then
    update public.tasks t
    set
      status = case
        when t.status in ('done', 'todo', 'blocked') then 'in_progress'::text
        else t.status
      end,
      approval_state = 'pending'
    where t.id = v_task_id
      and t.engagement_id = v_engagement_id
      and t.status <> 'cancelled';
  end if;

  select ca.name
  into v_client_name
  from public.engagements e
  join public.client_accounts ca on ca.id = e.client_account_id
  where e.id = v_engagement_id;

  insert into public.activity_events (
    engagement_id,
    event_type,
    title,
    detail,
    actor_label,
    payload
  )
  values (
    v_engagement_id,
    'approval',
    'Approval rerun requested: ' || coalesce(v_title, ''),
    trim(both ' · ' from (coalesce(v_client_name, '') || ' · ' || coalesce(v_artifact, ''))),
    p_actor_label,
    jsonb_build_object(
      'approval_id', p_approval_id,
      'action', 'rerun',
      'task_id', v_task_id,
      'report_artifact_id', v_report_id
    )
  );

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.admin_rerun_approval_request(uuid, text) is
  'Supersedes open approval (rerun), nudges linked task for rework, appends activity_events.';

revoke all on function public.admin_rerun_approval_request(uuid, text) from public;
grant execute on function public.admin_rerun_approval_request(uuid, text) to service_role;
