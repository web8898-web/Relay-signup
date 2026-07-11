"use client";

import QRCode from "qrcode";
import { Download, Image as ImageIcon, Share2, QrCode, Users, CalendarDays, BadgeCheck } from "lucide-react";
import { isQueueTask, taskStatus } from "@/lib/utils";

const IMAGE_WIDTH = 1080;
const IMAGE_HEIGHT = 1350;

function safeText(value = "", max = 80) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/[\n\r]+/g, " ")
    .slice(0, max);
}

function fileSafeName(value = "接龍報名") {
  return String(value).trim().replace(/[\\/:*?"<>|]/g, "_").slice(0, 32) || "接龍報名";
}

function formatDate(value) {
  if (!value) return "未設定";
  const parts = String(value).split("-");
  if (parts.length === 3) return `${Number(parts[1])}/${Number(parts[2])}`;
  return value;
}

function formatDateRange(task) {
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

function taskLabel(status) {
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

async function buildShareSvg(task, url, signupCount = 0) {
  const queue = isQueueTask(task);
  const [titleLine1, titleLine2] = splitTitle(task.title || "接龍報名");
  const descriptionLines = splitInfo(task.description, 19, 2);
  const noteLines = splitInfo(task.note, 19, 2);
  const dateRange = safeText(formatDateRange(task), 32);
  const rawStatus = taskStatus(task).label || "進行中";
  const status = safeText(taskLabel(rawStatus), 12);
  const statusFill = statusColor(rawStatus);
  const qrDataUrl = await makeQrDataUrl(url);
  const actionText = queue ? "立即加入排隊" : "立即完成報名";
  const countLabel = queue ? "目前等待" : "已報名人數";

  const descriptionSvg = descriptionLines.length
    ? `<text x="92" y="540" font-family="Noto Sans TC, Arial, sans-serif" font-size="25" font-weight="800" fill="#16946A">簡介</text>${descriptionLines
        .map((line, index) => `<text x="92" y="${578 + index * 34}" font-family="Noto Sans TC, Arial, sans-serif" font-size="25" font-weight="600" fill="#475569">${line}</text>`)
        .join("")}`
    : "";

  const noteStart = descriptionLines.length ? 666 : 540;
  const noteSvg = noteLines.length
    ? `<text x="92" y="${noteStart}" font-family="Noto Sans TC, Arial, sans-serif" font-size="25" font-weight="800" fill="#16946A">備註</text>${noteLines
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
  <text x="92" y="112" font-family="Noto Sans TC, Arial, sans-serif" font-size="39" font-weight="900" fill="#16946A">接龍報名小助手</text>
  <text x="92" y="158" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" font-weight="600" fill="#64748B">快速建立・分享・統計報名</text>
  <rect x="92" y="238" width="180" height="58" rx="29" fill="url(#green)" opacity="0.85"/>
  <text x="182" y="277" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="30" font-weight="900" fill="#FFFFFF">${queue ? "現場排隊" : "接龍任務"}</text>
  <text x="92" y="380" font-family="Noto Sans TC, Arial, sans-serif" font-size="54" font-weight="900" fill="#173D38">${titleLine1}</text>
  ${titleLine2 ? `<text x="92" y="444" font-family="Noto Sans TC, Arial, sans-serif" font-size="54" font-weight="900" fill="#173D38">${titleLine2}</text>` : ""}
  ${descriptionSvg}
  ${noteSvg}

  <rect x="596" y="220" width="380" height="560" rx="42" fill="#FFFFFF" filter="url(#shadow)"/>
  <rect x="648" y="268" width="276" height="276" rx="22" fill="#FFFFFF"/>
  <image href="${qrDataUrl}" x="656" y="276" width="260" height="260"/>
  <rect x="626" y="594" width="320" height="116" rx="28" fill="#F2FAF6"/>
  <text x="786" y="644" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="32" font-weight="900" fill="#16946A">掃描 QR Code</text>
  <text x="786" y="686" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="30" font-weight="800" fill="#64748B">${actionText}</text>

  <rect x="64" y="864" width="952" height="370" rx="40" fill="#FFFFFF" filter="url(#shadow)"/>
  <rect x="92" y="900" width="276" height="222" rx="32" fill="#EAF8F2"/>
  <text x="230" y="1008" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="800" fill="#0F172A">${countLabel}</text>
  <text x="230" y="1082" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="52" font-weight="900" fill="#16946A">${signupCount} 人</text>
  <rect x="402" y="900" width="276" height="222" rx="32" fill="#F1F8FF"/>
  <text x="540" y="1008" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="800" fill="#0F172A">${queue ? "排隊期間" : "報名期間"}</text>
  <text x="540" y="1074" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="39" font-weight="900" fill="#1E5E92">${dateRange}</text>
  <rect x="712" y="900" width="276" height="222" rx="32" fill="#FFF9EB"/>
  <text x="850" y="1008" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="800" fill="#0F172A">任務狀態</text>
  <text x="850" y="1082" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="46" font-weight="900" fill="${statusFill}">${status}</text>
  <rect x="102" y="1156" width="876" height="54" rx="27" fill="#FFFFFF" stroke="#E6F1EC"/>
  <text x="540" y="1192" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="700" fill="#334155">掃描 QR Code，${actionText}</text>
</svg>`;
}

async function svgToPngBlob(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = IMAGE_WIDTH;
      canvas.height = IMAGE_HEIGHT;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("圖片產生失敗"))), "image/png", 1);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("圖片產生失敗"));
    };
    img.src = objectUrl;
  });
}

export default function TaskShareImagePanel({ task, url, signupCount = 0, onToast }) {
  const queue = isQueueTask(task);
  const status = taskLabel(taskStatus(task).label || "進行中");

  async function makeBlob() {
    return svgToPngBlob(await buildShareSvg(task, url, signupCount));
  }

  async function shareBlob(blob, toastMessage = "已開啟圖片分享") {
    const file = new File([blob], `${fileSafeName(task.title)}_分享圖片.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: task.title, text: "接龍報名小助手" });
      onToast?.(toastMessage);
      return true;
    }
    return false;
  }

  async function fallbackDownload(blob) {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${fileSafeName(task.title)}_分享圖片.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
  }

  async function handleDownload() {
    try {
      const blob = await makeBlob();
      const shared = await shareBlob(blob, "請在開啟的選單中選擇「儲存圖片」");
      if (!shared) {
        await fallbackDownload(blob);
        onToast?.("分享圖片已下載");
      }
    } catch (e) {
      if (e?.name !== "AbortError") onToast?.(e.message || "圖片產生失敗");
    }
  }

  async function handleSystemShare() {
    try {
      const blob = await makeBlob();
      const shared = await shareBlob(blob, "已開啟分享選單");
      if (!shared) {
        await fallbackDownload(blob);
        onToast?.("此裝置不支援直接分享，已改為下載圖片");
      }
    } catch (e) {
      if (e?.name !== "AbortError") onToast?.("無法直接分享，請改用下載圖片");
    }
  }

  return (
    <div className="mt-5 bg-white border border-gray-100 rounded-[28px] p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><ImageIcon size={16} /></div>
        <div>
          <p className="text-sm font-bold text-gray-700">分享圖片</p>
          <p className="text-[11px] text-gray-400">簡介與備註會一併顯示在分享圖片上。</p>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-emerald-600 font-semibold">接龍報名小助手</p>
              <p className="text-lg font-bold text-gray-800 mt-1 line-clamp-2">{task.title}</p>
              {task.description && <p className="text-xs text-gray-600 mt-2 line-clamp-2">簡介：{task.description}</p>}
              {task.note && <p className="text-xs text-gray-500 mt-1 line-clamp-2">備註：{task.note}</p>}
              <p className="text-xs text-gray-400 mt-2">{formatDateRange(task)}</p>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-white border border-gray-100 p-1.5 shrink-0 shadow-sm flex items-center justify-center"><QrCode size={44} className="text-gray-800" /></div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-4">
            <div className="rounded-2xl bg-emerald-50 px-2 py-2"><Users size={13} className="text-emerald-600 mb-1" /><p className="text-[10px] text-emerald-600 font-semibold">{queue ? "等待中" : "已報名"}</p><p className="text-xs font-bold text-emerald-700">{signupCount} 人</p></div>
            <div className="rounded-2xl bg-gray-50 px-2 py-2"><CalendarDays size={13} className="text-gray-500 mb-1" /><p className="text-[10px] text-gray-500 font-semibold">期間</p><p className="text-xs font-bold text-gray-700 truncate">{formatDateRange(task)}</p></div>
            <div className="rounded-2xl bg-gray-50 px-2 py-2"><BadgeCheck size={13} className="text-emerald-600 mb-1" /><p className="text-[10px] text-gray-500 font-semibold">狀態</p><p className="text-xs font-bold text-emerald-700">{status}</p></div>
          </div>

          <p className="text-[11px] text-emerald-600 font-semibold mt-3 text-center">📱 掃描 QR Code，{queue ? "立即加入排隊" : "立即完成報名"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button onClick={handleSystemShare} className="bg-emerald-500 text-white rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-100"><Share2 size={15} /> 分享圖片</button>
        <button onClick={handleDownload} className="bg-gray-50 text-gray-600 rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5"><Download size={15} /> 儲存圖片</button>
      </div>
    </div>
  );
}
