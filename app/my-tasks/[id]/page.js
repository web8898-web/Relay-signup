"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, LogIn, MessageCircle, Download, FileSpreadsheet, FileText, CheckCircle2, ChevronDown } from "lucide-react";
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
import { taskStatus } from "@/lib/utils";

export default function MyTaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile, loading: authLoading, error: authError, login } = useLineProfile();
  const [task, setTask] = useState(null);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkinMode, setCheckinMode] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

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

  const pendingSignups = useMemo(() => signups.filter((s) => !s.checked_in), [signups]);
  const completedSignups = useMemo(() => signups.filter((s) => !!s.checked_in), [signups]);

  async function handleToggleCheckin(signup) {
    if (!profile || !signup?.id) return;
    const nextChecked = !signup.checked_in;
    setError("");
    setSignups((prev) => prev.map((s) => (s.id === signup.id ? { ...s, checked_in: nextChecked } : s)));
    try {
      const res = await fetch(`/api/signups/${signup.id}/checkin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${profile.accessToken}`,
        },
        body: JSON.stringify({ checked_in: nextChecked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "處理失敗");
      setSignups((prev) => prev.map((s) => (s.id === signup.id ? data.signup : s)));
    } catch (e) {
      setSignups((prev) => prev.map((s) => (s.id === signup.id ? signup : s)));
      setError(e.message || "處理失敗，請再試一次");
    }
  }

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
  const isQueueMode = task.task_mode === "queue";
  const closed = taskStatus(task).label === "已截止";
  const canUseCheckin = isOwner && signups.length > 0 && (isQueueMode || closed);
  const checkinButtonText = checkinMode
    ? "完成處理"
    : isQueueMode
    ? "開始處理名單"
    : "開始點名報到";

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="任務詳情" />

      <div className="px-6 pt-4">
        <TaskAnnouncement task={task} />
        <div className="flex items-center justify-between gap-2 mt-4 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
            <Users size={13} className="shrink-0" /> {signups.length} 人已接龍
            {isQueueMode && <span className="text-emerald-500 shrink-0">· 現場排隊</span>}
          </div>
          {signups.length > 0 && (
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className="shrink-0 flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-500 transition active:scale-95 hover:border-emerald-300 hover:text-emerald-600"
              aria-expanded={exportOpen}
            >
              <Download size={12} /> 匯出名單
              <ChevronDown size={12} className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {!isOwner && (
        <p className="mx-6 mb-2 text-[11px] text-gray-400">你不是這個任務的建立者，僅能檢視名單。</p>
      )}

      {error && <p className="mx-6 mb-2 text-xs text-rose-500">{error}</p>}

      {signups.length > 0 && exportOpen && (
        <div className="mx-6 mb-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
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

      {canUseCheckin && (
        <div className="mx-6 mb-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-700">
                {isQueueMode ? "現場排隊處理" : "點名報到"}
              </p>
              <p className="text-[11px] text-emerald-700/70 mt-0.5 leading-relaxed">
                {isQueueMode
                  ? "按完成後會移到已完成區，等待名單會自動往前。"
                  : "任務截止後可逐一確認已完成報到。"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCheckinMode((v) => !v)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                checkinMode ? "bg-gray-700 text-white" : "bg-emerald-500 text-white shadow-sm shadow-emerald-100"
              }`}
            >
              <CheckCircle2 size={14} /> {checkinButtonText}
            </button>
          </div>
          {isQueueMode && checkinMode && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[11px]">
              <div className="rounded-xl bg-white px-2 py-2 text-gray-500">
                等待中 <span className="font-bold text-emerald-600">{pendingSignups.length}</span>
              </div>
              <div className="rounded-xl bg-white px-2 py-2 text-gray-500">
                已完成 <span className="font-bold text-gray-700">{completedSignups.length}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {isOwner && signups.length > 0 && !canUseCheckin && !isQueueMode && (
        <p className="mx-6 mb-3 text-[11px] text-gray-400">一般報名任務會在截止後開放點名報到。</p>
      )}

      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {isQueueMode && checkinMode ? (
          <div className="flex flex-col gap-5">
            <section>
              <p className="text-[11px] font-bold text-emerald-700 mb-2 px-1">等待中</p>
              <ThreadList
                signups={pendingSignups}
                myIds={getMySignupIds()}
                categories={task.categories}
                quantityUnit={task.quantity_unit}
                onUpdate={async () => {}}
                onDelete={async () => {}}
                checkinMode
                onToggleCheckin={handleToggleCheckin}
              />
            </section>
            {completedSignups.length > 0 && (
              <section>
                <p className="text-[11px] font-bold text-gray-400 mb-2 px-1">已完成</p>
                <ThreadList
                  signups={completedSignups}
                  myIds={getMySignupIds()}
                  categories={task.categories}
                  quantityUnit={task.quantity_unit}
                  onUpdate={async () => {}}
                  onDelete={async () => {}}
                  checkinMode
                  onToggleCheckin={handleToggleCheckin}
                />
              </section>
            )}
          </div>
        ) : (
          <ThreadList
            signups={signups}
            myIds={getMySignupIds()}
            categories={task.categories}
            quantityUnit={task.quantity_unit}
            onUpdate={async () => {}}
            onDelete={async () => {}}
            checkinMode={checkinMode}
            onToggleCheckin={handleToggleCheckin}
          />
        )}
      </div>
    </div>
  );
}
