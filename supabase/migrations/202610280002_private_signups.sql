-- Deploy the authenticated/list API release BEFORE applying this migration.
-- No rows are changed. Public normal lists are returned through /api/signups;
-- queue lists require organizer LINE authentication. owner_token stays server-only.
begin;
alter table public.signups enable row level security;
drop policy if exists "public can read signups" on public.signups;
revoke all privileges on public.signups from public, anon, authenticated;
grant all privileges on public.signups to service_role;
commit;
