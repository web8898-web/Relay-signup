"use client";

import { useEffect } from "react";

const STYLE_ID = "queue-mascot-overflow-fix-styles";

function ensureFixStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes queueReferenceStretchBodySafe {
      0%, 100% { transform: translateY(0) scaleY(1); }
      32%, 70% { transform: translateY(-3px) scaleY(1.035); }
    }

    @keyframes queueReferenceStretchHeadSafe {
      0%, 100% { transform: translateY(0); }
      32%, 70% { transform: translateY(-5px); }
    }

    .queue-reference-mascot,
    .queue-reference-mascot svg {
      overflow: visible !important;
    }

    .queue-reference-stretch .queue-reference-body {
      animation: queueReferenceStretchBodySafe 3.2s ease-in-out 1 !important;
      transform-box: fill-box;
      transform-origin: center bottom;
    }

    .queue-reference-stretch .queue-reference-head {
      animation: queueReferenceStretchHeadSafe 3.2s ease-in-out 1 !important;
      transform-box: fill-box;
      transform-origin: center bottom;
    }
  `;
  document.head.appendChild(style);
}

function exposeMascot(mascot) {
  if (!(mascot instanceof HTMLElement)) return;

  mascot.style.position = "relative";
  mascot.style.zIndex = "50";
  mascot.style.overflow = "visible";

  const svg = mascot.querySelector("svg");
  if (svg instanceof SVGElement) {
    svg.style.overflow = "visible";
  }

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
  ensureFixStyles();
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

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
