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

const QUEUE_MODE_MARKER = "__relay_queue_mode__";
const CATEGORY_SINGLE_MARKER = "__relay_category_single__";
const CATEGORY_MULTIPLE_MARKER = "__relay_category_multiple__";
const SHARE_ENABLED_MARKER = "__relay_share_enabled__";
const SHARE_DISABLED_MARKER = "__relay_share_disabled__";
const CONFIG_MARKERS = new Set([
  QUEUE_MODE_MARKER,
  CATEGORY_SINGLE_MARKER,
  CATEGORY_MULTIPLE_MARKER,
  SHARE_ENABLED_MARKER,
  SHARE_DISABLED_MARKER,
]);

export function getVisibleCategories(categories) {
  return Array.isArray(categories)
    ? categories.filter((category) => !CONFIG_MARKERS.has(String(category).trim()))
    : [];
}

export function getVisibleTaskNote(value = "") {
  return String(value)
    .split(/\r?\n/)
    .filter((line) => !CONFIG_MARKERS.has(line.trim()))
    .join("\n")
    .trim();
}

export function getCategorySelectionMode(task) {
  const categories = Array.isArray(task?.categories) ? task.categories : [];
  if (categories.includes(CATEGORY_SINGLE_MARKER)) return "single";
  if (categories.includes(CATEGORY_MULTIPLE_MARKER)) return "multiple";
  return "multiple";
}

export function shouldShowShareButton(task) {
  const categories = Array.isArray(task?.categories) ? task.categories : [];
  const noteLines = String(task?.note || "").split(/\r?\n/).map((line) => line.trim());
  if (categories.includes(SHARE_ENABLED_MARKER) || noteLines.includes(SHARE_ENABLED_MARKER)) return true;
  if (categories.includes(SHARE_DISABLED_MARKER) || noteLines.includes(SHARE_DISABLED_MARKER)) return false;
  return false;
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function isQueueTask(task) {
  return !!task && (
    task.task_mode === "queue" ||
    task.queue_mode === true ||
    task.categories?.includes?.(QUEUE_MODE_MARKER) ||
    String(task.title || "").includes("排隊")
  );
}

const HEADCOUNT_UNITS = ["人", "位", "名", "口"];
export function isHeadcountUnit(unit) {
  return !!unit && HEADCOUNT_UNITS.includes(unit);
}

export function avatarClass(name) {
  return AVATAR_COLORS[hashStr(name || "?") % AVATAR_COLORS.length];
}

const BATCH_BAR_COLORS = [
  "bg-rose-300", "bg-sky-300", "bg-amber-300", "bg-violet-300",
  "bg-teal-300", "bg-orange-300", "bg-emerald-300", "bg-fuchsia-300",
];
export function batchBarClass(batchId) {
  if (!batchId) return "";
  return BATCH_BAR_COLORS[hashStr(batchId) % BATCH_BAR_COLORS.length];
}

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
  const queue = isQueueTask(task);
  const visibleNote = getVisibleTaskNote(task.note);
  const lines = [
    `📋 ${task.title}`,
    "",
    task.description || null,
    `🗓 ${task.start_date} ~ ${task.end_date}`,
    visibleNote ? `備註：${visibleNote}` : null,
    "",
    queue ? `👉 點這裡加入排隊：${url}` : `👉 點這裡完成報名：${url}`,
  ].filter((l) => l !== null);
  return lines.join("\n");
}
export function lineShareUrl(text) {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}

export function buildFlexMessage(task, url) {
  const queue = isQueueTask(task);
  const visibleCategories = getVisibleCategories(task.categories);
  const visibleNote = getVisibleTaskNote(task.note);
  const titleContents = [
    { type: "text", text: task.title, weight: "bold", size: "xl", wrap: true, color: "#1f2937", flex: 1 },
  ];

  if (shouldShowShareButton(task) && task?.id) {
    titleContents.push({
      type: "image",
      url: "https://relay-signup.vercel.app/share-icon.png",
      size: "22px",
      aspectRatio: "1:1",
      aspectMode: "fit",
      flex: 0,
      action: {
        type: "uri",
        label: "分享接龍",
        uri: `https://relay-signup.vercel.app/share/${task.id}`,
      },
    });
  }

  const bodyContents = [
    {
      type: "box",
      layout: "horizontal",
      alignItems: "center",
      spacing: "md",
      contents: titleContents,
    },
  ];
  if (task.description) {
    bodyContents.push({ type: "text", text: task.description, size: "sm", color: "#6b7280", wrap: true, margin: "lg" });
  }
  bodyContents.push({
    type: "text",
    text: `🗓 ${task.start_date} ~ ${task.end_date}`,
    size: "sm",
    color: "#9ca3af",
    margin: task.description ? "lg" : "xl",
  });
  if (visibleNote) {
    bodyContents.push({
      type: "text",
      text: `備註：${visibleNote}`,
      size: "sm",
      color: "#6b7280",
      margin: "sm",
      wrap: true,
    });
  }
  if (visibleCategories.length > 0) {
    bodyContents.push({
      type: "text",
      text: `分類：${visibleCategories.join("、")}`,
      size: "sm",
      color: "#9ca3af",
      margin: "sm",
      wrap: true,
    });
  }

  const footerContents = [
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
        { type: "text", text: queue ? "我要排隊" : "我要報名", color: "#ffffff", weight: "bold", size: "sm", align: "center" },
      ],
    },
  ];

  if (!queue) {
    footerContents.push({
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
    });
  }

  return {
    type: "flex",
    altText: queue ? `邀請你加入排隊：${task.title}` : `邀請你完成報名：${task.title}`,
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
        contents: footerContents,
      },
    },
  };
}
