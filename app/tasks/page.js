"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2 } from "lucide-react";
import { TopBar, EmptyState } from "@/components/TopBar";
import TaskShareCard from "@/components/TaskShareCard";
import { supabase } from "@/lib/supabaseClient";

export default function TaskListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: taskData } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      setTasks(taskData || []);

      if (taskData?.length) {
        const { data: signupData } = await supabase
          .from("signups")
          .select("task_id")
          .in("task_id", taskData.map((t) => t.id));
        const map = {};
        (signupData || []).forEach((s) => {
          map[s.task_id] = (map[s.task_id] || 0) + 1;
        });
        setCounts(map);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="任務清單" backHref="/" />
      <div className="flex-1 px-5 py-4 flex flex-col gap-5 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-12 text-emerald-500">
            <Loader2 className="animate-spin" size={28} />
          </div>
        )}
        {!loading && tasks.length === 0 && (
          <EmptyState icon={<ClipboardList size={30} />} title="目前沒有任務" desc="請等主辦人建立任務後再回來看看。" />
        )}
        {tasks.map((t) => (
          <TaskShareCard
            key={t.id}
            task={t}
            signupCount={counts[t.id] || 0}
            onOpen={() => router.push(`/tasks/${t.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
