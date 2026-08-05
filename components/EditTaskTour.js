"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle, X } from "lucide-react";

const STORAGE_KEY = "relay_edit_task_tour_done";

const STEPS = [
  {
    target: "edit-content",
    title: "更新任務內容",
    text: "修改標題與簡介，讓參與者清楚知道最新安排。",
  },
  {
    target: "edit-date",
    title: "調整活動日期",
    text: "日期有變更時，儲存前請再次確認，避免參與者依照舊時間前往。",
  },
  {
    target: "edit-settings",
    title: "檢查報名設定",
    text: "可依需求調整人數上限、分類與數量單位，不需要的欄位可維持原設定。",
  },
  {
    target: "edit-summary",
    title: "確認本次修改",
    text: "頁面下方會整理這次異動項目，儲存前先快速核對一次。",
  },
  {
    target: "edit-save",
    title: "儲存變更",
    text: "確認無誤後再儲存。教學不會替你修改或自動送出任何資料。",
  },
];

function getTargetElement(name) {
  if (typeof document === "undefined") return null;
  return document.querySelector(`[data-edit-tour="${name}"]`);
}

export function shouldOfferEditTaskTour() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "1";
  } catch (e) {
    return false;
  }
}

export function markEditTaskTourSeen() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch (e) {}
}

export default function EditTaskTour({ open, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);
  const frameRef = useRef(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    setVisible(false);
    const element = getTargetElement(step.target);
    if (!element) {
      setRect(null);
      setVisible(true);
      return;
    }

    // LINE 內建瀏覽器對 smooth scroll 加上持續 scroll 監聽容易掉幀。
    // 改為一次完成捲動，再用兩個 animation frame 等待版面穩定後定位。
    element.scrollIntoView({ behavior: "auto", block: "center" });

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => {
        setRect(element.getBoundingClientRect());
        setVisible(true);
      });
    });

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [open, step.target]);

  useEffect(() => {
    if (!open) return;

    let resizeFrame = null;
    const handleResize = () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        const element = getTargetElement(step.target);
        if (element) setRect(element.getBoundingClientRect());
      });
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
    };
  }, [open, step.target]);

  const cardStyle = useMemo(() => {
    const horizontal = { left: 20, right: 20 };
    if (!rect) return { ...horizontal, bottom: 24 };

    const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;

    if (stepIndex >= 3) {
      return { ...horizontal, top: 76 };
    }

    const spaceBelow = viewportHeight - rect.bottom;
    if (spaceBelow > 230) {
      return {
        ...horizontal,
        top: Math.min(rect.bottom + 14, viewportHeight - 220),
      };
    }

    const cardHeight = 210;
    const safeTop = 76;
    const preferredTop = rect.top - cardHeight - 14;
    if (preferredTop >= safeTop) {
      return { ...horizontal, top: preferredTop };
    }

    return { ...horizontal, bottom: 24 };
  }, [rect, stepIndex]);

  function finish() {
    markEditTaskTourSeen();
    setStepIndex(0);
    onClose();
  }

  function goToStep(nextIndex) {
    setVisible(false);
    setStepIndex(nextIndex);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" aria-modal="true" role="dialog" aria-label="編輯任務教學">
      {!rect && <div className="absolute inset-0 bg-slate-950/55" />}

      {rect && (
        <div
          className={`absolute rounded-[22px] border-2 border-white bg-transparent shadow-[0_0_0_9999px_rgba(2,6,23,0.56),0_0_0_6px_rgba(16,185,129,0.25)] pointer-events-none will-change-transform transition-[opacity,transform] duration-150 ease-out ${
            visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.99]"
          }`}
          style={{
            left: Math.max(8, rect.left - 8),
            top: Math.max(8, rect.top - 8),
            width: Math.min(window.innerWidth - 16, rect.width + 16),
            height: rect.height + 16,
          }}
        />
      )}

      <button
        type="button"
        onClick={finish}
        className="absolute right-4 top-4 rounded-full bg-white/95 p-2 text-gray-500 shadow-sm"
        aria-label="跳過教學"
      >
        <X size={18} />
      </button>

      <div
        className={`absolute rounded-3xl bg-white p-5 shadow-2xl will-change-transform transition-[opacity,transform] duration-150 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
        }`}
        style={cardStyle}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <HelpCircle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-gray-800">{step.title}</p>
              <span className="text-[11px] font-medium text-gray-400">{stepIndex + 1} / {STEPS.length}</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{step.text}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="px-2 py-2 text-xs font-medium text-gray-400"
          >
            跳過教學
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => goToStep(stepIndex - 1)}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 active:scale-95"
              >
                上一步
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? finish() : goToStep(stepIndex + 1))}
              className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-100 active:scale-95"
            >
              {isLast ? "完成教學" : "下一步"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
