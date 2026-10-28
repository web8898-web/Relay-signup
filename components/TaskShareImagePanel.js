"use client";

import { buildShareSvg, IMAGE_WIDTH, IMAGE_HEIGHT, fileSafeName, formatDateRange, taskLabel } from "@/lib/shareImage";
import { useLanguage } from "@/lib/useLanguage";
import { Image as ImageIcon, Share2, QrCode, Users, CalendarDays, BadgeCheck } from "lucide-react";
import { isQueueTask, taskStatus, getVisibleTaskNote } from "@/lib/utils";

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
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Unable to generate image"))), "image/png", 1);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to generate image"));
    };
    img.src = objectUrl;
  });
}

function shouldUseServerDownload() {
  if (typeof navigator === "undefined") return false;
  return /Android|Line\/|LIFF/i.test(navigator.userAgent || "");
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("圖片下載準備失敗"));
    reader.readAsDataURL(blob);
  });
}

export default function TaskShareImagePanel({ task, url, signupCount = 0, onToast }) {
  const language = useLanguage();
  const en = language === "en";
  const t = (zh, english) => en ? english : zh;
  const queue = isQueueTask(task);
  const status = taskLabel(taskStatus(task).label || "進行中");

  async function makeBlob() {
    return svgToPngBlob(await buildShareSvg(task, url, signupCount, language));
  }

  async function shareBlob(blob, toastMessage = t("已開啟圖片分享", "Image share opened")) {
    const file = new File([blob], `${fileSafeName(task.title)}_${en ? "share" : "分享圖片"}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: task.title, text: t("接龍報名小助手", "Relay Signup Assistant") });
      onToast?.(toastMessage);
      return true;
    }
    return false;
  }

  async function fallbackDownload(blob) {
    const filename = `${fileSafeName(task.title)}_${en ? "share" : "分享圖片"}.png`;

    if (shouldUseServerDownload()) {
      const dataUrl = await blobToDataUrl(blob);
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/share-image-download";
      form.target = "_self";
      form.style.display = "none";

      const dataInput = document.createElement("input");
      dataInput.type = "hidden";
      dataInput.name = "data";
      dataInput.value = dataUrl;

      const nameInput = document.createElement("input");
      nameInput.type = "hidden";
      nameInput.name = "filename";
      nameInput.value = filename;

      form.append(dataInput, nameInput);
      document.body.appendChild(form);
      form.submit();
      setTimeout(() => form.remove(), 1500);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
  }

  async function handleSystemShare() {
    let blob;
    try {
      blob = await makeBlob();
    } catch {
      onToast?.(t("圖片產生失敗，請再試一次", "Unable to generate the image. Please try again."));
      return;
    }
    try {
      if (await shareBlob(blob, t("已開啟分享選單", "Share menu opened"))) return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
    try {
      await fallbackDownload(blob);
      onToast?.(t("正在下載分享圖片", "Downloading image"));
    } catch {
      onToast?.(t("圖片下載失敗，請再試一次", "Unable to download the image. Please try again."));
    }
  }

  return (
    <div data-no-auto-i18n="true" className="mt-5 bg-white border border-gray-100 rounded-[28px] p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><ImageIcon size={16} /></div>
        <div>
          <p className="text-sm font-bold text-gray-700">{t("分享圖片", "Share Image")}</p>
          <p className="text-[11px] text-gray-400">{t("簡介與備註會一併顯示在分享圖片上。", "Descriptions and notes are included in the image.")}</p>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-emerald-600 font-semibold">{t("接龍報名小助手", "Relay Signup Assistant")}</p>
              <p className="text-lg font-bold text-gray-800 mt-1 line-clamp-2">{task.title}</p>
              {task.description && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{t("簡介：", "Description: ")}{task.description}</p>}
              {getVisibleTaskNote(task.note) && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t("備註：", "Notes: ")}{getVisibleTaskNote(task.note)}</p>}
              <p className="text-xs text-gray-400 mt-2">{formatDateRange(task)}</p>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-white border border-gray-100 p-1.5 shrink-0 shadow-sm flex items-center justify-center"><QrCode size={44} className="text-gray-800" /></div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-4">
            <div className="rounded-2xl bg-emerald-50 px-2 py-2"><Users size={13} className="text-emerald-600 mb-1" /><p className="text-[10px] text-emerald-600 font-semibold">{queue ? t("等待中", "Waiting") : t("已報名", "Registered")}</p><p className="text-xs font-bold text-emerald-700">{signupCount}{en ? "" : " 人"}</p></div>
            <div className="rounded-2xl bg-gray-50 px-2 py-2"><CalendarDays size={13} className="text-gray-500 mb-1" /><p className="text-[10px] text-gray-500 font-semibold">{t("期間", "Dates")}</p><p className="text-xs font-bold text-gray-700 truncate">{formatDateRange(task)}</p></div>
            <div className="rounded-2xl bg-gray-50 px-2 py-2"><BadgeCheck size={13} className="text-emerald-600 mb-1" /><p className="text-[10px] text-gray-500 font-semibold">{t("狀態", "Status")}</p><p className="text-xs font-bold text-emerald-700">{en ? ({"已截止":"Closed","已額滿":"Full","進行中":"Active","尚未開始":"Not Started"}[status] || status) : status}</p></div>
          </div>

          <p className="text-[11px] text-emerald-600 font-semibold mt-3 text-center">📱 {en ? (queue ? "Scan to join the queue" : "Scan to sign up") : `掃描 QR Code，${queue ? "立即加入排隊" : "立即完成報名"}`}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 mt-3">
        <button onClick={handleSystemShare} className="bg-emerald-500 text-white rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-100"><Share2 size={15} /> {t("分享／儲存圖片", "Share / Save Image")}</button>
      </div>
    </div>
  );
}
