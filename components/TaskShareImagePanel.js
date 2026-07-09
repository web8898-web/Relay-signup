"use client";

import QRCode from "qrcode";
import { Download, Image as ImageIcon, Share2, QrCode, Users, CalendarDays, BadgeCheck } from "lucide-react";
import { taskStatus } from "@/lib/utils";

const IMAGE_WIDTH = 1080;
const IMAGE_HEIGHT = 1350;

function safeText(value = "", max = 80) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .slice(0, max);
}

function fileSafeName(value = "接龍報名") {
  return String(value)
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 32) || "接龍報名";
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

function compactLocation(task) {
  const value = task.location || task.place || task.venue || "";
  return safeText(value, 12);
}

function splitTitle(value = "接龍報名") {
  const raw = String(value).replace(/[\n\r]+/g, " ").trim() || "接龍報名";
  const isMostlyAscii = /^[\x00-\x7F\s]+$/.test(raw);
  const perLine = isMostlyAscii ? 18 : 8;
  const line1 = raw.slice(0, perLine);
  let line2 = raw.slice(perLine, perLine * 2);
  if (raw.length > perLine * 2) line2 = `${line2.slice(0, Math.max(1, perLine - 1))}…`;
  return [safeText(line1, 22), safeText(line2, 22)];
}

function statusColor(status) {
  if (status.includes("截止") || status.includes("結束")) return "#9CA3AF";
  if (status.includes("額滿")) return "#F59E0B";
  return "#16946A";
}

function taskLabel(status) {
  if (status.includes("截止") || status.includes("結束")) return "已截止";
  if (status.includes("額滿")) return "已額滿";
  return "進行中";
}

async function makeQrDataUrl(url) {
  return QRCode.toDataURL(url, {
    width: 520,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0F172A", light: "#FFFFFF" },
  });
}

function pinIcon(x, y, color = "#55B786") {
  return `
  <g transform="translate(${x} ${y})">
    <path d="M18 2C8 2 2 9.5 2 18.5C2 31 18 46 18 46S34 31 34 18.5C34 9.5 28 2 18 2Z" fill="${color}"/>
    <circle cx="18" cy="18" r="7" fill="#FFFFFF"/>
  </g>`;
}

function usersIcon(x, y, color = "#55B786") {
  return `
  <g transform="translate(${x} ${y})" fill="${color}">
    <circle cx="22" cy="16" r="12"/><circle cx="48" cy="18" r="10" opacity="0.8"/>
    <path d="M2 58c2-18 14-28 31-28s29 10 31 28H2Z"/>
    <path d="M44 58c1-12 9-21 23-21 12 0 21 8 23 21H44Z" opacity="0.65"/>
  </g>`;
}

function calendarIcon(x, y, color = "#4B9CD3") {
  return `
  <g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="8" width="66" height="58" rx="12" fill="#FFFFFF"/>
    <path d="M2 26h66M20 2v14M50 2v14"/>
    <path d="M20 40h.1M36 40h.1M52 40h.1M20 54h.1M36 54h.1M52 54h.1" stroke-width="8"/>
  </g>`;
}

function checkIcon(x, y, color = "#F59E0B") {
  return `
  <g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="36" cy="36" r="30" fill="#FFFFFF"/>
    <path d="M20 36l11 11 23-26"/>
  </g>`;
}

function phoneIcon(x, y, color = "#55B786") {
  return `
  <g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="2" width="32" height="56" rx="8" fill="#FFFFFF"/>
    <path d="M20 48h8"/>
  </g>`;
}

async function buildShareSvg(task, url, signupCount = 0) {
  const [titleLine1, titleLine2] = splitTitle(task.title || "接龍報名");
  const dateRange = safeText(formatDateRange(task), 32);
  const rawStatus = taskStatus(task).label || "進行中";
  const status = safeText(taskLabel(rawStatus), 12);
  const statusFill = statusColor(rawStatus);
  const location = compactLocation(task);
  const qrDataUrl = await makeQrDataUrl(url);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" viewBox="0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F3FFFA"/><stop offset="0.56" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEF9F4"/>
    </linearGradient>
    <linearGradient id="mint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF8F2"/><stop offset="1" stop-color="#F9FFFC"/></linearGradient>
    <linearGradient id="green" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#55B786"/><stop offset="1" stop-color="#16946A"/></linearGradient>
    <linearGradient id="blueSoft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1F8FF"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
    <linearGradient id="yellowSoft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF9EB"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#0F172A" flood-opacity="0.10"/></filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#0F172A" flood-opacity="0.08"/></filter>
  </defs>

  <rect width="1080" height="1350" fill="#FFFFFF"/>
  <rect x="40" y="42" width="1000" height="1266" rx="48" fill="url(#bg)"/>

  <g opacity="0.52">
    <path d="M934 104 C974 130 1004 156 1038 210" stroke="#6DAF84" stroke-width="4" fill="none"/>
    <ellipse cx="956" cy="122" rx="14" ry="34" fill="#7EBB92" transform="rotate(50 956 122)"/>
    <ellipse cx="990" cy="150" rx="12" ry="30" fill="#8EC7A0" transform="rotate(34 990 150)"/>
    <ellipse cx="1020" cy="184" rx="10" ry="26" fill="#7EBB92" transform="rotate(18 1020 184)"/>
  </g>

  <text x="92" y="112" font-family="Noto Sans TC, Arial, sans-serif" font-size="39" font-weight="900" fill="#16946A">接龍報名小助手</text>
  <text x="92" y="158" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" font-weight="600" fill="#64748B">快速建立・分享・統計報名</text>

  <rect x="92" y="248" width="180" height="58" rx="29" fill="url(#green)" opacity="0.82"/>
  <text x="182" y="287" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="30" font-weight="900" fill="#FFFFFF">接龍任務</text>

  <text x="92" y="392" font-family="Noto Sans TC, Arial, sans-serif" font-size="54" font-weight="900" fill="#173D38">${titleLine1}</text>
  ${titleLine2 ? `<text x="92" y="456" font-family="Noto Sans TC, Arial, sans-serif" font-size="54" font-weight="900" fill="#173D38">${titleLine2}</text>` : ""}
  <text x="92" y="540" font-family="Noto Sans TC, Arial, sans-serif" font-size="30" font-weight="900" fill="#16946A">掃描右側 QR Code</text>
  <text x="92" y="584" font-family="Noto Sans TC, Arial, sans-serif" font-size="30" font-weight="800" fill="#64748B">立即完成報名</text>
  ${location ? `${pinIcon(92, 622)}<text x="142" y="662" font-family="Noto Sans TC, Arial, sans-serif" font-size="32" font-weight="800" fill="#334155">${location}</text>` : ""}

  <path d="M40 700 C180 608 295 676 420 610 C560 536 680 650 820 580 C920 530 995 560 1040 506 L1040 800 L40 800 Z" fill="#CFEADF" opacity="0.58"/>
  <path d="M40 780 C190 696 310 720 455 660 C615 594 755 720 914 655 C982 628 1020 640 1040 620 L1040 842 L40 842 Z" fill="#E8F5EF"/>
  <path d="M40 842 C190 805 355 810 520 798 C690 786 845 816 1040 772 L1040 884 L40 884 Z" fill="#FFFFFF" opacity="0.94"/>

  <rect x="596" y="220" width="380" height="560" rx="42" fill="#FFFFFF" filter="url(#shadow)"/>
  <rect x="648" y="268" width="276" height="276" rx="22" fill="#FFFFFF"/>
  <image href="${qrDataUrl}" x="656" y="276" width="260" height="260"/>
  <rect x="626" y="594" width="320" height="116" rx="28" fill="#F2FAF6"/>
  <text x="786" y="644" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="32" font-weight="900" fill="#16946A">掃描 QR Code</text>
  <text x="786" y="686" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="30" font-weight="800" fill="#64748B">立即完成報名</text>

  <rect x="64" y="864" width="952" height="370" rx="40" fill="#FFFFFF" filter="url(#softShadow)"/>

  <rect x="92" y="900" width="276" height="222" rx="32" fill="url(#mint)"/>
  ${usersIcon(183, 940)}
  <text x="230" y="1034" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="800" fill="#0F172A">已報名人數</text>
  <text x="230" y="1100" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="52" font-weight="900" fill="#16946A">${signupCount} 人</text>

  <rect x="402" y="900" width="276" height="222" rx="32" fill="url(#blueSoft)"/>
  ${calendarIcon(505, 930)}
  <text x="540" y="1034" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="800" fill="#0F172A">報名期間</text>
  <text x="540" y="1094" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="39" font-weight="900" fill="#1E5E92">${dateRange}</text>

  <rect x="712" y="900" width="276" height="222" rx="32" fill="url(#yellowSoft)"/>
  ${checkIcon(832, 930, statusFill)}
  <text x="850" y="1034" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="800" fill="#0F172A">任務狀態</text>
  <text x="850" y="1100" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="46" font-weight="900" fill="${statusFill}">${status}</text>

  <rect x="102" y="1156" width="876" height="54" rx="27" fill="#FFFFFF" stroke="#E6F1EC"/>
  ${phoneIcon(326, 1166, "#55B786")}
  <text x="565" y="1192" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="700" fill="#334155">掃描 QR Code，立即完成報名</text>
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
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("圖片產生失敗"));
      }, "image/png", 1);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("圖片產生失敗"));
    };
    img.src = objectUrl;
  });
}

export default function TaskShareImagePanel({ task, url, signupCount = 0, onToast }) {
  const status = taskLabel(taskStatus(task).label || "進行中");

  async function makeBlob() {
    const svg = await buildShareSvg(task, url, signupCount);
    return svgToPngBlob(svg);
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
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <ImageIcon size={16} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-700">分享圖片</p>
          <p className="text-[11px] text-gray-400">直式分享圖，適合 LINE、社群與手機瀏覽。</p>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-emerald-600 font-semibold">接龍報名小助手</p>
              <p className="text-lg font-bold text-gray-800 mt-1 line-clamp-2">{task.title}</p>
              <p className="text-xs text-gray-400 mt-2">{formatDateRange(task)}</p>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-white border border-gray-100 p-1.5 shrink-0 shadow-sm flex items-center justify-center">
              <QrCode size={44} className="text-gray-800" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-4">
            <div className="rounded-2xl bg-emerald-50 px-2 py-2">
              <Users size={13} className="text-emerald-600 mb-1" />
              <p className="text-[10px] text-emerald-600 font-semibold">已報名</p>
              <p className="text-xs font-bold text-emerald-700">{signupCount} 人</p>
            </div>
            <div className="rounded-2xl bg-gray-50 px-2 py-2">
              <CalendarDays size={13} className="text-gray-500 mb-1" />
              <p className="text-[10px] text-gray-500 font-semibold">期間</p>
              <p className="text-xs font-bold text-gray-700 truncate">{formatDateRange(task)}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 px-2 py-2">
              <BadgeCheck size={13} className="text-emerald-600 mb-1" />
              <p className="text-[10px] text-gray-500 font-semibold">狀態</p>
              <p className="text-xs font-bold text-emerald-700">{status}</p>
            </div>
          </div>

          <p className="text-[11px] text-emerald-600 font-semibold mt-3 text-center">📱 掃描 QR Code，立即完成報名</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button onClick={handleSystemShare} className="bg-emerald-500 text-white rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-100">
          <Share2 size={15} /> 分享圖片
        </button>
        <button onClick={handleDownload} className="bg-gray-50 text-gray-600 rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5">
          <Download size={15} /> 儲存圖片
        </button>
      </div>
    </div>
  );
}
