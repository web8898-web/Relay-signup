import "./globals.css";
import LiffBootstrap from "@/components/LiffBootstrap";
import LiffTransitionOverlay from "@/components/LiffTransitionOverlay";

export const metadata = {
  title: "接龍報名",
  description: "在 LINE 上分享、免登入即可完成報名的接龍小工具",
};

// Runs synchronously as the very first thing inside <body>, before any of
// the app's own markup is even parsed, let alone painted. LIFF's deep-link
// redirect (e.g. https://liff.line.me/{liffId}/my-tasks/xxx) always makes a
// brief first stop on this root page with a `liff.state` query param before
// the SDK auto-navigates to the real target — that first stop is a fixed
// part of LINE's redirect protocol and can't be skipped. What CAN be
// avoided is people actually seeing the homepage during that gap: this
// plain inline script covers the screen the instant it detects that param,
// which is well before React's JS bundle has even loaded — a React
// component can't run early enough to prevent the flash, only a raw
// <script> parsed inline in the HTML can.
const antiFlashScript = `
(function () {
  try {
    if (window.location.search.indexOf("liff.state=") === -1) return;
    var el = document.createElement("div");
    el.id = "liff-splash";
    el.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:linear-gradient(to bottom,#ecfdf5,#ffffff,#ecfdf5);";
    el.innerHTML =
      '<div style="width:64px;height:64px;border-radius:9999px;background:#10b981;box-shadow:0 10px 25px -5px rgba(16,185,129,0.4);display:flex;align-items:center;justify-content:center;">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>' +
      '</div>' +
      '<div style="display:flex;gap:6px;">' +
      '<span style="width:8px;height:8px;border-radius:9999px;background:#34d399;"></span>' +
      '<span style="width:8px;height:8px;border-radius:9999px;background:#34d399;"></span>' +
      '<span style="width:8px;height:8px;border-radius:9999px;background:#34d399;"></span>' +
      "</div>";
    document.body.appendChild(el);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body className="bg-gradient-to-b from-emerald-50 via-white to-emerald-50 min-h-screen">
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
        <LiffBootstrap />
        <LiffTransitionOverlay />
        <div className="w-full max-w-md mx-auto min-h-screen bg-white shadow-xl relative flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
