"use client";
import { useEffect } from "react";

// The instant, no-JS-load-wait splash lives in a plain inline <script> in
// app/layout.js (see the comment there for why it has to be a raw script
// rather than a React component). This component's only job, once React
// has actually loaded, is a safety net: if a `liff.state` redirect never
// actually happens for some reason, don't leave people staring at that
// splash forever.
export default function LiffTransitionOverlay() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.search.includes("liff.state=")) return;
    const timeout = setTimeout(() => {
      document.getElementById("liff-splash")?.remove();
    }, 4000);
    return () => clearTimeout(timeout);
  }, []);

  return null;
}
