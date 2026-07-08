"use client";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

function ConfettiBurst() {
  const pieces = [
    ["left-[12%]", "top-[18%]", "bg-emerald-400", "rotate-12", "delay-0"],
    ["left-[24%]", "top-[10%]", "bg-yellow-300", "-rotate-12", "delay-75"],
    ["left-[38%]", "top-[16%]", "bg-rose-300", "rotate-45", "delay-100"],
    ["right-[36%]", "top-[12%]", "bg-sky-300", "-rotate-45", "delay-150"],
    ["right-[22%]", "top-[20%]", "bg-emerald-300", "rotate-12", "delay-200"],
    ["right-[10%]", "top-[9%]", "bg-yellow-400", "-rotate-12", "delay-300"],
  ];
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[49] mx-auto h-24 max-w-sm overflow-visible" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`absolute ${p.join(" ")} w-2 h-3 rounded-[2px] opacity-0 animate-[toast-confetti_900ms_ease-out_forwards]`}
        />
      ))}
    </div>
  );
}

// Renders its children directly into document.body via a portal, instead
// of wherever this component happens to sit in the component tree. This is
// necessary (not just nicer) for any toast that might end up nested inside
// a FadeIn wrapper or similar — CSS transforms on an ancestor turn that
// ancestor into the containing block for `position: fixed` descendants,
// which silently breaks "fixed to the screen" positioning. A portal
// sidesteps the problem entirely by never be a DOM descendant of
// whatever transformed wrapper it was logically nested under.
export default function Toast({ children, className = "" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !children) return null;

  return createPortal(
    <>
      <ConfettiBurst />
      <div className={`fixed left-1/2 -translate-x-1/2 z-50 ${className}`}>
        {children}
      </div>
    </>,
    document.body
  );
}
