"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Bell, ChevronUp, ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/TopBar";
import Toast from "@/components/Toast";
import LoadingBubble from "@/components/LoadingBubble";
import FadeIn from "@/components/FadeIn";
import TaskListCard from "@/components/TaskListCard";
import { useOrganizerProfile } from "@/lib/OrganizerContext";
import { supabase } from "@/lib/supabaseClient";

// LINE's official "add friend" deep link format for a given Basic ID.
const FRIEND_ADD_URL = "https://line.me/R/ti/p/%40085uqqfg";
const FRIEND_BANNER_KEY = "friendBannerExpanded";

export default function MyTasksListContent() {
  const router = useRouter();
  const profile = useOrganizerProfile();
  const [tasks, setTasks] = useState([]);
  const [signupsByTask, setSignupsByTask] = useState({});
  const [tasksLoading, setTasksLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [friendBannerExpanded, setFriendBannerExpanded] = useState(true);

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
        .select("task_id, name, note, categories, quantity, category_quantities, created_at")
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
    // Optimistic removal: the swipe-to-delete gesture in TaskListCard
    // already plays its own exit animation, so we take the card out of the
    // list right away instead of waiting on the network — waiting here is
    // what made the swipe feel like it was hanging on the red background.
    const removedTask = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${profile.accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("已移除任務");
    } catch (e) {
      // The delete didn't actually go through on the server — put the
      // task back so the list stays correct.
      if (removedTask) {
        setTasks((prev) =>
          [...prev, removedTask].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        );
      }
      showToast(e.message || "移除失敗");
    }
  }

  if (tasksLoading) {
    return (
      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="flex-1 flex items-center justify-center">
          <LoadingBubble />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative min-w-0">
      <FadeIn className="flex-1 px-6 py-3 flex flex-col gap-3 overflow-y-auto">
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
                <a
                  href={FRIEND_ADD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-emerald-600 transition"
                >
                  加官方帳號好友
                </a>
              </div>
            </div>
            <button
              onClick={() => setBannerExpanded(false)}
              className="text-emerald-400 hover:text-emerald-600 shrink-0"
              aria-label="收合提示"
            >
              <ChevronUp size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setBannerExpanded(true)}
            className="w-full flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 hover:bg-emerald-100 transition"
            aria-label="展開提示"
          >
            <span className="flex items-center gap-2">
              <Bell size={14} /> 加好友才能收到報名通知
            </span>
            <ChevronDown size={14} />
          </button>
        )}

        {tasks.length === 0 && (
          <EmptyState icon={<ClipboardList size={30} />} title="還沒有任務" desc="點擊上方「建立任務」開始建立第一個接龍吧。" />
        )}
        {tasks.map((t) => (
          <TaskListCard
            key={t.id}
            task={t}
            signups={signupsByTask[t.id] || []}
            accessToken={profile.accessToken}
            onEdit={() => router.push(`/my-tasks/${t.id}/edit`)}
            onShare={() => router.push(`/create/share/${t.id}`)}
            onDelete={() => handleDelete(t.id)}
          />
        ))}
      </FadeIn>

      <FadeIn className="px-6 pb-6 pt-2">
        <button
          onClick={() => router.push("/create")}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition"
        >
          <Plus size={18} /> 新增任務
        </button>
      </FadeIn>

      {toast && (
        <Toast className="bottom-24">
          <div className="bg-rose-500 text-white text-sm px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
            {toast}
          </div>
        </Toast>
      )}
    </div>
  );
}
