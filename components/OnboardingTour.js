"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ---------------------------------------------------------------------------
// 首次操作教學導覽（聚光燈式）
//
// 跟 Toast.js 一樣用 React Portal 直接掛到 document.body，
// 而不是掛在元件樹裡原本的位置——因為只要外層有 FadeIn 這類帶
// CSS transform 的包裝，position: fixed 的定位基準就會被改變、
// 導致跑位（這個坑之前踩過，詳見 Toast.js 的註解）。
//
// 進度狀態存在瀏覽器 localStorage：
//   （沒有值）        → 還沒看過教學，進「建立任務」頁會自動開始
//   "pending-share"  → 建立頁的步驟看完了，等分享頁的最後一步
//   "done"           → 教學已完成（或被略過），不再出現
// ---------------------------------------------------------------------------

export const ONBOARDING_KEY = "relay_onboarding_v1";

// 把一段中文說明文字依標點符號切成小段（每段含結尾的標點）。
// 顯示時每一小段是一個整體，換行只會落在標點後面，
// 不會把一句話從中間硬生生拆開。
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
    // localStorage 不可用（極少數內嵌瀏覽器）時，一律當作已完成，
    // 寧可不顯示教學也不要讓頁面掛掉。
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

// steps: [{ target, title, text, tapTarget }]
//   target:    目標元素的 data-tour 屬性值
//   tapTarget: true 代表這一步要使用者「實際點下」亮框裡的按鈕
//              （例如首頁的建立任務、分享頁的分享到 LINE），此時
//              亮框內可以點；預設 false，導覽期間整個畫面都被鎖住、
//              欄位不能點選，避免誤觸輸入框彈出鍵盤造成畫面錯位。
// finishLabel: 最後一步按鈕的文字（預設「知道了」）
// onFinish: 按完最後一步的「完成」按鈕時呼叫
// onSkip:   按「略過教學」時呼叫
export default function OnboardingTour({ steps, finishLabel = "知道了", onFinish, onSkip }) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [place, setPlace] = useState("below");
  const rafRef = useRef(0);

  useEffect(() => setMounted(true), []);

  // 導覽期間鎖住瀏覽器的手動捲動（觸控滑動與滾輪），
  // 元件卸載（教學結束）時自動解鎖。
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

  const step = steps[index];
  const isLast = index === steps.length - 1;

  // 亮框與氣泡移動時是否套用滑動動畫：平常開著，讓「同畫面換
  // 步驟」時亮框優雅地滑過去；頁面正在捲動時關掉，避免動畫
  // 追著捲動座標跑造成畫面跳動。
  const [animate, setAnimate] = useState(true);

  // 量測目前這一步的目標元素位置。捲動採「必要時才動」策略：
  // 目標已經在舒適範圍內（看得到、下方留得出氣泡空間）就完全
  // 不捲動，避免每一步都重新置中造成畫面跳動；只有目標超出
  // 範圍時，才把它平滑捲到接近頂端的固定錨點。
  useEffect(() => {
    if (!mounted || !step) return;

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      // 找不到目標（理論上不會發生）就直接跳下一步，避免卡住。
      setRect(null);
      if (isLast) onFinish?.();
      else setIndex((i) => i + 1);
      return;
    }

    function measure() {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      // 目標下方剩餘空間夠放說明氣泡就放下面，不夠就放上面。
      setPlace(r.bottom + 230 <= window.innerHeight ? "below" : "above");
    }

    // 往上找到目標實際所在的可捲動容器（表單區是 overflow-y-auto）
    function scrollParentOf(node) {
      let p = node.parentElement;
      while (p) {
        const cs = window.getComputedStyle(p);
        if (
          /(auto|scroll)/.test(cs.overflowY) &&
          p.scrollHeight > p.clientHeight + 1
        ) {
          return p;
        }
        p = p.parentElement;
      }
      return null;
    }

    measure();

    let settle = null;
    const r0 = el.getBoundingClientRect();
    const sc = scrollParentOf(el);
    if (sc) {
      // 只有目標「真的被畫面切到」才捲動，而且只捲讓它完整露出
      // 的最小距離。目標下方不必預留氣泡空間——空間不夠時氣泡
      // 會自動改放到目標上方，所以不需要為了氣泡搬動整個畫面。
      const cRect = sc.getBoundingClientRect();
      const viewTop = Math.max(cRect.top, 0);
      const viewBottom = Math.min(cRect.bottom, window.innerHeight);
      const margin = 16;
      let delta = 0;
      if (r0.top < viewTop + margin) {
        delta = r0.top - (viewTop + margin); // 被上緣切到：往上捲一點點
      } else if (r0.bottom > viewBottom - margin) {
        delta = r0.bottom - (viewBottom - margin); // 被下緣切到：往下捲一點點
      }
      if (Math.abs(delta) > 1) {
        // 捲動期間關閉滑動動畫（亮框直接跟著座標走），捲完再打開。
        setAnimate(false);
        const maxScroll = sc.scrollHeight - sc.clientHeight;
        const next = Math.max(0, Math.min(sc.scrollTop + delta, maxScroll));
        sc.scrollTo({ top: next, behavior: "smooth" });
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

  const pad = 6; // 亮框比目標元素四周各外擴一點，看起來比較舒服

  // 亮框（含外擴留白）的實際範圍，點擊阻擋層以此為界
  const hole = {
    top: Math.max(rect.top - pad, 0),
    left: Math.max(rect.left - pad, 0),
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] pointer-events-none">
      {/* 點擊阻擋層：導覽期間鎖住整個畫面，避免誤觸欄位彈出鍵盤
          造成畫面錯位。用四片透明區塊把亮框以外全部蓋住；亮框本身
          只有在 tapTarget 的步驟才留空讓人點，否則也一併蓋住。 */}
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

      {/* 聚光燈亮框：用超大 box-shadow 把亮框以外的整個畫面壓暗 */}
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

      {/* 說明氣泡 */}
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
            {steps.map((s, i) => (
              <span
                key={s.target}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-5 bg-emerald-500" : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
            {steps.length > 1 && (
              <span className="ml-auto text-[11px] text-gray-400 font-medium">
                {index + 1} / {steps.length}
              </span>
            )}
          </div>
          <p className="font-semibold text-gray-800 mb-1" style={{ textWrap: "balance" }}>
            {step.title}
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            {splitAtPunctuation(step.text).map((seg, i) => (
              <span key={i} className="inline-block">
                {seg}
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
