"use client";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

// Renders its children directly into document.body via a portal, instead
// of wherever this component happens to sit in the component tree. This is
// necessary (not just nicer) for any toast that might end up nested inside
// a FadeIn wrapper or similar — CSS transforms on an ancestor turn that
// ancestor into the containing block for `position: fixed` descendants,
// which silently breaks "fixed to the screen" positioning. A portal
// sidesteps the problem entirely by never being a DOM descendant of
// whatever transformed wrapper it was logically nested under.
export default function Toast({ children, className = "" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !children) return null;

  return createPortal(
    <div className={`fixed left-1/2 -translate-x-1/2 z-50 ${className}`}>
      {children}
    </div>,
    document.body
  );
}
