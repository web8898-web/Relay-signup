"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

let lastKnownMode = "normal";

function findAdvancedOuter() {
  return document.querySelector('[data-tour="advanced"]');
}

function findAdvancedBody() {
  const outer = findAdvancedOuter();
  if (!(outer instanceof HTMLElement)) return null;
  return [...outer.querySelectorAll("div")].find((element) => {
    const className = String(element.className || "");
    return className.includes("border-t") && className.includes("border-emerald-100") &&
      (element.textContent || "").includes("任務模式");
  }) || null;
}

function ensureParking() {
  let parking = document.querySelector("[data-share-toggle-parking]");
  if (!(parking instanceof HTMLElement)) {
    parking = document.createElement("div");
    parking.dataset.shareToggleParking = "true";
    parking.style.display = "none";
    document.body.appendChild(parking);
  }
  return parking;
}

function modeButton(label) {
  const body = findAdvancedBody();
  if (!(body instanceof HTMLElement)) return null;
  return [...body.querySelectorAll("button")].find((button) => {
    if (button.hasAttribute("data-task-tutorial")) return false;
    const text = String(button.textContent || "").replace(/\s+/g, " ").trim();
    return text.startsWith(label) && String(button.className || "").includes("rounded-2xl");
  }) || null;
}

function detectSelectedMode() {
  const normal = modeButton("一般報名");
  const queue = modeButton("現場排隊");
  if (normal instanceof HTMLButtonElement && String(normal.className || "").includes("border-emerald-400")) {
    lastKnownMode = "normal";
  } else if (queue instanceof HTMLButtonElement && String(queue.className || "").includes("border-emerald-400")) {
    lastKnownMode = "queue";
  }
  return lastKnownMode;
}

function triggerEnhancementRefresh() {
  const marker = document.createElement("span");
  marker.hidden = true;
  document.body.appendChild(marker);
  marker.remove();
}

function parkToggle() {
  const root = document.querySelector("[data-create-share-toggle]");
  const parking = ensureParking();
  if (!(root instanceof HTMLElement) || !(parking instanceof HTMLElement)) return;
  if (root.parentElement !== parking) parking.appendChild(root);
  root.style.display = "none";
}

function restoreToggle() {
  if (detectSelectedMode() !== "normal") {
    parkToggle();
    return;
  }

  const body = findAdvancedBody();
  if (!(body instanceof HTMLElement)) return;

  let root = document.querySelector("[data-create-share-toggle]");
  if (!(root instanceof HTMLElement)) {
    triggerEnhancementRefresh();
    root = document.querySelector("[data-create-share-toggle]");
  }
  if (!(root instanceof HTMLElement)) return;

  if (root.parentElement !== body) body.appendChild(root);
  root.style.removeProperty("display");
}

function scheduleRestore() {
  [0, 40, 100, 180, 300, 500].forEach((delay) => window.setTimeout(restoreToggle, delay));
}

export default function CreateShareToggleModeFix() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/create") return;
    lastKnownMode = "normal";
    ensureParking();

    const onClickCapture = (event) => {
      const button = event.target?.closest?.("button");
      if (!(button instanceof HTMLButtonElement)) return;
      const text = String(button.textContent || "").replace(/\s+/g, " ").trim();

      if (text.startsWith("現場排隊") && !button.hasAttribute("data-task-tutorial")) {
        lastKnownMode = "queue";
        parkToggle();
        return;
      }

      if (text.startsWith("一般報名") && !button.hasAttribute("data-task-tutorial")) {
        lastKnownMode = "normal";
        scheduleRestore();
        return;
      }

      if (text.includes("進階設定")) {
        const bodyIsOpen = findAdvancedBody() instanceof HTMLElement;
        if (bodyIsOpen) {
          // React 收合進階設定時會卸載整個內容區。先把分享設定移到
          // document.body 的隱藏停放區，避免一起被刪除。
          parkToggle();
        } else {
          // 重新展開後，再放回一般報名設定的最下方。
          scheduleRestore();
        }
      }
    };

    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const body = findAdvancedBody();
        if (!(body instanceof HTMLElement)) return;
        if (detectSelectedMode() === "normal") restoreToggle();
        else parkToggle();
      });
    };

    document.addEventListener("click", onClickCapture, true);
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    apply();

    return () => {
      document.removeEventListener("click", onClickCapture, true);
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.querySelector("[data-share-toggle-parking]")?.remove();
    };
  }, [pathname]);

  return null;
}
