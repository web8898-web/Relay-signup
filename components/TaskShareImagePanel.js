"use client";

import { Download, Image as ImageIcon, Share2 } from "lucide-react";

function safeText(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .slice(0, 80);
}

function buildShareSvg(task, url, signupCount = 0) {
  const title = safeText(task.title || "接龍報名");
  const date = safeText(`${task.start_date || "未設定"} ~ ${task.end_date || "未設定"}`);
  const desc = safeText(task.description || "點擊連結即可完成報名");
  const link = safeText(url);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E8F8F0"/>
      <stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#0F172A" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1030" cy="120" r="150" fill="#55B786" opacity="0.13"/>
  <circle cx="120" cy="530" r="130" fill="#55B786" opacity="0.10"/>
  <rect x="120" y="86" width="960" height="458" rx="54" fill="#FFFFFF" filter="url(#shadow)"/>
  <rect x="170" y="136" width="86" height="86" rx="28" fill="#55B786"/>
  <path d="M198 178c0-18 14-32 32-32s32 14 32 32-14 32-32 32h-18l-18 15 4-17c-10-6-16-17-16-30z" fill="#FFFFFF" opacity="0.96"/>
  <text x="285" y="168" font-family="Noto Sans TC, Arial, sans-serif" font-size="30" font-weight="700" fill="#16946A">接龍報名小助手</text>
  <text x="285" y="207" font-family="Noto Sans TC, Arial, sans-serif" font-size="22" fill="#94A3B8">快速建立、分享、統計報名</text>
  <text x="170" y="306" font-family="Noto Sans TC, Arial, sans-serif" font-size="48" font-weight="800" fill="#1F2937">${title}</text>
  <text x="170" y="362" font-family="Noto Sans TC, Arial, sans-serif" font-size="24" fill="#64748B">${desc}</text>
  <rect x="170" y="405" width="360" height="56" rx="28" fill="#E8F8F0"/>
  <text x="198" y="442" font-family="Noto Sans TC, Arial, sans-serif" font-size="22" font-weight="700" fill="#16946A">${signupCount} 人已報名</text>
  <text x="560" y="442" font-family="Noto Sans TC, Arial, sans-serif" font-size="22" fill="#64748B">${date}</text>
  <rect x="170" y="488" width="860" height="1" fill="#E5E7EB"/>
  <text x="170" y="522" font-family="Arial, sans-serif" font-size="20" fill="#94A3B8">${link}</text>
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
  async function makeBlob() {
    const svg = buildShareSvg(task, url, signupCount);
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
          <p className="text-[11px] text-gray-400">可下載成圖片，傳到 LINE 群組或貼在社群。</p>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden border border-emerald-100 bg-emerald-50/60 p-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] text-emerald-600 font-semibold">接龍報名小助手</p>
          <p className="text-lg font-bold text-gray-800 mt-1 line-clamp-2">{task.title}</p>
          <p className="text-xs text-gray-400 mt-2">{task.start_date} ~ {task.end_date}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs bg-emerald-50 text-emerald-600 rounded-full px-2.5 py-1 font-semibold">{signupCount} 人已報名</span>
            <span className="text-[11px] text-gray-300 truncate">接龍報名</span>
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
