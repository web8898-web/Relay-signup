import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isQueueTask } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const taskId = String(body?.task_id || "").trim();
    const ownerToken = String(body?.owner_token || "").trim();

    if (!taskId || !ownerToken) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, task_mode, categories")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "找不到這個任務" }, { status: 404 });
    }

    if (!isQueueTask(task)) {
      return NextResponse.json({ error: "這不是現場排隊任務" }, { status: 400 });
    }

    const { data: snapshot, error: snapshotError } = await supabase.rpc("queue_status_snapshot", {
      p_task_id: taskId, p_owner_token: ownerToken,
    });
    if (snapshotError) throw snapshotError;

    return NextResponse.json(
      snapshot,
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message || "讀取排隊狀態失敗" }, { status: 400 });
  }
}
