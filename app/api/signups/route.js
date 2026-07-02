import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendLinePush } from "@/lib/linePush";

export async function POST(request) {
  try {
    const body = await request.json();
    const { task_id, category, name, note, owner_token } = body;

    if (!task_id || !name || !owner_token) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .select("id, title, categories, end_date, creator_id, notify_enabled")
      .eq("id", task_id)
      .single();
    if (taskErr || !task) {
      return NextResponse.json({ error: "找不到這個任務" }, { status: 404 });
    }
    if (category && task.categories?.length > 0 && !task.categories.includes(category)) {
      return NextResponse.json({ error: "請選擇有效的分類" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("signups")
      .insert({
        task_id,
        category: task.categories?.length > 0 ? category : "",
        name: String(name).slice(0, 60),
        note: String(note || "").slice(0, 500),
        owner_token,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify the organizer via a LINE push message. This is fire-and-forget
    // — if it fails (e.g. the organizer hasn't added the notification
    // Official Account as a friend yet), the signup itself still succeeds.
    if (task.creator_id && task.notify_enabled !== false) {
      const { count } = await supabase
        .from("signups")
        .select("id", { count: "exact", head: true })
        .eq("task_id", task_id);

      const lines = [`📋 ${task.title} 有新的接龍報名！`, "", `👤 姓名：${data.name}`];
      if (data.category) lines.push(`🏷 分類：${data.category}`);
      if (data.note) lines.push(`📝 備註：${data.note}`);
      lines.push("", `目前共 ${count ?? "?"} 人報名`);

      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (liffId) {
        lines.push("", "👉 查看完整名單", `https://liff.line.me/${liffId}/my-tasks/${task_id}`);
      }

      await sendLinePush(task.creator_id, lines.join("\n"));
    }

    return NextResponse.json({ signup: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "送出失敗" }, { status: 400 });
  }
}
