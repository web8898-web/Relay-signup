"use client";

import { useEffect } from "react";

// 測試重播版本：更換 key 後，所有裝置重新進入首頁時都會視為尚未看過。
const STORAGE_KEY = "relay_last_seen_love_created_at_replay_20260714_2";
const queue = [];
let playing = false;

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getLastSeen() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch (e) {
    return "";
  }
}

function markSeen(createdAt) {
  if (!createdAt) return;
  try {
    localStorage.setItem(STORAGE_KEY, createdAt);
  } catch (e) {}
}

function createBubble(event) {
  const host = document.querySelector("#home-love-support .love-center-area");
  if (!(host instanceof HTMLElement)) return;

  const bubble = document.createElement("div");
  const direction = Math.random() < 0.5 ? -1 : 1;
  const duration = queue.length >= 20 ? 1250 : queue.length >= 10 ? 1650 : queue.length >= 5 ? 2200 : 3200;
  bubble.className = "home-love-name-replay";
  bubble.textContent = `${event.display_name || "有人"} 喜歡這個小工具`;
  bubble.style.setProperty("--love-start-x", `${-32 + Math.random() * 64}px`);
  bubble.style.setProperty("--love-drift-x", `${(55 + Math.random() * 70) * direction}px`);
  bubble.style.setProperty("--love-rise-y", `${165 + Math.random() * 70}px`);
  bubble.style.setProperty("--love-duration", `${duration}ms`);
  host.appendChild(bubble);
  window.setTimeout(() => bubble.remove(), duration + 120);
}

async function playQueue() {
  if (playing) return;
  playing = true;
  while (queue.length > 0) {
    const event = queue.shift();
    createBubble(event);
    markSeen(event?.created_at);
    await wait(queue.length >= 15 ? 140 : queue.length >= 8 ? 220 : 420);
  }
  playing = false;
}

function enqueue(event) {
  if (!event?.id || !event?.display_name) return;
  if (queue.some((item) => item.id === event.id)) return;
  queue.push(event);
  playQueue();
}

export default function HomeLoveNameReplay() {
  useEffect(() => {
    let active = true;

    const start = async () => {
      for (let tries = 0; tries < 20; tries += 1) {
        if (document.getElementById("home-love-support")) break;
        await wait(150);
      }
      if (!active || !document.getElementById("home-love-support")) return;

      const after = getLastSeen();
      const url = after ? `/api/love?after=${encodeURIComponent(after)}` : "/api/love";
      try {
        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();
        (data?.recentEvents || []).forEach(enqueue);
      } catch (e) {}
    };

    start();
    return () => {
      active = false;
      queue.length = 0;
      playing = false;
      document.querySelectorAll(".home-love-name-replay").forEach((el) => el.remove());
    };
  }, []);

  return (
    <style jsx global>{`
      #home-love-support .love-center-area { overflow: visible !important; }
      #home-love-support .love-center-area > .home-love-name-replay {
        position: absolute !important;
        display: block !important;
        flex: none !important;
        left: 50% !important;
        bottom: 50% !important;
        z-index: 80 !important;
        width: max-content !important;
        min-width: max-content !important;
        max-width: none !important;
        white-space: nowrap !important;
        overflow: visible !important;
        text-overflow: clip !important;
        border-radius: 9999px;
        padding: 5px 10px;
        background: rgba(255,255,255,.96);
        box-shadow: 0 4px 14px rgba(15,23,42,.10);
        color: #6b7280;
        font-size: 10px;
        font-weight: 600;
        line-height: 1.4;
        pointer-events: none;
        animation: home-love-name-float var(--love-duration) cubic-bezier(.2,.72,.28,1) forwards;
        will-change: transform, opacity;
      }
      #home-love-support .love-center-area > .home-love-name-replay::before {
        content: "♥";
        color: #fecdd3;
        margin-right: 6px;
        font-size: 14px;
      }
      @keyframes home-love-name-float {
        0% { transform: translate3d(calc(-50% + var(--love-start-x)), 18px, 0) scale(.88); opacity: 0; }
        12% { opacity: 1; }
        82% { opacity: 1; }
        100% { transform: translate3d(calc(-50% + var(--love-drift-x)), calc(var(--love-rise-y) * -1), 0) scale(.96); opacity: 0; }
      }
    `}</style>
  );
}
