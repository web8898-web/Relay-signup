"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Share2, Copy, Loader2 } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import TaskShareCard from "@/components/TaskShareCard";
import { supabase } from "@/lib/supabaseClient";
import { buildShareText, lineShareUrl, buildFlexMessage } from "@/lib/utils";
import { liff } from "@/lib/liff";

export default function ShareTaskPage() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tasks").select("*").eq("id", id).single();
      setTask(data || null);
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

  async function handleLineShare() {
    if (!task) return;
    const url = taskUrl();
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
    const text = buildShareText(task, taskUrl());
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
        <div className="flex-1 flex items-center justify-center text-emerald-500">
          <Loader2 className="animate-spin" size={28} />
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="flex-1 flex flex-col relative">
      <TopBar title="分享任務" onBack={() => router.push(`/my-tasks/${id}`)} />
      <div className="flex-1 px-5 py-5 overflow-y-auto">
        <p className="text-xs text-gray-400 mb-3 text-center">這是分享到 LINE 群組時，成員會看到的卡片樣式</p>
        <TaskShareCard
          task={task}
          signupCount={0}
          previewOnly
          onPreviewTap={() => showToast("這是預覽卡片，請用下方「分享到 LINE」分享出去")}
        />

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleLineShare}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition"
          >
            <Share2 size={17} /> 分享到 LINE
          </button>
          <button
            onClick={handleCopy}
            className="w-full border border-gray-200 text-gray-600 rounded-full py-3 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition"
          >
            <Copy size={16} /> 複製訊息文字
          </button>
        </div>

        <p className="text-[11px] text-gray-300 text-center mt-4 leading-relaxed px-2 break-all">
          報名連結：{taskUrl()}
        </p>
      </div>

      <div className="px-5 pb-6 pt-2">
        <button
          onClick={() => router.push(`/my-tasks/${id}`)}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-full py-3 font-semibold transition"
        >
          完成
        </button>
      </div>

      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
