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
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  return [ref, canScrollRight];
}
