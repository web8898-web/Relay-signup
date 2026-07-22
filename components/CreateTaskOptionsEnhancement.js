"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initLiff, liff } from "@/lib/liff";

const SINGLE_MARKER = "__relay_category_single__";
const MULTIPLE_MARKER = "__relay_category_multiple__";
const SHARE_ON_MARKER = "__relay_share_enabled__";
const SHARE_OFF_MARKER = "__relay_share_disabled__";
const BANNER_PREFIX = "__relay_banner_url__:";
const CATEGORY_MARKERS = new Set([SINGLE_MARKER, MULTIPLE_MARKER]);
const SHARE_MARKERS = new Set([SHARE_ON_MARKER, SHARE_OFF_MARKER]);

let categoryMode = "multiple";
let categoryRequired = false;
let shareEnabled = false;
let bannerUrl = "";
let bannerUploading = false;

function buttonClass(selected) {
  return `flex-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] ${
    selected
      ? "bg-emerald-500 text-white shadow-sm"
      : "bg-white text-gray-500 border border-gray-200"
  }`;
}

function helpText() {
  if (categoryMode === "single" && categoryRequired) return "每位報名者只能選擇一個類別，而且必須選擇。";
  if (categoryMode === "single") return "每位報名者最多選擇一個類別，也可以不選。";
  if (categoryRequired) return "每位報名者可以選擇多個類別，至少要選一個。";
  return "每位報名者可以選擇多個類別，也可以不選。";
}

function refreshOptionGroup(root) {
  root.querySelectorAll("button[data-category-mode]").forEach((button) => {
    button.className = buttonClass(button.dataset.categoryMode === categoryMode);
  });
  root.querySelectorAll("button[data-category-required]").forEach((button) => {
    const selected = button.dataset.categoryRequired === String(categoryRequired);
    button.className = buttonClass(selected);
  });
  const help = root.querySelector("[data-category-mode-help]");
  if (help) help.textContent = helpText();
}

function createOptionButton(label, dataName, value, root) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset[dataName] = String(value);
  button.addEventListener("click", () => {
    if (dataName === "categoryMode") categoryMode = value;
    else categoryRequired = value;
    refreshOptionGroup(root);
  });
  return button;
}

function mountCategoryMode() {
  if (document.querySelector("[data-create-category-mode]")) return;
  const title = [...document.querySelectorAll("p")].find(
    (element) => (element.textContent || "").trim() === "報名類別"
  );
  const field = title?.parentElement;
  if (!(field instanceof HTMLElement)) return;

  const root = document.createElement("div");
  root.dataset.createCategoryMode = "true";
  root.className = "mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3";

  const modeLabel = document.createElement("p");
  modeLabel.className = "mb-1.5 text-[11px] font-semibold text-emerald-700";
  modeLabel.textContent = "類別選擇方式";

  const modeGroup = document.createElement("div");
  modeGroup.className = "flex gap-2";
  modeGroup.appendChild(createOptionButton("單選", "categoryMode", "single", root));
  modeGroup.appendChild(createOptionButton("複選", "categoryMode", "multiple", root));

  const requiredLabel = document.createElement("p");
  requiredLabel.className = "mb-1.5 mt-3 text-[11px] font-semibold text-emerald-700";
  requiredLabel.textContent = "報名時是否必選";

  const requiredGroup = document.createElement("div");
  requiredGroup.className = "flex gap-2";
  requiredGroup.appendChild(createOptionButton("必須選", "categoryRequired", true, root));
  requiredGroup.appendChild(createOptionButton("可不選", "categoryRequired", false, root));

  const help = document.createElement("p");
  help.dataset.categoryModeHelp = "true";
  help.className = "mt-2 whitespace-nowrap text-[clamp(9px,2.55vw,11px)] leading-relaxed text-gray-400";

  root.append(modeLabel, modeGroup, requiredLabel, requiredGroup, help);
  title.insertAdjacentElement("afterend", root);
  refreshOptionGroup(root);
}

function mountShareToggle() {
  if (document.querySelector("[data-create-share-toggle]")) return;
  const advancedBody = [...document.querySelectorAll("div")].find((element) => {
    const className = String(element.className || "");
    return className.includes("border-t") && className.includes("border-emerald-100") &&
      (element.textContent || "").includes("任務模式");
  });
  if (!(advancedBody instanceof HTMLElement)) return;

  const root = document.createElement("div");
  root.dataset.createShareToggle = "true";
  root.className = "rounded-2xl border border-emerald-100 bg-emerald-50/40 px-3.5 py-3";

  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-3";

  const copy = document.createElement("div");
  copy.className = "min-w-0 flex-1";
  copy.innerHTML = `
    <p class="text-xs font-semibold text-emerald-700">接龍卡片顯示分享圖示</p>
    <p class="mt-0.5 whitespace-nowrap text-[clamp(9px,2.45vw,11px)] leading-relaxed text-gray-400">方便報名者將同一個接龍轉傳到其他群組。</p>
  `;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.setAttribute("role", "switch");
  toggle.setAttribute("aria-label", "接龍卡片顯示分享圖示");
  const refresh = () => {
    toggle.setAttribute("aria-checked", shareEnabled ? "true" : "false");
    toggle.className = `relative h-7 w-12 shrink-0 rounded-full transition ${shareEnabled ? "bg-emerald-500" : "bg-gray-200"}`;
    toggle.innerHTML = `<span class="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${shareEnabled ? "left-6" : "left-1"}"></span>`;
  };
  toggle.addEventListener("click", () => {
    shareEnabled = !shareEnabled;
    refresh();
  });
  refresh();

  row.append(copy, toggle);
  root.appendChild(row);
  advancedBody.appendChild(root);
}

async function compressBanner(file) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("無法讀取這張圖片"));
      image.src = objectUrl;
    });

    const targetWidth = 1200;
    const targetHeight = 630;
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("瀏覽器無法處理圖片");

    const scale = Math.max(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, (targetWidth - width) / 2, (targetHeight - height) / 2, width, height);

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("圖片壓縮失敗"))),
        "image/webp",
        0.82
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function renderBannerState(root, errorMessage = "") {
  const preview = root.querySelector("[data-banner-preview]");
  const empty = root.querySelector("[data-banner-empty]");
  const uploadButton = root.querySelector("[data-banner-upload-button]");
  const removeButton = root.querySelector("[data-banner-remove-button]");
  const status = root.querySelector("[data-banner-status]");

  if (preview instanceof HTMLImageElement) {
    preview.src = bannerUrl || "";
    preview.style.display = bannerUrl ? "block" : "none";
  }
  if (empty instanceof HTMLElement) empty.style.display = bannerUrl ? "none" : "flex";
  if (uploadButton instanceof HTMLButtonElement) {
    uploadButton.disabled = bannerUploading;
    uploadButton.textContent = bannerUploading ? "處理中…" : bannerUrl ? "更換圖片" : "上傳圖片";
  }
  if (removeButton instanceof HTMLElement) removeButton.style.display = bannerUrl ? "inline-flex" : "none";
  if (status instanceof HTMLElement) {
    status.textContent = errorMessage || (bannerUploading
      ? "正在裁切、壓縮並上傳圖片…"
      : bannerUrl
        ? "分享卡與接龍頁會自動使用這張圖片"
        : "建議使用清楚的橫式圖片，系統會自動裁切為 1200 × 630");
    status.className = `mt-2 text-[10px] ${errorMessage ? "text-rose-500" : "text-emerald-600"}`;
  }
}

function findTitleField() {
  const label = [...document.querySelectorAll("p")].find(
    (element) => (element.textContent || "").replace("*", "").trim() === "任務標題"
  );
  return label?.parentElement || null;
}

function mountBanner() {
  if (document.querySelector("[data-create-task-banner]")) return;
  const titleField = findTitleField();
  if (!(titleField instanceof HTMLElement)) return;

  const root = document.createElement("section");
  root.dataset.createTaskBanner = "true";
  root.className = "rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm";
  root.innerHTML = `
    <div class="mb-3">
      <div class="flex items-center gap-2">
        <p class="text-xs font-bold text-gray-700">活動橫幅圖</p>
        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">選填</span>
      </div>
      <p class="mt-1 whitespace-nowrap text-[clamp(9px,2.45vw,11px)] text-gray-400">顯示在接龍頁最上方，也會帶入分享卡片。</p>
    </div>
    <div class="relative aspect-[1200/630] overflow-hidden rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50">
      <img data-banner-preview alt="活動橫幅預覽" class="h-full w-full object-cover" style="display:none" />
      <div data-banner-empty class="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div class="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">🖼️</div>
        <p class="text-xs font-semibold text-emerald-700">加入活動橫幅圖</p>
        <p class="mt-1 text-[10px] text-gray-400">支援 JPG、PNG、WebP，原圖最多 8MB</p>
      </div>
    </div>
    <input data-banner-file type="file" accept="image/jpeg,image/png,image/webp" class="hidden" />
    <div class="mt-3 flex gap-2">
      <button data-banner-upload-button type="button" class="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white transition active:scale-[0.98]">上傳圖片</button>
      <button data-banner-remove-button type="button" class="hidden items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-500 transition active:scale-[0.98]">移除</button>
    </div>
    <p data-banner-status class="mt-2 text-[10px] text-emerald-600"></p>
  `;

  const fileInput = root.querySelector("[data-banner-file]");
  const uploadButton = root.querySelector("[data-banner-upload-button]");
  const removeButton = root.querySelector("[data-banner-remove-button]");

  uploadButton?.addEventListener("click", () => {
    if (!bannerUploading && fileInput instanceof HTMLInputElement) fileInput.click();
  });

  removeButton?.addEventListener("click", () => {
    bannerUrl = "";
    if (fileInput instanceof HTMLInputElement) fileInput.value = "";
    renderBannerState(root);
  });

  fileInput?.addEventListener("change", async () => {
    if (!(fileInput instanceof HTMLInputElement)) return;
    const file = fileInput.files?.[0];
    if (!file || bannerUploading) return;
    if (file.size > 8 * 1024 * 1024) {
      fileInput.value = "";
      renderBannerState(root, "原始圖片不能超過 8MB");
      return;
    }

    bannerUploading = true;
    renderBannerState(root);
    try {
      const blob = await compressBanner(file);
      await initLiff();
      const accessToken = liff.getAccessToken?.();
      if (!accessToken) throw new Error("請先使用 LINE 登入後再上傳圖片");

      const form = new FormData();
      form.append("file", new File([blob], "banner.webp", { type: "image/webp" }));
      const response = await fetch("/api/task-banner", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "圖片上傳失敗");
      bannerUrl = String(data.url || "");
      if (!bannerUrl) throw new Error("圖片上傳失敗");
      renderBannerState(root);
    } catch (error) {
      bannerUrl = "";
      renderBannerState(root, error.message || "圖片上傳失敗");
    } finally {
      bannerUploading = false;
      renderBannerState(root);
    }
  });

  titleField.insertAdjacentElement("afterend", root);
  renderBannerState(root);
}

function keepDescriptionsOnOneLine() {
  const targets = new Set([
    "預設一般報名即可；現場排隊適合需要邊報名邊處理的情境。",
    "需要調整任務模式、分類或統計數量時再設定，沒有需要可以略過。",
  ]);

  document.querySelectorAll("p").forEach((element) => {
    const text = (element.textContent || "").trim();
    if (!targets.has(text)) return;
    element.classList.add("whitespace-nowrap", "text-[clamp(9px,2.45vw,11px)]");
    element.classList.remove("text-[11px]");
  });
}

function enhanceTaskPayload(input, init = {}) {
  const url = typeof input === "string" ? input : input?.url || "";
  if (!url.includes("/api/tasks") || String(init?.method || "GET").toUpperCase() !== "POST") return init;
  if (typeof init.body !== "string") return init;

  try {
    const body = JSON.parse(init.body);
    const categories = Array.isArray(body.categories)
      ? body.categories.filter((item) => !CATEGORY_MARKERS.has(String(item)) && !SHARE_MARKERS.has(String(item)))
      : [];
    if (categories.length > 0) {
      const marker = categoryMode === "multiple" ? MULTIPLE_MARKER : SINGLE_MARKER;
      categories.push(marker);
      if (categoryRequired) categories.push(marker);
    }
    body.categories = categories;

    const cleanNote = String(body.note || "")
      .split(/\r?\n/)
      .filter((line) => !SHARE_MARKERS.has(line.trim()) && !line.trim().startsWith(BANNER_PREFIX))
      .join("\n")
      .trim();
    body.note = [
      cleanNote,
      shareEnabled ? SHARE_ON_MARKER : SHARE_OFF_MARKER,
      bannerUrl ? `${BANNER_PREFIX}${bannerUrl}` : "",
    ].filter(Boolean).join("\n");
    return { ...init, body: JSON.stringify(body) };
  } catch (error) {
    return init;
  }
}

export default function CreateTaskOptionsEnhancement() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/create") return;
    categoryMode = "multiple";
    categoryRequired = false;
    shareEnabled = false;
    bannerUrl = "";
    bannerUploading = false;

    const originalFetch = window.fetch;
    window.fetch = (input, init) => originalFetch(input, enhanceTaskPayload(input, init));

    let frame = 0;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        mountBanner();
        mountCategoryMode();
        mountShareToggle();
        keepDescriptionsOnOneLine();
      });
    };
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.fetch = originalFetch;
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.querySelectorAll("[data-create-task-banner], [data-create-category-mode], [data-create-share-toggle]").forEach((el) => el.remove());
      bannerUrl = "";
      bannerUploading = false;
    };
  }, [pathname]);

  return null;
}
