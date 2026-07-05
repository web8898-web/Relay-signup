"use client";
import { useEffect, useRef, useState } from "react";
import { Edit2, Trash2, ChevronRight } from "lucide-react";
import { avatarClass, chipClass, relTime } from "@/lib/utils";
import { useScrollFadeRight } from "@/lib/useScrollFadeRight";
import LoadingBubble from "@/components/LoadingBubble";

const PAGE_SIZE = 30;

export default function ThreadList({ signups, myIds, categories, quantityUnit, nameOnly, onUpdate, onDelete }) {
  const [filter, setFilter] = useState("全部");
  const [editingId, setEditingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editCategories, setEditCategories] = useState([]);
  const [busy, setBusy] = useState(false);
  const [filterScrollRef, filterSentinelRef, filterCanScrollRight] = useScrollFadeRight(categories?.length > 0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);

  const NO_CATEGORY = "__no_category__";
  // Numbers people by their actual signup order (1st, 2nd, 3rd...), based
  // on the full unfiltered list — computed once here so the number for any
  // given person stays the same no matter which category filter is active
  // or how far someone has scrolled/paginated.
  const orderNumber = {};
  signups.forEach((s, i) => {
    orderNumber[s.id] = i + 1;
  });
  const filtered =
    filter === "全部"
      ? signups
      : filter === NO_CATEGORY
      ? signups.filter((s) => !s.categories || s.categories.length === 0)
      : signups.filter((s) => s.categories?.includes(filter));

  // Reset back to the first page whenever the person switches filters, so
  // switching categories doesn't keep an inflated count from before.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter]);

  const visibleSignups = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Only render a bounded window of rows at a time — with a task that has
  // hundreds of signups, mounting every row up front is what makes the
  // list feel sluggish. Reveal more automatically as the person scrolls
  // near the bottom.
  useEffect(() => {
    if (!hasMore) return;
    const el = loadMoreRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((c) => c + PAGE_SIZE);
            setLoadingMore(false);
          }, 200);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

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

  function startEdit(s) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditNote(s.note || "");
    setEditCategories(s.categories || []);
  }

  function toggleEditCategory(c) {
    setEditCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function saveEdit(s) {
    if (!editName.trim()) return;
    setBusy(true);
    await onUpdate(s.id, { name: editName.trim(), note: editNote.trim(), categories: editCategories });
    setBusy(false);
    setEditingId(null);
  }

  return (
    <div>
      {categories?.length > 0 && !nameOnly && (
        <>
          <p className="text-[11px] text-gray-400 mb-1.5 px-0.5">瀏覽名單（點分類篩選）</p>
          <div className="relative -mx-1">
            <div ref={filterScrollRef} className="flex gap-1.5 overflow-x-auto pb-3 px-1">
              <button
                onClick={() => setFilter("全部")}
                className={`shrink-0 text-xs px-3 py-1 rounded-full border ${filter === "全部" ? "bg-emerald-700 text-white border-emerald-700" : "bg-gray-50 text-gray-500 border-gray-200"}`}
              >
                全部
                <span className={`ml-1 ${filter === "全部" ? "text-white/70" : "text-gray-400"}`}>{signups.length}</span>
              </button>
              <button
                onClick={() => setFilter(NO_CATEGORY)}
                className={`shrink-0 text-xs px-3 py-1 rounded-full border ${
                  filter === NO_CATEGORY ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-emerald-600/70 border-emerald-200 border-dashed"
                }`}
              >
                沒選類別
                <span className={`ml-1 ${filter === NO_CATEGORY ? "text-white/70" : "text-emerald-400"}`}>{noCategoryCount}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`shrink-0 text-xs px-3 py-1 rounded-full border ${filter === c ? "bg-emerald-700 text-white border-emerald-700" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                >
                  {c}
                  <span className={`ml-1 ${filter === c ? "text-white/70" : "text-gray-400"}`}>{categoryCounts[c] || 0}</span>
                </button>
              ))}
              <span ref={filterSentinelRef} aria-hidden="true" className="shrink-0 w-px h-1" />
            </div>
            {filterCanScrollRight && (
              <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-10 flex items-center justify-end bg-gradient-to-l from-white to-transparent">
                <ChevronRight size={14} className="text-gray-300" />
              </div>
            )}
          </div>
        </>
      )}

      {filtered.length === 0 && (
        <div className="text-center text-xs text-gray-300 py-8">
          {signups.length === 0 ? "還沒有人接龍，成為第一個吧！" : "這個分類還沒有人接龍"}
        </div>
      )}

      <div className="relative">
        {filtered.length > 0 && (
          <div className="absolute left-[15px] top-2 bottom-2 w-px border-l border-dashed border-gray-200" />
        )}
        <div className="flex flex-col gap-4">
          {visibleSignups.map((s) => {
            const mine = myIds.includes(s.id);
            const isEditing = editingId === s.id;
            return (
              <div key={s.id} className="flex gap-2.5 items-start relative">
                <div className={`w-8 h-8 rounded-full ${avatarClass(s.name)} text-white flex items-center justify-center text-xs font-bold shrink-0 z-10`}>
                  {s.name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5 min-w-0">
                      <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        {orderNumber[s.id]}
                      </span>
                      <span className="truncate">{s.name}</span>
                    </p>
                    <span className="text-[10px] text-gray-300">{relTime(s.created_at)}</span>
                  </div>

                  {isEditing ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm p-3 flex flex-col gap-2">
                      {categories?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {categories.map((c) => (
                            <button
                              key={c}
                              onClick={() => toggleEditCategory(c)}
                              className={`text-[10px] px-2 py-1 rounded-full border ${editCategories.includes(c) ? "bg-emerald-500 text-white border-emerald-500" : chipClass(c)}`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border border-gray-200 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        placeholder="姓名"
                      />
                      <input
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="border border-gray-200 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        placeholder="備註"
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 px-2">取消</button>
                        <button disabled={busy} onClick={() => saveEdit(s)} className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-full disabled:opacity-50">儲存</button>
                      </div>
                    </div>
                  ) : !nameOnly && (s.categories?.length > 0 || s.note || s.quantity != null) ? (
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm max-w-full">
                      {(s.categories?.length > 0 || s.quantity != null) && (
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {s.categories?.map((c) => (
                            <span key={c} className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${chipClass(c)}`}>
                              {c}
                              {s.category_quantities?.[c] != null && ` · ${s.category_quantities[c]}${quantityUnit || ""}`}
                            </span>
                          ))}
                          {s.quantity != null && !(s.category_quantities && Object.keys(s.category_quantities).length > 0) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap">
                              {s.quantity} {quantityUnit || ""}
                            </span>
                          )}
                        </div>
                      )}
                      {s.note && <span className="text-sm text-gray-600 break-words">{s.note}</span>}
                    </div>
                  ) : null}

                  {mine && !isEditing && !nameOnly && (
                    <div className="flex gap-3 mt-1 ml-1">
                      <button onClick={() => startEdit(s)} className="text-[11px] text-gray-400 hover:text-emerald-500 flex items-center gap-0.5">
                        <Edit2 size={11} /> 編輯
                      </button>
                      {confirmId === s.id ? (
                        <span className="text-[11px] flex items-center gap-1">
                          <span className="text-rose-400 mr-1">確定刪除？</span>
                          <button onClick={() => { onDelete(s.id); setConfirmId(null); }} className="text-rose-500 font-medium px-2 py-1">是</button>
                          <button onClick={() => setConfirmId(null)} className="text-gray-400 px-2 py-1">否</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmId(s.id)} className="text-[11px] text-gray-400 hover:text-rose-500 flex items-center gap-0.5">
                          <Trash2 size={11} /> 刪除
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {hasMore && (
          <div ref={loadMoreRef}>
            {loadingMore && <LoadingBubble size={20} label="載入更多名單…" />}
          </div>
        )}
      </div>
    </div>
  );
}
