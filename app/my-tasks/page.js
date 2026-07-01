"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, LogIn, LogOut, MessageCircle, Calendar, Plus } from "lucide-react";
import { TopBar, EmptyState } from "@/components/TopBar";
import OrganizerTabs from "@/components/OrganizerTabs";
import { useLineProfile } from "@/lib/useLineProfile";
import { avatarClass, taskStatus } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

export default function MyTasksPage() {
  const router = useRouter();
  const { profile, loading, error, login, logout } = useLineProfile();
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setTasksLoading(true);
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("creator_id", profile.userId)
        .order("created_at", { ascending: false });
      setTasks(data || []);
      setTasksLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="我的任務" backHref="/" />
        <div className="flex-1 flex items-center justify-center text-emerald-500">
          <Loader2 className="animate-spin" size={28} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="我的任務" backHref="/" />
        <div className="flex-1 px-6 py-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
            <MessageCircle size={34} />
          </div>
          <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">請先使用 LINE 登入以查看你的任務。</p>
          {error && <p className="text-xs text-rose-500 mb-4">{error}</p>}
          <button
            onClick={login}
            className="w-full bg-emerald-500 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition"
          >
            <LogIn size={18} /> 使用 LINE 登入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar
        title="我的任務"
        backHref="/"
        right={
          <button onClick={logout} className="text-white/80 hover:text-white" title="登出">
            <LogOut size={18} />
          </button>
        }
      />
      <OrganizerTabs current="tasks" />
      <div className="px-6 pt-2 pb-2 flex items-center gap-2 text-xs text-gray-400">
        <div className={`w-6 h-6 rounded-full ${avatarClass(profile.displayName)} text-white flex items-center justify-center text-[11px] font-bold`}>
          {profile.displayName?.[0] || "?"}
        </div>
        以 <span className="font-medium text-gray-600">{profile.displayName}</span> 身分登入
      </div>

      <div className="flex-1 px-6 py-3 flex flex-col gap-3 overflow-y-auto">
        {tasksLoading && (
          <div className="flex justify-center py-10 text-emerald-500">
            <Loader2 className="animate-spin" size={24} />
          </div>
        )}
        {!tasksLoading && tasks.length === 0 && (
          <EmptyState icon={<ClipboardList size={30} />} title="還沒有任務" desc="點擊上方「建立任務」開始建立第一個接龍吧。" />
        )}
        {tasks.map((t) => {
          const st = taskStatus(t);
          return (
            <button
              key={t.id}
              onClick={() => router.push(`/my-tasks/${t.id}`)}
              className="text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-800 leading-snug">{t.title}</p>
                <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
              </div>
              {t.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.description}</p>}
              <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><Calendar size={12} />{t.start_date} ~ {t.end_date}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-6 pb-6 pt-2">
        <button
          onClick={() => router.push("/create")}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition"
        >
          <Plus size={18} /> 新增任務
        </button>
      </div>
    </div>
  );
}
