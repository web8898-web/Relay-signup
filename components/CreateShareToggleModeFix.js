"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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
  const outer = findAdvancedOuter();
  if (!(outer instanceof HTMLElement)) return null;
  let parking = outer.querySelector("[data-share-toggle-parking]");
  if (!(parking instanceof HTMLElement)) {
    parking = document.createElement("div");
    parking.dataset.shareToggleParking = "true";
    parking.style.display = "none";
    outer.appendChild(parking);
  }
  return parking;
}

function modeButton(label) {
  return [...document.querySelectorAll("button")].find((button) => {
    const text = String(button.textContent || "").replace(/\s+/g, " ").trim();
    return text.startsWith(label);
  }) || null;
}

function normalIsSelected() {
  const button = modeButton("一般報名");
  return button instanceof HTMLButtonElement && String(button.className || "").includes("border-emerald-400");
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
  parking.appendChild(root);
  root.style.display = "none";
}

function restoreToggle() {
  if (!normalIsSelected()) return;
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

export default function CreateShareToggleModeFix() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/create") return;

    const onClickCapture = (event) => {
      const button = event.target?.closest?.("button");
      if (!(button instanceof HTMLButtonElement)) return;
      const text = String(button.textContent || "").replace(/\s+/g, " ").trim();

      if (text.startsWith("現場排隊")) {
        parkToggle();
        return;
      }

      if (text.startsWith("一般報名")) {
        [30, 100, 220, 420].forEach((delay) => window.setTimeout(restoreToggle, delay));
      }
    };

    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (normalIsSelected()) restoreToggle();
      });
    };

    document.addEventListener("click", onClickCapture, true);
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    apply();

    return () => {
      document.removeEventListener("click", onClickCapture, true);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
