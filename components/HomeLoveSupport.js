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
    driftX: randomBetween(-34, 34),
    floatY: randomBetween(110, 155),
    startX: randomBetween(-12, 12),
    size: randomBetween(22, 28),
    rotateStart: randomBetween(-6, 6),
    rotateEnd: randomBetween(-6, 6),
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
      setFloatingHearts((current) => [...current, heart].slice(-MAX_FLOATING_HEARTS));
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
    window.setTimeout(() => setPressed(false), 320);

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
    <section className="relative mx-auto mt-3 w-full max-w-[260px] px-3 py-3 text-center overflow-visible">
      <div className="pointer-events-none absolute inset-x-0 bottom-[58px] h-40 overflow-visible" aria-hidden="true">
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="floating-love-event absolute left-1/2 bottom-0 flex items-center gap-1.5"
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
              className="shrink-0 fill-rose-200 text-rose-200"
              strokeWidth={0}
            />
            <span className="max-w-[150px] truncate rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-medium text-gray-500 shadow-sm ring-1 ring-gray-100">
              {heart.localOnly ? "今天也謝謝你的支持" : `${heart.displayName} 喜歡這個小工具`}
            </span>
          </div>
        ))}
      </div>

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

      <p className="mt-2 text-[11px] text-gray-400" aria-live="polite">
        {totalCount == null ? "—" : formatCount(totalCount)}
      </p>

      {toast && (
        <div className="absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] text-white shadow-lg">
          {toast}
        </div>
      )}

      <style jsx>{`
        @keyframes floatLove {
          0% {
            transform: translate3d(var(--start-x), 8px, 0) scale(0.88) rotate(var(--rotate-start));
            opacity: 0;
          }
          12% { opacity: 1; }
          58% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x) * 0.55), calc(var(--float-y) * -0.55), 0) scale(1.02) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(calc(var(--start-x) + var(--drift-x)), calc(var(--float-y) * -1), 0) scale(0.96) rotate(var(--rotate-end));
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