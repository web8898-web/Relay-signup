"use client";

import { useEffect } from "react";

const TRIGGER_ATTR = "data-private-queue-mascot-trigger";
const SLOT_ATTR = "data-private-queue-mascot-slot";

function preparePrivateQueueMascot(root = document.body) {
  if (!root) return;

  const labels = [];
  if (root instanceof HTMLElement && root.textContent?.trim() === "你的排隊狀態") {
    labels.push(root);
  }

  root.querySelectorAll?.("*").forEach((element) => {
    if (element instanceof HTMLElement && element.textContent?.trim() === "你的排隊狀態") {
      labels.push(element);
    }
  });

  labels.forEach((label) => {
    const previous = label.previousElementSibling;
    if (previous instanceof HTMLElement && previous.hasAttribute(TRIGGER_ATTR)) return;

    const slot = previous;
    if (!(slot instanceof HTMLElement)) return;
    if (slot.hasAttribute(SLOT_ATTR)) return;

    slot.setAttribute(SLOT_ATTR, "true");
    slot.setAttribute("aria-label", "動態等待小人");
    slot.textContent = "";
    slot.style.minHeight = "94px";
    slot.style.opacity = "0";

    const trigger = document.createElement("span");
    trigger.setAttribute(TRIGGER_ATTR, "true");
    trigger.setAttribute("aria-hidden", "true");
    trigger.textContent = "目前等待順位";
    trigger.style.cssText =
      "position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;";

    slot.insertAdjacentElement("afterend", trigger);
  });
}

export default function QueuePrivateMascotBridge() {
  useEffect(() => {
    let frame = 0;
    const apply = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => preparePrivateQueueMascot(document.body));
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
