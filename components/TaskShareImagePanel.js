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

function splitTitle(value = "接龍報名") {
  const raw = String(value).trim() || "接龍報名";
  if (raw.length <= 9) return [safeText(raw, 18), ""];
  if (raw.length <= 18) return [safeText(raw.slice(0, 9), 18), safeText(raw.slice(9), 18)];
  return [safeText(raw.slice(0, 9), 18), safeText(raw.slice(9, 18), 18)];
}

function statusColor(status) {
  if (status.includes("截止") || status.includes("結束")) return "#9CA3AF";
  if (status.includes("額滿")) return "#F59E0B";
  return "#0F9A6B";
}

async function makeQrDataUrl(url) {
  return QRCode.toDataURL(url, {
    width: 520,
    margin: 1,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
  });
}

async function buildShareSvg(task, url, signupCount = 0) {
  const [titleLine1, titleLine2] = splitTitle(task.title || "接龍報名");
  const dateRange = safeText(formatDateRange(task), 32);
  const status = safeText(taskStatus(task).label || "進行中", 12);
  const statusFill = statusColor(status);
  const location = safeText(task.location || task.place || task.description || "", 12);
  const qrDataUrl = await makeQrDataUrl(url);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" viewBox="0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#EAFBF7"/>
      <stop offset="0.5" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#F4FFF9"/>
    </linearGradient>
    <linearGradient id="green" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#19C08C"/>
      <stop offset="1" stop-color="#008B63"/>
    </linearGradient>
    <linearGradient id="deepGreen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0BAF78"/>
      <stop offset="1" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="blueSoft" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#EFF8FF"/>
      <stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
    <linearGradient id="yellowSoft" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF7E5"/>
      <stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#0F172A" flood-opacity="0.16"/>
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#0F172A" flood-opacity="0.10"/>
    </filter>
  </defs>

  <rect width="1080" height="1350" fill="#FFFFFF"/>
  <rect x="36" y="38" width="1008" height="1274" rx="46" fill="url(#sky)" filter="url(#softShadow)"/>

  <!-- natural decorative leaves -->
  <g opacity="0.85">
    <path d="M36 0 C90 30 130 65 150 120" stroke="#7CBF5D" stroke-width="5" fill="none"/>
    <ellipse cx="58" cy="32" rx="15" ry="32" fill="#75B843" transform="rotate(-48 58 32)"/>
    <ellipse cx="94" cy="54" rx="13" ry="29" fill="#86C85A" transform="rotate(-30 94 54)"/>
    <ellipse cx="130" cy="78" rx="12" ry="27" fill="#6FAF48" transform="rotate(-20 130 78)"/>
    <path d="M1040 92 C990 120 950 150 920 205" stroke="#39A86E" stroke-width="5" fill="none"/>
    <ellipse cx="1008" cy="118" rx="13" ry="32" fill="#22A06B" transform="rotate(30 1008 118)"/>
    <ellipse cx="966" cy="145" rx="12" ry="28" fill="#40B77A" transform="rotate(58 966 145)"/>
    <ellipse cx="930" cy="172" rx="10" ry="26" fill="#2DA66C" transform="rotate(72 930 172)"/>
  </g>

  <text x="540" y="105" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="44" font-weight="900" fill="#047857">接龍報名小助手</text>
  <text x="540" y="154" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" font-weight="700" fill="#334155">快速建立・分享・統計報名</text>
  <text x="360" y="150" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" fill="#FBBF24">✦</text>
  <text x="704" y="150" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" fill="#FBBF24">✦</text>

  <rect x="78" y="208" width="214" height="62" rx="31" fill="url(#deepGreen)"/>
  <text x="185" y="250" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="32" font-weight="900" fill="#FFFFFF">接龍任務</text>

  <text x="76" y="365" font-family="Noto Sans TC, Arial, sans-serif" font-size="78" font-weight="900" fill="#064E3B">${titleLine1}</text>
  ${titleLine2 ? `<text x="126" y="450" font-family="Noto Sans TC, Arial, sans-serif" font-size="66" font-weight="900" fill="#064E3B">${titleLine2}</text>` : ""}
  ${location ? `<text x="250" y="532" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="34" font-weight="800" fill="#0F172A">📍 ${location}</text>` : ""}

  <!-- generic landscape -->
  <path d="M36 650 C160 548 265 600 390 520 C545 420 690 560 820 500 C930 450 990 475 1044 430 L1044 745 L36 745 Z" fill="#A7E4D0" opacity="0.62"/>
  <path d="M36 720 C190 635 320 680 455 600 C610 510 740 632 874 575 C946 545 1008 562 1044 540 L1044 745 L36 745 Z" fill="#4FBE8F" opacity="0.72"/>
  <path d="M36 744 C160 690 290 705 420 678 C610 638 785 728 1044 652 L1044 790 L36 790 Z" fill="#E6FFF5"/>
  <path d="M78 705 C205 658 340 670 496 660 C640 650 800 675 1002 628" stroke="#FFFFFF" stroke-width="10" fill="none" opacity="0.85"/>

  <!-- QR card -->
  <rect x="606" y="214" width="376" height="548" rx="44" fill="#FFFFFF" filter="url(#cardShadow)"/>
  <rect x="662" y="270" width="264" height="264" rx="20" fill="#FFFFFF"/>
  <image href="${qrDataUrl}" x="670" y="278" width="248" height="248"/>
  <rect x="626" y="588" width="336" height="116" rx="28" fill="url(#deepGreen)"/>
  <text x="794" y="640" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="32" font-weight="900" fill="#FFFFFF">掃描 QR Code</text>
  <text x="794" y="682" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="31" font-weight="900" fill="#FFFFFF">立即完成報名</text>
  <text x="928" y="674" font-family="Noto Sans TC, Arial, sans-serif" font-size="34" fill="#FCD34D">⌁</text>

  <!-- big CTA -->
  <rect x="54" y="768" width="972" height="116" rx="58" fill="url(#deepGreen)" stroke="#FFFFFF" stroke-width="6"/>
  <text x="540" y="838" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="39" font-weight="900" fill="#FFFFFF">📱 掃描 QR Code，立即完成報名！</text>
  <text x="940" y="838" font-family="Noto Sans TC, Arial, sans-serif" font-size="36" fill="#FCD34D">⌁</text>

  <!-- info cards -->
  <rect x="72" y="924" width="280" height="252" rx="34" fill="#FFFFFF" filter="url(#softShadow)"/>
  <circle cx="212" cy="994" r="34" fill="#0F9A6B" opacity="0.12"/>
  <text x="212" y="1012" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="48" fill="#0F9A6B">👥</text>
  <text x="212" y="1072" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="28" font-weight="800" fill="#0F172A">已報名人數</text>
  <text x="212" y="1142" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="58" font-weight="900" fill="#0F9A6B">${signupCount} 人</text>

  <rect x="400" y="924" width="280" height="252" rx="34" fill="url(#blueSoft)" filter="url(#softShadow)"/>
  <circle cx="540" cy="994" r="34" fill="#0284C7" opacity="0.12"/>
  <text x="540" y="1012" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="48" fill="#0284C7">📅</text>
  <text x="540" y="1072" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="28" font-weight="800" fill="#0F172A">報名期間</text>
  <text x="540" y="1137" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="45" font-weight="900" fill="#0F172A">${dateRange}</text>

  <rect x="728" y="924" width="280" height="252" rx="34" fill="url(#yellowSoft)" filter="url(#softShadow)"/>
  <circle cx="868" cy="994" r="34" fill="${statusFill}" opacity="0.12"/>
  <text x="868" y="1012" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="48" fill="${statusFill}">✓</text>
  <text x="868" y="1072" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="28" font-weight="800" fill="#0F172A">任務狀態</text>
  <text x="868" y="1140" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="50" font-weight="900" fill="${statusFill}">${status}</text>

  <!-- feature strip -->
  <rect x="54" y="1208" width="972" height="76" rx="30" fill="url(#deepGreen)" opacity="0.96"/>
  <text x="204" y="1244" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF">⚡ 快速建立</text>
  <text x="204" y="1268" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="16" fill="#D1FAE5">3 秒建立任務</text>
  <line x1="340" y1="1224" x2="340" y2="1270" stroke="#FFFFFF" opacity="0.45"/>
  <text x="540" y="1244" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF">✈ 輕鬆分享</text>
  <text x="540" y="1268" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="16" fill="#D1FAE5">一鍵分享給好友</text>
  <line x1="740" y1="1224" x2="740" y2="1270" stroke="#FFFFFF" opacity="0.45"/>
  <text x="875" y="1244" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF">▮ 自動統計</text>
  <text x="875" y="1268" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="16" fill="#D1FAE5">即時查看狀況</text>

  <text x="540" y="1310" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="26" font-weight="900" fill="#047857">接龍報名小助手</text>
  <text x="540" y="1338" text-anchor="middle" font-family="Noto Sans TC, Arial, sans-serif" font-size="18" fill="#64748B">讓團體報名更簡單・更有效率</text>
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
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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

function canShareFile(file) {
  return !!navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }));
}

function shouldUseShareSheet() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod|Line/i.test(ua);
}

export default function TaskShareImagePanel({ task, url, signupCount = 0, onToast }) {
  const status = taskStatus(task).label;
  const fileName = `${fileSafeName(task.title)}_分享圖片.png`;

  async function makeBlob() {
    const svg = await buildShareSvg(task, url, signupCount);
    return svgToPngBlob(svg);
  }

  async function shareBlob(blob, toastMessage = "已開啟圖片分享") {
    const file = new File([blob], fileName, { type: "image/png" });
    if (canShareFile(file)) {
      await navigator.share({ files: [file], title: task.title, text: "接龍報名小助手" });
      onToast?.(toastMessage);
      return true;
    }
    return false;
  }

  async function forceBrowserDownload(blob) {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }

  async function handleDownload() {
    try {
      const blob = await makeBlob();
      if (shouldUseShareSheet()) {
        const shared = await shareBlob(blob, "請在分享面板選擇「儲存圖片」");
        if (shared) return;
      }
      await forceBrowserDownload(blob);
      onToast?.("已下載分享圖片");
    } catch (e) {
      if (e?.name !== "AbortError") onToast?.(e.message || "圖片產生失敗");
    }
  }

  async function handleSystemShare() {
    try {
      const blob = await makeBlob();
      const shared = await shareBlob(blob, "已開啟圖片分享");
      if (!shared) {
        await forceBrowserDownload(blob);
        onToast?.("無法直接分享，已改為下載圖片");
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

      <div className="rounded-3xl overflow-hidden border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-3">
        <div className="relative mx-auto aspect-[4/5] max-h-[520px] w-full overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-50 via-white to-emerald-50 shadow-sm">
          <div className="absolute inset-x-0 top-0 px-5 pt-5 text-center">
            <p className="text-lg font-black text-emerald-700">接龍報名小助手</p>
            <p className="mt-1 text-[11px] font-semibold text-gray-500">快速建立・分享・統計報名</p>
          </div>
          <div className="absolute left-5 top-[88px] rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white">接龍任務</div>
          <div className="absolute left-5 top-[140px] right-5 text-center">
            <p className="line-clamp-2 text-3xl font-black leading-tight text-gray-900">{task.title}</p>
            <p className="mt-2 text-sm font-bold text-gray-600">{task.description || ""}</p>
          </div>
          <div className="absolute right-5 top-[250px] h-36 w-36 rounded-3xl bg-white shadow-md flex items-center justify-center">
            <QrCode size={92} className="text-gray-900" />
          </div>
          <div className="absolute left-5 right-5 top-[430px] rounded-full bg-emerald-600 py-3 text-center text-base font-black text-white shadow-md">
            📱 掃描 QR Code，立即完成報名！
          </div>
          <div className="absolute left-5 right-5 bottom-[86px] grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/90 p-3 text-center shadow-sm">
              <Users size={20} className="mx-auto mb-1 text-emerald-600" />
              <p className="text-[11px] font-bold text-gray-700">已報名</p>
              <p className="text-xl font-black text-emerald-700">{signupCount} 人</p>
            </div>
            <div className="rounded-2xl bg-white/90 p-3 text-center shadow-sm">
              <CalendarDays size={20} className="mx-auto mb-1 text-sky-600" />
              <p className="text-[11px] font-bold text-gray-700">期間</p>
              <p className="text-sm font-black text-gray-900">{formatDateRange(task)}</p>
            </div>
            <div className="rounded-2xl bg-white/90 p-3 text-center shadow-sm">
              <BadgeCheck size={20} className="mx-auto mb-1 text-emerald-600" />
              <p className="text-[11px] font-bold text-gray-700">狀態</p>
              <p className="text-lg font-black text-emerald-700">{status}</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-emerald-600 px-4 py-4 text-center text-white">
            <p className="text-base font-black">接龍報名小助手</p>
            <p className="mt-0.5 text-[11px] opacity-90">讓團體報名更簡單・更有效率</p>
          </div>
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
