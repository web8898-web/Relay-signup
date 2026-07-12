"use client";

import { useEffect } from "react";

const CLOSED_MARKERS = [
  "此任務已截止",
  "任務已截止",
  "無法再接龍",
  "接龍已截止",
  "報名已截止",
];

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

function pageIsClosed() {
  const text = document.body?.innerText || document.body?.textContent || "";
  return CLOSED_MARKERS.some((marker) => text.includes(marker));
}

function stopMascotTimers(mascot) {
  [
    "referenceBlinkTimer",
    "referenceActionTimer",
    "referenceActionScheduleTimer",
    "referenceSpeechTimer",
  ].forEach((key) => {
    const timer = Number(mascot.dataset[key]);
    if (timer) window.clearTimeout(timer);
    delete mascot.dataset[key];
  });
}

function leafElements(root = document.body) {
  return [...(root.querySelectorAll?.("*") || [])].filter(
    (el) => el instanceof HTMLElement && el.children.length === 0
  );
}

function applyClosedCopy(root = document.body) {
  const leaves = leafElements(root);

  leaves.forEach((el) => {
    const text = el.textContent?.trim() || "";

    if (text === "目前等待順位") {
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
      return;
    }

    if (/^第\s*\d+\s*位$/.test(text)) {
      el.textContent = "已截止";
      el.setAttribute("data-queue-closed-title", "true");
      return;
    }

    if (/你前面還有\s*\d+\s*位[，,、]?\s*請稍候/.test(text)) {
      el.textContent = "無法再接龍";
      el.setAttribute("data-queue-closed-subtitle", "true");
    }
  });
}

function applyClosedMascot(root = document.body) {
  if (!root || !pageIsClosed()) return;

  const mascots = root.querySelectorAll?.("[data-reference-queue-mascot]") || [];
  mascots.forEach((mascot) => {
    if (!(mascot instanceof HTMLElement)) return;
    if (mascot.dataset.closedSeatOnly === "true") return;

    stopMascotTimers(mascot);
    mascot.dataset.closedSeatOnly = "true";
    mascot.dataset.referenceActionActive = "false";
    mascot.dataset.referenceActionScheduled = "false";
    mascot.dataset.referenceSpeechScheduled = "false";
    mascot.className = "queue-reference-mascot queue-reference-closed";
    mascot.innerHTML = closedSeatSvg();
  });

  document.querySelectorAll(".queue-reference-speech").forEach((bubble) => bubble.remove());
  applyClosedCopy(root);
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
