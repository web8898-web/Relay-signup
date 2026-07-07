const AVATAR_COLORS = [
  "bg-rose-400", "bg-amber-400", "bg-emerald-400", "bg-sky-400",
  "bg-violet-400", "bg-orange-400", "bg-teal-400", "bg-fuchsia-400",
];
const CHIP_COLORS = [
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-orange-100 text-orange-800 border-orange-200",
];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
// Common Chinese counting words that mean "people" (as opposed to a
// product/item unit like 份/斤/包). When the organizer's "數量單位" is one
// of these, each signup's quantity is treated as "how many extra people
// they're bringing" and gets added to the headcount used for the 報名人數上限
// check — rather than being purely a product-order count.
const HEADCOUNT_UNITS = ["人", "位", "名", "口"];
export function isHeadcountUnit(unit) {
  return !!unit && HEADCOUNT_UNITS.includes(unit);
}

export function avatarClass(name) {
  return AVATAR_COLORS[hashStr(name || "?") % AVATAR_COLORS.length];
}

// 同一批多人報名的「側標」顏色（實色直條），依 batch_id 決定，
// 同一批必然同色、不同批盡量不同色。用於名單左側標示「這幾位是
// 一起報名的」。
const BATCH_BAR_COLORS = [
  "bg-rose-300", "bg-sky-300", "bg-amber-300", "bg-violet-300",
  "bg-teal-300", "bg-orange-300", "bg-emerald-300", "bg-fuchsia-300",
];
export function batchBarClass(batchId) {
  if (!batchId) return "";
  return BATCH_BAR_COLORS[hashStr(batchId) % BATCH_BAR_COLORS.length];
}

// 給一份「已排序的報名陣列」，回傳每個 index 的同批位置資訊：
// { color, isFirst, isLast } — 只有 batch_id 有值、且該批 ≥2 人時才標記，
// 讓側條在同一批的頭尾收圓角、中間連續。
export function batchInfoFor(signups) {
  const counts = {};
  for (const s of signups) {
    if (s.batch_id) counts[s.batch_id] = (counts[s.batch_id] || 0) + 1;
  }
  return signups.map((s, i) => {
    const bid = s.batch_id;
    if (!bid || counts[bid] < 2) return null;
    const prev = signups[i - 1];
    const next = signups[i + 1];
    return {
      color: batchBarClass(bid),
      isFirst: !prev || prev.batch_id !== bid,
      isLast: !next || next.batch_id !== bid,
    };
  });
}
export function chipClass(cat) {
  return CHIP_COLORS[hashStr(cat || "?") % CHIP_COLORS.length];
}
// Builds the YYYY-MM-DD string from the browser's local date components
// (year/month/date), not toISOString() — toISOString() first converts to
// UTC, which in timezones ahead of UTC (like Taiwan, UTC+8) rolls back to
// "yesterday" during the first few hours of each local day. Using the
// local getFullYear/getMonth/getDate methods keeps this aligned with
// whatever day it actually is on the user's phone.
export function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function taskStatus(task) {
  const t = todayStr();
  if (task.end_date && task.end_date < t) return { label: "已截止", cls: "bg-gray-100 text-gray-500 border-gray-200" };
  if (task.start_date && task.start_date > t) return { label: "尚未開始", cls: "bg-sky-100 text-sky-700 border-sky-200" };
  return { label: "進行中", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
}
export function relTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "剛剛";
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
export function buildShareText(task, url) {
  const lines = [
    `📋 ${task.title}`,
    task.description || null,
    `🗓 ${task.start_date} ~ ${task.end_date}`,
    task.note ? `備註：${task.note}` : null,
    "",
    `👉 點這裡完成報名：${url}`,
  ].filter((l) => l !== null);
  return lines.join("\n");
}
export function lineShareUrl(text) {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}

export function buildFlexMessage(task, url) {
  const bodyContents = [
    { type: "text", text: task.title, weight: "bold", size: "xl", wrap: true, color: "#1f2937" },
  ];
  if (task.description) {
    bodyContents.push({ type: "text", text: task.description, size: "sm", color: "#6b7280", wrap: true, margin: "md" });
  }
  bodyContents.push({
    type: "text",
    text: `🗓 ${task.start_date} ~ ${task.end_date}`,
    size: "sm",
    color: "#9ca3af",
    margin: "lg",
  });
  if (task.categories?.length > 0) {
    bodyContents.push({
      type: "text",
      text: `分類：${task.categories.join("、")}`,
      size: "sm",
      color: "#9ca3af",
      margin: "sm",
      wrap: true,
    });
  }

  return {
    type: "flex",
    altText: `邀請你完成報名：${task.title}`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "horizontal",
        backgroundColor: "#10b981",
        paddingAll: "20px",
        alignItems: "center",
        contents: [
          {
            type: "text",
            text: "接龍報名小助手",
            color: "#ffffff",
            weight: "bold",
            size: "sm",
            align: "start",
            gravity: "center",
            flex: 1,
          },
          {
            type: "image",
            url: "https://relay-signup.vercel.app/app-icon.png",
            size: "40px",
            aspectRatio: "1:1",
            aspectMode: "cover",
            flex: 0,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: bodyContents,
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#10b981",
            cornerRadius: "8px",
            paddingAll: "10px",
            justifyContent: "center",
            alignItems: "center",
            action: { type: "uri", uri: url },
            contents: [
              { type: "text", text: "我要報名", color: "#ffffff", weight: "bold", size: "sm", align: "center" },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#ffffff",
            borderColor: "#10b981",
            borderWidth: "1px",
            cornerRadius: "8px",
            paddingAll: "10px",
            justifyContent: "center",
            alignItems: "center",
            action: { type: "uri", uri: `${url}?mode=view` },
            contents: [
              { type: "text", text: "查看名單", color: "#10b981", weight: "bold", size: "sm", align: "center" },
            ],
          },
        ],
      },
    },
  };
}
