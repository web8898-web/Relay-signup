"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TARGET_PATHS = new Set(["/create", "/my-tasks"]);
const HEADER_SHADOW =
  "0 5px 10px -4px rgba(15, 23, 42, 0.22), 0 2px 5px -3px rgba(15, 23, 42, 0.14)";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function findPageHeader(pathname) {
  const expectedTitle = pathname === "/create" ? "建立任務" : "任務清單";
  const appRoot = document.querySelector("body > div.w-full.max-w-md");
  if (!(appRoot instanceof HTMLElement)) return null;

  const title = [...appRoot.querySelectorAll("h1, h2, p, span")].find(
    (element) => normalizeText(element.textContent) === expectedTitle
  );

  if (title instanceof HTMLElement) {
    const header = title.closest(".bg-emerald-500");
    if (header instanceof HTMLElement) return header;
  }

  const candidates = [...appRoot.querySelectorAll(".bg-emerald-500")].filter(
    (element) => element instanceof HTMLElement
  );

  return (
    candidates.find((element) => normalizeText(element.textContent).includes(expectedTitle)) ||
    candidates[0] ||
    null
  );
}

export default function InnerHeaderShadow() {
  const pathname = usePathname();

  useEffect(() => {
    if (!TARGET_PATHS.has(pathname)) return;

    let frame = 0;

    const applyShadow = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const header = findPageHeader(pathname);
        if (!(header instanceof HTMLElement)) return;

        header.style.setProperty("box-shadow", HEADER_SHADOW, "important");
        header.style.setProperty("position", "relative", "important");
        header.style.setProperty("z-index", "30", "important");
        header.style.setProperty("overflow", "visible", "important");
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

    const interval = window.setInterval(applyShadow, 500);
    const delayedRuns = [80, 220, 600, 1200].map((delay) =>
      window.setTimeout(applyShadow, delay)
    );

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      delayedRuns.forEach((timer) => window.clearTimeout(timer));
      window.cancelAnimationFrame(frame);
      document.querySelectorAll("[data-inner-header-shadow='true']").forEach((header) => {
        if (!(header instanceof HTMLElement)) return;
        header.style.removeProperty("box-shadow");
        header.style.removeProperty("z-index");
        header.style.removeProperty("overflow");
        header.removeAttribute("data-inner-header-shadow");
      });
    };
  }, [pathname]);

  return null;
}
