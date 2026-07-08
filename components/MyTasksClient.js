"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, LogIn, MessageCircle, Plus, Bell, ChevronUp, ChevronDown, PenLine } from "lucide-react";
import { TopBar, EmptyState } from "@/components/TopBar";
import OrganizerTabs from "@/components/OrganizerTabs";
import LoadingBubble from "@/components/LoadingBubble";
import FadeIn from "@/components/FadeIn";
import TaskListCard from "@/components/TaskListCard";
import { useLineProfile } from "@/lib/useLineProfile";
import { avatarClass } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

const FRIEND_ADD_URL = "https://line.me/R/ti/p/%40085uqqfg";
const FRIEND_BANNER_KEY = "friendBannerExpanded";

function TaskListSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50" />
            <div className="flex-1 min-w-0">
              <div className="h-3.5 w-36 rounded-full bg-gray-100" />
              <div className="h-2.5 w-24 rounded-full bg-gray-100 mt-2" />
            </div>
            <div className="w-7 h-7 rounded-full bg-gray-50" />
            <div className="w-7 h-7 rounded-full bg-gray-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyTasksClient() {
  const router = useRouter();
  const { profile, loading, error, login } = useLineProfile();
  const [tasks, setTasks] = useState([]);
  const [signupsByTask, setSignupsByTask] = useState({});
  const [tasksLoading, setTasksLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [friendBannerExpanded, setFriendBannerExpanded] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(FRIEND_BANNER_KEY) : null;
    if (saved !== null) setFriendBannerExpanded(saved === "1");
  }, []);

  function setBannerExpanded(expanded) {
    setFriendBannerExpanded(expanded);
    localStorage.setItem(FRIEND_BANNER_KEY, expanded ? "1" : "0");
  }

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
        .select("id, task_id, name, note, categories, quantity, category_quantities, checked_in, created_at")
        .in("task_id", data.map((t) => t.id))
        .order("created_at", { ascending: true });
      const map = {};
      (signupData || []).forEach((s) => {
        if (!map[s.task_id]) map[s.task_id] = [];
        map[s.task_id].push(s);
      });
      setSignupsByTask(map);
    } else {
      setSignupsByTask({});
    }
    setTasksLoading(false);
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function handleDelete(taskId) {
    const removedTask = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (expandedTaskId === taskId) setExpandedTaskId(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${profile.accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("已移除任務");
    } catch (e) {
      if (removedTask) {
        setTasks((prev) =>
          [...prev, removedTask].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        );
      }
      showToast(e.message || "移除失敗");
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="任務清單" backHref="/" />
        <div className="flex-1 flex items-center justify-center">
          <LoadingBubble />
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
    <>
    <FadeIn className="flex-1 flex flex-col relative min-w-0">
      <TopBar
        title="任務清單"
        backHref="/"
        right={
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full pl-1 pr-2.5 py-1">
            <div className={`w-5 h-5 rounded-full ${avatarClass(profile.displayName)} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
              {profile.displayName?.[0] || "?"}
            </div>
            <span className="text-xs text-white/90 font-medium max-w-[80px] truncate">{profile.displayName}</span>
          </div>
        }
      />
      <OrganizerTabs current="tasks" />
      <div className="flex-1 px-6 pt-3 pb-[65vh] flex flex-col gap-3 overflow-y-auto scroll-smooth">
        {friendBannerExpanded ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Bell size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-emerald-800">加好友才能收到報名通知</p>
              <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                加入官方帳號好友，有人報名時 LINE 就會直接通知你。可以在每個任務旁的鈴鐺圖示，個別開關要不要收通知。
              </p>
              <div className="flex justify-end">
                <a href={FRIEND_ADD_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-emerald-600 transition">
                  加官方帳號好友
                </a>
              </div>
            </div>
            <button onClick={() => setBannerExpanded(false)} className="text-emerald-400 hover:text-emerald-600 shrink-0" aria-label="收合提示">
              <ChevronUp size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => setBannerExpanded(true)} className="w-full flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 hover:bg-emerald-100 transition" aria-label="展開提示">
            <span className="flex items-center gap-2"><Bell size={14} /> 加好友才能收到報名通知</span>
            <ChevronDown size={14} />
          </button>
        )}

        {tasksLoading && <TaskListSkeleton />}
        {!tasksLoading && tasks.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-[28px] px-5 py-2 shadow-sm">
            <EmptyState
              icon={<ClipboardList size={30} />}
              title="還沒有建立任何接龍"
              desc={"建立第一個接龍後，就能分享到 LINE，\n讓大家立即開始報名。"}
              action={
                <button onClick={() => router.push("/create")} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition">
                  <PenLine size={17} /> 建立第一個任務
                </button>
              }
            />
          </div>
        )}
        {tasks.map((t) => (
          <TaskListCard
            key={t.id}
            task={t}
            signups={signupsByTask[t.id] || []}
            accessToken={profile.accessToken}
            expanded={expandedTaskId === t.id}
            dimmed={!!expandedTaskId && expandedTaskId !== t.id}
            onToggleExpand={() => setExpandedTaskId((current) => (current === t.id ? null : t.id))}
            onEdit={() => router.push(`/my-tasks/${t.id}/edit`)}
            onShare={() => router.push(`/create/share/${t.id}`)}
            onDelete={() => handleDelete(t.id)}
          />
        ))}
      </div>

      <div className="px-6 pb-6 pt-2">
        <button onClick={() => router.push("/create")} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition">
          <Plus size={18} /> 新增任務
        </button>
      </div>
    </FadeIn>

    {toast && (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50 whitespace-nowrap">
        {toast}
      </div>
    )}
    </>
  );
}
