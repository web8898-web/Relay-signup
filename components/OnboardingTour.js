"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const ONBOARDING_KEY = "relay_onboarding_v1";

const PUNCT = "，、。！？；：";
function splitAtPunctuation(text) {
  const segs = [];
  let buf = "";
  for (const ch of text) {
    buf += ch;
    if (PUNCT.includes(ch)) {
      segs.push(buf);
      buf = "";
    }
  }
  if (buf) segs.push(buf);
  return segs;
}

export function getOnboardingState() {
  try {
    return localStorage.getItem(ONBOARDING_KEY);
  } catch (e) {
    return "done";
  }
}

export function setOnboardingState(value) {
  try {
    localStorage.setItem(ONBOARDING_KEY, value);
  } catch (e) {}
}

export function resetOnboarding() {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (e) {}
}

const CREATE_BANNER_STEP = {
  target: "banner",
  title: "活動橫幅圖（選填）",
  text: "需要時可點擊展開並上傳活動圖片。建議尺寸為 1200 × 630 像素，圖片會顯示在接龍頁、轉分享畫面與 LINE 分享卡片；沒有圖片也可以直接略過。",
};

export default function OnboardingTour({ steps, finishLabel = "知道了", onFinish, onSkip }) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [place, setPlace] = useState("below");
  const [effectiveSteps, setEffectiveSteps] = useState(steps);
  const [animate, setAnimate] = useState(true);
  const [shown, setShown] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    const timers = [];

    const resolveSteps = () => {
      if (cancelled) return;
      const isCreatePage = window.location.pathname === "/create";
      const hasBannerTarget = Boolean(document.querySelector('[data-tour="banner"]'));
      const alreadyIncluded = steps.some((item) => item.target === "banner");

      if (isCreatePage && hasBannerTarget && !alreadyIncluded) {
        const titleIndex = steps.findIndex((item) => item.target === "title");
        const insertAt = titleIndex >= 0 ? titleIndex + 1 : 0;
        setEffectiveSteps([
          ...steps.slice(0, insertAt),
          CREATE_BANNER_STEP,
          ...steps.slice(insertAt),
        ]);
      } else {
        setEffectiveSteps(steps);
      }
    };

    resolveSteps();
    [80, 220, 500].forEach((delay) => timers.push(window.setTimeout(resolveSteps, delay)));

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [mounted, steps]);

  useEffect(() => {
    if (!mounted) return;
    function prevent(e) {
      e.preventDefault();
    }
    document.addEventListener("touchmove", prevent, { passive: false });
    document.addEventListener("wheel", prevent, { passive: false });
    return () => {
      document.removeEventListener("touchmove", prevent);
      document.removeEventListener("wheel", prevent);
    };
  }, [mounted]);

  const step = effectiveSteps[index];
  const isLast = index === effectiveSteps.length - 1;

  useEffect(() => {
    if (!rect || shown) return;
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [rect, shown]);

  useEffect(() => {
    if (!mounted || !step) return;

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null);
      if (isLast) onFinish?.();
      else setIndex((current) => current + 1);
      return;
    }

    function measure() {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      setPlace(r.bottom + 230 <= window.innerHeight ? "below" : "above");
    }

    function scrollParentOf(node) {
      let parent = node.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (
          /(auto|scroll)/.test(style.overflowY) &&
          parent.scrollHeight > parent.clientHeight + 1
        ) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return null;
    }

    measure();

    let settle = null;
    const initialRect = el.getBoundingClientRect();
    const scrollContainer = scrollParentOf(el);
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const viewTop = Math.max(containerRect.top, 0);
      const viewBottom = Math.min(containerRect.bottom, window.innerHeight);
      const margin = 16;
      let delta = 0;

      if (initialRect.top < viewTop + margin) {
        delta = initialRect.top - (viewTop + margin);
      } else if (initialRect.bottom > viewBottom - margin) {
        delta = initialRect.bottom - (viewBottom - margin);
      }

      if (Math.abs(delta) > 1) {
        setAnimate(false);
        const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        const next = Math.max(0, Math.min(scrollContainer.scrollTop + delta, maxScroll));
        scrollContainer.scrollTo({ top: next, behavior: "smooth" });
        settle = setTimeout(() => {
          measure();
          setAnimate(true);
        }, 450);
      }
    }

    function onMove() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    }

    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      if (settle) clearTimeout(settle);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [mounted, index, step, isLast, onFinish]);

  if (!mounted || !step || !rect) return null;

  function handleNext() {
    if (isLast) onFinish?.();
    else setIndex(index + 1);
  }

  const pad = 6;
  const hole = {
    top: Math.max(rect.top - pad, 0),
    left: Math.max(rect.left - pad, 0),
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[80] pointer-events-none transition-opacity duration-500 ease-out ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="fixed left-0 right-0 top-0 pointer-events-auto touch-none"
        style={{ height: hole.top }}
      />
      <div
        className="fixed left-0 right-0 bottom-0 pointer-events-auto touch-none"
        style={{ top: hole.top + hole.height }}
      />
      <div
        className="fixed left-0 pointer-events-auto touch-none"
        style={{ top: hole.top, width: hole.left, height: hole.height }}
      />
      <div
        className="fixed right-0 pointer-events-auto touch-none"
        style={{
          top: hole.top,
          left: hole.left + hole.width,
          height: hole.height,
        }}
      />
      {!step.tapTarget && (
        <div
          className="fixed pointer-events-auto touch-none"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
          }}
        />
      )}

      <div
        className={`fixed rounded-2xl ${animate ? "transition-all duration-300 ease-out" : ""}`}
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.62)",
        }}
      >
        <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-400" />
      </div>

      <div
        className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-sm pointer-events-auto ${animate ? "transition-all duration-300 ease-out" : ""}`}
        style={
          place === "below"
            ? { top: rect.top + rect.height + pad + 14 }
            : { bottom: window.innerHeight - rect.top + pad + 14 }
        }
      >
        <div className="bg-white rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center gap-1.5 mb-2">
            {effectiveSteps.map((item, itemIndex) => (
              <span
                key={`${item.target}-${itemIndex}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  itemIndex === index ? "w-5 bg-emerald-500" : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
            {effectiveSteps.length > 1 && (
              <span className="ml-auto text-[11px] text-gray-400 font-medium">
                {index + 1} / {effectiveSteps.length}
              </span>
            )}
          </div>
          <p className="font-semibold text-gray-800 mb-1" style={{ textWrap: "balance" }}>
            {step.title}
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            {splitAtPunctuation(step.text).map((segment, segmentIndex) => (
              <span key={segmentIndex} className="inline-block">
                {segment}
              </span>
            ))}
          </p>
          <div className="flex items-center justify-between mt-4 gap-3">
            <button
              onClick={() => onSkip?.()}
              className="text-xs text-gray-400 hover:text-gray-500 py-2 px-1 transition"
            >
              略過教學
            </button>
            <button
              onClick={handleNext}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white text-sm font-semibold rounded-full px-6 py-2.5 transition"
            >
              {isLast ? finishLabel : "下一步"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
