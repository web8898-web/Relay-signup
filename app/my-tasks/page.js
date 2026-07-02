"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, LogIn, MessageCircle, Plus } from "lucide-react";
import { TopBar, EmptyState } from "@/components/TopBar";
import OrganizerTabs from "@/components/OrganizerTabs";
import TaskListCard from "@/components/TaskListCard";
import { useLineProfile } from "@/lib/useLineProfile";
import { avatarClass } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

export default function MyTasksPage() {
  const router = useRouter();
  const { profile, loading, error, login } = useLineProfile();
  const [tasks, setTasks] = useState([]);
  const [signupsByTask, setSignupsByTask] = useState({});
  const [tasksLoading, setTasksLoading] = useState(true);
  const [toast, setToast] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function loadTasks() {
    if (!profile) return;
    setTasksLoading(true);
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("creator_id", profile.userId)
      .order("created_at", { ascending: false });
    setTasks(data || []);

    if (data?.length) {
      const { data: signupData } = await supabase
        .from("signups")
        .select("task_id, name, note, category, created_at")
        .in("task_id", data.map((t) => t.id))
        .order("created_at", { ascending: true });
      const map = {};
      (signupData || []).forEach((s) => {
        if (!map[s.task_id]) map[s.task_id] = [];
        map[s.task_id].push(s);
      });
      setSignupsByTask(map);
    }
    setTasksLoading(false);
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function handleDelete(taskId) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${profile.accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast("已移除任務");
    } catch (e) {
      showToast(e.message || "移除失敗");
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="任務清單" backHref="/" />
        <div className="flex-1 flex items-center justify-center text-emerald-500">
          <Loader2 className="animate-spin" size={28} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="任務清單" backHref="/" />
        <div className="flex-1 px-6 py-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
            <MessageCircle size={34} />
          </div>
          <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
            請先使用 LINE 登入，<br />才能查看你建立的任務。
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
      <TopBar title="任務清單" backHref="/" />
      <OrganizerTabs current="tasks" />
      <div className="px-6 pt-2 pb-2 flex items-center gap-2 text-xs text-gray-400">
        <div className={`w-6 h-6 rounded-full ${avatarClass(profile.displayName)} text-white flex items-center justify-center text-[11px] font-bold`}>
          {profile.displayName?.[0] || "?"}
        </div>
        以 <span className="font-medium text-gray-600">{profile.displayName}</span> 身分登入
      </div>

      <div className="flex-1 px-6 py-3 flex flex-col gap-3 overflow-y-auto">
        {tasksLoading && (
          <div className="flex justify-center py-10 text-emerald-500">
            <Loader2 className="animate-spin" size={24} />
          </div>
        )}
        {!tasksLoading && tasks.length === 0 && (
          <EmptyState icon={<ClipboardList size={30} />} title="還沒有任務" desc="點擊上方「建立任務」開始建立第一個接龍吧。" />
        )}
        {tasks.map((t) => (
          <TaskListCard
            key={t.id}
            task={t}
            signups={signupsByTask[t.id] || []}
            onEdit={() => router.push(`/my-tasks/${t.id}/edit`)}
            onShare={() => router.push(`/create/share/${t.id}`)}
            onDelete={() => handleDelete(t.id)}
          />
        ))}
      </div>

      <div className="px-6 pb-6 pt-2">
        <button
          onClick={() => router.push("/create")}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition"
        >
          <Plus size={18} /> 新增任務
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-rose-800 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
