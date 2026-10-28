import { readSignupSnapshot } from "@/lib/signupSnapshot";
import { readAllRows } from "@/lib/readAllRows";
import { assertRegistrationOpen, signupValues, signupCategories } from "@/lib/signupValidation";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { notifySignupActivity } from "@/lib/smartNotify";
import { isHeadcountUnit, getVisibleCategories, getCategorySelectionMode } from "@/lib/utils";
import { isQueueTask as isQueueTaskConfig } from "@/lib/utils";
import { getBearerToken, verifyLineAccessToken } from "@/lib/lineAuth";
import { SIGNUP_FIELDS } from "@/lib/signupFields";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;
    const taskId = params.get("task_id");
    if (!taskId) return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data: task, error } = await supabase.from("tasks").select("id,title,task_mode,categories,creator_id").eq("id", taskId).maybeSingle();
    if (error || !task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (params.get("count") === "1") {
      let query = supabase.from("signups").select("id", { count: "exact", head: true }).eq("task_id", taskId);
      if (isQueueTaskConfig(task)) query = query.eq("checked_in", false);
      const { count, error: countError } = await query;
      if (countError) throw countError;
      return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
    }
    if (isQueueTaskConfig(task)) {
      const profile = await verifyLineAccessToken(getBearerToken(request));
      if (profile.userId !== task.creator_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const data = await readSignupSnapshot(supabase, [taskId]);
    return NextResponse.json({ signups: data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load signups" }, { status: 403 });
  }
}

const DUPLICATE_WINDOW_MS = 30_000;
const TASK_FIELDS = "id, title, categories, start_date, end_date, creator_id, notify_enabled, max_signups, quantity_unit, task_mode";
const LEGACY_TASK_FIELDS = "id, title, categories, start_date, end_date, creator_id, notify_enabled, max_signups, quantity_unit";
const SINGLE_MARKER = "__relay_category_single__";
const MULTIPLE_MARKER = "__relay_category_multiple__";

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

function isCategoryRequired(task, selectionMode) {
  const marker = selectionMode === "single" ? SINGLE_MARKER : MULTIPLE_MARKER;
  return (task.categories || []).filter((item) => item === marker).length >= 2;
}

function orderedCreatedAt(baseMs, offset = 0) {
  const iso = new Date(baseMs).toISOString();
  return iso.replace(/\.(\d{3})Z$/, (_, millis) => `.${millis}${String(offset).padStart(3, "0")}Z`);
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

    assertRegistrationOpen(task);
    const isQueueTask = isQueueTaskConfig(task);
    if (isQueueTask) {
      const { data: activeQueueEntry, error: activeQueueError } = await supabase
        .from("signups").select("id").eq("task_id", task_id).eq("owner_token", owner_token)
        .eq("checked_in", false).limit(1).maybeSingle();
      if (activeQueueError) throw activeQueueError;
      if (activeQueueEntry) return NextResponse.json({ error: "你目前已在排隊中，完成後才能重新加入排隊" }, { status: 409 });
    }

    const availableCategories = getVisibleCategories(task.categories);
    const selectionMode = getCategorySelectionMode(task);
    const categoryRequired = isCategoryRequired(task, selectionMode);
    const values = signupValues(task, { ...body, name: name || names?.[0] });
    const selectedCategories = values.categories;
    const headcountMode = isHeadcountUnit(task.quantity_unit);
    const taskHasCategories = availableCategories.length > 0;
    const quantityValue = values.quantity;
    const categoryQuantitiesValue = values.category_quantities;

    const cleanNames = Array.isArray(names)
      ? names.map((n) => String(n || "").trim()).filter(Boolean).slice(0, 50) : [];
    const cleanProxyEntries = !isQueueTask && taskHasCategories && !task.quantity_unit && Array.isArray(proxy_entries)
      ? proxy_entries.map((entry) => {
          const entryCategories = signupCategories(task, entry?.categories);
          return {
            name: String(entry?.name || "").trim().slice(0, 60),
            categories: entryCategories,
          };
        }).filter((entry) => entry.name).slice(0, 49)
      : [];

    if (categoryRequired && cleanProxyEntries.some((entry) => entry.categories.length === 0)) {
      return NextResponse.json({ error: "請為每位代報者至少選擇一個分類" }, { status: 400 });
    }

    const isMultiEligible = !isQueueTask && !task.quantity_unit;
    const incomingHeadcount = cleanProxyEntries.length
      ? 1 + cleanProxyEntries.length
      : isMultiEligible && cleanNames.length >= 2 ? cleanNames.length
      : headcountMode ? (quantityValue || 1) : 1;

    if (task.max_signups) {
      let currentHeadcount;
      if (headcountMode) {
        const existing = await readAllRows(() => {
          let page = supabase.from("signups").select("quantity").eq("task_id", task_id).order("created_at").order("id");
          return isQueueTask ? page.eq("checked_in", false) : page;
        });
        currentHeadcount = (existing || []).reduce((sum, s) => sum + (s.quantity ?? 1), 0);
      } else {
        let query = supabase.from("signups").select("id", { count: "exact", head: true }).eq("task_id", task_id);
        if (isQueueTask) query = query.eq("checked_in", false);
        const { count, error: capacityError } = await query;
        if (capacityError) throw capacityError;
        currentHeadcount = count ?? 0;
      }
      if (currentHeadcount + incomingHeadcount > task.max_signups) {
        return NextResponse.json({ error: "這個任務已經額滿了" }, { status: 400 });
      }
    }

    const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
    const { data: recent, error: recentError } = await supabase.from("signups").select("created_at")
      .eq("task_id", task_id).eq("owner_token", owner_token).gte("created_at", windowStart)
      .order("created_at", { ascending: false }).limit(1);
    if (recentError) throw recentError;
    if (recent?.length) {
      const elapsedMs = Date.now() - new Date(recent[0].created_at).getTime();
      const waitSeconds = Math.max(1, Math.ceil((DUPLICATE_WINDOW_MS - elapsedMs) / 1000));
      return NextResponse.json({ error: `請稍候 ${waitSeconds} 秒後再試一次`, cooldown_seconds: waitSeconds }, { status: 429 });
    }

    if (cleanProxyEntries.length > 0) {
      const batchId = globalThis.crypto?.randomUUID?.() || null;
      const batchCreatedAt = Date.now();
      const rows = [
        { task_id, categories: selectedCategories, name: values.name, note: String(note || "").slice(0, 500), quantity: null, category_quantities: {}, owner_token, batch_id: batchId },
        ...cleanProxyEntries.map((entry) => ({ task_id, categories: entry.categories, name: entry.name, note: "", quantity: null, category_quantities: {}, owner_token, batch_id: batchId })),
      ].map((row, index) => ({ ...row, created_at: orderedCreatedAt(batchCreatedAt, index) }));
      const { data: inserted, error: proxyErr } = await supabase.from("signups").insert(rows).select(SIGNUP_FIELDS);
      if (proxyErr) throw proxyErr;
      await notifySignupActivity({ supabase, task, signup: inserted?.[inserted.length - 1] });
      return NextResponse.json({ signups: inserted, count: inserted.length });
    }

    if (isMultiEligible && cleanNames.length >= 2) {
      const batchId = globalThis.crypto?.randomUUID?.() || null;
      const batchCreatedAt = Date.now();
      const rows = cleanNames.map((nm, index) => ({
        task_id,
        categories: selectedCategories,
        name: nm.slice(0, 60),
        note: "",
        quantity: null,
        category_quantities: {},
        owner_token,
        batch_id: batchId,
        created_at: orderedCreatedAt(batchCreatedAt, index),
      }));
      const { data: inserted, error: multiErr } = await supabase.from("signups").insert(rows).select(SIGNUP_FIELDS);
      if (multiErr) throw multiErr;
      await notifySignupActivity({ supabase, task, signup: inserted?.[inserted.length - 1] });
      return NextResponse.json({ signups: inserted, count: inserted.length });
    }

    const { data, error } = await supabase.from("signups").insert({
      task_id, categories: isQueueTask ? [] : selectedCategories, name: values.name,
      note: isQueueTask ? "" : String(note || "").slice(0, 500), quantity: isQueueTask ? null : quantityValue,
      category_quantities: isQueueTask ? {} : categoryQuantitiesValue, owner_token,
    }).select(SIGNUP_FIELDS).single();
    if (error) throw error;
    await notifySignupActivity({ supabase, task, signup: data });
    return NextResponse.json({ signup: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "送出失敗" }, { status: 400 });
  }
}
