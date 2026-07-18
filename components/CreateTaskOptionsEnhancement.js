"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SINGLE_MARKER = "__relay_category_single__";
const MULTIPLE_MARKER = "__relay_category_multiple__";
const SHARE_ON_MARKER = "__relay_share_enabled__";
const SHARE_OFF_MARKER = "__relay_share_disabled__";
const CATEGORY_MARKERS = new Set([SINGLE_MARKER, MULTIPLE_MARKER]);
const SHARE_MARKERS = new Set([SHARE_ON_MARKER, SHARE_OFF_MARKER]);

let categoryMode = "multiple";
let shareEnabled = false;

function buttonClass(selected) {
  return `flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
    selected
      ? "bg-emerald-500 text-white shadow-sm"
      : "bg-white text-gray-500 border border-gray-200"
  }`;
}

function createSegmentButton(label, value, group) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.value = value;
  button.className = buttonClass(categoryMode === value);
  button.addEventListener("click", () => {
    categoryMode = value;
    group.querySelectorAll("button[data-value]").forEach((item) => {
      item.className = buttonClass(item.dataset.value === categoryMode);
    });
    const help = group.parentElement?.querySelector("[data-category-mode-help]");
    if (help) help.textContent = categoryMode === "single"
      ? "每位報名者只能選擇一個類別。"
      : "每位報名者可以同時選擇多個類別。";
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

  const heading = document.createElement("p");
  heading.className = "mb-2 text-[11px] font-semibold text-emerald-700";
  heading.textContent = "類別選擇方式";

  const group = document.createElement("div");
  group.className = "flex gap-2";
  group.appendChild(createSegmentButton("單選", "single", group));
  group.appendChild(createSegmentButton("複選", "multiple", group));

  const help = document.createElement("p");
  help.dataset.categoryModeHelp = "true";
  help.className = "mt-2 whitespace-nowrap text-[clamp(9px,2.55vw,11px)] leading-relaxed text-gray-400";
  help.textContent = "每位報名者可以同時選擇多個類別。";

  root.append(heading, group, help);
  title.insertAdjacentElement("afterend", root);
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
      categories.push(categoryMode === "multiple" ? MULTIPLE_MARKER : SINGLE_MARKER);
    }
    body.categories = categories;

    const cleanNote = String(body.note || "")
      .split(/\r?\n/)
      .filter((line) => !SHARE_MARKERS.has(line.trim()))
      .join("\n")
      .trim();
    body.note = [cleanNote, shareEnabled ? SHARE_ON_MARKER : SHARE_OFF_MARKER].filter(Boolean).join("\n");
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
    shareEnabled = false;

    const originalFetch = window.fetch;
    window.fetch = (input, init) => originalFetch(input, enhanceTaskPayload(input, init));

    let frame = 0;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
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
      document.querySelectorAll("[data-create-category-mode], [data-create-share-toggle]").forEach((el) => el.remove());
    };
  }, [pathname]);

  return null;
}
