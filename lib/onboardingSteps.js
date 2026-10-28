export const CREATE_TOUR_STEPS = [
  {
    target: "title",
    title: { zh: "填寫任務標題", en: "Enter a Task Title" },
    text: { zh: "先幫這個任務取個名字，例如「週日爬山健行」「週五團購水果」。標題是唯一必填的欄位。", en: "Give your task a clear name, such as “Sunday Hike” or “Friday Fruit Group Buy.” The title is the only required field." },
  },
  {
    target: "banner",
    title: { zh: "加入活動橫幅圖（選填）", en: "Add an Event Banner (optional)" },
    text: { zh: "想讓接龍更有辨識度，可以點擊展開並上傳圖片。建議尺寸為 1200 × 630，會顯示在接龍頁、轉分享畫面與 LINE 分享卡片；沒有圖片也可以直接略過。", en: "Tap to expand and upload an image. Recommended size: 1200 × 630 pixels. It will appear on the signup page, resharing page and LINE share card. You can skip this step if you do not have an image." },
  },
  {
    target: "description",
    title: { zh: "填寫簡介（選填）", en: "Add a Description (optional)" },
    text: { zh: "簡單說明這個任務在做什麼，例如集合時間地點、團購截止日，報名的人在報名頁就看得到。", en: "Briefly describe the task, such as the meeting time and place or the group-buy deadline. Participants will see this on the signup page." },
  },
  {
    target: "dates",
    title: { zh: "選擇日期", en: "Choose Dates" },
    text: { zh: "設定任務的起始日和到期日，點一下就會打開日期選擇器。", en: "Set the task start and end dates. Tap either date to open the date picker." },
  },
  {
    target: "max",
    title: { zh: "報名人數上限（選填）", en: "Set a Signup Limit (optional)" },
    text: { zh: "設定最多幾人可以報名，額滿後就無法再報名。不填代表不限人數。", en: "Set the maximum number of participants. Once full, no more signups will be accepted. Leave it blank for unlimited signups." },
  },
  {
    target: "note",
    title: { zh: "備註（選填）", en: "Add Notes (optional)" },
    text: { zh: "其他想提醒大家的事項，例如集合地點、付款方式。", en: "Add anything else participants should know, such as the meeting point or payment method." },
  },
  {
    target: "advanced",
    title: { zh: "進階設定（選填）", en: "Advanced Settings (optional)" },
    text: { zh: "需要調整任務模式、分類或統計數量時再展開，沒有需要可以略過。預設會用一般報名。", en: "Open this section to change the task mode, categories or quantity tracking. Otherwise, you can skip it. Standard Signup is used by default." },
  },
  {
    target: "save",
    title: { zh: "儲存任務", en: "Save Task" },
    text: { zh: "全部填寫好後，按這個按鈕，建立任務。完成後會跳到分享頁，再接續，最後一步教學。", en: "When everything is ready, tap this button to create the task. You will then go to the share page for the final tutorial step." },
  },
];

export const SHARE_TOUR_STEPS = [{
  target: "line-share",
  tapTarget: true,
  title: { zh: "最後一步：分享到 LINE", en: "Final step: Share to LINE" },
  text: { zh: "任務建立好了！按這個按鈕，把報名卡片分享到 LINE 群組或好友，大家點報名卡片就能直接報名。", en: "Your task is ready! Tap this button to share the signup card with a LINE group or friend. People can tap the card to sign up directly." },
}];
