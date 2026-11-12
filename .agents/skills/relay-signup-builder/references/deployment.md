# GitHub → Vercel 部署準備

## 已知與未知

基準 commit 的 GitHub combined status 有 Vercel success，連到 [該次部署](https://vercel.com/wowdennis/relay-signup/D87fuBJbwEviaWvgciyFhq5tidyk)。README 記錄正式網域 relay-signup.vercel.app、main 自動部署；Production branch、Preview secrets、LINE console、正式 schema 未核對。repo 沒 vercel.json 或 Actions workflow，不能稱截止 cron 已設定。

本次 Skill 建立只提交 Skill／文件，不改任何部署設定，不合併。未來操作以當次需求授權為準；本次允許 PR 不能延伸成所有未來任務的正式發布許可。

## SOP

1. **確認版本**：讀 remote/default branch、git status、目標 SHA、現有 PR；建立 codex/ 分支，避免混入使用者修改。多工作目錄時記錄實際路徑，不盲目 reset 或 force push。
2. **環境對帳**：按 database.md 列出變數名稱、Development／Preview／Production 是否具備；secret 值不輸出。核對 Node/package manager、install/build command、root directory、output、網域、LIFF endpoint。
3. **可重建性**：先依 lockfile npm ci；失敗要記錄。若只為診斷在暫存副本 npm install，必須明示 lockfile 已被暫時補齊，不能報成原 lockfile 通過。修改依賴另依需求授權。
4. **測試**：跑 testing.md 的現有 scripts 與相關功能驗收。確認 preview 使用測試 DB／LINE、通知關閉或受控，不用 Production secret 做未授權寫入。若無隔離設定，先完成建置與部署計畫，不拿正式庫冒充測試。
5. **PR**：review diff 僅含授權檔案；明確 stage，避免 git add .。提交、push feature branch，建立 PR，說明行為、來源、測試與缺口。GitHub 連動可能自動產生 preview，這不是已驗收的正式發佈。
6. **預覽驗收**：讀該 head SHA 的部署／check 結果；只讀頁面／API 仍要確認沒有 mount 自動寫入或通知。執行寫入 E2E 只對隔離測試資源，保留個資最小化證據。
7. **正式發布**：若使用者已授權該次合併／部署且必要驗收完成，依授權執行；否則交付具體 PR、結果與待辦供最後確認。不自行切 Production branch、覆寫 secrets、移動網域或改 LINE endpoint。
8. **回復**：記錄原部署 id／commit、環境與 migration 相容性。程式可回到既有部署；資料庫回復不是 Vercel rollback 的一部分，需獨立設計且不可直接刪表恢復。發現錯誤先停止擴大變更、報告影響，依現有授權處理。

參考 [Vercel GitHub 官方文件](https://vercel.com/docs/git/vercel-for-github) 核對當前 integration 行為。建立 PR 後回傳 URL，不自動 merge；當環境有 PR attachment 工具時附加至當前 chat。

## PR 說明模板

```text
問題與結果：此次改動解決什麼、哪些行為或文件更新。
範圍：變更路徑，來源 commit；是否涉及 API／DB／部署。
驗證：實際執行的指令、退出碼、環境與功能證據。
未驗證／已知缺口：原因、影響、下一個必要檢查。
發布條件：預覽、migration／回復、需確認的正式操作。
```

不要將缺少測試、lint 互動設定或 placeholder DB 的 build 標為全數通過。
