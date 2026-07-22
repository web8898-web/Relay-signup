"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function ensureStyles() {
  if (document.getElementById("create-task-banner-collapse-styles")) return;
  const style = document.createElement("style");
  style.id = "create-task-banner-collapse-styles";
  style.textContent = `
    [data-create-task-banner][data-banner-collapse-enhanced="true"]{padding:0!important;overflow:hidden}
    .task-banner-summary{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;text-align:left;background:#fff;touch-action:manipulation;transition:background-color 160ms ease,transform 120ms ease}
    .task-banner-summary:active{background:#ecfdf5;transform:scale(.992)}
    .task-banner-summary-copy{min-width:0;flex:1}
    .task-banner-summary-title-row{display:flex;align-items:center;gap:8px}
    .task-banner-summary-title{font-size:13px;font-weight:800;color:#374151}
    .task-banner-summary-badge{border-radius:999px;background:#f3f4f6;padding:2px 8px;font-size:10px;color:#9ca3af}
    .task-banner-summary-subtitle{margin-top:3px;white-space:nowrap;font-size:clamp(9px,2.55vw,11px);color:#9ca3af}
    .task-banner-summary-right{display:flex;align-items:center;gap:9px;flex-shrink:0}
    .task-banner-summary-thumb{width:44px;height:30px;border-radius:9px;object-fit:cover;border:1px solid #d1fae5;box-shadow:0 4px 10px rgba(5,150,105,.12);display:none}
    .task-banner-summary-add{display:flex;width:30px;height:30px;align-items:center;justify-content:center;border-radius:999px;background:#ecfdf5;color:#10b981;font-size:20px;line-height:1}
    .task-banner-summary-chevron{font-size:18px;line-height:1;color:#10b981;transition:transform 260ms cubic-bezier(.22,.8,.3,1)}
    .task-banner-summary[aria-expanded="true"] .task-banner-summary-chevron{transform:rotate(180deg)}
    .task-banner-expandable{max-height:0;overflow:hidden;opacity:0;border-top:1px solid transparent;transition:max-height 420ms cubic-bezier(.22,.8,.3,1),opacity 220ms ease,border-color 220ms ease}
    .task-banner-expandable[data-expanded="true"]{opacity:1;border-top-color:#d1fae5}
    .task-banner-expandable-inner{padding:14px 16px 16px}
    .task-banner-expandable-inner>div:first-child>div:first-child{display:none!important}
    .task-banner-expandable-inner>div:first-child{margin-bottom:10px!important}
    @media(prefers-reduced-motion:reduce){.task-banner-summary,.task-banner-summary-chevron,.task-banner-expandable{transition-duration:1ms!important}}
  `;
  document.head.appendChild(style);
}

function enhanceBanner(section) {
  if (!(section instanceof HTMLElement) || section.dataset.bannerCollapseEnhanced === "true") return;
  section.dataset.bannerCollapseEnhanced = "true";

  const originalChildren = [...section.childNodes];
  const summary = document.createElement("button");
  summary.type = "button";
  summary.className = "task-banner-summary";
  summary.setAttribute("aria-expanded", "false");
  summary.innerHTML = `
    <span class="task-banner-summary-copy">
      <span class="task-banner-summary-title-row">
        <span class="task-banner-summary-title">活動橫幅圖</span>
        <span class="task-banner-summary-badge">選填</span>
      </span>
      <span data-banner-summary-subtitle class="task-banner-summary-subtitle">讓接龍頁與分享卡更有辨識度</span>
    </span>
    <span class="task-banner-summary-right">
      <img data-banner-summary-thumb class="task-banner-summary-thumb" alt="已加入的活動橫幅縮圖" />
      <span data-banner-summary-add class="task-banner-summary-add">＋</span>
      <span class="task-banner-summary-chevron">⌄</span>
    </span>
  `;

  const expandable = document.createElement("div");
  expandable.className = "task-banner-expandable";
  expandable.dataset.expanded = "false";
  const inner = document.createElement("div");
  inner.className = "task-banner-expandable-inner";
  originalChildren.forEach((node) => inner.appendChild(node));
  expandable.appendChild(inner);
  section.append(summary, expandable);

  let expanded = false;

  const updateHeight = () => {
    expandable.style.maxHeight = expanded ? `${inner.scrollHeight + 8}px` : "0px";
  };

  const setExpanded = (next) => {
    expanded = next;
    summary.setAttribute("aria-expanded", String(expanded));
    expandable.dataset.expanded = String(expanded);
    updateHeight();
  };

  const updateSummary = () => {
    const preview = section.querySelector("[data-banner-preview]");
    const thumb = summary.querySelector("[data-banner-summary-thumb]");
    const add = summary.querySelector("[data-banner-summary-add]");
    const subtitle = summary.querySelector("[data-banner-summary-subtitle]");
    const src = preview instanceof HTMLImageElement ? preview.getAttribute("src") || "" : "";
    const visible = preview instanceof HTMLImageElement && preview.style.display !== "none" && Boolean(src);

    if (thumb instanceof HTMLImageElement) {
      thumb.src = visible ? src : "";
      thumb.style.display = visible ? "block" : "none";
    }
    if (add instanceof HTMLElement) add.style.display = visible ? "none" : "flex";
    if (subtitle instanceof HTMLElement) {
      subtitle.textContent = visible
        ? "已加入圖片，將顯示於接龍頁與分享卡"
        : "讓接龍頁與分享卡更有辨識度";
    }
    updateHeight();
  };

  summary.addEventListener("click", () => setExpanded(!expanded));

  const observer = new MutationObserver(() => requestAnimationFrame(updateSummary));
  observer.observe(section, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "style"],
  });

  section._bannerCollapseObserver = observer;
  updateSummary();
  setExpanded(false);
}

export default function CreateTaskBannerCollapse() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/create") return;
    ensureStyles();

    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const section = document.querySelector("[data-create-task-banner]");
        if (section instanceof HTMLElement) enhanceBanner(section);
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.querySelectorAll("[data-create-task-banner]").forEach((section) => {
        section._bannerCollapseObserver?.disconnect?.();
      });
    };
  }, [pathname]);

  return null;
}
