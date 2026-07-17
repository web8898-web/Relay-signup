import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyLineAccessToken, getBearerToken } from "@/lib/lineAuth";
import { generateShortCode } from "@/lib/shortCode";

const CONFIG_MARKERS = new Set([
  "__relay_category_single__",
  "__relay_category_multiple__",
  "__relay_share_enabled__",
  "__relay_share_disabled__",
]);

function parseMaxSignups(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

function parseTaskMode(value) {
  return value === "queue" ? "queue" : "normal";
}

function isMissingTaskModeColumn(error) {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  return message.includes("task_mode") && (error.code === "PGRST204" || error.code === "42703" || message.includes("column"));
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
    const incomingCategories = Array.isArray(categories) ? categories.map((item) => String(item).trim()).filter(Boolean) : [];
    const configMarkers = incomingCategories.filter((item) => CONFIG_MARKERS.has(item));
    const visibleCategories = incomingCategories.filter((item) => !CONFIG_MARKERS.has(item));
    const storedCategories = mode === "queue"
      ? configMarkers.slice(0, 4)
      : [...visibleCategories.slice(0, 26), ...configMarkers.slice(0, 4)];

    let data, error;
    for (let attempt = 0; attempt < 5; attempt++) {
      const payload = {
        title: String(title).slice(0, 200),
        description: String(description || "").slice(0, 2000),
        categories: storedCategories,
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

      ({ data, error } = await supabase.from("tasks").insert(payload).select().single());

      if (isMissingTaskModeColumn(error)) {
        return NextResponse.json(
          { error: "資料庫尚未完成現場排隊模式升級，請先執行 sql/migration_task_mode.sql。" },
          { status: 503 }
        );
      }

      if (!error || error.code !== "23505") break;
    }

    if (error) throw error;
    return NextResponse.json({ task: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "建立任務失敗" }, { status: 400 });
  }
}
