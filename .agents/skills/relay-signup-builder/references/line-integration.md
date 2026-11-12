# LINE／LIFF 整合

## 現有流程與證據

- lib/liff.js：單一 initPromise、liff.init、login/logout、getProfile/getAccessToken、isInClient。useLineProfile 管理畫面登入狀態；不是後端授權。
- lib/lineAuth.js：呼叫 LINE token verify，設定 LINE_LOGIN_CHANNEL_ID 時比對 client_id，再用 token 取 profile。task CRUD、banner 使用此 helper；love POST 直接取 profile，沒有同一 channel 驗證。
- 主辦人須登入；一般參加者不必 LINE 登入，靠 localStorage owner token。換瀏覽器、外開、清資料可能失去本人資格，不能說是 LINE 身分登入。
- components/LiffBootstrap 處理 15 秒內 liff-redirect-after-login；根目錄也有同名檔，需查實際 import（layout 使用 components 版本）。layout 有 liff.state 的啟動過場處理。
- 分享頁使用 shareTargetPicker Flex 卡片，fallback line.me/R/share 文字；短連結 /s/[code] 轉 tasks，保留 query。share 圖片／QR 由相關元件處理。
- lib/linePush／smartNotify 只有主辦人 userId 推播邏輯；候位原則不通知。群組 bot、參加者叫號推播、webhook 未實作。signup PUT 的通知 task 查詢未含 task_mode，不能僅憑註解保證所有 queue 編輯路徑都排除通知。

## 建置 SOP

1. 確認有需要 LINE 登入／分享，重用現有 LIFF 整合；不另建一套登入。如果新專案，使用它自己的 LINE Login channel／LIFF ID。
2. 在授權範圍核對 HTTPS Endpoint、LIFF scope、channel 狀態、share target picker 設定及對應環境。console 設定不能由 README 推定。
3. 保留 init 完成後才呼叫 LIFF API 的順序；處理沒有 LIFF、未登入、登入取消、過期 token、init 失敗、API 不可用。新修復可讓 init 失敗後可重試，避免永遠共用 rejected promise。
4. server 驗 token 與 channel，再由 verify 的 profile 決定 creator；不能相信 body 裡的 userId／displayName。
5. 分享連結指向當次正確環境，不含私密資訊。來源 lib/utils.js 有正式網域硬編碼，新建必須盤點並替換；不要把測試分享送到正式 task。
6. shareTargetPicker 需區分完成、取消、例外；現版有延時設定成功 UI 的路徑，不能把開啟分享視窗當傳送成功。
7. LINE 推播是選配能力，需 Messaging API、對象資格、限額及通知紀錄；不把 send API success 直接當對方已收到。只有明確要求發送時才測實際通知。

以 [LINE 官方開發文件](https://developers.line.biz/en/docs/liff/developing-liff-apps/) 核對當時 SDK／瀏覽器行為；版本相關限制先查官方資料，不沿用過期說明。

## 手機返回／重開測試

使用受控測試 task，在 LINE iOS、LINE Android 各記錄裝置、OS、LINE 版本、URL、commit、時間：

1. 聊天連結與 LIFF 入口打開指定 task，query 保留、不跳錯首頁、不重複 init。
2. 主辦人登入後回到原頁；登出／取消／過期可恢復，無無限 redirect／遮罩。
3. 加入後返回聊天室，再重開同 URL；刷新查詢但不再 POST signup。
4. 切背景再回前景、系統返回、BFCache pageshow；重新同步順位，維持本人資格或明示無法恢復。
5. 鍵盤、焦點、scroll、safe area、長姓名，操作鈕無遮擋。
6. 分享取消／不支援／失敗，文字 fallback 和 clipboard failure 文案正確。
7. 圖片／匯出外開能操作且後端仍驗權限；不能為了外開便利取消驗證。

桌面瀏覽器、手機 viewport 模擬與 mock LIFF 都不是 LINE 真機驗證；缺任一平台就該平台標「未驗證」。不要因本機 owner token 不同而讀取他人資料來補身分。
