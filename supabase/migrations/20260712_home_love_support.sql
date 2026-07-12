create extension if not exists pgcrypto;

create table if not exists public.love_events (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  display_name text not null,
  event_date date not null default (timezone('Asia/Taipei', now())::date),
  created_at timestamptz not null default now(),
  constraint love_events_display_name_length
    check (char_length(display_name) between 1 and 60)
);

create unique index if not exists love_events_user_date_unique
  on public.love_events (user_key, event_date);

create index if not exists love_events_created_at_idx
  on public.love_events (created_at desc);

alter table public.love_events enable row level security;

-- 首頁需讀取總數並接收 Realtime INSERT；user_key 僅為不可逆雜湊值。
drop policy if exists "love events are publicly readable" on public.love_events;
create policy "love events are publicly readable"
  on public.love_events
  for select
  to anon, authenticated
  using (true);

-- 前端不得直接寫入；新增事件只能經由伺服器 API 使用 service role 完成。
revoke insert, update, delete on public.love_events from anon, authenticated;
grant select on public.love_events to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'love_events'
  ) then
    alter publication supabase_realtime add table public.love_events;
  end if;
end $$;
