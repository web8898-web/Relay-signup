"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Share2, Copy } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import TaskShareCard from "@/components/TaskShareCard";
import LoadingBubble from "@/components/LoadingBubble";
import FadeIn from "@/components/FadeIn";
import { supabase } from "@/lib/supabaseClient";
import { buildShareText, lineShareUrl, buildFlexMessage } from "@/lib/utils";
import { liff } from "@/lib/liff";

export default function ShareTaskPage() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [signupCount, setSignupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tasks").select("*").eq("id", id).single();
      setTask(data || null);
      const { count } = await supabase
        .from("signups")
        .select("id", { count: "exact", head: true })
        .eq("task_id", id);
      setSignupCount(count || 0);
      setLoading(false);
    })();
  }, [id]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }

  function taskUrl() {
    return `${window.location.origin}/tasks/${id}`;
  }

  // Every task gets a short_code at creation time, so the share link is
  // always short and doesn't depend on any external shortening service.
  function shareUrl() {
    if (task?.short_code) return `${window.location.origin}/s/${task.short_code}`;
    return taskUrl();
  }

  const [sharing, setSharing] = useState(false);

  async function handleLineShare() {
    if (!task) return;
    const url = shareUrl();
    // This is purely a short tap-feedback state, not tied to when the LINE
    // share sheet's own promise actually resolves — that timing is
    // unreliable (the browser tab can be suspended while the native share
    // UI is open, so the promise sometimes only resolves well after the
    // person has already come back to this page), which is what caused
    // "開啟中" to flash again on return.
    setSharing(true);
    setTimeout(() => setSharing(false), 800);
    try {
      if (liff.isApiAvailable && liff.isApiAvailable("shareTargetPicker")) {
        const flexMessage = buildFlexMessage(task, url);
        await liff.shareTargetPicker([flexMessage]);
        showToast("已開啟分享選單");
        return;
      }
    } catch (e) {
      showToast("卡片分享失敗，改用文字分享");
    }
    const text = buildShareText(task, url);
    window.open(lineShareUrl(text), "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    if (!task) return;
    const url = shareUrl();
    const text = buildShareText(task, url);
    try {
      await navigator.clipboard.writeText(text);
      showToast("已複製訊息文字");
    } catch (e) {
      showToast("複製失敗，請手動選取文字");
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="分享任務" onBack={() => router.push("/my-tasks")} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingBubble />
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <FadeIn className="flex-1 flex flex-col relative min-w-0">
      <TopBar title="分享任務" onBack={() => router.push("/my-tasks")} />
      <div className="flex-1 px-5 py-5 overflow-y-auto">
        <p className="text-xs text-gray-400 mb-3 text-center">這是分享到 LINE 群組時，成員會看到的卡片樣式</p>
        <TaskShareCard
          task={task}
          signupCount={signupCount}
          previewOnly
          onPreviewTap={() =>
            showToast(
              <>
                <span className="block whitespace-nowrap">這是預覽卡片，內容確認無誤後，</span>
                <span className="block whitespace-nowrap">請點擊下方「分享到 LINE」即可分享。</span>
              </>
            )
          }
        />

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleLineShare}
            disabled={sharing}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 active:scale-[0.97] disabled:opacity-80 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition"
          >
            {sharing ? (
              <>
                開啟中
                <span className="flex gap-1 ml-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                </span>
              </>
            ) : (
              <>
                <Share2 size={17} /> 分享到 LINE
              </>
            )}
          </button>
          <button
            onClick={handleCopy}
            className="w-full border border-gray-200 text-gray-600 rounded-full py-3 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition"
          >
            <Copy size={16} /> 複製訊息文字
          </button>
        </div>

        <p className="text-[11px] text-gray-300 text-center mt-4 leading-relaxed px-2 break-all">
          報名連結：{shareUrl()}
        </p>
      </div>

      <div className="px-5 pb-6 pt-2">
        <button
          onClick={() => router.push("/my-tasks")}
          className="w-full border border-gray-200 text-gray-600 rounded-full py-3 font-semibold hover:bg-gray-50 transition"
        >
          回到任務清單
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-sm px-4 py-2.5 rounded-2xl shadow-lg z-50 max-w-[92%] flex items-center justify-center text-center leading-relaxed">
          {toast}
        </div>
      )}
    </FadeIn>
  );
}
