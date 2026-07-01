import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyLineAccessToken, getBearerToken } from "@/lib/lineAuth";

export async function POST(request) {
  try {
    const token = getBearerToken(request);
    const profile = await verifyLineAccessToken(token);
    const body = await request.json();

    const { title, description, categories, start_date, end_date, note } = body;
    if (!title || !start_date || !end_date) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: String(title).slice(0, 200),
        description: String(description || "").slice(0, 2000),
        categories: Array.isArray(categories) ? categories.slice(0, 30) : [],
        start_date,
        end_date,
        note: String(note || "").slice(0, 1000),
        creator_id: profile.userId,
        creator_name: profile.displayName,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ task: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "建立任務失敗" }, { status: 400 });
  }
}
