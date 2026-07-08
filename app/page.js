"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, PenLine, ChevronRight, MessageCircle, RotateCcw } from "lucide-react";
import OnboardingTour, {
  getOnboardingState,
  setOnboardingState,
  resetOnboarding,
} from "@/components/OnboardingTour";
import FadeIn from "@/components/FadeIn";
import { useLineProfile } from "@/lib/useLineProfile";
import { avatarClass } from "@/lib/utils";

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

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div
        className={`relative bg-emerald-500 text-white px-6 pt-12 pb-10 rounded-b-[2.5rem] shadow-md transition-opacity duration-700 ${
          showLoadingCard ? "opacity-90" : "opacity-100"
        }`}
      >
        {profile && (
          <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-white/15 rounded-full pl-1 pr-2.5 py-1">
            <div className={`w-5 h-5 rounded-full ${avatarClass(profile.displayName)} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
              {profile.displayName?.[0] || "?"}
            </div>
            <span className="text-xs text-white/90 font-medium max-w-[80px] truncate">{profile.displayName}</span>
          </div>
        )}
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <MessageCircle size={28} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">接龍報名小助手</h1>
        <p className="text-emerald-50 mt-2 text-sm leading-relaxed">
          像在聊天室接龍一樣，開一個任務，讓大家一則一則回覆完成報名。
        </p>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col gap-4">
        {showLoadingCard ? (
          <div className="bg-white border border-gray-100 rounded-[1.75rem] p-7 flex flex-col items-center text-center shadow-sm mt-2 w-[85%] max-w-[320px] mx-auto">
            <div className="relative mb-5 flex items-center justify-center">
              <span className="login-pulse-ring absolute rounded-full border border-emerald-300/60" aria-hidden="true" />
              <span className="login-pulse-ring login-pulse-ring-delay absolute rounded-full border border-emerald-300/40" aria-hidden="true" />
              <div className="login-logo-breathe relative z-10 w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                <MessageCircle size={24} />
              </div>
            </div>
            <div className="flex gap-2 mt-1" aria-label="正在登入">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    activeDot === i ? "bg-emerald-500 scale-110 opacity-100" : "bg-emerald-200 scale-90 opacity-70"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 tracking-wide">
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
        <Link
          href="/my-tasks"
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
        </Link>

        <Link
          href="/create"
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
        </Link>

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
              <p className="text-sm font-semibold text-gray-800">播放導覽教學</p>
              <p className="text-[11px] text-gray-400 mt-0.5">一步一步帶你建立任務並分享到 LINE</p>
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
              title: "從這裡開始",
              text: "點「建立任務」，我們一步一步帶你建立第一個任務，並分享到 LINE 群組。",
            },
          ]}
          finishLabel="好，前往建立任務"
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
