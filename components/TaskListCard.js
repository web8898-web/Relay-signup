"use client";
import { useRef, useState } from "react";
import { MessageCircle, ChevronRight, MoreVertical, Edit2, Share2, Calendar, Users, Download, FileSpreadsheet, FileText, Bell, BellOff, Trash2 } from "lucide-react";
import { taskStatus, chipClass, avatarClass, relTime } from "@/lib/utils";
import { useScrollFadeRight } from "@/lib/useScrollFadeRight";
import { liff } from "@/lib/liff";

// How far (in px) the card sits when "revealed" — just far enough to make
// the trash button a comfortable tap target, not so far that it looks like
// the card has already been half-deleted.
const REVEAL_WIDTH = 84;
// Swiping past this fraction of the card's own width counts as "swiped all
// the way" and deletes immediately on release, mirroring the iOS Mail /
// Gmail full-swipe-to-delete gesture.
const DELETE_FRACTION = 0.55;

export default function TaskListCard({ task, signups = [], accessToken, onEdit, onDelete, onShare }) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filter, setFilter] = useState("全部");
  const [notifyEnabled, setNotifyEnabled] = useState(task.notify_enabled !== false);
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [filterScrollRef, filterSentinelRef, filterCanScrollRight] = useScrollFadeRight(expanded && task.categories?.length > 0);

  // --- Swipe-to-delete state ---
  const cardRef = useRef(null);
  const [dragX, setDragX] = useState(0); // 0 = closed, negative = swiped left
  const [dragging, setDragging] = useState(false);
  const [removing, setRemoving] = useState(false);
  const touchStateRef = useRef(null); // { startX, startY, cardWidth, locked, horizontal }

  function handleTouchStart(e) {
    if (removing) return;
    const t = e.touches[0];
    touchStateRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      cardWidth: cardRef.current?.offsetWidth || 320,
      baseX: dragX,
      locked: false,
      horizontal: false,
    };
  }

  function handleTouchMove(e) {
    const st = touchStateRef.current;
    if (!st) return;
    const t = e.touches[0];
    const deltaX = t.clientX - st.startX;
    const deltaY = t.clientY - st.startY;

    if (!st.locked) {
      // Wait until the gesture is clearly more horizontal than vertical
      // before committing to a swipe, so this doesn't fight with normal
      // vertical list scrolling.
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
      st.locked = true;
      st.horizontal = Math.abs(deltaX) > Math.abs(deltaY);
    }
    if (!st.horizontal) return;

    e.preventDefault();
    setDragging(true);
    const next = Math.min(0, Math.max(-st.cardWidth * 0.9, st.baseX + deltaX));
    setDragX(next);
  }

  function handleTouchEnd() {
    const st = touchStateRef.current;
    setDragging(false);
    touchStateRef.current = null;
    if (!st || !st.horizontal) return;

    const deleteThreshold = -st.cardWidth * DELETE_FRACTION;
    if (dragX <= deleteThreshold) {
      // Finish the slide-off animation locally, then hand off to the
      // parent — which now removes the task from the list immediately
      // (optimistic update) rather than waiting on the network, so there's
      // no dead pause sitting on the red background in between.
      setRemoving(true);
      setDragX(-st.cardWidth);
      setTimeout(() => onDelete?.(), 200);
    } else if (dragX <= -REVEAL_WIDTH / 2) {
      setDragX(-REVEAL_WIDTH);
    } else {
      setDragX(0);
    }
  }

  function handleTrashTap() {
    setRemoving(true);
    setDragX(-(cardRef.current?.offsetWidth || 320));
    setTimeout(() => onDelete?.(), 200);
  }

  function closeSwipe() {
    if (dragX !== 0) setDragX(0);
  }

  async function toggleNotify(e) {
    e.stopPropagation();
    if (notifyBusy) return;
    const next = !notifyEnabled;
    setNotifyEnabled(next); // optimistic
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
      setNotifyEnabled(!next); // revert on failure
    }
    setNotifyBusy(false);
  }

  // LINE's in-app browser often silently fails to download client-generated
  // blob files, so we hit a real server URL instead and force it open in
  // the phone's default browser (via LIFF's external window), which
  // handles downloads normally.
  function openExportUrl(format) {
    const url = `${window.location.origin}/api/tasks/${task.id}/export?format=${format}`;
    try {
      if (liff.isInClient && liff.isInClient()) {
        liff.openWindow({ url, external: true });
        return;
      }
    } catch (e) {
      // fall through to plain navigation
    }
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
  const st = taskStatus(task);
  const signupCount = signups.length;

  const NO_CATEGORY = "__no_category__";
  const categoryCounts = {};
  let noCategoryCount = 0;
  for (const s of signups) {
    if (s.category) categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
    else noCategoryCount += 1;
  }
  const filteredSignups =
    filter === "全部"
      ? signups
      : filter === NO_CATEGORY
      ? signups.filter((s) => !s.category)
      : signups.filter((s) => s.category === filter);

  function toggleExpand() {
    if (dragX !== 0) {
      closeSwipe();
      return;
    }
    setExpanded((v) => !v);
    setMenuOpen(false);
  }

  return (
    <div className="relative">
      {/* Red delete backdrop, revealed as the white card slides left over it */}
      <div className="absolute inset-0 rounded-2xl bg-rose-500 flex items-center justify-end pr-6">
        <button
          onClick={handleTrashTap}
          className="text-white flex flex-col items-center gap-0.5"
          aria-label="刪除任務"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div
        ref={cardRef}
        className={`relative rounded-2xl border border-gray-100 bg-white shadow-sm overflow-visible ${
          dragging ? "" : "transition-transform duration-200 ease-out"
        } ${removing ? "opacity-0 transition-opacity duration-200" : ""}`}
        style={{ transform: `translateX(${dragX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {dragX !== 0 && (
          <div className="absolute inset-0 z-10 rounded-2xl" onClick={closeSwipe} aria-hidden="true" />
        )}

        <div className="w-full px-4 py-3 flex items-center gap-1.5">
          <div onClick={toggleExpand} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
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
          </div>

          <button
            onClick={toggleNotify}
            className={`w-7 h-7 flex items-center justify-center shrink-0 transition ${
              notifyEnabled ? "text-emerald-500" : "text-gray-300"
            }`}
            title={notifyEnabled ? "已開啟報名通知" : "已關閉報名通知"}
          >
            {notifyEnabled ? <Bell size={16} /> : <BellOff size={16} />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare?.();
            }}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-emerald-500 shrink-0"
            title="分享"
          >
            <Share2 size={16} />
          </button>

          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
                setConfirmDelete(false);
              }}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <MoreVertical size={17} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20 w-44">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full text-center px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    移除
                  </button>
                ) : (
                  <div className="px-3 py-3">
                    <p className="text-xs text-gray-500 mb-2.5 text-center">確定移除？</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onDelete();
                          setMenuOpen(false);
                        }}
                        className="flex-1 text-sm text-rose-500 font-medium py-2 rounded-lg hover:bg-rose-50"
                      >
                        是
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 text-sm text-gray-500 py-2 rounded-lg hover:bg-gray-50"
                      >
                        否
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4">
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl px-3.5 py-3 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
              </div>
              {task.description && (
                <p className="text-sm text-gray-600 leading-relaxed mb-2 whitespace-pre-wrap">{task.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><Calendar size={12} />{task.start_date} ~ {task.end_date}</span>
                <span className="flex items-center gap-1"><Users size={12} />{signupCount} 人已報名</span>
              </div>
              {task.note && (
                <p className="text-xs text-gray-400 mt-2 border-t border-emerald-100 pt-2 whitespace-pre-wrap">備註：{task.note}</p>
              )}
            </div>

            <div className="mb-3">
              <p className="text-[11px] font-medium text-gray-400 mb-1.5 px-0.5">報名名單</p>

              {task.categories?.length > 0 && (
                <div className="relative -mx-0.5">
                  <div ref={filterScrollRef} className="flex gap-1.5 overflow-x-auto pb-2 px-0.5">
                    <button
                      onClick={() => setFilter("全部")}
                      className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border ${filter === "全部" ? "bg-emerald-700 text-white border-emerald-700" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                    >
                      全部
                      <span className={`ml-1 ${filter === "全部" ? "text-white/70" : "text-gray-400"}`}>{signupCount}</span>
                    </button>
                    <button
                      onClick={() => setFilter(NO_CATEGORY)}
                      className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border ${
                        filter === NO_CATEGORY ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-emerald-600/70 border-emerald-200 border-dashed"
                      }`}
                    >
                      沒選類別
                      <span className={`ml-1 ${filter === NO_CATEGORY ? "text-white/70" : "text-emerald-400"}`}>{noCategoryCount}</span>
                    </button>
                    {task.categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setFilter(c)}
                        className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border ${filter === c ? "bg-emerald-700 text-white border-emerald-700" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                      >
                        {c}
                        <span className={`ml-1 ${filter === c ? "text-white/70" : "opacity-60"}`}>{categoryCounts[c] || 0}</span>
                      </button>
                    ))}
                    <span ref={filterSentinelRef} aria-hidden="true" className="shrink-0 w-px h-1" />
                  </div>
                  {filterCanScrollRight && (
                    <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-10 flex items-center justify-end bg-gradient-to-l from-white to-transparent">
                      <ChevronRight size={13} className="text-gray-300" />
                    </div>
                  )}
                </div>
              )}

              {filteredSignups.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">
                  {signups.length === 0 ? "還沒有人報名" : "這個分類還沒有人報名"}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-0.5">
                  {filteredSignups.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                      <div className={`w-6 h-6 rounded-full ${avatarClass(s.name)} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                        {s.name?.[0] || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium text-gray-700 truncate">{s.name}</span>
                          {s.category && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${chipClass(s.category)}`}>{s.category}</span>
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
                <p className="text-[11px] font-medium text-gray-400 mb-2 flex items-center gap-1">
                  <Download size={12} /> 匯出名單
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportCsv}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-emerald-200 rounded-full py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition"
                  >
                    <FileSpreadsheet size={14} /> CSV（Excel）
                  </button>
                  <button
                    onClick={handleExportTxt}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-emerald-200 rounded-full py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition"
                  >
                    <FileText size={14} /> 文字檔
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onShare}
                className="flex-1 border border-emerald-200 text-emerald-600 rounded-full py-2.5 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-50 transition"
              >
                <Share2 size={15} /> 分享
              </button>
              <button
                onClick={onEdit}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-2.5 font-semibold flex items-center justify-center gap-2 transition"
              >
                <Edit2 size={15} /> 編輯任務
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
