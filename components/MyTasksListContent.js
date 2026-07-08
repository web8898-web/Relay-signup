"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Bell, ChevronUp, ChevronDown, CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/TopBar";
import Toast from "@/components/Toast";
import LoadingBubble from "@/components/LoadingBubble";
import FadeIn from "@/components/FadeIn";
import TaskListCard from "@/components/TaskListCard";
import { useOrganizerProfile } from "@/lib/OrganizerContext";
import { supabase } from "@/lib/supabaseClient";
import { isHeadcountUnit, taskStatus } from "@/lib/utils";

// LINE's official "add friend" deep link format for a given Basic ID.
const FRIEND_ADD_URL = "https://line.me/R/ti/p/%40085uqqfg";
const FRIEND_BANNER_KEY = "friendBannerExpanded";

function formatDateShort(value) {
  if (!value) return "未設定";
  const parts = String(value).split("-");
  if (parts.length === 3) return `${Number(parts[1])}/${Number(parts[2])}`;
  return value;
}

function formatDateRange(task) {
  return `${formatDateShort(task.start_date)}～${formatDateShort(task.end_date)}`;
}

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
        .select("task_id, id, name, note, categories, quantity, category_quantities, created_at, checked_in, batch_id")
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

  function headcountForTask(t) {
    const list = signupsByTask[t.id] || [];
    if (isHeadcountUnit(t.quantity_unit)) {
      return list.reduce((sum, s) => {
        if (s.category_quantities && Object.keys(s.category_quantities).length > 0) {
          return sum + Object.values(s.category_quantities).reduce((a, b) => a + (b || 0), 0);
        }
        return sum + (s.quantity ?? 1);
      }, 0);
    }
    return list.length;
  }

  // 任務排序權重：已截止 → 已額滿 → 進行中。
  // 同狀態用起始日排序，讓使用者先看到日期較早、較需要處理的任務。
  function statusRank(t) {
    if (taskStatus(t).label === "已截止") return 0;
    const isFull = !!t.max_signups && headcountForTask(t) >= t.max_signups;
    return isFull ? 1 : 2;
  }

  function startDateValue(t) {
    return t.start_date || "9999-12-31";
  }

  function sortTasks(list) {
    return [...list].sort((a, b) => {
      const rankDiff = statusRank(a) - statusRank(b);
      if (rankDiff !== 0) return rankDiff;
      const dateDiff = startDateValue(a).localeCompare(startDateValue(b));
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  const sortedTasks = sortTasks(tasks);

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
        setTasks((prev) => sortTasks([...prev, removedTask]));
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

        {tasks.length > 0 && (
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1.5 px-1 py-0.5">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 進行中
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 已額滿
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> 已結束
            </span>
          </div>
        )}

        {tasks.length === 0 && (
          <EmptyState icon={<ClipboardList size={30} />} title="還沒有任務" desc="點擊上方「建立任務」開始建立第一個接龍吧。" />
        )}
        {sortedTasks.map((t) => (
          <div key={t.id} className="rounded-2xl bg-white">
            <div className="mb-1.5 px-3 text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={12} /> {formatDateRange(t)}
              </span>
            </div>
            <TaskListCard
              task={t}
              signups={signupsByTask[t.id] || []}
              accessToken={profile.accessToken}
              onEdit={() => router.push(`/my-tasks/${t.id}/edit`)}
              onShare={() => router.push(`/create/share/${t.id}`)}
              onDelete={() => handleDelete(t.id)}
            />
          </div>
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
