"use client";

import { useEffect } from "react";

const SLOT_ATTR = "data-private-queue-inline-mascot-slot";
const TRIGGER_ATTR = "data-private-queue-inline-mascot-trigger";
const TRIGGER_TEXT = "目前等待順位";

function findStatusLabel() {
  return [...document.querySelectorAll("p")].find(
    (element) =>
      element instanceof HTMLElement &&
      element.textContent?.trim() === "你的排隊狀態"
  );
}

function removeOldFloatingMascots() {
  document
    .querySelectorAll('#private-queue-mascot-overlay, [id="private-queue-mascot-overlay"]')
    .forEach((element) => element.remove());

  document
    .querySelectorAll("[data-private-queue-mascot-target]")
    .forEach((element) => {
      if (!(element instanceof HTMLElement)) return;
      element.removeAttribute("data-private-queue-mascot-target");
      element.removeAttribute("data-private-queue-mascot-original-style");
      element.removeAttribute("style");
    });
}

function ensureSingleInlineMascot() {
  removeOldFloatingMascots();

  const label = findStatusLabel();
  const allSlots = [...document.querySelectorAll(`[${SLOT_ATTR}]`)];
  const allTriggers = [...document.querySelectorAll(`[${TRIGGER_ATTR}]`)];

  if (!(label instanceof HTMLElement) || !(label.parentElement instanceof HTMLElement)) {
    allSlots.forEach((element) => element.remove());
    allTriggers.forEach((element) => element.remove());
    return;
  }

  const parent = label.parentElement;
  let slot = allSlots.find((element) => element.parentElement === parent);
  let trigger = allTriggers.find((element) => element.parentElement === parent);

  allSlots.forEach((element) => {
    if (element !== slot) element.remove();
  });
  allTriggers.forEach((element) => {
    if (element !== trigger) element.remove();
  });

  if (!(slot instanceof HTMLElement)) {
    slot = document.createElement("div");
    slot.setAttribute(SLOT_ATTR, "true");
    slot.setAttribute("aria-label", "等待中的可愛人物");
  }

  if (!(trigger instanceof HTMLElement)) {
    trigger = document.createElement("span");
    trigger.setAttribute(TRIGGER_ATTR, "true");
    trigger.setAttribute("aria-hidden", "true");
    trigger.textContent = TRIGGER_TEXT;
    trigger.style.cssText =
      "position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;";
  }

  // 以正常文件流固定在「你的排隊狀態」正上方，不再使用 fixed / absolute 浮動定位。
  if (slot.nextElementSibling !== trigger || trigger.nextElementSibling !== label) {
    parent.insertBefore(slot, label);
    parent.insertBefore(trigger, label);
  }
}

export default function QueuePrivateMascotBridge() {
  useEffect(() => {
    let frame = 0;

    const apply = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(ensureSingleInlineMascot);
    };

    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.addEventListener("pageshow", apply);

    return () => {
      observer.disconnect();
      window.removeEventListener("pageshow", apply);
      window.cancelAnimationFrame(frame);
      document.querySelectorAll(`[${SLOT_ATTR}], [${TRIGGER_ATTR}]`).forEach((element) => element.remove());
      removeOldFloatingMascots();
    };
  }, []);

  return null;
}
