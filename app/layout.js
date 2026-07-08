import "./globals.css";
import LiffBootstrap from "@/components/LiffBootstrap";
import LiffTransitionOverlay from "@/components/LiffTransitionOverlay";

export const metadata = {
  title: "接龍報名小助手",
  description: "在 LINE 上分享、免登入即可完成報名的接龍小工具",
  applicationName: "接龍報名小助手",
  appleWebApp: {
    title: "接龍報名小助手",
  },
  openGraph: {
    title: "接龍報名小助手",
    description: "在 LINE 上分享、免登入即可完成報名的接龍小工具",
  },
};

// Runs synchronously as early as possible, before the app UI paints. LIFF's
// deep-link redirect can briefly land on this root page with a `liff.state`
// query param before the SDK navigates to the real target. Setting the title
// in <head> makes the in-app browser title settle on the product name earlier,
// and the splash prevents users from seeing a blank/root-page flash.
const antiFlashScript = `
(function () {
  try {
    document.title = "接龍報名小助手";
    var titleTag = document.querySelector("title");
    if (titleTag) titleTag.textContent = "接龍報名小助手";
    if (window.location.search.indexOf("liff.state=") === -1) return;
    var el = document.createElement("div");
    el.id = "liff-splash";
    el.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:linear-gradient(to bottom,#ecfdf5,#ffffff,#ecfdf5);";
    el.innerHTML =
      '<div style="width:64px;height:64px;border-radius:9999px;background:#10b981;box-shadow:0 10px 25px -5px rgba(16,185,129,0.4);display:flex;align-items:center;justify-content:center;">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>' +
      '</div>' +
      '<div style="font-size:14px;font-weight:700;color:#047857;letter-spacing:0.02em;">接龍報名小助手</div>' +
      '<div style="display:flex;gap:6px;">' +
      '<span style="width:8px;height:8px;border-radius:9999px;background:#34d399;"></span>' +
      '<span style="width:8px;height:8px;border-radius:9999px;background:#34d399;opacity:.55;"></span>' +
      '<span style="width:8px;height:8px;border-radius:9999px;background:#34d399;opacity:.35;"></span>' +
      "</div>";
    document.documentElement.appendChild(el);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <head>
        <title>接龍報名小助手</title>
        <meta name="application-name" content="接龍報名小助手" />
        <meta name="apple-mobile-web-app-title" content="接龍報名小助手" />
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
      </head>
      <body className="bg-gradient-to-b from-emerald-50 via-white to-emerald-50 min-h-screen">
        <LiffBootstrap />
        <LiffTransitionOverlay />
        <div className="w-full max-w-md mx-auto min-h-screen bg-white shadow-xl relative flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
