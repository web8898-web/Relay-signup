"use client";
import { MessageCircle, PenLine, Calendar, Users, FileText, ClipboardEdit } from "lucide-react";
import { chipClass } from "@/lib/utils";

export default function TaskShareCard({ task, signupCount, onOpen, previewOnly, onPreviewTap }) {
  function handleButtonClick() {
    if (previewOnly) {
      onPreviewTap?.();
      return;
    }
    onOpen?.();
  }

  return (
    <div className="relative rounded-[1.75rem] overflow-hidden shadow-md border border-emerald-100 bg-white">
      <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 px-5 pt-4 pb-6">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-white tracking-wide">接龍報名小助手</p>
          <MessageCircle size={26} className="text-white" strokeWidth={2.2} />
        </div>
      </div>
      <svg viewBox="0 0 400 28" preserveAspectRatio="none" className="w-full h-7 block -mt-4">
        <path d="M0,14 C100,28 300,0 400,14 L400,28 L0,28 Z" fill="white" />
      </svg>

      <div className="relative px-5 pb-5 -mt-1 z-10">
        <div className="flex items-center gap-1.5 text-gray-700 mb-1.5">
          <ClipboardEdit size={15} className="text-emerald-500" />
          <p className="text-xs font-bold">任務名稱：</p>
        </div>
        <div className="border border-dashed border-emerald-200 rounded-xl px-3.5 py-2.5 mb-4 bg-emerald-50/40">
          <p className="text-sm font-semibold text-gray-800 leading-snug">{task.title}</p>
        </div>

        <div className="flex items-center gap-1.5 text-gray-700 mb-1.5">
          <FileText size={15} className="text-emerald-500" />
          <p className="text-xs font-bold">任務內容：</p>
        </div>
        <div className="border border-dashed border-emerald-200 rounded-xl px-3.5 py-2.5 mb-3 bg-emerald-50/40 min-h-[3rem]">
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 whitespace-pre-wrap">
            {task.description || "（無簡介）"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4 text-[11px] text-gray-400">
          <span className="flex items-center gap-1"><Calendar size={12} />{task.start_date} ~ {task.end_date}</span>
          <span className="flex items-center gap-1"><Users size={12} />{signupCount} 人已報名</span>
        </div>
        {task.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {task.categories.map((c) => (
              <span key={c} className={`text-[10px] px-2 py-0.5 rounded-full border ${chipClass(c)}`}>{c}</span>
            ))}
          </div>
        )}

        <button
          onClick={handleButtonClick}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition"
        >
          <PenLine size={16} /> 我要報名
        </button>
        {previewOnly && (
          <p className="text-center text-[11px] text-gray-300 mt-2">這是預覽卡片，不會離開此頁</p>
        )}
      </div>

      <div className="absolute bottom-3 left-4 grid grid-cols-3 gap-1 opacity-30 pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="w-1 h-1 rounded-full bg-emerald-400" />
        ))}
      </div>
    </div>
  );
}
