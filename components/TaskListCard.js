"use client";
import { useState } from "react";
import { MessageCircle, ChevronDown, MoreVertical, Edit2, Share2, Calendar, Users } from "lucide-react";
import { taskStatus, chipClass } from "@/lib/utils";

export default function TaskListCard({ task, signupCount, onEdit, onDelete, onShare }) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const st = taskStatus(task);

  function toggleExpand() {
    setExpanded((v) => !v);
    setMenuOpen(false);
  }

  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white shadow-sm overflow-visible">
      <div className="w-full px-4 py-3 flex items-center gap-2">
        <div onClick={toggleExpand} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <MessageCircle size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{task.title}</p>
            {!expanded && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                {st.label} · {signupCount} 人已報名
              </p>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare?.();
          }}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-emerald-500 shrink-0"
          title="分享"
        >
          <Share2 size={17} />
        </button>

        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
              setConfirmDelete(false);
            }}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <MoreVertical size={18} />
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

        <button onClick={toggleExpand} className="w-8 h-8 flex items-center justify-center text-gray-300 shrink-0">
          <ChevronDown size={18} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl px-3.5 py-3 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-2">{task.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
              <span className="flex items-center gap-1"><Calendar size={12} />{task.start_date} ~ {task.end_date}</span>
              <span className="flex items-center gap-1"><Users size={12} />{signupCount} 人已報名</span>
            </div>
            {task.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {task.categories.map((c) => (
                  <span key={c} className={`text-[10px] px-2 py-0.5 rounded-full border ${chipClass(c)}`}>{c}</span>
                ))}
              </div>
            )}
            {task.note && (
              <p className="text-xs text-gray-400 mt-2 border-t border-emerald-100 pt-2">備註：{task.note}</p>
            )}
          </div>

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
  );
}
