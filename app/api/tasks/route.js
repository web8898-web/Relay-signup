import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyLineAccessToken, getBearerToken } from "@/lib/lineAuth";
import { generateShortCode } from "@/lib/shortCode";

// Parses the optional "報名人數上限" field. Empty/blank/zero/invalid all
// mean "no cap" (null), since the field is optional and a 0 or negative
// limit wouldn't make sense.
function parseMaxSignups(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

export async function POST(request) {
  try {
    const token = getBearerToken(request);
    const profile = await verifyLineAccessToken(token);
    const body = await request.json();

    const { title, description, categories, start_date, end_date, note, max_signups, quantity_unit } = body;
    if (!title || !start_date || !end_date) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const trimmedUnit = String(quantity_unit || "").trim().slice(0, 20) || null;

    // short_code has a unique constraint; on the (very unlikely) chance of
    // a collision, generate a new one and retry a few times before giving up.
    let data, error;
    for (let attempt = 0; attempt < 5; attempt++) {
      ({ data, error } = await supabase
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
          short_code: generateShortCode(),
          max_signups: parseMaxSignups(max_signups),
          quantity_unit: trimmedUnit,
        })
        .select()
        .single());
      if (!error || error.code !== "23505") break;
    }

    if (error) throw error;
    return NextResponse.json({ task: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "建立任務失敗" }, { status: 400 });
  }
}
