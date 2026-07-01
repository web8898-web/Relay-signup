import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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
      .select("id, categories, end_date")
      .eq("id", task_id)
      .single();
    if (taskErr || !task) {
      return NextResponse.json({ error: "找不到這個任務" }, { status: 404 });
    }
    if (task.categories?.length > 0 && !task.categories.includes(category)) {
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
    return NextResponse.json({ signup: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "送出失敗" }, { status: 400 });
  }
}
