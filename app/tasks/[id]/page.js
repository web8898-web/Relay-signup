"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Send, Users, CheckCircle2 } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import TaskAnnouncement from "@/components/TaskAnnouncement";
import ThreadList from "@/components/ThreadList";
import { supabase } from "@/lib/supabaseClient";
import { taskStatus } from "@/lib/utils";
import { getOwnerToken, getMySignupIds, rememberMySignup, forgetMySignup } from "@/lib/ownerToken";

export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
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

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function load() {
    setLoading(true);
    const { data: taskData } = await supabase.from("tasks").select("*").eq("id", id).single();
    setTask(taskData || null);
    if (taskData?.categories?.length > 0) setCategory(taskData.categories[0]);

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
    if (!name.trim() || !task) return;
    if (task.categories?.length > 0 && !category) return;
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
      setSignups((prev) => [...prev, data.signup]);
      rememberMySignup(data.signup.id);
      setMyIds(getMySignupIds());
      setName("");
      setNote("");
      showToast("已成功接龍！");
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
        <TopBar title="載入中" backHref="/" />
        <div className="flex-1 flex items-center justify-center text-emerald-500">
          <Loader2 className="animate-spin" size={28} />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="找不到任務" backHref="/" />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          這個任務可能已經被刪除。
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative">
      <TopBar title={task.title} onBack={() => router.push("/")} />

      <div className="px-6 pt-4">
        <TaskAnnouncement task={task} />
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 mb-2">
          <Users size={13} /> {signups.length} 人已接龍
        </div>
      </div>

      <div ref={listRef} className="flex-1 px-6 pb-3 overflow-y-auto scroll-smooth">
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
        <div className="px-6 pb-6 pt-3 border-t border-gray-100 bg-white">
          {error && <p className="text-xs text-rose-500 mb-2">{error}</p>}
          {task.categories?.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1 -mx-1 px-1">
              {task.categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
                    category === c ? "bg-emerald-500 text-white border-emerald-500" : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的姓名"
              className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="備註（選填）"
              className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button
              onClick={handleSend}
              disabled={!name.trim() || (task.categories?.length > 0 && !category) || sending}
              className="w-full bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-full py-3.5 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-md shadow-emerald-200 transition"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              送出報名
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
