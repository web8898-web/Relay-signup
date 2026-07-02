"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Send, Users, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import TaskAnnouncement from "@/components/TaskAnnouncement";
import ThreadList from "@/components/ThreadList";
import LoadingBubble from "@/components/LoadingBubble";
import TaskGoneIllustration from "@/components/TaskGoneIllustration";
import { supabase } from "@/lib/supabaseClient";
import { taskStatus } from "@/lib/utils";
import { getOwnerToken, getMySignupIds, rememberMySignup, forgetMySignup } from "@/lib/ownerToken";
import { useScrollFadeRight } from "@/lib/useScrollFadeRight";

export default function TaskDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [signups, setSignups] = useState([]);
  const [myIds, setMyIds] = useState([]);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const listRef = useRef(null);
  const nameInputRef = useRef(null);
  const [catScrollRef, catSentinelRef, catCanScrollRight] = useScrollFadeRight(!loading && task?.categories?.length > 0);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function load() {
    setLoading(true);
    const { data: taskData } = await supabase.from("tasks").select("*").eq("id", id).single();
    setTask(taskData || null);

    const { data: signupData } = await supabase
      .from("signups")
      .select("*")
      .eq("task_id", id)
      .order("created_at", { ascending: true });
    setSignups(signupData || []);
    setMyIds(getMySignupIds());
    setLoading(false);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  const closed = task ? taskStatus(task).label === "已截止" : false;

  async function handleSend() {
    if (!task) return;
    if (!name.trim()) {
      setError("請先填寫您的姓名！");
      nameInputRef.current?.focus();
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: task.id,
          category: task.categories?.length > 0 ? category : "",
          name: name.trim(),
          note: note.trim(),
          owner_token: getOwnerToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      rememberMySignup(data.signup.id);
      setMyIds(getMySignupIds());
      setName("");
      setNote("");
      showToast("已成功接龍！");
      // Re-fetch from the database instead of only patching local state, so
      // the list is always guaranteed to match what's actually saved —
      // this is what fixes the "first signup doesn't show until you leave
      // and re-open the page" issue.
      const { data: signupData } = await supabase
        .from("signups")
        .select("*")
        .eq("task_id", id)
        .order("created_at", { ascending: true });
      setSignups(signupData || []);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch (e) {
      setError(e.message || "送出失敗");
    }
    setSending(false);
  }

  async function handleUpdate(signupId, patch) {
    const res = await fetch(`/api/signups/${signupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, owner_token: getOwnerToken() }),
    });
    const data = await res.json();
    if (res.ok) {
      setSignups((prev) => prev.map((s) => (s.id === signupId ? data.signup : s)));
      showToast("已更新");
    }
  }

  async function handleDelete(signupId) {
    const res = await fetch(`/api/signups/${signupId}?owner_token=${encodeURIComponent(getOwnerToken())}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSignups((prev) => prev.filter((s) => s.id !== signupId));
      forgetMySignup(signupId);
      setMyIds(getMySignupIds());
      showToast("已刪除");
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="載入中" />
        <div className="flex-1 flex items-center justify-center">
          <LoadingBubble />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="找不到任務" />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <TaskGoneIllustration />
          <p className="font-semibold text-gray-700 mt-4 mb-2">找不到這個任務</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            這個任務可能已經被主辦人刪除，
            <br />
            或分享連結已經失效。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative min-w-0">
      <TopBar title={task.title} />

      <div className="px-6 pt-4">
        <TaskAnnouncement task={task} />
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 mb-2">
          <Users size={13} /> {signups.length} 人已接龍
        </div>
      </div>

      <div ref={listRef} className="flex-1 px-6 pb-3 overflow-y-auto scroll-smooth min-w-0">
        <ThreadList
          signups={signups}
          myIds={myIds}
          categories={task.categories}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </div>

      {closed ? (
        <div className="px-6 pb-6 pt-2 text-center text-xs text-gray-400 border-t border-gray-100">
          此任務已截止，無法再接龍
        </div>
      ) : (
        <div className="px-6 pb-6 pt-3 border-t-2 border-emerald-100 bg-emerald-50/40 min-w-0 overflow-hidden">
          {task.categories?.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-emerald-700 mb-1.5 px-0.5">👉 選擇您要報名的類別</p>
              <div className="relative -mx-1">
                <div ref={catScrollRef} className="flex gap-1.5 overflow-x-auto pb-2 mb-1 px-1">
                  <button
                    onClick={() => setCategory("")}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
                      category === ""
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-emerald-600/70 border-emerald-200 border-dashed"
                    }`}
                  >
                    不選類別
                  </button>
                  {task.categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
                        category === c ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-500 border-gray-200"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  <span ref={catSentinelRef} aria-hidden="true" className="shrink-0 w-px h-1" />
                </div>
                {catCanScrollRight && (
                  <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-10 flex items-center justify-end bg-gradient-to-l from-emerald-50 to-transparent">
                    <ChevronRight size={14} className="text-emerald-400" />
                  </div>
                )}
              </div>
            </>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={nameInputRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="你的姓名"
              className={`w-full border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
                error ? "border-rose-300 focus:ring-rose-200" : "border-gray-200 focus:ring-emerald-300"
              }`}
            />
            {error && (
              <p className="text-xs text-rose-500 flex items-center gap-1 px-2 -mt-1">
                <AlertCircle size={12} className="shrink-0" /> {error}
              </p>
            )}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="備註（選填）"
              className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-full py-3.5 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-md shadow-emerald-200 transition"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              送出報名
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-rose-800 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 whitespace-nowrap">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
