"use client";
import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

const WEEKDAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
function readLanguage() {
  if (typeof document !== "undefined" && document.documentElement.dataset.relayLanguage === "en") return "en";
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem("relay_home_language") === "en" ? "en" : "zh";
    } catch {}
  }
  return "zh";
}

export default function DatePickerField({ value, onChange, className = "", placeholder = "選擇日期", minDate, maxDate, rangeErrorMessage }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDateStr(value));
  const [selected, setSelected] = useState(() => parseDateStr(value));
  const [language, setLanguage] = useState(() => readLanguage());
  const isEnglish = language === "en";

  useEffect(() => {
    const syncLanguage = () => setLanguage(readLanguage());
    syncLanguage();
    window.addEventListener("relay-language-change", syncLanguage);
    return () => window.removeEventListener("relay-language-change", syncLanguage);
  }, []);

  useEffect(() => {
    if (open) {
      setViewDate(parseDateStr(value));
      setSelected(parseDateStr(value));
      setLanguage(readLanguage());
    }
  }, [open, value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array(daysInMonth).keys()].map((v) => (v === null ? null : v + 1));
  const weekdays = isEnglish ? WEEKDAYS_EN : WEEKDAYS_ZH;

  const selectedStr = toDateStr(selected);
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
    if (!s) return isEnglish && placeholder === "選擇日期" ? "Select date" : placeholder;
    const d = parseDateStr(s);
    if (isEnglish) {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(d);
    }
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
                aria-label={isEnglish ? "Previous month" : "上個月"}
              >
                <ChevronLeft size={16} />
              </button>
              <p className="text-xl font-semibold text-gray-800">
                {isEnglish ? `${MONTHS_EN[month]} ${year}` : `${year}年${month + 1}月`}
              </p>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                aria-label={isEnglish ? "Next month" : "下個月"}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {weekdays.map((w) => (
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
                {isEnglish
                  ? (rangeErrorMessage === "起始日期不能晚於結束日期"
                      ? "Start date cannot be later than end date"
                      : rangeErrorMessage === "結束日期不能早於起始日期"
                      ? "End date cannot be earlier than start date"
                      : "Invalid date range")
                  : (rangeErrorMessage || "日期範圍不正確")}
              </p>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <button type="button" onClick={goToday} className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 px-2 py-2">
                {isEnglish ? "Today" : "今天"}
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
                {isEnglish ? "Confirm" : "確認"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}