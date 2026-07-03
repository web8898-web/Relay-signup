import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleString("zh-TW", {
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

// GET /api/tasks/:id/export?format=csv|txt
// Returns a real, directly-downloadable file (with Content-Disposition)
// instead of a client-generated blob — LINE's in-app browser often can't
// handle blob-based downloads, but a normal file URL works fine, especially
// when opened in the phone's default browser.
export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "txt" ? "txt" : "csv";

  const { data: task } = await supabase.from("tasks").select("*").eq("id", params.id).single();
  if (!task) {
    return NextResponse.json({ error: "找不到這個任務" }, { status: 404 });
  }

  const { data: signupData } = await supabase
    .from("signups")
    .select("*")
    .eq("task_id", params.id)
    .order("created_at", { ascending: true });
  const list = signupData || [];

  let content, mime, ext;

  const hasQuantity = !!task.quantity_unit;
  const totalQuantity = hasQuantity ? list.reduce((sum, s) => sum + (s.quantity || 0), 0) : 0;

  if (format === "csv") {
    const headers = hasQuantity
      ? ["編號", "姓名", "分類", `數量（${task.quantity_unit}）`, "備註", "報名時間"]
      : ["編號", "姓名", "分類", "備註", "報名時間"];
    const rows = list.map((s, i) =>
      hasQuantity
        ? [i + 1, s.name, s.category || "", s.quantity ?? "", s.note || "", fmtTime(s.created_at)]
        : [i + 1, s.name, s.category || "", s.note || "", fmtTime(s.created_at)]
    );
    if (hasQuantity) {
      rows.push(["", "", "", `合計：${totalQuantity} ${task.quantity_unit}`, "", ""]);
    }
    content = "\uFEFF" + [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
    mime = "text/csv;charset=utf-8";
    ext = "csv";
  } else {
    const lines = [];
    lines.push(`任務：${task.title}`);
    lines.push(`匯出時間：${fmtTime(new Date().toISOString())}`);
    lines.push(`總計：${list.length} 人報名`);
    if (hasQuantity) lines.push(`合計數量：${totalQuantity} ${task.quantity_unit}`);
    lines.push("");
    list.forEach((s, i) => {
      const parts = [`${i + 1}. ${s.name}`];
      if (s.category) parts.push(`分類：${s.category}`);
      if (hasQuantity) parts.push(`數量：${s.quantity ?? "-"} ${task.quantity_unit}`);
      parts.push(`備註：${s.note || "無"}`);
      parts.push(`報名時間：${fmtTime(s.created_at)}`);
      lines.push(parts.join("　"));
    });
    content = "\uFEFF" + lines.join("\n");
    mime = "text/plain;charset=utf-8";
    ext = "txt";
  }

  const filename = `${safeFilename(task.title)}-報名名單.${ext}`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
