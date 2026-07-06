// 報名截止通知的每日排程進入點。
//
// 由 Vercel Cron 每天台北時間 00:05 呼叫（見專案根目錄 vercel.json），
// 找出剛過截止日的任務，發送一次「報名已截止」通知給主辦人。
// 實際邏輯集中在 lib/smartNotify.js 的 notifyRegistrationClosed。
//
// 安全性：需要在 Vercel 環境變數設定 CRON_SECRET（任意長隨機字串）。
// Vercel Cron 呼叫時會自動帶上 Authorization: Bearer <CRON_SECRET>，
// 沒帶或不符的請求一律拒絕，避免被外人任意觸發。

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyRegistrationClosed } from "@/lib/smartNotify";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const sent = await notifyRegistrationClosed(supabase);
  return NextResponse.json({ ok: true, sent });
}
