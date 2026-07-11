"use client";

import { useEffect } from "react";

const STYLE_ID = "queue-small-screen-fix-styles";

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .queue-small-screen-stats-row {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
      gap: 10px !important;
      width: 100% !important;
      min-width: 0 !important;
    }

    .queue-small-screen-stat-card {
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .queue-small-screen-sync-label {
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      padding-inline: 4px !important;
      text-align: center !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: clip !important;
      line-height: 1.25 !important;
      font-size: clamp(12px, 3.7vw, 15px) !important;
      letter-spacing: -0.02em !important;
      box-sizing: border-box !important;
    }

    .queue-small-screen-action-button {
      min-width: 0 !important;
      padding-left: 10px !important;
      padding-right: 10px !important;
      font-size: clamp(14px, 4.2vw, 18px) !important;
      white-space: nowrap !important;
    }

    @media (max-width: 380px) {
      .queue-small-screen-stats-row {
        gap: 8px !important;
      }

      .queue-small-screen-stat-card {
        padding-left: 8px !important;
        padding-right: 8px !important;
      }

      .queue-small-screen-sync-label {
        font-size: clamp(11px, 3.55vw, 13px) !important;
        letter-spacing: -0.035em !important;
      }

      .queue-small-screen-action-button {
        font-size: clamp(13px, 4vw, 16px) !important;
        gap: 4px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function textEquals(element, text) {
  return element instanceof HTMLElement && element.textContent?.replace(/\s+/g, "").trim() === text.replace(/\s+/g, "");
}

function applyFixes() {
  ensureStyles();

  document.querySelectorAll("*").forEach((element) => {
    if (!(element instanceof HTMLElement)) return;

    if (textEquals(element, "排隊狀態即時同步")) {
      element.classList.add("queue-small-screen-sync-label");

      const statCard = element.parentElement;
      if (statCard instanceof HTMLElement) {
        statCard.classList.add("queue-small-screen-stat-card");

        const row = statCard.parentElement;
        if (row instanceof HTMLElement) {
          row.classList.add("queue-small-screen-stats-row");
          Array.from(row.children).forEach((child) => {
            if (child instanceof HTMLElement) child.classList.add("queue-small-screen-stat-card");
          });
        }
      }
    }

    if (textEquals(element, "更改名字") || textEquals(element, "取消排隊")) {
      const button = element.closest("button");
      if (button instanceof HTMLElement) button.classList.add("queue-small-screen-action-button");
    }
  });
}

export default function QueueSmallScreenFix() {
  useEffect(() => {
    applyFixes();

    let frame = 0;
    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyFixes);
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", applyFixes);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", applyFixes);
    };
  }, []);

  return null;
}
