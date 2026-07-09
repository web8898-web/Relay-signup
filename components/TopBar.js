"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const HOME_RETURN_ANIMATION_KEY = "relay_home_return_expand";

function markHomeReturnAnimation() {
  try {
    sessionStorage.setItem(HOME_RETURN_ANIMATION_KEY, "1");
  } catch (e) {}
}

export function TopBar({ title, backHref, onBack, right }) {
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  function handleBackClick() {
    markHomeReturnAnimation();
    onBack?.();
  }

  const bar = (
    <div className="fixed top-0 left-1/2 z-[9999] w-full max-w-md -translate-x-1/2 bg-emerald-500 text-white px-4 py-4 flex items-center gap-3 shadow-sm">
      {backHref ? (
        <Link href={backHref} onClick={backHref === "/" ? markHomeReturnAnimation : undefined} className="text-white/90 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
      ) : onBack ? (
        <button onClick={handleBackClick} className="text-white/90 hover:text-white">
          <ArrowLeft size={20} />
        </button>
      ) : null}
      <p className="font-bold flex-1 truncate">{title}</p>
      {right}
    </div>
  );

  return (
    <>
      <div className="h-[56px] shrink-0" aria-hidden="true" />
      {portalReady ? createPortal(bar, document.body) : null}
    </>
  );
}

export function EmptyState({ icon, title, desc, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "py-8" : "py-14"}`}>
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4 text-emerald-500 shadow-sm shadow-emerald-100">
        {icon}
      </div>
      <p className="text-base font-bold text-gray-700">{title}</p>
      <p className="text-sm text-gray-400 mt-2 max-w-[260px] leading-relaxed whitespace-pre-line">{desc}</p>
      {action && <div className="mt-5 w-full max-w-[260px]">{action}</div>}
    </div>
  );
}
