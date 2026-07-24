"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function ensureStyles() {
  if (document.getElementById("task-mode-help-collapse-fix-styles")) return;
  const style = document.createElement("style");
  style.id = "task-mode-help-collapse-fix-styles";
  style.textContent = `
    .task-mode-help-card[data-help-collapsed-enhanced="true"]{padding:0!important;overflow:hidden}
    .task-mode-help-summary{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px;text-align:left;background:transparent;touch-action:manipulation;transition:background-color 160ms ease,transform 120ms ease}
    .task-mode-help-summary:active{background:#eafaf2;transform:scale(.992)}
    .task-mode-help-summary-title{font-size:14px;font-weight:800;color:#256b55}
    .task-mode-help-summary-action{flex-shrink:0;border-radius:999px;background:#eafaf2;padding:7px 12px;font-size:11px;font-weight:800;color:#16946a}
    .task-mode-help-collapsible{max-height:0;overflow:hidden;opacity:0;border-top:1px solid transparent;transition:max-height 420ms cubic-bezier(.22,.8,.3,1),opacity 220ms ease,border-color 220ms ease}
    .task-mode-help-collapsible[data-expanded="true"]{opacity:1;border-top-color:#d9f1e5}
    .task-mode-help-collapsible-inner{padding:12px 14px 14px}
    @media(prefers-reduced-motion:reduce){.task-mode-help-summary,.task-mode-help-collapsible{transition-duration:1ms!important}}
  `;
  document.head.appendChild(style);
}

function enhanceCard(card) {
  if (!(card instanceof HTMLElement) || card.dataset.helpCollapsedEnhanced === "true") return;
  const originalTitle = card.querySelector(".task-mode-help-title");
  const grid = card.querySelector(".task-mode-help-grid");
  const tip = card.querySelector(".task-mode-help-tip");
  if (!(grid instanceof HTMLElement) || !(tip instanceof HTMLElement)) return;

  card.dataset.helpCollapsedEnhanced = "true";
  originalTitle?.remove();

  const summary = document.createElement("button");
  summary.type = "button";
  summary.className = "task-mode-help-summary";
  summary.setAttribute("aria-expanded", "false");
  summary.innerHTML = `
    <span class="task-mode-help-summary-title">📖 不知道怎麼選？</span>
    <span data-task-mode-help-action class="task-mode-help-summary-action">展開閱讀</span>
  `;

  const collapsible = document.createElement("div");
  collapsible.className = "task-mode-help-collapsible";
  collapsible.dataset.expanded = "false";
  const inner = document.createElement("div");
  inner.className = "task-mode-help-collapsible-inner";
  inner.append(grid, tip);
  collapsible.appendChild(inner);
  card.prepend(summary);
  card.appendChild(collapsible);

  let expanded = false;
  const refresh = () => {
    summary.setAttribute("aria-expanded", String(expanded));
    collapsible.dataset.expanded = String(expanded);
    collapsible.style.maxHeight = expanded ? `${inner.scrollHeight + 8}px` : "0px";
    const action = summary.querySelector("[data-task-mode-help-action]");
    if (action) action.textContent = expanded ? "收起" : "展開閱讀";
  };

  summary.addEventListener("click", () => {
    expanded = !expanded;
    refresh();
  });
  const observer = new ResizeObserver(refresh);
  observer.observe(inner);
  card._taskModeHelpResizeObserver = observer;
  refresh();
}

export default function TaskModeHelpCollapseFix() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/create") return;
    ensureStyles();

    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.querySelectorAll(".task-mode-help-card").forEach(enhanceCard);
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.querySelectorAll(".task-mode-help-card").forEach((card) => {
        card._taskModeHelpResizeObserver?.disconnect?.();
      });
    };
  }, [pathname]);

  return null;
}
