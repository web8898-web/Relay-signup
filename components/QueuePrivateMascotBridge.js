"use client";

import { useEffect } from "react";

const OVERLAY_ID = "private-queue-mascot-overlay";
const TARGET_ATTR = "data-private-queue-mascot-target";
const ORIGINAL_STYLE_ATTR = "data-private-queue-mascot-original-style";
const TRIGGER_TEXT = "目前等待順位";

function findStatusLabel() {
  return [...document.querySelectorAll("p")].find(
    (element) =>
      element instanceof HTMLElement &&
      element.textContent?.trim() === "你的排隊狀態"
  );
}

function restoreTarget(target) {
  if (!(target instanceof HTMLElement)) return;
  const originalStyle = target.getAttribute(ORIGINAL_STYLE_ATTR) || "";
  if (originalStyle) target.setAttribute("style", originalStyle);
  else target.removeAttribute("style");
  target.removeAttribute(TARGET_ATTR);
  target.removeAttribute(ORIGINAL_STYLE_ATTR);
}

function removeLegacyMascots() {
  document.querySelectorAll("[data-reference-queue-mascot]").forEach((mascot) => {
    if (!mascot.closest(`#${OVERLAY_ID}`)) {
      const slot = mascot.parentElement;
      const trigger = slot?.nextElementSibling;
      if (
        trigger instanceof HTMLElement &&
        trigger.textContent?.trim() === TRIGGER_TEXT
      ) {
        trigger.remove();
      }
      slot?.remove();
    }
  });

  [...document.querySelectorAll("span")].forEach((element) => {
    if (
      element instanceof HTMLElement &&
      element.textContent?.trim() === TRIGGER_TEXT &&
      !element.closest(`#${OVERLAY_ID}`)
    ) {
      element.remove();
    }
  });
}

function getSingleOverlay() {
  const overlays = [...document.querySelectorAll(`[id="${OVERLAY_ID}"]`)];
  const first = overlays.shift();
  overlays.forEach((element) => element.remove());
  return first instanceof HTMLElement ? first : null;
}

function removeOverlay() {
  document.querySelectorAll(`[id="${OVERLAY_ID}"]`).forEach((element) => element.remove());
  document.querySelectorAll(`[${TARGET_ATTR}]`).forEach(restoreTarget);
  removeLegacyMascots();
}

function ensureOverlay() {
  const label = findStatusLabel();
  const target = label?.previousElementSibling;

  removeLegacyMascots();

  if (!(target instanceof HTMLElement)) {
    removeOverlay();
    return;
  }

  document.querySelectorAll(`[${TARGET_ATTR}]`).forEach((element) => {
    if (element !== target) restoreTarget(element);
  });

  if (!target.hasAttribute(TARGET_ATTR)) {
    target.setAttribute(ORIGINAL_STYLE_ATTR, target.getAttribute("style") || "");
    target.setAttribute(TARGET_ATTR, "true");
  }

  target.style.setProperty("width", "112px", "important");
  target.style.setProperty("height", "102px", "important");
  target.style.setProperty("min-height", "102px", "important");
  target.style.setProperty("background", "transparent", "important");
  target.style.setProperty("box-shadow", "none", "important");
  target.style.setProperty("color", "transparent", "important");
  target.style.setProperty("opacity", "0", "important");

  let overlay = getSingleOverlay();
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("aria-label", "動態等待小人");
    overlay.style.cssText =
      "position:fixed;z-index:100;pointer-events:none;width:112px;height:102px;overflow:visible;contain:layout style;transform:translateZ(0);";

    const mascotSlot = document.createElement("div");
    mascotSlot.setAttribute("data-private-queue-mascot-slot", "true");

    const trigger = document.createElement("span");
    trigger.setAttribute("aria-hidden", "true");
    trigger.textContent = TRIGGER_TEXT;
    trigger.style.cssText =
      "position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;";

    overlay.append(mascotSlot, trigger);
    document.body.appendChild(overlay);
  }

  const rect = target.getBoundingClientRect();
  const left = Math.round(rect.left + (rect.width - 112) / 2);
  const top = Math.round(rect.top + (rect.height - 102) / 2);

  overlay.style.left = `${left}px`;
  overlay.style.top = `${top}px`;
  overlay.style.display =
    rect.bottom > 0 && rect.top < window.innerHeight ? "block" : "none";
}

export default function QueuePrivateMascotBridge() {
  useEffect(() => {
    let frame = 0;
    let observer;

    const apply = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(ensureOverlay);
    };

    removeOverlay();
    apply();

    observer = new MutationObserver(apply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.addEventListener("scroll", apply, true);
    window.addEventListener("resize", apply);
    window.addEventListener("pageshow", apply);

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", apply, true);
      window.removeEventListener("resize", apply);
      window.removeEventListener("pageshow", apply);
      window.cancelAnimationFrame(frame);
      removeOverlay();
    };
  }, []);

  return null;
}
