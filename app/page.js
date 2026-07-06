"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, PenLine, ChevronRight, MessageCircle, RotateCcw, LogIn } from "lucide-react";
import LoadingBubble from "@/components/LoadingBubble";
import OnboardingTour, {
  getOnboardingState,
  setOnboardingState,
  resetOnboarding,
} from "@/components/OnboardingTour";
import { useLineProfile } from "@/lib/useLineProfile";
import { avatarClass } from "@/lib/utils";

export default function HomePage() {
  const { profile, loading, login, error } = useLineProfile();
  const router = useRouter();

  // 首次操作教學導覽的起點：本機沒有任何進度標記代表第一次來，
  // 聚光燈指向「建立任務」按鈕。點進去之後，建立任務頁會接手
  // 後續步驟（那邊同樣是看到沒有標記就自動開始）。
  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    if (!profile) return; // 尚未用 LINE 登入，不顯示首次導覽
    if (getOnboardingState()) return;
    const t = setTimeout(() => setShowTour(true), 600);
    return () => clearTimeout(t);
  }, [profile]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="relative bg-emerald-500 text-white px-6 pt-12 pb-10 rounded-b-[2.5rem] shadow-md">
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
        <h1 className="text-3xl font-bold tracking-tight">接龍報名</h1>
        <p className="text-emerald-50 mt-2 text-sm leading-relaxed">
          像在聊天室接龍一樣，開一個任務，讓大家一則一則回覆完成報名。
        </p>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col gap-4">
        {loading ? (
          <LoadingBubble label="確認登入狀態中…" className="py-16" />
        ) : !profile ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 flex flex-col items-center text-center shadow-sm mt-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <LogIn size={26} />
            </div>
            <p className="font-semibold text-gray-800">使用前，請先用 LINE 登入</p>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              登入後即可建立任務、分享到群組、管理報名名單
            </p>
            <button
              onClick={login}
              className="mt-6 w-full bg-[#06C755] hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-full py-3.5 flex items-center justify-center gap-2 transition"
            >
              <MessageCircle size={18} /> 使用 LINE 登入
            </button>
            {error && <p className="text-xs text-rose-500 mt-3">{error}</p>}
          </div>
        ) : (
          <>
        <Link
          href="/my-tasks"
          className="group w-full bg-white border border-emerald-200 rounded-3xl p-5 flex items-center gap-4 text-left shadow-sm hover:shadow-md hover:border-emerald-300 transition"
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
          className="group w-full bg-white border border-gray-200 rounded-3xl p-5 flex items-center gap-4 text-left shadow-sm hover:shadow-md hover:border-emerald-300 transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
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
            className="group w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 text-left shadow-sm hover:shadow-md hover:border-emerald-300 transition"
          >
            <RotateCcw size={15} className="text-emerald-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">播放導覽教學</p>
              <p className="text-[11px] text-gray-400 mt-0.5">一步一步帶你建立任務並分享到 LINE</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-400 shrink-0" />
          </button>
        </div>
          </>
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
