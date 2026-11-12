# 架構與功能證據

## 基準及判讀

盤點：2026-10-28，repo `web8898-web/Relay-signup`，main commit `686054c70a60c351394fad66171df8ccc7d4005b`，tree `c1db890f98be6f61f0ddaffde8676d78b2d7b8ee`。GitHub API 與本機 Git tree 相符；以下路徑皆相對該 repo。[原始碼快照](https://github.com/web8898-web/Relay-signup/tree/686054c70a60c351394fad66171df8ccc7d4005b)。

「已實作」表示在呼叫路徑找到程式；「部分實作」表示流程缺少必要保障；「尚未實作」表示快照未找到；「需要確認」表示需要雲端設定或操作證據。實機／資料庫測試是否通過分開記錄。每次套用先比對新 commit。

## 技術及目錄

- Next.js App Router、JavaScript、React、Tailwind；jsconfig.json 只定義 `@/*`，沒有 TypeScript 設定。
- lockfile：Next 14.2.35、React 18.3.1、Tailwind 3.4.19、LIFF 2.29.1、Supabase JS 2.110.0。package.json 使用範圍版本；這不是升級指示。
- `app/`：頁面與 Route Handlers；layout.js 掛 LIFF、語系與多個 DOM 補丁。
- `app/(organizer)/`：/create、/my-tasks 共用 OrganizerShell／OrganizerContext；另有 /my-tasks/[id] 及其 /edit。
- `app/tasks/[id]/page.js`：server component 取 task，用 isQueueTask 選 QueueTaskDetailClient 或 TaskDetailClient；/tasks 舊列表入口導向首頁。
- `components/`：表單、名單、分享圖卡、小人、Loading、歷史修補；須查 import/render，不能把未掛載檔案當成功能。
- `lib/`：LINE 驗證／LIFF、Supabase public/admin、owner token、排序、分享、通知。
- `sql/`、`supabase/migrations/`：分散 schema／升級 SQL，沒有單一完整 migration runner。

## 功能矩陣

| 功能 | 狀態 | 證據與限制 |
| --- | --- | --- |
| 手機優先繁中綠白 UI、卡片與響應式 | 已實作 | globals.css、layout、Tailwind、主要元件；真機另驗 |
| 活動標題、說明、日期區間、備註 | 已實作 | app/(organizer)/create/page.js、POST /api/tasks；日期無時分 |
| 活動時分、場次、時區設定 | 尚未實作 | schema 為 date，無獨立場次模型 |
| 接龍／活動報名 | 已實作 | task_mode=normal；活動報名是此模式情境，不是第三個 enum |
| 現場候位 | 已實作 | task_mode=queue、QueueTaskDetailClient、queue-status API |
| 模式判定一致 | 部分實作 | isQueueTask 接受舊 marker、queue_mode、標題含「排隊」；signup POST 只認 task_mode |
| 分類單／多選、數量、代報 | 已實作 | create、TaskDetailClient、POST signups；配置部分藏在 categories marker |
| 名額上限 | 部分實作 | 先讀人數再 insert 非交易；讀取錯誤可能當零；PUT 未同步驗額度 |
| 開始／截止規則 | 部分實作 | taskStatus 用瀏覽器日期；POST 讀 end_date 未執行期限驗證，未取 start_date |
| 報名、本人修改／取消、狀態 | 已實作 | POST signups、PUT/DELETE signups/[id]；owner token 權限限制見下文 |
| 防重複／重整保障 | 部分實作 | 30 秒冷卻、候位有效資料預查；無 DB 冪等 key／有效候位唯一限制 |
| 主辦人 LINE 登入／寫入驗證 | 已實作 | liff.js、lineAuth.js、task API；channel 比對以 env 存在為前提 |
| 參加者跨裝置恢復 | 尚未實作 | ownerToken.js 的 localStorage UUID，無恢復流程 |
| 主辦人任務與名單畫面 | 已實作 | MyTasksListContent、app/my-tasks/[id]/page.js；讀取隔離不完整 |
| 主辦人更新／移除 task | 已實作 | task PUT/DELETE 檢查 creator_id；刪除 cascade 報名 |
| 主辦人任意修改／刪除他人報名 | 尚未實作 | signup PUT/DELETE 只認 owner token |
| 等待／完成切換 | 已實作 | checkin PATCH、主辦人名單；checked_in boolean，owner token 也可切換自己 |
| 自動叫下一位、過號、多櫃台、語音 | 尚未實作 | 無 called/no-show/serving 狀態與呼叫 API |
| 後端等待人數／順位／前方人數 | 已實作 | queue-status；stableSupabaseFetch 補 created_at 排序的 id tie-break |
| 前後畫面一致、原子快照、大量候位 | 部分實作 | 分兩次 select、無 version／分頁；主辦人本機計數且未定時同步 |
| 候位自動更新 | 已實作 | QueueTaskDetailClient 每 5 秒 POST，非 Realtime |
| 錯誤保留最後候位資料 | 部分實作 | refresh catch 不清 status；但 EMPTY_STATUS=0，首載失敗有假零；其他列表可能清空 |
| Loading／成功／錯誤／空資料 | 部分實作 | 有狀態 UI，但 Loading 數字與 DOM 競態、quiet error 未明示需驗 |
| 等待時間 | 部分實作 | relTime 加 Bridge 改文案；超過 24 小時顯示日期，不符合全時段分鐘／小時 |
| 小人只有一個且在狀態文字上方 | 部分實作 | Bridge 去重及插 slot；多全域 observer，需 DOM／視覺驗收 |
| 眨眼＋七種隨機動作＋泡泡 | 已實作 | QueueMascotReference random selector／timers；播放未驗證 |
| 短連結、文字分享、Flex 圖卡 | 已實作 | /s/[code]、share pages、buildFlexMessage、shareTargetPicker fallback |
| LIFF 深連結、返回與重開 | 部分實作 | init、15 秒 session redirect、layout liff.state、pageshow；需真機 |
| LINE iOS／Android WebView 相容 | 需要確認 | 有外開下載／焦點修補，不代表真機通過 |
| 主辦人智慧推播 | 部分實作 | linePush／smartNotify；依賴 notification_log、token、好友等設定 |
| 截止排程 | 部分實作 | cron route 驗 CRON_SECRET；註解提 vercel.json，但 repo 無此檔 |
| 群組自動推播／參加者 LINE 叫號通知 | 尚未實作 | 無群組綁定、webhook、參加者 LINE 映射 |
| CSV／TXT 匯出 | 已實作 | export route；但缺少 auth |
| 橫幅與分享圖片 | 已實作 | task-banner、TaskShareImagePanel；bucket 延遲建立，note 藏 banner marker |
| 首頁愛心 | 已實作 | love API、love_events SQL、首頁元件；channel 驗證需另檢 |
| GitHub → Vercel 連線 | 已實作 | 基準 commit 的 GitHub status Vercel=success；非本次功能測試 |
| Production branch／環境／LINE console | 需要確認 | README 記錄 main／網域；未核對雲端控制台 |
| lint | 部分實作 | 有 next lint script，無 ESLint config／依賴 |
| lockfile 可重現安裝 | 部分實作 | package.json 有 qrcode，lockfile 缺它與相依；npm ci 已重現 EUSAGE |
| typecheck、unit、integration、E2E、CI | 尚未實作 | 無 scripts、測試檔或 .github/workflows |

## API 信任邊界

| 方法／路由 | 驗證 | 行為 |
| --- | --- | --- |
| POST /api/tasks | LINE bearer verify/profile | task、short_code，撞號最多重試 5 次 |
| PUT/DELETE /api/tasks/[id] | LINE bearer + creator | 更新／刪除 task |
| POST /api/signups | body owner_token | 規則、容量、冷卻預查，建立單筆／批次 |
| PUT /api/signups/[id] | body owner_token 比對 DB | 改資料，規則弱於新增 |
| DELETE /api/signups/[id] | query owner_token 比對 DB | 取消；token 在 URL 需改善 |
| PATCH /api/signups/[id]/checkin | 本人 token 或 LINE creator | checked_in，非原子叫下一位 |
| POST /api/queue-status | task_id + owner_token | 統計與自己的資料，no-store |
| GET /api/tasks/[id]/export | 未見驗證 | anon client 讀名單，CSV/TXT |
| POST /api/task-banner | LINE bearer | storage task-banners，3 MB，PNG/JPEG/WebP |
| GET /api/cron/close-notify | CRON_SECRET bearer | 截止通知 |
| GET/POST /api/love | GET 公開、POST LINE profile | 愛心總數、近期顯示名、每日唯一 |
| POST /api/share-image-download | 公開 PNG 表單轉下載 | 接受 PNG data URL 並回下載檔，非名單授權 |

## 不可照搬的缺口

1. **隱私與 token**：schema 對 tasks/signups 使用 `for select using(true)`；signups 含明文 owner_token。TaskDetailClient 和管理詳情用 anon `select('*')`。若正式 grants/RLS 相同，公開讀取可取得他人憑證；queue-status 的欄位裁切不能封住底層查詢。正式政策未讀取，不宣稱已被利用。
2. **匯出與管理讀取**：export 無 auth；登入 UI／creator 篩選不能保護 DB/API。新建需授權後的伺服器讀取與最小欄位。
3. **併發與期限**：count→insert、冷卻預查、兩次 queue select、API 未檢截止；詳見 queue/database SOP。
4. **初始化缺件**：schema 缺 batch_id；notification_log 沒 DDL；無 .env.local.example、vercel.json、ESLint config。README 不能保證完整重建。
5. **DOM 補丁**：初始假零、timer／舊回應清理、超過一天等待時間等要有回歸證據。

文件任務只記錄缺口；有授權的新建／修復才實作，並以 [testing.md](testing.md) 驗收。
