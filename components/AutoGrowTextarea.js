"use client";
import { useLayoutEffect, useRef } from "react";

// Finds the nearest scrollable ancestor so we can pin its scroll position
// while we resize — without this, growing/shrinking the textarea's height
// can trigger the browser's native "scroll the focused element into view"
// behavior, which fights with our own height changes and makes the whole
// page appear to jump around while typing.
function getScrollParent(node) {
  let el = node?.parentElement;
  while (el) {
    const style = window.getComputedStyle(el);
    if ((style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
      return el;
    }
    el = el.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

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
  const prevLengthRef = useRef((value || "").length);

  function resize(mayHaveShrunk) {
    const el = ref.current;
    if (!el) return;
    const scrollParent = getScrollParent(el);
    const prevScrollTop = scrollParent.scrollTop;

    // scrollHeight already reflects the full content height even without
    // resetting to "auto" first — that reset is only needed to correctly
    // detect when the content got *shorter* (e.g. deleting text). Skipping
    // it for the common "typing more, including pressing Enter" case
    // avoids a brief shrink-then-grow flash that was triggering the
    // browser's own "keep the caret visible" auto-scroll, which is what
    // caused the jumpy page position while typing.
    if (mayHaveShrunk) {
      el.style.height = "auto";
    }
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";

    // Restore the scroll position immediately, before the browser paints,
    // so any native "scroll into view" nudge gets cancelled out.
    scrollParent.scrollTop = prevScrollTop;
  }

  useLayoutEffect(() => {
    const newLength = (value || "").length;
    const mayHaveShrunk = newLength < prevLengthRef.current;
    resize(mayHaveShrunk);
    prevLengthRef.current = newLength;
    const raf = requestAnimationFrame(() => resize(false));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
