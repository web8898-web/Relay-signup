# 接龍報名（正式版）

這是「接龍報名」小工具的正式網站版本：真正的 LINE 登入、真正的資料庫、真正可以分享出去、別人點了就能直接開啟指定任務的連結。

技術：Next.js（App Router）＋ Tailwind CSS ＋ Supabase（資料庫）＋ LINE LIFF（登入）。

---

## 你需要準備的東西

1. 一個 **Supabase** 帳號（免費方案就夠用）→ https://supabase.com
2. 一個 **LINE Developers** 帳號（用你自己的 LINE 帳號登入即可）→ https://developers.line.biz/console/
3. 一個 **Vercel** 帳號，用來把網站架上網（免費方案就夠用）→ https://vercel.com
4. Node.js 18 以上（本機測試用）

---

## 第一步：建立 Supabase 專案（資料庫）

1. 到 https://supabase.com 註冊/登入，點「New project」建立一個新專案，資料庫密碼記得存起來。
2. 專案建立完成後，左側選單找到 **SQL Editor**，點「New query」。
3. 把這個專案裡 `sql/schema.sql` 的內容整段貼進去，按「Run」。這會建立 `tasks`（任務）跟 `signups`（報名）兩張表。
4. 左側選單點 **Project Settings → API**，你會看到：
   - **Project URL** → 等等填到 `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → 填到 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key（要點「Reveal」才看得到，這組**絕對不能外流**）→ 填到 `SUPABASE_SERVICE_ROLE_KEY`

---

## 第二步：建立 LINE Login / LIFF（登入功能）

1. 到 https://developers.line.biz/console/ 登入。
2. 建立一個 **Provider**（如果還沒有的話，名稱隨意，例如公司名稱）。
3. 在這個 Provider 底下，建立一個 **Channel**，類型選 **LINE Login**。
4. 進到剛建立的 Channel：
   - 「Basic settings」分頁可以看到 **Channel ID**，先記下來（等等填 `LINE_LOGIN_CHANNEL_ID`）。
   - 切到「LIFF」分頁，點「Add」新增一個 LIFF App：
     - **Size**：選 `Full`
     - **Endpoint URL**：先隨便填 `https://example.com`，等網站部署完成、拿到正式網址後**再回來改成你的正式網址**（例如 `https://your-app.vercel.app`）
     - **Scope**：勾選 `profile`
   - 新增完成後會拿到一組 **LIFF ID**（格式像 `1234567890-abcdefgh`），填到 `NEXT_PUBLIC_LIFF_ID`。

> LIFF（LINE Front-end Framework）就是 LINE 官方提供、讓網頁可以直接使用「LINE 登入」跟讀取使用者 LINE 個人資料的機制，不需要你自己接 OAuth 流程。

---

## 第三步：設定環境變數

把 `.env.local.example` 複製一份改名成 `.env.local`，填入上面兩步拿到的所有值：

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_LIFF_ID=...
LINE_LOGIN_CHANNEL_ID=...
```

---

## 第四步：本機測試

```bash
npm install
npm run dev
```

打開 http://localhost:3000。

⚠️ 注意：LIFF 登入需要 HTTPS 網址才能正常運作，本機 `localhost` 通常沒辦法完整測試「LINE 登入」這個動作（會被導向 LINE 但跳轉不回來）。「任務清單」「查看報名名單」等不需要登入的功能可以在本機正常測試；「建立任務」「我的任務」這種需要登入的功能，建議部署到 Vercel 拿到正式 HTTPS 網址後再測試。

---

## 第五步：部署到 Vercel

1. 把這個資料夾推到你自己的 GitHub repo。
2. 到 https://vercel.com，選「Add New → Project」，選擇剛剛的 repo 匯入。
3. 在 Vercel 專案設定的 **Environment Variables**，把 `.env.local` 裡的五個變數都加進去（跟本機一樣的值）。
4. 按下「Deploy」，等建置完成後會拿到一個正式網址，例如 `https://relay-signup.vercel.app`。
5. **回到 LINE Developers Console**，把剛剛那個 LIFF App 的 **Endpoint URL** 改成這個正式網址，儲存。
6. 之後如果綁定自己的網域，同樣要回來更新這個 Endpoint URL。

到這裡，「建立任務」「LINE 登入」「分享到 LINE 群組」「點連結直接開啟指定任務」就全部是真的可以動作的功能了。

---

## 這個版本跟聊天室裡的雛形差在哪

| | 雛形（Artifact） | 正式版（這個專案） |
|---|---|---|
| 登入 | 模擬（只是輸入名字） | 真正的 LINE 登入（LIFF） |
| 資料儲存 | Claude 對話內建儲存 | 你自己的 Supabase 資料庫 |
| 分享連結 | 沒有真的連結 | 有專屬網址，點了直接開啟該任務 |
| 網址 | 只能在 claude.ai 裡開啟 | 獨立網站，任何人都能開啟 |
| 資料安全 | 無 | 建立/編輯/刪除任務需驗證 LINE 身分；參加者編輯/刪除自己填的資料靠瀏覽器本機的識別碼 |

---

## 之後可以再加強的部分

- **自動推播到群組**：現在是主辦人手動按「分享到 LINE」跳出分享視窗；如果想要「建立任務後自動貼進指定群組」，需要另外申請 **Messaging API channel**，把機器人加入群組，並改用 Push API 主動推送訊息（跟 LINE Login 是不同的 channel 類型）。
- **參加者資料安全性**：目前參加者編輯/刪除自己填寫的資料，是靠瀏覽器 localStorage 存的一組隨機碼比對，換瀏覽器或清除資料就會失去編輯權限，跟大部分「接龍」工具是一樣的信任等級。如果需要更嚴謹，可以要求參加者也用 LINE 登入。
- **自訂網域**：Vercel 專案設定裡可以綁定你自己買的網域。
