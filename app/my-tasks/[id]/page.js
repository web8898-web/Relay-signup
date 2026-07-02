"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Edit2, Trash2, Share2, Users, AlertTriangle, LogIn, MessageCircle, Download, FileSpreadsheet, FileText } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import TaskAnnouncement from "@/components/TaskAnnouncement";
import ThreadList from "@/components/ThreadList";
import { useLineProfile } from "@/lib/useLineProfile";
import { supabase } from "@/lib/supabaseClient";
import { getMySignupIds } from "@/lib/ownerToken";

export default function MyTaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile, loading: authLoading, error: authError, login } = useLineProfile();
  const [task, setTask] = useState(null);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  function fmtTime(iso) {
    try {
      return new Date(iso).toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  }

  function safeFilename(s) {
    return (s || "任務").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
  }

  function downloadFile(filename, content, mime) {
    // Prefix with a UTF-8 BOM so Chinese text doesn't turn into garbled
    // characters when the file is opened in Excel on Windows.
    const blob = new Blob(["\uFEFF" + content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function csvEscape(value) {
    const str = String(value ?? "");
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  }

  function handleExportCsv() {
    const headers = ["姓名", "分類", "備註", "報名時間"];
    const rows = signups.map((s) => [s.name, s.category || "", s.note || "", fmtTime(s.created_at)]);
    const lines = [headers, ...rows].map((r) => r.map(csvEscape).join(","));
    downloadFile(`${safeFilename(task.title)}-報名名單.csv`, lines.join("\r\n"), "text/csv;charset=utf-8");
  }

  function handleExportTxt() {
    const lines = [];
    lines.push(`任務：${task.title}`);
    lines.push(`匯出時間：${fmtTime(new Date().toISOString())}`);
    lines.push(`總計：${signups.length} 人報名`);
    lines.push("");
    signups.forEach((s, i) => {
      const parts = [`${i + 1}. ${s.name}`];
      if (s.category) parts.push(`分類：${s.category}`);
      parts.push(`備註：${s.note || "無"}`);
      parts.push(`報名時間：${fmtTime(s.created_at)}`);
      lines.push(parts.join("　"));
    });
    downloadFile(`${safeFilename(task.title)}-報名名單.txt`, lines.join("\n"), "text/plain;charset=utf-8");
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

  async function handleDelete() {
    if (!profile) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${profile.accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/my-tasks");
    } catch (e) {
      setError(e.message || "刪除失敗");
    }
    setDeleting(false);
  }

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="任務詳情" backHref="/my-tasks" />
        <div className="flex-1 flex items-center justify-center text-emerald-500">
          <Loader2 className="animate-spin" size={28} />
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
        <TopBar title="找不到任務" backHref="/my-tasks" />
      </div>
    );
  }

  const isOwner = task.creator_id === profile.userId;

  return (
    <div className="flex-1 flex flex-col">
      <TopBar
        title="任務詳情"
        backHref="/my-tasks"
        right={
          isOwner && (
            <div className="flex items-center gap-3">
              <button onClick={() => router.push(`/create/share/${id}`)} title="分享"><Share2 size={17} className="text-white/90 hover:text-white" /></button>
              <button onClick={() => router.push(`/my-tasks/${id}/edit`)} title="編輯"><Edit2 size={17} className="text-white/90 hover:text-white" /></button>
              <button onClick={() => setConfirmDelete(true)} title="刪除"><Trash2 size={17} className="text-white/90 hover:text-white" /></button>
            </div>
          )
        }
      />

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

      {confirmDelete && (
        <div className="mx-6 mb-2 bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center gap-2 text-sm text-rose-700">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="flex-1">確定要刪除這個任務與所有報名資料嗎？</span>
          <button onClick={() => setConfirmDelete(false)} className="text-gray-400 px-2">取消</button>
          <button disabled={deleting} onClick={handleDelete} className="bg-rose-500 text-white px-3 py-1 rounded-full disabled:opacity-50">
            {deleting ? "刪除中…" : "刪除"}
          </button>
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
