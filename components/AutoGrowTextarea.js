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

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const scrollParent = getScrollParent(el);
    // Remember where the view was *before* this update, and keep pinning
    // it back to that spot — including a delayed re-check, since fields
    // close to the on-screen keyboard (like a note field at the bottom of
    // a form) can get nudged by the phone's own "keep the caret visible
    // above the keyboard" behavior, which often fires a beat *after* our
    // own height adjustment, not in the same tick.
    const target = scrollParent.scrollTop;

    const newLength = (value || "").length;
    const mayHaveShrunk = newLength < prevLengthRef.current;
    prevLengthRef.current = newLength;

    // scrollHeight already reflects the full content height even without
    // resetting to "auto" first — that reset is only needed to correctly
    // detect when the content got *shorter* (e.g. deleting text).
    if (mayHaveShrunk) el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";

    function pin() {
      scrollParent.scrollTop = target;
    }

    pin();
    const raf1 = requestAnimationFrame(pin);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(pin));
    const t1 = setTimeout(pin, 80);
    const t2 = setTimeout(pin, 200);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(t1);
      clearTimeout(t2);
    };
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
