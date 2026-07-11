"use client";

import { useEffect } from "react";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function findBottomActionContainer(button) {
  let current = button;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const rect = current.getBoundingClientRect();
    const text = normalizeText(current.textContent).replace(/^[＋+]/, "");
    const isBottomLayer = style.position === "fixed" || style.position === "sticky";
    const containsOnlyAction = text === "新增任務";
    const spansPageWidth = rect.width >= Math.min(window.innerWidth * 0.75, 320);

    if (containsOnlyAction && (isBottomLayer || spansPageWidth)) {
      return current;
    }

    current = current.parentElement;
  }

  return button;
}

export default function TaskListBottomActionFix() {
  useEffect(() => {
    let hiddenElement = null;
    const styleId = "relay-task-list-bottom-action-fix";

    const ensureStyles = () => {
      let style = document.getElementById(styleId);
      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }

      style.textContent = `
        body[data-relay-task-bottom-action-hidden="true"]
          .flex-1.px-6.py-3.flex.flex-col.gap-3.overflow-y-auto {
          padding-bottom: calc(1rem + env(safe-area-inset-bottom)) !important;
          scroll-padding-bottom: calc(1rem + env(safe-area-inset-bottom)) !important;
        }
      `;
    };

    const restore = () => {
      if (hiddenElement instanceof HTMLElement) {
        hiddenElement.style.removeProperty("display");
        hiddenElement.removeAttribute("data-relay-hidden-bottom-action");
      }
      hiddenElement = null;
      document.body.removeAttribute("data-relay-task-bottom-action-hidden");
    };

    const apply = () => {
      if (window.location.pathname !== "/my-tasks") {
        restore();
        return;
      }

      ensureStyles();

      const candidates = Array.from(document.querySelectorAll("button,a"));
      const target = candidates.find((element) => {
        const text = normalizeText(element.textContent).replace(/^[＋+]/, "");
        return text === "新增任務";
      });

      if (!(target instanceof HTMLElement)) {
        document.body.removeAttribute("data-relay-task-bottom-action-hidden");
        return;
      }

      const container = findBottomActionContainer(target);
      if (hiddenElement && hiddenElement !== container) restore();

      hiddenElement = container;
      hiddenElement.style.setProperty("display", "none", "important");
      hiddenElement.setAttribute("data-relay-hidden-bottom-action", "true");
      document.body.setAttribute("data-relay-task-bottom-action-hidden", "true");
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
    window.addEventListener("resize", scheduleApply);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("popstate", scheduleApply);
      window.removeEventListener("resize", scheduleApply);
      restore();
    };
  }, []);

  return null;
}
