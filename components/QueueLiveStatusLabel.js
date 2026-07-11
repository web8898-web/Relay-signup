"use client";

import { useEffect } from "react";

const OLD_STATUS_TEXT = "即時更新中";
const NEW_STATUS_TEXT = "排隊狀態即時同步";
const MASCOT_STYLE_ID = "queue-waiting-mascot-styles";
const ACTIVE_ACTIONS = [
  "queue-mascot-phone",
  "queue-mascot-look",
  "queue-mascot-yawn",
  "queue-mascot-stretch",
  "queue-mascot-watch",
];

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
    @keyframes queueMascotPhoneBody {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      18%, 82% { transform: translateY(1px) rotate(2deg); }
    }
    @keyframes queueMascotPhoneItem {
      0%, 12% { opacity: 0; transform: translate(13px, 8px) rotate(28deg) scale(0.75); }
      28%, 75% { opacity: 1; transform: translate(0, 0) rotate(-4deg) scale(1); }
      92%, 100% { opacity: 0; transform: translate(13px, 8px) rotate(28deg) scale(0.75); }
    }
    @keyframes queueMascotLookHead {
      0%, 100% { transform: rotate(0deg) translateX(0); }
      22%, 42% { transform: rotate(-8deg) translateX(-2px); }
      58%, 78% { transform: rotate(8deg) translateX(2px); }
    }
    @keyframes queueMascotYawnHead {
      0%, 100% { transform: translateY(0); }
      30%, 72% { transform: translateY(2px); }
    }
    @keyframes queueMascotYawnMouth {
      0%, 18%, 88%, 100% { opacity: 0; transform: scale(0.3); }
      36%, 70% { opacity: 1; transform: scale(1); }
    }
    @keyframes queueMascotStretchBody {
      0%, 100% { transform: translateY(0) scaleY(1); }
      34%, 68% { transform: translateY(-4px) scaleY(1.05); }
    }
    @keyframes queueMascotStretchArms {
      0%, 15%, 88%, 100% { opacity: 0; transform: translateY(6px) scaleY(0.65); }
      34%, 70% { opacity: 1; transform: translateY(0) scaleY(1); }
    }
    @keyframes queueMascotWatchHead {
      0%, 100% { transform: rotate(0deg) translateY(0); }
      28%, 72% { transform: rotate(7deg) translateY(2px); }
    }
    @keyframes queueMascotWatchItem {
      0%, 18%, 88%, 100% { opacity: 0; transform: scale(0.6); }
      36%, 72% { opacity: 1; transform: scale(1); }
    }

    .queue-waiting-mascot {
      animation: queueMascotBreathe 3.2s ease-in-out infinite;
      transform-origin: center bottom;
    }
    .queue-waiting-mascot.queue-mascot-first {
      animation: queueMascotFirst 560ms ease-out 1, queueMascotBreathe 3.2s ease-in-out 560ms infinite;
    }
    .queue-waiting-mascot .queue-mascot-body,
    .queue-waiting-mascot .queue-mascot-head,
    .queue-waiting-mascot .queue-mascot-phone-item,
    .queue-waiting-mascot .queue-mascot-yawn-mouth,
    .queue-waiting-mascot .queue-mascot-stretch-arms,
    .queue-waiting-mascot .queue-mascot-watch-item {
      transform-box: fill-box;
      transform-origin: center;
    }
    .queue-waiting-mascot .queue-eye {
      transform-box: fill-box;
      transform-origin: center;
      transition: transform 90ms ease;
    }
    .queue-waiting-mascot.queue-mascot-blink .queue-eye {
      transform: scaleY(0.12);
    }
    .queue-waiting-mascot .queue-mascot-phone-item,
    .queue-waiting-mascot .queue-mascot-yawn-mouth,
    .queue-waiting-mascot .queue-mascot-stretch-arms,
    .queue-waiting-mascot .queue-mascot-watch-item {
      opacity: 0;
    }
    .queue-waiting-mascot.queue-mascot-phone .queue-mascot-body {
      animation: queueMascotPhoneBody 4.6s ease-in-out 1;
    }
    .queue-waiting-mascot.queue-mascot-phone .queue-mascot-phone-item {
      animation: queueMascotPhoneItem 4.6s ease-in-out 1;
    }
    .queue-waiting-mascot.queue-mascot-look .queue-mascot-head {
      animation: queueMascotLookHead 2.8s ease-in-out 1;
    }
    .queue-waiting-mascot.queue-mascot-yawn .queue-mascot-head {
      animation: queueMascotYawnHead 3s ease-in-out 1;
    }
    .queue-waiting-mascot.queue-mascot-yawn .queue-normal-mouth {
      opacity: 0;
    }
    .queue-waiting-mascot.queue-mascot-yawn .queue-mascot-yawn-mouth {
      animation: queueMascotYawnMouth 3s ease-in-out 1;
    }
    .queue-waiting-mascot.queue-mascot-stretch .queue-mascot-body {
      animation: queueMascotStretchBody 3.2s ease-in-out 1;
    }
    .queue-waiting-mascot.queue-mascot-stretch .queue-mascot-stretch-arms {
      animation: queueMascotStretchArms 3.2s ease-in-out 1;
    }
    .queue-waiting-mascot.queue-mascot-watch .queue-mascot-head {
      animation: queueMascotWatchHead 2.6s ease-in-out 1;
    }
    .queue-waiting-mascot.queue-mascot-watch .queue-mascot-watch-item {
      animation: queueMascotWatchItem 2.6s ease-in-out 1;
    }

    @media (prefers-reduced-motion: reduce) {
      .queue-waiting-mascot,
      .queue-waiting-mascot.queue-mascot-first,
      .queue-waiting-mascot .queue-mascot-body,
      .queue-waiting-mascot .queue-mascot-head,
      .queue-waiting-mascot .queue-mascot-phone-item,
      .queue-waiting-mascot .queue-mascot-yawn-mouth,
      .queue-waiting-mascot .queue-mascot-stretch-arms,
      .queue-waiting-mascot .queue-mascot-watch-item {
        animation: none !important;
      }
      .queue-waiting-mascot .queue-eye {
        transition: none;
      }
    }
  `;
  document.head.appendChild(style);
}

function clearMascotAction(mascot) {
  ACTIVE_ACTIONS.forEach((className) => mascot.classList.remove(className));
  mascot.dataset.actionActive = "false";
}

function blinkMascot(mascot) {
  if (!(mascot instanceof HTMLElement) || !mascot.isConnected || document.hidden) return;

  mascot.classList.add("queue-mascot-blink");
  window.setTimeout(() => mascot.classList.remove("queue-mascot-blink"), 120);

  if (Math.random() < 0.2) {
    window.setTimeout(() => {
      if (!mascot.isConnected || document.hidden) return;
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

function chooseMascotAction() {
  const roll = Math.random() * 100;
  if (roll < 35) return { className: "queue-mascot-phone", duration: 4600 };
  if (roll < 55) return { className: "queue-mascot-look", duration: 2800 };
  if (roll < 75) return { className: "queue-mascot-blink", duration: 260 };
  if (roll < 85) return { className: "queue-mascot-yawn", duration: 3000 };
  if (roll < 93) return { className: "queue-mascot-stretch", duration: 3200 };
  return { className: "queue-mascot-watch", duration: 2600 };
}

function playMascotAction(mascot) {
  if (!(mascot instanceof HTMLElement) || !mascot.isConnected || document.hidden) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    blinkMascot(mascot);
    return;
  }
  if (mascot.dataset.actionActive === "true") return;

  const action = chooseMascotAction();
  if (action.className === "queue-mascot-blink") {
    blinkMascot(mascot);
    return;
  }

  mascot.dataset.actionActive = "true";
  clearMascotAction(mascot);
  mascot.dataset.actionActive = "true";
  mascot.classList.add(action.className);

  const timer = window.setTimeout(() => {
    if (!mascot.isConnected) return;
    clearMascotAction(mascot);
  }, action.duration);
  mascot.dataset.actionTimer = String(timer);
}

function scheduleMascotAction(mascot) {
  if (!(mascot instanceof HTMLElement) || mascot.dataset.actionScheduled === "true") return;

  mascot.dataset.actionScheduled = "true";

  const scheduleNext = () => {
    if (!mascot.isConnected) return;
    const delay = 20000 + Math.floor(Math.random() * 70001);
    const timer = window.setTimeout(() => {
      if (!document.hidden) playMascotAction(mascot);
      scheduleNext();
    }, delay);
    mascot.dataset.actionScheduleTimer = String(timer);
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
      scheduleMascotBlink(iconSlot);
      scheduleMascotAction(iconSlot);
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
        <g class="queue-mascot-bench">
          <rect x="19" y="43" width="58" height="18" rx="8" fill="#DDF3EA" stroke="#55B786" stroke-width="3" />
          <path d="M24 59v11M72 59v11" stroke="#55B786" stroke-width="3" stroke-linecap="round" />
        </g>
        <g class="queue-mascot-body">
          <path d="M37 42c2-7 7-10 11-10s9 3 11 10v14H37V42Z" fill="#F8FBFF" stroke="#3B82C4" stroke-width="3" stroke-linejoin="round" />
          <path d="M39 50c2 4 5 6 9 6s7-2 9-6" fill="none" stroke="#3B82C4" stroke-width="3" stroke-linecap="round" />
          <rect x="36" y="54" width="10" height="18" rx="5" fill="#FFFDFB" stroke="#3B82C4" stroke-width="3" />
          <rect x="50" y="54" width="10" height="18" rx="5" fill="#FFFDFB" stroke="#3B82C4" stroke-width="3" />
          <g class="queue-mascot-stretch-arms" fill="none" stroke="#3B82C4" stroke-width="3" stroke-linecap="round">
            <path d="M39 45c-7-7-8-15-5-22" />
            <path d="M57 45c7-7 8-15 5-22" />
          </g>
          <g class="queue-mascot-head">
            <circle cx="48" cy="24" r="17" fill="#FFFDFB" stroke="#3B82C4" stroke-width="3" />
            <circle class="queue-eye" cx="42" cy="23" r="2.2" fill="#235A93" />
            <circle class="queue-eye" cx="54" cy="23" r="2.2" fill="#235A93" />
            <path class="queue-normal-mouth" d="M44 30c2.2 2 5.8 2 8 0" fill="none" stroke="#55B786" stroke-width="2.4" stroke-linecap="round" />
            <ellipse class="queue-mascot-yawn-mouth" cx="48" cy="31" rx="3.4" ry="4.6" fill="#7A4A46" />
            <circle cx="35" cy="29" r="3" fill="#FFCAD4" opacity="0.75" />
            <circle cx="61" cy="29" r="3" fill="#FFCAD4" opacity="0.75" />
          </g>
          <g class="queue-mascot-phone-item">
            <rect x="54" y="36" width="12" height="20" rx="2.6" fill="#4B5563" stroke="#334155" stroke-width="2" />
            <rect x="56.5" y="39" width="7" height="12" rx="1" fill="#DDF3EA" />
          </g>
          <g class="queue-mascot-watch-item">
            <circle cx="38" cy="45" r="4" fill="#FFFFFF" stroke="#55B786" stroke-width="2" />
            <path d="M38 42.5v3l2 1" fill="none" stroke="#55B786" stroke-width="1.4" stroke-linecap="round" />
          </g>
        </g>
        <circle cx="75" cy="14" r="9" fill="#FFFFFF" stroke="#55B786" stroke-width="2.5" />
        <path d="M75 9v6l4 2" fill="none" stroke="#55B786" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;

    scheduleMascotBlink(iconSlot);
    scheduleMascotAction(iconSlot);
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
      document.querySelectorAll(".queue-waiting-mascot").forEach((mascot) => {
        ["blinkTimer", "actionTimer", "actionScheduleTimer"].forEach((key) => {
          const timer = Number(mascot.dataset[key]);
          if (timer) window.clearTimeout(timer);
        });
      });
    };
  }, []);

  return null;
}
