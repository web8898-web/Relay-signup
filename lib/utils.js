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
export function avatarClass(name) {
  return AVATAR_COLORS[hashStr(name || "?") % AVATAR_COLORS.length];
}
export function chipClass(cat) {
  return CHIP_COLORS[hashStr(cat || "?") % CHIP_COLORS.length];
}
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
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
    task.categories?.length ? `分類：${task.categories.join("、")}` : null,
    task.note ? `備註：${task.note}` : null,
    "",
    `👉 點這裡完成報名：${url}`,
  ].filter((l) => l !== null);
  return lines.join("\n");
}
export function lineShareUrl(text) {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}
