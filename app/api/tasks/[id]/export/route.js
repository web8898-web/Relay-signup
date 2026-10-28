import { readAllRows } from "@/lib/readAllRows";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getBearerToken, verifyLineAccessToken } from "@/lib/lineAuth";
import { createExportTicket, readExportTicket } from "@/lib/exportTicket";
import { SIGNUP_FIELDS } from "@/lib/signupFields";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    const profile = await verifyLineAccessToken(getBearerToken(request));
    const supabase = getSupabaseAdmin();
    const { data: task } = await supabase.from("tasks").select("creator_id").eq("id", params.id).single();
    if (!task || task.creator_id !== profile.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();
    const ticket = createExportTicket(params.id, body.format === "txt" ? "txt" : "csv", body.language === "en" ? "en" : "zh", process.env.SUPABASE_SERVICE_ROLE_KEY);
    return NextResponse.json({ url: `/api/tasks/${params.id}/export?ticket=${ticket}` }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Unable to authorize export" }, { status: 403 }); }
}

function fmtTime(iso, language = "zh") {
  try {
    return new Date(iso).toLocaleString(language === "en" ? "en-US" : "zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function safeFilename(s) {
  return (s || "任務").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// GET /api/tasks/:id/export?ticket=<short-lived signed ticket>
// Returns a real, directly-downloadable file (with Content-Disposition)
// instead of a client-generated blob — LINE's in-app browser often can't
// handle blob-based downloads, but a normal file URL works fine, especially
// when opened in the phone's default browser.
export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const ticket = readExportTicket(searchParams.get("ticket"), params.id, process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!ticket) return NextResponse.json({ error: "Export link is invalid or expired" }, { status: 403 });
  const supabase = getSupabaseAdmin();
  const format = ticket.format;
  const en = ticket.language === "en";
  const t = (zh, english) => en ? english : zh;

  const { data: task } = await supabase.from("tasks").select("*").eq("id", params.id).single();
  if (!task) {
    return NextResponse.json({ error: "找不到這個任務" }, { status: 404 });
  }

  let list;
  try {
    list = await readAllRows(() => supabase.from("signups").select(SIGNUP_FIELDS).eq("task_id", params.id)
      .order("created_at", { ascending: true }).order("id", { ascending: true }));
  } catch {
    return NextResponse.json({ error: t("讀取名單失敗，請重試", "Unable to load the list. Please retry.") }, { status: 503 });
  }

  let content, mime, ext;

  const hasQuantity = !!task.quantity_unit;
  const totalQuantity = hasQuantity ? list.reduce((sum, s) => sum + (s.quantity || 0), 0) : 0;

  // Per-tag totals (e.g. 雞排 共 12 份、珍奶 共 8 份), gathered from every
  // signup that used the per-category quantity breakdown.
  const categoryTotals = {};
  if (hasQuantity) {
    list.forEach((s) => {
      if (s.category_quantities) {
        Object.entries(s.category_quantities).forEach(([cat, qty]) => {
          categoryTotals[cat] = (categoryTotals[cat] || 0) + (qty || 0);
        });
      }
    });
  }
  const categoryTotalsText = Object.entries(categoryTotals)
    .map(([cat, qty]) => `${cat} ${t("共", "total")} ${qty} ${task.quantity_unit}`)
    .join("、");

  function quantityDetailText(s) {
    if (s.category_quantities && Object.keys(s.category_quantities).length > 0) {
      return Object.entries(s.category_quantities)
        .map(([c, q]) => `${c}:${q}`)
        .join("、");
    }
    return s.quantity != null ? String(s.quantity) : "";
  }

  if (format === "csv") {
    const headers = hasQuantity
      ? [t("編號", "No."), t("姓名", "Name"), t("分類", "Category"), `${t("數量明細", "Quantity details")} (${task.quantity_unit})`, t("備註", "Notes"), t("報名時間", "Signup time")]
      : [t("編號", "No."), t("姓名", "Name"), t("分類", "Category"), t("備註", "Notes"), t("報名時間", "Signup time")];
    const rows = list.map((s, i) =>
      hasQuantity
        ? [i + 1, s.name, s.categories?.join("、") || "", quantityDetailText(s), s.note || "", fmtTime(s.created_at, ticket.language)]
        : [i + 1, s.name, s.categories?.join("、") || "", s.note || "", fmtTime(s.created_at, ticket.language)]
    );
    if (hasQuantity) {
      rows.push(["", "", "", `${t("合計：", "Total: ")}${totalQuantity} ${task.quantity_unit}`, "", ""]);
      if (categoryTotalsText) rows.push(["", "", "", categoryTotalsText, "", ""]);
    }
    content = "\uFEFF" + [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
    mime = "text/csv;charset=utf-8";
    ext = "csv";
  } else {
    const lines = [];
    lines.push(`${t("任務：", "Task: ")}${task.title}`);
    lines.push(`${t("匯出時間：", "Export time: ")}${fmtTime(new Date().toISOString(), ticket.language)}`);
    lines.push(en ? `Total: ${list.length} signups` : `總計：${list.length} 人報名`);
    if (hasQuantity) {
      lines.push(`${t("合計數量：", "Total quantity: ")}${totalQuantity} ${task.quantity_unit}`);
      if (categoryTotalsText) lines.push(`${t("分類合計：", "Category totals: ")}${categoryTotalsText}`);
    }
    lines.push("");
    list.forEach((s, i) => {
      const parts = [`${i + 1}. ${s.name}`];
      if (s.categories?.length > 0) parts.push(`${t("分類：", "Category: ")}${s.categories.join("、")}`);
      if (hasQuantity) parts.push(`${t("數量：", "Quantity: ")}${quantityDetailText(s) || "-"} ${task.quantity_unit}`);
      parts.push(`${t("備註：", "Notes: ")}${s.note || t("無", "None")}`);
      parts.push(`${t("報名時間：", "Signup time: ")}${fmtTime(s.created_at, ticket.language)}`);
      lines.push(parts.join("　"));
    });
    content = "\uFEFF" + lines.join("\n");
    mime = "text/plain;charset=utf-8";
    ext = "txt";
  }

  const filename = `${safeFilename(task.title)}-${en ? "signups" : "報名名單"}.${ext}`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
