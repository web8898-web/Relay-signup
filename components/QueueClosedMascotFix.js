"use client";

import { useEffect } from "react";

const CLOSED_MARKERS = ["此任務已截止", "任務已截止", "無法再接龍"];

function closedSeatSvg() {
  return `
    <svg viewBox="0 0 180 150" role="img" aria-label="空椅子與時鐘，表示任務已截止">
      <ellipse cx="88" cy="142" rx="61" ry="7" fill="#E9EEF4" opacity=".65"/>
      <rect x="37" y="70" width="101" height="38" rx="15" fill="#D9EEE1" stroke="#72B993" stroke-width="4"/>
      <rect x="27" y="101" width="121" height="14" rx="7" fill="#D9EEE1" stroke="#72B993" stroke-width="4"/>
      <path d="M39 113v23M136 113v23" stroke="#72B993" stroke-width="4" stroke-linecap="round"/>
      <circle cx="151" cy="25" r="17" fill="#FFFDFC" stroke="#72B993" stroke-width="4"/>
      <path d="M151 14v12l8 5" fill="none" stroke="#72B993" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
}

function isClosedCard(card) {
  const text = card?.textContent || "";
  return CLOSED_MARKERS.some((marker) => text.includes(marker));
}

function applyClosedMascot(root = document.body) {
  const mascots = root.querySelectorAll?.("[data-reference-queue-mascot]") || [];
  mascots.forEach((mascot) => {
    if (!(mascot instanceof HTMLElement)) return;
    const card = mascot.closest("div.bg-gradient-to-br") || mascot.parentElement?.parentElement;
    if (!isClosedCard(card)) return;
    if (mascot.dataset.closedSeatOnly === "true") return;

    mascot.dataset.closedSeatOnly = "true";
    mascot.dataset.referenceActionActive = "false";
    mascot.className = "queue-reference-mascot queue-reference-closed";
    mascot.innerHTML = closedSeatSvg();

    document.querySelectorAll(".queue-reference-speech").forEach((bubble) => bubble.remove());
  });
}

export default function QueueClosedMascotFix() {
  useEffect(() => {
    applyClosedMascot();
    let frame = 0;
    const refresh = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => applyClosedMascot(document.body));
    };
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
