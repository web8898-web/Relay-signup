import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { notifySignupActivity } from "@/lib/smartNotify";
import { isHeadcountUnit } from "@/lib/utils";

const DUPLICATE_WINDOW_MS = 30_000;

export async function POST(request) {
  try {
    const body = await request.json();
    const { task_id, categories, name, names, note, quantity, category_quantities, owner_token } = body;

    const hasNames = Array.isArray(names) && names.some((n) => String(n || "").trim());
    if (!task_id || (!name && !hasNames) || !owner_token) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .select("id, title, categories, end_date, creator_id, notify_enabled, max_signups, quantity_unit, task_mode")
      .eq("id", task_id)
      .single();
    if (taskErr || !task) {
      return NextResponse.json({ error: "找不到這個任務" }, { status: 404 });
    }
    const selectedCategories =
      task.categories?.length > 0 && Array.isArray(categories)
        ? categories.filter((c) => task.categories.includes(c))
        : [];

    const headcountMode = isHeadcountUnit(task.quantity_unit);
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
      } else {
        const n = parseInt(quantity, 10);
        if (!Number.isFinite(n) || n <= 0) {
          return NextResponse.json({ error: `請填寫數量（${task.quantity_unit}）` }, { status: 400 });
        }
        quantityValue = n;
      }
    }

    const incomingHeadcount = headcountMode ? (quantityValue || 1) : 1;
    if (task.max_signups) {
      let currentHeadcount;
      if (headcountMode) {
        const { data: existing } = await supabase.from("signups").select("quantity").eq("task_id", task_id);
        currentHeadcount = (existing || []).reduce((sum, s) => sum + (s.quantity ?? 1), 0);
      } else {
        const { count } = await supabase
          .from("signups")
          .select("id", { count: "exact", head: true })
          .eq("task_id", task_id);
        currentHeadcount = count ?? 0;
      }
      if (currentHeadcount + incomingHeadcount > task.max_signups) {
        return NextResponse.json({ error: "這個任務已經額滿了" }, { status: 400 });
      }
    }

    const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
    const { data: recent } = await supabase
      .from("signups")
      .select("created_at")
      .eq("task_id", task_id)
      .eq("owner_token", owner_token)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recent && recent.length > 0) {
      const elapsedMs = Date.now() - new Date(recent[0].created_at).getTime();
      const waitSeconds = Math.max(1, Math.ceil((DUPLICATE_WINDOW_MS - elapsedMs) / 1000));
      return NextResponse.json(
        { error: `請稍候 ${waitSeconds} 秒後再試一次`, cooldown_seconds: waitSeconds },
        { status: 429 }
      );
    }

    const cleanNames = Array.isArray(names)
      ? names.map((n) => String(n || "").trim()).filter(Boolean).slice(0, 50)
      : [];
    const isMultiEligible =
      (!task.categories || task.categories.length === 0) && !task.quantity_unit;
    if (isMultiEligible && cleanNames.length >= 2) {
      if (task.max_signups) {
        const { count } = await supabase
          .from("signups")
          .select("id", { count: "exact", head: true })
          .eq("task_id", task_id);
        const remaining = task.max_signups - (count ?? 0);
        if (remaining <= 0) {
          return NextResponse.json({ error: "這個任務已經額滿了" }, { status: 400 });
        }
        if (cleanNames.length > remaining) {
          return NextResponse.json(
            { error: `名額不足，僅剩 ${remaining} 個，請減少報名人數` },
            { status: 400 }
          );
        }
      }
      const batchId = (globalThis.crypto?.randomUUID?.() ) || null;
      const rows = cleanNames.map((nm) => ({
        task_id,
        categories: [],
        name: nm.slice(0, 60),
        note: "",
        quantity: null,
        category_quantities: {},
        owner_token,
        batch_id: batchId,
      }));
      const { data: inserted, error: multiErr } = await supabase
        .from("signups")
        .insert(rows)
        .select();
      if (multiErr) throw multiErr;
      await notifySignupActivity({ supabase, task, signup: inserted?.[inserted.length - 1] });
      return NextResponse.json({ signups: inserted, count: inserted.length });
    }

    const { data, error } = await supabase
      .from("signups")
      .insert({
        task_id,
        categories: selectedCategories,
        name: String(name).slice(0, 60),
        note: String(note || "").slice(0, 500),
        quantity: quantityValue,
        category_quantities: categoryQuantitiesValue,
        owner_token,
      })
      .select()
      .single();

    if (error) throw error;

    await notifySignupActivity({ supabase, task, signup: data });

    return NextResponse.json({ signup: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "送出失敗" }, { status: 400 });
  }
}
