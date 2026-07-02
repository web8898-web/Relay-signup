"use client";
import { useEffect, useRef, useState } from "react";

// Tracks whether a horizontally-scrollable element still has more content
// to the right that hasn't been scrolled into view yet. Used to show/hide
// the "there's more" fade + arrow hint, and to hide it once the user has
// actually scrolled all the way to the end.
export function useScrollFadeRight(watch) {
  const ref = useRef(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      // small tolerance for sub-pixel rounding
      setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });

    // Watch the element's own size, not just the window — this catches
    // late layout shifts (web fonts finishing load, content changing,
    // mobile browser chrome resizing) that a plain window "resize"
    // listener would miss, which could otherwise leave the hint stuck
    // showing (or stuck hidden) on the first render.
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } else {
      window.addEventListener("resize", update);
    }

    // Re-check a couple more times shortly after mount, in case fonts or
    // content settle a moment after the initial paint.
    const t1 = setTimeout(update, 150);
    const t2 = setTimeout(update, 500);

    return () => {
      el.removeEventListener("scroll", update);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", update);
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  return [ref, canScrollRight];
}
