// 點名報到 API：主辦人在任務內容頁的點名模式勾選/取消某位報名者。
//
// 權限驗證與編輯／刪除一致：比對這筆報名的 owner_token（主辦人
// 建立任務時，名下報名都持有同一個 owner_token）。單純切換
// checked_in，不觸發任何 LINE 通知（點名是主辦人的現場作業）。
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const { owner_token, checked_in } = body || {};
    if (!owner_token) {
      return NextResponse.json({ error: "缺少驗證資訊" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: signup, error: findErr } = await supabase
      .from("signups")
      .select("owner_token")
      .eq("id", params.id)
      .single();
    if (findErr || !signup) {
      return NextResponse.json({ error: "找不到報名資料" }, { status: 404 });
    }
    if (signup.owner_token !== owner_token) {
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
    return NextResponse.json({ error: err.message || "點名失敗" }, { status: 400 });
  }
}
