# 2026-10-28 系統檢查與修復

基準：main `2e5431b`。驗證環境：macOS、Node 26.5.0、本機 PostgreSQL、390 × 844 瀏覽器。正式站只做唯讀 smoke；所有報名寫入測試皆使用隔離假資料。

## 確認並修復

- API 接受空白姓名、未開始／已截止報名，以及資料庫讀取失敗後繼續送出。新增共用姓名、分類、整數數量、期間驗證，失敗時停止寫入。
- 修改可繞過必選／單選與數量限制，或增加人數超過容量。共用驗證只計算所選分類，資料庫鎖定任務後重新計算容量。改名不變更 created_at／id。
- 併發報名超收及同瀏覽器重複候位：原資料庫上限 1 人時 8 個同時請求全部成功。新增交易內觸發器後只成功 1 個；代報批次必須全部成功或全部回滾。已完成候位重新開啟也受容量及有效候位限制。
- 候位首次載入／失敗顯示假 0，安靜輪詢失敗沒有提示，舊回應覆蓋新回應。新增未知／載入／失敗／已同步狀態、重試、版本檢查及卸載失效機制。
- 候位總數／順位受預設 1,000 筆上限影響，且兩次查詢可能來自不同時間點。改為 service_role 專用單一資料庫快照 RPC，只回傳本人的姓名明細。一般名單、主辦人清單與匯出改為完整分頁讀取；後續頁失敗不交付部分名單。
- 儲存報名失敗時編輯器關閉、網路失敗可能卡住：保留草稿、顯示錯誤並恢復重試按鈕。
- 分享 API 拒絕時只宣稱下載但沒有下載：實際執行下載備援；使用者取消分享則不下載。中英文使用同一原生分享／儲存按鈕，移除直接刪除 React 按鈕的全域修補。
- 英文候位及報名成功畫面混入中文：改為原生雙語文案、日期、等待時長。既有小人視覺修補只處理外觀，不再覆寫原生數字和載入狀態。
- 建立／修改任務拒絕空白標題、不存在日期、結束早於開始。任務日期以 Asia/Taipei 統一前後端判斷，避免 UTC 午夜差異。
- checked_in 只接受 boolean，拒絕把字串 "false" 當成 true。

## 已執行驗證

- `npm test`：22 個通過，涵蓋既有 10 個回歸，以及本次 API、React 編輯、候位錯誤／亂序回應、完整英文、分享失敗／取消、分頁與等待時長。
- `node scripts/test-database.mjs`：8 組真實 PostgreSQL 整合檢查通過。腳本只連 localhost、建立獨立暫存 DB 並於結束刪除；包含 8 個併發請求、代報回滾、改人數／取消、截止、重開候位、1,005 筆順位、RPC execute 權限。
- `npm run build`：成功。沒有獨立 typecheck；專案未配置 ESLint，不能把 build 當成已完成獨立 lint。
- 瀏覽器 fixture：實際 Queue 元件與既有小人元件，初次失敗→恢復／重試→加入→改名保留第 6 位→取消減回 5 人。320／375／390／430 px 均無水平溢出，小人各為 1 個。
- 保留本機證據：`test-results/audit-before.log`、`audit-final-tests.log`、`database-audit.log`、`audit-final-build.log`、`audit-queue-en.png`（ignored，含假資料）。

## 發布順序及回復

1. 確認 PR head 的 Vercel build 成功。
2. 先執行 `supabase/migrations/202610280003_signup_integrity.sql`，再發布使用新 RPC 的 app。migration 不刪改既有報名；只新增 trigger/function 與權限。應用前已唯讀核對正式欄位，原先無 signup 自訂 trigger 或同名 RPC。
3. 合併 main，確認正式部署的 SHA、Ready 與 relay-signup.vercel.app alias，執行唯讀 API smoke。
4. App 回復到 `2e5431b` 可保留新增資料庫函式與保護。若資料庫 guard 本身有問題，需另外移除 `signup_integrity` trigger；Vercel rollback 不會回復 SQL。

## 驗證界線

此次沒有在正式站建立測試報名或推播 LINE。LINE iOS／Android 真機登入、原生系統分享／下載權限、實際通知投遞仍未實機驗證。瀏覽器 mock 與本機 PostgreSQL 的結果不能冒充這些平台結果，也不代表系統絕無其他問題。
