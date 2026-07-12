"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const MAX_FLOATING_HEARTS = 3;
const HEART_LIFETIME_MS = 3200;
const LOVE_MESSAGES = [
  "愛心收到囉",
  "今天的愛心已收到",
  "謝謝你的愛心",
  "謝謝你的支持",
  "收到你的心意了",
  "今天也收到愛心了",
  "愛心成功送出",
  "你的愛心已送達",
  "心意已收到",
  "感謝你的支持",
  "愛心已簽收",
  "愛心入袋",
  "收到一顆暖暖的心",
  "愛心補給成功",
  "今日愛心已完成",
  "你的愛心飛過來了",
  "愛心已安全抵達",
  "今天的可愛額度已收到",
  "這顆愛心我收下啦",
  "愛心成功充電",
  "今天的愛心已送出",
  "今日愛心已收到",
  "今天已經支持過囉",
  "今天的心意已經收到",
  "今日份愛心已完成",
  "今天的支持已記錄",
  "今日愛心已簽收",
  "今天這顆愛心收到了",
  "今日支持已完成",
  "明天再來送一顆吧",
];

function formatCount(value) {
  return new Intl.NumberFormat("zh-TW").format(Number(value) || 0);
}

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function getRandomLoveMessage() {
  return LOVE_MESSAGES[Math.floor(Math.random() * LOVE_MESSAGES.length)];
}

function makeFloatingHeart(event, localOnly = false) {
  const direction = Math.random() < 0.5 ? -1 : 1;
  const motionType = randomBetween(1, 5);
  const driftX = randomBetween(38, 92) * direction;

  return {
    id: event?.id || `local-${Date.now()}-${Math.random()}`,
    displayName: event?.display_name || event?.displayName || "謝謝你的支持",
    localOnly,
    message: localOnly ? getRandomLoveMessage() : "",
    motionType,
    driftX,
    curveX: randomBetween(18, 58) * -direction,
    floatY: randomBetween(118, 188),
    startX: randomBetween(-24, 24),
    startY: randomBetween(2, 18),
    size: randomBetween(21, 29),
    rotateStart: randomBetween(-18, 18),
    rotateMid: randomBetween(-12, 12),
    rotateEnd: randomBetween(-22, 22),
    duration: randomBetween(2400, 3400),
  };
}

export default function HomeLoveSupport({ profile, onRequireLogin }) {
  const [totalCount, setTotalCount] = useState(null);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [toast, setToast] = useState("");
  const timersRef = useRef(new Map());
  const pendingOwnRealtimeRef = useRef(null);

  const removeHeart = useCallback((id) => {
    setFloatingHearts((current) => current.filter((heart) => heart.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) window.clearTimeout(timer);
    timersRef.current.delete(id);
  }, []);

  const addFloatingHeart = useCallback(
    (event, localOnly = false) => {
      const heart = makeFloatingHeart(event, localOnly);
      setFloatingHearts((current) => [...current, heart].slice(-MAX_FLOATING_HEARTS));
      const timer = window.setTimeout(() => removeHeart(heart.id), heart.duration + 160);
      timersRef.current.set(heart.id, timer);
      return heart.id;
    },
    [removeHeart]
  );

  useEffect(() => {
    let active = true;

    fetch("/api/love", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (active && Number.isFinite(data?.totalCount)) setTotalCount(data.totalCount);
      })
      .catch(() => {});

    const channel = supabase
      .channel("home-love-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "love_events" },
        (payload) => {
          const event = payload?.new;
          if (!event?.id) return;

          const pending = pendingOwnRealtimeRef.current;
          const eventName = event?.display_name || "";
          const isOwnPendingEvent =
            pending &&
            Date.now() - pending.createdAt < 8000 &&
            eventName === pending.displayName;

          if (isOwnPendingEvent) {
            pendingOwnRealtimeRef.current = null;
          } else {
            addFloatingHeart(event);
          }

          setTotalCount((current) => (typeof current === "number" ? current + 1 : current));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [addFloatingHeart]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleLoveClick() {
    if (submitting) return;

    setPressed(true);
    window.setTimeout(() => setPressed(false), 320);

    if (!profile?.accessToken) {
      setToast("請先使用 LINE 登入");
      onRequireLogin?.();
      return;
    }

    const optimisticHeartId = addFloatingHeart(
      { displayName: profile.displayName },
      true
    );

    pendingOwnRealtimeRef.current = {
      displayName: profile.displayName || "",
      createdAt: Date.now(),
      heartId: optimisticHeartId,
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/love", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: profile.accessToken }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "愛心送出失敗");
      if (Number.isFinite(data?.totalCount)) setTotalCount(data.totalCount);

      if (!data?.accepted) {
        pendingOwnRealtimeRef.current = null;
        setToast(data?.message || "今天已經送過愛心了 ❤️");
      }
    } catch (error) {
      pendingOwnRealtimeRef.current = null;
      removeHeart(optimisticHeartId);
      setToast(error?.message || "暫時無法送出愛心，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="home-love-support" className="relative mx-auto flex min-h-0 w-full max-w-[260px] flex-1 flex-col px-3 text-center overflow-visible">
      <div className="love-center-area relative flex min-h-0 flex-1 items-center justify-center">
        <div className="pointer-events-none absolute inset-x-0 bottom-1/2 h-44 translate-y-[60px] overflow-visible" aria-hidden="true">
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              className={`floating-love-event motion-${heart.motionType} absolute left-1/2 bottom-0 flex items-center gap-1.5`}
              style={{
                "--start-x": `${heart.startX}px`,
                "--start-y": `${heart.startY}px`,
                "--drift-x": `${heart.driftX}px`,
                "--curve-x": `${heart.curveX}px`,
                "--float-y": `${heart.floatY}px`,
                "--rotate-start": `${heart.rotateStart}deg`,
                "--rotate-mid": `${heart.rotateMid}deg`,
                "--rotate-end": `${heart.rotateEnd}deg`,
                "--motion-duration": `${heart.duration}ms`,
              }}
            >
              <Heart
                size={heart.size}
                className="shrink-0 fill-rose-200 text-rose-200"
                strokeWidth={0}
              />
              <span className="max-w-[150px] truncate rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-medium text-gray-500 shadow-sm ring-1 ring-gray-100">
                {heart.localOnly ? heart.message : `${heart.displayName} 喜歡這個小工具`}
              </span>
            </div>
          ))}
        </div>

        <div>
          <button
            type="button"
            onClick={handleLoveClick}
            disabled={submitting}
            aria-label="送出一顆愛心支持接龍報名小助手"
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50/70 ring-1 ring-rose-100/60 transition-transform duration-300 active:scale-95 disabled:opacity-60 ${
              pressed ? "scale-110" : "scale-100"
            }`}
          >
            <Heart size={23} className="fill-rose-200 text-rose-200" strokeWidth={0} />
          </button>

          <p className="mt-1.5 text-[11px] text-gray-400" aria-live="polite">
            {totalCount == null ? "—" : formatCount(totalCount)}
          </p>
        </div>
      </div>

      <div className="home-love-copyright shrink-0 text-center text-[11px] text-gray-300">
        © 2026{" "}
        <a
          href="https://www.wiweb.com.tw"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-400 transition"
        >
          豐碩企業有限公司
        </a>{" "}
        版權所有
      </div>

      {toast && (
        <div className="absolute left-1/2 bottom-[calc(env(safe-area-inset-bottom)+34px)] z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] text-white shadow-lg">
          {toast}
        </div>
      )}

      <style jsx>{`
        @keyframes floatLoveWave {
          0% {
            transform: translate3d(var(--start-x), var(--start-y), 0) scale(0.84) rotate(var(--rotate-start));
            opacity: 0;
          }
          12% { opacity: 1; }
          38% {
            transform: translate3d(calc(var(--start-x) + var(--curve-x)), calc(var(--float-y) * -0.34), 0) scale(1.03) rotate(var(--rotate-mid));
            opacity: 1;
          }
          72% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x) * 0.72), calc(var(--float-y) * -0.76), 0) scale(1) rotate(calc(var(--rotate-end) * 0.65));
            opacity: 0.9;
          }
          100% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x)), calc(var(--float-y) * -1), 0) scale(0.94) rotate(var(--rotate-end));
            opacity: 0;
          }
        }

        @keyframes floatLoveArc {
          0% {
            transform: translate3d(var(--start-x), var(--start-y), 0) scale(0.86) rotate(var(--rotate-start));
            opacity: 0;
          }
          14% { opacity: 1; }
          48% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x) * 0.22), calc(var(--float-y) * -0.62), 0) scale(1.06) rotate(var(--rotate-mid));
            opacity: 1;
          }
          100% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x) * 1.2), calc(var(--float-y) * -0.94), 0) scale(0.92) rotate(var(--rotate-end));
            opacity: 0;
          }
        }

        @keyframes floatLoveSway {
          0% {
            transform: translate3d(var(--start-x), var(--start-y), 0) scale(0.82) rotate(var(--rotate-start));
            opacity: 0;
          }
          12% { opacity: 1; }
          30% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x) * 0.5), calc(var(--float-y) * -0.28), 0) scale(1.02) rotate(var(--rotate-mid));
          }
          62% {
            transform: translate3d(calc(var(--start-x) + var(--curve-x) * 1.35), calc(var(--float-y) * -0.7), 0) scale(1.04) rotate(calc(var(--rotate-mid) * -1));
            opacity: 1;
          }
          100% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x) * 0.82), calc(var(--float-y) * -1.05), 0) scale(0.9) rotate(var(--rotate-end));
            opacity: 0;
          }
        }

        @keyframes floatLoveBurst {
          0% {
            transform: translate3d(var(--start-x), var(--start-y), 0) scale(0.72) rotate(var(--rotate-start));
            opacity: 0;
          }
          10% {
            transform: translate3d(calc(var(--start-x) + var(--curve-x) * 0.5), calc(var(--float-y) * -0.2), 0) scale(1.12) rotate(var(--rotate-mid));
            opacity: 1;
          }
          54% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x) * 0.48), calc(var(--float-y) * -0.58), 0) scale(1) rotate(calc(var(--rotate-end) * 0.35));
            opacity: 1;
          }
          100% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x) * 1.08), calc(var(--float-y) * -0.92), 0) scale(0.88) rotate(var(--rotate-end));
            opacity: 0;
          }
        }

        @keyframes floatLoveSpiral {
          0% {
            transform: translate3d(var(--start-x), var(--start-y), 0) scale(0.8) rotate(var(--rotate-start));
            opacity: 0;
          }
          16% { opacity: 1; }
          35% {
            transform: translate3d(calc(var(--start-x) + var(--curve-x) * 1.25), calc(var(--float-y) * -0.32), 0) scale(1.05) rotate(calc(var(--rotate-mid) + 12deg));
          }
          68% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x) * 0.35), calc(var(--float-y) * -0.72), 0) scale(0.98) rotate(calc(var(--rotate-mid) - 12deg));
            opacity: 0.95;
          }
          100% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x)), calc(var(--float-y) * -1), 0) scale(0.9) rotate(var(--rotate-end));
            opacity: 0;
          }
        }

        .floating-love-event {
          animation-duration: var(--motion-duration);
          animation-fill-mode: forwards;
          animation-timing-function: cubic-bezier(0.2, 0.72, 0.28, 1);
          will-change: transform, opacity;
        }

        .motion-1 { animation-name: floatLoveWave; }
        .motion-2 { animation-name: floatLoveArc; }
        .motion-3 { animation-name: floatLoveSway; }
        .motion-4 { animation-name: floatLoveBurst; }
        .motion-5 { animation-name: floatLoveSpiral; }

        .home-love-copyright {
          padding-bottom: max(2px, env(safe-area-inset-bottom));
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-love-event {
            animation-duration: 600ms;
          }
        }
      `}</style>

      <style jsx global>{`
        html:has(#home-love-support),
        body:has(#home-love-support) {
          height: 100dvh;
          overflow: hidden;
          overscroll-behavior: none;
        }

        body:has(#home-love-support) > div.w-full.max-w-md {
          height: 100dvh;
          min-height: 100dvh;
          overflow: hidden;
        }

        body:has(#home-love-support) div.flex-1.px-6.py-8.flex.flex-col:has(#home-love-support) {
          min-height: 0;
          overflow: hidden;
          padding-top: clamp(14px, 2.1dvh, 30px);
          padding-bottom: max(8px, env(safe-area-inset-bottom));
          gap: clamp(4px, 0.75dvh, 12px);
        }

        body:has(#home-love-support) div[class*="h-[276px]"] {
          height: clamp(232px, 32dvh, 276px) !important;
          min-height: clamp(232px, 32dvh, 276px) !important;
          padding-top: clamp(30px, 5dvh, 48px) !important;
          padding-bottom: clamp(22px, 3.5dvh, 40px) !important;
        }

        body:has(#home-love-support) div:has(> #home-love-support) > div > button:last-child {
          margin-top: clamp(0px, 0.4dvh, 4px);
          padding-top: clamp(4px, 0.8dvh, 8px);
          padding-bottom: clamp(4px, 0.8dvh, 8px);
        }

        #home-love-support {
          margin-top: clamp(2px, 0.5dvh, 8px);
          padding-top: 0;
          padding-bottom: 0;
        }

        #home-love-support + div.mt-auto {
          display: none;
        }

        @media (max-height: 740px) {
          body:has(#home-love-support) div.flex-1.px-6.py-8.flex.flex-col:has(#home-love-support) {
            padding-left: 20px;
            padding-right: 20px;
          }

          body:has(#home-love-support) div:has(> #home-love-support) > div > button[class*="rounded-3xl"] {
            padding-top: 14px;
            padding-bottom: 14px;
          }
        }
      `}</style>
    </section>
  );
}
