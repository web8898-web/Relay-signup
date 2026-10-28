# 多人接龍編號跳動修復

基準：`ce54ff8`。使用者規則：新增／改名／刷新不應讓原第 1 位變成第 5 位；前面的人取消後，後面編號仍要依序往前遞補。

## 原因與修復

舊前台及主辦人卡片直接依回傳陣列的位置標號。原排序依 `created_at,id`，但 API 可在寫入前產生時間，資料庫預設 now() 也是交易開始時間；晚完成的請求不一定具有較晚時間。測試以原第 1 位及四筆稍後抵達、時間較早的資料，重現原人變第 5 位。這證明一條可造成此現象的路徑，不代表已取得使用者當時事件的原始紀錄。

- 新增內部 `signup_order`，在資料庫鎖定任務後配置，同一任務的報名順序不可修改或重用。並發、時鐘差異和回應順序不再改變先後。
- **內部順序不是永久顯示號碼。** 前台／管理頁／匯出都依成功快照的報名順序顯示 1…N；取消前面的人時正常遞補。新報名加入尾端，改名不換位置。
- 完整名單改成單一 SQL snapshot，不再因 OFFSET 分頁間有人取消而漏列或重複。SQL 僅回傳允許公開的欄位，RPC 只有 service_role 可執行，API 沿用既有主辦人權限檢查。
- 主辦人候位卡片退出處理模式時曾切回原始名單序號（可重現 1→5），收合重開也會重置成功處理狀態。統一顯示目前順位，開關卡片不回讀舊 props。
- 防止切換任務／卸載後的舊請求更新名單，修改／取消前後也使舊讀取失效。
- 舊快取資料若缺新欄位，依時間及 id 回退排序，保留 PostgreSQL 的微秒精度。

## 證據

- 變更前的 React 測試在前台與主辦人卡片皆失敗：expected 1、actual 5。
- `npm test`：28 個通過。包含 1,505 人、分批顯示 30→120 位、搜尋／分類、改名、取消後 1505→1500，以及 API/CSV/TXT 的同順序與遞補。
- `node scripts/test-database.mjs`：13 組通過。包括舊欄位及既有順序完整保留、32 個並發報名唯一排序、重跑 migration 不重編、不可改排序、取消往前、1,005 筆完整 snapshot、私密欄位與 RPC 權限。
- `npm run build`：成功。未另設 typecheck／ESLint；不以 build 宣稱獨立 lint 完成。
- 本機 390px 手機瀏覽器（無 console error）：加入四人並打亂回傳，最早報名者仍為 1；取消最前面一人後原 2 成為 1；1,505 人最後五位在取消前五位後為 1496…1500。主辦人完成前四位後，退出處理模式與收合重開均維持最後一位的目前順位為 1。
- 證據於 ignored `test-results/signup-number-before.log`、`signup-order-tests.log`、`queue-position-before.log`、`signup-order-db.log`、`signup-order-build.log`、`signup-order-added.png`、`signup-order-cancelled.png`、`signup-order-1505.png`、`signup-order-reopen.png`。

## 發布與回復

先套用 `202610280004_stable_signup_order.sql`，再部署 app。migration 在單一交易及排他鎖內，依目前 `(created_at,id)` 為舊名單填入內部順序，只新增欄位，不改姓名、時間等既有欄位；逐筆指紋不符即整批回滾。鎖等待上限 5 秒、執行上限 60 秒。對舊資料回填期間僅在鎖內停用 signup_integrity，再於提交前啟用；並發請求不能穿過此鎖。重新執行不會改已分配順序。

回復前一版 app 可以保留新增欄位／trigger／RPC；舊版不傳內部順序，仍可正常報名。不要刪除排序欄位或重設 counter，否則可能破壞已建立的先後。先前跳號前的歷史原始號碼未保存，不能可靠推算還原；回填保留目前可核對順序。

正式站驗收只讀取 API 與 schema，不建立測試名單。LINE iOS／Android 真機未在本次重新驗證。
