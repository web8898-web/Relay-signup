"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, X, LogIn, LogOut, MessageCircle } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import OrganizerTabs from "@/components/OrganizerTabs";
import { useLineProfile } from "@/lib/useLineProfile";
import { avatarClass, chipClass, todayStr } from "@/lib/utils";

export default function CreateTaskPage() {
  const router = useRouter();
  const { profile, loading, error, login, logout } = useLineProfile();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="建立任務" backHref="/" />
        <div className="flex-1 flex items-center justify-center text-emerald-500">
          <Loader2 className="animate-spin" size={28} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="建立任務" backHref="/" />
        <div className="flex-1 px-6 py-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
            <MessageCircle size={34} />
          </div>
          <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
            建立任務前，請先使用 LINE 登入，<br />這樣才能管理你建立的任務。
          </p>
          {error && <p className="text-xs text-rose-500 mb-4">{error}</p>}
          <button
            onClick={login}
            className="w-full bg-emerald-500 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition"
          >
            <LogIn size={18} /> 使用 LINE 登入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar
        title="建立任務"
        backHref="/"
        right={
          <button onClick={logout} className="text-white/80 hover:text-white" title="登出">
            <LogOut size={18} />
          </button>
        }
      />
      <OrganizerTabs current="new" />
      <div className="px-6 pt-2 pb-1 flex items-center gap-2 text-xs text-gray-400">
        <div className={`w-6 h-6 rounded-full ${avatarClass(profile.displayName)} text-white flex items-center justify-center text-[11px] font-bold`}>
          {profile.displayName?.[0] || "?"}
        </div>
        以 <span className="font-medium text-gray-600">{profile.displayName}</span> 身分登入
      </div>
      <TaskForm accessToken={profile.accessToken} onCreated={(id) => router.push(`/create/share/${id}`)} />
    </div>
  );
}

function TaskForm({ accessToken, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [catInput, setCatInput] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addCategory() {
    const v = catInput.trim();
    if (v && !categories.includes(v)) setCategories([...categories, v]);
    setCatInput("");
  }
  function removeCategory(c) {
    setCategories(categories.filter((x) => x !== c));
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categories,
          start_date: startDate,
          end_date: endDate,
          note: note.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data.task.id);
    } catch (e) {
      setError(e.message || "儲存失敗，請再試一次");
    }
    setSaving(false);
  }

  return (
    <>
      <div className="flex-1 px-6 py-4 flex flex-col gap-5 overflow-y-auto">
        {error && <p className="text-xs text-rose-500">{error}</p>}
        <Field label="任務標題">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：週五團購水果"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </Field>

        <Field label="簡介">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="簡單說明這個任務在做什麼"
            rows={3}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </Field>

        <Field label="分類（自訂，選填）">
          <div className="flex gap-2">
            <input
              value={catInput}
              onChange={(e) => setCatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
              placeholder="例如：蘋果"
              className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button onClick={addCategory} className="px-4 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
              新增
            </button>
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {categories.map((c) => (
                <span key={c} className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 ${chipClass(c)}`}>
                  {c}
                  <button onClick={() => removeCategory(c)}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
        </Field>

        <Field label="日期">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <span className="text-gray-300">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
        </Field>

        <Field label="備註">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="其他提醒事項"
            rows={2}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </Field>
      </div>

      <div className="px-6 pb-6 pt-2">
        <button
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className="w-full bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-full py-3 font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          儲存任務
        </button>
      </div>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      {children}
    </div>
  );
}
