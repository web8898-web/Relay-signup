"use client";

import { useEffect } from "react";

const CLOSED_MARKERS = [
  "此任務已截止",
  "任務已截止",
  "無法再接龍",
  "接龍已截止",
  "報名已截止",
];

const CLOSED_RED = "#EF4444";
const CLOSED_RED_SOFT = "#FEF2F2";
const CLOSED_RED_BORDER = "#FECACA";
const CLOSED_SUBTITLE = "#4B5563";

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

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
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

function allElements(root = document.body) {
  return [...(root.querySelectorAll?.("*") || [])].filter(
    (el) => el instanceof HTMLElement
  );
}

function smallestMatch(elements, predicate) {
  return elements
    .filter((el) => predicate(normalizeText(el.textContent)))
    .sort((a, b) => a.querySelectorAll("*").length - b.querySelectorAll("*").length)[0];
}

function replaceSmallest(elements, predicate, replacement, attribute) {
  const el = smallestMatch(elements, predicate);
  if (!el) return;
  el.textContent = replacement;
  if (attribute) el.setAttribute(attribute, "true");
}

function hideActionByText(elements, label) {
  const el = smallestMatch(elements, (text) => text === label);
  if (!el) return;
  const control = el.closest("button, a, [role='button']") || el.parentElement;
  if (!(control instanceof HTMLElement)) return;
  control.style.display = "none";
  control.setAttribute("aria-hidden", "true");
  if ("disabled" in control) control.disabled = true;
}

function addStaticClosedDot(title) {
  const parent = title.parentElement;
  if (!(parent instanceof HTMLElement)) return;
  if (parent.querySelector("[data-queue-closed-dot='true']")) return;

  const dot = document.createElement("span");
  dot.setAttribute("data-queue-closed-dot", "true");
  dot.setAttribute("aria-hidden", "true");
  dot.style.display = "block";
  dot.style.width = "8px";
  dot.style.height = "8px";
  dot.style.margin = "0 auto 8px";
  dot.style.borderRadius = "9999px";
  dot.style.backgroundColor = CLOSED_RED;
  dot.style.flex = "0 0 auto";
  parent.insertBefore(dot, title);
}

function styleClosedBadge(elements) {
  const badgeText = elements.filter((el) => {
    if (normalizeText(el.textContent) !== "已截止") return false;
    if (el.hasAttribute("data-queue-closed-title")) return false;
    if (el.hasAttribute("data-queue-closed-status")) return false;
    const ownClass = el.className?.toString() || "";
    const parentClass = el.parentElement?.className?.toString() || "";
    return /rounded|badge|pill/.test(`${ownClass} ${parentClass}`);
  });

  badgeText.forEach((el) => {
    const ownClass = el.className?.toString() || "";
    const target = /rounded|badge|pill/.test(ownClass) ? el : el.parentElement;
    if (!(target instanceof HTMLElement)) return;
    target.style.color = CLOSED_RED;
    target.style.backgroundColor = CLOSED_RED_SOFT;
    target.style.borderColor = CLOSED_RED_BORDER;
    target.style.borderStyle = "solid";
    if (!target.style.borderWidth) target.style.borderWidth = "1px";
  });
}

function applyClosedVisuals(root = document.body) {
  const title = root.querySelector?.("[data-queue-closed-title='true']");
  if (title instanceof HTMLElement) {
    title.style.color = CLOSED_RED;
    addStaticClosedDot(title);
  }

  const subtitle = root.querySelector?.("[data-queue-closed-subtitle='true']");
  if (subtitle instanceof HTMLElement) subtitle.style.color = CLOSED_SUBTITLE;

  styleClosedBadge(allElements(root));
}

function applyClosedCopy(root = document.body) {
  const elements = allElements(root);

  const waitingTitle = smallestMatch(elements, (text) => text === "目前等待順位");
  if (waitingTitle) {
    waitingTitle.style.display = "none";
    waitingTitle.setAttribute("aria-hidden", "true");
  }

  replaceSmallest(
    elements,
    (text) => /^第\s*\d+\s*位$/.test(text),
    "已截止",
    "data-queue-closed-title"
  );

  replaceSmallest(
    elements,
    (text) => /你前面還有\s*\d+\s*位[，,、]?\s*請稍候/.test(text),
    "無法再接龍",
    "data-queue-closed-subtitle"
  );

  const liveStatus = smallestMatch(elements, (text) => text === "排隊狀態即時同步");
  if (liveStatus) {
    const container = liveStatus.parentElement;
    liveStatus.textContent = "已截止";
    liveStatus.setAttribute("data-queue-closed-status", "true");
    if (container instanceof HTMLElement) {
      [...container.children].forEach((child) => {
        if (child instanceof HTMLElement && child !== liveStatus) child.style.display = "none";
      });
    }
  }

  const waitingLabels = elements
    .filter((el) => /^等待中\s*\d+\s*位$/.test(normalizeText(el.textContent)))
    .sort((a, b) => a.querySelectorAll("*").length - b.querySelectorAll("*").length);
  waitingLabels.forEach((el) => {
    el.textContent = "任務已結束";
    el.setAttribute("data-queue-closed-status", "true");
  });

  const completedLabels = elements
    .filter((el) => /^已完成\s*\d+\s*位$/.test(normalizeText(el.textContent)))
    .sort((a, b) => a.querySelectorAll("*").length - b.querySelectorAll("*").length);
  completedLabels.forEach((el) => {
    el.textContent = "已截止";
    el.setAttribute("data-queue-closed-status", "true");
  });

  hideActionByText(elements, "更改名字");
  hideActionByText(elements, "取消排隊");
  applyClosedVisuals(root);
}

function applyClosedMascot(root = document.body) {
  if (!root || !pageIsClosed()) return;

  const mascots = root.querySelectorAll?.("[data-reference-queue-mascot]") || [];
  mascots.forEach((mascot) => {
    if (!(mascot instanceof HTMLElement)) return;
    if (mascot.dataset.closedSeatOnly !== "true") {
      stopMascotTimers(mascot);
      mascot.dataset.closedSeatOnly = "true";
      mascot.dataset.referenceActionActive = "false";
      mascot.dataset.referenceActionScheduled = "false";
      mascot.dataset.referenceSpeechScheduled = "false";
      mascot.className = "queue-reference-mascot queue-reference-closed";
      mascot.innerHTML = closedSeatSvg();
    }
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
