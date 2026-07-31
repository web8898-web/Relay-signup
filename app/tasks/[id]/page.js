// A thin Server Component wrapper — route segment config like
// `force-dynamic` only reliably takes effect when it's exported from a
// Server Component (Next.js does not apply it when exported from a file
// with "use client"). Normal signup tasks continue using TaskDetailClient;
// queue tasks use a privacy-first client that never sends other people's
// names to participants.
export const dynamic = "force-dynamic";

import TaskDetailClient from "@/components/TaskDetailClient";
import QueueTaskDetailClient from "@/components/QueueTaskDetailClient";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isQueueTask } from "@/lib/utils";

export default async function TaskDetailPage({ params }) {
  const supabase = getSupabaseAdmin();
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (task && isQueueTask(task)) {
    return <QueueTaskDetailClient initialTask={task} />;
  }

  return <TaskDetailClient />;
}
