import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendLinePush } from "@/lib/linePush";
import { isHeadcountUnit } from "@/lib/utils";

const DUPLICATE_WINDOW_MS = 30_000;

export async function POST(request) {
  try {
    const body = await request.json();
    const { task_id, categories, name, note, quantity, category_quantities, owner_token } = body;

    if (!task_id || !name || !owner_token) {
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
        quantityValue = total;
      } else {
        // A headcount unit with no categories represents "how many extra
        // people you're bringing" — 0 is a perfectly valid answer (nobody
        // extra). Product-style units (份/斤/包) still require at least 1,
        // since ordering zero of something doesn't make sense.
        const n = parseInt(quantity, 10);
        const minValid = headcountMode ? 0 : 1;
        if (!Number.isFinite(n) || n < minValid) {
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
    // When the quantity unit is a "people" word (人/位/名/口), each existing
    // signup contributes 1 (the signer) + their quantity (people they're
    // bringing) toward the cap, not just 1 row — e.g. someone signing up
    // and bringing 5 people counts as 6 toward the limit.
    const incomingHeadcount = headcountMode ? 1 + (quantityValue || 0) : 1;
    if (task.max_signups) {
      let currentHeadcount;
      if (headcountMode) {
        const { data: existing } = await supabase.from("signups").select("quantity").eq("task_id", task_id);
        currentHeadcount = (existing || []).reduce((sum, s) => sum + 1 + (s.quantity || 0), 0);
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

    // Notify the organizer via a LINE push message. This is fire-and-forget
    // — if it fails (e.g. the organizer hasn't added the notification
    // Official Account as a friend yet), the signup itself still succeeds.
    if (task.creator_id && task.notify_enabled !== false) {
      const { count } = await supabase
        .from("signups")
        .select("id", { count: "exact", head: true })
        .eq("task_id", task_id);

      const lines = [`📋 ${task.title} 有新的接龍報名！`, "", `👤 姓名：${data.name}`];
      if (data.categories?.length > 0) {
        const hasBreakdown = data.category_quantities && Object.keys(data.category_quantities).length > 0;
        const catText = hasBreakdown
          ? data.categories.map((c) => `${c}（${data.category_quantities[c]} ${task.quantity_unit}）`).join("、")
          : data.categories.join("、");
        lines.push(`🏷 分類：${catText}`);
        if (hasBreakdown) lines.push(`🔢 合計數量：${data.quantity} ${task.quantity_unit}`);
      }
      if (data.quantity != null && !(data.categories?.length > 0)) {
        lines.push(`🔢 數量：${data.quantity} ${task.quantity_unit}`);
      }
      if (data.note) lines.push(`📝 備註：${data.note}`);
      lines.push("", `目前共 ${count ?? "?"} 人報名`);

      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (liffId) {
        lines.push("", "👉 查看完整名單", `https://liff.line.me/${liffId}/my-tasks/${task_id}`);
      }

      await sendLinePush(task.creator_id, lines.join("\n"));
    }

    return NextResponse.json({ signup: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "送出失敗" }, { status: 400 });
  }
}
