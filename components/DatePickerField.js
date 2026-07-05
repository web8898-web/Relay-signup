"use client";
import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function pad(n) {
  return String(n).padStart(2, "0");
}
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseDateStr(s) {
  if (!s) return new Date();
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// A fully custom date picker to replace the browser's native <input
// type="date">, whose calendar UI (button labels, layout, tap targets) is
// controlled entirely by the OS/browser and can't be restyled or relabeled.
// This renders as a centered dialog — the same pattern already used
// elsewhere in this app for confirmation modals — so the "今天" / "確認"
// buttons always land in a fixed, easy-to-reach spot regardless of where
// the trigger sits on the page.
export default function DatePickerField({ value, onChange, className = "", placeholder = "選擇日期", minDate, maxDate, rangeErrorMessage }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDateStr(value));
  const [selected, setSelected] = useState(() => parseDateStr(value));

  useEffect(() => {
    if (open) {
      setViewDate(parseDateStr(value));
      setSelected(parseDateStr(value));
    }
  }, [open, value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array(daysInMonth).keys()].map((v) => (v === null ? null : v + 1));

  const selectedStr = toDateStr(selected);
  // Cross-field validation — e.g. the start-date picker gets passed the
  // current end date as `maxDate`, so picking something later than that
  // is flagged here and blocks confirming, instead of silently saving an
  // invalid range like "7/7 ~ 7/4".
  const outOfRange = (maxDate && selectedStr > maxDate) || (minDate && selectedStr < minDate);

  function goToday() {
    const today = new Date();
    setViewDate(today);
    setSelected(today);
  }

  function confirm() {
    if (outOfRange) return;
    onChange(toDateStr(selected));
    setOpen(false);
  }

  function display(s) {
    if (!s) return placeholder;
    const d = parseDateStr(s);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`flex items-center gap-2 text-left ${className}`}>
        <Calendar size={15} className="text-emerald-500 shrink-0" />
        <span className="truncate">{display(value)}</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="上個月"
              >
                <ChevronLeft size={16} />
              </button>
              <p className="text-xl font-semibold text-gray-800">
                {year}年{month + 1}月
              </p>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="下個月"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-[11px] text-gray-400 font-medium py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />;
                const cellDate = new Date(year, month, d);
                const cellStr = toDateStr(cellDate);
                const isSelected = isSameDay(cellDate, selected);
                const isToday = isSameDay(cellDate, new Date());
                const cellOutOfRange = (maxDate && cellStr > maxDate) || (minDate && cellStr < minDate);
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setSelected(cellDate)}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    className={`w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? outOfRange
                          ? "bg-rose-100 text-rose-500"
                          : "bg-emerald-500 text-white"
                        : cellOutOfRange
                        ? "text-gray-300 hover:bg-gray-50"
                        : isToday
                        ? "text-emerald-600 border border-emerald-300"
                        : "text-gray-600 hover:bg-emerald-50"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {outOfRange && (
              <p className="text-xs text-rose-500 text-center mt-3 flex items-center justify-center gap-1">
                <AlertCircle size={12} className="shrink-0" />
                {rangeErrorMessage || "日期範圍不正確"}
              </p>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <button type="button" onClick={goToday} className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 px-2 py-2">
                今天
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={outOfRange}
                className={`text-sm font-semibold px-6 py-2.5 rounded-full transition ${
                  outOfRange
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
