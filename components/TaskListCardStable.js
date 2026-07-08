"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  MoreVertical,
  Edit2,
  Share2,
  Calendar,
  Users,
  Download,
  FileSpreadsheet,
  FileText,
  Bell,
  BellOff,
  ClipboardCheck,
  Check,
  RotateCcw,
  Copy,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";
import { taskStatus, chipClass, avatarClass, relTime, batchInfoFor } from "@/lib/utils";
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
  const cardRef = useRef(null);

  const checkinStorageKey = `relay_checkin_${task.id}`;

  useEffect(() => {
    function closeOtherCard(event) {
      if (event.detail?.taskId === task.id) return;
      setExpanded(false);
      setMenuOpen(false);
      setConfirmDelete(false);
      setCheckinMode(false);
    }
    window.addEventListener(EXPAND_EVENT, closeOtherCard);
    return () => window.removeEventListener(EXPAND_EVENT, closeOtherCard);
  }, [task.id]);

  useEffect(() => {
    if (!expanded) return;
    try {
      const saved = JSON.parse(localStorage.getItem(checkinStorageKey) || "null");
      if (Array.isArray(saved)) {
        setCheckedIds(new Set(saved));
        return;
      }
    } catch (e) {}
    setCheckedIds(new Set(signups.filter((s) => s.checked_in).map((s) => s.id)));
  }, [expanded, checkinStorageKey, signups]);

  useEffect(() => {
    if (!expanded) {
      setCheckinMode(false);
      return;
    }
    const t = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }, 120);
    return () => clearTimeout(t);
  }, [expanded]);

  function persistCheckedIds(ids) {
    try {
      localStorage.setItem(checkinStorageKey, JSON.stringify([...ids]));
    } catch (e) {}
  }

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
    if (notifyBusy) return;
    const next = !notifyEnabled;
    setNotifyEnabled(next);
    setNotifyBusy(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
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
    } catch (e) {}
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleExportCsv(e) {
    e.stopPropagation();
    openExportUrl("csv");
  }

  function handleExportTxt(e) {
    e.stopPropagation();
    openExportUrl("txt");
  }

  function headcountOf(s) {
    if (s.category_quantities && Object.keys(s.category_quantities).length > 0) {
      return Object.values(s.category_quantities).reduce((a, b) => a + (b || 0), 0);
    }
    return s.quantity ?? 1;
  }

  async function saveCheckin(signupId, checkedIn) {
    await fetch(`/api/signups/${signupId}/checkin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner_token: getOwnerToken(), checked_in: checkedIn }),
    });
  }

  async function toggleCheckin(s) {
    const next = !checkedIds.has(s.id);
    setCheckedIds((prev) => {
      const n = new Set(prev);
      if (next) n.add(s.id);
      else n.delete(s.id);
      persistCheckedIds(n);
      return n;
    });
    try {
      await saveCheckin(s.id, next);
    } catch (e) {}
  }

  async function setAllCheckin(value) {
    const targets = signups.filter((s) => checkedIds.has(s.id) !== value);
    const nextIds = value ? new Set(signups.map((s) => s.id)) : new Set();
    setCheckedIds(nextIds);
    persistCheckedIds(nextIds);
    await Promise.all(targets.map((s) => saveCheckin(s.id, value).catch(() => {})));
  }

  function copyAbsentList(e) {
    e?.stopPropagation?.();
    const absent = signups.filter((s) => !checkedIds.has(s.id)).map((s) => s.name);
    if (absent.length === 0) return;
    navigator.clipboard?.writeText(`未報到（${absent.length} 位）：\n${absent.join("、")}`);
  }

  const st = taskStatus(task);
  const signupCount = signups.length;
  const orderNumber = {};
  signups.forEach((s, i) => {
    orderNumber[s.id] = i + 1;
  });

  const batchInfoList = batchInfoFor(signups);
  const batchColorById = {};
  signups.forEach((s, i) => {
    if (batchInfoList[i]) batchColorById[s.id] = batchInfoList[i].color;
  });

  const headcount = task.quantity_unit
    ? signups.reduce((sum, s) => sum + headcountOf(s), 0)
    : signups.length;
  const isClosed = st.label === "已截止";
  const isFull = !isClosed && !!task.max_signups && headcount >= task.max_signups;
  const iconBg = isClosed ? "bg-gray-400" : isFull ? "bg-rose-500" : "bg-emerald-500";
  const checkedCount = checkedIds.size;

  const NO_CATEGORY = "__no_category__";
  const categoryCounts = {};
  let noCategoryCount = 0;
  for (const s of signups) {
    if (s.categories?.length > 0) {
      s.categories.forEach((c) => {
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      });
    } else {
      noCategoryCount += 1;
    }
  }

  const filteredSignups = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    const byCategory =
      filter === "全部"
        ? signups
        : filter === NO_CATEGORY
        ? signups.filter((s) => !s.categories || s.categories.length === 0)
        : signups.filter((s) => s.categories?.includes(filter));

    if (!keyword) return byCategory;
    return byCategory.filter((s) => {
      const text = [
        s.name,
        s.note,
        ...(s.categories || []),
        String(orderNumber[s.id] || ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(keyword);
    });
  }, [filter, searchText, signups]);

  return (
    <div ref={cardRef} className="relative scroll-mt-4">
      <div className={`relative rounded-2xl border bg-white transition-all duration-250 overflow-visible ${expanded ? "border-emerald-100 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.55)]" : "border-gray-100 shadow-sm"}`}>
        <div className="w-full px-4 py-3 flex items-center gap-1.5">
          <button type="button" onClick={toggleExpand} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer">
            <div className={`w-9 h-9 rounded-full ${iconBg} text-white flex items-center justify-center shrink-0`}>
              <MessageCircle size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{task.title}</p>
              {!expanded && (
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {st.label} · {signupCount} 人已報名
                </p>
              )}
            </div>
          </button>

          <button onClick={toggleNotify} className={`w-7 h-7 flex items-center justify-center shrink-0 transition ${notifyEnabled ? "text-emerald-500" : "text-gray-300"}`} title={notifyEnabled ? "已開啟報名通知" : "已關閉報名通知"}>
            {notifyEnabled ? <Bell size={16} /> : <BellOff size={16} />}
          </button>

          <button onClick={(e) => { e.stopPropagation(); onShare?.(); }} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-emerald-500 shrink-0" title="分享">
            <Share2 size={16} />
          </button>

          <div className="relative shrink-0">
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); setConfirmDelete(false); }} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <MoreVertical size={17} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20 w-44">
                {!confirmDelete ? (
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }} className="w-full text-center px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-50 rounded-lg">
                    移除
                  </button>
                ) : (
                  <div className="px-3 py-3">
                    <p className="text-xs text-gray-500 mb-2.5 text-center">確定移除？</p>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); onDelete?.(); setMenuOpen(false); }} className="flex-1 text-sm text-rose-500 font-medium py-2 rounded-lg hover:bg-rose-50">
                        是
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }} className="flex-1 text-sm text-gray-500 py-2 rounded-lg hover:bg-gray-50">
                        否
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="px-4 pb-4">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl px-3.5 py-3 mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isFull ? "bg-rose-100 text-rose-600 border-rose-200" : st.cls}`}>
                    {isFull ? "已額滿" : st.label}
                  </span>
                </div>
                {task.description && <p className="text-sm text-gray-600 leading-relaxed mb-2 whitespace-pre-wrap">{task.description}</p>}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1"><Calendar size={12} />{task.start_date} ~ {task.end_date}</span>
                  <span className="flex items-center gap-1"><Users size={12} />{signupCount} 人已報名</span>
                </div>
                {task.note && <p className="text-xs text-gray-400 mt-2 border-t border-emerald-100 pt-2 whitespace-pre-wrap">備註：{task.note}</p>}
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between gap-2 mb-1.5 px-0.5">
                  <p className="text-[11px] font-medium text-gray-400">報名名單</p>
                  {searchText && <p className="text-[11px] text-emerald-500">找到 {filteredSignups.length} 位</p>}
                </div>

                {signups.length > 0 && (
                  <div className="relative mb-2.5">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      value={searchText}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="搜尋姓名、備註或分類"
                      className="w-full rounded-full border border-gray-100 bg-gray-50 py-2 pl-9 pr-9 text-xs text-gray-600 outline-none focus:border-emerald-200 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition"
                    />
                    {searchText && (
                      <button onClick={(e) => { e.stopPropagation(); setSearchText(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-gray-300 hover:text-gray-500 flex items-center justify-center">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                )}

                {isClosed && signups.length > 0 && !checkinMode && (
                  <button onClick={(e) => { e.stopPropagation(); setCheckinMode(true); }} className="w-full mb-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] rounded-full py-2.5 shadow-sm shadow-emerald-200 transition">
                    <ClipboardCheck size={15} /> 開始點名報到
                  </button>
                )}

                {isClosed && checkinMode && (
                  <div className="bg-white border border-emerald-200 rounded-xl p-2.5 mb-2 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-gray-700">
                        已報到 <span className="text-emerald-600">{checkedCount}</span> / {signups.length} 位
                        {signups.length - checkedCount > 0 && <span className="text-gray-400 font-normal">（未到 {signups.length - checkedCount}）</span>}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); setCheckinMode(false); }} className="text-[11px] text-gray-400 hover:text-gray-600 px-1">完成</button>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-emerald-100 mb-2">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${signups.length ? (checkedCount / signups.length) * 100 : 0}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); setAllCheckin(true); }} className="text-[10px] text-emerald-600 border border-emerald-200 rounded-full px-2 py-0.5 hover:bg-emerald-50 flex items-center gap-1"><CheckCircle2 size={11} /> 全部已到</button>
                      <button onClick={(e) => { e.stopPropagation(); setAllCheckin(false); }} className="text-[10px] text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 hover:bg-gray-50 flex items-center gap-1"><RotateCcw size={11} /> 重設</button>
                      <button onClick={copyAbsentList} className="text-[10px] text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 hover:bg-gray-50 flex items-center gap-1"><Copy size={11} /> 複製未到名單</button>
                    </div>
                  </div>
                )}

                {task.categories?.length > 0 && (
                  <div className="relative -mx-0.5">
                    <div className="flex gap-1.5 overflow-x-auto pb-2 px-0.5">
                      <button onClick={(e) => { e.stopPropagation(); setFilter("全部"); }} className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border ${filter === "全部" ? "bg-emerald-700 text-white border-emerald-700" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                        全部 <span className={`ml-1 ${filter === "全部" ? "text-white/70" : "text-gray-400"}`}>{signupCount}</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setFilter(NO_CATEGORY); }} className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border ${filter === NO_CATEGORY ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-emerald-600/70 border-emerald-200 border-dashed"}`}>
                        沒選類別 <span className={`ml-1 ${filter === NO_CATEGORY ? "text-white/70" : "text-emerald-400"}`}>{noCategoryCount}</span>
                      </button>
                      {task.categories.map((c) => (
                        <button key={c} onClick={(e) => { e.stopPropagation(); setFilter(c); }} className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border ${filter === c ? "bg-emerald-700 text-white border-emerald-700" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          {c} <span className={`ml-1 ${filter === c ? "text-white/70" : "opacity-60"}`}>{categoryCounts[c] || 0}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredSignups.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center py-4">{signups.length === 0 ? "還沒有人報名" : searchText ? "找不到符合的報名者" : "這個分類還沒有人報名"}</p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-0.5">
                    {filteredSignups.map((s, i) => (
                      <div key={s.id || i} onClick={checkinMode ? (e) => { e.stopPropagation(); toggleCheckin(s); } : undefined} className={`relative overflow-hidden flex items-start gap-2 border rounded-xl px-3 py-2 transition ${batchColorById[s.id] ? "pl-3.5" : ""} ${checkinMode ? `cursor-pointer select-none active:scale-[0.99] ${checkedIds.has(s.id) ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-100"}` : "bg-gray-50 border-gray-100"}`}>
                        {batchColorById[s.id] && <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full opacity-60 ${batchColorById[s.id]}`} aria-hidden="true" />}
                        {checkinMode ? (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition ${checkedIds.has(s.id) ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-gray-300 text-transparent"}`} aria-hidden="true">
                            <Check size={13} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className={`w-6 h-6 rounded-full ${avatarClass(s.name)} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                            {s.name?.[0] || "?"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="shrink-0 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">{orderNumber[s.id]}</span>
                            <span className="text-xs font-medium text-gray-700 truncate">{s.name}</span>
                            {s.categories?.map((c) => (
                              <span key={c} className={`text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap ${chipClass(c)}`}>
                                {c}{s.category_quantities?.[c] != null && ` · ${s.category_quantities[c]}${task.quantity_unit || ""}`}
                              </span>
                            ))}
                            {s.quantity != null && !(s.category_quantities && Object.keys(s.category_quantities).length > 0) && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap">
                                {s.quantity} {task.quantity_unit || ""}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-300 ml-auto shrink-0">{relTime(s.created_at)}</span>
                          </div>
                          {s.note && <p className="text-xs text-gray-500 mt-0.5 break-words">{s.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {signups.length > 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-3">
                  <p className="text-[11px] font-medium text-gray-400 mb-2 flex items-center gap-1"><Download size={12} /> 匯出名單</p>
                  <div className="flex gap-2">
                    <button onClick={handleExportCsv} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-emerald-200 rounded-full py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition">
                      <FileSpreadsheet size={14} /> CSV（Excel）
                    </button>
                    <button onClick={handleExportTxt} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-emerald-200 rounded-full py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition">
                      <FileText size={14} /> 文字檔
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); onShare?.(); }} className="flex-1 border border-emerald-200 text-emerald-600 rounded-full py-2.5 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-50 transition">
                  <Share2 size={15} /> 分享
                </button>
                <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-2.5 font-semibold flex items-center justify-center gap-2 transition">
                  <Edit2 size={15} /> 編輯任務
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
