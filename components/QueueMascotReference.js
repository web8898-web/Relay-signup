"use client";

import { useEffect } from "react";

const STYLE_ID = "queue-reference-mascot-styles";
const ACTION_CLASSES = [
  "queue-reference-phone",
  "queue-reference-look",
  "queue-reference-yawn",
  "queue-reference-stretch",
  "queue-reference-watch",
  "queue-reference-drink",
  "queue-reference-read",
];
const BUBBLE_TEXTS = ["快輪到我了嗎？", "再等等～", "希望快一點 😊", "先看看手機～"];

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes queueReferenceFirst {0%,100%{transform:translateY(0) scale(1)}38%{transform:translateY(-5px) scale(1.04)}72%{transform:translateY(0) scale(.99)}}
    @keyframes queueReferencePhone {0%,100%{transform:rotate(0)}25%,75%{transform:rotate(2deg)}}
    @keyframes queueReferenceLook {0%,100%{transform:rotate(0)}25%,42%{transform:rotate(-7deg)}60%,78%{transform:rotate(7deg)}}
    @keyframes queueReferenceYawn {0%,100%{transform:translateY(0)}30%,70%{transform:translateY(2px)}}
    @keyframes queueReferenceStretch {0%,100%{transform:translateY(0) scaleY(1)}32%,70%{transform:translateY(-6px) scaleY(1.05)}}
    @keyframes queueReferenceWatch {0%,100%{transform:rotate(0)}30%,72%{transform:rotate(5deg)}}
    @keyframes queueReferenceDrink {0%,100%{transform:rotate(0)}28%,72%{transform:rotate(-4deg)}}
    @keyframes queueReferenceRead {0%,100%{transform:translateY(0)}30%,75%{transform:translateY(1px)}}
    @keyframes queueReferenceItemIn {0%,12%,90%,100%{opacity:0;transform:translate(12px,10px) scale(.65)}28%,76%{opacity:1;transform:translate(0,0) scale(1)}}
    @keyframes queueReferenceHandsIn {0%,12%,90%,100%{opacity:0;transform:translateY(8px)}28%,76%{opacity:1;transform:translateY(0)}}
    @keyframes queueReferenceBubble {0%{opacity:0;transform:translate(-50%,6px) scale(.92)}15%,80%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-4px) scale(.96)}}

    .queue-reference-mascot{position:relative;width:112px;height:94px;margin:0 auto 8px;transform-origin:center bottom;will-change:transform}
    .queue-reference-mascot.queue-reference-first{animation:queueReferenceFirst 560ms ease-out 1}
    .queue-reference-mascot svg{display:block;width:100%;height:100%;overflow:visible;transform-origin:center bottom}
    .queue-reference-eye{transform-box:fill-box;transform-origin:center;transition:transform 80ms ease}
    .queue-reference-blink .queue-reference-eye{transform:scaleY(.08)}
    .queue-reference-prop,.queue-reference-action-hands,.queue-reference-yawn-mouth{opacity:0;transform-box:fill-box;transform-origin:center}
    .queue-reference-normal-mouth{opacity:1}
    .queue-reference-rest-arm{opacity:1;transition:opacity 80ms ease}

    .queue-reference-phone .queue-reference-rest-arm-left{opacity:0}
    .queue-reference-yawn .queue-reference-rest-arm-right{opacity:0}
    .queue-reference-stretch .queue-reference-rest-arm,
    .queue-reference-watch .queue-reference-rest-arm,
    .queue-reference-drink .queue-reference-rest-arm,
    .queue-reference-read .queue-reference-rest-arm{opacity:0}

    .queue-reference-phone svg{animation:queueReferencePhone 4.6s ease-in-out 1}
    .queue-reference-phone .queue-reference-phone-prop,
    .queue-reference-phone .queue-reference-phone-hands{animation:queueReferenceItemIn 4.6s ease-in-out 1}
    .queue-reference-look .queue-reference-head{animation:queueReferenceLook 2.8s ease-in-out 1;transform-box:fill-box;transform-origin:center}
    .queue-reference-yawn svg{animation:queueReferenceYawn 3s ease-in-out 1}
    .queue-reference-yawn .queue-reference-normal-mouth{opacity:0}
    .queue-reference-yawn .queue-reference-yawn-mouth,
    .queue-reference-yawn .queue-reference-yawn-hand{animation:queueReferenceHandsIn 3s ease-in-out 1}
    .queue-reference-stretch svg{animation:queueReferenceStretch 3.2s ease-in-out 1}
    .queue-reference-stretch .queue-reference-stretch-hands{animation:queueReferenceHandsIn 3.2s ease-in-out 1}
    .queue-reference-watch svg{animation:queueReferenceWatch 2.8s ease-in-out 1}
    .queue-reference-watch .queue-reference-watch-prop,
    .queue-reference-watch .queue-reference-watch-hands{animation:queueReferenceHandsIn 2.8s ease-in-out 1}
    .queue-reference-drink svg{animation:queueReferenceDrink 3.8s ease-in-out 1}
    .queue-reference-drink .queue-reference-drink-prop,
    .queue-reference-drink .queue-reference-drink-hands{animation:queueReferenceItemIn 3.8s ease-in-out 1}
    .queue-reference-read svg{animation:queueReferenceRead 4.2s ease-in-out 1}
    .queue-reference-read .queue-reference-book-prop,
    .queue-reference-read .queue-reference-book-hands{animation:queueReferenceItemIn 4.2s ease-in-out 1}

    .queue-reference-speech{position:fixed;left:0;top:0;transform:translateX(-50%);min-width:112px;max-width:180px;padding:7px 10px;border:1px solid #b7e4d2;border-radius:14px;background:#f0fff8;color:#16745b;font-size:12px;font-weight:700;line-height:1.35;white-space:nowrap;box-shadow:0 6px 16px rgba(15,118,90,.12);z-index:2147483000;pointer-events:none;animation:queueReferenceBubble 2s ease both}
    .queue-reference-speech::after{content:"";position:absolute;left:50%;bottom:-6px;width:10px;height:10px;background:#f0fff8;border-right:1px solid #b7e4d2;border-bottom:1px solid #b7e4d2;transform:translateX(-50%) rotate(45deg)}
    .queue-reference-paused,.queue-reference-paused svg,.queue-reference-paused *{animation-play-state:paused!important}
    @media(prefers-reduced-motion:reduce){.queue-reference-mascot,.queue-reference-mascot svg,.queue-reference-mascot *{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);
}

function mascotSvg() {
  return `
    <svg viewBox="0 0 180 150" role="img" aria-label="坐著等待的可愛人物">
      <ellipse cx="88" cy="142" rx="61" ry="7" fill="#E9EEF4" opacity=".65"/>
      <rect x="37" y="84" width="101" height="31" rx="13" fill="#D9EEE1" stroke="#72B993" stroke-width="4"/>
      <rect x="27" y="107" width="121" height="13" rx="7" fill="#D9EEE1" stroke="#72B993" stroke-width="4"/>
      <path d="M39 118v18M136 118v18" stroke="#72B993" stroke-width="4" stroke-linecap="round"/>
      <g class="queue-reference-body">
        <path d="M57 77c6-8 17-13 30-13s24 5 30 13v28H57V77Z" fill="#FFFDFC" stroke="#6A574F" stroke-width="4"/>
        <path class="queue-reference-rest-arm queue-reference-rest-arm-left" d="M64 86c7 0 13 5 17 11" fill="none" stroke="#6A574F" stroke-width="4" stroke-linecap="round"/>
        <path class="queue-reference-rest-arm queue-reference-rest-arm-right" d="M110 86c-7 0-13 5-17 11" fill="none" stroke="#6A574F" stroke-width="4" stroke-linecap="round"/>
        <rect x="69" y="99" width="17" height="38" rx="9" fill="#FFFDFC" stroke="#6A574F" stroke-width="4"/>
        <rect x="88" y="99" width="17" height="38" rx="9" fill="#FFFDFC" stroke="#6A574F" stroke-width="4"/>
      </g>
      <g class="queue-reference-head">
        <circle cx="87" cy="48" r="40" fill="#FFFDFC" stroke="#6A574F" stroke-width="4"/>
        <ellipse cx="61" cy="56" rx="10" ry="8" fill="#F8C8D0" opacity=".82"/>
        <ellipse cx="113" cy="56" rx="10" ry="8" fill="#F8C8D0" opacity=".82"/>
        <circle class="queue-reference-eye" cx="72" cy="45" r="3.7" fill="#6A574F"/>
        <circle class="queue-reference-eye" cx="102" cy="45" r="3.7" fill="#6A574F"/>
        <path class="queue-reference-normal-mouth" d="M79 56c4.2 4.6 11.8 4.6 16 0" fill="none" stroke="#6A574F" stroke-width="3.5" stroke-linecap="round"/>
        <ellipse class="queue-reference-yawn-mouth" cx="87" cy="59" rx="6" ry="8" fill="#7A4A46"/>
      </g>
      <g class="queue-reference-prop queue-reference-phone-prop"><rect x="78" y="78" width="19" height="30" rx="4" fill="#4B5563" stroke="#374151" stroke-width="3"/><rect x="82" y="82" width="11" height="18" rx="2" fill="#DDF3EA"/></g>
      <g class="queue-reference-action-hands queue-reference-phone-hands" fill="#FFFDFC" stroke="#6A574F" stroke-width="4"><circle cx="74" cy="91" r="8"/><circle cx="101" cy="91" r="8"/></g>
      <g class="queue-reference-action-hands queue-reference-yawn-hand" fill="#FFFDFC" stroke="#6A574F" stroke-width="4"><circle cx="101" cy="63" r="8"/></g>
      <g class="queue-reference-action-hands queue-reference-stretch-hands" fill="none" stroke="#6A574F" stroke-width="5" stroke-linecap="round"><path d="M67 85C52 65 50 48 56 34"/><path d="M107 85c15-20 17-37 11-51"/></g>
      <g class="queue-reference-prop queue-reference-watch-prop"><circle cx="66" cy="88" r="8" fill="#fff" stroke="#55B786" stroke-width="3"/><path d="M66 84v5l3 2" stroke="#55B786" stroke-width="2" fill="none" stroke-linecap="round"/></g>
      <g class="queue-reference-action-hands queue-reference-watch-hands" fill="#FFFDFC" stroke="#6A574F" stroke-width="4"><circle cx="74" cy="91" r="8"/></g>
      <g class="queue-reference-prop queue-reference-drink-prop"><rect x="78" y="75" width="22" height="31" rx="5" fill="#55B786" stroke="#3D8F6D" stroke-width="3"/><path d="M89 75V64" stroke="#6A574F" stroke-width="3" stroke-linecap="round"/></g>
      <g class="queue-reference-action-hands queue-reference-drink-hands" fill="#FFFDFC" stroke="#6A574F" stroke-width="4"><circle cx="74" cy="88" r="8"/><circle cx="104" cy="88" r="8"/></g>
      <g class="queue-reference-prop queue-reference-book-prop"><path d="M61 82q14-7 27 2v25q-13-8-27-2Z" fill="#55B786" stroke="#3D8F6D" stroke-width="3"/><path d="M115 82q-14-7-27 2v25q13-8 27-2Z" fill="#55B786" stroke="#3D8F6D" stroke-width="3"/></g>
      <g class="queue-reference-action-hands queue-reference-book-hands" fill="#FFFDFC" stroke="#6A574F" stroke-width="4"><circle cx="60" cy="96" r="7"/><circle cx="116" cy="96" r="7"/></g>
      <circle cx="151" cy="25" r="17" fill="#FFFDFC" stroke="#72B993" stroke-width="4"/>
      <path d="M151 14v12l8 5" fill="none" stroke="#72B993" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
}

function clearAction(mascot) {
  ACTION_CLASSES.forEach((name) => mascot.classList.remove(name));
  mascot.dataset.referenceActionActive = "false";
}

function blink(mascot) {
  if (!(mascot instanceof HTMLElement) || !mascot.isConnected || document.hidden) return;
  mascot.classList.add("queue-reference-blink");
  window.setTimeout(() => mascot.classList.remove("queue-reference-blink"), 120);
}

function scheduleBlink(mascot) {
  if (mascot.dataset.referenceBlink === "true") return;
  mascot.dataset.referenceBlink = "true";
  const next = () => {
    if (!mascot.isConnected) return;
    const timer = window.setTimeout(() => { blink(mascot); next(); }, 4000 + Math.floor(Math.random() * 8000));
    mascot.dataset.referenceBlinkTimer = String(timer);
  };
  next();
}

function chooseAction() {
  const actions = [
    ["queue-reference-phone", 4600], ["queue-reference-look", 2800], ["queue-reference-yawn", 3000],
    ["queue-reference-stretch", 3200], ["queue-reference-watch", 2800], ["queue-reference-drink", 3800], ["queue-reference-read", 4200],
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

function playAction(mascot) {
  if (!(mascot instanceof HTMLElement) || !mascot.isConnected || document.hidden || mascot.dataset.referenceActionActive === "true") return;
  const [className, duration] = chooseAction();
  clearAction(mascot);
  mascot.dataset.referenceActionActive = "true";
  mascot.classList.add(className);
  const timer = window.setTimeout(() => clearAction(mascot), duration);
  mascot.dataset.referenceActionTimer = String(timer);
}

function scheduleActions(mascot) {
  if (mascot.dataset.referenceActionScheduled === "true") return;
  mascot.dataset.referenceActionScheduled = "true";
  let first = true;
  const next = () => {
    if (!mascot.isConnected) return;
    const delay = first ? 6000 + Math.floor(Math.random() * 6000) : 20000 + Math.floor(Math.random() * 40000);
    first = false;
    const timer = window.setTimeout(() => { playAction(mascot); next(); }, delay);
    mascot.dataset.referenceActionScheduleTimer = String(timer);
  };
  next();
}

function showSpeech(mascot) {
  if (!mascot.isConnected || document.querySelector(".queue-reference-speech")) return;
  const rect = mascot.getBoundingClientRect();
  const bubble = document.createElement("div");
  bubble.className = "queue-reference-speech";
  bubble.textContent = BUBBLE_TEXTS[Math.floor(Math.random() * BUBBLE_TEXTS.length)];
  bubble.style.left = `${rect.left + rect.width / 2}px`;
  bubble.style.top = `${Math.max(8, rect.top - 44)}px`;
  document.body.appendChild(bubble);
  window.setTimeout(() => bubble.remove(), 2000);
}

function scheduleSpeech(mascot) {
  if (mascot.dataset.referenceSpeechScheduled === "true") return;
  mascot.dataset.referenceSpeechScheduled = "true";
  const startedAt = Number(mascot.dataset.waitStartedAt || Date.now());
  mascot.dataset.waitStartedAt = String(startedAt);
  const next = () => {
    if (!mascot.isConnected) return;
    const elapsed = Date.now() - startedAt;
    const delay = elapsed < 600000 ? Math.max(1000, 600000 - elapsed) : 180000 + Math.floor(Math.random() * 120000);
    const timer = window.setTimeout(() => {
      if (!document.hidden && Date.now() - startedAt >= 600000 && Math.random() < 0.55) showSpeech(mascot);
      next();
    }, delay);
    mascot.dataset.referenceSpeechTimer = String(timer);
  };
  next();
}

function getRank(card) {
  const match = (card?.textContent || "").match(/第\s*(\d+)\s*位/);
  return match ? Number(match[1]) : 0;
}

function installReferenceMascot(root = document.body) {
  if (!root || !(root instanceof Element || root === document.body)) return;
  ensureStyles();
  const labels = [];
  if (root instanceof HTMLElement && root.textContent?.trim() === "目前等待順位") labels.push(root);
  root.querySelectorAll?.("*").forEach((el) => { if (el instanceof HTMLElement && el.textContent?.trim() === "目前等待順位") labels.push(el); });

  labels.forEach((label) => {
    const slot = label.previousElementSibling;
    if (!(slot instanceof HTMLElement)) return;
    const card = label.closest("div.bg-gradient-to-br") || label.parentElement;
    const rank = getRank(card);
    let mascot = slot.querySelector("[data-reference-queue-mascot]");
    if (!(mascot instanceof HTMLElement)) {
      slot.className = "";
      slot.removeAttribute("style");
      slot.innerHTML = `<div class="queue-reference-mascot" data-reference-queue-mascot data-current-rank="${rank || ""}" data-wait-started-at="${Date.now()}">${mascotSvg()}</div>`;
      mascot = slot.querySelector("[data-reference-queue-mascot]");
    }
    if (!(mascot instanceof HTMLElement)) return;
    const previousRank = Number(mascot.dataset.currentRank || 0);
    mascot.dataset.currentRank = rank ? String(rank) : "";
    if (rank === 1 && previousRank !== 1) {
      mascot.classList.remove("queue-reference-first");
      void mascot.offsetWidth;
      mascot.classList.add("queue-reference-first");
      window.setTimeout(() => mascot.classList.remove("queue-reference-first"), 620);
    }
    scheduleBlink(mascot);
    scheduleActions(mascot);
    scheduleSpeech(mascot);
  });
}

export default function QueueMascotReference() {
  useEffect(() => {
    installReferenceMascot();
    let frame = 0;
    const refresh = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => installReferenceMascot(document.body));
    };
    const handleVisibility = () => document.querySelectorAll("[data-reference-queue-mascot]").forEach((m) => m.classList.toggle("queue-reference-paused", document.hidden));
    document.addEventListener("visibilitychange", handleVisibility);
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.cancelAnimationFrame(frame);
      document.querySelectorAll(".queue-reference-speech").forEach((bubble) => bubble.remove());
      document.querySelectorAll("[data-reference-queue-mascot]").forEach((m) => {
        ["referenceBlinkTimer","referenceActionTimer","referenceActionScheduleTimer","referenceSpeechTimer"].forEach((key) => {
          const timer = Number(m.dataset[key]);
          if (timer) window.clearTimeout(timer);
        });
      });
    };
  }, []);
  return null;
}
