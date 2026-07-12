"use client";

import { useEffect } from "react";

const CARD_MARKER = "data-queue-closed-final-card";

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function pageIsClosed() {
  const text = document.body?.innerText || document.body?.textContent || "";
  return text.includes("此任務已截止") || text.includes("無法再接龍") || text.includes("已截止");
}

function queueClosedMarkup() {
  return `
    <div class="px-5 py-6 text-center bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      <div class="mx-auto mb-4 w-[150px] h-[132px]" aria-hidden="true">
        <svg viewBox="0 0 180 150" width="150" height="132" role="img" aria-label="空椅子與時鐘">
          <ellipse cx="88" cy="142" rx="61" ry="7" fill="#E9EEF4" opacity=".65"/>
          <rect x="37" y="84" width="101" height="31" rx="13" fill="#D9EEE1" stroke="#72B993" stroke-width="4"/>
          <rect x="27" y="107" width="121" height="13" rx="7" fill="#D9EEE1" stroke="#72B993" stroke-width="4"/>
          <path d="M39 118v18M136 118v18" stroke="#72B993" stroke-width="4" stroke-linecap="round"/>
          <circle cx="151" cy="25" r="17" fill="#FFFDFC" stroke="#72B993" stroke-width="4"/>
          <path d="M151 14v12l8 5" fill="none" stroke="#72B993" stroke-width="4" stroke-linecap="round"/>
        </svg>
      </div>

      <p class="text-5xl font-black tracking-tight leading-none text-rose-500">已截止</p>
      <p class="mt-5 text-xl font-bold text-gray-700">無法再接龍</p>

      <div class="mt-6 border-t border-sky-100 pt-5">
        <div class="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-center">
          <p class="text-xl font-semibold text-gray-900">任務已結束</p>
        </div>
      </div>
    </div>
  `;
}

function findQueueCard() {
  const cards = [...document.querySelectorAll(".mt-3.mb-3.overflow-hidden")].filter(
    (el) => el instanceof HTMLElement
  );

  return (
    cards.find((card) => {
      const text = normalizeText(card.textContent);
      return (
        text.includes("目前等待順位") ||
        text.includes("目前等待中") ||
        text.includes("任務已結束") ||
        text.includes("已完成")
      );
    }) || null
  );
}

function restoreElement(el, display = "block") {
  if (!(el instanceof HTMLElement)) return;
  el.style.setProperty("display", display, "important");
  el.style.removeProperty("visibility");
  el.style.removeProperty("height");
  el.style.removeProperty("max-height");
  el.removeAttribute("aria-hidden");
}

function hideDuplicateStatusRows(queueCard) {
  const listContainer = queueCard.parentElement?.nextElementSibling;
  if (!(listContainer instanceof HTMLElement)) return;

  const rows = [...listContainer.querySelectorAll("*")].filter((el) => el instanceof HTMLElement);
  rows.forEach((el) => {
    const text = normalizeText(el.textContent);
    if (text === "任務已結束" || text === "已截止" || /^已完成\s*\d+\s*位$/.test(text)) {
      const row = el.closest("div");
      if (row instanceof HTMLElement && row !== listContainer) {
        row.style.setProperty("display", "none", "important");
        row.setAttribute("aria-hidden", "true");
      }
    }
  });
}

function applyFinalClosedLayout() {
  if (!pageIsClosed()) return;

  const queueCard = findQueueCard();
  if (!(queueCard instanceof HTMLElement)) return;

  restoreElement(queueCard, "block");
  let parent = queueCard.parentElement;
  for (let depth = 0; depth < 3 && parent; depth += 1) {
    if (parent.style.display === "none" || parent.getAttribute("aria-hidden") === "true") {
      restoreElement(parent, parent.classList.contains("flex") ? "flex" : "block");
    }
    parent = parent.parentElement;
  }

  if (queueCard.getAttribute(CARD_MARKER) !== "true") {
    queueCard.innerHTML = queueClosedMarkup();
    queueCard.setAttribute(CARD_MARKER, "true");
  }

  queueCard.className = "mt-3 mb-3 overflow-hidden rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-sm";
  hideDuplicateStatusRows(queueCard);
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
    const interval = window.setInterval(refresh, 700);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
