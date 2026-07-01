-- 遷移用：幫既有的 Supabase 專案補上 short_code 欄位
-- 用途：讓每個任務都有一組穩定的短代碼，分享連結可以變成
--       https://relay-signup.vercel.app/s/aB3xQ2 這種短網址，
--       不再依賴 TinyURL 這類外部免費服務。
--
-- 使用方式：到 Supabase 專案 -> SQL Editor -> New query，
-- 把這整段貼進去，按 Run 執行一次即可（可以重複執行，不會出錯）。

-- 1. 新增欄位（如果已經存在就跳過）
alter table tasks add column if not exists short_code text;

-- 2. 幫還沒有短代碼的既有任務，用任務自己的 id 算出一組 6 碼短代碼
--    （用 id 當隨機來源，因為 id 本身已經是唯一值，算出來的短代碼
--    在正常規模下發生撞號的機率極低）
update tasks
set short_code = substr(md5(id::text), 1, 6)
where short_code is null;

-- 3. 補上唯一限制與索引（如果已經存在會自動跳過）
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_short_code_key'
  ) then
    alter table tasks add constraint tasks_short_code_key unique (short_code);
  end if;
end $$;

create index if not exists tasks_short_code_idx on tasks(short_code);
