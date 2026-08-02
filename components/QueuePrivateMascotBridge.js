"use client";

import { useEffect } from "react";

const SLOT_ATTR = "data-private-queue-inline-mascot-slot";
const TRIGGER_ATTR = "data-private-queue-inline-mascot-trigger";
const HIDDEN_BADGE_ATTR = "data-private-queue-hidden-rank-badge";
const LOADING_CARD_ATTR = "data-queue-loading-enhanced";
const LOADING_COUNT_ATTR = "data-queue-loading-count";
const STYLE_ID = "private-queue-status-polish";
const TRIGGER_TEXT = "目前等待順位";

function findStatusLabel() {
  return [...document.querySelectorAll("p")].find(
    (element) =>
      element instanceof HTMLElement &&
      element.textContent?.trim() === "你的排隊狀態"
  );
}

function findLoadingText() {
  return [...document.querySelectorAll("div, p, span")].find(
    (element) =>
      element instanceof HTMLElement &&
      element.textContent?.trim() === "正在同步排隊狀態…"
  );
}

function findWaitingCountLabel() {
  return [...document.querySelectorAll("span")].find(
    (element) =>
      element instanceof HTMLElement &&
      (/^目前\s*\d+\s*位等待中$/.test(element.textContent?.trim() || "") ||
        element.hasAttribute(LOADING_COUNT_ATTR))
  );
}

function getWaitingCountFromStatusCard() {
  const label = findStatusLabel();
  if (!(label instanceof HTMLElement)) return null;

  const name = label.nextElementSibling;
  const rank = name?.nextElementSibling;
  const ahead = rank?.nextElementSibling;
  const infoGrid = ahead?.nextElementSibling;
  if (!(infoGrid instanceof HTMLElement)) return null;

  const firstCard = infoGrid.firstElementChild;
  if (!(firstCard instanceof HTMLElement)) return null;

  const valueText = firstCard.querySelector("p:nth-child(2)")?.textContent || "";
  const match = valueText.match(/(\d+)\s*位?/);
  return match ? Number(match[1]) : null;
}

function ensurePolishStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes queueSyncSpin { to { transform: rotate(360deg); } }
    @keyframes queueSyncDot {
      0%,70%,100% { opacity:.28; transform:translateY(0) scale(.9); }
      35% { opacity:1; transform:translateY(-3px) scale(1.08); }
    }
    @keyframes queueSyncGlow {
      0%,100% { opacity:.42; transform:scale(.94); }
      50% { opacity:.82; transform:scale(1.05); }
    }
    [data-private-queue-inline-mascot-slot] {
      width:132px!important;
      height:111px!important;
      margin:0 auto 2px!important;
      display:flex!important;
      align-items:flex-end!important;
      justify-content:center!important;
    }
    [data-private-queue-inline-mascot-slot] .queue-reference-mascot {
      width:132px!important;
      height:111px!important;
      margin:0 auto!important;
    }
    [data-private-queue-status-label] {
      margin-top:4px!important;
      font-size:12px!important;
      letter-spacing:.08em!important;
    }
    [data-private-queue-name] {
      margin-top:4px!important;
      font-size:20px!important;
      line-height:1.25!important;
      color:#374151!important;
    }
    [data-private-queue-rank] {
      margin-top:2px!important;
      font-size:52px!important;
      line-height:1.08!important;
      letter-spacing:-.055em!important;
      color:#0369a1!important;
    }
    [data-private-queue-ahead] {
      display:inline-flex!important;
      width:fit-content!important;
      margin:10px auto 0!important;
      padding:6px 13px!important;
      border:1px solid rgba(14,165,233,.14)!important;
      border-radius:9999px!important;
      background:rgba(255,255,255,.78)!important;
      color:#374151!important;
      font-size:14px!important;
      line-height:1.2!important;
      box-shadow:0 4px 12px rgba(15,23,42,.035)!important;
    }
    [data-private-queue-info-grid] { margin-top:15px!important; }
    [data-private-queue-wait-label] { color:#9ca3af!important; }
    [data-private-queue-wait-value] { font-size:15px!important; line-height:1.25!important; }
    [data-private-queue-cancel] {
      border-color:rgba(244,63,94,.25)!important;
      color:rgba(244,63,94,.76)!important;
      box-shadow:none!important;
    }
    [data-private-queue-cancel]:active { background:rgba(255,241,242,.72)!important; }
    [data-queue-loading-enhanced="true"] {
      position:relative!important;
      min-height:150px!important;
      overflow:hidden!important;
      background:linear-gradient(135deg,rgba(236,253,245,.94),rgba(255,255,255,.98),rgba(239,246,255,.9))!important;
    }
    [data-queue-loading-enhanced="true"] > :not(.queue-sync-overlay) { opacity:0!important; }
    .queue-sync-overlay {
      position:absolute;
      inset:0;
      z-index:3;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:7px;
      padding:22px 18px;
      text-align:center;
      pointer-events:none;
    }
    .queue-sync-icon-wrap {
      position:relative;
      width:46px;
      height:46px;
      display:flex;
      align-items:center;
      justify-content:center;
    }
    .queue-sync-glow {
      position:absolute;
      inset:3px;
      border-radius:9999px;
      background:rgba(16,185,129,.12);
      animation:queueSyncGlow 1.35s ease-in-out infinite;
    }
    .queue-sync-spinner {
      position:relative;
      width:30px;
      height:30px;
      border-radius:9999px;
      border:3px solid rgba(16,185,129,.18);
      border-top-color:#10b981;
      border-right-color:#34d399;
      animation:queueSyncSpin .82s linear infinite;
    }
    .queue-sync-title { color:#047857; font-size:14px; font-weight:800; letter-spacing:.01em; }
    .queue-sync-subtitle { color:rgba(4,120,87,.62); font-size:11px; font-weight:600; }
    .queue-sync-dots { display:flex; align-items:center; gap:5px; margin-top:1px; }
    .queue-sync-dot {
      width:6px;
      height:6px;
      border-radius:9999px;
      background:#34d399;
      animation:queueSyncDot 1s ease-in-out infinite;
    }
    .queue-sync-dot:nth-child(2) { animation-delay:.14s; }
    .queue-sync-dot:nth-child(3) { animation-delay:.28s; }
    .queue-loading-count-label {
      display:inline-flex!important;
      align-items:center!important;
      min-width:84px;
      color:#047857!important;
      font-weight:800!important;
    }
    @media (max-width:360px) {
      [data-private-queue-inline-mascot-slot],
      [data-private-queue-inline-mascot-slot] .queue-reference-mascot {
        width:120px!important;
        height:101px!important;
      }
      [data-private-queue-rank] { font-size:46px!important; }
    }
    @media (prefers-reduced-motion:reduce) {
      .queue-sync-spinner,.queue-sync-glow,.queue-sync-dot { animation-duration:1ms!important; }
    }
  `;
  document.head.appendChild(style);
}

function restoreLoadingEnhancement() {
  document.querySelectorAll(`[${LOADING_CARD_ATTR}]`).forEach((card) => {
    if (!(card instanceof HTMLElement)) return;
    card.querySelectorAll(":scope > .queue-sync-overlay").forEach((overlay) => overlay.remove());
    card.removeAttribute(LOADING_CARD_ATTR);
  });

  document.querySelectorAll(`[${LOADING_COUNT_ATTR}]`).forEach((element) => {
    if (!(element instanceof HTMLElement)) return;

    const cardCount = getWaitingCountFromStatusCard();
    const original = element.getAttribute(LOADING_COUNT_ATTR);

    if (Number.isFinite(cardCount)) {
      element.textContent = `目前 ${cardCount} 位等待中`;
    } else if (original && original !== "目前 0 位等待中") {
      element.textContent = original;
    }

    element.removeAttribute(LOADING_COUNT_ATTR);
    element.classList.remove("queue-loading-count-label");
  });
}

function enhanceLoadingState() {
  const loadingText = findLoadingText();
  if (!(loadingText instanceof HTMLElement)) {
    restoreLoadingEnhancement();
    return;
  }

  const card = loadingText.parentElement;
  if (!(card instanceof HTMLElement)) return;

  card.setAttribute(LOADING_CARD_ATTR, "true");

  if (!card.querySelector(":scope > .queue-sync-overlay")) {
    const overlay = document.createElement("div");
    overlay.className = "queue-sync-overlay";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.innerHTML = `
      <div class="queue-sync-icon-wrap" aria-hidden="true">
        <span class="queue-sync-glow"></span>
        <span class="queue-sync-spinner"></span>
      </div>
      <div class="queue-sync-title">正在更新排隊狀態</div>
      <div class="queue-sync-subtitle">請稍候，正在取得最新順位</div>
      <div class="queue-sync-dots" aria-hidden="true">
        <span class="queue-sync-dot"></span>
        <span class="queue-sync-dot"></span>
        <span class="queue-sync-dot"></span>
      </div>
    `;
    card.appendChild(overlay);
  }

  const countText = findWaitingCountLabel();
  if (countText instanceof HTMLElement) {
    if (!countText.hasAttribute(LOADING_COUNT_ATTR)) {
      countText.setAttribute(LOADING_COUNT_ATTR, countText.textContent || "");
    }
    countText.textContent = "正在更新";
    countText.classList.add("queue-loading-count-label");
  }
}

function syncWaitingCountWithStatusCard() {
  if (findLoadingText()) return;
  const count = getWaitingCountFromStatusCard();
  const countLabel = findWaitingCountLabel();
  if (!Number.isFinite(count) || !(countLabel instanceof HTMLElement)) return;

  const expected = `目前 ${count} 位等待中`;
  if (countLabel.textContent?.trim() !== expected) {
    countLabel.textContent = expected;
  }
}

function restoreHiddenRankBadges() {
  document.querySelectorAll(`[${HIDDEN_BADGE_ATTR}]`).forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    element.style.removeProperty("display");
    element.removeAttribute(HIDDEN_BADGE_ATTR);
  });
}

function removeOldFloatingMascots() {
  document
    .querySelectorAll('#private-queue-mascot-overlay, [id="private-queue-mascot-overlay"]')
    .forEach((element) => element.remove());

  document
    .querySelectorAll("[data-private-queue-mascot-target]")
    .forEach((element) => {
      if (!(element instanceof HTMLElement)) return;
      element.removeAttribute("data-private-queue-mascot-target");
      element.removeAttribute("data-private-queue-mascot-original-style");
      element.removeAttribute("style");
    });
}

function normalizeWaitText(value) {
  const text = String(value || "").trim();
  if (!text) return text;
  if (text.startsWith("已等待")) return text;
  return `已等待 ${text.replace(/前$/, "").trim()}`;
}

function polishStatusContent(label) {
  if (!(label instanceof HTMLElement)) return;

  const name = label.nextElementSibling;
  const rank = name?.nextElementSibling;
  const ahead = rank?.nextElementSibling;
  const infoGrid = ahead?.nextElementSibling;

  label.setAttribute("data-private-queue-status-label", "true");
  if (name instanceof HTMLElement) name.setAttribute("data-private-queue-name", "true");
  if (rank instanceof HTMLElement) rank.setAttribute("data-private-queue-rank", "true");
  if (ahead instanceof HTMLElement) ahead.setAttribute("data-private-queue-ahead", "true");

  if (infoGrid instanceof HTMLElement) {
    infoGrid.setAttribute("data-private-queue-info-grid", "true");
    const cards = [...infoGrid.children].filter((item) => item instanceof HTMLElement);
    const waitCard = cards[1];
    if (waitCard instanceof HTMLElement) {
      const waitLabel = waitCard.querySelector("p:first-child");
      const waitValue = waitCard.querySelector("p:nth-child(2)");
      if (waitLabel instanceof HTMLElement) {
        waitLabel.setAttribute("data-private-queue-wait-label", "true");
        if (waitLabel.textContent?.trim() === "加入時間") waitLabel.textContent = "等待時間";
      }
      if (waitValue instanceof HTMLElement) {
        waitValue.setAttribute("data-private-queue-wait-value", "true");
        const textNode = [...waitValue.childNodes].find(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
        );
        if (textNode) {
          const nextText = normalizeWaitText(textNode.textContent);
          if (textNode.textContent !== ` ${nextText}`) textNode.textContent = ` ${nextText}`;
        }
      }
    }
  }

  const card = label.closest("div.bg-gradient-to-br");
  card?.querySelectorAll("button").forEach((button) => {
    if (!(button instanceof HTMLElement)) return;
    if (button.textContent?.includes("取消排隊")) {
      button.setAttribute("data-private-queue-cancel", "true");
    }
  });
}

function ensureSingleInlineMascot() {
  ensurePolishStyles();
  removeOldFloatingMascots();
  enhanceLoadingState();

  const label = findStatusLabel();
  const allSlots = [...document.querySelectorAll(`[${SLOT_ATTR}]`)];
  const allTriggers = [...document.querySelectorAll(`[${TRIGGER_ATTR}]`)];

  if (!(label instanceof HTMLElement) || !(label.parentElement instanceof HTMLElement)) {
    allSlots.forEach((element) => element.remove());
    allTriggers.forEach((element) => element.remove());
    restoreHiddenRankBadges();
    return;
  }

  const parent = label.parentElement;
  let slot = allSlots.find((element) => element.parentElement === parent);
  let trigger = allTriggers.find((element) => element.parentElement === parent);

  allSlots.forEach((element) => {
    if (element !== slot) element.remove();
  });
  allTriggers.forEach((element) => {
    if (element !== trigger) element.remove();
  });

  if (!(slot instanceof HTMLElement)) {
    slot = document.createElement("div");
    slot.setAttribute(SLOT_ATTR, "true");
    slot.setAttribute("aria-label", "等待中的可愛人物");
  }

  if (!(trigger instanceof HTMLElement)) {
    trigger = document.createElement("span");
    trigger.setAttribute(TRIGGER_ATTR, "true");
    trigger.setAttribute("aria-hidden", "true");
    trigger.textContent = TRIGGER_TEXT;
    trigger.style.cssText =
      "position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;";
  }

  if (slot.nextElementSibling !== trigger || trigger.nextElementSibling !== label) {
    parent.insertBefore(slot, label);
    parent.insertBefore(trigger, label);
  }

  const rankBadge = slot.previousElementSibling;
  document.querySelectorAll(`[${HIDDEN_BADGE_ATTR}]`).forEach((element) => {
    if (element !== rankBadge && element instanceof HTMLElement) {
      element.style.removeProperty("display");
      element.removeAttribute(HIDDEN_BADGE_ATTR);
    }
  });

  if (rankBadge instanceof HTMLElement) {
    rankBadge.setAttribute(HIDDEN_BADGE_ATTR, "true");
    rankBadge.style.setProperty("display", "none", "important");
  }

  polishStatusContent(label);
  syncWaitingCountWithStatusCard();
}

export default function QueuePrivateMascotBridge() {
  useEffect(() => {
    let frame = 0;

    const apply = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(ensureSingleInlineMascot);
    };

    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const clockTimer = window.setInterval(apply, 30000);
    window.addEventListener("pageshow", apply);
    document.addEventListener("visibilitychange", apply);

    return () => {
      observer.disconnect();
      window.clearInterval(clockTimer);
      window.removeEventListener("pageshow", apply);
      document.removeEventListener("visibilitychange", apply);
      window.cancelAnimationFrame(frame);
      document.querySelectorAll(`[${SLOT_ATTR}], [${TRIGGER_ATTR}]`).forEach((element) => element.remove());
      restoreHiddenRankBadges();
      restoreLoadingEnhancement();
      removeOldFloatingMascots();
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);

  return null;
}
