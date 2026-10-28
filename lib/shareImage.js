import QRCode from "qrcode";
import { isQueueTask, taskStatus, getVisibleTaskNote } from "@/lib/utils";

export const IMAGE_WIDTH = 1080;
export const IMAGE_HEIGHT = 1350;

function safeText(value = "", max = 80) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/[\n\r]+/g, " ")
    .slice(0, max);
}

export function fileSafeName(value = "接龍報名") {
  return String(value).trim().replace(/[\\/:*?"<>|]/g, "_").slice(0, 32) || "接龍報名";
}

function formatDate(value) {
  if (!value) return "未設定";
  const parts = String(value).split("-");
  if (parts.length === 3) return `${Number(parts[1])}/${Number(parts[2])}`;
  return value;
}

export function formatDateRange(task) {
  return `${formatDate(task.start_date)}～${formatDate(task.end_date)}`;
}

function splitTitle(value = "接龍報名") {
  const raw = String(value).replace(/[\n\r]+/g, " ").trim() || "接龍報名";
  const perLine = /^[\x00-\x7F\s]+$/.test(raw) ? 18 : 8;
  const line1 = raw.slice(0, perLine);
  let line2 = raw.slice(perLine, perLine * 2);
  if (raw.length > perLine * 2) line2 = `${line2.slice(0, Math.max(1, perLine - 1))}…`;
  return [safeText(line1, 22), safeText(line2, 22)];
}

function splitInfo(value = "", perLine = 20, maxLines = 2) {
  const raw = String(value).replace(/[\n\r]+/g, " ").trim();
  if (!raw) return [];
  const lines = [];
  for (let i = 0; i < maxLines; i++) {
    const part = raw.slice(i * perLine, (i + 1) * perLine);
    if (!part) break;
    lines.push(safeText(part, perLine + 2));
  }
  if (raw.length > perLine * maxLines && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, Math.max(1, perLine - 1))}…`;
  }
  return lines;
}

export function taskLabel(status) {
  if (status.includes("尚未開始")) return "尚未開始";
  if (status.includes("截止") || status.includes("結束")) return "已截止";
  if (status.includes("額滿")) return "已額滿";
  return "進行中";
}

function statusColor(status) {
  if (status.includes("截止") || status.includes("結束")) return "#9CA3AF";
  if (status.includes("額滿")) return "#F59E0B";
  return "#16946A";
}

async function makeQrDataUrl(url) {
  return QRCode.toDataURL(url, {
    width: 520,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0F172A", light: "#FFFFFF" },
  });
}

export async function buildShareSvg(task, url, signupCount = 0, language = "zh") {
  const en = language === "en";
  const t = (zh, english) => en ? english : zh;
  const queue = isQueueTask(task);
  const [titleLine1, titleLine2] = splitTitle(task.title || "接龍報名");
  const descriptionLines = splitInfo(task.description, 19, 2);
  const noteLines = splitInfo(getVisibleTaskNote(task.note), 19, 2);
  const dateRange = safeText(formatDateRange(task), 32);
  const rawStatus = taskStatus(task).label || "進行中";
  const status = en ? (rawStatus.includes("截止") ? "Closed" : rawStatus.includes("額滿") ? "Full" : rawStatus.includes("尚未") ? "Not Started" : "Active") : safeText(taskLabel(rawStatus), 12);
  const statusFill = statusColor(rawStatus);
  const qrDataUrl = await makeQrDataUrl(url);
  const actionText = queue ? t("立即加入排隊", "Join the queue") : t("立即完成報名", "Sign up now");
  const countLabel = queue ? t("目前等待", "Waiting") : t("已報名人數", "Registered");

  const descriptionSvg = descriptionLines.length
    ? `<text x="92" y="540" font-family="Noto Sans TC, Arial, sans-serif" font-size="25" font-weight="800" fill="#16946A">${t("簡介", "Description")}</text>${descriptionLines
        .map((line, index) => `<text x="92" y="${578 + index * 34}" font-family="Noto Sans TC, Arial, sans-serif" font-size="25" font-weight="600" fill="#475569">${line}</text>`)
        .join("")}`
    : "";

  const noteStart = descriptionLines.length ? 666 : 540;
  const noteSvg = noteLines.length
    ? `<text x="92" y="${noteStart}" font-family="Noto Sans TC, Arial, sans-serif" font-size="25" font-weight="800" fill="#16946A">${t("備註", "Notes")}</text>${noteLines
        .map((line, index) => `<text x="92" y="${noteStart + 38 + index * 34}" font-family="Noto Sans TC, Arial, sans-serif" font-size="25" font-weight="600" fill="#475569">${line}</text>`)
        .join("")}`
    : "";

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" viewBox="0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3FFFA"/><stop offset="0.56" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEF9F4"/></linearGradient>
    <linearGradient id="green" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#55B786"/><stop offset="1" stop-color="#16946A"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#0F172A" flood-opacity="0.10"/></filter>
  </defs>
  <rect width="1080" height="1350" fill="#FFFFFF"/>
  <rect x="40" y="42" width="1000" height="1266" rx="48" fill="url(#bg)"/>
  <text x="92" y="112" font-family="Noto Sans TC, Arial, sans-serif" font-size="39" font-weight="900" fill="#16946A">${t("接龍報名小助手", "Relay Signup Assistant")}</text>
  <text x="92" y="158" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" font-weight="600" fill="#64748B">${t("快速建立・分享・統計報名", "Create, share and track signups")}</text>
  <rect x="92" y="238" width="180" height="58" rx="29" fill="url(#green)" opacity="0.85"/>
  <text x="182" y="277" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="${en ? 21 : 30}" font-weight="900" fill="#FFFFFF">${queue ? t("現場排隊", "On-site Queue") : t("接龍任務", "Signup Task")}</text>
  <text x="92" y="380" font-family="Noto Sans TC, Arial, sans-serif" font-size="54" font-weight="900" fill="#173D38">${titleLine1}</text>
  ${titleLine2 ? `<text x="92" y="444" font-family="Noto Sans TC, Arial, sans-serif" font-size="54" font-weight="900" fill="#173D38">${titleLine2}</text>` : ""}
  ${descriptionSvg}
  ${noteSvg}

  <rect x="596" y="220" width="380" height="560" rx="42" fill="#FFFFFF" filter="url(#shadow)"/>
  <rect x="648" y="268" width="276" height="276" rx="22" fill="#FFFFFF"/>
  <image href="${qrDataUrl}" x="656" y="276" width="260" height="260"/>
  <rect x="626" y="594" width="320" height="116" rx="28" fill="#F2FAF6"/>
  <text x="786" y="644" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="32" font-weight="900" fill="#16946A">${t("掃描 QR Code", "Scan QR Code")}</text>
  <text x="786" y="686" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="30" font-weight="800" fill="#64748B">${actionText}</text>

  <rect x="64" y="864" width="952" height="370" rx="40" fill="#FFFFFF" filter="url(#shadow)"/>
  <rect x="92" y="900" width="276" height="222" rx="32" fill="#EAF8F2"/>
  <text x="230" y="1008" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="800" fill="#0F172A">${countLabel}</text>
  <text x="230" y="1082" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="52" font-weight="900" fill="#16946A">${signupCount}${en ? "" : " 人"}</text>
  <rect x="402" y="900" width="276" height="222" rx="32" fill="#F1F8FF"/>
  <text x="540" y="1008" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="800" fill="#0F172A">${queue ? t("排隊期間", "Queue Dates") : t("報名期間", "Signup Dates")}</text>
  <text x="540" y="1074" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="39" font-weight="900" fill="#1E5E92">${dateRange}</text>
  <rect x="712" y="900" width="276" height="222" rx="32" fill="#FFF9EB"/>
  <text x="850" y="1008" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="800" fill="#0F172A">${t("任務狀態", "Status")}</text>
  <text x="850" y="1082" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="46" font-weight="900" fill="${statusFill}">${status}</text>
  <rect x="102" y="1156" width="876" height="54" rx="27" fill="#FFFFFF" stroke="#E6F1EC"/>
  <text x="540" y="1192" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="700" fill="#334155">${en ? "Scan the QR code to " + (queue ? "join the queue" : "sign up") : "掃描 QR Code，" + actionText}</text>
</svg>`;
}

