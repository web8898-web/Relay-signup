"use client";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

// LIFF's deep-link mechanism (e.g. https://liff.line.me/{liffId}/my-tasks/xxx)
// always makes a brief first stop on the Endpoint URL (our root "/") with a
// `liff.state` query param describing where to actually go, then — once
// liff.init() finishes talking to LINE — the SDK itself performs a second,
// real navigation to the intended page. That first stop is unavoidable (it's
// how LINE's redirect protocol works), but we don't have to let people
// actually see/interact with the homepage during that gap. This overlay
// detects the pending `liff.state` param on first paint and covers the
// screen with a lightweight branded transition until the SDK's redirect
// takes over (which unloads the page, so the overlay just disappears with
// it). A short safety timeout reveals the app underneath in case a redirect
// never happens (e.g. someone lands on "/" directly with a stray query
// param), so nobody ever gets stuck looking at a spinner forever.
export default function LiffTransitionOverlay() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.search.includes("liff.state=");
  });

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 animate-pulse">
        <MessageCircle size={28} />
      </div>
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
      </div>
    </div>
  );
}
