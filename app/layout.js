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
      var paramsForLanguage = new URLSearchParams(window.location.search);
      var requestedLanguage = paramsForLanguage.get("lang");
      if (requestedLanguage === "en" || requestedLanguage === "zh") {
        language = requestedLanguage;
        localStorage.setItem("relay_home_language", language);
      } else {
        language = localStorage.getItem("relay_home_language") === "en" ? "en" : "zh";
      }
    } catch (languageError) {}
    var displayTitle = language === "en" ? "Relay Signup Assistant" : "${APP_TITLE}";
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
      launch.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100dvh;z-index:2147483647;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#10b981;opacity:1;transform:translateZ(0);transition:opacity 260ms ease;";
      launch.innerHTML = '<div style="text-align:center;color:white"><div style="font-size:36px;font-weight:800">' + displayTitle + '</div><div style="margin-top:12px;font-size:14px;opacity:.82">' + (language === "en" ? 'Relay signups made simple' : '把接龍，變簡單') + '</div></div>';
      document.documentElement.appendChild(launch);
      window.setTimeout(function(){ launch.style.opacity='0'; }, 2300);
      window.setTimeout(function(){ launch.remove(); document.documentElement.style.overflow=previousOverflow; }, 2700);
    };
    var isInternalHomeReturn = false;
    try { isInternalHomeReturn = window.sessionStorage.getItem("relay_home_return_expand") === "1"; } catch (e) {}
    if (window.location.pathname === "/" && !isInternalHomeReturn) window.__relayShowLaunchSplash();
  } catch (e) {}
})();`;

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
