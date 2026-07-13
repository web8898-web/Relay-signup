"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TARGET_PATHS = new Set(["/create", "/my-tasks"]);
const HEADER_TITLES = new Set(["建立任務", "任務清單"]);
const HEADER_SHADOW =
  "0 5px 12px -6px rgba(15, 23, 42, 0.26), 0 2px 5px -3px rgba(15, 23, 42, 0.14)";

function findVisibleInnerHeader() {
  return [...document.querySelectorAll(".bg-emerald-500")].find((element) => {
    if (!(element instanceof HTMLElement)) return false;
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
  });
}

function clearShadow() {
  document.querySelectorAll("[data-inner-header-shadow='true']").forEach((header) => {
    if (!(header instanceof HTMLElement)) return;
    header.style.removeProperty("box-shadow");
    header.style.removeProperty("z-index");
    header.removeAttribute("data-inner-header-shadow");
  });
}

export default function InnerHeaderShadow() {
  const pathname = usePathname();

  useEffect(() => {
    clearShadow();
    if (!TARGET_PATHS.has(pathname)) return;

    let frame = 0;

    const applyShadow = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const header = findVisibleInnerHeader();
        if (!(header instanceof HTMLElement)) return;

        // 僅套用 box-shadow，避免 iOS / LINE WebView 因 filter、isolation
        // 或 overflow 組合產生整個綠色頁首透明消失的合成層問題。
        header.style.setProperty("box-shadow", HEADER_SHADOW, "important");
        header.style.setProperty("z-index", "20", "important");
        header.setAttribute("data-inner-header-shadow", "true");
      });
    };

    applyShadow();
    const delayed = [80, 250, 700].map((delay) => window.setTimeout(applyShadow, delay));

    const observer = new MutationObserver(applyShadow);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      delayed.forEach((timer) => window.clearTimeout(timer));
      window.cancelAnimationFrame(frame);
      clearShadow();
    };
  }, [pathname]);

  return null;
}
