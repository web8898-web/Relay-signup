# UI／UX 與等待動畫

## 基本設計

繁體中文、手機優先、綠白主色（既有 emerald）、圓角卡片、清楚的字級層級與大按鈕。重要資訊在首屏，個人順位最醒目。窄寬 320/375/390/430 px、桌面寬度、長姓名及中文輸入法皆需驗；按鈕可觸控且有可見焦點。不要用 overflow:hidden 掩蓋被截斷的內容。

成功、loading、error、empty、已截止、額滿、未加入、等待、完成要有獨立文案與狀態；讀取失敗不能等同空清單。初始資料未知顯示「正在同步排隊狀態…」，真實成功回傳零才顯示 0 位。API 錯誤保留上一筆成功結果並提供重試；寫入成功才顯示成功動畫。

## 候位版面

由上而下：一個等待小人 →「你的排隊狀態」→ 本人姓名 → 最大字級的第 N 位 → 前面還有 M 位 → 同一後端快照的等待總數與已等待時間 → 修改姓名／取消。所有人數來源見 [queue-system.md](queue-system.md)。

- 等待小人置於正常排版流，狀態文字上方；同頁最多一個，等待狀態恰好一個。非等待畫面可移除，不疊第二個裝飾人物。
- 小人、道具、泡泡不遮文字／按鈕，不跟隨浮動覆蓋內容；預留泡泡空間，超窄畫面仍留邊距。
- 修改只編本人姓名，取消先說明會失去順位，再依使用者操作送出。
- 等待文案用「已等待 X 分鐘／小時」，從後端 created_at 計算並持續更新。
- keyboard 開關、橫直轉向、safe area、固定底部按鈕均不得造成操作被蓋住。

## 保留隨機動畫

基準 QueueMascotReference 的行為：眨眼間隔約 4–12 秒；首次隨機動作約 6–12 秒，其後 20–60 秒；七種動作等機率抽取，播放不重疊：看手機 4.6 秒、左右張望 2.8 秒、打哈欠 3 秒、伸懶腰 3.2 秒、看時間 2.8 秒、喝飲料 3.8 秒、看書 4.2 秒。

泡泡約等待動畫掛載 10 分鐘後才有機會出現，其後每 3–5 分鐘以約 55% 機率顯示約 2 秒；這個時間只管裝飾。文案沿用現有風格，不誤導成真正預估叫號時間。

**不可根據順位指定固定動作。** 現版抵達第 1 位的一次短彈跳可保留，但不取代隨機選擇。動作選擇器不接收 rank，順位變化不能重建一套動作 timer。

React 化時以單一 QueueMascot 元件和 effect/ref 管理所有 schedule／finish／blink／bubble timer；保留 SVG 風格及八種動作，不因重構換造型。隱藏頁面暫停，reduced-motion 降低或停用動態。卸載時清 timer、RAF、listener、observer，無懸掛更新。

## 歷史補丁處理

app/layout.js 同時掛 QueueLiveStatusLabel、QueueMascotReference、QueuePrivateMascotBridge、QueueClosedMascotFix、QueueClosedFinalLayout 及 size/detail/overflow fix。Bridge 用隱藏文字觸發 reference mascot，還會從 DOM 重寫總數；這是既有實作，不是推薦架構。

修某畫面時先列 import、掛載和 selector 的依賴；在授權範圍把 UI 整合到 React state/JSX，再移除對應舊掛載。不要疊新 observer、同頁 render 第二個 mascot 或只把錯誤數字藏起來。文件任務不做此重構。

## 驗收方式

實際量測人物 DOM 數量與 bounding boxes、截圖確認上下順序及遮擋。用可控時鐘與隨機源測每個動作都可選中、同一順位能切換不同動作；再觀察正常時序。測卸載重開、完成／取消、慢網與初載失敗；清理後無重複請求／timer。Chrome 手機模擬只能證明該瀏覽器版面，不能代替 LINE iOS／Android。
