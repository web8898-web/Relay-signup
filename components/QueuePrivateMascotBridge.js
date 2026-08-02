"use client";

import { useEffect } from "react";

const SLOT_ATTR = "data-private-queue-inline-mascot-slot";
const TRIGGER_ATTR = "data-private-queue-inline-mascot-trigger";
const HIDDEN_BADGE_ATTR = "data-private-queue-hidden-rank-badge";
const STYLE_ID = "private-queue-status-polish";
const TRIGGER_TEXT = "目前等待順位";

function findStatusLabel() {
  return [...document.querySelectorAll("p")].find(
    (element) =>
      element instanceof HTMLElement &&
      element.textContent?.trim() === "你的排隊狀態"
  );
}

function ensurePolishStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [data-private-queue-inline-mascot-slot] {
      width: 132px !important;
      height: 111px !important;
      margin: 0 auto 2px !important;
      display: flex !important;
      align-items: flex-end !important;
      justify-content: center !important;
    }
    [data-private-queue-inline-mascot-slot] .queue-reference-mascot {
      width: 132px !important;
      height: 111px !important;
      margin: 0 auto !important;
    }
    [data-private-queue-status-label] {
      margin-top: 4px !important;
      font-size: 12px !important;
      letter-spacing: .08em !important;
    }
    [data-private-queue-name] {
      margin-top: 4px !important;
      font-size: 20px !important;
      line-height: 1.25 !important;
      color: #374151 !important;
    }
    [data-private-queue-rank] {
      margin-top: 2px !important;
      font-size: 52px !important;
      line-height: 1.08 !important;
      letter-spacing: -.055em !important;
      color: #0369a1 !important;
    }
    [data-private-queue-ahead] {
      display: inline-flex !important;
      width: fit-content !important;
      margin: 10px auto 0 !important;
      padding: 6px 13px !important;
      border: 1px solid rgba(14,165,233,.14) !important;
      border-radius: 9999px !important;
      background: rgba(255,255,255,.78) !important;
      color: #374151 !important;
      font-size: 14px !important;
      line-height: 1.2 !important;
      box-shadow: 0 4px 12px rgba(15,23,42,.035) !important;
    }
    [data-private-queue-info-grid] {
      margin-top: 15px !important;
    }
    [data-private-queue-wait-label] {
      color: #9ca3af !important;
    }
    [data-private-queue-wait-value] {
      font-size: 15px !important;
      line-height: 1.25 !important;
    }
    [data-private-queue-cancel] {
      border-color: rgba(244,63,94,.25) !important;
      color: rgba(244,63,94,.76) !important;
      box-shadow: none !important;
    }
    [data-private-queue-cancel]:active {
      background: rgba(255,241,242,.72) !important;
    }
    @media (max-width: 360px) {
      [data-private-queue-inline-mascot-slot],
      [data-private-queue-inline-mascot-slot] .queue-reference-mascot {
        width: 120px !important;
        height: 101px !important;
      }
      [data-private-queue-rank] {
        font-size: 46px !important;
      }
    }
  `;
  document.head.appendChild(style);
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
      removeOldFloatingMascots();
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);

  return null;
}
