# 客製、維護與 Skill 發現

## 模式與擴充邊界

| 需求 | 沿用 | 必須補充 |
| --- | --- | --- |
| LINE 一般接龍 | normal、分類、數量、短連結 | 參加者隱私、截止／容量、可靠初始化 |
| 活動報名 | normal、名稱／日期／說明 | 是否場次、時分、跨裝置登入；現版沒有獨立 event enum |
| 現場候位 | queue、本人姓名、checked_in | 同源快照、原子唯一／容量、主辦人處理規則 |
| 完整叫號 | 既有候位 UI 風格 | called/serving/skipped 等狀態、原子 next、權限、通知；不可說已完成 |
| 新品牌／客戶 | 綠白手機卡片與交互慣例 | 獨立網域、LINE、DB、品牌素材；清查硬編碼，不沿用正式憑證 |
| UI／小人維護 | 現有 SVG 造型、隨機八動作 | 單一 React 元件、清理與可測時鐘；不得按順位固定動作 |

開始前搜尋 lib/utils、localizedShare、app/layout、manifest、share image、QR、LINE ID 與正式 URL 引用。記錄需參數化的位置，別只換首頁標題。保留 task_mode／marker 舊資料相容；需要轉結構化設定時先規劃 migration，不默默刪 marker。

## Skill 版本維護

1. Git repo 的 `.agents/skills/relay-signup-builder/` 為可審查來源。每次依真實 commit 更新 architecture 的功能證據，不把實作存在提升為真機通過。
2. 共通不變量留 SKILL.md，情境細節留相應 references；避免把單次測試報告塞進每份 SOP。實際交付測試結果放專案 docs。
3. Skill 指示 Codex 在任務中主動執行檢查，不是排程背景任務，也不保證缺少資料／權限時能完成部署。
4. 更新先比對 repo、Dropbox、已安裝版本；使用者本次授權更新才同步。不能以修改時間較新直接覆寫不同內容。

## Dropbox 發現與同步

本使用者指定先查 Dropbox「AI Skill」索引；本機同步根目錄由 AGENTS.md 提供（此環境是 `/Users/wowdennis/Library/CloudStorage/Dropbox/AI Skill`）。其他電腦使用自己的同步路徑或已授權同資料夾連線，不硬編此帳號路徑來執行。

- 可讀時先讀 SKILLS_INDEX.md；索引未涵蓋才搜尋 SKILL.md 的 name/description，只載入匹配內容和必要 references。
- 本機不可讀時使用已授權 Dropbox 工具／瀏覽器；仍不可讀就明說，改用 repo 或已安裝的適用版本，不停下無關工作。
- 授權建立／更新時同步整個 relay-signup-builder 資料夾、SKILLS_INDEX.md 的新增項目及 relay-signup-builder.zip；保留索引其他項目，不把 repo、node_modules、.env、日誌或名單包進 ZIP。
- ZIP 以 relay-signup-builder/ 為根，包含 SKILL.md、agents/openai.yaml、references。比較每個檔案內容／SHA-256，校驗 ZIP 可解壓、相對連結存在，索引記來源 commit 和日期。
- 若 PR 尚未合併，Dropbox 索引明列候選版本、分支／PR；不能讓它看似已批准的正式版本。PR 合併後有維護授權再更新來源狀態。

Dropbox 不是 Codex 固定自動掃描的目錄；自動去查它依賴使用者已建立的 AGENTS.md／持續偏好和存取權。repo 的 `.agents/skills` 是官方支援發現位置。依 [OpenAI 官方 Skill 文件](https://learn.chatgpt.com/docs/build-skills)，可用明確 `$relay-signup-builder` 或相符需求觸發；不需為跨專案查找擅自覆寫全域設定。

## 使用範例

```text
使用 $relay-signup-builder，建立一個 LINE 活動報名系統。
活動限 30 人、繁體中文、主辦人管理名單，先完成隔離測試與 PR。
```

```text
先查 Dropbox AI Skill，使用適合的接龍 Skill。
維護 Relay-signup：修正候位頁首載顯示假 0，保留原隨機小人；不要正式上線。
```

```text
使用 $relay-signup-builder，規劃現場候位及叫下一位功能。
先盤點現在已實作的 checked_in 流程，列出新增狀態、權限、交易及驗收。
```

若使用者只請整理 Skill／文件，交付文件與 PR；若請開發，持續完成授權範圍內的需求、程式、測試與部署準備。不可用這些範例擴張權限。
