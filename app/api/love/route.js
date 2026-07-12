import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function taipeiDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function safeDisplayName(value) {
  return String(value || "").trim().slice(0, 60);
}

function userKey(lineUserId) {
  const secret = process.env.LOVE_EVENT_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("缺少 LOVE_EVENT_HASH_SECRET 或 SUPABASE_SERVICE_ROLE_KEY");
  return createHmac("sha256", secret).update(lineUserId).digest("hex");
}

async function getTotalCount(supabase) {
  const { count, error } = await supabase
    .from("love_events")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const totalCount = await getTotalCount(supabase);
    return NextResponse.json({ totalCount });
  } catch (error) {
    console.error("love count error", error);
    return NextResponse.json({ error: "暫時無法取得愛心數" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const accessToken = String(body?.accessToken || "").trim();

    if (!accessToken) {
      return NextResponse.json({ error: "請先使用 LINE 登入" }, { status: 401 });
    }

    const lineResponse = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!lineResponse.ok) {
      return NextResponse.json({ error: "LINE 登入狀態已失效，請重新登入" }, { status: 401 });
    }

    const lineProfile = await lineResponse.json();
    const displayName = safeDisplayName(lineProfile?.displayName);
    const lineUserId = String(lineProfile?.userId || "").trim();

    if (!lineUserId || !displayName) {
      return NextResponse.json({ error: "無法取得 LINE 顯示名稱" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const eventDate = taipeiDateString();
    const payload = {
      user_key: userKey(lineUserId),
      display_name: displayName,
      event_date: eventDate,
    };

    const { data, error } = await supabase
      .from("love_events")
      .insert(payload)
      .select("id, display_name, created_at")
      .single();

    if (error && error.code !== "23505") throw error;

    const totalCount = await getTotalCount(supabase);

    if (error?.code === "23505") {
      return NextResponse.json({
        accepted: false,
        totalCount,
        message: "今天已經送過愛心了 ❤️",
      });
    }

    return NextResponse.json({
      accepted: true,
      totalCount,
      event: data,
      message: "愛心已送出",
    });
  } catch (error) {
    console.error("send love error", error);
    return NextResponse.json({ error: "暫時無法送出愛心，請稍後再試" }, { status: 500 });
  }
}
