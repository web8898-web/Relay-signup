"use client";

import { useEffect } from "react";

const STYLE_ID = "queue-small-screen-fix-styles";

function ensureStyles() {
  let style = document.getElementById(STYLE_ID);
  if (!(style instanceof HTMLStyleElement)) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
    .queue-small-screen-stats-row {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
      gap: 10px !important;
      width: 100% !important;
      min-width: 0 !important;
      align-items: stretch !important;
    }

    .queue-small-screen-stat-card {
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    .queue-small-screen-sync-label {
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      padding-inline: 6px !important;
      text-align: center !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      line-height: 1.2 !important;
      font-size: clamp(12px, 3.45vw, 15px) !important;
      letter-spacing: -0.025em !important;
      box-sizing: border-box !important;
    }

    .queue-small-screen-action-row {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
      gap: 10px !important;
      width: 100% !important;
      min-width: 0 !important;
    }

    .queue-small-screen-action-button {
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
      padding-left: 10px !important;
      padding-right: 10px !important;
      font-size: clamp(14px, 4vw, 18px) !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    @media (max-width: 380px) {
      .queue-small-screen-stats-row,
      .queue-small-screen-action-row {
        gap: 8px !important;
      }

      .queue-small-screen-stat-card {
        padding-left: 8px !important;
        padding-right: 8px !important;
      }

      .queue-small-screen-sync-label {
        font-size: 12px !important;
        letter-spacing: -0.04em !important;
      }

      .queue-small-screen-action-button {
        padding-left: 8px !important;
        padding-right: 8px !important;
        font-size: 14px !important;
        gap: 4px !important;
      }
    }

    @media (max-width: 330px) {
      .queue-small-screen-stats-row,
      .queue-small-screen-action-row {
        grid-template-columns: 1fr !important;
      }

      .queue-small-screen-sync-label {
        white-space: normal !important;
        text-overflow: initial !important;
      }
    }
  `;
}

function normalizedText(element) {
  return element instanceof HTMLElement
    ? (element.textContent || "").replace(/\s+/g, "").trim()
    : "";
}

function isLeafTextElement(element, text) {
  if (!(element instanceof HTMLElement)) return false;
  if (normalizedText(element) !== text.replace(/\s+/g, "")) return false;
  return !Array.from(element.children).some(
    (child) => child instanceof HTMLElement && normalizedText(child) === normalizedText(element)
  );
}

function findTwoColumnAncestor(element, requiredTexts) {
  let current = element?.parentElement;
  for (let depth = 0; current instanceof HTMLElement && depth < 5; depth += 1) {
    const children = Array.from(current.children).filter((child) => child instanceof HTMLElement);
    const text = normalizedText(current);
    const hasAllTexts = requiredTexts.every((required) => text.includes(required.replace(/\s+/g, "")));
    if (children.length === 2 && hasAllTexts) return current;
    current = current.parentElement;
  }
  return null;
}

function clearOldMarks() {
  document.querySelectorAll(
    ".queue-small-screen-stats-row,.queue-small-screen-stat-card,.queue-small-screen-sync-label,.queue-small-screen-action-row,.queue-small-screen-action-button"
  ).forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    element.classList.remove(
      "queue-small-screen-stats-row",
      "queue-small-screen-stat-card",
      "queue-small-screen-sync-label",
      "queue-small-screen-action-row",
      "queue-small-screen-action-button"
    );
  });
}

function applyFixes() {
  ensureStyles();
  clearOldMarks();

  const elements = Array.from(document.querySelectorAll("body *"));

  const syncLabel = elements.find((element) => isLeafTextElement(element, "排隊狀態即時同步"));
  if (syncLabel instanceof HTMLElement) {
    syncLabel.classList.add("queue-small-screen-sync-label");
    const row = findTwoColumnAncestor(syncLabel, ["等待中", "排隊狀態即時同步"]);
    if (row instanceof HTMLElement) {
      row.classList.add("queue-small-screen-stats-row");
      Array.from(row.children).forEach((child) => {
        if (child instanceof HTMLElement) child.classList.add("queue-small-screen-stat-card");
      });
    }
  }

  const renameText = elements.find((element) => isLeafTextElement(element, "更改名字"));
  const cancelText = elements.find((element) => isLeafTextElement(element, "取消排隊"));
  const renameButton = renameText instanceof HTMLElement ? renameText.closest("button") : null;
  const cancelButton = cancelText instanceof HTMLElement ? cancelText.closest("button") : null;

  if (renameButton instanceof HTMLElement) renameButton.classList.add("queue-small-screen-action-button");
  if (cancelButton instanceof HTMLElement) cancelButton.classList.add("queue-small-screen-action-button");

  if (renameButton instanceof HTMLElement && cancelButton instanceof HTMLElement) {
    const row = findTwoColumnAncestor(renameButton, ["更改名字", "取消排隊"]);
    if (row instanceof HTMLElement && row.contains(cancelButton)) {
      row.classList.add("queue-small-screen-action-row");
    }
  }
}

export default function QueueSmallScreenFix() {
  useEffect(() => {
    applyFixes();

    let frame = 0;
    const refresh = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyFixes);
    };

    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
      clearOldMarks();
    };
  }, []);

  return null;
}
