"use client";
import { useEffect, useRef, useState } from "react";
import { compressBanner } from "@/lib/compressBanner";
import { useLanguage } from "@/lib/useLanguage";

export default function TaskBannerField({ value, onChange, accessToken, onBusyChange }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [height, setHeight] = useState(0);
  const inner = useRef(null);
  const input = useRef(null);
  const active = useRef(true);
  const language = useLanguage();
  const en = language === "en";
  const t = (zh, english) => en ? english : zh;
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    const update = () => setHeight(inner.current?.scrollHeight || 0);
    update();
    const observer = new ResizeObserver(update);
    if (inner.current) observer.observe(inner.current);
    return () => observer.disconnect();
  }, []);

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    if (file.size > 8 * 1024 * 1024) return setError(t("原始圖片不能超過 8MB", "The original image must be under 8MB."));
    setBusy(true); onBusyChange(true); setError("");
    try {
      const blob = await compressBanner(file);
      const form = new FormData();
      form.append("file", new File([blob], "banner.webp", { type: "image/webp" }));
      const response = await fetch("/api/task-banner", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error("upload failed");
      if (active.current) onChange(data.url);
    } catch {
      if (active.current) setError(t("圖片上傳失敗，請再試一次", "Image upload failed. Please try again."));
    } finally {
      if (active.current) { setBusy(false); onBusyChange(false); }
    }
  }

  return (
    <section data-create-task-banner="true" data-banner-collapse-enhanced="true" data-no-auto-i18n="true" className="rounded-3xl border border-emerald-100 bg-white shadow-sm">
      <button type="button" className="task-banner-summary" data-tour="banner" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        <span className="task-banner-summary-copy">
          <span className="task-banner-summary-title-row"><span className="task-banner-summary-title">{t("活動橫幅圖", "Event Banner")}</span><span className="task-banner-summary-badge">{t("選填", "Optional")}</span></span>
          <span className="task-banner-summary-subtitle">{value ? t("已加入圖片，將顯示於接龍頁與分享卡", "Image added to signup page and share card") : t("讓接龍頁與分享卡更有辨識度", "Personalize your signup page and share card")}</span>
        </span>
        <span className="task-banner-summary-right">
          {value && <img src={value} alt="" className="task-banner-summary-thumb" style={{ display: "block" }} />}
          <span className="task-banner-summary-action">{expanded ? t("收起", "Collapse") : value ? t("編輯", "Edit") : t("＋ 新增圖片", "+ Add Image")}</span>
        </span>
      </button>
      <div className="task-banner-expandable" data-expanded={expanded} style={{ maxHeight: expanded ? height + 8 : 0, visibility: expanded ? "visible" : "hidden" }}>
        <div ref={inner} className="task-banner-expandable-inner">
          <div className="mb-3"><p className="text-[10px] font-medium text-emerald-600">{t("建議尺寸：1200 × 630 像素", "Recommended: 1200 × 630 pixels")}</p><p className="mt-1 text-[11px] text-gray-400">{t("顯示在接龍頁最上方，也會帶入分享卡片。", "Shown above the signup page and on share cards.")}</p></div>
          <div className="relative aspect-[1200/630] overflow-hidden rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50">
            {value ? <img data-banner-preview src={value} alt={t("活動橫幅預覽", "Event banner preview")} className="h-full w-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-center"><div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">🖼️</div><p className="text-xs font-semibold text-emerald-700">{t("加入活動橫幅圖", "Add an event banner")}</p><p className="mt-1 text-[10px] text-gray-400">JPG / PNG / WebP · 8MB</p></div>}
          </div>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={upload} />
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white transition active:scale-[0.98]">{busy ? t("處理中…", "Processing…") : value ? t("更換圖片", "Replace Image") : t("上傳圖片", "Upload Image")}</button>
            {value && <button type="button" disabled={busy} onClick={() => { onChange(""); setError(""); }} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-500">{t("移除", "Remove")}</button>}
          </div>
          <p className={`mt-2 text-[10px] ${error ? "text-rose-500" : "text-emerald-600"}`}>{error || (busy ? t("正在裁切、壓縮並上傳圖片…", "Cropping, compressing and uploading…") : value ? t("分享卡與接龍頁會自動使用這張圖片", "The signup page and share card will use this image.") : t("系統會自動裁切為 1200 × 630", "Images are cropped to 1200 × 630."))}</p>
        </div>
      </div>
    </section>
  );
}
