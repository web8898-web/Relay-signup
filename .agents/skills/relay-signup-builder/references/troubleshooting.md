# 排錯索引

先確認目標 commit、task 模式、環境、失敗步驟；只記 request id／狀態／非敏感摘要，不記 token 或完整個資 payload。先排除資料與授權問題，別用前端文字替換掩蓋錯誤。

| 症狀 | 證據位置／可能原因 | 處理及驗收 |
| --- | --- | --- |
| npm ci EUSAGE | package.json qrcode 未進 lockfile | 記為可重建性失敗；文件任務只在隔離副本補裝診斷；依賴修復另交 PR |
| lint 要求選 Strict/Base | 缺 ESLint config／依賴 | 停止初始化，標未驗證；不可說 lint 通過 |
| build 提示缺 service-role | getSupabaseAdmin 或 build 嘗試預渲染 route | 查靜態／動態路由與 env；不填正式 secrets，不能把被捕捉的錯誤視為功能正常 |
| 建立 task 回 503 | tasks.task_mode 缺欄位 | 對帳 migration_task_mode.sql 與實際 schema；不在未授權正式 DB 直接執行 |
| 多人／代報失敗 | signups.batch_id 缺欄位 | 核對 batch_id.sql；驗單人及 batch 兩條路徑 |
| 推播沒來 | notification_log 無 DDL、token、資格、claim 先成功但送訊失敗 | 不因 API 被 catch 或 push success 宣稱收到；授權測試對象才可實發 |
| 截止通知未跑 | 註解提 vercel.json 但 repo 無檔；cron/secret 未配置 | 讀雲端設定，標需要確認；不要為文件任務新增排程 |
| 順位與人數不一 | 不同資料快照、讀取上限、主辦人舊列表、DOM 補丁 | 比對同一後端統計與版本，修單一來源，驗併發與超過一頁資料 |
| 初載顯示 0 或錯誤清空 | EMPTY_STATUS、data/count fallback、observer 修改 | 未知用 null/loading，後續失敗保留 last valid；測首載與刷新各自失敗 |
| 排隊重複／超額 | active 預查或 count→insert 競態 | DB unique／交易／冪等，平行請求重現；按鈕 disabled 不算修好 |
| 截止後還能 POST | API 未驗開始／截止 | 後端驗時區與時間，同步新增和修改；不能只禁用按鈕 |
| 標題含排隊被當 queue | isQueueTask 的歷史名稱推斷，POST 只認 task_mode | 盤點舊資料並設遷移方案，統一規則；不根據名稱宣稱功能或搬動正式資料 |
| 重整後名次交換 | 缺 created_at/id tie-break | 查 stableSupabaseFetch 是否用於該 client；測同 timestamp |
| 小人多個／閃爍／遮字 | layout 多個 mascot／Bridge／Fix 搶 DOM | 查掛載與 selector；React 單元件接手並移除相對應補丁，驗返回／完成／cancel |
| 小人依順位固定 | 新動作選擇器依 rank 分支 | 恢復隨機選擇；同順位驗多種動作，保留八動作與泡泡 |
| 等待時間不動或變日期 | relTime 無專用 ticker、超過 24h 分支 | 以後端 created_at + UI clock，分鐘／小時格式；不可用動畫 mount 時間 |
| 有登入 UI 仍可匯出他人 | export 無 auth、public select | 後端 ownership＋最小讀取權限；驗直接 URL／anon API，別只藏按鈕 |
| 同人外開後不能修改 | localStorage 隔離 | 解釋瀏覽器身分限制；跨裝置需求另建可信驗證／恢復，不能按姓名認領 |
| LIFF 卡住／跳首頁 | init promise、endpoint、redirect 時效、liff.state | 依官方 docs 查 init/redirect，檢手機返回；不印 token，不臆測 console 已正確 |
| 分享連到舊站／露 marker | utils 硬編碼網域、note/categories metadata | 查所有分享入口，套可見內容函式；驗文字、Flex、圖片、QR |

找到超出任務範圍的問題時，交付位置、影響、建議修法及待驗證項目，繼續可完成的工作。不為讓檢查通過更改正式 API、資料或部署設定。
