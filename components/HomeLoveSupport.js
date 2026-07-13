"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const MAX_FLOATING_HEARTS = 3;
const LOVE_MESSAGES = [
  "愛心收到囉", "今天的愛心已收到", "謝謝你的愛心", "謝謝你的支持", "收到你的心意了",
  "今天也收到愛心了", "愛心成功送出", "你的愛心已送達", "心意已收到", "感謝你的支持",
  "愛心已簽收", "愛心入袋", "收到一顆暖暖的心", "愛心補給成功", "今日愛心已完成",
  "你的愛心飛過來了", "愛心已安全抵達", "今天的可愛額度已收到", "這顆愛心我收下啦", "愛心成功充電",
  "今天的愛心已送出", "今日愛心已收到", "今天已經支持過囉", "今天的心意已經收到", "今日份愛心已完成",
  "今天的支持已記錄", "今日愛心已簽收", "今天這顆愛心收到了", "今日支持已完成", "明天再來送一顆吧",
];

const directionPool = [];

function formatCount(value) {
  return new Intl.NumberFormat("zh-TW").format(Number(value) || 0);
}

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function getBalancedDirection() {
  if (directionPool.length === 0) {
    directionPool.push(-1, -1, 1, 1);
    for (let index = directionPool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [directionPool[index], directionPool[swapIndex]] = [directionPool[swapIndex], directionPool[index]];
    }
  }
  return directionPool.pop();
}

function getRandomLoveMessage() {
  return LOVE_MESSAGES[Math.floor(Math.random() * LOVE_MESSAGES.length)];
}

function makeFloatingHeart(event, localOnly = false) {
  const direction = getBalancedDirection();
  return {
    id: event?.id || `local-${Date.now()}-${Math.random()}`,
    displayName: event?.display_name || event?.displayName || "謝謝你的支持",
    localOnly,
    message: localOnly ? getRandomLoveMessage() : "",
    motionType: randomBetween(1, 15),
    driftX: randomBetween(48, 108) * direction,
    curveX: randomBetween(22, 68) * -direction,
    floatY: randomBetween(118, 194),
    startX: randomBetween(-12, 12),
    startY: randomBetween(2, 18),
    size: randomBetween(21, 29),
    rotateStart: randomBetween(-18, 18),
    rotateMid: randomBetween(-16, 16),
    rotateEnd: randomBetween(-25, 25),
    duration: randomBetween(2450, 3550),
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
  const duplicateToastShownRef = useRef(false);

  const removeHeart = useCallback((id) => {
    setFloatingHearts((current) => current.filter((heart) => heart.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) window.clearTimeout(timer);
    timersRef.current.delete(id);
  }, []);

  const addFloatingHeart = useCallback((event, localOnly = false) => {
    const heart = makeFloatingHeart(event, localOnly);
    setFloatingHearts((current) => [...current, heart].slice(-MAX_FLOATING_HEARTS));
    const timer = window.setTimeout(() => removeHeart(heart.id), heart.duration + 160);
    timersRef.current.set(heart.id, timer);
    return heart.id;
  }, [removeHeart]);

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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "love_events" }, (payload) => {
        const event = payload?.new;
        if (!event?.id) return;
        const pending = pendingOwnRealtimeRef.current;
        const isOwnPendingEvent = pending && Date.now() - pending.createdAt < 8000 &&
          (event?.display_name || "") === pending.displayName;
        if (isOwnPendingEvent) pendingOwnRealtimeRef.current = null;
        else addFloatingHeart(event);
        setTotalCount((current) => (typeof current === "number" ? current + 1 : current));
      })
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

    const optimisticHeartId = addFloatingHeart({ displayName: profile.displayName }, true);
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
        if (!duplicateToastShownRef.current) {
          duplicateToastShownRef.current = true;
          setToast("already-loved");
        }
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
                "--start-x": `${heart.startX}px`, "--start-y": `${heart.startY}px`,
                "--drift-x": `${heart.driftX}px`, "--curve-x": `${heart.curveX}px`,
                "--float-y": `${heart.floatY}px`, "--rotate-start": `${heart.rotateStart}deg`,
                "--rotate-mid": `${heart.rotateMid}deg`, "--rotate-end": `${heart.rotateEnd}deg`,
                "--motion-duration": `${heart.duration}ms`,
              }}
            >
              <Heart size={heart.size} className="shrink-0 fill-rose-200 text-rose-200" strokeWidth={0} />
              <span className="max-w-[150px] truncate rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-medium text-gray-500 shadow-sm ring-1 ring-gray-100">
                {heart.localOnly ? heart.message : `${heart.displayName} 喜歡這個小工具`}
              </span>
            </div>
          ))}
        </div>

        <div>
          <button type="button" onClick={handleLoveClick} disabled={submitting}
            aria-label="送出一顆愛心支持接龍報名小助手"
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50/70 ring-1 ring-rose-100/60 transition-transform duration-300 active:scale-95 disabled:opacity-60 ${pressed ? "scale-110" : "scale-100"}`}>
            <Heart size={23} className="fill-rose-200 text-rose-200" strokeWidth={0} />
          </button>
          <p className="mt-1.5 text-[11px] text-gray-400" aria-live="polite">
            {totalCount == null ? "—" : formatCount(totalCount)}
          </p>
        </div>
      </div>

      <div className="home-love-copyright shrink-0 text-center text-[11px] text-gray-300">
        © 2026 <a href="https://www.wiweb.com.tw" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">豐碩企業有限公司</a> 版權所有
      </div>

      {toast && (
        <div className="absolute left-1/2 bottom-[calc(env(safe-area-inset-bottom)+34px)] z-20 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] text-white shadow-lg">
          {toast === "already-loved" ? <><span>今天的愛心已收到，明天再來吧</span><Heart size={12} className="fill-rose-300 text-rose-300" strokeWidth={0} /></> : toast}
        </div>
      )}

      <style jsx>{`
        .floating-love-event { animation-duration: var(--motion-duration); animation-fill-mode: forwards; animation-timing-function: cubic-bezier(.2,.72,.28,1); will-change: transform, opacity; }
        @keyframes m1 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0) scale(.84);opacity:0} 18%{opacity:1} 50%{transform:translate3d(calc(-50% + var(--curve-x)),calc(var(--float-y)*-.48),0) scale(1.04)} 100%{transform:translate3d(calc(-50% + var(--drift-x)),calc(var(--float-y)*-1),0) scale(.92);opacity:0} }
        @keyframes m2 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0) rotate(var(--rotate-start));opacity:0} 14%{opacity:1} 46%{transform:translate3d(calc(-50% + var(--drift-x)*.18),calc(var(--float-y)*-.63),0) rotate(var(--rotate-mid))} 100%{transform:translate3d(calc(-50% + var(--drift-x)*1.08),calc(var(--float-y)*-.94),0) rotate(var(--rotate-end));opacity:0} }
        @keyframes m3 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0) scale(.82);opacity:0} 20%{opacity:1} 34%{transform:translate3d(calc(-50% + var(--drift-x)*.48),calc(var(--float-y)*-.28),0)} 66%{transform:translate3d(calc(-50% + var(--curve-x)*1.2),calc(var(--float-y)*-.72),0)} 100%{transform:translate3d(calc(-50% + var(--drift-x)*.9),calc(var(--float-y)*-1.04),0);opacity:0} }
        @keyframes m4 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0) scale(.7);opacity:0} 12%{transform:translate3d(calc(-50% + var(--curve-x)*.35),calc(var(--float-y)*-.2),0) scale(1.14);opacity:1} 58%{transform:translate3d(calc(-50% + var(--drift-x)*.52),calc(var(--float-y)*-.62),0) scale(1)} 100%{transform:translate3d(calc(-50% + var(--drift-x)*1.08),calc(var(--float-y)*-.95),0) scale(.86);opacity:0} }
        @keyframes m5 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0) rotate(var(--rotate-start));opacity:0} 18%{opacity:1} 38%{transform:translate3d(calc(-50% + var(--curve-x)*1.25),calc(var(--float-y)*-.32),0) rotate(16deg)} 70%{transform:translate3d(calc(-50% + var(--drift-x)*.32),calc(var(--float-y)*-.72),0) rotate(-14deg)} 100%{transform:translate3d(calc(-50% + var(--drift-x)),calc(var(--float-y)*-1),0) rotate(var(--rotate-end));opacity:0} }
        @keyframes m6 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0);opacity:0} 16%{opacity:1} 44%{transform:translate3d(calc(-50% + var(--drift-x)*.78),calc(var(--float-y)*-.35),0)} 72%{transform:translate3d(calc(-50% + var(--curve-x)*.5),calc(var(--float-y)*-.75),0)} 100%{transform:translate3d(calc(-50% + var(--drift-x)*1.02),calc(var(--float-y)*-1),0);opacity:0} }
        @keyframes m7 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0) scale(.9);opacity:0} 15%{opacity:1} 52%{transform:translate3d(calc(-50% + var(--drift-x)*.34),calc(var(--float-y)*-.52),0) scale(1.08)} 100%{transform:translate3d(calc(-50% + var(--drift-x)*.72),calc(var(--float-y)*-1.12),0) scale(.88);opacity:0} }
        @keyframes m8 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0);opacity:0} 18%{opacity:1} 33%{transform:translate3d(calc(-50% + var(--curve-x)*1.1),calc(var(--float-y)*-.25),0)} 60%{transform:translate3d(calc(-50% + var(--drift-x)*.55),calc(var(--float-y)*-.62),0)} 82%{transform:translate3d(calc(-50% + var(--curve-x)*.25),calc(var(--float-y)*-.82),0)} 100%{transform:translate3d(calc(-50% + var(--drift-x)),calc(var(--float-y)*-1),0);opacity:0} }
        @keyframes m9 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0) rotate(-10deg);opacity:0} 15%{opacity:1} 45%{transform:translate3d(calc(-50% + var(--drift-x)*.22),calc(var(--float-y)*-.58),0) rotate(14deg)} 100%{transform:translate3d(calc(-50% + var(--drift-x)*1.15),calc(var(--float-y)*-.9),0) rotate(var(--rotate-end));opacity:0} }
        @keyframes m10 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0) scale(.76);opacity:0} 10%{transform:translate3d(calc(-50% + var(--start-x)),calc(var(--float-y)*-.16),0) scale(1.12);opacity:1} 48%{transform:translate3d(calc(-50% + var(--curve-x)),calc(var(--float-y)*-.55),0) scale(.98)} 100%{transform:translate3d(calc(-50% + var(--drift-x)*.8),calc(var(--float-y)*-1.06),0) scale(.9);opacity:0} }
        @keyframes m11 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0);opacity:0} 18%{opacity:1} 42%{transform:translate3d(calc(-50% + var(--drift-x)*.62),calc(var(--float-y)*-.4),0)} 64%{transform:translate3d(calc(-50% + var(--drift-x)*.18),calc(var(--float-y)*-.68),0)} 100%{transform:translate3d(calc(-50% + var(--drift-x)*1.1),calc(var(--float-y)*-1),0);opacity:0} }
        @keyframes m12 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0) rotate(var(--rotate-start));opacity:0} 15%{opacity:1} 35%{transform:translate3d(calc(-50% + var(--curve-x)*.65),calc(var(--float-y)*-.3),0) rotate(-18deg)} 65%{transform:translate3d(calc(-50% + var(--drift-x)*.72),calc(var(--float-y)*-.7),0) rotate(18deg)} 100%{transform:translate3d(calc(-50% + var(--drift-x)),calc(var(--float-y)*-1),0) rotate(var(--rotate-end));opacity:0} }
        @keyframes m13 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0) scale(.88);opacity:0} 20%{opacity:1} 58%{transform:translate3d(calc(-50% + var(--drift-x)*.5),calc(var(--float-y)*-.72),0) scale(1.02)} 100%{transform:translate3d(calc(-50% + var(--drift-x)*1.25),calc(var(--float-y)*-.88),0) scale(.86);opacity:0} }
        @keyframes m14 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0);opacity:0} 16%{opacity:1} 30%{transform:translate3d(calc(-50% + var(--curve-x)*1.25),calc(var(--float-y)*-.22),0)} 50%{transform:translate3d(calc(-50% + var(--drift-x)*.2),calc(var(--float-y)*-.5),0)} 74%{transform:translate3d(calc(-50% + var(--curve-x)*.55),calc(var(--float-y)*-.78),0)} 100%{transform:translate3d(calc(-50% + var(--drift-x)*.9),calc(var(--float-y)*-1.05),0);opacity:0} }
        @keyframes m15 { 0%{transform:translate3d(calc(-50% + var(--start-x)),var(--start-y),0) scale(.8) rotate(var(--rotate-start));opacity:0} 14%{opacity:1} 40%{transform:translate3d(calc(-50% + var(--drift-x)*.35),calc(var(--float-y)*-.42),0) scale(1.08) rotate(var(--rotate-mid))} 72%{transform:translate3d(calc(-50% + var(--curve-x)*.9),calc(var(--float-y)*-.78),0) scale(.98) rotate(calc(var(--rotate-mid)*-1))} 100%{transform:translate3d(calc(-50% + var(--drift-x)*1.05),calc(var(--float-y)*-1),0) scale(.88) rotate(var(--rotate-end));opacity:0} }
        .motion-1{animation-name:m1}.motion-2{animation-name:m2}.motion-3{animation-name:m3}.motion-4{animation-name:m4}.motion-5{animation-name:m5}
        .motion-6{animation-name:m6}.motion-7{animation-name:m7}.motion-8{animation-name:m8}.motion-9{animation-name:m9}.motion-10{animation-name:m10}
        .motion-11{animation-name:m11}.motion-12{animation-name:m12}.motion-13{animation-name:m13}.motion-14{animation-name:m14}.motion-15{animation-name:m15}
        .home-love-copyright { padding-bottom: max(2px, env(safe-area-inset-bottom)); }
        @media (prefers-reduced-motion: reduce) { .floating-love-event { animation-duration: 600ms; } }
      `}</style>

      <style jsx global>{`
        html:has(#home-love-support), body:has(#home-love-support) { height:100dvh; overflow:hidden; overscroll-behavior:none; }
        body:has(#home-love-support) > div.w-full.max-w-md { height:100dvh; min-height:100dvh; overflow:hidden; }
        body:has(#home-love-support) div.flex-1.px-6.py-8.flex.flex-col:has(#home-love-support) { min-height:0; overflow:hidden; padding-top:clamp(14px,2.1dvh,30px); padding-bottom:max(8px,env(safe-area-inset-bottom)); gap:clamp(4px,.75dvh,12px); }
        body:has(#home-love-support) div[class*="h-[276px]"] { height:clamp(232px,32dvh,276px)!important; min-height:clamp(232px,32dvh,276px)!important; padding-top:clamp(30px,5dvh,48px)!important; padding-bottom:clamp(22px,3.5dvh,40px)!important; }
        body:has(#home-love-support) div:has(> #home-love-support) > div > button:last-child { margin-top:clamp(0px,.4dvh,4px); padding-top:clamp(4px,.8dvh,8px); padding-bottom:clamp(4px,.8dvh,8px); }
        #home-love-support { margin-top:clamp(2px,.5dvh,8px); padding-top:0; padding-bottom:0; }
        #home-love-support + div.mt-auto { display:none; }
        @media (max-height:740px) {
          body:has(#home-love-support) div.flex-1.px-6.py-8.flex.flex-col:has(#home-love-support) { padding-left:20px; padding-right:20px; }
          body:has(#home-love-support) div:has(> #home-love-support) > div > button[class*="rounded-3xl"] { padding-top:14px; padding-bottom:14px; }
        }
      `}</style>
    </section>
  );
}
