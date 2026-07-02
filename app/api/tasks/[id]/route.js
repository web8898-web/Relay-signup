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
    const update = {};
    if (body.title !== undefined) update.title = String(body.title).slice(0, 200);
    if (body.description !== undefined) update.description = String(body.description || "").slice(0, 2000);
    if (body.categories !== undefined) update.categories = Array.isArray(body.categories) ? body.categories.slice(0, 30) : [];
    if (body.start_date !== undefined) update.start_date = body.start_date;
    if (body.end_date !== undefined) update.end_date = body.end_date;
    if (body.note !== undefined) update.note = String(body.note || "").slice(0, 1000);
    if (body.notify_enabled !== undefined) update.notify_enabled = !!body.notify_enabled;

    const { data, error } = await supabase
      .from("tasks")
      .update(update)
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
