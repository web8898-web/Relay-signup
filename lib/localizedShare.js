import { getVisibleCategories, getVisibleTaskNote, getTaskBannerUrl, isQueueTask, shouldShowShareButton } from "@/lib/utils";

const LANGUAGE_KEY = "relay_home_language";

function getLocale(url = "") {
  try {
    const parsed = new URL(url, typeof window !== "undefined" ? window.location.origin : "https://relay-signup.vercel.app");
    const queryLocale = parsed.searchParams.get("lang");
    if (queryLocale === "en" || queryLocale === "zh") return queryLocale;
  } catch {}
  if (typeof window !== "undefined") {
    try { return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh"; } catch {}
  }
  return "zh";
}

export function withShareLocale(rawUrl) {
  const locale = getLocale(rawUrl);
  try {
    const url = new URL(rawUrl);
    if (locale === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    return url.toString();
  } catch { return rawUrl; }
}

function formatDate(value, locale) {
  const m = String(value || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return value || "";
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (locale === "en") return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(date);
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][date.getUTCDay()];
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日 (${weekday})`;
}

function dateRange(task, locale) {
  return `${formatDate(task.start_date, locale)} ~ ${formatDate(task.end_date, locale)}`;
}

export function buildLocalizedShareText(task, rawUrl) {
  const locale = getLocale(rawUrl);
  const url = withShareLocale(rawUrl);
  const queue = isQueueTask(task);
  const note = getVisibleTaskNote(task.note);
  if (locale === "en") {
    return [
      `📋 ${task.title}`,
      "",
      task.description || null,
      `🗓 ${dateRange(task, locale)}`,
      note ? `Notes: ${note}` : null,
      "",
      queue ? `👉 Join the queue: ${url}` : `👉 Sign up here: ${url}`,
    ].filter((line) => line !== null).join("\n");
  }
  return [
    `📋 ${task.title}`,
    "",
    task.description || null,
    `🗓 ${dateRange(task, locale)}`,
    note ? `備註：${note}` : null,
    "",
    queue ? `👉 點這裡加入排隊：${url}` : `👉 點這裡完成報名：${url}`,
  ].filter((line) => line !== null).join("\n");
}

export function buildLocalizedFlexMessage(task, rawUrl) {
  const locale = getLocale(rawUrl);
  const url = withShareLocale(rawUrl);
  const queue = isQueueTask(task);
  const categories = getVisibleCategories(task.categories);
  const note = getVisibleTaskNote(task.note);
  const bannerUrl = getTaskBannerUrl(task);
  const en = locale === "en";
  const titleContents = [{ type: "text", text: task.title, weight: "bold", size: "xl", wrap: true, maxLines: 2, color: "#1f2937", flex: 1 }];

  if (shouldShowShareButton(task) && task?.id) {
    const reshare = new URL(`https://relay-signup.vercel.app/share/${task.id}`);
    if (en) reshare.searchParams.set("lang", "en");
    titleContents.push({
      type: "image", url: "https://relay-signup.vercel.app/share-icon.png", size: "22px", aspectRatio: "1:1", aspectMode: "fit", flex: 0,
      action: { type: "uri", label: en ? "Share signup" : "分享接龍", uri: reshare.toString() },
    });
  }

  const body = [{ type: "box", layout: "horizontal", alignItems: "flex-start", spacing: "md", contents: titleContents }];
  if (task.description) body.push({ type: "text", text: task.description, size: "sm", color: "#6b7280", wrap: true, margin: "lg" });
  body.push({ type: "text", text: `🗓 ${dateRange(task, locale)}`, size: "sm", color: "#9ca3af", margin: task.description ? "lg" : "xl", wrap: true });
  if (note) body.push({ type: "text", text: `${en ? "Notes" : "備註"}：${note}`, size: "sm", color: "#6b7280", margin: "sm", wrap: true });
  if (categories.length) body.push({ type: "text", text: `${en ? "Categories" : "分類"}：${categories.join(en ? ", " : "、")}`, size: "sm", color: "#9ca3af", margin: "sm", wrap: true });

  const footer = [{
    type: "box", layout: "vertical", backgroundColor: "#10b981", cornerRadius: "8px", paddingAll: "10px", justifyContent: "center", alignItems: "center",
    action: { type: "uri", uri: url }, contents: [{ type: "text", text: queue ? (en ? "Join Queue" : "我要排隊") : (en ? "Sign Up" : "我要報名"), color: "#ffffff", weight: "bold", size: "sm", align: "center" }],
  }];
  if (!queue) {
    const viewUrl = new URL(url); viewUrl.searchParams.set("mode", "view");
    footer.push({ type: "box", layout: "vertical", backgroundColor: "#ffffff", borderColor: "#10b981", borderWidth: "1px", cornerRadius: "8px", paddingAll: "10px", justifyContent: "center", alignItems: "center", action: { type: "uri", uri: viewUrl.toString() }, contents: [{ type: "text", text: en ? "View List" : "查看名單", color: "#10b981", weight: "bold", size: "sm", align: "center" }] });
  }

  const bubble = {
    type: "bubble",
    header: { type: "box", layout: "horizontal", backgroundColor: "#10b981", paddingAll: "20px", alignItems: "center", contents: [
      { type: "text", text: en ? "Relay Signup Assistant" : "接龍報名小助手", color: "#ffffff", weight: "bold", size: "sm", align: "start", gravity: "center", flex: 1 },
      { type: "image", url: "https://relay-signup.vercel.app/app-icon.png", size: "40px", aspectRatio: "1:1", aspectMode: "cover", flex: 0 },
    ] },
    body: { type: "box", layout: "vertical", paddingAll: "20px", contents: body },
    footer: { type: "box", layout: "vertical", spacing: "sm", contents: footer },
  };
  if (bannerUrl) bubble.hero = { type: "image", url: bannerUrl, size: "full", aspectRatio: "20:11", aspectMode: "cover", action: { type: "uri", uri: url } };
  return { type: "flex", altText: queue ? (en ? `Join the queue: ${task.title}` : `邀請你加入排隊：${task.title}`) : (en ? `Sign up: ${task.title}` : `邀請你完成報名：${task.title}`), contents: bubble };
}
