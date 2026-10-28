import { SIGNUP_FIELDS } from "@/lib/signupFields";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { signupValues } from "@/lib/signupValidation";
import { notifySignupActivity, handleSignupRemoved } from "@/lib/smartNotify";

async function assertOwnership(supabase, signupId, ownerToken) {
  const { data, error } = await supabase.from("signups").select("owner_token, task_id, name, note, categories, quantity, category_quantities").eq("id", signupId).single();
  if (error || !data) throw new Error("找不到這筆報名資料");
  if (data.owner_token !== ownerToken) throw new Error("你沒有權限編輯這筆資料");
  return data;
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { name, note, categories, quantity, category_quantities, owner_token } = body;
    if (!owner_token) return NextResponse.json({ error: "缺少驗證資訊" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const current = await assertOwnership(supabase, params.id, owner_token);
    const taskId = current.task_id;

    const { data: task, error: taskError } = await supabase.from("tasks").select("*").eq("id", taskId).single();
    if (taskError || !task) throw new Error("找不到這個任務");
    const update = signupValues(task, { ...current, ...body }, { editing: true });

    const { data, error } = await supabase
      .from("signups")
      .update(update)
      .eq("id", params.id)
      .select(SIGNUP_FIELDS)
      .single();

    if (error) throw error;

    // 智慧通知模式：編輯後重新評估是否跨過通知門檻（額滿／里程碑）。
    // fire-and-forget，通知失敗不影響編輯本身；已通知過的事件由
    // notification_log 擋下，不會重複推播。
    const { data: notifyTask } = await supabase
      .from("tasks")
      .select("id, title, creator_id, notify_enabled, max_signups, quantity_unit")
      .eq("id", taskId)
      .single();
    if (notifyTask) {
      await notifySignupActivity({ supabase, task: notifyTask, signup: null });
    }

    return NextResponse.json({ signup: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "更新失敗" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const owner_token = searchParams.get("owner_token");
    if (!owner_token) return NextResponse.json({ error: "缺少驗證資訊" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const current = await assertOwnership(supabase, params.id, owner_token);
    const taskId = current.task_id;

    const { error } = await supabase.from("signups").delete().eq("id", params.id);
    if (error) throw error;

    // 刪除報名一律不發通知（智慧通知規格）。這裡只在「先前已額滿」
    // 的情況下悄悄記錄名額空出的狀態，之後有人補位、再次額滿時，
    // 主辦人會收到「名額再次額滿」通知。
    const { data: task } = await supabase
      .from("tasks")
      .select("id, max_signups, quantity_unit")
      .eq("id", taskId)
      .single();
    if (task) await handleSignupRemoved({ supabase, task });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "刪除失敗" }, { status: 400 });
  }
}
