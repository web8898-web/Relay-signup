"use client";

import QRCode from "qrcode";
import { Download, Image as ImageIcon, Share2, QrCode, Users, CalendarDays, BadgeCheck } from "lucide-react";
import { taskStatus } from "@/lib/utils";

function safeText(value = "", max = 80) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .slice(0, max);
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
  const raw = String(value).trim() || "接龍報名";
  if (raw.length <= 15) return [safeText(raw, 24), ""];
  return [safeText(raw.slice(0, 15), 24), safeText(raw.slice(15, 30), 24)];
}

async function makeQrDataUrl(url) {
  return QRCode.toDataURL(url, {
    width: 360,
    margin: 1,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
  });
}

async function buildShareSvg(task, url, signupCount = 0) {
  const [titleLine1, titleLine2] = splitTitle(task.title || "接龍報名");
  const desc = safeText(task.description || "掃描 QR Code，立即完成報名", 42);
  const dateRange = safeText(formatDateRange(task), 32);
  const status = safeText(taskStatus(task).label || "進行中", 12);
  const link = safeText(url, 70);
  const qrDataUrl = await makeQrDataUrl(url);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E8F8F0"/>
      <stop offset="0.48" stop-color="#F7FFFB"/>
      <stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#55B786"/>
      <stop offset="1" stop-color="#16946A"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#0F172A" flood-opacity="0.14"/>
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#0F172A" flood-opacity="0.10"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1040" cy="88" r="170" fill="#55B786" opacity="0.14"/>
  <circle cx="82" cy="566" r="160" fill="#55B786" opacity="0.11"/>
  <path d="M905 500 C1010 430 1100 478 1160 390" fill="none" stroke="#55B786" stroke-width="36" stroke-linecap="round" opacity="0.10"/>

  <rect x="90" y="62" width="1020" height="506" rx="58" fill="#FFFFFF" filter="url(#shadow)"/>

  <rect x="140" y="108" width="74" height="74" rx="24" fill="url(#brand)"/>
  <path d="M164 147c0-15 12-27 27-27s27 12 27 27-12 27-27 27h-15l-15 13 3-15c-8-5-13-14-13-25z" fill="#FFFFFF" opacity="0.96"/>
  <text x="236" y="137" font-family="Noto Sans TC, Arial, sans-serif" font-size="30" font-weight="800" fill="#16946A">接龍報名小助手</text>
  <text x="236" y="174" font-family="Noto Sans TC, Arial, sans-serif" font-size="20" fill="#94A3B8">快速建立・分享・統計報名</text>

  <text x="140" y="268" font-family="Noto Sans TC, Arial, sans-serif" font-size="54" font-weight="900" fill="#111827">${titleLine1}</text>
  ${titleLine2 ? `<text x="140" y="333" font-family="Noto Sans TC, Arial, sans-serif" font-size="54" font-weight="900" fill="#111827">${titleLine2}</text>` : ""}
  <text x="140" y="386" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" fill="#64748B">${desc}</text>

  <rect x="140" y="424" width="190" height="70" rx="28" fill="#E8F8F0"/>
  <text x="166" y="454" font-family="Noto Sans TC, Arial, sans-serif" font-size="18" fill="#16946A" font-weight="700">已報名</text>
  <text x="166" y="482" font-family="Noto Sans TC, Arial, sans-serif" font-size="28" fill="#0F8A61" font-weight="900">${signupCount} 人</text>

  <rect x="350" y="424" width="230" height="70" rx="28" fill="#F8FAFC"/>
  <text x="378" y="454" font-family="Noto Sans TC, Arial, sans-serif" font-size="18" fill="#64748B" font-weight="700">報名期間</text>
  <text x="378" y="482" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" fill="#334155" font-weight="800">${dateRange}</text>

  <rect x="600" y="424" width="160" height="70" rx="28" fill="#F8FAFC"/>
  <text x="628" y="454" font-family="Noto Sans TC, Arial, sans-serif" font-size="18" fill="#64748B" font-weight="700">狀態</text>
  <text x="628" y="482" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" fill="#16946A" font-weight="900">${status}</text>

  <rect x="815" y="112" width="220" height="220" rx="34" fill="#FFFFFF" filter="url(#softShadow)"/>
  <rect x="838" y="135" width="174" height="174" rx="18" fill="#FFFFFF"/>
  <image href="${qrDataUrl}" x="842" y="139" width="166" height="166"/>
  <text x="925" y="366" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="22" fill="#16946A" font-weight="800">掃描 QR Code</text>
  <text x="925" y="398" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="19" fill="#64748B">立即完成報名</text>

  <rect x="140" y="526" width="890" height="1" fill="#E5E7EB"/>
  <text x="140" y="552" font-family="Arial, sans-serif" font-size="18" fill="#94A3B8">${link}</text>
  <text x="1030" y="552" text-anchor="end" font-family="Noto Sans TC, Arial, sans-serif" font-size="18" fill="#16946A" font-weight="800">接龍報名小助手</text>
</svg>`;
}

async function svgToPngBlob(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("圖片產生失敗"));
      }, "image/png", 0.95);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("圖片產生失敗"));
    };
    img.src = objectUrl;
  });
}

export default function TaskShareImagePanel({ task, url, signupCount = 0, onToast }) {
  const status = taskStatus(task).label;

  async function makeBlob() {
    const svg = await buildShareSvg(task, url, signupCount);
    return svgToPngBlob(svg);
  }

  async function handleDownload() {
    try {
      const blob = await makeBlob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${task.title || "接龍報名"}_分享圖片.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      onToast?.("已下載分享圖片");
    } catch (e) {
      onToast?.(e.message || "圖片產生失敗");
    }
  }

  async function handleSystemShare() {
    try {
      const blob = await makeBlob();
      const file = new File([blob], `${task.title || "接龍報名"}_分享圖片.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: task.title, text: "接龍報名小助手" });
        onToast?.("已開啟圖片分享");
      } else {
        await handleDownload();
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
          <p className="text-[11px] text-gray-400">含 QR Code，可直接傳到 LINE 群組或貼在社群。</p>
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
          <Download size={15} /> 下載圖片
        </button>
      </div>
    </div>
  );
}
