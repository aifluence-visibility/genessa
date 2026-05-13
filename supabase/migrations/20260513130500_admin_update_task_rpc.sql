-- Stage 1 · admin task update (service_role); sets genessa.actor_label for activity trigger

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

  perform set_config('genessa.actor_label', p_actor_label, true);

  update public.tasks t
  set
    status = coalesce(p_status, t.status),
    approval_state = coalesce(p_approval_state, t.approval_state)
  where t.id = p_task_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.admin_update_task(uuid, text, text, text) is
  'Updates task status and/or approval_state (null = leave unchanged). Emits activity_events via tasks_activity_after_update trigger.';

revoke all on function public.admin_update_task(uuid, text, text, text) from public;
grant execute on function public.admin_update_task(uuid, text, text, text) to service_role;
