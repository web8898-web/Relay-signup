"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, PenLine, ChevronRight, MessageCircle, RotateCcw } from "lucide-react";
import OnboardingTour, {
  getOnboardingState,
  setOnboardingState,
  resetOnboarding,
} from "@/components/OnboardingTour";
import FadeIn from "@/components/FadeIn";
import { useLineProfile } from "@/lib/useLineProfile";
import { avatarClass } from "@/lib/utils";

const HOME_RETURN_ANIMATION_KEY = "relay_home_return_expand";

function shouldPlayHomeReturnAnimation() {
  if (typeof window === "undefined") return false;
  try {
    const shouldPlay = sessionStorage.getItem(HOME_RETURN_ANIMATION_KEY) === "1";
    if (shouldPlay) sessionStorage.removeItem(HOME_RETURN_ANIMATION_KEY);
    return shouldPlay;
  } catch (e) {
    return false;
  }
}

export default function HomePage() {
  const { profile, loading, login, error } = useLineProfile();
  const router = useRouter();

  // 第一次進站保留完整首頁＋登入動畫 1.5 秒，建立產品記憶點；
  // 同一個瀏覽分頁已確認登入，或這台裝置曾看過首頁登入動畫，就跳過等待，
  // 讓回訪使用者接近「秒進」。
  const SESSION_AUTHED = "relay_session_authed";
  const SEEN_LOGIN_ANIMATION = "relay_seen_login_animation";
  const [minWaitDone, setMinWaitDone] = useState(false);
  const [sessionAuthed, setSessionAuthed] = useState(false);
  const [transitionTo, setTransitionTo] = useState(null);
  const [returnExpanding, setReturnExpanding] = useState(() => shouldPlayHomeReturnAnimation());

  useEffect(() => {
    if (!returnExpanding) return;
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setReturnExpanding(false));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [returnExpanding]);

  useEffect(() => {
    let authed = false;
    let seenLoginAnimation = false;
    try {
      authed = sessionStorage.getItem(SESSION_AUTHED) === "1";
      seenLoginAnimation = localStorage.getItem(SEEN_LOGIN_ANIMATION) === "1";
    } catch (e) {}
    if (authed || seenLoginAnimation) {
      setSessionAuthed(authed);
      setMinWaitDone(true);
      return;
    }
    const t = setTimeout(() => {
      setMinWaitDone(true);
      try {
        localStorage.setItem(SEEN_LOGIN_ANIMATION, "1");
      } catch (e) {}
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // 登入確認完成後做個記號（只存在目前的瀏覽分頁，關閉即清除），
  // 之後在同一次使用中回到首頁就不必重看等待畫面
  useEffect(() => {
    if (!profile) return;
    try {
      sessionStorage.setItem(SESSION_AUTHED, "1");
      localStorage.setItem(SEEN_LOGIN_ANIMATION, "1");
    } catch (e) {}
  }, [profile]);

  const [showTour, setShowTour] = useState(false);

  // 登入動畫點點：● ○ ○ → ○ ● ○ → ○ ○ ●，比單純跳動更安定。
  const [activeDot, setActiveDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setActiveDot((n) => (n + 1) % 3);
    }, 360);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!profile) return; // 尚未用 LINE 登入，不顯示首次導覽
    if (getOnboardingState()) return;
    const t = setTimeout(() => setShowTour(true), 600);
    return () => clearTimeout(t);
  }, [profile]);

  const showLoadingCard = (loading || !minWaitDone) && !sessionAuthed;
  const isTransitioning = !!transitionTo;
  const heroCollapsed = isTransitioning || returnExpanding;
  const contentHiddenForMorph = isTransitioning || returnExpanding;
  const transitionTitle = transitionTo === "/create" ? "建立任務" : transitionTo === "/my-tasks" ? "任務清單" : "接龍報名小助手";

  function navigateWithHeroCollapse(path) {
    if (isTransitioning) return;
    setTransitionTo(path);
    setTimeout(() => router.push(path), 560);
  }

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${isTransitioning ? "pointer-events-none" : ""}`}>
      <div
        className={`relative bg-emerald-500 text-white shadow-md overflow-hidden transform-gpu will-change-[height,border-radius,transform,opacity] transition-[height,min-height,padding,border-radius,box-shadow,opacity] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          heroCollapsed
            ? "px-4 py-4 rounded-b-none h-[56px] min-h-[56px]"
            : "px-6 pt-12 pb-10 rounded-b-[2.5rem] h-[276px] min-h-[276px]"
        } ${showLoadingCard ? "opacity-90" : "opacity-100"}`}
      >
        <div
          className={`absolute inset-0 px-4 py-4 flex items-center gap-3 transform-gpu will-change-transform transition-[opacity,transform] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            heroCollapsed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <ArrowLeft size={20} className="text-white/90 shrink-0" />
          <p className="font-bold flex-1 truncate">{transitionTitle}</p>
          {profile && (
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full pl-1 pr-2.5 py-1 shrink-0">
              <div className={`w-5 h-5 rounded-full ${avatarClass(profile.displayName)} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                {profile.displayName?.[0] || "?"}
              </div>
              <span className="text-xs text-white/90 font-medium max-w-[80px] truncate">{profile.displayName}</span>
            </div>
          )}
        </div>

        {profile && (
          <div
            className={`absolute top-5 right-5 flex items-center gap-1.5 bg-white/15 rounded-full pl-1 pr-2.5 py-1 transform-gpu will-change-transform transition-[opacity,transform] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              heroCollapsed ? "opacity-0 -translate-y-5 scale-95" : "opacity-100 translate-y-0 scale-100"
            }`}
          >
            <div className={`w-5 h-5 rounded-full ${avatarClass(profile.displayName)} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
              {profile.displayName?.[0] || "?"}
            </div>
            <span className="text-xs text-white/90 font-medium max-w-[80px] truncate">{profile.displayName}</span>
          </div>
        )}
        <div
          className={`transform-gpu origin-top-left will-change-transform transition-[opacity,transform] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            heroCollapsed ? "opacity-0 -translate-y-8 scale-[0.96]" : "opacity-100 translate-y-0 scale-100"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
            <MessageCircle size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">接龍報名小助手</h1>
          <p className="text-emerald-50 mt-2 text-sm leading-relaxed">
            像在聊天室接龍一樣，開一個任務，讓大家一則一則回覆完成報名。
          </p>
        </div>
      </div>

      <div
        className={`flex-1 px-6 py-8 flex flex-col gap-4 transform-gpu will-change-transform transition-[opacity,transform] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          contentHiddenForMorph ? "opacity-0 -translate-y-6" : "opacity-100 translate-y-0"
        }`}
      >
        {showLoadingCard ? (
          <div className="login-card-enter mt-5 flex flex-col items-center text-center mx-auto">
            <div className="relative mb-4 flex items-center justify-center w-24 h-24">
              <span className="login-pulse-ring absolute rounded-full border border-emerald-300/40" aria-hidden="true" />
              <span className="login-pulse-ring login-pulse-ring-delay absolute rounded-full border border-emerald-300/25" aria-hidden="true" />
              <div className="login-logo-breathe relative z-10 w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                <MessageCircle size={24} />
              </div>
            </div>
            <div className="flex gap-2 mt-0.5" aria-label="正在登入">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeDot === i ? "bg-emerald-500 scale-110 opacity-100" : "bg-emerald-200 scale-90 opacity-70"
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2.5 tracking-wide">
              正在登入<span className="text-emerald-400">•••</span>
            </p>
          </div>
        ) : loading ? null : !profile ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-8 flex flex-col items-center text-center shadow-sm mt-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 mb-5">
              <MessageCircle size={24} />
            </div>
            <p className="font-semibold text-gray-800">使用前，請先用 LINE 登入</p>
            <p className="text-xs text-gray-400 mt-1.5 whitespace-nowrap">
              登入後即可建立任務、管理報名名單
            </p>
            <button
              onClick={login}
              className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold rounded-full py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition"
            >
              使用 LINE 登入
            </button>
            {error && <p className="text-xs text-rose-500 mt-3">{error}</p>}
          </div>
        ) : (
          <FadeIn className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => navigateWithHeroCollapse("/my-tasks")}
              className="group w-full bg-white border border-gray-200 rounded-3xl p-5 flex items-center gap-4 text-left shadow-sm hover:shadow-md hover:border-emerald-300 active:scale-[0.98] active:border-emerald-400 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ClipboardList size={22} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">任務清單</p>
                <p className="text-xs text-gray-400 mt-0.5">{profile ? "管理你建立的任務" : "使用前，請先用 LINE 登入"}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() => navigateWithHeroCollapse("/create")}
              data-tour="create-entry"
              className="group w-full bg-white border border-gray-200 rounded-3xl p-5 flex items-center gap-4 text-left shadow-sm hover:shadow-md hover:border-emerald-300 active:scale-[0.98] active:border-emerald-400 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <PenLine size={22} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">建立任務</p>
                <p className="text-xs text-gray-400 mt-0.5">{profile ? "建立任務並分享到群組" : "使用前，請先用 LINE 登入"}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-400" />
            </button>

            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-400 mb-2 px-1">使用教學</p>
              <button
                onClick={() => {
                  // 清掉本機的教學進度標記，並立刻從首頁重新開始導覽
                  resetOnboarding();
                  setShowTour(true);
                }}
                className="group w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 text-left shadow-sm hover:shadow-md hover:border-emerald-300 active:scale-[0.98] active:border-emerald-400 transition"
              >
                <RotateCcw size={15} className="text-emerald-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">播放建立任務教學</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">示範基本欄位，進階設定有需要再展開</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-400 shrink-0" />
              </button>
            </div>
          </FadeIn>
        )}

        <div className="mt-auto text-center text-[11px] text-gray-300 pt-8">
          © 2026{" "}
          <a
            href="https://www.wiweb.com.tw"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 transition"
          >
            豐碩企業有限公司
          </a>{" "}
          版權所有
        </div>
      </div>

      {showTour && (
        <OnboardingTour
          steps={[
            {
              target: "create-entry",
              tapTarget: true,
              title: "先建立第一個任務",
              text: "點「建立任務」後，照著基本欄位填寫就能完成。分類、數量單位已放在進階設定，有需要再展開。",
            },
          ]}
          finishLabel="好，開始建立"
          onFinish={() => {
            // 不寫入任何標記，維持「還沒看過」的狀態，
            // 建立任務頁載入時就會自動接續後面的導覽步驟。
            setShowTour(false);
            router.push("/create");
          }}
          onSkip={() => {
            setOnboardingState("done");
            setShowTour(false);
          }}
        />
      )}
    </div>
  );
}
