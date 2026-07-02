"use client";
import { useLayoutEffect, useRef } from "react";

// A textarea that grows taller as the person types, instead of staying a
// fixed small box that makes long notes hard to read/edit. Grows up to
// maxHeight, then becomes internally scrollable beyond that.
export default function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  minRows = 2,
  maxHeight = 240,
  className = "",
}) {
  const ref = useRef(null);

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }

  useLayoutEffect(() => {
    resize();
    // Re-measure one more time on the next frame — covers cases where this
    // field is pre-filled with existing content (editing a task) and the
    // very first measurement happens before layout has fully settled.
    const raf = requestAnimationFrame(resize);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, maxHeight]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => {
        onChange(e);
        resize();
      }}
      placeholder={placeholder}
      rows={minRows}
      className={`${className} resize-none overflow-y-auto`}
      style={{ maxHeight }}
    />
  );
}
