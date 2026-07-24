import "./globals.css";
import "./task-card-actions.css";
import "./love-layer-fix.css";
import "./login-love-visibility.css";
import "./save-button-spinner-fix.css";
import LiffBootstrap from "@/components/LiffBootstrap";
import LiffTransitionOverlay from "@/components/LiffTransitionOverlay";
import QueueLiveStatusLabel from "@/components/QueueLiveStatusLabel";
import QueueMascotReference from "@/components/QueueMascotReference";
import QueueClosedMascotFix from "@/components/QueueClosedMascotFix";
import QueueClosedFinalLayout from "@/components/QueueClosedFinalLayout";
import QueueMascotOverflowFix from "@/components/QueueMascotOverflowFix";
import QueueMascotDetailFix from "@/components/QueueMascotDetailFix";
import QueueSmallScreenFix from "@/components/QueueSmallScreenFix";
import QueueJoinAutoFocus from "@/components/QueueJoinAutoFocus";
import TaskShareImageActionFix from "@/components/TaskShareImageActionFix";
import TaskModeTutorial from "@/components/TaskModeTutorial";
import TaskModeCopyFix from "@/components/TaskModeCopyFix";
import TaskTabsScrollFix from "@/components/TaskTabsScrollFix";
import InnerHeaderShadow from "@/components/InnerHeaderShadow";
import HeadcountCategoryQuantityFix from "@/components/HeadcountCategoryQuantityFix";
import HomeLoveNameReplay from "@/components/HomeLoveNameReplay";
import CategoryQuantityProxySignupHint from "@/components/CategoryQuantityProxySignupHint";
import CategoryMultiSignupFix from "@/components/CategoryMultiSignupFix";
import CreateTaskOptionsEnhancement from "@/components/CreateTaskOptionsEnhancement";
import TaskCategorySelectionMode from "@/components/TaskCategorySelectionMode";
import EditTaskConfigMarkerFix from "@/components/EditTaskConfigMarkerFix";
import TutorialCloseButtonFeedback from "@/components/TutorialCloseButtonFeedback";
import CreateTaskBannerCollapse from "@/components/CreateTaskBannerCollapse";
import CreateTaskLeaveGuard from "@/components/CreateTaskLeaveGuard";

const APP_TITLE = "接龍報名小助手";
const APP_DESCRIPTION = "在 LINE 上分享、免登入即可完成報名的接龍小工具";

export const metadata = {
  metadataBase: new URL("https://relay-signup.vercel.app"),
  title: {
    default: APP_TITLE,
    template: `%s｜${APP_TITLE}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_TITLE,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: APP_TITLE,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: APP_TITLE,
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    url: "https://relay-signup.vercel.app",
  },
  twitter: {
    card: "summary",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },
};

export const viewport = {
  themeColor: "#10B981",
};

const antiFlashScript = `
(function () {
  try {
    document.title = "${APP_TITLE}";
    var titleTag = document.querySelector("title");
    if (titleTag) titleTag.textContent = "${APP_TITLE}";
    var metaTitle = document.querySelector('meta[name="title"]');
    if (metaTitle) metaTitle.setAttribute("content", "${APP_TITLE}");

    var launchKey = "relay_launch_splash_v20260724_1";
    var shouldShowLaunch = window.location.pathname === "/" && !window.localStorage.getItem(launchKey);

    if (shouldShowLaunch) {
      var previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";

      var launch = document.createElement("div");
      launch.id = "app-launch-splash";
      launch.setAttribute("aria-label", "${APP_TITLE} 啟動畫面");
      launch.style.cssText =
        "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(160deg,#34d399 0%,#10b981 38%,#059669 100%);opacity:1;transition:opacity 560ms ease;";
      launch.innerHTML =
        '<style>' +
        '@keyframes relayLaunchLogo{0%{opacity:0;transform:translate3d(0,18px,0) scale(.72)}70%{opacity:1;transform:translate3d(0,-2px,0) scale(1.035)}100%{opacity:1;transform:translate3d(0,0,0) scale(1)}}' +
        '@keyframes relayLaunchTitle{0%{opacity:0;transform:translate3d(0,14px,0)}100%{opacity:1;transform:translate3d(0,0,0)}}' +
        '@keyframes relayLaunchDot{0%,100%{opacity:.3;transform:scale(.82)}45%{opacity:1;transform:scale(1.12)}}' +
        '@keyframes relayLaunchRing{0%{opacity:0;transform:scale(.72)}100%{opacity:.22;transform:scale(1)}}' +
        '#app-launch-splash.relay-launch-exit{opacity:0!important;pointer-events:none}' +
        '.relay-launch-wrap{width:min(86vw,380px);display:flex;flex-direction:column;align-items:center;text-align:center;color:#fff;transform:translateY(-2vh)}' +
        '.relay-launch-logo-wrap{position:relative;width:150px;height:150px;display:flex;align-items:center;justify-content:center;animation:relayLaunchLogo 760ms cubic-bezier(.16,1,.3,1) 340ms both}' +
        '.relay-launch-ring{position:absolute;inset:-34px;border:1px solid rgba(255,255,255,.55);border-radius:9999px;animation:relayLaunchRing 900ms ease-out 500ms both}' +
        '.relay-launch-logo{width:118px;height:118px;display:block}' +
        '.relay-launch-title{margin-top:24px;font-size:clamp(30px,8vw,42px);font-weight:800;letter-spacing:-.04em;line-height:1.1;white-space:nowrap;animation:relayLaunchTitle 620ms cubic-bezier(.22,.8,.3,1) 1180ms both}' +
        '.relay-launch-subtitle{margin-top:12px;font-size:14px;font-weight:600;letter-spacing:.08em;color:rgba(255,255,255,.8);animation:relayLaunchTitle 560ms ease-out 1540ms both}' +
        '.relay-launch-dots{margin-top:54px;display:flex;align-items:center;gap:11px}' +
        '.relay-launch-dot{width:9px;height:9px;border-radius:9999px;background:#fff;animation:relayLaunchDot 1050ms ease-in-out infinite}' +
        '.relay-launch-dot:nth-child(2){animation-delay:180ms}.relay-launch-dot:nth-child(3){animation-delay:360ms}' +
        '@media(prefers-reduced-motion:reduce){.relay-launch-logo-wrap,.relay-launch-ring,.relay-launch-title,.relay-launch-subtitle,.relay-launch-dot{animation-duration:1ms!important;animation-delay:0ms!important}}' +
        '</style>' +
        '<div class="relay-launch-wrap">' +
          '<div class="relay-launch-logo-wrap">' +
            '<div class="relay-launch-ring"></div>' +
            '<svg class="relay-launch-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" aria-hidden="true">' +
              '<path d="M22 105L28.5 86.5C20.5 77.8 16 66.3 16 54C16 28.6 36.8 8 62.5 8C88.2 8 109 28.6 109 54C109 79.4 88.2 100 62.5 100C52.1 100 42.5 96.6 34.8 90.9L22 105Z" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
          '</div>' +
          '<div class="relay-launch-title">${APP_TITLE}</div>' +
          '<div class="relay-launch-subtitle">把接龍，變簡單</div>' +
          '<div class="relay-launch-dots"><span class="relay-launch-dot"></span><span class="relay-launch-dot"></span><span class="relay-launch-dot"></span></div>' +
        '</div>';

      document.documentElement.appendChild(launch);

      window.setTimeout(function () {
        launch.classList.add("relay-launch-exit");
      }, 4400);

      window.setTimeout(function () {
        try {
          window.localStorage.setItem(launchKey, "seen");
        } catch (e) {}
        launch.remove();
        document.documentElement.style.overflow = previousOverflow;
      }, 5000);
      return;
    }

    if (window.location.search.indexOf("liff.state=") === -1) return;
    var el = document.createElement("div");
    el.id = "liff-splash";
    el.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:linear-gradient(to bottom,#ecfdf5,#ffffff,#ecfdf5);";
    el.innerHTML =
      '<div style="width:64px;height:64px;border-radius:9999px;background:#10b981;box-shadow:0 10px 25px -5px rgba(16,185,129,0.4);display:flex;align-items:center;justify-content:center;">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>' +
      "</div>" +
      '<div style="font-size:14px;font-weight:700;color:#047857;letter-spacing:0.02em;">${APP_TITLE}</div>' +
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
        <title>{APP_TITLE}</title>
        <meta name="title" content={APP_TITLE} />
        <meta name="application-name" content={APP_TITLE} />
        <meta name="apple-mobile-web-app-title" content={APP_TITLE} />
        <meta property="og:site_name" content={APP_TITLE} />
        <meta property="og:title" content={APP_TITLE} />
        <meta name="twitter:title" content={APP_TITLE} />
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
      </head>
      <body className="bg-gradient-to-b from-emerald-50 via-white to-emerald-50 min-h-screen">
        <LiffBootstrap />
        <LiffTransitionOverlay />
        <QueueLiveStatusLabel />
        <QueueMascotReference />
        <QueueClosedMascotFix />
        <QueueClosedFinalLayout />
        <QueueMascotOverflowFix />
        <QueueMascotDetailFix />
        <QueueSmallScreenFix />
        <QueueJoinAutoFocus />
        <TaskShareImageActionFix />
        <TaskModeTutorial />
        <TaskModeCopyFix />
        <TaskTabsScrollFix />
        <InnerHeaderShadow />
        <HeadcountCategoryQuantityFix />
        <HomeLoveNameReplay />
        <CategoryQuantityProxySignupHint />
        <CategoryMultiSignupFix />
        <CreateTaskOptionsEnhancement />
        <CreateTaskBannerCollapse />
        <TaskCategorySelectionMode />
        <EditTaskConfigMarkerFix />
        <TutorialCloseButtonFeedback />
        <CreateTaskLeaveGuard />
        <div className="w-full max-w-md mx-auto min-h-screen bg-white shadow-xl relative flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
