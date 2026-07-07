-- 多人報名分組：在 signups 表加 batch_id，標記「同一批一起送出」的報名。
-- 請在 Supabase SQL Editor 執行一次。
-- 單獨報名的人 batch_id 為 NULL；一次幫多人報名時，同一批共用同一個 batch_id。

alter table signups
  add column if not exists batch_id uuid;

create index if not exists signups_batch_idx on signups(batch_id);
