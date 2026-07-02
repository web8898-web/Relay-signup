"use client";
import { useEffect, useRef, useState } from "react";

// Tracks whether a horizontally-scrollable element still has more content
// to the right that hasn't been scrolled into view yet. Used to show/hide
// the "there's more" fade + arrow hint.
//
// Strategy: default to "visible" whenever there are enough items that it's
// almost certainly overflowing on a phone-width screen, then rely on real
// scroll events (which only ever fire when genuine overflow exists) to
// detect when the user has actually reached the end and hide the hint.
// This avoids depending on a precise scrollWidth/clientWidth measurement
// at mount time, which can be unreliable across different layout contexts.
export function useScrollFadeRight(itemCount, minItemsToOverflow = 3) {
  const ref = useRef(null);
  const [canScrollRight, setCanScrollRight] = useState(
    (itemCount || 0) >= minItemsToOverflow
  );

  useEffect(() => {
    setCanScrollRight((itemCount || 0) >= minItemsToOverflow);
  }, [itemCount, minItemsToOverflow]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
    }

    el.addEventListener("scroll", update, { passive: true });

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }

    // One-off delayed correction in case there actually isn't any overflow
    // (e.g. on a wide screen) despite the item count looking like there
    // should be — this only ever turns the hint OFF, never stuck ON.
    const t = setTimeout(update, 400);

    return () => {
      el.removeEventListener("scroll", update);
      if (ro) ro.disconnect();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCount]);

  return [ref, canScrollRight];
}
