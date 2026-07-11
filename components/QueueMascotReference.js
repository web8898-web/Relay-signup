"use client";

import { useEffect } from "react";

const STYLE_ID = "queue-reference-mascot-styles";
const ACTION_CLASSES = [
  "queue-reference-phone",
  "queue-reference-look",
  "queue-reference-yawn",
  "queue-reference-stretch",
  "queue-reference-watch",
];

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes queueReferenceBreathe {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
    @keyframes queueReferenceFirst {
      0%, 100% { transform: translateY(0) scale(1); }
      38% { transform: translateY(-5px) scale(1.04); }
      72% { transform: translateY(0) scale(.99); }
    }
    @keyframes queueReferencePhone {
      0%, 12%, 100% { transform: translateY(0) rotate(0deg); }
      24%, 76% { transform: translateY(1px) rotate(2deg); }
    }
    @keyframes queueReferencePhoneItem {
      0%, 10%, 92%, 100% { opacity: 0; transform: translate(15px, 12px) rotate(24deg) scale(.65); }
      28%, 78% { opacity: 1; transform: translate(0, 0) rotate(-5deg) scale(1); }
    }
    @keyframes queueReferenceLook {
      0%, 100% { transform: rotate(0deg) translateX(0); }
      20%, 40% { transform: rotate(-5deg) translateX(-2px); }
      58%, 78% { transform: rotate(5deg) translateX(2px); }
    }
    @keyframes queueReferenceYawn {
      0%, 100% { transform: translateY(0) scale(1); }
      30%, 70% { transform: translateY(2px) scale(.98); }
    }
    @keyframes queueReferenceYawnBubble {
      0%, 18%, 88%, 100% { opacity: 0; transform: translateY(5px) scale(.5); }
      35%, 70% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes queueReferenceStretch {
      0%, 100% { transform: translateY(0) scaleY(1); }
      32%, 70% { transform: translateY(-6px) scaleY(1.06); }
    }
    @keyframes queueReferenceWatch {
      0%, 100% { transform: rotate(0deg) translateY(0); }
      30%, 72% { transform: rotate(4deg) translateY(2px); }
    }
    @keyframes queueReferenceWatchItem {
      0%, 18%, 88%, 100% { opacity: 0; transform: scale(.55); }
      36%, 72% { opacity: 1; transform: scale(1); }
    }

    .queue-reference-mascot {
      position: relative;
      width: 112px;
      height: 94px;
      margin: 0 auto 8px;
      transform-origin: center bottom;
      animation: queueReferenceBreathe 3.2s ease-in-out infinite;
      will-change: transform;
    }
    .queue-reference-mascot.queue-reference-first {
      animation: queueReferenceFirst 560ms ease-out 1, queueReferenceBreathe 3.2s ease-in-out 560ms infinite;
    }
    .queue-reference-mascot svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
      transform-origin: center bottom;
    }
    .queue-reference-mascot .queue-reference-eye {
      transform-box: fill-box;
      transform-origin: center;
      transition: transform 80ms ease;
    }
    .queue-reference-mascot.queue-reference-blink .queue-reference-eye {
      transform: scaleY(.08);
    }
    .queue-reference-mascot::after,
    .queue-reference-mascot::before {
      content: "";
      position: absolute;
      pointer-events: none;
      opacity: 0;
      z-index: 3;
    }
    .queue-reference-mascot.queue-reference-phone svg {
      animation: queueReferencePhone 4.6s ease-in-out 1;
    }
    .queue-reference-mascot.queue-reference-phone::after {
      width: 17px;
      height: 27px;
      right: 23px;
      top: 47px;
      border: 2px solid #4b5563;
      border-radius: 4px;
      background: linear-gradient(#d9eee1 0 78%, #4b5563 78% 100%);
      box-shadow: 0 2px 4px rgba(15, 23, 42, .16);
      animation: queueReferencePhoneItem 4.6s ease-in-out 1;
    }
    .queue-reference-mascot.queue-reference-look svg {
      animation: queueReferenceLook 2.8s ease-in-out 1;
    }
    .queue-reference-mascot.queue-reference-yawn svg {
      animation: queueReferenceYawn 3s ease-in-out 1;
    }
    .queue-reference-mascot.queue-reference-yawn::after {
      content: "○";
      right: 12px;
      top: 18px;
      color: #72b993;
      font-size: 20px;
      line-height: 1;
      animation: queueReferenceYawnBubble 3s ease-in-out 1;
    }
    .queue-reference-mascot.queue-reference-stretch svg {
      animation: queueReferenceStretch 3.2s ease-in-out 1;
    }
    .queue-reference-mascot.queue-reference-watch svg {
      animation: queueReferenceWatch 2.6s ease-in-out 1;
    }
    .queue-reference-mascot.queue-reference-watch::after {
      width: 14px;
      height: 14px;
      left: 31px;
      top: 59px;
      border: 2px solid #72b993;
      border-radius: 999px;
      background: #fff;
      animation: queueReferenceWatchItem 2.6s ease-in-out 1;
    }
    .queue-reference-mascot.queue-reference-paused,
    .queue-reference-mascot.queue-reference-paused svg,
    .queue-reference-mascot.queue-reference-paused::before,
    .queue-reference-mascot.queue-reference-paused::after {
      animation-play-state: paused !important;
    }
    @media (prefers-reduced-motion: reduce) {
      .queue-reference-mascot,
      .queue-reference-mascot.queue-reference-first,
      .queue-reference-mascot svg,
      .queue-reference-mascot::before,
      .queue-reference-mascot::after {
        animation: none !important;
      }
      .queue-reference-mascot .queue-reference-eye {
        transition: none;
      }
    }
  `;
  document.head.appendChild(style);
}

function mascotSvg() {
  return `
    <svg viewBox="0 0 180 150" width="112" height="94" role="img" aria-label="坐著等待的可愛人物">
      <ellipse cx="88" cy="142" rx="61" ry="7" fill="#E9EEF4" opacity=".65"/>
      <rect x="37" y="84" width="101" height="31" rx="13" fill="#D9EEE1" stroke="#72B993" stroke-width="4"/>
      <rect x="27" y="107" width="121" height="13" rx="7" fill="#D9EEE1" stroke="#72B993" stroke-width="4"/>
      <path d="M39 118v18M136 118v18" stroke="#72B993" stroke-width="4" stroke-linecap="round"/>
      <path d="M57 77c6-8 17-13 30-13s24 5 30 13v28H57V77Z" fill="#FFFDFC" stroke="#6A574F" stroke-width="4" stroke-linejoin="round"/>
      <path d="M64 86c7 0 13 5 17 11M110 86c-7 0-13 5-17 11" fill="none" stroke="#6A574F" stroke-width="4" stroke-linecap="round"/>
      <path d="M81 97c2 3 4 4 6 4s4-1 6-4" fill="none" stroke="#6A574F" stroke-width="3.5" stroke-linecap="round"/>
      <rect x="69" y="99" width="17" height="38" rx="9" fill="#FFFDFC" stroke="#6A574F" stroke-width="4"/>
      <rect x="88" y="99" width="17" height="38" rx="9" fill="#FFFDFC" stroke="#6A574F" stroke-width="4"/>
      <circle cx="87" cy="48" r="40" fill="#FFFDFC" stroke="#6A574F" stroke-width="4"/>
      <ellipse cx="61" cy="56" rx="10" ry="8" fill="#F8C8D0" opacity=".82"/>
      <ellipse cx="113" cy="56" rx="10" ry="8" fill="#F8C8D0" opacity=".82"/>
      <circle class="queue-reference-eye" cx="72" cy="45" r="3.7" fill="#6A574F"/>
      <circle class="queue-reference-eye" cx="102" cy="45" r="3.7" fill="#6A574F"/>
      <path d="M79 56c4.2 4.6 11.8 4.6 16 0" fill="none" stroke="#6A574F" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="151" cy="25" r="17" fill="#FFFDFC" stroke="#72B993" stroke-width="4"/>
      <path d="M151 14v12l8 5" fill="none" stroke="#72B993" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function clearAction(mascot) {
  ACTION_CLASSES.forEach((className) => mascot.classList.remove(className));
  mascot.dataset.referenceActionActive = "false";
}

function blink(mascot) {
  if (!(mascot instanceof HTMLElement) || !mascot.isConnected || document.hidden) return;
  mascot.classList.add("queue-reference-blink");
  window.setTimeout(() => mascot.classList.remove("queue-reference-blink"), 120);
  if (Math.random() < 0.2) {
    window.setTimeout(() => {
      if (!mascot.isConnected || document.hidden) return;
      mascot.classList.add("queue-reference-blink");
      window.setTimeout(() => mascot.classList.remove("queue-reference-blink"), 120);
    }, 230);
  }
}

function scheduleBlink(mascot) {
  if (!(mascot instanceof HTMLElement) || mascot.dataset.referenceBlink === "true") return;
  mascot.dataset.referenceBlink = "true";
  const next = () => {
    if (!mascot.isConnected) return;
    const delay = 4000 + Math.floor(Math.random() * 8001);
    const timer = window.setTimeout(() => {
      blink(mascot);
      next();
    }, delay);
    mascot.dataset.referenceBlinkTimer = String(timer);
  };
  next();
}

function chooseAction() {
  const roll = Math.random() * 100;
  if (roll < 38) return { className: "queue-reference-phone", duration: 4600 };
  if (roll < 60) return { className: "queue-reference-look", duration: 2800 };
  if (roll < 75) return { className: "queue-reference-yawn", duration: 3000 };
  if (roll < 88) return { className: "queue-reference-stretch", duration: 3200 };
  return { className: "queue-reference-watch", duration: 2600 };
}

function playAction(mascot) {
  if (!(mascot instanceof HTMLElement) || !mascot.isConnected || document.hidden) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    blink(mascot);
    return;
  }
  if (mascot.dataset.referenceActionActive === "true") return;

  const action = chooseAction();
  clearAction(mascot);
  mascot.dataset.referenceActionActive = "true";
  mascot.classList.add(action.className);

  const timer = window.setTimeout(() => {
    if (!mascot.isConnected) return;
    clearAction(mascot);
  }, action.duration);
  mascot.dataset.referenceActionTimer = String(timer);
}

function scheduleActions(mascot) {
  if (!(mascot instanceof HTMLElement) || mascot.dataset.referenceActionScheduled === "true") return;
  mascot.dataset.referenceActionScheduled = "true";

  let firstRun = true;
  const next = () => {
    if (!mascot.isConnected) return;
    const delay = firstRun
      ? 6000 + Math.floor(Math.random() * 6001)
      : 20000 + Math.floor(Math.random() * 40001);
    firstRun = false;
    const timer = window.setTimeout(() => {
      if (!document.hidden) playAction(mascot);
      next();
    }, delay);
    mascot.dataset.referenceActionScheduleTimer = String(timer);
  };
  next();
}

function getCurrentRank(card) {
  const text = card?.textContent || "";
  const match = text.match(/第\s*(\d+)\s*位/);
  return match ? Number(match[1]) : 0;
}

function playFirstPlaceAnimation(mascot) {
  if (!(mascot instanceof HTMLElement)) return;
  mascot.classList.remove("queue-reference-first");
  void mascot.offsetWidth;
  mascot.classList.add("queue-reference-first");
  window.setTimeout(() => mascot.classList.remove("queue-reference-first"), 620);
}

function installReferenceMascot(root = document.body) {
  if (!root || !(root instanceof Element || root === document.body)) return;
  ensureStyles();

  const labels = [];
  if (root instanceof HTMLElement && root.textContent?.trim() === "目前等待順位") labels.push(root);
  root.querySelectorAll?.("*").forEach((element) => {
    if (element instanceof HTMLElement && element.textContent?.trim() === "目前等待順位") labels.push(element);
  });

  labels.forEach((label) => {
    const slot = label.previousElementSibling;
    if (!(slot instanceof HTMLElement)) return;

    const card = label.closest("div.bg-gradient-to-br") || label.parentElement;
    const rank = getCurrentRank(card);
    let mascot = slot.querySelector("[data-reference-queue-mascot]");

    if (!(mascot instanceof HTMLElement)) {
      slot.dataset.referenceMascotInstalled = "true";
      slot.className = "";
      slot.removeAttribute("style");
      slot.innerHTML = `
        <div class="queue-reference-mascot" data-reference-queue-mascot data-current-rank="${rank || ""}">
          ${mascotSvg()}
        </div>
      `;
      mascot = slot.querySelector("[data-reference-queue-mascot]");
    }

    if (!(mascot instanceof HTMLElement)) return;

    const previousRank = Number(mascot.dataset.currentRank || 0);
    mascot.dataset.currentRank = rank ? String(rank) : "";

    if (rank === 1 && previousRank !== 1) {
      playFirstPlaceAnimation(mascot);
    } else if (rank !== 1) {
      mascot.classList.remove("queue-reference-first");
    }

    scheduleBlink(mascot);
    scheduleActions(mascot);
  });
}

export default function QueueMascotReference() {
  useEffect(() => {
    installReferenceMascot();

    let refreshFrame = 0;
    const requestRefresh = (root = document.body) => {
      window.cancelAnimationFrame(refreshFrame);
      refreshFrame = window.requestAnimationFrame(() => installReferenceMascot(root));
    };

    const handleVisibility = () => {
      document.querySelectorAll("[data-reference-queue-mascot]").forEach((mascot) => {
        if (!(mascot instanceof HTMLElement)) return;
        mascot.classList.toggle("queue-reference-paused", document.hidden);
      });
    };

    document.addEventListener("visibilitychange", handleVisibility);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          requestRefresh(document.body);
          continue;
        }
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) requestRefresh(document.body);
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.cancelAnimationFrame(refreshFrame);
      document.querySelectorAll("[data-reference-queue-mascot]").forEach((mascot) => {
        const blinkTimer = Number(mascot.dataset.referenceBlinkTimer);
        const actionTimer = Number(mascot.dataset.referenceActionTimer);
        const scheduleTimer = Number(mascot.dataset.referenceActionScheduleTimer);
        if (blinkTimer) window.clearTimeout(blinkTimer);
        if (actionTimer) window.clearTimeout(actionTimer);
        if (scheduleTimer) window.clearTimeout(scheduleTimer);
      });
    };
  }, []);

  return null;
}
