-- At most one open approval per task or per report (Stage 1 queue invariant).
-- Enforced by partial unique indexes + admin_create checks; rerun uses a subtransaction
-- so supersede + insert roll back together on unique_violation.

create unique index if not exists approval_requests_one_open_per_task_id_idx
  on public.approval_requests (task_id)
  where status = 'open' and task_id is not null;

create unique index if not exists approval_requests_one_open_per_report_id_idx
  on public.approval_requests (report_artifact_id)
  where status = 'open' and report_artifact_id is not null;

comment on index public.approval_requests_one_open_per_task_id_idx is
  'Stage 1: prevents duplicate open queue rows for the same task.';
comment on index public.approval_requests_one_open_per_report_id_idx is
  'Stage 1: prevents duplicate open queue rows for the same report artifact.';

-- === admin_create_approval_request (duplicate guard + insert sub-block) ===

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

    if exists (
      select 1
      from public.approval_requests ar
      where ar.task_id = p_task_id
        and ar.status = 'open'
    ) then
      return jsonb_build_object('ok', false, 'error', 'duplicate_open_task_approval');
    end if;

    begin
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
    exception
      when unique_violation then
        return jsonb_build_object('ok', false, 'error', 'duplicate_open_task_approval');
    end;

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

    if exists (
      select 1
      from public.approval_requests ar
      where ar.report_artifact_id = p_report_artifact_id
        and ar.status = 'open'
    ) then
      return jsonb_build_object('ok', false, 'error', 'duplicate_open_report_approval');
    end if;

    begin
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
    exception
      when unique_violation then
        return jsonb_build_object('ok', false, 'error', 'duplicate_open_report_approval');
    end;

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
  'Creates an open approval_request (task XOR report); rejects duplicate open for same target; validates engagement; activity_events.';

revoke all on function public.admin_create_approval_request(uuid, uuid, uuid, text, text, text, text, text) from public;
grant execute on function public.admin_create_approval_request(uuid, uuid, uuid, text, text, text, text, text) to service_role;


-- === admin_rerun_approval_request (subtransaction: supersede + task nudge + insert atomic) ===

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

  begin
    perform set_config('genessa.actor_label', p_actor_label, true);

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

  exception
    when unique_violation then
      return jsonb_build_object(
        'ok',
        false,
        'error',
        case
          when v_task_id is not null then 'duplicate_open_task_approval'
          else 'duplicate_open_report_approval'
        end
      );
  end;

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
  'Supersedes open approval (rerun), nudges linked task, opens follow-up row (atomic sub-block); no duplicate open target.';

revoke all on function public.admin_rerun_approval_request(uuid, text) from public;
grant execute on function public.admin_rerun_approval_request(uuid, text) to service_role;
