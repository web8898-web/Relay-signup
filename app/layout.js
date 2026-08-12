import "./globals.css";
import "./task-card-actions.css";
import "./love-layer-fix.css";
import "./login-love-visibility.css";
import "./save-button-spinner-fix.css";
import LiffBootstrap from "@/components/LiffBootstrap";
import LiffTransitionOverlay from "@/components/LiffTransitionOverlay";
import GlobalLocaleBridge from "@/components/GlobalLocaleBridge";
import QueueLiveStatusLabel from "@/components/QueueLiveStatusLabel";
import QueueMascotReference from "@/components/QueueMascotReference";
import QueuePrivateMascotBridge from "@/components/QueuePrivateMascotBridge";
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
  title: { default: APP_TITLE, template: `%s｜${APP_TITLE}` },
  description: APP_DESCRIPTION,
  applicationName: APP_TITLE,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: APP_TITLE, statusBarStyle: "default" },
  openGraph: { type: "website", siteName: APP_TITLE, title: APP_TITLE, description: APP_DESCRIPTION, url: "https://relay-signup.vercel.app" },
  twitter: { card: "summary", title: APP_TITLE, description: APP_DESCRIPTION },
};

export const viewport = { themeColor: "#10B981" };

const antiFlashScript = `
(function () {
  try {
    var language = "zh";
    try {
      var languageParams = new URLSearchParams(window.location.search);
      var requestedLanguage = languageParams.get("lang");
      if (requestedLanguage === "en" || requestedLanguage === "zh") {
        language = requestedLanguage;
        localStorage.setItem("relay_home_language", language);
      } else {
        language = localStorage.getItem("relay_home_language") === "en" ? "en" : "zh";
      }
    } catch (languageError) {}

    var displayTitle = language === "en" ? "Relay Signup Assistant" : "${APP_TITLE}";
    var displaySubtitle = language === "en" ? "Relay signups made simple" : "把接龍，變簡單";
    document.documentElement.lang = language === "en" ? "en" : "zh-Hant";
    document.documentElement.setAttribute("data-relay-language", language);
    document.title = displayTitle;
    var titleTag = document.querySelector("title");
    if (titleTag) titleTag.textContent = displayTitle;

    window.__relayShowLaunchSplash = function () {
      if (document.getElementById("app-launch-splash")) return;

      var previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";

      var launch = document.createElement("div");
      launch.id = "app-launch-splash";
      launch.setAttribute("aria-label", displayTitle);
      launch.style.cssText =
        "position:fixed;top:0;left:0;right:auto;bottom:auto;width:100vw;height:100dvh;min-height:100%;z-index:2147483647;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#10b981;border-radius:0;box-shadow:none;opacity:1;transform:translateZ(0);transition:top 620ms cubic-bezier(.22,1,.36,1),left 620ms cubic-bezier(.22,1,.36,1),width 620ms cubic-bezier(.22,1,.36,1),height 620ms cubic-bezier(.22,1,.36,1),border-radius 620ms cubic-bezier(.22,1,.36,1),box-shadow 620ms cubic-bezier(.22,1,.36,1),opacity 260ms ease;";

      launch.innerHTML =
        '<style>' +
        '@keyframes relayLaunchLogo{0%{opacity:0;transform:translate3d(0,18px,0) scale(.72) rotate(-6deg)}70%{opacity:1;transform:translate3d(0,-2px,0) scale(1.04) rotate(1deg)}100%{opacity:1;transform:translate3d(0,0,0) scale(1) rotate(0)}}' +
        '@keyframes relayLaunchTitle{0%{opacity:0;transform:translate3d(0,14px,0)}100%{opacity:1;transform:translate3d(0,0,0)}}' +
        '@keyframes relayLaunchDot{0%,100%{opacity:.28;transform:scale(.82)}45%{opacity:1;transform:scale(1.15)}}' +
        '.relay-launch-wrap{position:absolute;left:50%;top:50%;width:min(88vw,390px);display:flex;flex-direction:column;align-items:center;text-align:center;color:#fff;transform:translate3d(-50%,-52%,0);transform-origin:center;opacity:1;transition:opacity 300ms ease,transform 620ms cubic-bezier(.22,1,.36,1)}' +
        '.relay-launch-logo-wrap{width:96px;height:96px;display:flex;align-items:center;justify-content:center;animation:relayLaunchLogo 620ms cubic-bezier(.16,1,.3,1) 100ms both}' +
        '.relay-launch-logo{width:78px;height:78px;display:block}' +
        '.relay-launch-title{margin-top:20px;font-size:clamp(29px,7.5vw,38px);font-weight:800;letter-spacing:-.04em;line-height:1.12;white-space:nowrap;animation:relayLaunchTitle 440ms cubic-bezier(.22,.8,.3,1) 600ms both}' +
        '.relay-launch-title-en{font-size:clamp(25px,6.5vw,34px)}' +
        '.relay-launch-subtitle{margin-top:13px;font-size:14px;font-weight:600;letter-spacing:.08em;color:rgba(255,255,255,.82);animation:relayLaunchTitle 400ms ease-out 820ms both}' +
        '.relay-launch-dots{margin-top:48px;display:flex;align-items:center;gap:11px;opacity:1;transition:opacity 180ms ease}' +
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
          '<div class="relay-launch-title' + (language === "en" ? ' relay-launch-title-en' : '') + '">' + displayTitle + '</div>' +
          '<div class="relay-launch-subtitle">' + displaySubtitle + '</div>' +
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

      function morphIntoHomeHero(attempt) {
        var hero = findHomeHero();
        if (!hero && attempt < 5) {
          window.setTimeout(function () { morphIntoHomeHero(attempt + 1); }, 90);
          return;
        }
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

      window.setTimeout(function () { morphIntoHomeHero(0); }, 1950);
      window.setTimeout(function () { launch.classList.add("relay-launch-fade"); }, 2680);
      window.setTimeout(function () {
        launch.remove();
        document.documentElement.style.overflow = previousOverflow;
      }, 3000);
    };

    var isInternalHomeReturn = false;
    var isDeepLinkDestination = false;
    try {
      isInternalHomeReturn = window.sessionStorage.getItem("relay_home_return_expand") === "1";
      var params = new URLSearchParams(window.location.search);
      var rawLiffState = params.get("liff.state");
      if (!rawLiffState && window.location.hash.indexOf("liff.state=") !== -1) {
        rawLiffState = new URLSearchParams(window.location.hash.slice(1)).get("liff.state");
      }
      if (rawLiffState) {
        var decodedState = rawLiffState;
        for (var decodeCount = 0; decodeCount < 2; decodeCount += 1) {
          try {
            var nextState = decodeURIComponent(decodedState);
            if (nextState === decodedState) break;
            decodedState = nextState;
          } catch (decodeError) { break; }
        }
        var targetUrl = new URL(decodedState || "/", window.location.origin);
        isDeepLinkDestination = targetUrl.pathname !== "/";
      }
      if (!isDeepLinkDestination) {
        var redirectRaw = window.sessionStorage.getItem("liff-redirect-after-login");
        if (redirectRaw) {
          try {
            var redirectData = JSON.parse(redirectRaw);
            var redirectPath = String(redirectData.path || "");
            isDeepLinkDestination = redirectPath && new URL(redirectPath, window.location.origin).pathname !== "/";
          } catch (redirectError) {}
        }
      }
    } catch (e) {}

    if (window.location.pathname === "/" && !isInternalHomeReturn && !isDeepLinkDestination) {
      window.__relayShowLaunchSplash();
      return;
    }

    if (window.location.search.indexOf("liff.state=") === -1) return;
    var el = document.createElement("div");
    el.id = "liff-splash";
    el.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:linear-gradient(to bottom,#ecfdf5,#ffffff,#ecfdf5);";
    el.innerHTML =
      '<div style="width:64px;height:64px;border-radius:9999px;background:#10b981;box-shadow:0 10px 25px -5px rgba(16,185,129,0.4);display:flex;align-items:center;justify-content:center;">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>' +
      '</div>' +
      '<div style="font-size:14px;font-weight:700;color:#047857;letter-spacing:0.02em;">' + displayTitle + '</div>' +
      '<div style="display:flex;gap:6px;"><span style="width:8px;height:8px;border-radius:9999px;background:#34d399;"></span><span style="width:8px;height:8px;border-radius:9999px;background:#34d399;opacity:.55;"></span><span style="width:8px;height:8px;border-radius:9999px;background:#34d399;opacity:.35;"></span></div>';
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
        <GlobalLocaleBridge />
        <QueueLiveStatusLabel />
        <QueueMascotReference />
        <QueuePrivateMascotBridge />
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
        <div className="w-full max-w-md mx-auto min-h-screen bg-white shadow-xl relative flex flex-col">{children}</div>
      </body>
    </html>
  );
}
