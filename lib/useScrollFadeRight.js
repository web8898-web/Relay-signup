"use client";
import { useEffect, useRef, useState } from "react";

// Tracks whether a horizontally-scrollable row still has more content to
// the right that the user hasn't scrolled into view yet.
//
// Approach: place an invisible sentinel element as the very last child of
// the scrollable row, and watch whether it's actually visible within the
// row's viewport using IntersectionObserver. This is far more reliable
// than comparing scrollWidth/clientWidth/scrollLeft by hand, since it
// doesn't depend on getting every ancestor's width containment exactly
// right — it just directly answers "can the user currently see the last
// item or not".
export function useScrollFadeRight(ready) {
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const root = containerRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setCanScrollRight(!entry.isIntersecting),
      { root, threshold: 0.99 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [ready]);

  return [containerRef, sentinelRef, canScrollRight];
}
