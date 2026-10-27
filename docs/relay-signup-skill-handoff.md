# relay-signup-builder 交付與驗收紀錄

日期：2026-10-28（Asia/Taipei）。本次只新增 Skill 與本文件，不改動網站程式、API、SQL、依賴或部署設定，不執行正式資料寫入／推播／合併。

## 來源與分支

- Repository：[web8898-web/Relay-signup](https://github.com/web8898-web/Relay-signup)。
- 分析及測試基準：`686054c70a60c351394fad66171df8ccc7d4005b`；tree `c1db890f98be6f61f0ddaffde8676d78b2d7b8ee`，GitHub API 與本機 Git 相符。
- 提交分支：`codex/relay-signup-builder-docs`。先建立獨立分支；工作中原目錄出現其他變更，後改用固定在上述 commit 的隔離 checkout。那些網站修改未審核、未納入本 PR；本文件不對它們作狀態宣告。
- Skill 原始碼位置：`.agents/skills/relay-signup-builder/`。它是此次 PR 的待審查版本，非已合併產品版本。

## 全部新增檔案（13 個）

| 檔案 | 用途 |
| --- | --- |
| [.agents/skills/relay-signup-builder/SKILL.md](../.agents/skills/relay-signup-builder/SKILL.md) | 觸發、流程、路由、安全、驗收 |
| [.agents/skills/relay-signup-builder/agents/openai.yaml](../.agents/skills/relay-signup-builder/agents/openai.yaml) | Codex 顯示名稱；維持預設自動選用 |
| [references/architecture.md](../.agents/skills/relay-signup-builder/references/architecture.md) | 技術、API、逐項功能狀態與程式證據 |
| [references/workflows.md](../.agents/skills/relay-signup-builder/references/workflows.md) | 建立、報名、候位 SOP |
| [references/ui-design.md](../.agents/skills/relay-signup-builder/references/ui-design.md) | 手機 UI、唯一小人與隨機動畫 |
| [references/queue-system.md](../.agents/skills/relay-signup-builder/references/queue-system.md) | 同源統計、順位、原子性、等待時間 |
| [references/line-integration.md](../.agents/skills/relay-signup-builder/references/line-integration.md) | LIFF、分享、返回、真機測試 |
| [references/database.md](../.agents/skills/relay-signup-builder/references/database.md) | 資料表、遷移、權限、環境變數名稱 |
| [references/testing.md](../.agents/skills/relay-signup-builder/references/testing.md) | 自動執行現有檢查、功能驗收矩陣 |
| [references/deployment.md](../.agents/skills/relay-signup-builder/references/deployment.md) | GitHub／Vercel、PR、隔離預覽、發布及回復 |
| [references/troubleshooting.md](../.agents/skills/relay-signup-builder/references/troubleshooting.md) | 症狀、證據、修復與回歸 |
| [references/customization.md](../.agents/skills/relay-signup-builder/references/customization.md) | 客製、版本維護、Dropbox 查找與同步 |
| [docs/relay-signup-skill-handoff.md](relay-signup-skill-handoff.md) | 本次交付與測試證據 |

沒有複製產品原始碼、secrets、客戶名單或 node_modules 到 Skill。採指令型 Skill；它指示 Codex 依實際專案 scripts 執行檢查，不自帶未經驗證的產品模板。

## 使用與 Dropbox

```text
使用 $relay-signup-builder，建立 LINE 活動報名系統，限 30 人。
先完成需求確認、隔離測試與部署準備，提交 PR 供確認。
```

也可自然說「先查 Dropbox AI Skill，修正接龍候位頁的錯誤人數，保留隨機等待小人」。目前持續偏好已要求先查 Dropbox；索引新增 relay-signup-builder、同名資料夾及 ZIP。路徑由使用者 AGENTS.md 提供，不在執行流程中硬編不同電腦的帳號。

Dropbox 保存可讀候選副本；索引註記本次分支、來源 commit／PR。Dropbox 資料夾本身不是 Codex 固定掃描位置，自動查找依賴既有偏好及存取權；repo 的 .agents/skills 可直接被發現。格式依 [OpenAI 官方 Skill 文件](https://learn.chatgpt.com/docs/build-skills)，初始化及結構驗證使用內建 skill-creator 工具。

## 已確認功能與缺口

已找到實作：Next/React/Tailwind、LINE LIFF 主辦人登入、任務 CRUD、分類／數量／代報、報名修改取消、候位聚合 API、5 秒輪詢、主辦人 checked_in、短網址／Flex 分享、八種隨機等待動作。這些是程式確認，未冒充完整實機驗收。

重要缺口：公開讀取 signups 的 RLS 範例與 owner_token、匯出缺後端授權、容量／去重非原子、API 期限檢查不足、候位初載假零與多 observer 補丁、notification_log DDL／cron 設定缺件、lockfile 不一致。完整叫號、多櫃台、跨裝置參加者身分與自動群組推播尚未實作。正式 DB policies、Vercel／LINE console 的現況需要確認。完整逐項狀態見 architecture.md。

## 指令與結構檢查結果

在隔離的 Git 基準副本執行，沒有載入 .env 或正式憑證。環境 macOS arm64，Node v26.5.0、npm 11.17.0；repo 沒有 Node pin，此版本不是已核對的 Vercel runtime。

| 檢查 | 結果 | 證據與限制 |
| --- | --- | --- |
| 官方 init_skill.py | 通過 | 建立 SKILL.md、agents/openai.yaml、references |
| 官方 quick_validate.py | 通過，exit 0 | `Skill is valid!`；PyYAML 只裝暫存目錄 |
| 文件／metadata 驗證 | 通過 | 12 個 Skill 檔、24 個內部引用存在；YAML 可解析、description 長度、自動選用、無 scaffold placeholder |
| npm ci | 失敗，exit 1 | 網路授權後仍 EUSAGE；lockfile 缺 qrcode@1.5.4 及相依 |
| 隔離 npm install --ignore-scripts --no-audit --no-fund | 通過，exit 0 | 僅暫存副本補裝 217 packages，未修改 repo lockfile；Next 14.2.35、React 18.3.1、qrcode 1.5.4 |
| CI=1 NEXT_TELEMETRY_DISABLED=1 npm run lint（stdin 關閉） | 未驗證，exit 1 | 缺 ESLint config，進入 Strict/Base 初始化提示；未選設定 |
| npm run typecheck | 未驗證，exit 1 | Missing script: typecheck |
| npm test | 未驗證，exit 1 | Missing script: test |
| CI=1 NEXT_TELEMETRY_DISABLED=1 npm run build | 通過，exit 0（隔離補裝後） | Next compiled successfully，13 個靜態頁面產生；Supabase env 未設定警告，僅證明此副本建置 |
| Skill 情境走讀 | 本次 agent 人工完成 | normal 活動、候位假零、文件限定、一般 LINE bot 排除；不是獨立 subagent／模型評測 |

為遵守文件範圍，沒有新增或修復產品 lint/typecheck/test、lockfile、API、DB 或部署設定。build 內的 lint/type validity 進度文字不能替代缺少的獨立檢查。

## 使用者指定的操作驗收

本次沒有可用且已核對的隔離 Supabase／LINE 測試環境，也沒有 iOS/Android LINE 真機；以下均未宣稱通過。沒有以 mock 或正式客戶資料替代。

| 項目 | 結果／下一步 |
| --- | --- |
| 報名正常 | 未驗證；隔離 DB 測新增、分類、人數／份數及代報 |
| 取消與修改正常 | 未驗證；隔離 DB 測本人／他人權限及改名保持順位 |
| 人數及順位一致 | 未驗證；三個參加者＋主辦人，多快照與併發測試 |
| Loading 動畫正常 | 未驗證；慢網／首載錯誤／重試的實際 DOM 及畫面 |
| 等待時間更新正常 | 未驗證；分鐘／小時邊界、超過 24h、前背景切換 |
| 等待小人只有一個 | 未驗證；狀態切換與返回後 DOM 計數及遮擋檢查 |
| 隨機動畫正常 | 未驗證；原始碼確認 random selector，仍須播放、可控時鐘與隨機源驗收 |
| 手機畫面不溢出 | 未驗證；320/375/390/430 px、長姓名、鍵盤及橫直向 |
| LINE WebView 正常 | 未驗證；LINE iOS、Android 各自登入／分享／返回／重開 |
| 重新整理不產生重複資料 | 未驗證；重試／重整／平行 POST，對帳 DB 唯一性 |

後續已授權開發可直接依 testing.md 執行；不能把上述未驗證改寫為已完成。
