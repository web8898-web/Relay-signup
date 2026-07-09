"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Bell, ChevronUp, ChevronDown, CalendarDays, Search, X, Trash2, Check } from "lucide-react";
import { EmptyState } from "@/components/TopBar";
import Toast from "@/components/Toast";
import LoadingBubble from "@/components/LoadingBubble";
import FadeIn from "@/components/FadeIn";
import TaskListCard from "@/components/TaskListCardStable";
import { useOrganizerProfile } from "@/lib/OrganizerContext";
import { supabase } from "@/lib/supabaseClient";
import { isHeadcountUnit, taskStatus } from "@/lib/utils";

const FRIEND_ADD_URL = "https://line.me/R/ti/p/%40085uqqfg";
const FRIEND_BANNER_KEY = "friendBannerExpanded";
const TASK_CARD_EXPAND_EVENT = "relay-task-card-stable-expand";
const TASK_SWITCH_DELAY_MS = 340;

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
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState(() => new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [portalReady, setPortalReady] = useState(false);
  const pendingSwitchTimerRef = useRef(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!confirmBulkDelete || typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [confirmBulkDelete]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(FRIEND_BANNER_KEY) : null;
    if (saved !== null) setFriendBannerExpanded(saved === "1");
  }, []);

  useEffect(() => {
    function rememberExpandedCard(event) {
      setExpandedTaskId(event.detail?.taskId || null);
    }
    window.addEventListener(TASK_CARD_EXPAND_EVENT, rememberExpandedCard);
    return () => {
      window.removeEventListener(TASK_CARD_EXPAND_EVENT, rememberExpandedCard);
      if (pendingSwitchTimerRef.current) clearTimeout(pendingSwitchTimerRef.current);
    };
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
  const filteredTasks = useMemo(() => {
    const keyword = taskSearch.trim().toLowerCase();
    if (!keyword) return sortedTasks;
    return sortedTasks.filter((t) => {
      const text = [t.title, t.description, t.note, t.start_date, t.end_date, ...(t.categories || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(keyword);
    });
  }, [taskSearch, tasks, signupsByTask]);

  const selectedCount = selectedTaskIds.size;
  const allVisibleSelected = filteredTasks.length > 0 && filteredTasks.every((t) => selectedTaskIds.has(t.id));

  function enterEditMode() {
    setEditMode(true);
    setExpandedTaskId(null);
    setConfirmBulkDelete(false);
    window.dispatchEvent(new CustomEvent(TASK_CARD_EXPAND_EVENT, { detail: { taskId: null } }));
  }

  function leaveEditMode() {
    setEditMode(false);
    setConfirmBulkDelete(false);
    setSelectedTaskIds(new Set());
  }

  function toggleTaskSelected(taskId) {
    setConfirmBulkDelete(false);
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setConfirmBulkDelete(false);
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filteredTasks.forEach((t) => next.delete(t.id));
      else filteredTasks.forEach((t) => next.add(t.id));
      return next;
    });
  }

  function shouldDelayTaskSwitch(event) {
    const target = event.target;
    if (!(target instanceof Element)) return false;
    if (target.closest("input, textarea, select, a")) return false;
    const button = target.closest("button");
    if (!button) return true;
    return String(button.className || "").includes("flex-1");
  }

  function handleTaskClickCapture(event, taskId) {
    if (editMode) return;
    if (!expandedTaskId || expandedTaskId === taskId) return;
    if (!shouldDelayTaskSwitch(event)) return;

    event.preventDefault();
    event.stopPropagation();

    if (pendingSwitchTimerRef.current) clearTimeout(pendingSwitchTimerRef.current);

    setExpandedTaskId(null);
    window.dispatchEvent(new CustomEvent(TASK_CARD_EXPAND_EVENT, { detail: { taskId: null } }));

    const cardWrapper = event.currentTarget;
    pendingSwitchTimerRef.current = setTimeout(() => {
      const primaryButton = cardWrapper.querySelector('button[type="button"]');
      primaryButton?.click();
    }, TASK_SWITCH_DELAY_MS);
  }

  async function handleDelete(taskId) {
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
      if (removedTask) setTasks((prev) => sortTasks([...prev, removedTask]));
      showToast(e.message || "移除失敗");
    }
  }

  async function handleBulkDelete() {
    if (selectedCount === 0 || bulkDeleting) return;
    if (!confirmBulkDelete) {
      setConfirmBulkDelete(true);
      return;
    }

    const ids = [...selectedTaskIds];
    const removedTasks = tasks.filter((t) => selectedTaskIds.has(t.id));
    setBulkDeleting(true);
    setTasks((prev) => prev.filter((t) => !selectedTaskIds.has(t.id)));
    setSelectedTaskIds(new Set());
    setConfirmBulkDelete(false);

    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/tasks/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${profile.accessToken}` },
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || "移除失敗");
            }
            return true;
          })
        )
      );
      if (results.every(Boolean)) {
        showToast(`已移除 ${ids.length} 個任務`);
        setEditMode(false);
      }
    } catch (e) {
      setTasks((prev) => sortTasks([...prev, ...removedTasks]));
      showToast(e.message || "移除失敗，已復原列表");
    } finally {
      setBulkDeleting(false);
    }
  }

  const deleteDialog = confirmBulkDelete && portalReady
    ? createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/35 px-6 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-[320px] rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <Trash2 size={22} />
            </div>
            <p className="text-center text-base font-bold text-gray-800">移除任務？</p>
            <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
              確定要移除 <span className="font-semibold text-rose-500">{selectedCount}</span> 個任務嗎？<br />此動作無法復原。
            </p>
            <div className="mt-5 flex gap-2">
              <button disabled={bulkDeleting} onClick={() => setConfirmBulkDelete(false)} className="flex-1 rounded-full border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-500 disabled:opacity-50">
                取消
              </button>
              <button disabled={bulkDeleting} onClick={handleBulkDelete} className="flex-1 rounded-full bg-rose-500 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-100 disabled:opacity-50">
                {bulkDeleting ? "移除中..." : "移除"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

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
      <FadeIn className={`flex-1 px-6 py-3 flex flex-col gap-3 overflow-y-auto ${editMode ? "pb-24" : ""}`}>
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

        {tasks.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} placeholder="搜尋任務..." className="w-full rounded-full border border-gray-100 bg-gray-50 py-2 pl-9 pr-9 text-xs text-gray-600 outline-none focus:border-emerald-200 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition" />
                {taskSearch && (
                  <button onClick={() => setTaskSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-gray-300 hover:text-gray-500 flex items-center justify-center" aria-label="清除搜尋"><X size={13} /></button>
                )}
              </div>
              <button onClick={editMode ? leaveEditMode : enterEditMode} className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${editMode ? "bg-gray-100 text-gray-500" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                {editMode ? "完成" : "編輯"}
              </button>
            </div>

            <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1.5 px-1 py-0.5">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 進行中</span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 已額滿</span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> 已結束</span>
            </div>
          </>
        )}

        {tasks.length === 0 && <EmptyState icon={<ClipboardList size={30} />} title="還沒有任務" desc="點擊上方「建立任務」開始建立第一個接龍吧。" />}

        {tasks.length > 0 && filteredTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 py-8 text-center">
            <p className="text-sm font-semibold text-gray-500">找不到符合的任務</p>
            <p className="text-xs text-gray-400 mt-1">換個關鍵字試試看</p>
          </div>
        )}

        {filteredTasks.map((t) => {
          const selected = selectedTaskIds.has(t.id);
          return (
            <div key={t.id} className="rounded-2xl bg-white transition" onClickCapture={(event) => handleTaskClickCapture(event, t.id)}>
              <div className="mb-1.5 px-3 text-[11px] text-gray-400">
                <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {formatDateRange(t)}</span>
              </div>
              <div className={`relative flex items-stretch gap-1.5 transition ${editMode ? "-ml-0.5" : ""}`}>
                {editMode && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleTaskSelected(t.id); }} className="w-7 flex items-center justify-center shrink-0" aria-label={selected ? "取消選取任務" : "選取任務"}>
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${selected ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-gray-300 text-transparent"}`}><Check size={14} strokeWidth={3} /></span>
                  </button>
                )}
                <div className={`flex-1 min-w-0 transition ${editMode && selected ? "ring-2 ring-emerald-100 rounded-2xl" : ""}`}>
                  <TaskListCard task={t} signups={signupsByTask[t.id] || []} accessToken={profile.accessToken} onEdit={() => router.push(`/my-tasks/${t.id}/edit`)} onShare={() => router.push(`/create/share/${t.id}`)} onDelete={() => handleDelete(t.id)} />
                  {editMode && <button type="button" onClick={(e) => { e.stopPropagation(); toggleTaskSelected(t.id); }} className="absolute inset-y-0 left-7 right-0 rounded-2xl" aria-label="切換選取任務" />}
                </div>
              </div>
            </div>
          );
        })}
      </FadeIn>

      {editMode ? (
        <FadeIn className="px-6 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-gray-100 shadow-[0_-12px_30px_-28px_rgba(15,23,42,0.45)]">
          <div className="flex items-center gap-2 min-h-[56px]">
            <button onClick={toggleSelectAllVisible} className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-500">{allVisibleSelected ? "取消全選" : "全選"}</button>
            <div className="flex-1 text-center text-xs text-gray-400">已選取 <span className="font-semibold text-emerald-600">{selectedCount}</span> 個任務</div>
            <button disabled={selectedCount === 0} onClick={handleBulkDelete} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 transition ${selectedCount === 0 ? "bg-gray-100 text-gray-300" : "bg-rose-500 text-white shadow-sm shadow-rose-100"}`}><Trash2 size={14} /> 刪除</button>
          </div>
        </FadeIn>
      ) : (
        <FadeIn className="px-6 pb-6 pt-2">
          <button onClick={() => router.push("/create")} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition"><Plus size={18} /> 新增任務</button>
        </FadeIn>
      )}

      {deleteDialog}

      {toast && (
        <Toast className="bottom-24">
          <div className="bg-rose-500 text-white text-sm px-4 py-2 rounded-full shadow-lg whitespace-nowrap">{toast}</div>
        </Toast>
      )}
    </div>
  );
}
