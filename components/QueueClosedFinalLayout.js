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

function nearestRoundedPanel(el) {
  if (!(el instanceof HTMLElement)) return null;
  let current = el;
  for (let depth = 0; depth < 8 && current.parentElement; depth += 1) {
    current = current.parentElement;
    const style = window.getComputedStyle(current);
    const radius = parseFloat(style.borderTopLeftRadius) || 0;
    if (radius >= 20 && current.getBoundingClientRect().width >= 240) return current;
  }
  return null;
}

function hide(el) {
  if (!(el instanceof HTMLElement)) return;
  el.style.setProperty("display", "none", "important");
  el.setAttribute("aria-hidden", "true");
}

function hideEmptyAncestors(el, stopAt) {
  let current = el instanceof HTMLElement ? el.parentElement : null;
  for (let depth = 0; depth < 4 && current && current !== stopAt; depth += 1) {
    const visible = [...current.children].some(
      (child) => child instanceof HTMLElement && window.getComputedStyle(child).display !== "none"
    );
    if (visible) break;
    hide(current);
    current = current.parentElement;
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
    const button = label.closest("button, [role='button']") || label.parentElement;
    hide(button);
  });

  allElements(queueCard).forEach((el) => {
    const text = normalizeText(el.textContent);
    if (text === "儲存名字" || text === "儲存中…") {
      const panel = el.closest("div.rounded-2xl") || el.parentElement?.parentElement;
      hide(panel);
    }
  });
}

function hideDuplicateListSummary(queueCard) {
  const candidates = allElements(document.body)
    .filter((el) => normalizeText(el.textContent) === "任務已結束" && !queueCard.contains(el))
    .sort((a, b) => a.querySelectorAll("*").length - b.querySelectorAll("*").length);

  candidates.forEach((label) => {
    const row = label.parentElement?.parentElement || label.parentElement;
    hide(row);
    hideEmptyAncestors(row, queueCard);
  });

  allElements(document.body).forEach((el) => {
    if (queueCard.contains(el)) return;
    const text = normalizeText(el.textContent);
    if (/^已完成\s*\d+\s*位$/.test(text) || text === "已截止") {
      const row = el.parentElement?.parentElement || el.parentElement;
      if (row instanceof HTMLElement && row.getBoundingClientRect().top > queueCard.getBoundingClientRect().bottom - 12) {
        hide(row);
        hideEmptyAncestors(row, queueCard);
      }
    }
  });
}

function applyFinalClosedLayout() {
  if (!pageIsClosed()) return;

  const mascot = document.querySelector("[data-reference-queue-mascot]");
  if (!(mascot instanceof HTMLElement)) return;

  const queueCard = nearestRoundedPanel(mascot);
  if (!(queueCard instanceof HTMLElement)) return;

  queueCard.setAttribute("data-queue-closed-card", "true");
  stylePrimaryStatus(queueCard);
  hideClosedActions(queueCard);
  hideDuplicateListSummary(queueCard);
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
    const interval = window.setInterval(refresh, 1200);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
