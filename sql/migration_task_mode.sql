-- Run once in Supabase SQL Editor.
-- Adds the dedicated task mode column used by normal signup and live queue tasks.

alter table public.tasks
  add column if not exists task_mode text;

update public.tasks
set task_mode = case
  when task_mode in ('normal', 'queue') then task_mode
  when categories @> '["__relay_queue_mode__"]'::jsonb then 'queue'
  else 'normal'
end;

alter table public.tasks
  alter column task_mode set default 'normal';

alter table public.tasks
  alter column task_mode set not null;

alter table public.tasks
  drop constraint if exists tasks_task_mode_check;

alter table public.tasks
  add constraint tasks_task_mode_check
  check (task_mode in ('normal', 'queue'));

-- Clean the temporary legacy marker from categories after migrating it.
update public.tasks
set categories = coalesce(
  (
    select jsonb_agg(value)
    from jsonb_array_elements(categories) value
    where value <> '"__relay_queue_mode__"'::jsonb
  ),
  '[]'::jsonb
)
where categories @> '["__relay_queue_mode__"]'::jsonb;

-- Queue tasks never use organizer LINE notifications.
update public.tasks
set notify_enabled = false
where task_mode = 'queue';
