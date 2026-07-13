"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TARGET_PATHS = new Set(["/create", "/my-tasks"]);
const HEADER_SHADOW = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)";

export default function InnerHeaderShadow() {
  const pathname = usePathname();

  useEffect(() => {
    if (!TARGET_PATHS.has(pathname)) return;

    let frame = 0;
    let observer;

    const applyShadow = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const appRoot = document.querySelector("body > div.w-full.max-w-md");
        const header = appRoot?.querySelector(".bg-emerald-500");
        if (!(header instanceof HTMLElement)) return;

        header.style.boxShadow = HEADER_SHADOW;
        header.style.position = header.style.position || "relative";
        header.style.zIndex = header.style.zIndex || "20";
        header.setAttribute("data-inner-header-shadow", "true");
      });
    };

    applyShadow();
    observer = new MutationObserver(applyShadow);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
      document.querySelectorAll("[data-inner-header-shadow='true']").forEach((header) => {
        if (!(header instanceof HTMLElement)) return;
        header.style.removeProperty("box-shadow");
        header.removeAttribute("data-inner-header-shadow");
      });
    };
  }, [pathname]);

  return null;
}
