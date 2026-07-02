"use client";
import { useState } from "react";
import { Edit2, Trash2, ChevronRight } from "lucide-react";
import { avatarClass, chipClass, relTime } from "@/lib/utils";

export default function ThreadList({ signups, myIds, categories, onUpdate, onDelete }) {
  const [filter, setFilter] = useState("全部");
  const [editingId, setEditingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [busy, setBusy] = useState(false);

  const NO_CATEGORY = "__no_category__";
  const filtered =
    filter === "全部"
      ? signups
      : filter === NO_CATEGORY
      ? signups.filter((s) => !s.category)
      : signups.filter((s) => s.category === filter);

  const categoryCounts = {};
  let noCategoryCount = 0;
  for (const s of signups) {
    if (s.category) categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
    else noCategoryCount += 1;
  }

  function startEdit(s) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditNote(s.note || "");
    setEditCategory(s.category || "");
  }

  async function saveEdit(s) {
    if (!editName.trim()) return;
    setBusy(true);
    await onUpdate(s.id, { name: editName.trim(), note: editNote.trim(), category: editCategory });
    setBusy(false);
    setEditingId(null);
  }

  return (
    <div>
      {categories?.length > 0 && (
        <>
          <p className="text-[11px] text-gray-400 mb-1.5 px-0.5">瀏覽名單（點分類篩選）</p>
          <div className="relative -mx-1">
            <div className="flex gap-1.5 overflow-x-auto pb-3 px-1">
              <button
                onClick={() => setFilter("全部")}
                className={`shrink-0 text-xs px-3 py-1 rounded-full border ${filter === "全部" ? "bg-gray-800 text-white border-gray-800" : "bg-gray-50 text-gray-500 border-gray-200"}`}
              >
                全部
                <span className={`ml-1 ${filter === "全部" ? "text-white/70" : "text-gray-400"}`}>{signups.length}</span>
              </button>
              <button
                onClick={() => setFilter(NO_CATEGORY)}
                className={`shrink-0 text-xs px-3 py-1 rounded-full border ${
                  filter === NO_CATEGORY ? "bg-gray-800 text-white border-gray-800" : "bg-gray-50 text-gray-400 border-gray-200 border-dashed"
                }`}
              >
                沒選類別
                <span className={`ml-1 ${filter === NO_CATEGORY ? "text-white/70" : "text-gray-400"}`}>{noCategoryCount}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`shrink-0 text-xs px-3 py-1 rounded-full border ${filter === c ? "bg-gray-800 text-white border-gray-800" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                >
                  {c}
                  <span className={`ml-1 ${filter === c ? "text-white/70" : "text-gray-400"}`}>{categoryCounts[c] || 0}</span>
                </button>
              ))}
            </div>
            {categories.length > 2 && (
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
          {filtered.map((s) => {
            const mine = myIds.includes(s.id);
            const isEditing = editingId === s.id;
            return (
              <div key={s.id} className="flex gap-2.5 items-start relative">
                <div className={`w-8 h-8 rounded-full ${avatarClass(s.name)} text-white flex items-center justify-center text-xs font-bold shrink-0 z-10`}>
                  {s.name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs font-medium text-gray-600 truncate">{s.name}</p>
                    <span className="text-[10px] text-gray-300">{relTime(s.created_at)}</span>
                  </div>

                  {isEditing ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm p-3 flex flex-col gap-2">
                      {categories?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => setEditCategory("")}
                            className={`text-[10px] px-2 py-1 rounded-full border ${
                              editCategory === "" ? "bg-gray-700 text-white border-gray-700" : "bg-white text-gray-400 border-gray-200 border-dashed"
                            }`}
                          >
                            不選類別
                          </button>
                          {categories.map((c) => (
                            <button
                              key={c}
                              onClick={() => setEditCategory(c)}
                              className={`text-[10px] px-2 py-1 rounded-full border ${editCategory === c ? "bg-emerald-500 text-white border-emerald-500" : chipClass(c)}`}
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
                  ) : (s.category || s.note) ? (
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm inline-block max-w-full">
                      {s.category && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border mr-1.5 ${chipClass(s.category)}`}>{s.category}</span>
                      )}
                      {s.note && <span className="text-sm text-gray-600 break-words">{s.note}</span>}
                    </div>
                  ) : null}

                  {mine && !isEditing && (
                    <div className="flex gap-3 mt-1 ml-1">
                      <button onClick={() => startEdit(s)} className="text-[11px] text-gray-400 hover:text-emerald-500 flex items-center gap-0.5">
                        <Edit2 size={11} /> 編輯
                      </button>
                      {confirmId === s.id ? (
                        <span className="text-[11px] flex items-center gap-1.5">
                          <span className="text-rose-400">確定刪除？</span>
                          <button onClick={() => { onDelete(s.id); setConfirmId(null); }} className="text-rose-500 font-medium">是</button>
                          <button onClick={() => setConfirmId(null)} className="text-gray-400">否</button>
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
      </div>
    </div>
  );
}
