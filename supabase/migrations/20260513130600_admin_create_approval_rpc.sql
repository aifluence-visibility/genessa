-- Stage 1 · create open approval (internal admin, service_role) + activity event

create or replace function public.admin_create_approval_request(
  p_engagement_id uuid,
  p_task_id uuid,
  p_report_artifact_id uuid,
  p_title text,
  p_artifact_label text,
  p_submitted_by_label text default null,
  p_risk text default 'medium',
  p_actor_label text default 'Internal'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_client_name text;
  v_task_eng uuid;
  v_report_eng uuid;
begin
  if p_engagement_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_engagement');
  end if;

  p_title := trim(coalesce(p_title, ''));
  p_artifact_label := trim(coalesce(p_artifact_label, ''));

  if p_title = '' or p_artifact_label = '' then
    return jsonb_build_object('ok', false, 'error', 'empty_title_or_artifact');
  end if;

  p_title := left(p_title, 500);
  p_artifact_label := left(p_artifact_label, 500);

  p_actor_label := coalesce(nullif(trim(p_actor_label), ''), 'Internal');
  if length(p_actor_label) > 200 then
    p_actor_label := left(p_actor_label, 200);
  end if;

  p_submitted_by_label := nullif(trim(coalesce(p_submitted_by_label, '')), '');
  if p_submitted_by_label is not null and length(p_submitted_by_label) > 200 then
    p_submitted_by_label := left(p_submitted_by_label, 200);
  end if;

  p_risk := lower(trim(coalesce(p_risk, 'medium')));
  if p_risk not in ('low', 'medium', 'high') then
    return jsonb_build_object('ok', false, 'error', 'invalid_risk');
  end if;

  if p_task_id is not null and p_report_artifact_id is not null then
    return jsonb_build_object('ok', false, 'error', 'xor_target');
  end if;

  if p_task_id is null and p_report_artifact_id is null then
    return jsonb_build_object('ok', false, 'error', 'needs_target');
  end if;

  if p_task_id is not null then
    select t.engagement_id into v_task_eng
    from public.tasks t
    where t.id = p_task_id;

    if not found then
      return jsonb_build_object('ok', false, 'error', 'invalid_task');
    end if;

    if v_task_eng <> p_engagement_id then
      return jsonb_build_object('ok', false, 'error', 'task_engagement_mismatch');
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
      p_engagement_id,
      p_task_id,
      null,
      p_title,
      p_artifact_label,
      p_submitted_by_label,
      p_risk,
      'open',
      jsonb_build_object('created_via', 'admin_create')
    )
    returning id into v_id;

  else
    select r.engagement_id into v_report_eng
    from public.report_artifacts r
    where r.id = p_report_artifact_id;

    if not found then
      return jsonb_build_object('ok', false, 'error', 'invalid_report');
    end if;

    if v_report_eng <> p_engagement_id then
      return jsonb_build_object('ok', false, 'error', 'report_engagement_mismatch');
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
      p_engagement_id,
      null,
      p_report_artifact_id,
      p_title,
      p_artifact_label,
      p_submitted_by_label,
      p_risk,
      'open',
      jsonb_build_object('created_via', 'admin_create')
    )
    returning id into v_id;
  end if;

  select ca.name
  into v_client_name
  from public.engagements e
  join public.client_accounts ca on ca.id = e.client_account_id
  where e.id = p_engagement_id;

  insert into public.activity_events (
    engagement_id,
    event_type,
    title,
    detail,
    actor_label,
    payload
  )
  values (
    p_engagement_id,
    'approval',
    'Approval requested: ' || p_title,
    trim(both ' · ' from (coalesce(v_client_name, '') || ' · ' || p_artifact_label)),
    p_actor_label,
    jsonb_build_object(
      'action', 'open',
      'approval_id', v_id,
      'task_id', p_task_id,
      'report_artifact_id', p_report_artifact_id,
      'risk', p_risk
    )
  );

  return jsonb_build_object('ok', true, 'approval_id', v_id);
end;
$$;

comment on function public.admin_create_approval_request(uuid, uuid, uuid, text, text, text, text, text) is
  'Creates an open approval_request (task XOR report); validates engagement match; appends activity_events.';

revoke all on function public.admin_create_approval_request(uuid, uuid, uuid, text, text, text, text, text) from public;
grant execute on function public.admin_create_approval_request(uuid, uuid, uuid, text, text, text, text, text) to service_role;
