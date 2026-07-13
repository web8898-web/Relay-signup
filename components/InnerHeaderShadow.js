"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TARGET_PATHS = new Set(["/create", "/my-tasks"]);
const HEADER_TITLES = new Set(["建立任務", "任務清單"]);
const HEADER_SHADOW = "0 8px 18px -10px rgba(15, 23, 42, 0.42), 0 4px 10px -8px rgba(15, 23, 42, 0.28)";
const HEADER_FILTER = "drop-shadow(0 7px 7px rgba(15, 23, 42, 0.16))";

function findVisibleInnerHeader() {
  const candidates = [...document.querySelectorAll(".bg-emerald-500")].filter(
    (element) => element instanceof HTMLElement
  );

  return (
    candidates.find((element) => {
      const rect = element.getBoundingClientRect();
      const text = (element.textContent || "").replace(/\s+/g, " ").trim();
      const hasTargetTitle = [...HEADER_TITLES].some((title) => text.includes(title));
      return (
        hasTargetTitle &&
        rect.width > 280 &&
        rect.height >= 48 &&
        rect.height <= 110 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight
      );
    }) || null
  );
}

function clearShadow() {
  document.querySelectorAll("[data-inner-header-shadow='true']").forEach((header) => {
    if (!(header instanceof HTMLElement)) return;
    header.style.removeProperty("box-shadow");
    header.style.removeProperty("filter");
    header.style.removeProperty("-webkit-filter");
    header.style.removeProperty("isolation");
    header.removeAttribute("data-inner-header-shadow");
  });
}

export default function InnerHeaderShadow() {
  const pathname = usePathname();

  useEffect(() => {
    clearShadow();
    if (!TARGET_PATHS.has(pathname)) return;

    let frame = 0;
    let interval = 0;

    const applyShadow = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const header = findVisibleInnerHeader();
        if (!(header instanceof HTMLElement)) return;

        header.style.setProperty("box-shadow", HEADER_SHADOW, "important");
        header.style.setProperty("filter", HEADER_FILTER, "important");
        header.style.setProperty("-webkit-filter", HEADER_FILTER, "important");
        header.style.setProperty("position", "relative", "important");
        header.style.setProperty("z-index", "30", "important");
        header.style.setProperty("overflow", "visible", "important");
        header.style.setProperty("isolation", "isolate", "important");
        header.setAttribute("data-inner-header-shadow", "true");
      });
    };

    applyShadow();

    const observer = new MutationObserver(applyShadow);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    interval = window.setInterval(applyShadow, 500);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.cancelAnimationFrame(frame);
      clearShadow();
    };
  }, [pathname]);

  return null;
}
