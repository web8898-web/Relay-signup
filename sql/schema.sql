-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)
-- to create the tables this app needs.

create extension if not exists "pgcrypto";

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  categories jsonb not null default '[]',
  start_date date not null,
  end_date date not null,
  note text default '',
  creator_id text not null,
  creator_name text not null,
  short_code text unique,
  notify_enabled boolean not null default true,
  max_signups integer,
  quantity_unit text,
  created_at timestamptz not null default now()
);

create table if not exists signups (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  categories jsonb not null default '[]',
  name text not null,
  note text default '',
  quantity integer,
  category_quantities jsonb not null default '{}',
  owner_token text not null,
  created_at timestamptz not null default now()
);

create index if not exists signups_task_id_idx on signups(task_id);
create index if not exists tasks_creator_id_idx on tasks(creator_id);
create index if not exists tasks_short_code_idx on tasks(short_code);

-- Row Level Security: reads are public (this is a public relay-signup
-- tool), but writes only happen through the server-side API routes using
-- the service role key, so we can safely disable direct anon writes here.
alter table tasks enable row level security;
alter table signups enable row level security;

create policy "public can read tasks" on tasks
  for select using (true);

create policy "public can read signups" on signups
  for select using (true);

-- No insert/update/delete policies for the anon role are created on
-- purpose. All writes go through /app/api/* route handlers, which use the
-- service role key (bypasses RLS) after verifying the request server-side.
