"use client";
import { useEffect } from "react";
import { Minus, Plus } from "lucide-react";

const HEADCOUNT_STANDALONE_LABELS = new Set([
  "數量（人）",
  "數量（位）",
  "數量（名）",
  "數量（口）",
]);

// A tap-to-increment/decrement control, used instead of a typed number
// input for quantity fields — much easier to operate on a phone than
// bringing up the number keyboard for what's usually a small count.
export default function QuantityStepper({ value, onChange, min = 1, max = 999, label }) {
  const isStandaloneHeadcount = HEADCOUNT_STANDALONE_LABELS.has(label);
  const effectiveMin = isStandaloneHeadcount ? 0 : min;

  useEffect(() => {
    if (isStandaloneHeadcount && value === 1) onChange(0);
  }, [isStandaloneHeadcount]);

  return (
    <div className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-full pl-4 pr-1.5 py-1.5">
      {label && <span className="text-sm text-gray-600 truncate">{label}</span>}
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <button
          type="button"
          onClick={() => onChange(Math.max(effectiveMin, value - 1))}
          disabled={value <= effectiveMin}
          className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition"
          aria-label="減少"
        >
          <Minus size={14} />
        </button>
        <span className="w-7 text-center text-sm font-semibold text-gray-800">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition"
          aria-label="增加"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
