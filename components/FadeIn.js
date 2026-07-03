"use client";
import { useEffect, useState } from "react";

// A small mount-triggered fade + gentle rise. Used for states that would
// otherwise swap in abruptly (like the "task not found" screen replacing
// whatever was there a moment ago), so the transition reads as intentional
// rather than a jarring jump-cut. Starts hidden, then flips to visible on
// the next animation frame so the browser actually has something to
// transition *from* — setting the "visible" classes immediately on first
// render would just paint the end state with no animation at all.
export default function FadeIn({ children, className = "" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      } ${className}`}
    >
      {children}
    </div>
  );
}
