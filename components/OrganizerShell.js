"use client";
import { usePathname } from "next/navigation";
import { LogIn, MessageCircle } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import OrganizerTabs from "@/components/OrganizerTabs";
import LoadingBubble from "@/components/LoadingBubble";
import FadeIn from "@/components/FadeIn";
import { useLineProfile } from "@/lib/useLineProfile";
import { avatarClass } from "@/lib/utils";
import OrganizerContext from "@/lib/OrganizerContext";

// This shell is rendered once by app/(organizer)/layout.js and wraps both
// /create and /my-tasks. Because it lives at the shared-layout level (not
// inside either page individually), Next.js keeps this component mounted
// across navigation between the two routes — the TopBar and the sliding
// tab indicator never unmount/remount, so switching tabs never flashes.
// Only {children} (the actual per-page content) swaps out, wrapped in
// FadeIn so that swap itself still feels soft instead of an abrupt cut.
export default function OrganizerShell({ children }) {
  const pathname = usePathname();
  const { profile, loading, error, login } = useLineProfile();
  const isTasks = pathname?.startsWith("/my-tasks");
  const title = isTasks ? "任務清單" : "建立任務";

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title={title} backHref="/" />
        <div className="flex-1 flex items-center justify-center">
          <LoadingBubble />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title={title} backHref="/" />
        <div className="flex-1 px-6 py-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
            <MessageCircle size={34} />
          </div>
          <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
            {isTasks ? (
              <>請先使用 LINE 登入，<br />才能查看你建立的任務。</>
            ) : (
              <>建立任務前，請先使用 LINE 登入，<br />這樣才能管理你建立的任務。</>
            )}
          </p>
          {error && <p className="text-xs text-rose-500 mb-4">{error}</p>}
          <button
            onClick={login}
            className="w-full bg-emerald-500 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition"
          >
            <LogIn size={18} /> 使用 LINE 登入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative min-w-0">
      <TopBar
        title={title}
        backHref="/"
        right={
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full pl-1 pr-2.5 py-1">
            <div className={`w-5 h-5 rounded-full ${avatarClass(profile.displayName)} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
              {profile.displayName?.[0] || "?"}
            </div>
            <span className="text-xs text-white/90 font-medium max-w-[80px] truncate">{profile.displayName}</span>
          </div>
        }
      />
      <OrganizerTabs current={isTasks ? "tasks" : "new"} />
      <OrganizerContext.Provider value={profile}>
        <FadeIn key={pathname} className="flex-1 flex flex-col min-w-0">
          {children}
        </FadeIn>
      </OrganizerContext.Provider>
    </div>
  );
}
