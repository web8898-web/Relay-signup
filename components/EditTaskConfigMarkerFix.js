"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const MARKERS = new Set([
  "__relay_category_single__",
  "__relay_category_multiple__",
  "__relay_share_enabled__",
  "__relay_share_disabled__",
  "__relay_native_share_enabled__",
  "__relay_queue_mode__",
]);
const BANNER_PREFIX = "__relay_banner_url__:";

function isMarker(value) {
  const text = String(value || "").trim();
  return MARKERS.has(text) || text.startsWith(BANNER_PREFIX);
}

function markerLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(isMarker);
}

function cleanText(value) {
  return String(value || "")
    .split(/\r?\n/)
    .filter((line) => !isMarker(line))
    .join("\n")
    .trim();
}

function setNativeValue(element, value) {
  const prototype = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export default function EditTaskConfigMarkerFix() {
  const pathname = usePathname();
  const savedMarkers = useRef(new Set());

  useEffect(() => {
    const likelyEditPage = pathname.includes("edit") || pathname.includes("my-tasks");
    if (!likelyEditPage) return;

    const originalFetch = window.fetch;
    window.fetch = (input, init = {}) => {
      const url = typeof input === "string" ? input : input?.url || "";
      const method = String(init?.method || "GET").toUpperCase();
      if (url.includes("/api/tasks/") && (method === "PUT" || method === "PATCH") && typeof init.body === "string") {
        try {
          const body = JSON.parse(init.body);
          if (Array.isArray(body.categories)) {
            const cleanCategories = body.categories.filter((item) => !isMarker(item));
            const categoryMarkers = [...savedMarkers.current].filter((item) => item.includes("category_") || item === "__relay_queue_mode__");
            body.categories = [...cleanCategories, ...categoryMarkers];
          }
          if (Object.prototype.hasOwnProperty.call(body, "note")) {
            const noteMarkers = [...savedMarkers.current].filter((item) => item.includes("share_") || item.startsWith(BANNER_PREFIX));
            body.note = [cleanText(body.note), ...noteMarkers].filter(Boolean).join("\n");
          }
          init = { ...init, body: JSON.stringify(body) };
        } catch (error) {}
      }
      return originalFetch(input, init);
    };

    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const pageText = document.body?.innerText || "";
        if (!pageText.includes("編輯任務")) return;

        document.querySelectorAll("input, textarea").forEach((element) => {
          if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return;
          const found = markerLines(element.value);
          if (!found.length) return;
          found.forEach((marker) => savedMarkers.current.add(marker));
          const cleaned = cleanText(element.value);
          if (cleaned !== element.value) setNativeValue(element, cleaned);
        });

        document.querySelectorAll("button, span, div").forEach((element) => {
          if (!(element instanceof HTMLElement)) return;
          const text = (element.textContent || "").trim();
          if (!isMarker(text)) return;
          savedMarkers.current.add(text);
          const chip = element.closest("span.rounded-full, button.rounded-full") || element;
          if (chip instanceof HTMLElement) {
            chip.style.setProperty("display", "none", "important");
            chip.setAttribute("aria-hidden", "true");
          }
        });
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value"] });
    const interval = window.setInterval(apply, 500);

    return () => {
      window.fetch = originalFetch;
      observer.disconnect();
      window.clearInterval(interval);
      cancelAnimationFrame(frame);
      savedMarkers.current.clear();
    };
  }, [pathname]);

  return null;
}
