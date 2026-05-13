-- Rerun: after superseding the queue row, open a follow-up approval on the same task/report
-- so the internal queue stays the system of record until the next review.

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
  v_risk text;
  v_client_name text;
  v_new_id uuid;
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
    ar.report_artifact_id,
    ar.risk
  into v_engagement_id, v_title, v_artifact, v_task_id, v_report_id, v_risk;

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

  insert into public.approval_requests (
    engagement_id,
    task_id,
    report_artifact_id,
    title,
    artifact_label,
    submitted_by_label,
    risk,
    status,
    context
  )
  values (
    v_engagement_id,
    v_task_id,
    v_report_id,
    left(coalesce(v_title, '') || ' — rework', 500),
    v_artifact,
    left(coalesce(p_actor_label, 'Internal') || ' · after rerun', 200),
    v_risk,
    'open',
    jsonb_build_object(
      'reopened_after_approval_id', p_approval_id,
      'reopen_reason', 'rerun'
    )
  )
  returning id into v_new_id;

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
      'follow_up_approval_id', v_new_id,
      'action', 'rerun',
      'task_id', v_task_id,
      'report_artifact_id', v_report_id
    )
  );

  return jsonb_build_object('ok', true, 'follow_up_approval_id', v_new_id);
end;
$$;

comment on function public.admin_rerun_approval_request(uuid, text) is
  'Supersedes open approval (rerun), nudges linked task for rework, opens follow-up approval row, appends activity_events.';

revoke all on function public.admin_rerun_approval_request(uuid, text) from public;
grant execute on function public.admin_rerun_approval_request(uuid, text) to service_role;
