---
name: relay-signup-builder
description: 建立或維護 LINE 接龍、活動報名與現場候位系統，依 Relay-signup 的程式證據整理需求、React UI、權限、資料一致性、隨機等待動畫、測試與 GitHub／Vercel 部署準備。適用既有接龍小助手的修復及客製；不適用一般 LINE 聊天機器人或無關網站。
---

# LINE 接龍報名小助手

## 適用情境與觸發

收到「建立 LINE 接龍／活動報名／現場候位」、「維護 Relay-signup」、「修正候位順位、報名或等待小人」等需求時使用。支援新建、客製與既有系統維護；純文件工作只分析與寫文件，不改產品。

基準是 [web8898-web/Relay-signup](https://github.com/web8898-web/Relay-signup) 的 `686054c70a60c351394fad66171df8ccc7d4005b`，盤點日期 2026-10-28（Asia/Taipei）。這是程式快照，不能代表未來版本或正式環境已驗收。既有程式中的安全與一致性缺口見 [architecture.md](references/architecture.md)，不得直接當成新系統的安全範本。

## 執行流程

1. **查找與定界。** 遵守當前 AGENTS.md。使用者的 Dropbox AI Skill 資料庫可存取時先讀其 `SKILLS_INDEX.md`，再讀匹配 Skill；不要要求重傳已可存取的 Skill。已有本 Skill 時比較內容及基準 commit，勿按修改時間覆寫。確認這次是新建、維護、文件或部署，沿用已明確的授權。
2. **讀取實際版本。** 記錄 repository、目標分支、commit、dirty files；先讀 [architecture.md](references/architecture.md)，再核對此次程式、SQL、package scripts 和部署設定。功能使用「已實作／部分實作／尚未實作／需要確認」；測試另標「通過／失敗／未驗證」。README、註解、功能名稱不能取代證據。
3. **確認需求並規劃。** 用 [workflows.md](references/workflows.md) 決定接龍、活動報名或現場候位，釐清名額單位、期間、身分、隱私、主辦人權限。已知資訊直接沿用，只詢問會改變實作的缺項。先產出資料流與驗收案例，再做授權範圍內的開發。
4. **建立獨立分支。** 優先 `codex/` 分支；保留使用者未提交變更。新系統使用自己的測試資料庫、LINE 設定與網域，避免沿用來源的正式資源。資料、UI、LINE、客製分別按下表載入參考。
5. **實作並自動檢查。** 以 React state／元件管理 UI，沿用現有樣式與隨機動畫。依 [testing.md](references/testing.md) 主動辨識並執行專案支援的 lint、typecheck、build、test；不要等待使用者再提醒。補跑本次變更相關的資料權限、競爭條件與瀏覽器驗收。缺少測試基礎設施或真機時明列「未驗證」。
6. **準備部署與交付。** 依 [deployment.md](references/deployment.md) 核對環境、差異、預覽、回復方案及 PR。只有文件的任務只提交文件。PR／預覽不等於正式上線授權；正式合併、資料遷移、LINE console 或 Production 設定變更依本次授權執行。

## 按需讀取的參考文件

| 工作 | 必要文件 |
| --- | --- |
| 首次接手、功能現況、程式入口 | [architecture.md](references/architecture.md) |
| 新建、活動報名、現場候位 SOP | [workflows.md](references/workflows.md) |
| 前台、狀態、手機畫面與小人 | [ui-design.md](references/ui-design.md) |
| 人數、順位、更新、排隊原子性 | [queue-system.md](references/queue-system.md) |
| LIFF、分享、手機返回、推播 | [line-integration.md](references/line-integration.md) |
| schema、migration、環境變數、權限 | [database.md](references/database.md) |
| 指令檢查、功能與真機驗收 | [testing.md](references/testing.md) |
| GitHub、Vercel、預覽、回復 | [deployment.md](references/deployment.md) |
| 錯誤定位與既有缺口 | [troubleshooting.md](references/troubleshooting.md) |
| 客製化、擴充與 Skill 維護／Dropbox 同步 | [customization.md](references/customization.md) |

## 安全及品質限制

- 伺服器驗證主辦人 LINE token 和任務所有權；參加者修改／取消須驗證本人資格。前端隱藏按鈕、篩選 creator_id、localStorage 名單都不是後端授權。
- 不公開其他報名者的姓名、備註、owner token、LINE ID 或完整原始資料列。既有公開 RLS 與匯出缺口必須列出，不能宣稱安全完成。service-role key、登入 token、正式資料不得進 Skill、Git、截圖或日誌。
- 人數、個人順位、前面等待人數以同一可信後端快照為準。未取得成功資料不能顯示「0 位等待中」；錯誤保留最後成功資料並顯示狀態，禁止用 DOM 文字補湊數字。
- 避免過期回應覆蓋新資料、重複請求／元件。清理 timer、observer、listener。優先移到 React 元件與狀態；不要新增 MutationObserver 去改 React DOM，歷史補丁只在授權修改區域逐步整合。
- 等待小人在狀態文字上方、同頁最多一個，不遮文字按鈕。保留眨眼、看手機、左右張望、打哈欠、伸懶腰、看時間、喝飲料、看書與適度泡泡的隨機模式；**不得改成依順位固定動作**。
- 正式站功能、資料庫、API、部署設定只能在此次需求授權範圍內變更。必要修復若超出範圍，先交付有證據的缺口與方案；不擅自執行。

## 驗收與交付標準

應能追溯需求 → 變更 → 測試證據。報名、修改、取消、重整不重複、主辦人處理、數量／順位、首載／失敗狀態、等待時間與隨機小人、窄螢幕及 LINE iOS／Android 操作均有結果；未測項目明列，不以建置成功代替。

交付包含：分支／commit、變更檔案、功能狀態與證據、已跑指令及結果、未驗證項目／原因、預覽或 PR URL、部署前待辦。若有資料庫變更，提供 migration 與相容／回復步驟。若本次建立／更新 Skill，另外交付使用方式、版本來源、Dropbox 索引與下載包的一致性結果。
