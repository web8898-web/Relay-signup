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

function allElements() {
  return [...document.querySelectorAll("*")].filter((el) => el instanceof HTMLElement);
}

function findVisualBox(el) {
  if (!(el instanceof HTMLElement)) return null;
  const baseWidth = el.getBoundingClientRect().width;
  let current = el;

  for (let depth = 0; depth < 7 && current.parentElement; depth += 1) {
    current = current.parentElement;
    const rect = current.getBoundingClientRect();
    const style = window.getComputedStyle(current);
    const radius = parseFloat(style.borderTopLeftRadius) || 0;
    const borderWidth = parseFloat(style.borderTopWidth) || 0;
    if ((radius >= 12 || borderWidth > 0) && rect.width >= baseWidth + 32) return current;
  }

  return el.parentElement;
}

function hideElementAndEmptyParents(el) {
  if (!(el instanceof HTMLElement)) return;
  el.style.display = "none";
  el.setAttribute("aria-hidden", "true");

  let parent = el.parentElement;
  for (let depth = 0; depth < 3 && parent; depth += 1) {
    const visibleChildren = [...parent.children].filter(
      (child) => child instanceof HTMLElement && window.getComputedStyle(child).display !== "none"
    );
    if (visibleChildren.length > 0) break;
    parent.style.display = "none";
    parent.setAttribute("aria-hidden", "true");
    parent = parent.parentElement;
  }
}

function stylePrimaryClosedLabel(label) {
  if (!(label instanceof HTMLElement)) return;
  const box = findVisualBox(label);
  if (!(box instanceof HTMLElement)) return;

  box.setAttribute("data-queue-final-primary-status", "true");
  box.style.display = "flex";
  box.style.width = "100%";
  box.style.maxWidth = "100%";
  box.style.flex = "1 1 100%";
  box.style.gridColumn = "1 / -1";
  box.style.justifyContent = "center";
  box.style.alignItems = "center";
  box.style.textAlign = "center";
  box.style.backgroundColor = CLOSED_RED_SOFT;
  box.style.borderColor = CLOSED_RED_BORDER;
  box.style.borderStyle = "solid";
  box.style.borderWidth = "1px";

  label.style.display = "block";
  label.style.width = "100%";
  label.style.textAlign = "center";
  label.style.color = "#111827";
}

function applyFinalClosedLayout() {
  if (!pageIsClosed()) return;

  const elements = allElements();
  const labels = elements
    .filter((el) => normalizeText(el.textContent) === "任務已結束")
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

  if (labels.length === 0) return;

  const primary = labels[0];
  stylePrimaryClosedLabel(primary);

  labels.slice(1).forEach((label) => {
    const box = findVisualBox(label);
    hideElementAndEmptyParents(box instanceof HTMLElement ? box : label);
  });

  const primaryBox = findVisualBox(primary);
  if (primaryBox instanceof HTMLElement) {
    let row = primaryBox.parentElement;
    if (row instanceof HTMLElement) {
      [...row.children].forEach((child) => {
        if (!(child instanceof HTMLElement) || child === primaryBox) return;
        const text = normalizeText(child.textContent);
        if (text === "已截止" || text === "排隊狀態即時同步") hideElementAndEmptyParents(child);
      });
      row.style.display = "grid";
      row.style.gridTemplateColumns = "minmax(0, 1fr)";
      row.style.width = "100%";
      row.style.gap = "0";
    }
  }
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

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
