import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { notifySignupActivity } from "@/lib/smartNotify";
import { isHeadcountUnit } from "@/lib/utils";

const DUPLICATE_WINDOW_MS = 30_000;
const TASK_FIELDS = "id, title, categories, end_date, creator_id, notify_enabled, max_signups, quantity_unit, task_mode";
const LEGACY_TASK_FIELDS = "id, title, categories, end_date, creator_id, notify_enabled, max_signups, quantity_unit";

function isMissingTaskModeColumn(error) {
  if (!error) return false;
  const message = String(error.message || "");
  return error.code === "PGRST204" || error.code === "42703" || message.includes("task_mode");
}

async function findTask(supabase, taskId) {
  let { data, error } = await supabase.from("tasks").select(TASK_FIELDS).eq("id", taskId).single();
  if (isMissingTaskModeColumn(error)) {
    ({ data, error } = await supabase.from("tasks").select(LEGACY_TASK_FIELDS).eq("id", taskId).single());
    if (data) data.task_mode = "normal";
  }
  return { task: data, error };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { task_id, categories, name, names, note, quantity, category_quantities, proxy_entries, owner_token } = body;
    const hasNames = Array.isArray(names) && names.some((n) => String(n || "").trim());
    if (!task_id || (!name && !hasNames) || !owner_token) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { task, error: taskErr } = await findTask(supabase, task_id);
    if (taskErr || !task) return NextResponse.json({ error: "找不到這個任務" }, { status: 404 });

    const isQueueTask = task.task_mode === "queue";
    if (isQueueTask) {
      const { data: activeQueueEntry, error: activeQueueError } = await supabase
        .from("signups").select("id").eq("task_id", task_id).eq("owner_token", owner_token)
        .eq("checked_in", false).limit(1).maybeSingle();
      if (activeQueueError) throw activeQueueError;
      if (activeQueueEntry) return NextResponse.json({ error: "你目前已在排隊中，完成後才能重新加入排隊" }, { status: 409 });
    }

    const selectedCategories = task.categories?.length > 0 && Array.isArray(categories)
      ? categories.filter((c) => task.categories.includes(c)) : [];
    const headcountMode = isHeadcountUnit(task.quantity_unit);
    const taskHasCategories = Array.isArray(task.categories) && task.categories.length > 0;

    if (task.quantity_unit && taskHasCategories && !headcountMode && selectedCategories.length === 0) {
      return NextResponse.json({ error: "請至少選擇一個分類" }, { status: 400 });
    }

    let quantityValue = null;
    let categoryQuantitiesValue = {};
    if (task.quantity_unit) {
      if (selectedCategories.length > 0) {
        let total = 0;
        for (const cat of selectedCategories) {
          const n = parseInt(category_quantities?.[cat], 10);
          if (!Number.isFinite(n) || n <= 0) {
            return NextResponse.json({ error: `請填寫「${cat}」的數量（${task.quantity_unit}）` }, { status: 400 });
          }
          categoryQuantitiesValue[cat] = n;
          total += n;
        }
        quantityValue = headcountMode ? total + 1 : total;
      } else if (taskHasCategories && headcountMode) quantityValue = 1;
      else {
        const n = parseInt(quantity, 10);
        if (!Number.isFinite(n) || n <= 0) return NextResponse.json({ error: `請填寫數量（${task.quantity_unit}）` }, { status: 400 });
        quantityValue = headcountMode ? n + 1 : n;
      }
    }

    const cleanNames = Array.isArray(names)
      ? names.map((n) => String(n || "").trim()).filter(Boolean).slice(0, 50) : [];
    const cleanProxyEntries = !isQueueTask && taskHasCategories && !task.quantity_unit && Array.isArray(proxy_entries)
      ? proxy_entries.map((entry) => ({
          name: String(entry?.name || "").trim().slice(0, 60),
          categories: Array.isArray(entry?.categories) ? entry.categories.filter((c) => task.categories.includes(c)) : [],
        })).filter((entry) => entry.name).slice(0, 49)
      : [];
    const isMultiEligible = !isQueueTask && !task.quantity_unit;
    const incomingHeadcount = cleanProxyEntries.length
      ? 1 + cleanProxyEntries.length
      : isMultiEligible && cleanNames.length >= 2 ? cleanNames.length
      : headcountMode ? (quantityValue || 1) : 1;

    if (task.max_signups) {
      let currentHeadcount;
      if (headcountMode) {
        let query = supabase.from("signups").select("quantity").eq("task_id", task_id);
        if (isQueueTask) query = query.eq("checked_in", false);
        const { data: existing } = await query;
        currentHeadcount = (existing || []).reduce((sum, s) => sum + (s.quantity ?? 1), 0);
      } else {
        let query = supabase.from("signups").select("id", { count: "exact", head: true }).eq("task_id", task_id);
        if (isQueueTask) query = query.eq("checked_in", false);
        const { count } = await query;
        currentHeadcount = count ?? 0;
      }
      if (currentHeadcount + incomingHeadcount > task.max_signups) {
        return NextResponse.json({ error: "這個任務已經額滿了" }, { status: 400 });
      }
    }

    const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
    const { data: recent } = await supabase.from("signups").select("created_at")
      .eq("task_id", task_id).eq("owner_token", owner_token).gte("created_at", windowStart)
      .order("created_at", { ascending: false }).limit(1);
    if (recent?.length) {
      const elapsedMs = Date.now() - new Date(recent[0].created_at).getTime();
      const waitSeconds = Math.max(1, Math.ceil((DUPLICATE_WINDOW_MS - elapsedMs) / 1000));
      return NextResponse.json({ error: `請稍候 ${waitSeconds} 秒後再試一次`, cooldown_seconds: waitSeconds }, { status: 429 });
    }

    if (cleanProxyEntries.length > 0) {
      const batchId = globalThis.crypto?.randomUUID?.() || null;
      const rows = [
        { task_id, categories: selectedCategories, name: String(name).slice(0, 60), note: String(note || "").slice(0, 500), quantity: null, category_quantities: {}, owner_token, batch_id: batchId },
        ...cleanProxyEntries.map((entry) => ({ task_id, categories: entry.categories, name: entry.name, note: "", quantity: null, category_quantities: {}, owner_token, batch_id: batchId })),
      ];
      const { data: inserted, error: proxyErr } = await supabase.from("signups").insert(rows).select();
      if (proxyErr) throw proxyErr;
      await notifySignupActivity({ supabase, task, signup: inserted?.[inserted.length - 1] });
      return NextResponse.json({ signups: inserted, count: inserted.length });
    }

    if (isMultiEligible && cleanNames.length >= 2) {
      const batchId = globalThis.crypto?.randomUUID?.() || null;
      const rows = cleanNames.map((nm) => ({ task_id, categories: selectedCategories, name: nm.slice(0, 60), note: "", quantity: null, category_quantities: {}, owner_token, batch_id: batchId }));
      const { data: inserted, error: multiErr } = await supabase.from("signups").insert(rows).select();
      if (multiErr) throw multiErr;
      await notifySignupActivity({ supabase, task, signup: inserted?.[inserted.length - 1] });
      return NextResponse.json({ signups: inserted, count: inserted.length });
    }

    const { data, error } = await supabase.from("signups").insert({
      task_id, categories: isQueueTask ? [] : selectedCategories, name: String(name).slice(0, 60),
      note: isQueueTask ? "" : String(note || "").slice(0, 500), quantity: isQueueTask ? null : quantityValue,
      category_quantities: isQueueTask ? {} : categoryQuantitiesValue, owner_token,
    }).select().single();
    if (error) throw error;
    await notifySignupActivity({ supabase, task, signup: data });
    return NextResponse.json({ signup: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "送出失敗" }, { status: 400 });
  }
}
