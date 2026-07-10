"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Share2, Copy, ArrowLeft, CheckCircle2, Eye, Sparkles } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import TaskShareCard from "@/components/TaskShareCard";
import TaskShareImagePanel from "@/components/TaskShareImagePanel";
import LoadingBubble from "@/components/LoadingBubble";
import FadeIn from "@/components/FadeIn";
import Toast from "@/components/Toast";
import OnboardingTour, {
  getOnboardingState,
  setOnboardingState,
} from "@/components/OnboardingTour";
import { supabase } from "@/lib/supabaseClient";
import { buildShareText, lineShareUrl, buildFlexMessage, isQueueTask } from "@/lib/utils";
import { liff } from "@/lib/liff";

export default function ShareTaskPage() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [signupCount, setSignupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef(null);

  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    if (loading || !task) return;
    if (getOnboardingState() !== "pending-share") return;
    const t = setTimeout(() => setShowTour(true), 500);
    return () => clearTimeout(t);
  }, [loading, task]);

  function finishTour() {
    setOnboardingState("done");
    setShowTour(false);
  }

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
    setTimeout(() => setToast(""), 5200);
  }

  function taskUrl() {
    const url = new URL(`${window.location.origin}/tasks/${id}`);
    if (isQueueTask(task)) url.searchParams.set("queue", "1");
    return url.toString();
  }

  function shareUrl() {
    const base = task?.short_code ? `${window.location.origin}/s/${task.short_code}` : `${window.location.origin}/tasks/${id}`;
    const url = new URL(base);
    if (isQueueTask(task)) url.searchParams.set("queue", "1");
    return url.toString();
  }

  function handlePreviewToggle() {
    if (showPreview) {
      setShowPreview(false);
      return;
    }

    setShowPreview(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  async function handleLineShare() {
    if (!task) return;
    if (showTour) finishTour();
    const url = shareUrl();
    setSharing(true);
    setTimeout(() => setSharing(false), 800);
    setTimeout(() => setShared(true), 900);
    try {
      if (liff.isApiAvailable && liff.isApiAvailable("shareTargetPicker")) {
        const flexMessage = buildFlexMessage(task, url);
        await liff.shareTargetPicker([flexMessage]);
        showToast("分享已送出");
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
      showToast("已複製分享文字");
    } catch (e) {
      showToast("複製失敗，請手動選取文字");
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="建立完成" onBack={() => router.push("/my-tasks")} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingBubble />
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="flex-1 flex flex-col relative min-w-0">
      <TopBar title="建立完成" onBack={() => router.push("/my-tasks")} />
      <FadeIn className="flex-1 px-5 py-5 overflow-y-auto">
        <div className="flex flex-col items-center text-center pt-2">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-4 transition-all duration-500 ${shared ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-emerald-50 text-emerald-500 shadow-emerald-100"}`}>
            {shared ? <Sparkles size={34} /> : <CheckCircle2 size={38} strokeWidth={2.4} />}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            {shared ? "已分享成功！" : "任務建立成功！"}
          </h1>
          <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
            {shared ? "接下來就等大家開始報名吧。" : "你的接龍已建立完成，下一步分享到 LINE 群組。"}
          </p>
        </div>

        <div className="mt-6 bg-white border border-gray-100 rounded-[28px] p-5 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.45)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-semibold text-emerald-600 mb-1">接龍任務</p>
              <h2 className="text-lg font-bold text-gray-800 truncate">{task.title}</h2>
              <p className="text-xs text-gray-400 mt-1">{task.start_date} ~ {task.end_date}</p>
            </div>
            <div className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold">
              {signupCount} 人{isQueueTask(task) ? "排隊" : "報名"}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <button
              data-tour="line-share"
              onClick={handleLineShare}
              disabled={sharing}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 active:scale-[0.97] disabled:opacity-80 text-white rounded-full py-3.5 font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition"
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

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePreviewToggle}
                className="bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Eye size={15} /> {showPreview ? "收起預覽" : "預覽任務"}
              </button>
              <button
                onClick={handleCopy}
                className="bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Copy size={15} /> 複製連結
              </button>
            </div>
          </div>
        </div>

        <TaskShareImagePanel task={task} url={shareUrl()} signupCount={signupCount} onToast={showToast} />

        {showPreview && (
          <div ref={previewRef} className="mt-5 scroll-mt-20">
            <p className="text-xs text-gray-400 mb-3 text-center">這是分享到 LINE 群組時，成員會看到的卡片樣式</p>
            <TaskShareCard
              task={task}
              signupCount={signupCount}
              previewOnly
              onPreviewTap={() =>
                showToast(
                  <span className="whitespace-nowrap">這是卡片預覽畫面，「{isQueueTask(task) ? "我要排隊" : "我要報名"}」按鈕無法操作！</span>
                )
              }
            />
          </div>
        )}

        <button
          onClick={() => router.push("/my-tasks")}
          className="mx-auto mt-5 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 active:text-gray-600 py-2 px-3 transition"
        >
          <ArrowLeft size={15} /> 回到任務清單
        </button>
      </FadeIn>

      <Toast className="bottom-4">
        {toast && (
          <div className="bg-rose-500 text-white text-[13px] px-6 py-2 rounded-full shadow-lg whitespace-nowrap text-center leading-relaxed">
            {toast}
          </div>
        )}
      </Toast>

      {showTour && (
        <OnboardingTour
          steps={[
            {
              target: "line-share",
              tapTarget: true,
              title: "最後一步：分享到 LINE",
              text: "任務建立好了！按這個按鈕，把報名卡片分享到 LINE 群組或好友，大家點報名卡片就能直接報名。",
            },
          ]}
          finishLabel="完成教學"
          onFinish={finishTour}
          onSkip={finishTour}
        />
      )}
    </div>
  );
}