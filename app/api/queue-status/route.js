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

    // 排名計算只讀取非個資欄位；其他排隊者姓名、備註等資料不會回傳給前端。
    const { data: queueRows, error: queueError } = await supabase
      .from("signups")
      .select("id, owner_token, checked_in, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (queueError) throw queueError;

    // 只取得目前瀏覽器自己建立的排隊資料。
    const { data: mySignups, error: mineError } = await supabase
      .from("signups")
      .select("id, task_id, name, checked_in, created_at")
      .eq("task_id", taskId)
      .eq("owner_token", ownerToken)
      .order("created_at", { ascending: true });
    if (mineError) throw mineError;

    const rows = queueRows || [];
    const waitingRows = rows.filter((row) => !row.checked_in);
    const completedRows = rows.filter((row) => row.checked_in);
    const myWaiting = (mySignups || []).find((row) => !row.checked_in) || null;
    const queueNumber = myWaiting
      ? waitingRows.findIndex((row) => row.id === myWaiting.id) + 1
      : 0;

    return NextResponse.json(
      {
        waiting_count: waitingRows.length,
        completed_count: completedRows.length,
        queue_number: queueNumber > 0 ? queueNumber : 0,
        people_ahead: queueNumber > 0 ? queueNumber - 1 : 0,
        my_signups: mySignups || [],
      },
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
