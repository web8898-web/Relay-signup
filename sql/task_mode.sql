-- Run this in Supabase SQL Editor before using task modes in production.

alter table tasks
  add column if not exists task_mode text not null default 'normal';

alter table tasks
  drop constraint if exists tasks_task_mode_check;

alter table tasks
  add constraint tasks_task_mode_check
  check (task_mode in ('normal', 'queue'));
