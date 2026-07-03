"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, LogIn, MessageCircle, Download, FileSpreadsheet, FileText } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import TaskAnnouncement from "@/components/TaskAnnouncement";
import ThreadList from "@/components/ThreadList";
import LoadingBubble from "@/components/LoadingBubble";
import TaskGoneIllustration from "@/components/TaskGoneIllustration";
import FadeIn from "@/components/FadeIn";
import { useLineProfile } from "@/lib/useLineProfile";
import { supabase } from "@/lib/supabaseClient";
import { getMySignupIds } from "@/lib/ownerToken";
import { liff } from "@/lib/liff";

export default function MyTaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile, loading: authLoading, error: authError, login } = useLineProfile();
  const [task, setTask] = useState(null);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // LINE's in-app browser often silently fails to download client-generated
  // blob files, so we hit a real server URL instead and force it open in
  // the phone's default browser (via LIFF's external window), which
  // handles downloads normally.
  function openExportUrl(format) {
    const url = `${window.location.origin}/api/tasks/${id}/export?format=${format}`;
    try {
      if (liff.isInClient && liff.isInClient()) {
        liff.openWindow({ url, external: true });
        return;
      }
    } catch (e) {
      // fall through to plain navigation
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleExportCsv() {
    openExportUrl("csv");
  }

  function handleExportTxt() {
    openExportUrl("txt");
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: taskData } = await supabase.from("tasks").select("*").eq("id", id).single();
      setTask(taskData || null);
      const { data: signupData } = await supabase
        .from("signups")
        .select("*")
        .eq("task_id", id)
        .order("created_at", { ascending: true });
      setSignups(signupData || []);
      setLoading(false);
    })();
  }, [id]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="任務詳情" />
        <div className="flex-1 flex items-center justify-center">
          <LoadingBubble />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="任務詳情" backHref="/" />
        <div className="flex-1 px-6 py-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
            <MessageCircle size={34} />
          </div>
          <p className="text-gray-500 text-sm text-center mb-8">請先使用 LINE 登入以管理任務。</p>
          {authError && <p className="text-xs text-rose-500 mb-4">{authError}</p>}
          <button onClick={login} className="w-full bg-emerald-500 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2">
            <LogIn size={18} /> 使用 LINE 登入
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="找不到任務" />
        <FadeIn className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <TaskGoneIllustration />
          <p className="font-semibold text-gray-700 mt-4 mb-2">找不到這個任務</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            這個任務可能已經被移除，
            <br />
            或連結已經失效。
          </p>
        </FadeIn>
      </div>
    );
  }

  const isOwner = task.creator_id === profile.userId;

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="任務詳情" />

      <div className="px-6 pt-4">
        <TaskAnnouncement task={task} />
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 mb-2">
          <Users size={13} /> {signups.length} 人已接龍
        </div>
      </div>

      {!isOwner && (
        <p className="mx-6 mb-2 text-[11px] text-gray-400">你不是這個任務的建立者，僅能檢視名單。</p>
      )}

      {error && <p className="mx-6 mb-2 text-xs text-rose-500">{error}</p>}

      {signups.length > 0 && (
        <div className="mx-6 mb-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
          <p className="text-[11px] font-medium text-gray-400 mb-2 flex items-center gap-1">
            <Download size={12} /> 匯出名單
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleExportCsv}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 rounded-full py-2 text-xs font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition"
            >
              <FileSpreadsheet size={14} /> CSV（Excel）
            </button>
            <button
              onClick={handleExportTxt}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 rounded-full py-2 text-xs font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition"
            >
              <FileText size={14} /> 文字檔
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <ThreadList
          signups={signups}
          myIds={getMySignupIds()}
          categories={task.categories}
          onUpdate={async () => {}}
          onDelete={async () => {}}
        />
      </div>
    </div>
  );
}
