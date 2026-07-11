"use client";

import { useEffect } from "react";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

export default function TaskListBottomActionFix() {
  useEffect(() => {
    let hiddenButton = null;

    const restore = () => {
      if (hiddenButton instanceof HTMLElement) {
        hiddenButton.style.removeProperty("display");
        hiddenButton.removeAttribute("data-relay-hidden-bottom-action");
      }
      hiddenButton = null;
    };

    const apply = () => {
      if (window.location.pathname !== "/my-tasks") {
        restore();
        return;
      }

      const candidates = Array.from(document.querySelectorAll("button,a"));
      const target = candidates.find((element) => {
        const text = normalizeText(element.textContent).replace(/^[＋+]/, "");
        return text === "新增任務";
      });

      if (!(target instanceof HTMLElement)) return;
      if (hiddenButton && hiddenButton !== target) restore();

      hiddenButton = target;
      target.style.setProperty("display", "none", "important");
      target.setAttribute("data-relay-hidden-bottom-action", "true");
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
