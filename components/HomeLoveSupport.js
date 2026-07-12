"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const MAX_FLOATING_HEARTS = 3;
const HEART_LIFETIME_MS = 2800;

function formatCount(value) {
  return new Intl.NumberFormat("zh-TW").format(Number(value) || 0);
}

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function makeFloatingHeart(event, localOnly = false) {
  return {
    id: event?.id || `local-${Date.now()}-${Math.random()}`,
    displayName: event?.display_name || event?.displayName || "謝謝你的支持",
    localOnly,
    driftX: randomBetween(-45, 45),
    floatY: randomBetween(135, 185),
    startX: randomBetween(-18, 18),
    size: randomBetween(28, 36),
    rotateStart: randomBetween(-8, 8),
    rotateEnd: randomBetween(-8, 8),
  };
}

export default function HomeLoveSupport({ profile, onRequireLogin }) {
  const [totalCount, setTotalCount] = useState(null);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [toast, setToast] = useState("");
  const timersRef = useRef(new Map());

  const removeHeart = useCallback((id) => {
    setFloatingHearts((current) => current.filter((heart) => heart.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) window.clearTimeout(timer);
    timersRef.current.delete(id);
  }, []);

  const addFloatingHeart = useCallback(
    (event, localOnly = false) => {
      const heart = makeFloatingHeart(event, localOnly);
      setFloatingHearts((current) => {
        const next = [...current, heart];
        return next.slice(-MAX_FLOATING_HEARTS);
      });
      const timer = window.setTimeout(() => removeHeart(heart.id), HEART_LIFETIME_MS + 100);
      timersRef.current.set(heart.id, timer);
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
          addFloatingHeart(event);
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
    window.setTimeout(() => setPressed(false), 340);

    if (!profile?.accessToken) {
      setToast("請先使用 LINE 登入");
      onRequireLogin?.();
      return;
    }

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
        addFloatingHeart({ displayName: profile.displayName }, true);
        setToast(data?.message || "今天已經送過愛心了 ❤️");
      }
    } catch (error) {
      setToast(error?.message || "暫時無法送出愛心，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative mt-2 rounded-[24px] border border-emerald-100 bg-white px-5 py-5 text-center shadow-sm overflow-visible">
      <div className="pointer-events-none absolute inset-x-0 bottom-[74px] h-48 overflow-visible" aria-hidden="true">
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="floating-love-event absolute left-1/2 bottom-0 flex items-center gap-2"
            style={{
              "--start-x": `${heart.startX}px`,
              "--drift-x": `${heart.driftX}px`,
              "--float-y": `${heart.floatY}px`,
              "--rotate-start": `${heart.rotateStart}deg`,
              "--rotate-end": `${heart.rotateEnd}deg`,
            }}
          >
            <Heart
              size={heart.size}
              className="shrink-0 fill-rose-400 text-rose-500 drop-shadow-sm"
              strokeWidth={1.8}
            />
            <span className="max-w-[170px] truncate rounded-full border border-rose-100 bg-white/95 px-3 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm">
              {heart.localOnly ? "今天也謝謝你的支持" : `${heart.displayName} 喜歡這個小工具`}
            </span>
          </div>
        ))}
      </div>

      <p className="font-semibold text-gray-800">喜歡這個小工具嗎？</p>
      <p className="mt-1 text-xs text-gray-400">送出一顆愛心，給我們一點支持。</p>

      <button
        type="button"
        onClick={handleLoveClick}
        disabled={submitting}
        aria-label="送出一顆愛心支持接龍報名小助手"
        className={`mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-500 shadow-sm transition-transform duration-300 disabled:opacity-70 ${
          pressed ? "scale-[1.16]" : "scale-100"
        }`}
      >
        <Heart size={30} className="fill-rose-400 text-rose-500" strokeWidth={1.8} />
      </button>

      <p className="mt-3 text-xs text-gray-500" aria-live="polite">
        {totalCount == null ? "— 個愛心" : `已有 ${formatCount(totalCount)} 人送出愛心`}
      </p>

      {toast && (
        <div className="absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-800 px-3 py-1.5 text-[11px] text-white shadow-lg">
          {toast}
        </div>
      )}

      <style jsx>{`
        @keyframes floatLove {
          0% {
            transform: translate3d(var(--start-x), 10px, 0) scale(0.85) rotate(var(--rotate-start));
            opacity: 0;
          }
          10% { opacity: 1; }
          55% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x) * 0.55), calc(var(--float-y) * -0.55), 0) scale(1.05) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x)), calc(var(--float-y) * -1), 0) scale(0.95) rotate(var(--rotate-end));
            opacity: 0;
          }
        }

        .floating-love-event {
          animation: floatLove 2.8s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
          will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-love-event {
            animation-duration: 600ms;
          }
        }
      `}</style>
    </section>
  );
}
