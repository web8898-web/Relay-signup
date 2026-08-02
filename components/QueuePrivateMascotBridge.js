"use client";

import { useEffect } from "react";

const OVERLAY_ID = "private-queue-mascot-overlay";
const TARGET_ATTR = "data-private-queue-mascot-target";
const ORIGINAL_STYLE_ATTR = "data-private-queue-mascot-original-style";

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

function removeOverlay() {
  document.getElementById(OVERLAY_ID)?.remove();
  document.querySelectorAll(`[${TARGET_ATTR}]`).forEach(restoreTarget);
}

function ensureOverlay() {
  const label = findStatusLabel();
  const target = label?.previousElementSibling;

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

  // 只調整原本號碼圓圈的外觀與佔位，不刪除或新增 React 管理的子節點。
  // 先前直接清除 textContent，React 在送出後重新渲染時會找不到原節點而崩潰。
  target.style.setProperty("width", "112px", "important");
  target.style.setProperty("height", "94px", "important");
  target.style.setProperty("min-height", "94px", "important");
  target.style.setProperty("background", "transparent", "important");
  target.style.setProperty("box-shadow", "none", "important");
  target.style.setProperty("color", "transparent", "important");
  target.style.setProperty("opacity", "0", "important");

  let overlay = document.getElementById(OVERLAY_ID);
  if (!(overlay instanceof HTMLElement)) {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("aria-label", "動態等待小人");
    overlay.style.cssText =
      "position:fixed;z-index:100;pointer-events:none;width:112px;height:94px;overflow:visible;";

    const mascotSlot = document.createElement("div");
    const trigger = document.createElement("span");
    trigger.setAttribute("aria-hidden", "true");
    trigger.textContent = "目前等待順位";
    trigger.style.cssText =
      "position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;";

    overlay.append(mascotSlot, trigger);
    document.body.appendChild(overlay);
  }

  const rect = target.getBoundingClientRect();
  overlay.style.left = `${rect.left + (rect.width - 112) / 2}px`;
  overlay.style.top = `${rect.top + (rect.height - 94) / 2}px`;
  overlay.style.display =
    rect.bottom > 0 && rect.top < window.innerHeight ? "block" : "none";
}

export default function QueuePrivateMascotBridge() {
  useEffect(() => {
    let frame = 0;
    const apply = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(ensureOverlay);
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    window.addEventListener("scroll", apply, true);
    window.addEventListener("resize", apply);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", apply, true);
      window.removeEventListener("resize", apply);
      window.cancelAnimationFrame(frame);
      removeOverlay();
    };
  }, []);

  return null;
}
