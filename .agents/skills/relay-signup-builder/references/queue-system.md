# 候位資料與一致性

## 現有資料路徑

QueueTaskDetailClient → POST /api/queue-status → getSupabaseAdmin → signups。輸入 task_id 與 owner_token；成功回傳 waiting_count、completed_count、queue_number、people_ahead、my_signups（只含自己的 id/task_id/name/checked_in/created_at）。每 5 秒輪詢；成功才 setStatus，失敗保留原值。

後端先查 queueRows，再查 mySignups，並不是同一交易快照。stableSupabaseFetch 在 signups 的 created_at 排序後補 id；主辦人頁目前另行讀名單且主要只在掛載時載入。不能將此現況標示為跨畫面強一致或完整保密。

## 必須維持的不變量

對同一 task、同一成功後端快照 S：

- W = checked_in=false 的有效資料，依 `(created_at ASC, id ASC)` 排序；C = completed 資料。
- waiting_count = |W|；completed_count = |C|。取消目前是刪除，不計入兩者。
- 本人的 active row 存在時，queue_number = index(W, myId)+1，people_ahead = queue_number-1；`1 <= queue_number <= waiting_count`。
- 本人不在 W 時 UI 顯示未加入／已完成，不把 queue_number=0 當「第 0 位」。若快照含本人卻找不到順位，視為資料不一致並重取，不用 0 掩蓋。
- 同一身分在同任務至多一筆 active；完成／取消後重排才新增 created_at；改名不改排序。
- 人數、順位、前方人數一次發布。主辦人、狀態卡、頁首均採相同後端口徑；不可讀 DOM 的數字當真值。
- 查詢不能被資料庫回傳列數上限截斷後仍當全部。多於一頁資料須以資料庫聚合／排名函式或一致快照分頁計算。

## 新建／授權修復方案

1. 在單一 server／DB function 內執行讀取，回傳統計、本人資料、server_now 及可排序的版本／快照標記；欄位是建議擴充，現版未提供。
2. 建立條件唯一限制 `(task_id, participant_identity) WHERE active` 或符合目前 checked_in 模型的等價約束；搭配 request idempotency key。以交易或任務列鎖完成名額檢查與寫入，不依賴 button disabled 或 30 秒冷卻。
3. 後端統一新增／更新／取消規則、開始／截止判斷、模式定義與權限。呼叫端選顯示模式不能改變授權。需保留歷史相容時先盤點 marker／含「排隊」的標題，不擅自全表轉換。
4. 明確規定誰能完成、還原或叫下一位。現版本人 token 可 checkin；若需求是主辦人專屬，必須改 server auth，不能只移除按鈕。
5. 前端維持 data、initialLoading、refreshing、error、lastSuccessAt；首載 data=null。首次失敗顯示重試；已有資料失敗時保留數字並說明暫未同步。
6. 單一 poll controller：序列化請求，或以 AbortController＋遞增 request sequence 防舊回應覆蓋；task/identity 切換與 unmount 取消請求。寫入後使舊讀取失效，再刷新。
7. background 可暫停輪詢；pageshow／visibility 回到前景立即同步。清理所有 timer/listener，不產生多套輪詢。

資料庫變更先在隔離環境驗證；既有站是否改 schema 仍依此次授權。

## 等待時間

起點只用可信的自己的 created_at；如有 server_now 可估算時鐘偏差。顯示 `已等待 0 分鐘`、`已等待 59 分鐘`、`已等待 1 小時`，超過一天仍以小時呈現；依需求可加剩餘分鐘。UI ticker 至少每分鐘更新，不需為時間額外讀整份名單。負值／無效時間顯示未知並重新同步，不能當真資料。

現有 relTime 在小於 1 分鐘用「剛剛」、超過 24 小時用日期，Bridge 只是改文字前綴；需標部分實作。等待小人泡泡的 mount timestamp 不能拿來計算實際候位時間。

## 必跑情境

隔離測試建立三個不同身分 A/B/C，依序加入得到順位 1/2/3；B 改名不改順序；A 完成後 B/C 為 1/2；B 取消後 C 為 1；A 重排在 C 後。每步比較 API、主辦人、所有參加者畫面。

另外送同一身分兩個同時加入請求、搶最後一名、同 created_at 不同 id、超過資料列上限、兩個反序回應、斷線後恢復、頁面返回及重整。正確性以最後資料庫與授權 API 快照為準；沒有原子約束的現版不能據預查宣稱併發通過。
