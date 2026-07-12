"use client";

import { useEffect } from "react";

const CLOSED_MARKERS = ["此任務已截止", "任務已截止", "無法再接龍", "接龍已截止", "報名已截止"];
const CLOSED_RED_SOFT = "#FEF2F2";
const CLOSED_RED_BORDER = "#FECACA";

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function pageIsClosed() {
  const text = document.body?.innerText || document.body?.textContent || "";
  return CLOSED_MARKERS.some((marker) => text.includes(marker));
}

function allElements(root = document.body) {
  return [...(root?.querySelectorAll?.("*") || [])].filter((el) => el instanceof HTMLElement);
}

function smallestExact(root, text) {
  return allElements(root)
    .filter((el) => normalizeText(el.textContent) === text)
    .sort((a, b) => a.querySelectorAll("*").length - b.querySelectorAll("*").length)[0] || null;
}

function show(el, display = "block") {
  if (!(el instanceof HTMLElement)) return;
  el.style.setProperty("display", display, "important");
  el.removeAttribute("aria-hidden");
}

function hide(el) {
  if (!(el instanceof HTMLElement)) return;
  el.style.setProperty("display", "none", "important");
  el.setAttribute("aria-hidden", "true");
}

function findQueueCard() {
  const mascot = document.querySelector("[data-reference-queue-mascot]");
  if (!(mascot instanceof HTMLElement)) return null;

  const exactCard = mascot.closest(".mt-3.mb-3.overflow-hidden");
  if (exactCard instanceof HTMLElement) return exactCard;

  let current = mascot.parentElement;
  for (let depth = 0; depth < 8 && current; depth += 1) {
    const text = normalizeText(current.textContent);
    const className = current.className?.toString() || "";
    if (
      className.includes("overflow-hidden") &&
      (text.includes("目前等待順位") || text.includes("任務已結束") || text.includes("無法再接龍"))
    ) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function restoreQueueCard(queueCard) {
  show(queueCard, "block");
  queueCard.style.removeProperty("visibility");
  queueCard.style.removeProperty("height");
  queueCard.style.removeProperty("max-height");
  queueCard.style.removeProperty("overflow");

  let parent = queueCard.parentElement;
  for (let depth = 0; depth < 3 && parent; depth += 1) {
    if (parent.getAttribute("aria-hidden") === "true" || parent.style.display === "none") {
      show(parent, parent.classList.contains("flex") ? "flex" : "block");
    }
    parent = parent.parentElement;
  }
}

function stylePrimaryStatus(queueCard) {
  const label = smallestExact(queueCard, "任務已結束");
  if (!(label instanceof HTMLElement)) return;

  const leftBox = label.parentElement;
  const row = leftBox?.parentElement;
  if (!(leftBox instanceof HTMLElement) || !(row instanceof HTMLElement)) return;

  [...row.children].forEach((child) => {
    if (child instanceof HTMLElement && child !== leftBox) hide(child);
  });

  row.style.setProperty("display", "grid", "important");
  row.style.setProperty("grid-template-columns", "minmax(0, 1fr)", "important");
  row.style.setProperty("gap", "0", "important");
  row.style.setProperty("width", "100%", "important");

  leftBox.style.setProperty("display", "flex", "important");
  leftBox.style.setProperty("width", "100%", "important");
  leftBox.style.setProperty("max-width", "100%", "important");
  leftBox.style.setProperty("grid-column", "1 / -1", "important");
  leftBox.style.setProperty("justify-content", "center", "important");
  leftBox.style.setProperty("align-items", "center", "important");
  leftBox.style.setProperty("text-align", "center", "important");
  leftBox.style.setProperty("background-color", CLOSED_RED_SOFT, "important");
  leftBox.style.setProperty("border-color", CLOSED_RED_BORDER, "important");
  leftBox.style.setProperty("border-style", "solid", "important");
  leftBox.style.setProperty("border-width", "1px", "important");

  label.style.setProperty("display", "block", "important");
  label.style.setProperty("width", "100%", "important");
  label.style.setProperty("text-align", "center", "important");
  label.style.setProperty("color", "#111827", "important");
}

function hideClosedActions(queueCard) {
  ["更改名字", "不排了", "取消排隊"].forEach((text) => {
    const label = smallestExact(queueCard, text);
    if (!(label instanceof HTMLElement)) return;
    hide(label.closest("button, [role='button']") || label.parentElement);
  });
}

function applyFinalClosedLayout() {
  if (!pageIsClosed()) return;

  const queueCard = findQueueCard();
  if (!(queueCard instanceof HTMLElement)) return;

  restoreQueueCard(queueCard);
  queueCard.setAttribute("data-queue-closed-card", "true");
  stylePrimaryStatus(queueCard);
  hideClosedActions(queueCard);
}

export default function QueueClosedFinalLayout() {
  useEffect(() => {
    let frame = 0;
    const refresh = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyFinalClosedLayout);
    };

    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(refresh, 800);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
