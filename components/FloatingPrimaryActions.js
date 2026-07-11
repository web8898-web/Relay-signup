"use client";

import { useEffect } from "react";

function isTopNavigation(element) {
  return Boolean(element.closest("header, nav, [data-top-bar], .sticky.top-0, .fixed.top-0"));
}

function hasPrimaryButton(wrapper) {
  const button = wrapper.querySelector(":scope > button, :scope > a, :scope > div > button, :scope > div > a");
  if (!(button instanceof HTMLElement)) return false;
  const classes = String(button.className || "");
  return classes.includes("w-full") && classes.includes("rounded-full");
}

function applyFloatingActions() {
  const pathname = window.location.pathname;

  document.querySelectorAll(".relay-floating-task-actions,.relay-floating-primary-actions,.relay-task-list-scroll").forEach((element) => {
    if (element instanceof HTMLElement) {
      element.classList.remove("relay-floating-task-actions", "relay-floating-primary-actions", "relay-task-list-scroll");
    }
  });

  if (pathname.startsWith("/my-tasks") && !pathname.includes("/edit")) {
    const page = Array.from(document.querySelectorAll(".flex-1.flex.flex-col.relative.min-w-0")).find((element) =>
      element.querySelector("button")?.textContent?.includes("新增任務")
    );

    if (page instanceof HTMLElement) {
      const scrollArea = page.querySelector(":scope > .flex-1.overflow-y-auto");
      const actionBar = Array.from(page.children).find((element) =>
        element instanceof HTMLElement && element.textContent?.includes("新增任務")
      );

      if (scrollArea instanceof HTMLElement) scrollArea.classList.add("relay-task-list-scroll");
      if (actionBar instanceof HTMLElement) actionBar.classList.add("relay-floating-task-actions");
    }
  }

  const candidates = new Set([
    ...document.querySelectorAll('[data-tour="save"]'),
    ...document.querySelectorAll(".px-6.pb-6.pt-2"),
  ]);

  candidates.forEach((wrapper) => {
    if (!(wrapper instanceof HTMLElement)) return;
    if (wrapper.classList.contains("relay-floating-task-actions")) return;
    if (isTopNavigation(wrapper)) return;
    if (!hasPrimaryButton(wrapper)) return;
    wrapper.classList.add("relay-floating-primary-actions");
  });
}

function ensureStyles() {
  if (document.getElementById("relay-floating-primary-actions-styles")) return;
  const style = document.createElement("style");
  style.id = "relay-floating-primary-actions-styles";
  style.textContent = `
    .relay-floating-task-actions{
      position:absolute!important;
      left:0!important;
      right:0!important;
      bottom:0!important;
      z-index:40!important;
      padding:.7rem 1.5rem calc(.75rem + env(safe-area-inset-bottom))!important;
      background:linear-gradient(to top,rgba(255,255,255,1) 68%,rgba(255,255,255,.94) 82%,rgba(255,255,255,0))!important;
      border-top:0!important;
      box-shadow:none!important;
      pointer-events:none;
    }
    .relay-floating-task-actions>*{pointer-events:auto}
    .relay-floating-task-actions button,
    .relay-floating-task-actions a{
      box-shadow:0 12px 24px -12px rgba(16,185,129,.42)!important;
      transition:transform 180ms cubic-bezier(.22,.8,.3,1),box-shadow 180ms ease,background-color 180ms ease!important;
    }
    .relay-floating-task-actions button:active,
    .relay-floating-task-actions a:active{transform:translateY(1px) scale(.985)!important}

    .relay-task-list-scroll{
      padding-bottom:calc(7rem + env(safe-area-inset-bottom))!important;
      scroll-padding-bottom:calc(7rem + env(safe-area-inset-bottom));
    }

    .relay-floating-primary-actions{
      position:sticky!important;
      left:0!important;
      right:0!important;
      bottom:0!important;
      z-index:35!important;
      margin-top:.75rem!important;
      padding:.7rem 1.5rem calc(.75rem + env(safe-area-inset-bottom))!important;
      background:linear-gradient(to top,rgba(255,255,255,1) 72%,rgba(255,255,255,.94) 86%,rgba(255,255,255,0))!important;
      border-top:0!important;
      box-shadow:none!important;
    }
    .relay-floating-primary-actions button,
    .relay-floating-primary-actions a{
      box-shadow:0 12px 24px -12px rgba(16,185,129,.38)!important;
      transition:transform 180ms cubic-bezier(.22,.8,.3,1),box-shadow 180ms ease,background-color 180ms ease!important;
    }
    .relay-floating-primary-actions button:active,
    .relay-floating-primary-actions a:active{transform:translateY(1px) scale(.985)!important}

    @media(prefers-reduced-motion:reduce){
      .relay-floating-task-actions button,
      .relay-floating-task-actions a,
      .relay-floating-primary-actions button,
      .relay-floating-primary-actions a{transition-duration:1ms!important}
    }
  `;
  document.head.appendChild(style);
}

export default function FloatingPrimaryActions() {
  useEffect(() => {
    ensureStyles();
    const apply = () => window.requestAnimationFrame(applyFloatingActions);
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", apply);
    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", apply);
    };
  }, []);

  return null;
}
