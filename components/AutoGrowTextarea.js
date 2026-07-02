"use client";
import { useEffect, useRef } from "react";

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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [value, maxHeight]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={minRows}
      className={`${className} resize-none overflow-y-auto`}
      style={{ maxHeight }}
    />
  );
}
