"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, X, LogIn, MessageCircle, AlertTriangle } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import LoadingBubble from "@/components/LoadingBubble";
import AutoGrowTextarea from "@/components/AutoGrowTextarea";
import DatePickerField from "@/components/DatePickerField";
import TaskGoneIllustration from "@/components/TaskGoneIllustration";
import FadeIn from "@/components/FadeIn";
import { useLineProfile } from "@/lib/useLineProfile";
import { chipClass } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

export default function EditTaskPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile, loading: authLoading, error: authError, login } = useLineProfile();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("tasks").select("*").eq("id", id).single();
      setTask(data || null);
      setLoading(false);
    })();
  }, [id]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="編輯任務" backHref="/my-tasks" />
        <div className="flex-1 flex items-center justify-center">
          <LoadingBubble />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="編輯任務" backHref="/" />
        <div className="flex-1 px-6 py-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
            <MessageCircle size={34} />
          </div>
          <p className="text-gray-500 text-sm text-center mb-8">請先使用 LINE 登入。</p>
          {authError && <p className="text-xs text-rose-500 mb-4">{authError}</p>}
          <button onClick={login} className="w-full bg-emerald-500 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2">
            <LogIn size={18} /> 使用 LINE 登入
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="找不到任務" backHref="/my-tasks" />
        <FadeIn className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <TaskGoneIllustration />
          <p className="font-semibold text-gray-700 mt-4 mb-2">找不到這個任務</p>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            這個任務可能已經被移除，
            <br />
            或連結已經失效。
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-3 font-semibold transition"
          >
            回到首頁
          </button>
        </FadeIn>
      </div>
    );
  }

  if (task.creator_id !== profile.userId) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="編輯任務" backHref="/my-tasks" />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400 px-6 text-center">
          你不是這個任務的建立者，無法編輯。
        </div>
      </div>
    );
  }

  return (
    <EditForm
      task={task}
      accessToken={profile.accessToken}
      onSaved={() => router.push("/my-tasks")}
      onLeave={() => router.push("/my-tasks")}
    />
  );
}

function EditForm({ task, accessToken, onSaved, onLeave }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [categories, setCategories] = useState(task.categories || []);
  const [catInput, setCatInput] = useState("");
  const [startDate, setStartDate] = useState(task.start_date);
  const [endDate, setEndDate] = useState(task.end_date);
  const [maxSignups, setMaxSignups] = useState(task.max_signups != null ? String(task.max_signups) : "");
  const [quantityUnit, setQuantityUnit] = useState(task.quantity_unit || "");
  const [note, setNote] = useState(task.note || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const original = useRef({
    title: task.title,
    description: task.description || "",
    categories: task.categories || [],
    start_date: task.start_date,
    end_date: task.end_date,
    note: task.note || "",
    max_signups: task.max_signups != null ? String(task.max_signups) : "",
    quantity_unit: task.quantity_unit || "",
  });

  const dirty =
    title !== original.current.title ||
    description !== original.current.description ||
    JSON.stringify(categories) !== JSON.stringify(original.current.categories) ||
    startDate !== original.current.start_date ||
    endDate !== original.current.end_date ||
    maxSignups !== original.current.max_signups ||
    quantityUnit !== original.current.quantity_unit ||
    note !== original.current.note;

  // Warn on actual browser/tab close or refresh while there are unsaved changes.
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  // Intercept the browser/system back gesture (swipe back, back button) while
  // there are unsaved changes, and show our own confirm dialog instead of
  // silently navigating away.
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
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
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
      onSaved();
    } catch (e) {
      setError(e.message || "更新失敗");
    }
    setSaving(false);
  }

  return (
    <div className="flex-1 flex flex-col relative min-w-0">
      <TopBar title="編輯任務" onBack={handleBackClick} />
      <div className="flex-1 px-6 py-5 flex flex-col gap-5 overflow-y-auto">
        {error && <p className="text-xs text-rose-500">{error}</p>}
        <Field label="任務標題">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </Field>
        <Field label="簡介">
          <AutoGrowTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minRows={2}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </Field>
        <Field label="分類（自訂，選填）">
          <div className="flex gap-2">
            <input
              value={catInput}
              onChange={(e) => setCatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
              placeholder="例如：職位分類、組別分類、產品分類"
              className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button onClick={addCategory} className="px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition shrink-0">新增</button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5 px-0.5">輸入文字後，按「新增」或按 Enter 加入一個分類</p>
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
            <DatePickerField
              value={startDate}
              onChange={setStartDate}
              className="flex-1 border border-gray-200 rounded-2xl px-3 py-2.5 text-sm"
            />
            <span className="text-gray-300">~</span>
            <DatePickerField
              value={endDate}
              onChange={setEndDate}
              className="flex-1 border border-gray-200 rounded-2xl px-3 py-2.5 text-sm"
            />
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
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </Field>
        <Field label="數量單位（選填，例如：份、斤、個——填了報名的人才會看到數量欄位）">
          <input
            value={quantityUnit}
            onChange={(e) => setQuantityUnit(e.target.value)}
            placeholder="例如：份"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </Field>
        <Field label="備註">
          <AutoGrowTextarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            minRows={3}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
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
          儲存變更
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
            <p className="font-semibold text-gray-800 text-base mb-1">尚未儲存變更</p>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              離開後，這次修改的內容不會被儲存，確定要離開嗎？
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                繼續編輯
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

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      {children}
    </div>
  );
}
