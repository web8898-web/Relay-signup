"use client";

import { useEffect } from "react";

const OLD_STATUS_TEXT = "即時更新中";
const NEW_STATUS_TEXT = "排隊狀態即時同步";
const MASCOT_STYLE_ID = "queue-waiting-mascot-styles";

function replaceExactText(root, fromText, toText) {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    if (root.nodeValue?.trim() === fromText) root.nodeValue = toText;
    return;
  }

  if (!(root instanceof Element || root === document.body)) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue?.trim() === fromText) node.nodeValue = toText;
  }
}

function ensureMascotStyles() {
  if (document.getElementById(MASCOT_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = MASCOT_STYLE_ID;
  style.textContent = `
    @keyframes queueMascotBreathe {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
    @keyframes queueMascotFirst {
      0%, 100% { transform: translateY(0) scale(1); }
      40% { transform: translateY(-5px) scale(1.04); }
      70% { transform: translateY(0) scale(0.99); }
    }
    .queue-waiting-mascot {
      animation: queueMascotBreathe 3.2s ease-in-out infinite;
      transform-origin: center bottom;
    }
    .queue-waiting-mascot.queue-mascot-first {
      animation: queueMascotFirst 560ms ease-out 1, queueMascotBreathe 3.2s ease-in-out 560ms infinite;
    }
    .queue-waiting-mascot .queue-eye {
      transform-box: fill-box;
      transform-origin: center;
      transition: transform 90ms ease;
    }
    .queue-waiting-mascot.queue-mascot-blink .queue-eye {
      transform: scaleY(0.12);
    }
    @media (prefers-reduced-motion: reduce) {
      .queue-waiting-mascot,
      .queue-waiting-mascot.queue-mascot-first {
        animation: none;
      }
      .queue-waiting-mascot .queue-eye {
        transition: none;
      }
    }
  `;
  document.head.appendChild(style);
}

function blinkMascot(mascot) {
  if (!(mascot instanceof HTMLElement) || !mascot.isConnected) return;

  mascot.classList.add("queue-mascot-blink");
  window.setTimeout(() => mascot.classList.remove("queue-mascot-blink"), 120);

  if (Math.random() < 0.2) {
    window.setTimeout(() => {
      if (!mascot.isConnected) return;
      mascot.classList.add("queue-mascot-blink");
      window.setTimeout(() => mascot.classList.remove("queue-mascot-blink"), 120);
    }, 230);
  }
}

function scheduleMascotBlink(mascot) {
  if (!(mascot instanceof HTMLElement) || mascot.dataset.blinkScheduled === "true") return;

  mascot.dataset.blinkScheduled = "true";

  const scheduleNext = () => {
    if (!mascot.isConnected) return;
    const delay = 4000 + Math.floor(Math.random() * 8001);
    const timer = window.setTimeout(() => {
      blinkMascot(mascot);
      scheduleNext();
    }, delay);
    mascot.dataset.blinkTimer = String(timer);
  };

  scheduleNext();
}

function installWaitingMascot(root = document.body) {
  if (!root || !(root instanceof Element || root === document.body)) return;

  ensureMascotStyles();

  const candidates = [];
  if (root instanceof HTMLElement && root.textContent?.trim() === "目前等待順位") {
    candidates.push(root);
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let element;
  while ((element = walker.nextNode())) {
    if (element instanceof HTMLElement && element.textContent?.trim() === "目前等待順位") {
      candidates.push(element);
    }
  }

  candidates.forEach((label) => {
    const iconSlot = label.previousElementSibling;
    if (!(iconSlot instanceof HTMLElement)) return;

    const existingMascot = iconSlot.querySelector("[data-queue-waiting-mascot]");
    if (existingMascot instanceof HTMLElement) {
      scheduleMascotBlink(existingMascot);
      return;
    }

    const card = label.closest("div.bg-gradient-to-br") || label.parentElement;
    const isFirst = card?.textContent?.includes("第 1 位");

    iconSlot.className = "queue-waiting-mascot mx-auto mb-2 w-[76px] h-[62px] flex items-center justify-center";
    if (isFirst) iconSlot.classList.add("queue-mascot-first");
    iconSlot.removeAttribute("style");
    iconSlot.innerHTML = `
      <svg data-queue-waiting-mascot viewBox="0 0 96 78" width="76" height="62" aria-label="等待中的人物圖示" role="img">
        <ellipse cx="48" cy="72" rx="33" ry="4" fill="#DCEBFA" opacity="0.75" />
        <rect x="19" y="43" width="58" height="18" rx="8" fill="#DDF3EA" stroke="#55B786" stroke-width="3" />
        <path d="M24 59v11M72 59v11" stroke="#55B786" stroke-width="3" stroke-linecap="round" />
        <circle cx="48" cy="24" r="17" fill="#FFFDFB" stroke="#3B82C4" stroke-width="3" />
        <path d="M37 42c2-7 7-10 11-10s9 3 11 10v14H37V42Z" fill="#F8FBFF" stroke="#3B82C4" stroke-width="3" stroke-linejoin="round" />
        <path d="M39 50c2 4 5 6 9 6s7-2 9-6" fill="none" stroke="#3B82C4" stroke-width="3" stroke-linecap="round" />
        <rect x="36" y="54" width="10" height="18" rx="5" fill="#FFFDFB" stroke="#3B82C4" stroke-width="3" />
        <rect x="50" y="54" width="10" height="18" rx="5" fill="#FFFDFB" stroke="#3B82C4" stroke-width="3" />
        <circle class="queue-eye" cx="42" cy="23" r="2.2" fill="#235A93" />
        <circle class="queue-eye" cx="54" cy="23" r="2.2" fill="#235A93" />
        <path d="M44 30c2.2 2 5.8 2 8 0" fill="none" stroke="#55B786" stroke-width="2.4" stroke-linecap="round" />
        <circle cx="35" cy="29" r="3" fill="#FFCAD4" opacity="0.75" />
        <circle cx="61" cy="29" r="3" fill="#FFCAD4" opacity="0.75" />
        <circle cx="75" cy="14" r="9" fill="#FFFFFF" stroke="#55B786" stroke-width="2.5" />
        <path d="M75 9v6l4 2" fill="none" stroke="#55B786" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;

    scheduleMascotBlink(iconSlot);
  });
}

function updateQueueDialog(dialog) {
  if (!(dialog instanceof HTMLElement)) return;

  const heading = dialog.querySelector("h3");
  const dialogText = dialog.textContent || "";
  const isQueueLeaveDialog =
    heading?.textContent?.includes("排隊") ||
    dialogText.includes("失去目前順位") ||
    dialogText.includes("返回等待") ||
    dialogText.includes("確定取消") ||
    dialogText.includes("繼續等待") ||
    dialogText.includes("離開排隊");

  if (!isQueueLeaveDialog) return;

  if (heading && heading.textContent?.trim() !== "確定要離開排隊嗎？") {
    heading.textContent = "確定要離開排隊嗎？";
  }

  const description = heading?.nextElementSibling;
  if (
    description instanceof HTMLParagraphElement &&
    description.textContent?.trim() !== "重新加入時，將重新排到最後一位。"
  ) {
    description.textContent = "重新加入時，將重新排到最後一位。";
  }

  dialog.classList.add("backdrop-blur-sm");

  dialog.querySelectorAll("button").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;

    button.classList.add(
      "h-12",
      "py-0",
      "transition-transform",
      "duration-150",
      "active:scale-95"
    );

    const text = button.textContent?.trim();

    if (text === "返回等待") {
      button.textContent = "繼續等待";
      return;
    }

    if (text === "確定取消") {
      button.textContent = "離開排隊";
      return;
    }

    if ((text === "取消中…" || text === "離開中…") && !button.dataset.queueLeavingUi) {
      button.dataset.queueLeavingUi = "true";
      button.setAttribute("aria-busy", "true");
      button.innerHTML =
        '<span>離開中</span>' +
        '<span class="ml-1.5 inline-flex items-center gap-1" aria-hidden="true">' +
        '<span class="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>' +
        '<span class="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>' +
        '<span class="h-1.5 w-1.5 rounded-full bg-white animate-bounce"></span>' +
        "</span>";
    }
  });
}

function updateUi(root = document.body) {
  if (!root) return;

  replaceExactText(root, OLD_STATUS_TEXT, NEW_STATUS_TEXT);
  replaceExactText(root, "不排了", "取消排隊");
  replaceExactText(root, "已取消排隊", "已離開排隊");
  installWaitingMascot(root);

  if (root instanceof HTMLElement && root.matches('[role="dialog"]')) {
    updateQueueDialog(root);
  }

  if (root instanceof Element || root === document.body) {
    root.querySelectorAll?.('[role="dialog"]').forEach(updateQueueDialog);
  }
}

export default function QueueLiveStatusLabel() {
  useEffect(() => {
    updateUi();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          const textNode = mutation.target;
          const value = textNode.nodeValue?.trim();

          if (value === OLD_STATUS_TEXT) textNode.nodeValue = NEW_STATUS_TEXT;
          if (value === "不排了") textNode.nodeValue = "取消排隊";
          if (value === "已取消排隊") textNode.nodeValue = "已離開排隊";

          const dialog = textNode.parentElement?.closest?.('[role="dialog"]');
          if (dialog) updateQueueDialog(dialog);
          continue;
        }

        mutation.addedNodes.forEach((node) => updateUi(node));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      document.querySelectorAll(".queue-waiting-mascot[data-blink-timer]").forEach((mascot) => {
        const timer = Number(mascot.dataset.blinkTimer);
        if (timer) window.clearTimeout(timer);
      });
    };
  }, []);

  return null;
}
