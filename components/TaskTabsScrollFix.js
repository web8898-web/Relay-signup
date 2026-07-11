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

  let current = createButton.parentElement;
  while (current && current !== document.body) {
    if (current.contains(listButton)) {
      const classes = String(current.className || "");
      if (classes.includes("rounded") || classes.includes("grid") || classes.includes("flex")) {
        return current;
      }
    }
    current = current.parentElement;
  }
  return null;
}

function ensureStyles() {
  const styleId = "relay-task-tabs-scroll-fix-styles";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .relay-task-tabs-in-scroll {
      position: static !important;
      inset: auto !important;
      top: auto !important;
      z-index: auto !important;
      width: 100% !important;
      margin: 0.25rem 0 0.75rem !important;
      flex-shrink: 0 !important;
    }
  `;
  document.head.appendChild(style);
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

    const scheduleApply = () => window.requestAnimationFrame(apply);
    scheduleApply();
    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", scheduleApply);

    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", scheduleApply);
      restore();
    };
  }, []);

  return null;
}
