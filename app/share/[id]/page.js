"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Share2, CheckCircle2, AlertCircle, CalendarDays, MessageCircleMore } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { buildFlexMessage, buildShareText, lineShareUrl, isQueueTask } from "@/lib/utils";
import { initLiff, liff } from "@/lib/liff";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function parseDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return { year, month, day, weekday };
}

function formatDateRange(startValue, endValue) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (!start || !end) return `${startValue || ""} ~ ${endValue || ""}`.trim();
  const left = `${start.year}年${start.month}月${start.day}日 (${start.weekday})`;
  const right = start.year === end.year
    ? `${end.month}月${end.day}日 (${end.weekday})`
    : `${end.year}年${end.month}月${end.day}日 (${end.weekday})`;
  return `${left} ~ ${right}`;
}

export default function ShareAgainPage() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("tasks").select("*").eq("id", id).single();
      if (!active) return;
      setTask(data || null);
      setLoading(false);
      try {
        await initLiff();
      } catch (e) {}
    })();
    return () => { active = false; };
  }, [id]);

  function taskUrl() {
    const base = task?.short_code
      ? `${window.location.origin}/s/${task.short_code}`
      : `${window.location.origin}/tasks/${id}`;
    const url = new URL(base);
    if (isQueueTask(task)) url.searchParams.set("queue", "1");
    return url.toString();
  }

  async function handleShare() {
    if (!task || sharing) return;
    setSharing(true);
    setError("");
    setMessage("");
    const url = taskUrl();
    try {
      await initLiff();
      if (liff.isApiAvailable?.("shareTargetPicker")) {
        await liff.shareTargetPicker([buildFlexMessage(task, url)]);
        setMessage("分享已送出");
        setSharing(false);
        return;
      }
    } catch (e) {}

    try {
      window.location.href = lineShareUrl(buildShareText(task, url));
    } catch (e) {
      setError("目前無法開啟分享，請稍後再試");
    }
    setSharing(false);
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-emerald-50/60 text-sm text-gray-400">載入接龍中…</div>;
  }

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-50/60 px-8 text-center">
        <AlertCircle className="text-gray-300" size={36} />
        <p className="mt-3 font-semibold text-gray-600">找不到這個接龍</p>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#d1fae5_0%,#ecfdf5_28%,#ffffff_68%)] px-5 py-8">
      <div className="pointer-events-none absolute -right-16 top-8 h-44 w-44 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-52 w-52 rounded-full bg-teal-100/60 blur-3xl" />

      <section className="relative mx-auto my-auto w-full max-w-sm overflow-hidden rounded-[32px] border border-white/80 bg-white/95 shadow-[0_24px_70px_-32px_rgba(5,150,105,0.45)] backdrop-blur">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500 px-6 pb-10 pt-7 text-white">
          <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/15" />
          <div className="absolute -right-2 -top-4 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative flex items-center gap-3 text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/95 shadow-lg shadow-emerald-900/10 ring-1 ring-white/80">
              <img src="/app-icon.png" alt="接龍報名小助手 LOGO" className="h-11 w-11 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-emerald-50/90">RELAY SIGNUP</p>
              <p className="mt-1 text-lg font-bold tracking-wide">接龍報名小助手</p>
              <p className="mt-0.5 text-xs text-emerald-50/80">把接龍，變簡單</p>
            </div>
          </div>
        </div>

        <div className="relative -mt-5 px-5 pb-6">
          <div className="rounded-[26px] border border-emerald-100 bg-white px-5 py-5 text-left shadow-[0_12px_36px_-22px_rgba(15,118,110,0.38)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                <MessageCircleMore size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-emerald-600">準備分享這個接龍</p>
                <h1 className="mt-1 break-words text-[22px] font-bold leading-snug text-gray-800">{task.title}</h1>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50/70 px-3.5 py-3 text-[12px] leading-relaxed text-gray-500">
              <CalendarDays size={15} className="mt-0.5 shrink-0 text-emerald-500" />
              <span>{formatDateRange(task.start_date, task.end_date)}</span>
            </div>

            <p className="mt-4 text-center text-sm leading-relaxed text-gray-400">
              將這個接龍分享到其他 LINE 群組或好友。
            </p>

            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-3.5 text-base font-semibold text-white shadow-[0_12px_24px_-12px_rgba(16,185,129,0.8)] transition active:scale-[0.98] disabled:opacity-60"
            >
              <Share2 size={18} /> {sharing ? "開啟中…" : "分享到其他群組"}
            </button>

            {message && (
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 size={14} /> {message}
              </p>
            )}
            {error && <p className="mt-4 text-center text-xs text-rose-500">{error}</p>}
          </div>

          <p className="mt-4 text-center text-[11px] text-gray-300">接龍內容不會被複製，分享的是同一個任務</p>
        </div>
      </section>
    </main>
  );
}
