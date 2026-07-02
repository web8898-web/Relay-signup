"use client";
import { useState } from "react";
import Link from "next/link";
import { ClipboardList, PenLine, ChevronRight, MessageCircle, Send } from "lucide-react";
import ImageModal from "@/components/ImageModal";
import { useLineProfile } from "@/lib/useLineProfile";
import { avatarClass } from "@/lib/utils";

const GUIDES = [
  { key: "create", title: "如何建立任務？", src: "/how-to-create-task.png", icon: PenLine },
  { key: "signup", title: "如何接龍報名？", src: "/how-to-signup.png", icon: Send },
];

export default function HomePage() {
  const [modal, setModal] = useState(null);
  const { profile } = useLineProfile();

  return (
    <div className="flex-1 flex flex-col min-w-0">
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
        {profile && (
          <div className="flex items-center gap-2 text-xs text-gray-400 -mb-1 px-1">
            <div className={`w-6 h-6 rounded-full ${avatarClass(profile.displayName)} text-white flex items-center justify-center text-[11px] font-bold`}>
              {profile.displayName?.[0] || "?"}
            </div>
            以 <span className="font-medium text-gray-600">{profile.displayName}</span> 身分登入
          </div>
        )}

        <Link
          href="/my-tasks"
          className="group w-full bg-white border border-emerald-200 rounded-3xl p-5 flex items-center gap-4 text-left shadow-sm hover:shadow-md hover:border-emerald-300 transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ClipboardList size={22} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">任務清單</p>
            <p className="text-xs text-gray-400 mt-0.5">{profile ? "管理你建立的任務" : "使用 LINE 登入，管理你建立的任務"}</p>
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
            <p className="text-xs text-gray-400 mt-0.5">{profile ? "建立任務並分享到群組" : "使用 LINE 登入，建立任務並分享到群組"}</p>
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-400" />
        </Link>

        <div className="mt-2">
          <p className="text-xs font-semibold text-gray-400 mb-2 px-1">使用教學</p>
          <div className="grid grid-cols-2 gap-3">
            {GUIDES.map((g) => {
              const Icon = g.icon;
              return (
                <button
                  key={g.key}
                  onClick={() => setModal(g)}
                  className="group bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-1 text-left shadow-sm hover:shadow-md hover:border-emerald-300 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon size={15} className="text-emerald-500 shrink-0" />
                    <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{g.title}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 whitespace-nowrap pl-[21px]">查看圖文步驟</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto text-center text-[11px] text-gray-300 pt-8">
          豐碩企業有限公司 版權所有
        </div>
      </div>

      <ImageModal src={modal?.src} title={modal?.title} onClose={() => setModal(null)} />
    </div>
  );
}
