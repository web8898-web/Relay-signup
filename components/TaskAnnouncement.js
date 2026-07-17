"use client";
import { MessageCircle, Calendar } from "lucide-react";
import { taskStatus, getVisibleCategories } from "@/lib/utils";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function visibleNote(value = "") {
  return String(value)
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "__relay_queue_mode__")
    .join("\n")
    .trim();
}

function parseDateParts(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return { year, month, day, weekday };
}

function formatDateRange(startValue, endValue) {
  const start = parseDateParts(startValue);
  const end = parseDateParts(endValue);
  if (!start || !end) return `${startValue || ""} ~ ${endValue || ""}`.trim();

  const startText = `${start.year}年${start.month}月${start.day}日 (${start.weekday})`;
  const endText = start.year === end.year
    ? `${end.month}月${end.day}日 (${end.weekday})`
    : `${end.year}年${end.month}月${end.day}日 (${end.weekday})`;

  return `${startText} ~ ${endText}`;
}

export default function TaskAnnouncement({ task, full }) {
  const st = taskStatus(task);
  const label = full && st.label === "進行中" ? "已額滿" : st.label;
  const note = visibleNote(task.note);
  const categories = getVisibleCategories(task.categories);

  return (
    <div className="flex gap-2 items-start">
      <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
        <MessageCircle size={16} />
      </div>
      <div className="flex-1">
        <p className="text-[11px] text-gray-400 mb-1">{task.creator_name || "主辦人"}</p>
        <div className="bg-emerald-500 text-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold">{task.title}</p>
            <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white/20">{label}</span>
          </div>
          {task.description && <p className="text-sm text-emerald-50 mt-1.5 leading-relaxed whitespace-pre-wrap">{task.description}</p>}
          <div className="flex items-center gap-1 text-[11px] text-emerald-50 mt-2">
            <Calendar size={12} /> {formatDateRange(task.start_date, task.end_date)}
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {categories.map((c) => (
                <span key={c} className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{c}</span>
              ))}
            </div>
          )}
          {note && <p className="text-xs text-emerald-50/90 mt-2 border-t border-white/20 pt-2 whitespace-pre-wrap">備註：{note}</p>}
        </div>
      </div>
    </div>
  );
}
