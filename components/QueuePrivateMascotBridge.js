"use client";

// 舊版以 position: fixed 將等待小人浮動到卡片上方，
// 在 LINE / iOS 捲動與重新渲染時會產生位置漂移與重複實例。
// 現在改由 QueueTaskDetailClient 在正常文件流中提供唯一插槽，
// 並交由 QueueMascotReference 填入，因此此橋接器保留為空元件，
// 避免既有 layout import 造成部署失敗。
export default function QueuePrivateMascotBridge() {
  return null;
}
