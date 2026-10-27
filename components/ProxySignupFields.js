"use client";
import { useLanguage } from "@/lib/useLanguage";
import { toggleCategorySelection } from "@/lib/taskConfig";

export default function ProxySignupFields({ categories, mode, required, entries, onChange }) {
  const en = useLanguage() === "en";
  const rows = entries.length && !entries[entries.length - 1].name.trim() ? entries : [...entries, { name: "", categories: [] }].slice(0, 49);
  const count = entries.filter((entry) => entry.name.trim()).length;
  function update(index, patch) {
    const next = rows.map((row, i) => i === index ? { ...row, ...patch } : row);
    while (next.length > 1 && !next.at(-1).name.trim() && !next.at(-2).name.trim()) next.pop();
    onChange(next);
  }
  return <div data-no-auto-i18n="true" className="flex flex-col gap-2">
    {rows.map((entry, index) => <div key={index} className="category-multi-signup-row flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-white/70 p-2.5">
      <div className="category-multi-signup-categories"><p className="text-[11px] font-semibold text-emerald-700 mb-1.5 px-0.5">👉 {en ? "Categories for additional participant" : "選擇代報者的分類"}（{mode === "single" ? (en ? "Single" : "單選") : (en ? "Multiple" : "可複選")}{required ? (en ? " · Required" : "・必選") : ""}）</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 px-1">{categories.map((category) => <button key={category} type="button" aria-pressed={entry.categories.includes(category)} onClick={() => update(index, { categories: toggleCategorySelection(entry.categories, category, mode) })} className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${entry.categories.includes(category) ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-500 border-gray-200"}`}>{category}</button>)}</div>
      </div>
      <input value={entry.name} maxLength={60} onChange={(event) => update(index, { name: event.target.value })} placeholder={en ? "Sign up someone else (optional)" : "幫別人報名（選填）"} className="category-multi-signup-input w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition" />
    </div>)}
    {count > 0 && <p className="text-[11px] text-emerald-600 px-2 -mt-0.5">{en ? `Signing up ${count + 1} people` : `這次共幫 ${count + 1} 位報名`}</p>}
  </div>;
}
