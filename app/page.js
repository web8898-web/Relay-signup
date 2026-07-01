"use client";
import Link from "next/link";
import { ClipboardList, PenLine, ChevronRight, MessageCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-emerald-500 text-white px-6 pt-12 pb-10 rounded-b-[2.5rem] shadow-md">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <MessageCircle size={28} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">接龍報名</h1>
        <p className="text-emerald-50 mt-2 text-sm leading-relaxed">
          像在聊天室接龍一樣，開一個任務，讓大家一則一則回覆完成報名。
        </p>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col gap-4">
        <Link
          href="/my-tasks"
          className="group w-full bg-white border border-emerald-200 rounded-3xl p-5 flex items-center gap-4 text-left shadow-sm hover:shadow-md hover:border-emerald-300 transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ClipboardList size={22} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">任務清單</p>
            <p className="text-xs text-gray-400 mt-0.5">使用 LINE 登入，管理你建立的任務</p>
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-400" />
        </Link>

        <Link
          href="/create"
          className="group w-full bg-white border border-gray-200 rounded-3xl p-5 flex items-center gap-4 text-left shadow-sm hover:shadow-md hover:border-emerald-300 transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
            <PenLine size={22} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">建立任務</p>
            <p className="text-xs text-gray-400 mt-0.5">使用 LINE 登入，建立任務並分享到群組</p>
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-400" />
        </Link>

        <div className="mt-auto text-center text-[11px] text-gray-300 pt-8">
          豐碩企業有限公司 版權所有
        </div>
      </div>
    </div>
  );
}
