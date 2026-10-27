-- Matches the existing production table; safe for both existing and new databases.
begin;
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  event_key text not null,
  created_at timestamptz not null default now(),
  unique (task_id, event_key)
);
create index if not exists notification_log_task_time_idx
  on public.notification_log(task_id, created_at desc);
alter table public.notification_log enable row level security;
revoke all privileges on public.notification_log from anon, authenticated;
grant all privileges on public.notification_log to service_role;
commit;
