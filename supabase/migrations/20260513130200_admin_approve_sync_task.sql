-- When a task-backed approval is approved, mark the task approval_state (parity with reject / rerun).

create or replace function public.admin_approve_approval_request(
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
    status = 'approved',
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
    set approval_state = 'approved'
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
    'Approval approved: ' || coalesce(v_title, ''),
    trim(both ' · ' from (
      coalesce(v_client_name, '') || ' · ' || coalesce(v_artifact, '')
    )),
    p_actor_label,
    jsonb_build_object(
      'approval_id', p_approval_id,
      'action', 'approve',
      'task_id', v_task_id,
      'report_artifact_id', v_report_id
    )
  );

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.admin_approve_approval_request(uuid, text) is
  'Atomically approves an open approval_request, syncs task approval_state when task-backed, appends activity_events.';

revoke all on function public.admin_approve_approval_request(uuid, text) from public;
grant execute on function public.admin_approve_approval_request(uuid, text) to service_role;
