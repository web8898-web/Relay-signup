"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle, MoreVertical, Edit2, Share2, Calendar, Users, Download,
  FileSpreadsheet, FileText, Bell, BellOff, ClipboardCheck, Check,
  RotateCcw, Copy, CheckCircle2, Search, X, Undo2, ChevronDown,
} from "lucide-react";
import { taskStatus, chipClass, avatarClass, relTime, batchInfoFor, isQueueTask as isQueueTaskConfig } from "@/lib/utils";
import { getOwnerToken } from "@/lib/ownerToken";
import { liff } from "@/lib/liff";

const EXPAND_EVENT = "relay-task-card-stable-expand";

export default function TaskListCardStable({ task, signups = [], accessToken, onEdit, onDelete, onShare }) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filter, setFilter] = useState("全部");
  const [searchText, setSearchText] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(task.notify_enabled !== false);
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [checkinMode, setCheckinMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [processingId, setProcessingId] = useState(null);
  const [lastCompletedId, setLastCompletedId] = useState(null);
  const [confirmCompleteAll, setConfirmCompleteAll] = useState(false);
  const [showResetAction, setShowResetAction] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const cardRef = useRef(null);

  const st = taskStatus(task);
  const signupCount = signups.length;
  const isClosed = st.label === "已截止";
  const isQueueTask = isQueueTaskConfig(task);
  const showSearch = !isQueueTask && signups.length > 0;

  useEffect(() => {
    function closeOtherCard(event) {
      if (event.detail?.taskId === task.id) return;
      setExpanded(false);
      setMenuOpen(false);
      setConfirmDelete(false);
      setCheckinMode(false);
      setConfirmCompleteAll(false);
      setShowResetAction(false);
    }
    window.addEventListener(EXPAND_EVENT, closeOtherCard);
    return () => window.removeEventListener(EXPAND_EVENT, closeOtherCard);
  }, [task.id]);

  useEffect(() => {
    if (!expanded) return;
    setCheckedIds(new Set(signups.filter((s) => s.checked_in).map((s) => s.id)));
  }, [expanded, signups]);

  useEffect(() => {
    if (!isQueueTask) return;
    setSearchText("");
    setFilter("全部");
  }, [isQueueTask]);

  useEffect(() => {
    if (!expanded) {
      setCheckinMode(false);
      setExportOpen(false);
      return;
    }
    const timer = setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
    return () => clearTimeout(timer);
  }, [expanded]);

  function toggleExpand(e) {
    e?.stopPropagation?.();
    if (expanded) {
      setExpanded(false);
      setCheckinMode(false);
      return;
    }
    window.dispatchEvent(new CustomEvent(EXPAND_EVENT, { detail: { taskId: task.id } }));
    setMenuOpen(false);
    setConfirmDelete(false);
    setExpanded(true);
  }

  async function toggleNotify(e) {
    e.stopPropagation();
    if (notifyBusy || isQueueTask) return;
    const next = !notifyEnabled;
    setNotifyEnabled(next);
    setNotifyBusy(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ notify_enabled: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setNotifyEnabled(!next);
    }
    setNotifyBusy(false);
  }

  function openExportUrl(format) {
    const url = `${window.location.origin}/api/tasks/${task.id}/export?format=${format}`;
    try {
      if (liff.isInClient && liff.isInClient()) {
        liff.openWindow({ url, external: true });
        return;
      }
    } catch {}
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function saveCheckin(signupId, checkedIn) {
    const headers = { "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(`/api/signups/${signupId}/checkin`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ owner_token: getOwnerToken(), checked_in: checkedIn }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "處理失敗");
    }
    return res.json();
  }

  async function toggleCheckin(signup) {
    const next = !checkedIds.has(signup.id);
    setCheckedIds((prev) => {
      const copy = new Set(prev);
      next ? copy.add(signup.id) : copy.delete(signup.id);
      return copy;
    });
    try {
      await saveCheckin(signup.id, next);
    } catch {
      setCheckedIds((prev) => {
        const copy = new Set(prev);
        next ? copy.delete(signup.id) : copy.add(signup.id);
        return copy;
      });
    }
  }

  async function completeFirstWaiting() {
    if (processingId) return;
    const firstWaiting = signups.find((s) => !checkedIds.has(s.id));
    if (!firstWaiting) return;
    setProcessingId(firstWaiting.id);
    setCheckedIds((prev) => new Set([...prev, firstWaiting.id]));
    try {
      await saveCheckin(firstWaiting.id, true);
      setLastCompletedId(firstWaiting.id);
    } catch {
      setCheckedIds((prev) => {
        const copy = new Set(prev);
        copy.delete(firstWaiting.id);
        return copy;
      });
    }
    setProcessingId(null);
  }

  async function undoLastCompletion(e) {
    e?.stopPropagation?.();
    if (processingId) return;
    const targetId = lastCompletedId || [...signups].reverse().find((s) => checkedIds.has(s.id))?.id;
    if (!targetId) return;
    setProcessingId(targetId);
    setCheckedIds((prev) => {
      const copy = new Set(prev);
      copy.delete(targetId);
      return copy;
    });
    try {
      await saveCheckin(targetId, false);
      setLastCompletedId(null);
    } catch {
      setCheckedIds((prev) => new Set([...prev, targetId]));
    }
    setProcessingId(null);
  }

  async function setAllCheckin(value) {
    const targets = signups.filter((s) => checkedIds.has(s.id) !== value);
    const original = new Set(checkedIds);
    setCheckedIds(value ? new Set(signups.map((s) => s.id)) : new Set());
    try {
      await Promise.all(targets.map((s) => saveCheckin(s.id, value)));
      setLastCompletedId(null);
    } catch {
      setCheckedIds(original);
    }
    setConfirmCompleteAll(false);
    setShowResetAction(false);
  }

  function handleSignupRowClick(e, signup) {
    e.stopPropagation();
    if (!checkinMode) return;
    if (isQueueTask) return void completeFirstWaiting();
    toggleCheckin(signup);
  }

  const orderNumber = {};
  const waitingOrderNumber = {};
  signups.forEach((s, i) => { orderNumber[s.id] = i + 1; });
  signups.filter((s) => !checkedIds.has(s.id)).forEach((s, i) => { waitingOrderNumber[s.id] = i + 1; });
  const firstWaitingId = signups.find((s) => !checkedIds.has(s.id))?.id;

  const batchInfoList = batchInfoFor(signups);
  const batchColorById = {};
  signups.forEach((s, i) => { if (batchInfoList[i]) batchColorById[s.id] = batchInfoList[i].color; });

  const headcount = task.quantity_unit
    ? signups.reduce((sum, s) => sum + (s.category_quantities && Object.keys(s.category_quantities).length
      ? Object.values(s.category_quantities).reduce((a, b) => a + (b || 0), 0)
      : (s.quantity ?? 1)), 0)
    : signups.length;
  const isFull = !isClosed && !!task.max_signups && headcount >= task.max_signups;
  const checkedCount = checkedIds.size;
  const waitingCount = Math.max(0, signups.length - checkedCount);
  const canProcessList = signups.length > 0 && (isQueueTask || isClosed);

  const categoryCounts = {};
  for (const signup of signups) for (const category of signup.categories || []) categoryCounts[category] = (categoryCounts[category] || 0) + 1;

  const filteredSignups = useMemo(() => {
    const keyword = isQueueTask ? "" : searchText.trim().toLowerCase();
    let list = isQueueTask || filter === "全部" ? signups : signups.filter((s) => s.categories?.includes(filter));
    if (keyword) list = list.filter((s) => [s.name, s.note, ...(s.categories || [])].filter(Boolean).join(" ").toLowerCase().includes(keyword));
    if (isQueueTask && checkinMode) list = [...list].sort((a, b) => Number(checkedIds.has(a.id)) - Number(checkedIds.has(b.id)) || new Date(a.created_at) - new Date(b.created_at));
    return list;
  }, [filter, searchText, signups, checkedIds, checkinMode, isQueueTask]);

  return (
    <div ref={cardRef} className="relative scroll-mt-4">
      <div className={`relative rounded-2xl border bg-white transition-all overflow-visible ${expanded ? "border-emerald-100 shadow-lg" : "border-gray-100 shadow-sm"}`}>
        <div className="w-full px-4 py-3 flex items-center gap-1.5">
          <button type="button" onClick={toggleExpand} className="flex items-center gap-3 flex-1 min-w-0 text-left">
            <div className={`w-9 h-9 rounded-full ${isClosed ? "bg-gray-400" : isFull ? "bg-rose-500" : "bg-emerald-500"} text-white flex items-center justify-center shrink-0`}><MessageCircle size={16} /></div>
            <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 truncate">{task.title}</p>{!expanded && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{st.label} · {signupCount} 人已報名</p>}</div>
          </button>
          {!isQueueTask && <button onClick={toggleNotify} className={`w-7 h-7 flex items-center justify-center ${notifyEnabled ? "text-emerald-500" : "text-gray-300"}`}>{notifyEnabled ? <Bell size={16} /> : <BellOff size={16} />}</button>}
          <button onClick={(e) => { e.stopPropagation(); onShare?.(); }} className="w-7 h-7 flex items-center justify-center text-gray-400"><Share2 size={16} /></button>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }} className="w-7 h-7 flex items-center justify-center text-gray-400"><MoreVertical size={17} /></button>
            {menuOpen && <div className="absolute right-0 top-9 z-30 w-36 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl">
              <button onClick={(e) => { e.stopPropagation(); onEdit?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50"><Edit2 size={14} /> 編輯任務</button>
              {!confirmDelete ? <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }} className="w-full px-3 py-2 text-sm text-rose-500 rounded-lg hover:bg-rose-50">移除</button> : <div className="p-2 text-center"><p className="text-xs text-gray-500 mb-2">確定移除？</p><div className="flex gap-2"><button onClick={(e) => { e.stopPropagation(); onDelete?.(); setMenuOpen(false); }} className="flex-1 text-sm text-rose-500">是</button><button onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }} className="flex-1 text-sm text-gray-500">否</button></div></div>}
            </div>}
          </div>
        </div>

        <div className={`grid transition-[grid-template-rows] duration-300 ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}><div className="overflow-hidden"><div className="px-4 pb-4">
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl px-3.5 py-3 mb-3">
            <div className="flex items-center justify-between mb-1.5"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${isFull ? "bg-rose-100 text-rose-600 border-rose-200" : st.cls}`}>{isFull ? "已額滿" : st.label}</span>{isQueueTask && <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-100 bg-sky-50 text-sky-600">現場排隊</span>}</div>
            {task.description && <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{task.description}</p>}
            <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-gray-400"><span className="flex items-center gap-1"><Calendar size={12} />{task.start_date} ~ {task.end_date}</span><span className="flex items-center gap-1"><Users size={12} />{signupCount} 人已報名</span></div>
            {task.note && <p className="text-xs text-gray-400 mt-2 border-t border-emerald-100 pt-2 whitespace-pre-wrap">備註：{task.note}</p>}
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <p className="text-[11px] font-medium text-gray-400">報名名單</p>
              {signups.length > 0 && (
                <button onClick={(e) => { e.stopPropagation(); setExportOpen((v) => !v); }} className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-500 transition active:scale-95" aria-expanded={exportOpen}>
                  <Download size={11} /> 匯出名單 <ChevronDown size={11} className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
            {signups.length > 0 && exportOpen && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-2.5 mb-2.5"><div className="flex gap-2"><button onClick={(e) => { e.stopPropagation(); openExportUrl("csv"); }} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-emerald-200 rounded-full py-2 text-xs text-emerald-600"><FileSpreadsheet size={14} /> CSV（Excel）</button><button onClick={(e) => { e.stopPropagation(); openExportUrl("txt"); }} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-emerald-200 rounded-full py-2 text-xs text-emerald-600"><FileText size={14} /> 文字檔</button></div></div>
            )}
            {showSearch && <div className="relative mb-2.5"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" /><input value={searchText} onClick={(e) => e.stopPropagation()} onChange={(e) => setSearchText(e.target.value)} placeholder="搜尋姓名、備註或分類" className="w-full rounded-full border border-gray-100 bg-gray-50 py-2 pl-9 pr-9 text-xs outline-none" />{searchText && <button onClick={(e) => { e.stopPropagation(); setSearchText(""); }} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={13} /></button>}</div>}

            {canProcessList && !checkinMode && <button onClick={(e) => { e.stopPropagation(); setCheckinMode(true); }} className="w-full mb-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-emerald-500 rounded-full py-2.5"><ClipboardCheck size={15} /> {isQueueTask ? "開始處理名單" : "開始點名報到"}</button>}

            {canProcessList && checkinMode && <div className="bg-white border border-emerald-200 rounded-xl p-2.5 mb-2 shadow-sm">
              <div className="flex items-center justify-between mb-1.5"><span className="text-[11px] font-semibold text-gray-700">{isQueueTask ? "已完成" : "已報到"} <span className="text-emerald-600">{checkedCount}</span> / {signups.length} 位 {waitingCount > 0 && <span className="text-gray-400 font-normal">（{isQueueTask ? "等待" : "未到"} {waitingCount}）</span>}</span><button onClick={(e) => { e.stopPropagation(); setCheckinMode(false); }} className="text-[11px] text-gray-400">完成</button></div>
              <div className="h-1.5 rounded-full overflow-hidden bg-emerald-100 mb-2"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${signups.length ? checkedCount / signups.length * 100 : 0}%` }} /></div>
              {isQueueTask ? <>
                <div className="grid grid-cols-3 gap-1.5">
                  <button disabled={!firstWaitingId || !!processingId} onClick={(e) => { e.stopPropagation(); completeFirstWaiting(); }} className="text-[10px] text-white bg-emerald-500 rounded-full px-2 py-1.5 disabled:opacity-40 flex items-center justify-center gap-1"><CheckCircle2 size={11} /> 完成下一位</button>
                  <button disabled={checkedCount === 0 || !!processingId} onClick={undoLastCompletion} className="text-[10px] text-sky-600 border border-sky-200 rounded-full px-2 py-1.5 disabled:opacity-40 flex items-center justify-center gap-1"><Undo2 size={11} /> 上一步</button>
                  <button disabled={waitingCount === 0} onClick={(e) => { e.stopPropagation(); setConfirmCompleteAll(true); }} className="text-[10px] text-emerald-600 border border-emerald-200 rounded-full px-2 py-1.5 disabled:opacity-40 flex items-center justify-center gap-1"><Check size={11} /> 全部完成</button>
                </div>
                {confirmCompleteAll && <div className="mt-2 rounded-xl bg-amber-50 border border-amber-100 p-2"><p className="text-[10px] text-amber-700 text-center">確定將目前等待中的 {waitingCount} 位全部設為完成嗎？</p><div className="flex gap-2 mt-2"><button onClick={(e) => { e.stopPropagation(); setConfirmCompleteAll(false); }} className="flex-1 text-[10px] py-1.5 rounded-full bg-white border border-gray-200 text-gray-500">取消</button><button onClick={(e) => { e.stopPropagation(); setAllCheckin(true); }} className="flex-1 text-[10px] py-1.5 rounded-full bg-emerald-500 text-white">確定完成</button></div></div>}
                <p className="text-[9px] sm:text-[10px] text-gray-400 mt-2 text-center whitespace-nowrap overflow-hidden">點擊任何名單，只會完成目前第一位。</p>
                <div className="mt-2 text-right"><button onClick={(e) => { e.stopPropagation(); setShowResetAction((v) => !v); }} className="text-[9px] text-gray-300">更多操作</button>{showResetAction && <button onClick={(e) => { e.stopPropagation(); setAllCheckin(false); }} className="ml-2 text-[9px] text-rose-400 underline">重設全部</button>}</div>
              </> : <div className="flex flex-wrap gap-1.5"><button onClick={(e) => { e.stopPropagation(); setAllCheckin(true); }} className="text-[10px] text-emerald-600 border border-emerald-200 rounded-full px-2 py-0.5">全部已到</button><button onClick={(e) => { e.stopPropagation(); setAllCheckin(false); }} className="text-[10px] text-gray-500 border border-gray-200 rounded-full px-2 py-0.5"><RotateCcw size={11} className="inline" /> 重設</button><button onClick={(e) => { e.stopPropagation(); const absent = signups.filter((s) => !checkedIds.has(s.id)).map((s) => s.name); navigator.clipboard?.writeText(`未報到（${absent.length} 位）：\n${absent.join("、")}`); }} className="text-[10px] text-gray-500 border border-gray-200 rounded-full px-2 py-0.5"><Copy size={11} className="inline" /> 複製未到名單</button></div>}
            </div>}

            {!isQueueTask && task.categories?.length > 0 && <div className="flex gap-1.5 overflow-x-auto pb-2"><button onClick={(e) => { e.stopPropagation(); setFilter("全部"); }} className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border ${filter === "全部" ? "bg-emerald-700 text-white" : "bg-gray-50 text-gray-500"}`}>全部 {signupCount}</button>{task.categories.map((c) => <button key={c} onClick={(e) => { e.stopPropagation(); setFilter(c); }} className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border ${filter === c ? "bg-emerald-700 text-white" : "bg-gray-50 text-gray-500"}`}>{c} {categoryCounts[c] || 0}</button>)}</div>}

            {filteredSignups.length === 0 ? <p className="text-xs text-gray-300 text-center py-4">還沒有人報名</p> : <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">{filteredSignups.map((s, i) => {
              const done = checkedIds.has(s.id);
              const isFirstWaiting = firstWaitingId === s.id;
              return <div key={s.id || i} onClick={checkinMode ? (e) => handleSignupRowClick(e, s) : undefined} className={`relative flex items-start gap-2 border rounded-xl px-3 py-2 transition ${checkinMode ? `cursor-pointer ${done ? "bg-emerald-50 border-emerald-200" : isQueueTask && isFirstWaiting ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-100"}` : "bg-gray-50 border-gray-100"}`}>
                {checkinMode ? <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${done || (isQueueTask && isFirstWaiting) ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-gray-300 text-transparent"}`}><Check size={13} /></div> : <div className={`w-6 h-6 rounded-full ${avatarClass(s.name)} text-white flex items-center justify-center text-[10px] font-bold`}>{s.name?.[0] || "?"}</div>}
                <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 flex-wrap"><span className="shrink-0 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">{checkinMode && isQueueTask && done ? "完成" : checkinMode && isQueueTask ? waitingOrderNumber[s.id] : orderNumber[s.id]}</span><span className="text-xs font-medium text-gray-700 truncate">{s.name}</span>{checkinMode && isQueueTask && isFirstWaiting && !done && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">目前第一位</span>}{s.categories?.map((c) => <span key={c} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${chipClass(c)}`}>{c}</span>)}<span className="text-[10px] text-gray-300 ml-auto">{done && isQueueTask ? "已完成" : relTime(s.created_at)}</span></div>{s.note && <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>}</div>
              </div>;
            })}</div>}
          </div>

          <div className="flex gap-2"><button onClick={(e) => { e.stopPropagation(); onShare?.(); }} className="flex-1 border border-emerald-200 text-emerald-600 rounded-full py-2.5 font-semibold flex items-center justify-center gap-1.5"><Share2 size={16} /> 分享</button><button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="flex-1 bg-emerald-500 text-white rounded-full py-2.5 font-semibold flex items-center justify-center gap-1.5"><Edit2 size={16} /> 編輯任務</button></div>
        </div></div></div>
      </div>
    </div>
  );
}
