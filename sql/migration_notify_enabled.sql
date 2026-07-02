-- 遷移用：幫既有的 Supabase 專案補上 notify_enabled 欄位
-- 用途：讓每個任務可以個別開關「有人報名時是否要推播 LINE 通知給主辦人」
--
-- 使用方式：到 Supabase 專案 -> SQL Editor -> New query，
-- 把這整段貼進去，按 Run 執行一次即可（可以重複執行，不會出錯）。

alter table tasks add column if not exists notify_enabled boolean not null default true;
