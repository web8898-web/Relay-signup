import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyLineAccessToken, getBearerToken } from "@/lib/lineAuth";

async function assertOwnership(supabase, taskId, userId) {
  const { data, error } = await supabase.from("tasks").select("creator_id").eq("id", taskId).single();
  if (error || !data) throw new Error("找不到這個任務");
  if (data.creator_id !== userId) throw new Error("你不是這個任務的建立者");
}

export async function PUT(request, { params }) {
  try {
    const token = getBearerToken(request);
    const profile = await verifyLineAccessToken(token);
    const supabase = getSupabaseAdmin();
    await assertOwnership(supabase, params.id, profile.userId);

    const body = await request.json();
    const { title, description, categories, start_date, end_date, note } = body;

    const { data, error } = await supabase
      .from("tasks")
      .update({
        title: String(title).slice(0, 200),
        description: String(description || "").slice(0, 2000),
        categories: Array.isArray(categories) ? categories.slice(0, 30) : [],
        start_date,
        end_date,
        note: String(note || "").slice(0, 1000),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ task: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "更新任務失敗" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = getBearerToken(request);
    const profile = await verifyLineAccessToken(token);
    const supabase = getSupabaseAdmin();
    await assertOwnership(supabase, params.id, profile.userId);

    const { error } = await supabase.from("tasks").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "刪除任務失敗" }, { status: 400 });
  }
}
