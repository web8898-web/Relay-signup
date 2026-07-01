import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

async function assertOwnership(supabase, signupId, ownerToken) {
  const { data, error } = await supabase.from("signups").select("owner_token").eq("id", signupId).single();
  if (error || !data) throw new Error("找不到這筆報名資料");
  if (data.owner_token !== ownerToken) throw new Error("你沒有權限編輯這筆資料");
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { name, note, category, owner_token } = body;
    if (!owner_token) return NextResponse.json({ error: "缺少驗證資訊" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    await assertOwnership(supabase, params.id, owner_token);

    const { data, error } = await supabase
      .from("signups")
      .update({
        name: String(name).slice(0, 60),
        note: String(note || "").slice(0, 500),
        category: category || "",
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ signup: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "更新失敗" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const owner_token = searchParams.get("owner_token");
    if (!owner_token) return NextResponse.json({ error: "缺少驗證資訊" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    await assertOwnership(supabase, params.id, owner_token);

    const { error } = await supabase.from("signups").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "刪除失敗" }, { status: 400 });
  }
}
