import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyLineAccessToken, getBearerToken } from "@/lib/lineAuth";
import { generateShortCode } from "@/lib/shortCode";

function parseMaxSignups(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

function parseTaskMode(value) {
  return value === "queue" ? "queue" : "normal";
}

function shouldRetryWithoutTaskMode(error) {
  if (!error) return false;
  const message = String(error.message || "");
  return error.code === "PGRST204" || error.code === "42703" || message.includes("task_mode");
}

export async function POST(request) {
  try {
    const token = getBearerToken(request);
    const profile = await verifyLineAccessToken(token);
    const body = await request.json();

    const { title, description, categories, start_date, end_date, note, max_signups, quantity_unit, task_mode } = body;
    if (!title || !start_date || !end_date) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const trimmedUnit = String(quantity_unit || "").trim().slice(0, 20) || null;
    const mode = parseTaskMode(task_mode);

    let data, error;
    for (let attempt = 0; attempt < 5; attempt++) {
      const payload = {
        title: String(title).slice(0, 200),
        description: String(description || "").slice(0, 2000),
        categories: mode === "queue" ? [] : Array.isArray(categories) ? categories.slice(0, 30) : [],
        start_date,
        end_date,
        note: String(note || "").slice(0, 1000),
        creator_id: profile.userId,
        creator_name: profile.displayName,
        short_code: generateShortCode(),
        max_signups: parseMaxSignups(max_signups),
        quantity_unit: mode === "queue" ? null : trimmedUnit,
        task_mode: mode,
        notify_enabled: mode === "queue" ? false : true,
      };

      ({ data, error } = await supabase
        .from("tasks")
        .insert(payload)
        .select()
        .single());

      if (shouldRetryWithoutTaskMode(error)) {
        const { task_mode: _taskMode, ...fallbackPayload } = payload;
        ({ data, error } = await supabase
          .from("tasks")
          .insert(fallbackPayload)
          .select()
          .single());
      }

      if (!error || error.code !== "23505") break;
    }

    if (error) throw error;
    return NextResponse.json({ task: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "建立任務失敗" }, { status: 400 });
  }
}
