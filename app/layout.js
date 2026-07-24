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

    window.__relayShowLaunchSplash = function () {
      if (document.getElementById("app-launch-splash")) return;

      var previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";

      var launch = document.createElement("div");
      launch.id = "app-launch-splash";
      launch.setAttribute("aria-label", "${APP_TITLE} 啟動畫面");
      launch.style.cssText =
        "position:fixed;top:0;left:0;right:auto;bottom:auto;width:100vw;height:100dvh;min-height:100%;z-index:2147483647;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#10b981;border-radius:0;box-shadow:none;opacity:1;transform:translateZ(0);transition:top 620ms cubic-bezier(.22,1,.36,1),left 620ms cubic-bezier(.22,1,.36,1),width 620ms cubic-bezier(.22,1,.36,1),height 620ms cubic-bezier(.22,1,.36,1),border-radius 620ms cubic-bezier(.22,1,.36,1),box-shadow 620ms cubic-bezier(.22,1,.36,1),opacity 260ms ease;";
      launch.innerHTML =
        '<style>' +
        '@keyframes relayLaunchLogo{0%{opacity:0;transform:translate3d(0,14px,0) scale(.78)}72%{opacity:1;transform:translate3d(0,-1px,0) scale(1.025)}100%{opacity:1;transform:translate3d(0,0,0) scale(1)}}' +
        '@keyframes relayLaunchTitle{0%{opacity:0;transform:translate3d(0,12px,0)}100%{opacity:1;transform:translate3d(0,0,0)}}' +
        '@keyframes relayLaunchDot{0%,100%{opacity:.34;transform:scale(.86)}45%{opacity:1;transform:scale(1.12)}}' +
        '.relay-launch-wrap{position:absolute;left:50%;top:50%;width:min(86vw,380px);display:flex;flex-direction:column;align-items:center;text-align:center;color:#fff;transform:translate3d(-50%,-52%,0);transform-origin:center;opacity:1;transition:opacity 300ms ease,transform 620ms cubic-bezier(.22,1,.36,1)}' +
        '.relay-launch-logo-wrap{width:92px;height:92px;display:flex;align-items:center;justify-content:center;animation:relayLaunchLogo 560ms cubic-bezier(.16,1,.3,1) 120ms both}' +
        '.relay-launch-logo{width:74px;height:74px;display:block}' +
        '.relay-launch-title{margin-top:20px;font-size:clamp(29px,7.7vw,38px);font-weight:800;letter-spacing:-.04em;line-height:1.1;white-space:nowrap;animation:relayLaunchTitle 440ms cubic-bezier(.22,.8,.3,1) 620ms both}' +
        '.relay-launch-subtitle{margin-top:12px;font-size:14px;font-weight:600;letter-spacing:.08em;color:rgba(255,255,255,.82);animation:relayLaunchTitle 400ms ease-out 860ms both}' +
        '.relay-launch-dots{margin-top:52px;display:flex;align-items:center;gap:11px;opacity:1;transition:opacity 180ms ease}' +
        '.relay-launch-dot{width:9px;height:9px;border-radius:9999px;background:#fff;animation:relayLaunchDot 820ms ease-in-out infinite}' +
        '.relay-launch-dot:nth-child(2){animation-delay:140ms}.relay-launch-dot:nth-child(3){animation-delay:280ms}' +
        '#app-launch-splash.relay-launch-handoff .relay-launch-wrap{opacity:0;transform:translate3d(-50%,-58%,0) scale(.9)}' +
        '#app-launch-splash.relay-launch-handoff .relay-launch-dots{opacity:0}' +
        '#app-launch-splash.relay-launch-fade{opacity:0!important;pointer-events:none}' +
        '@media(prefers-reduced-motion:reduce){.relay-launch-logo-wrap,.relay-launch-title,.relay-launch-subtitle,.relay-launch-dot{animation-duration:1ms!important;animation-delay:0ms!important}.relay-launch-wrap,#app-launch-splash{transition-duration:1ms!important}}' +
        '</style>' +
        '<div class="relay-launch-wrap">' +
          '<div class="relay-launch-logo-wrap">' +
            '<svg class="relay-launch-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
              '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" stroke="white" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
          '</div>' +
          '<div class="relay-launch-title">${APP_TITLE}</div>' +
          '<div class="relay-launch-subtitle">把接龍，變簡單</div>' +
          '<div class="relay-launch-dots"><span class="relay-launch-dot"></span><span class="relay-launch-dot"></span><span class="relay-launch-dot"></span></div>' +
        '</div>';

      document.documentElement.appendChild(launch);

      function findHomeHero() {
        var candidates = document.querySelectorAll(".bg-emerald-500.text-white");
        for (var i = 0; i < candidates.length; i += 1) {
          var rect = candidates[i].getBoundingClientRect();
          if (rect.width > 280 && rect.height > 220 && rect.top >= -2) return candidates[i];
        }
        return null;
      }

      function morphIntoHomeHero() {
        var hero = findHomeHero();
        if (!hero) {
          launch.classList.add("relay-launch-fade");
          return;
        }

        var rect = hero.getBoundingClientRect();
        var style = window.getComputedStyle(hero);
        launch.classList.add("relay-launch-handoff");
        launch.style.top = rect.top + "px";
        launch.style.left = rect.left + "px";
        launch.style.width = rect.width + "px";
        launch.style.height = rect.height + "px";
        launch.style.minHeight = "0";
        launch.style.borderRadius = style.borderRadius || "0 0 40px 40px";
        launch.style.boxShadow = style.boxShadow || "0 4px 6px rgba(0,0,0,.12)";
      }

      window.setTimeout(morphIntoHomeHero, 2050);

      window.setTimeout(function () {
        launch.classList.add("relay-launch-fade");
      }, 2700);

      window.setTimeout(function () {
        launch.remove();
        document.documentElement.style.overflow = previousOverflow;
      }, 3000);
    };

    var isInternalHomeReturn = false;
    try {
      isInternalHomeReturn = window.sessionStorage.getItem("relay_home_return_expand") === "1";
    } catch (e) {}

    if (window.location.pathname === "/" && !isInternalHomeReturn) {
      window.__relayShowLaunchSplash();
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
