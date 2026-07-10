-- Run this in Supabase SQL Editor before using live queue/check-in handling.

alter table signups
  add column if not exists checked_in boolean not null default false;

create index if not exists signups_task_checked_in_idx
  on signups(task_id, checked_in, created_at);
