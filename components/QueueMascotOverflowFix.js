"use client";

import { useEffect } from "react";

function exposeMascot(mascot) {
  if (!(mascot instanceof HTMLElement)) return;

  mascot.style.position = "relative";
  mascot.style.zIndex = "50";
  mascot.style.overflow = "visible";

  const slot = mascot.parentElement;
  if (slot instanceof HTMLElement) {
    slot.style.position = "relative";
    slot.style.zIndex = "50";
    slot.style.overflow = "visible";
  }

  const card = mascot.closest("div.bg-gradient-to-br");
  if (card instanceof HTMLElement) {
    card.style.overflow = "visible";
  }
}

function applyOverflowFix() {
  document
    .querySelectorAll("[data-reference-queue-mascot]")
    .forEach(exposeMascot);
}

export default function QueueMascotOverflowFix() {
  useEffect(() => {
    applyOverflowFix();

    let frame = 0;
    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyOverflowFix);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
