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
      .select("id, title, categories, end_date, creator_id, notify_enabled, max_signups, quantity_unit")
      .eq("id", task_id)
      .single();
    if (taskErr || !task) {
      return NextResponse.json({ error: "找不到這個任務" }, { status: 404 });
    }
    const selectedCategories =
      task.categories?.length > 0 && Array.isArray(categories)
        ? categories.filter((c) => task.categories.includes(c))
        : [];

    // When the organizer has set a quantity unit (e.g. a group-buy relay),
    // a quantity is mandatory. If they've also set up tags AND the person
    // picked at least one, quantity is tracked per tag (e.g. 雞排 x2,
    // 珍奶 x3) instead of one lump number — that's the whole point of
    // combining the two features. Falls back to a single quantity when
    // there are no tags selected to attach a per-item quantity to.
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
        // When the unit means "people" (人/位/名/口), each category's
        // number represents extra people brought along for that category
        // (e.g. 帶小孩 2人 = 2 kids) — the signer themselves isn't counted
        // in any specific category, so they're added once on top of the
        // category sum. Product-style units (份/斤/包) have no "self" to
        // add — the total there is just whatever was ordered.
        quantityValue = headcountMode ? total + 1 : total;
      } else {
        // Quantity here represents this signup's total party size (e.g. a
        // headcount unit like 人 defaults to 1 meaning "just me") — always
        // at least 1, since you're always at least yourself.
        const n = parseInt(quantity, 10);
        if (!Number.isFinite(n) || n <= 0) {
          return NextResponse.json({ error: `請填寫數量（${task.quantity_unit}）` }, { status: 400 });
        }
        quantityValue = n;
      }
    }

    // Enforce the optional headcount cap. Counting immediately before the
    // insert (rather than trusting a count the client already has) keeps
    // this correct even when the page has been open a while — it can
    // still theoretically race if two people submit at the exact same
    // instant, but for the scale this tool is built for, that's an
    // acceptable tradeoff against the complexity of a database-level
    // transaction/lock.
    //
    // When the quantity unit is a "people" word (人/位/名/口), the quantity
    // itself IS this signup's headcount contribution (e.g. quantity 4 means
    // a party of 4, not "4 extra plus the signer") — so it's counted
    // directly, not just 1 row per signup.
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

    // Block the same browser (identified by the owner_token already used
    // for edit/delete rights) from submitting another signup for this
    // same task within 30 seconds. This is meant to catch accidental
    // double-taps or duplicate submits — it deliberately does NOT block
    // different owner_tokens, and does NOT block this same browser from
    // signing up again after the window passes, since one person signing
    // up several people in a row (e.g. their whole family) from the same
    // device is a legitimate, common use of this tool.
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

    // ── 多人報名（一次幫多人）──
    // 僅在任務「無分類且無數量單位」時開放，此時每人 = 一個名額，
    // 結構最單純。names 帶 2 個以上有效名字時走這條批次分支。
    const cleanNames = Array.isArray(names)
      ? names.map((n) => String(n || "").trim()).filter(Boolean).slice(0, 50)
      : [];
    const isMultiEligible =
      (!task.categories || task.categories.length === 0) && !task.quantity_unit;
    if (isMultiEligible && cleanNames.length >= 2) {
      // 名額檢查：一般任務每人算 1 個名額
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
      // 同一批一起送出的報名共用一個 batch_id，供名單顯示「同組」側標
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
      // 智慧通知：批次視為多筆活動，用最後一筆觸發一次評估即可
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

    // 智慧通知模式：不再每一筆報名都推播，改由集中管理的邏輯
    // 判斷是否符合通知條件（額滿／第一位報名／里程碑／10 分鐘
    // 摘要），詳見 lib/smartNotify.js。一樣是 fire-and-forget，
    // 通知失敗不影響報名本身。
    await notifySignupActivity({ supabase, task, signup: data });

    return NextResponse.json({ signup: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "送出失敗" }, { status: 400 });
  }
}
