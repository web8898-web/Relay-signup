"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, X, LogIn, MessageCircle, AlertTriangle } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import OrganizerTabs from "@/components/OrganizerTabs";
import LoadingBubble from "@/components/LoadingBubble";
import AutoGrowTextarea from "@/components/AutoGrowTextarea";
import DatePickerField from "@/components/DatePickerField";
import { useLineProfile } from "@/lib/useLineProfile";
import { avatarClass, chipClass, todayStr } from "@/lib/utils";

const fieldClass =
  "w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white";

export default function CreateTaskPage() {
  const router = useRouter();
  const { profile, loading, error, login } = useLineProfile();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="建立任務" backHref="/" />
        <div className="flex-1 flex items-center justify-center">
          <LoadingBubble />
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
    <TaskForm
      profile={profile}
      accessToken={profile.accessToken}
      onCreated={(id) => router.push(`/create/share/${id}`)}
      onLeave={() => router.push("/")}
    />
  );
}

function TaskForm({ profile, accessToken, onCreated, onLeave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [catInput, setCatInput] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [maxSignups, setMaxSignups] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const titleRef = useRef(null);

  const defaults = useRef({ start_date: todayStr(), end_date: todayStr() });

  const titleMissing = titleTouched && !title.trim();

  const dirty =
    title.trim() !== "" ||
    description.trim() !== "" ||
    categories.length > 0 ||
    note.trim() !== "" ||
    startDate !== defaults.current.start_date ||
    endDate !== defaults.current.end_date;

  // Warn on actual browser/tab close or refresh while there's unsaved input.
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  // Intercept the browser/system back gesture while there's unsaved input.
  useEffect(() => {
    if (!dirty) return;
    window.history.pushState(null, "", window.location.href);
    function handlePopState() {
      window.history.pushState(null, "", window.location.href);
      setShowLeaveConfirm(true);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [dirty]);

  function handleBackClick() {
    if (dirty) setShowLeaveConfirm(true);
    else onLeave();
  }

  function addCategory() {
    const v = catInput.trim();
    if (v && !categories.includes(v)) setCategories([...categories, v]);
    setCatInput("");
  }
  function removeCategory(c) {
    setCategories(categories.filter((x) => x !== c));
  }

  async function handleSave() {
    if (!title.trim()) {
      setTitleTouched(true);
      titleRef.current?.focus();
      return;
    }
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
          max_signups: maxSignups,
          quantity_unit: quantityUnit,
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
    <div className="flex-1 flex flex-col relative min-w-0">
      <TopBar
        title="建立任務"
        onBack={handleBackClick}
        right={
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full pl-1 pr-2.5 py-1">
            <div className={`w-5 h-5 rounded-full ${avatarClass(profile.displayName)} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
              {profile.displayName?.[0] || "?"}
            </div>
            <span className="text-xs text-white/90 font-medium max-w-[80px] truncate">{profile.displayName}</span>
          </div>
        }
      />
      <OrganizerTabs current="new" />

      <div className="flex-1 px-6 py-4 flex flex-col gap-5 overflow-y-auto">
        {error && <p className="text-xs text-rose-500">{error}</p>}
        <Field label="任務標題" required error={titleMissing ? "請填寫任務標題" : ""}>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleTouched) setTitleTouched(false);
            }}
            onBlur={() => setTitleTouched(true)}
            placeholder="例如：週日爬山健行、週五團購水果"
            className={`${fieldClass} ${titleMissing ? "ring-2 ring-rose-300 bg-rose-50/60 focus:ring-rose-400" : ""}`}
          />
        </Field>

        <Field label="簡介">
          <AutoGrowTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="簡單說明這個任務在做什麼"
            minRows={2}
            className={fieldClass}
          />
        </Field>

        <Field label="分類（自訂，選填）">
          <div className="flex gap-2">
            <input
              value={catInput}
              onChange={(e) => setCatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
              placeholder="例如：領隊、美食組、開車"
              className={`flex-1 ${fieldClass} py-2.5`}
            />
            <button
              onClick={addCategory}
              className="px-4 rounded-2xl bg-white border border-emerald-200 text-emerald-600 text-sm font-medium hover:bg-emerald-50 transition"
            >
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
            <DatePickerField value={startDate} onChange={setStartDate} className={`flex-1 ${fieldClass} py-2.5`} />
            <span className="text-gray-300">~</span>
            <DatePickerField value={endDate} onChange={setEndDate} className={`flex-1 ${fieldClass} py-2.5`} />
          </div>
        </Field>

        <Field label="報名人數上限（選填，不填代表不限人數）">
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={maxSignups}
            onChange={(e) => setMaxSignups(e.target.value)}
            placeholder="例如：20"
            className={fieldClass}
          />
        </Field>

        <Field label="數量單位（選填，例如：份、斤、個——填了報名的人才會看到數量欄位）">
          <input
            value={quantityUnit}
            onChange={(e) => setQuantityUnit(e.target.value)}
            placeholder="例如：份"
            className={fieldClass}
          />
        </Field>

        <Field label="備註">
          <AutoGrowTextarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="其他提醒事項"
            minRows={3}
            className={fieldClass}
          />
        </Field>
      </div>

      <div className="px-6 pb-6 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-500 disabled:opacity-60 text-white rounded-full py-3 font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2 transition"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          儲存任務
        </button>
      </div>

      {showLeaveConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setShowLeaveConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
              <AlertTriangle size={20} />
            </div>
            <p className="font-semibold text-gray-800 text-base mb-1">尚未儲存這個任務</p>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              離開後，目前填寫的內容不會被儲存，確定要離開嗎？
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                繼續填寫
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirm(false);
                  onLeave();
                }}
                className="flex-1 py-2.5 rounded-full bg-rose-500 text-white text-sm font-medium hover:bg-rose-600"
              >
                不儲存離開
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, required, error }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium mb-1.5">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </p>
      {children}
      {error && <p className="text-xs text-rose-500 mt-1.5">{error}</p>}
    </div>
  );
}
