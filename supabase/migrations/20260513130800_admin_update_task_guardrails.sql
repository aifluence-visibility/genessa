-- Stage 1 · task update guardrails (internal admin)
-- Replaces admin_update_task: validates transitions before UPDATE.

create or replace function public.admin_update_task(
  p_task_id uuid,
  p_actor_label text default 'Internal',
  p_status text default null,
  p_approval_state text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cur_status text;
  v_cur_approval text;
  v_new_status text;
  v_new_approval text;
  v_ok_status boolean;
  v_ok_approval boolean;
begin
  if p_task_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_id');
  end if;

  if p_status is null and p_approval_state is null then
    return jsonb_build_object('ok', false, 'error', 'no_fields');
  end if;

  p_actor_label := coalesce(nullif(trim(p_actor_label), ''), 'Internal');
  if length(p_actor_label) > 200 then
    p_actor_label := left(p_actor_label, 200);
  end if;

  v_ok_status := p_status is null or p_status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled');
  v_ok_approval := p_approval_state is null or p_approval_state in ('not_required', 'pending', 'approved', 'rejected');

  if not v_ok_status then
    return jsonb_build_object('ok', false, 'error', 'invalid_status');
  end if;

  if not v_ok_approval then
    return jsonb_build_object('ok', false, 'error', 'invalid_approval_state');
  end if;

  select t.status, t.approval_state
  into v_cur_status, v_cur_approval
  from public.tasks t
  where t.id = p_task_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  v_new_status := coalesce(p_status, v_cur_status);
  v_new_approval := coalesce(p_approval_state, v_cur_approval);

  -- Cancelled tasks are immutable (Stage 1; avoids silent churn on dead work).
  if v_cur_status = 'cancelled' then
    return jsonb_build_object('ok', false, 'error', 'task_cancelled');
  end if;

  -- Cannot be "done" while approval is still pending (resolve queue first or set not_required / approved / rejected).
  if v_new_status = 'done' and v_new_approval = 'pending' then
    return jsonb_build_object('ok', false, 'error', 'done_requires_approval_resolution');
  end if;

  -- A completed task cannot be put back into an active approval wait without changing status first.
  if v_cur_status = 'done' and v_new_approval = 'pending' then
    return jsonb_build_object('ok', false, 'error', 'cannot_pending_while_done');
  end if;

  perform set_config('genessa.actor_label', p_actor_label, true);

  update public.tasks t
  set
    status = v_new_status,
    approval_state = v_new_approval
  where t.id = p_task_id;

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.admin_update_task(uuid, text, text, text) is
  'Updates task status and/or approval_state with guardrails; emits activity via tasks_activity_after_update.';

revoke all on function public.admin_update_task(uuid, text, text, text) from public;
grant execute on function public.admin_update_task(uuid, text, text, text) to service_role;
