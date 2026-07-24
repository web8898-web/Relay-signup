"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";

const HOME_RETURN_ANIMATION_KEY = "relay_home_return_expand";

function buttonText(button) {
  return String(button?.textContent || "").replace(/\s+/g, " ").trim();
}

function isMeaningfulButton(button) {
  if (!(button instanceof HTMLButtonElement)) return false;
  if (
    button.matches(
      "[data-category-mode],[data-category-required],[data-banner-upload-button],[data-banner-remove-button],[role='switch']"
    )
  ) return true;

  const text = buttonText(button);
  if (["一般報名", "現場排隊", "新增", "帶小孩", "帶朋友", "素食", "葷食", "盒", "份", "張", "包", "人", "個"].some((item) => text === item || text === `+ ${item}`)) {
    return true;
  }
  return false;
}

export default function CreateTaskLeaveGuard() {
  const pathname = usePathname();
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    if (pathname !== "/create") {
      setDirty(false);
      setOpen(false);
      return;
    }

    const markDirty = () => setDirty(true);

    const onInput = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
      if (target.type === "hidden") return;
      markDirty();
    };

    const onClick = (event) => {
      const button = event.target?.closest?.("button");
      if (isMeaningfulButton(button)) markDirty();
    };

    const onBackCapture = (event) => {
      const anchor = event.target?.closest?.('a[href="/"]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const topBar = anchor.closest(".fixed");
      if (!topBar || !dirtyRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
    };

    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("click", onBackCapture, true);

    return () => {
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("click", onBackCapture, true);
    };
  }, [pathname]);

  function goHome() {
    try {
      sessionStorage.setItem(HOME_RETURN_ANIMATION_KEY, "1");
    } catch (error) {}
    dirtyRef.current = false;
    setDirty(false);
    setOpen(false);
    window.location.assign("/");
  }

  if (!mounted || !open || pathname !== "/create") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483600] flex items-center justify-center bg-black/50 p-6"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
          <AlertTriangle size={20} />
        </div>
        <p className="text-base font-semibold text-gray-800">要回到首頁嗎？</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          目前填寫的內容尚未儲存，回到首頁後將不會保留。
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-medium text-gray-600 active:scale-[0.98]"
          >
            繼續編輯
          </button>
          <button
            type="button"
            onClick={goHome}
            className="flex-1 rounded-full bg-rose-500 py-2.5 text-sm font-medium text-white active:scale-[0.98]"
          >
            不儲存，回首頁
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
