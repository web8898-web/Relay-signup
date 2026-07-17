"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Share2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { buildFlexMessage, buildShareText, lineShareUrl, isQueueTask } from "@/lib/utils";
import { initLiff, liff } from "@/lib/liff";

export default function ShareAgainPage() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("tasks").select("*").eq("id", id).single();
      if (!active) return;
      setTask(data || null);
      setLoading(false);
      try {
        await initLiff();
      } catch (e) {}
    })();
    return () => { active = false; };
  }, [id]);

  function taskUrl() {
    const base = task?.short_code
      ? `${window.location.origin}/s/${task.short_code}`
      : `${window.location.origin}/tasks/${id}`;
    const url = new URL(base);
    if (isQueueTask(task)) url.searchParams.set("queue", "1");
    return url.toString();
  }

  async function handleShare() {
    if (!task || sharing) return;
    setSharing(true);
    setError("");
    setMessage("");
    const url = taskUrl();
    try {
      await initLiff();
      if (liff.isApiAvailable?.("shareTargetPicker")) {
        await liff.shareTargetPicker([buildFlexMessage(task, url)]);
        setMessage("已開啟 LINE 分享選擇");
        setSharing(false);
        return;
      }
    } catch (e) {}

    try {
      window.location.href = lineShareUrl(buildShareText(task, url));
    } catch (e) {
      setError("目前無法開啟分享，請稍後再試");
    }
    setSharing(false);
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">載入接龍中…</div>;
  }

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <AlertCircle className="text-gray-300" size={36} />
        <p className="mt-3 font-semibold text-gray-600">找不到這個接龍</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 via-white to-white px-6 py-10">
      <div className="mx-auto my-auto w-full max-w-sm rounded-[28px] border border-emerald-100 bg-white p-6 text-center shadow-xl shadow-emerald-100/50">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <Share2 size={26} />
        </div>
        <p className="mt-4 text-xs font-semibold text-emerald-600">接龍報名小助手</p>
        <h1 className="mt-1 text-xl font-bold text-gray-800">{task.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">將這個接龍分享到其他 LINE 群組或好友。</p>

        <button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-3.5 font-semibold text-white shadow-md shadow-emerald-200 transition active:scale-[0.98] disabled:opacity-60"
        >
          <Share2 size={17} /> {sharing ? "開啟中…" : "分享到其他群組"}
        </button>

        {message && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 size={14} /> {message}
          </p>
        )}
        {error && <p className="mt-4 text-xs text-rose-500">{error}</p>}
      </div>
    </main>
  );
}
