"use client";

import { useEffect } from "react";

const SCROLL_SELECTOR = ".flex-1.px-6.py-3.flex.flex-col.gap-3.overflow-y-auto";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function findTaskTabs() {
  const controls = Array.from(document.querySelectorAll("button,a"));
  const createButton = controls.find((element) => normalizeText(element.textContent) === "建立任務");
  const listButton = controls.find((element) => normalizeText(element.textContent) === "任務清單");
  if (!(createButton instanceof HTMLElement) || !(listButton instanceof HTMLElement)) return null;

  // Find the real shared tab-bar wrapper. The previous implementation could
  // accidentally select only one active pill, which caused the large oval
  // distortion shown on mobile.
  let current = createButton.parentElement;
  while (current && current !== document.body) {
    if (current.contains(listButton)) {
      const matchingControls = Array.from(current.querySelectorAll("button,a")).filter((element) => {
        const text = normalizeText(element.textContent);
        return text === "建立任務" || text === "任務清單";
      });

      if (matchingControls.includes(createButton) && matchingControls.includes(listButton)) {
        return current;
      }
    }
    current = current.parentElement;
  }

  return null;
}

function ensureStyles() {
  const styleId = "relay-task-tabs-scroll-fix-styles";
  let style = document.getElementById(styleId);
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.textContent = `
    .relay-task-tabs-in-scroll {
      position: static !important;
      inset: auto !important;
      top: auto !important;
      left: auto !important;
      right: auto !important;
      z-index: auto !important;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0.25rem 0 0.75rem !important;
      transform: none !important;
      flex-shrink: 0 !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .relay-task-tabs-in-scroll > * {
      min-width: 0 !important;
      max-width: 50% !important;
      transform: none !important;
    }
  `;
}

export default function TaskTabsScrollFix() {
  useEffect(() => {
    ensureStyles();
    let movedTabs = null;
    let originalParent = null;
    let originalNextSibling = null;

    const restore = () => {
      if (!movedTabs || !originalParent || !document.contains(originalParent)) return;
      movedTabs.classList.remove("relay-task-tabs-in-scroll");
      if (originalNextSibling && originalNextSibling.parentElement === originalParent) {
        originalParent.insertBefore(movedTabs, originalNextSibling);
      } else {
        originalParent.appendChild(movedTabs);
      }
      movedTabs = null;
      originalParent = null;
      originalNextSibling = null;
    };

    const apply = () => {
      if (window.location.pathname !== "/my-tasks") {
        restore();
        return;
      }

      const scrollArea = document.querySelector(SCROLL_SELECTOR);
      const tabs = findTaskTabs();
      if (!(scrollArea instanceof HTMLElement) || !(tabs instanceof HTMLElement)) return;
      if (scrollArea.contains(tabs)) return;

      restore();
      originalParent = tabs.parentElement;
      originalNextSibling = tabs.nextSibling;
      movedTabs = tabs;
      tabs.classList.add("relay-task-tabs-in-scroll");
      scrollArea.insertBefore(tabs, scrollArea.firstChild);
    };

    let frame = 0;
    const scheduleApply = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(apply);
    };

    scheduleApply();
    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", scheduleApply);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("popstate", scheduleApply);
      restore();
    };
  }, []);

  return null;
}
