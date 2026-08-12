"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export const LANGUAGE_KEY = "relay_home_language";

const PAIRS = [
  ["接龍報名小助手","Relay Signup Assistant"],["任務清單","Task List"],["建立任務","Create Task"],["編輯任務","Edit Task"],["建立完成","Task Created"],
  ["任務建立成功！","Task created successfully!"],["已分享成功！","Shared successfully!"],["你的接龍已建立完成，下一步分享到 LINE 群組。","Your signup task is ready. Next, share it to a LINE group."],["接下來就等大家開始報名吧。","Now just wait for everyone to sign up."],
  ["接龍任務","Signup Task"],["分享到 LINE","Share to LINE"],["開啟中","Opening"],["開啟中…","Opening…"],["收起預覽","Hide Preview"],["預覽任務","Preview Task"],["複製連結","Copy Link"],["回到任務清單","Back to Task List"],
  ["這是分享到 LINE 群組時，成員會看到的卡片樣式","This is the card members will see when shared to a LINE group."],["最後一步：分享到 LINE","Final step: Share to LINE"],["任務建立好了！按這個按鈕，把報名卡片分享到 LINE 群組或好友，大家點報名卡片就能直接報名。","Your task is ready. Tap this button to share the signup card to a LINE group or friend. People can tap the card to sign up directly."],
  ["完成教學","Finish Tutorial"],["略過教學","Skip Tutorial"],["跳過教學","Skip Tutorial"],["上一步","Back"],["下一步","Next"],["看完了","Done"],["分享已送出","Share sent"],["卡片分享失敗，改用文字分享","Card sharing failed. Switching to text sharing."],["已複製分享文字","Share text copied"],["複製失敗，請手動選取文字","Copy failed. Please select and copy the text manually."],
  ["任務標題","Task Title"],["簡介","Description"],["日期","Date"],["備註","Notes"],["活動橫幅圖","Event Banner"],["選填","Optional"],["新增圖片","Add Image"],["＋ 新增圖片","+ Add Image"],["讓接龍頁與分享卡更有辨識度","Make the signup page and share card easier to recognize"],
  ["報名人數上限（選填，不填代表不限人數）","Signup Limit (optional; leave blank for unlimited)"],["進階設定","Advanced Settings"],["需要調整任務模式、分類或統計數量時再設定，沒有需要可以略過。","Only open these settings when you need task modes, categories, or quantity tracking."],
  ["任務模式","Task Mode"],["預設一般報名即可；現場排隊適合需要邊報名邊處理的情境。","Standard Signup works for most cases. On-site Queue is for situations handled while people wait."],["一般報名","Standard Signup"],["適合活動、聚餐、課程，報名結束後再確認名單。","For events, gatherings, or classes where you review the list after signup."],["適合事先收集報名名單，活動開始前即可確認人數。","Collect signup lists in advance and confirm attendance before the event starts."],["現場排隊","On-site Queue"],["適合候位、推拿、現場服務，可邊報名邊處理。","For waiting lists and on-site services handled in real time."],["適合現場候位與排隊，客人加入後可依序叫號服務。","For on-site waiting and queues where guests are served in order."],
  ["現場排隊已簡化表單","On-site Queue uses a simplified form"],["現場排隊只收姓名，不使用報名類別與數量單位，避免排隊流程變複雜。","On-site Queue only collects names and does not use categories or quantity units."],
  ["不知道怎麼選？","Not sure which to choose?"],["📖 不知道怎麼選？","📖 Not sure which to choose?"],["展開閱讀","Read More"],["收起","Collapse"],["統計名單、活動報名、團購與課程","Lists, event signups, group buys, and classes"],["即時順位、候位與現場服務","Live queue positions and on-site services"],["▶ 查看教學","▶ View Tutorial"],["💡 需要「統計名單」選一般報名；需要「即時順位」選現場排隊。","💡 Choose Standard Signup for lists; choose On-site Queue for live positions."],
  ["一般報名教學","Standard Signup Tutorial"],["適合聚餐、旅遊、課程、團購與活動報名","For gatherings, trips, classes, group buys, and event signups"],["填寫標題、日期、簡介與需要的分類。","Enter the title, dates, description, and any categories you need."],["建立完成後，把任務卡片或連結分享到群組。","After creating it, share the task card or link to your group."],["參加者完成報名","Participants Sign Up"],["參加者輸入姓名與資料，不需要登入即可報名。","Participants enter their name and details; no login is required."],["主辦人管理名單","Organizer Manages the List"],["查看、統計、下載名單，活動結束後再完成任務。","Review, summarize, and download the list, then complete the task after the event."],
  ["現場排隊教學","On-site Queue Tutorial"],["適合候位、按摩、美容、美甲與現場服務","For waiting lists, massage, beauty, nail, and on-site services"],["建立排隊任務","Create Queue Task"],["填寫標題、排隊期間、簡介與現場備註。","Enter the title, queue period, description, and on-site notes."],["分享連結或 QR Code","Share Link or QR Code"],["讓現場客人掃描後直接加入排隊。","Let guests scan the code and join the queue directly."],["客人查看順位","Guests View Position"],["加入後會看到目前順位與前方等待人數。","After joining, guests can see their current position and how many people are ahead."],["主辦人依序完成","Organizer Serves in Order"],["點擊完成目前第一位，後方名單會自動往前遞補。","Complete the first person in line and everyone behind will move forward automatically."],
  ["報名類別","Signup Categories"],["讓報名者選擇項目，例如：帶小孩、帶朋友、素食、葷食。","Let participants choose options such as bringing children, bringing friends, vegetarian, or non-vegetarian."],["類別選擇方式","Category Selection"],["單選","Single"],["複選","Multiple"],["報名時是否必選","Category Requirement"],["必須選","Required"],["可不選","Optional"],
  ["每位報名者只能選擇一個類別，而且必須選擇。","Each participant must select exactly one category."],["每位報名者最多選擇一個類別，也可以不選。","Each participant may select at most one category, or none."],["每位報名者可以選擇多個類別，至少要選一個。","Each participant may select multiple categories and must select at least one."],["每位報名者可以選擇多個類別，也可以不選。","Each participant may select multiple categories, or none."],
  ["新增","Add"],["輸入文字後，按「新增」或按 Enter 加入一個分類","Type a category, then tap Add or press Enter."],["數量單位","Quantity Unit"],["如果一個人可以報名多份才需要填，例如：盒、份、張、包、人、個。","Set this only when one person can register multiple quantities, such as items, boxes, or people."],["接龍卡片顯示分享圖示","Show share icon on signup card"],["方便報名者將同一個接龍轉傳到其他群組。","Lets participants forward the same signup to other groups."],
  ["儲存任務","Save Task"],["儲存變更","Save Changes"],["本次修改","Changes"],["目前沒有尚未儲存的變更。","There are no unsaved changes."],["分類（自訂，選填）","Categories (custom, optional)"],["數量單位（選填，例如：份、斤、個——填了報名的人才會看到數量欄位）","Quantity Unit (optional; participants see quantity controls only when set)"],
  ["起始日期不能晚於結束日期","Start date cannot be later than end date"],["結束日期不能早於起始日期","End date cannot be earlier than start date"],["查看編輯教學","View edit tutorial"],["請先使用 LINE 登入。","Please sign in with LINE."],["使用 LINE 登入","Sign in with LINE"],["回到首頁","Back to Home"],["你不是這個任務的建立者，無法編輯。","You are not the creator of this task and cannot edit it."],["更新失敗","Update failed"],
  ["搜尋任務...","Search tasks..."],["搜尋任務…","Search tasks…"],["編輯","Edit"],["完成","Done"],["刪除","Delete"],["移除","Remove"],["取消","Cancel"],["加好友才能收到報名通知","Add us as a friend to receive signup notifications"],["加入官方帳號好友，有人報名時 LINE 就會直接通知你。可以在每個任務旁的鈴鐺圖示，個別開關要不要收通知。","Add our official account to receive LINE notifications when someone signs up. Use the bell beside each task to control notifications."],["加官方帳號好友","Add Official Account"],
  ["進行中","Active"],["已額滿","Full"],["已結束","Ended"],["已截止","Closed"],["尚未開始","Not Started"],["分享","Share"],["報名名單","Signup List"],["匯出名單","Export List"],["搜尋姓名、備註或分類","Search name, note, or category"],["全部","All"],["全選","Select All"],["取消全選","Deselect All"],["還沒有任務","No tasks yet"],["點擊上方「建立任務」開始建立第一個接龍吧。","Tap “Create Task” above to create your first signup."],["找不到符合的任務","No matching tasks"],["換個關鍵字試試看","Try a different keyword"],
  ["我要報名","Sign Up"],["我要排隊","Join Queue"],["查看名單","View List"],["送出報名","Submit Signup"],["加入排隊","Join Queue"],["你的姓名","Your name"],["你的姓名（現場排隊限本人）","Your name (queue is for yourself only)"],["幫別人報名（選填）","Sign up someone else (optional)"],["備註（選填）","Notes (optional)"],["請至少選擇一個分類","Please select at least one category"],["已成功接龍！","Signup successful!"],["已加入排隊！","Joined the queue!"],["報名成功！","Signup successful!"],
  ["找不到任務","Task Not Found"],["找不到這個任務","Task not found"],["找不到這個接龍","Signup not found"],["載入接龍中…","Loading signup…"],["這個任務可能已經被移除，","This task may have been removed,"],["或連結已經失效。","or the link may have expired."],["這個任務已經額滿，無法再接龍","This task is full and can no longer accept signups."],["此任務已截止，無法再接龍","This task is closed and can no longer accept signups."],
  ["目前等待順位","Current Queue Position"],["目前等待中","Currently Waiting"],["排隊狀態即時同步","Queue status syncs in real time"],["更改名字","Change Name"],["不排了","Leave Queue"],["儲存名字","Save Name"],["確定要取消排隊嗎？","Leave the queue?"],["取消後會失去目前順位，若重新加入，將排到最後一位。","You will lose your current position. If you join again, you will be placed at the end of the queue."],["返回等待","Keep Waiting"],["確定取消","Leave Queue"],["已完成","Completed"],["謝謝您的耐心等待。","Thank you for your patience."],
  ["確認本次修改","Review Changes"],["頁面下方會整理這次異動項目，儲存前先快速核對一次。","Review the changes summarized below before saving."],["確認無誤後再儲存。教學不會替你修改或自動送出任何資料。","Save only after reviewing. The tutorial will never edit or submit data for you."],
  ["準備分享這個接龍","Ready to share this signup"],["將這個接龍分享到其他 LINE 群組或好友。","Share this signup with another LINE group or friend."],["分享到其他群組","Share to Another Group"],["分享後，大家會看到同一份接龍內容","Everyone will see the same signup after you share it."],["把接龍，變簡單","Relay signups made simple"],
  ["帶小孩","Bring Kids"],["帶朋友","Bring Friends"],["素食","Vegetarian"],["葷食","Non-vegetarian"],["盒","Box"],["份","Item"],["張","Piece"],["包","Pack"],["人","Person"],["個","Unit"],
];
const TEXT_MAP = new Map(PAIRS);
const PLACEHOLDER_MAP = new Map([
  ["例如：週日爬山健行、週五團購水果","e.g. Sunday hike, Friday fruit group buy"],["簡單說明這個任務在做什麼","Briefly describe this task"],["例如：20","e.g. 20"],["其他提醒事項","Other reminders"],["自訂類別，例如：早上場","Custom category, e.g. Morning session"],["例如：份","e.g. item"],["例如：職位分類、組別分類、產品分類","e.g. role, group, or product category"],["搜尋任務...","Search tasks..."],["搜尋任務…","Search tasks…"],["搜尋姓名、備註或分類","Search name, note, or category"],["你的姓名","Your name"],["幫別人報名（選填）","Sign up someone else (optional)"],["備註（選填）","Notes (optional)"],
]);

function formatEnglishDate(y,m,d,weekday) {
  const names = {日:"Sun",一:"Mon",二:"Tue",三:"Wed",四:"Thu",五:"Fri",六:"Sat"};
  const date = new Date(Date.UTC(Number(y), Number(m)-1, Number(d)));
  const base = new Intl.DateTimeFormat("en-US", { year:"numeric", month:"short", day:"numeric", timeZone:"UTC" }).format(date);
  return weekday ? `${base} (${names[weekday] || weekday})` : base;
}

function translateDynamic(text) {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (TEXT_MAP.has(trimmed)) return text.replace(trimmed, TEXT_MAP.get(trimmed));
  let m = trimmed.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*\(([日一二三四五六])\))?$/); if (m) return formatEnglishDate(m[1],m[2],m[3],m[4]);
  m = trimmed.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日\s*\(([日一二三四五六])\)\s*~\s*(\d{1,2})月(\d{1,2})日\s*\(([日一二三四五六])\)$/); if (m) return `${formatEnglishDate(m[1],m[2],m[3],m[4])} ~ ${formatEnglishDate(m[1],m[5],m[6],m[7])}`;
  m = trimmed.match(/^查看(.+)教學$/); if (m) return `View ${m[1]} Tutorial`;
  m = trimmed.match(/^已截止\s*·\s*(\d+)\s*人已報名$/); if (m) return `${m[1]} signed up · Closed`;
  m = trimmed.match(/^進行中\s*·\s*(\d+)\s*人已報名$/); if (m) return `${m[1]} signed up · Active`;
  m = trimmed.match(/^(\d+)\s*人已報名$/); if (m) return `${m[1]} signed up`;
  m = trimmed.match(/^(\d+)\s*人報名$/); if (m) return `${m[1]} signed up`;
  m = trimmed.match(/^(\d+)\s*人排隊$/); if (m) return `${m[1]} queued`;
  m = trimmed.match(/^目前\s*(\d+)\s*位等待中$/); if (m) return `${m[1]} waiting`;
  m = trimmed.match(/^第\s*(\d+)\s*位$/); if (m) return `#${m[1]}`;
  m = trimmed.match(/^你前面還有\s*(\d+)\s*位，請稍候。$/); if (m) return `${m[1]} ahead of you. Please wait.`;
  m = trimmed.match(/^(\d+)\s*秒後可再次報名$/); if (m) return `Sign up again in ${m[1]}s`;
  m = trimmed.match(/^已選取\s*(\d+)\s*個任務$/); if (m) return `${m[1]} selected`;
  return text;
}

function translateElement(element) {
  if (!(element instanceof HTMLElement) || element.closest("[data-no-auto-i18n='true']")) return;
  for (const attr of ["placeholder","aria-label","title"]) {
    const value = element.getAttribute(attr);
    if (value && PLACEHOLDER_MAP.has(value)) element.setAttribute(attr, PLACEHOLDER_MAP.get(value));
    else if (value && TEXT_MAP.has(value)) element.setAttribute(attr, TEXT_MAP.get(value));
  }
}
function translateTree(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
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
export function getClientLanguage() {
  if (typeof window === "undefined") return "zh";
  const param = new URLSearchParams(window.location.search).get("lang");
  if (param === "en" || param === "zh") return param;
  try { return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh"; } catch { return "zh"; }
}
export default function GlobalLocaleBridge() {
  const pathname = usePathname();
  useEffect(() => {
    const onLanguageChange = (event) => {
      const next = event?.detail?.language === "en" ? "en" : "zh";
      try { localStorage.setItem(LANGUAGE_KEY, next); } catch {}
      window.location.reload();
    };
    window.addEventListener("relay-language-change", onLanguageChange);

    const language = getClientLanguage();
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch {}
    document.documentElement.lang = language === "en" ? "en" : "zh-Hant";
    document.documentElement.dataset.relayLanguage = language;

    let observer = null;
    let frame = 0;
    if (language === "en") {
      const apply = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => translateTree(document.body)); };
      apply();
      observer = new MutationObserver(apply);
      observer.observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:["placeholder","aria-label","title"] });
    }

    return () => {
      window.removeEventListener("relay-language-change", onLanguageChange);
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname]);
  return null;
}
