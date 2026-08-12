"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const LANGUAGE_KEY = "relay_home_language";

const TEXT_MAP = new Map([
  ["接龍報名小助手", "Relay Signup Assistant"],
  ["任務清單", "Task List"], ["建立任務", "Create Task"], ["編輯任務", "Edit Task"],
  ["建立完成", "Task Created"], ["任務建立成功！", "Task created successfully!"], ["已分享成功！", "Shared successfully!"],
  ["你的接龍已建立完成，下一步分享到 LINE 群組。", "Your signup task is ready. Next, share it to a LINE group."],
  ["接下來就等大家開始報名吧。", "Now just wait for everyone to sign up."],
  ["接龍任務", "Signup Task"], ["分享到 LINE", "Share to LINE"], ["開啟中", "Opening"],
  ["收起預覽", "Hide Preview"], ["預覽任務", "Preview Task"], ["複製連結", "Copy Link"], ["回到任務清單", "Back to Task List"],
  ["這是分享到 LINE 群組時，成員會看到的卡片樣式", "This is the card members will see when shared to a LINE group."],
  ["最後一步：分享到 LINE", "Final step: Share to LINE"],
  ["任務建立好了！按這個按鈕，把報名卡片分享到 LINE 群組或好友，大家點報名卡片就能直接報名。", "Your task is ready. Tap this button to share the signup card to a LINE group or friend. People can tap the card to sign up directly."],
  ["完成教學", "Finish Tutorial"], ["分享已送出", "Share sent"], ["卡片分享失敗，改用文字分享", "Card sharing failed. Switching to text sharing."],
  ["已複製分享文字", "Share text copied"], ["複製失敗，請手動選取文字", "Copy failed. Please select and copy the text manually."],
  ["任務標題", "Task Title"], ["簡介", "Description"], ["日期", "Date"], ["備註", "Notes"],
  ["活動橫幅圖", "Event Banner"], ["選填", "Optional"], ["新增圖片", "Add Image"], ["＋ 新增圖片", "+ Add Image"],
  ["讓接龍頁與分享卡更有辨識度", "Make the signup page and share card easier to recognize"],
  ["報名人數上限（選填，不填代表不限人數）", "Signup Limit (optional; leave blank for unlimited)"],
  ["進階設定", "Advanced Settings"], ["任務模式", "Task Mode"], ["一般報名", "Standard Signup"], ["現場排隊", "On-site Queue"],
  ["報名類別", "Signup Categories"], ["類別選擇方式", "Category Selection"], ["單選", "Single"], ["複選", "Multiple"],
  ["報名時是否必選", "Category Requirement"], ["必須選", "Required"], ["可不選", "Optional"],
  ["數量單位", "Quantity Unit"], ["接龍卡片顯示分享圖示", "Show share icon on signup card"],
  ["儲存任務", "Save Task"], ["儲存變更", "Save Changes"], ["本次修改", "Changes"],
  ["目前沒有尚未儲存的變更。", "There are no unsaved changes."],
  ["任務清單", "Task List"], ["搜尋任務...", "Search tasks..."], ["搜尋任務…", "Search tasks…"], ["編輯", "Edit"],
  ["加好友才能收到報名通知", "Add us as a friend to receive signup notifications"],
  ["進行中", "Active"], ["已額滿", "Full"], ["已結束", "Ended"], ["已截止", "Closed"], ["尚未開始", "Not Started"],
  ["分享", "Share"], ["編輯任務", "Edit Task"], ["報名名單", "Signup List"], ["匯出名單", "Export List"],
  ["搜尋姓名、備註或分類", "Search name, note, or category"],
  ["我要報名", "Sign Up"], ["我要排隊", "Join Queue"], ["查看名單", "View List"], ["送出報名", "Submit Signup"], ["加入排隊", "Join Queue"],
  ["你的姓名", "Your name"], ["你的姓名（現場排隊限本人）", "Your name (queue is for yourself only)"], ["幫別人報名（選填）", "Sign up someone else (optional)"],
  ["備註（選填）", "Notes (optional)"], ["請至少選擇一個分類", "Please select at least one category"],
  ["已成功接龍！", "Signup successful!"], ["已加入排隊！", "Joined the queue!"], ["報名成功！", "Signup successful!"],
  ["找不到任務", "Task Not Found"], ["找不到這個任務", "Task not found"], ["這個任務已經額滿，無法再接龍", "This task is full and can no longer accept signups."],
  ["此任務已截止，無法再接龍", "This task is closed and can no longer accept signups."],
  ["目前等待順位", "Current Queue Position"], ["目前等待中", "Currently Waiting"], ["排隊狀態即時同步", "Queue status syncs in real time"],
  ["更改名字", "Change Name"], ["不排了", "Leave Queue"], ["取消", "Cancel"], ["儲存名字", "Save Name"],
  ["確定要取消排隊嗎？", "Leave the queue?"], ["取消後會失去目前順位，若重新加入，將排到最後一位。", "You will lose your current position. If you join again, you will be placed at the end of the queue."],
  ["返回等待", "Keep Waiting"], ["確定取消", "Leave Queue"], ["已完成", "Completed"], ["謝謝您的耐心等待。", "Thank you for your patience."],
  ["播放建立任務教學", "Replay Create Task Tutorial"], ["跳過教學", "Skip Tutorial"], ["上一步", "Back"], ["下一步", "Next"], ["完成教學", "Finish Tutorial"],
  ["確認本次修改", "Review Changes"], ["頁面下方會整理這次異動項目，儲存前先快速核對一次。", "Review the changes summarized below before saving."],
  ["儲存變更", "Save Changes"], ["確認無誤後再儲存。教學不會替你修改或自動送出任何資料。", "Save only after reviewing. The tutorial will never edit or submit data for you."],
]);

const PLACEHOLDER_MAP = new Map([
  ["例如：週日爬山健行、週五團購水果", "e.g. Sunday hike, Friday fruit group buy"],
  ["簡單說明這個任務在做什麼", "Briefly describe this task"], ["例如：20", "e.g. 20"], ["其他提醒事項", "Other reminders"],
  ["自訂類別，例如：早上場", "Custom category, e.g. Morning session"], ["例如：份", "e.g. item"],
  ["搜尋任務...", "Search tasks..."], ["搜尋任務…", "Search tasks…"], ["搜尋姓名、備註或分類", "Search name, note, or category"],
  ["你的姓名", "Your name"], ["幫別人報名（選填）", "Sign up someone else (optional)"], ["備註（選填）", "Notes (optional)"],
]);

function translateDynamic(text) {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (TEXT_MAP.has(trimmed)) return text.replace(trimmed, TEXT_MAP.get(trimmed));
  let match = trimmed.match(/^已截止\s*·\s*(\d+)\s*人已報名$/);
  if (match) return `${match[1]} signed up · Closed`;
  match = trimmed.match(/^進行中\s*·\s*(\d+)\s*人已報名$/);
  if (match) return `${match[1]} signed up · Active`;
  match = trimmed.match(/^(\d+)\s*人已報名$/);
  if (match) return `${match[1]} signed up`;
  match = trimmed.match(/^(\d+)\s*人排隊$/);
  if (match) return `${match[1]} queued`;
  match = trimmed.match(/^目前\s*(\d+)\s*位等待中$/);
  if (match) return `${match[1]} waiting`;
  match = trimmed.match(/^第\s*(\d+)\s*位$/);
  if (match) return `#${match[1]}`;
  match = trimmed.match(/^你前面還有\s*(\d+)\s*位，請稍候。$/);
  if (match) return `${match[1]} ahead of you. Please wait.`;
  match = trimmed.match(/^(\d+)\s*秒後可再次報名$/);
  if (match) return `Sign up again in ${match[1]}s`;
  return text;
}

function translateElement(element) {
  if (!(element instanceof HTMLElement)) return;
  if (element.closest("[data-no-auto-i18n='true']")) return;
  for (const attr of ["placeholder", "aria-label", "title"]) {
    const value = element.getAttribute(attr);
    if (value && PLACEHOLDER_MAP.has(value)) element.setAttribute(attr, PLACEHOLDER_MAP.get(value));
    else if (value && TEXT_MAP.has(value)) element.setAttribute(attr, TEXT_MAP.get(value));
  }
}

function translateTree(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,[data-no-auto-i18n='true']")) return;
    const next = translateDynamic(node.nodeValue || "");
    if (next !== node.nodeValue) node.nodeValue = next;
  });
  if (root instanceof HTMLElement) translateElement(root);
  root.querySelectorAll?.("input,textarea,button,a,[aria-label],[title]").forEach(translateElement);
}

function resolveLanguage(searchParams) {
  const param = searchParams?.get?.("lang");
  if (param === "en" || param === "zh") return param;
  try { return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh"; } catch { return "zh"; }
}

export function getClientLanguage() {
  if (typeof window === "undefined") return "zh";
  const param = new URLSearchParams(window.location.search).get("lang");
  if (param === "en" || param === "zh") return param;
  try { return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh"; } catch { return "zh"; }
}

export default function GlobalLocaleBridge() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const language = resolveLanguage(searchParams);
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch {}
    document.documentElement.lang = language === "en" ? "en" : "zh-Hant";
    document.documentElement.dataset.relayLanguage = language;
    if (language !== "en") return;

    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => translateTree(document.body));
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "aria-label", "title"] });
    const onLocale = () => window.location.reload();
    window.addEventListener("relay-language-change", onLocale);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("relay-language-change", onLocale);
    };
  }, [pathname, searchParams]);

  return null;
}
