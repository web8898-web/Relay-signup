// 點名／現場處理 API：主辦人在任務內容頁勾選或取消某位報名者。
//
// 支援兩種權限：
// 1. 主辦人 LINE access token：任務建立者可處理整個名單。
// 2. owner_token：保留原本報名者本人操作相容性。
// 單純切換 checked_in，不觸發任何 LINE 通知（這是主辦人的現場作業）。
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyLineAccessToken, getBearerToken } from "@/lib/lineAuth";

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const { owner_token, checked_in } = body || {};
    const token = getBearerToken(request);

    const supabase = getSupabaseAdmin();

    const { data: signup, error: findErr } = await supabase
      .from("signups")
      .select("id, task_id, owner_token")
      .eq("id", params.id)
      .single();
    if (findErr || !signup) {
      return NextResponse.json({ error: "找不到報名資料" }, { status: 404 });
    }

    let allowed = false;

    if (owner_token && signup.owner_token === owner_token) {
      allowed = true;
    }

    if (!allowed && token) {
      try {
        const profile = await verifyLineAccessToken(token);
        const { data: task } = await supabase
          .from("tasks")
          .select("creator_id")
          .eq("id", signup.task_id)
          .single();
        allowed = task?.creator_id === profile.userId;
      } catch (e) {
        allowed = false;
      }
    }

    if (!allowed) {
      return NextResponse.json({ error: "沒有權限" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("signups")
      .update({ checked_in: !!checked_in })
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ signup: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "處理失敗" }, { status: 400 });
  }
}
