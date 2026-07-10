"use client";

import { useEffect } from "react";

const STYLE_ID = "queue-reference-mascot-styles";

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes queueReferenceFirst {
      0%, 100% { transform: translateY(0) scale(1); }
      38% { transform: translateY(-5px) scale(1.04); }
      72% { transform: translateY(0) scale(.99); }
    }
    .queue-reference-mascot {
      width: 112px;
      height: 94px;
      margin: 0 auto 8px;
      transform-origin: center bottom;
    }
    .queue-reference-mascot.queue-reference-first {
      animation: queueReferenceFirst 560ms ease-out 1;
    }
    .queue-reference-mascot .queue-reference-eye {
      transform-box: fill-box;
      transform-origin: center;
      transition: transform 80ms ease;
    }
    .queue-reference-mascot.queue-reference-blink .queue-reference-eye {
      transform: scaleY(.08);
    }
    @media (prefers-reduced-motion: reduce) {
      .queue-reference-mascot.queue-reference-first {
        animation: none;
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

function blink(mascot) {
  if (!(mascot instanceof HTMLElement) || !mascot.isConnected) return;
  mascot.classList.add("queue-reference-blink");
  window.setTimeout(() => mascot.classList.remove("queue-reference-blink"), 120);

  if (Math.random() < 0.2) {
    window.setTimeout(() => {
      if (!mascot.isConnected) return;
      mascot.classList.add("queue-reference-blink");
      window.setTimeout(() => mascot.classList.remove("queue-reference-blink"), 120);
    }, 230);
  }
}

function scheduleBlink(mascot) {
  if (!(mascot instanceof HTMLElement) || mascot.dataset.referenceBlink === "true") return;
  mascot.dataset.referenceBlink = "true";

  const scheduleNext = () => {
    if (!mascot.isConnected) return;
    const delay = 4000 + Math.floor(Math.random() * 8001);
    const timer = window.setTimeout(() => {
      blink(mascot);
      scheduleNext();
    }, delay);
    mascot.dataset.referenceBlinkTimer = String(timer);
  };

  scheduleNext();
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
    const isFirst = card?.textContent?.includes("第 1 位");

    if (slot.dataset.referenceMascotInstalled !== "true") {
      slot.dataset.referenceMascotInstalled = "true";
      slot.className = "";
      slot.removeAttribute("style");
      slot.innerHTML = `
        <div class="queue-reference-mascot ${isFirst ? "queue-reference-first" : ""}" data-reference-queue-mascot>
          ${mascotSvg()}
        </div>
      `;
    }

    const mascot = slot.querySelector("[data-reference-queue-mascot]");
    if (mascot instanceof HTMLElement) {
      mascot.classList.toggle("queue-reference-first", Boolean(isFirst));
      scheduleBlink(mascot);
    }
  });
}

export default function QueueMascotReference() {
  useEffect(() => {
    installReferenceMascot();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) installReferenceMascot(node);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.querySelectorAll("[data-reference-queue-mascot]").forEach((mascot) => {
        const timer = Number(mascot.dataset.referenceBlinkTimer);
        if (timer) window.clearTimeout(timer);
      });
    };
  }, []);

  return null;
}
