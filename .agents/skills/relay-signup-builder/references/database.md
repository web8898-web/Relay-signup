# 資料庫、權限與環境

## 實際資料表

| 表／來源 | 欄位與約束 | 缺口 |
| --- | --- | --- |
| tasks，sql/schema.sql | UUID id；title/description/categories JSONB；start_date/end_date；note；creator_id/name；unique short_code；notify_enabled；max_signups；quantity_unit；task_mode normal/queue；created_at | 無時分／場次、正式政策待查 |
| signups，sql/schema.sql | UUID id；task_id FK cascade；categories/name/note；quantity/category_quantities JSONB；owner_token；checked_in；created_at | owner_token 明文；無 active unique／冪等 key／原子容量限制 |
| signups.batch_id，sql/batch_id.sql | nullable UUID + index，同批代報分組 | 基礎 schema 未包含，API 多人 insert 會用到 |
| love_events，supabase/migrations/20260712_home_love_support.sql | UUID id；HMAC user_key；display_name；台北日期 event_date；created_at；unique user_key+date | 有公開 select／Realtime；不應當報名身分模型 |
| notification_log，lib/smartNotify.js 使用 | task_id/event_key/created_at，程式期待 claim 防重 | **repo 無 DDL**；型別、unique、RLS、索引、實際表存在需確認 |

索引：tasks creator_id／short_code、signups task_id；checked_in.sql 補 task_id/checked_in/created_at；batch_id.sql 補 batch index。task-banners 是 Storage bucket，API 可能於首次上傳建立，非 SQL 表。

## 重建與升級 SOP

1. 讀目標環境的 schema metadata（若有授權），不要讀正式名單當測試資料；盤點欄位、constraint、grant、policy、index、publication、bucket。沒有存取權就寫「需要確認」。
2. 新建隔離 DB 時以 schema 作欄位參考，先修訂公開讀取設計，再依所需功能補 batch_id／checked_in 索引／love_events。schema 的 create policy 不是可無限重跑的 migration。
3. 升級既有 DB 先比較，不把所有 SQL 順序跑一輪。migration_task_mode.sql 會把舊 marker 轉欄位、移除 marker、關閉 queue 通知；task_mode.sql 只是加欄位／限制，兩者不可混稱相同。short_code migration 會回填資料，先檢碰撞。
4. 通知若列入需求，先設計及審查 notification_log 的 `(task_id,event_key)` 唯一性、created_at、外鍵、權限與失敗重送語義；沒有 DDL 不宣稱可重建通知。只需候位時不可默默配置推播。
5. 依 [queue-system.md](queue-system.md) 加交易、active uniqueness、冪等性與後端快照。新增／修改均驗期限、容量與分類，查詢錯誤 fail closed。
6. 將 schema 變更以明確 migration 放入 PR，在測試庫驗新建、升級、資料相容、回復。正式資料遷移、備份、清除須符合本次授權；不為了驗收直接操作正式庫。

## 權限規範

現有 schema 的公開 select **不是安全範本**；RLS 啟用不代表資料保密。service-role 會越過 RLS，所有 server 路由都須自己驗證授權。參考 [Supabase RLS 官方說明](https://supabase.com/docs/guides/database/postgres/row-level-security)。

| 角色 | 可讀 | 可寫 |
| --- | --- | --- |
| 未加入訪客 | 可公開的任務內容、匿名統計 | 通過規則的本人加入 |
| 參加者 | 本人明細／順位、匿名統計 | 本人改名／取消；完成權依需求明定 |
| 主辦人 | 自己任務的必要名單／匯出 | 自己 task、授權現場處理 |
| cron | 所需通知資料 | 通知紀錄；需 secret 驗證 |

推薦由已驗證 server API 提供授權投影，禁止 anon 直接讀原始 signups；若選 RLS/JWT 方案，必須建立可信身分映射。LIFF token 不會自動變成 Supabase Auth JWT。只使用 owner token 時將其視為 bearer capability，後端保存安全雜湊、透過 HTTPS body/header 傳遞，不放 query、URL、分享卡或日誌。不要讓回應包含他人 token／LINE ID。現版尚未做到這些全套要求。

匯出同樣需 server ownership check；LINE 外開瀏覽器不能假設持有原 session，可設經驗證後短效單次下載憑證，不能用長效 owner token 當下載 query。CSV 的使用者文字須防 spreadsheet formula injection。

## 環境變數清單（只列名稱，不放真值）

| 名稱 | 範圍／用途 |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | 前後端資料服務位置，測試與正式分開 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | 公開 client key，安全依賴權限政策 |
| SUPABASE_SERVICE_ROLE_KEY | 僅 server，高權限，禁止 NEXT_PUBLIC 前綴 |
| NEXT_PUBLIC_LIFF_ID | LIFF app 識別；新專案用自己的 ID |
| LINE_LOGIN_CHANNEL_ID | server 驗 LINE token 的 client_id；新建列為必要設定 |
| LINE_CHANNEL_ACCESS_TOKEN | 選配 server Messaging API 推播 |
| CRON_SECRET | 選配截止排程 bearer |
| LOVE_EVENT_HASH_SECRET | 選配愛心 HMAC；現版退回 service-role 值，換 key 需考慮每日去重身分變化 |

repo 沒有 README 提及的 .env.local.example，亦沒有 .gitignore。未來開發若需要補 env 範本／忽略規則，依範圍另提交；本 Skill 建立不新增產品設定。測試／build 不輸出 env 值，不用正式 secrets 填臨時副本。
